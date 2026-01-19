import express from "express";
import type { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model.ts";
import Stores from "../../models/stores.model.ts";
import Orders from "../../models/order.model.ts";

export const GetOrderByReference = async (req: Request, res: Response) => {
    const { reference } = req.params;
    const userId = (req as any).user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const order = await Orders.findOne({ payment_reference: reference, user_id: userId })
            .populate("items.product_id")
            .populate("items.store_id")
            .lean();

        if (!order) {
            return res.status(404).json({ message: "Order not found yet" });
        }

        return res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        console.error("GetOrderByReference Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const GetVendorOrders = async (req: Request, res: Response) => {
  // Get vendorId from query parameter or authenticated user
  const vendorId = req.query.vendorId || (req as any).user?._id;

  if (!vendorId) {
    return res.status(400).json({
      message: "Vendor ID is required",
    });
  }

  try {
    // Debug: Log the vendorId being searched
    console.log("Searching for orders with vendorId:", vendorId);
    console.log("VendorId type:", typeof vendorId);

    // If vendorId comes from query (admin/specific store view), use it directly.
    // If it comes from req.user (logged in vendor), we must find their stores first.
    let storeIds: any[] = [];

    if (req.query.vendorId) {
        // Explicit store ID passed
        storeIds = [req.query.vendorId];
    } else {
        // Find stores owned by this user
        const userStores = await Stores.find({ owner: vendorId }).select('_id');
        storeIds = userStores.map(s => s._id);
    }

    // Search VendorOrders by vendor_id (which is actually Store ID)
    // MANDATORY: Vendors only see successful (paid) orders.
    const orders = await VendorOrders.find({ 
        vendor_id: { $in: storeIds },
        status: { $nin: ["pending_payment", "failed"] } 
    })
      .populate("customer_id", "firstname lastname email phone delivery_location matric_number")
      .populate({
          path: "items.product_id",
          select: "title img price store",
          populate: { 
              path: "store", 
              select: "name owner",
              populate: { path: "owner", select: "phone" } 
          }
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${orders.length} orders for vendor ${vendorId}`);

    return res.status(200).json({
      message: "Request Successful",
      data: orders,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error ${err}`,
    });
  }
};

export const GetOrderById = async (req: Request, res: Response) => {
  const { _id: orderId } = req.params;
  const userId = (req as any).user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // 1. Try to find the order by ID
    const order = await VendorOrders.findById(orderId)
      .populate("customer_id", "firstname lastname email phone delivery_location matric_number")
      .populate({
          path: "items.product_id",
          select: "title img price store",
          populate: { 
              path: "store", 
              select: "name owner",
              populate: { path: "owner", select: "phone" } 
          }
      })
      .populate({
          path: "vendor_id",
          populate: { path: "owner", select: "phone" }
      })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Check Permissions
    const orderData = order as any;
    const isCustomer = orderData.customer_id?._id?.toString() === userId.toString() || orderData.customer_id?.toString() === userId.toString();
    
    // Check if user owns the store (vendor)
    const store = orderData.vendor_id as any; 
    const isVendor = store?.owner?.toString() === userId.toString();

    if (!isCustomer && !isVendor) {
       // Check if we need to fetch stores to confirm vendor ownership
       const ownedStore = await Stores.findOne({ _id: orderData.vendor_id, owner: userId });
       if (!ownedStore) {
           return res.status(403).json({ message: "Forbidden: You do not have permission to view this order" });
       }
    }

    return res.status(200).json({
      message: "Request Successful",
      data: order,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error ${err}`,
    });
  }
};

export const GetCustomerOrders = async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    // Customers see both paid and pending_payment orders
    const orders = await VendorOrders.find({ customer_id: userId })
      .populate("customer_id", "firstname lastname email phone delivery_location matric_number")
      .populate({
        path: "items.product_id",
        select: "title img price store",
        populate: { 
            path: "store", 
            select: "name owner",
            populate: { path: "owner", select: "phone" }
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Request Successful",
      data: orders,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error ${err}`,
    });
  }
};

/**
 * Allows customers to delete their own unpaid orders.
 * This unlocks the cart implicitly by removing the blocked commitment.
 */
export const DeleteOrder = async (req: Request, res: Response) => {
    const { _id: orderId } = req.params;
    const userId = (req as any).user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Find order in VendorOrders first (since that's what the UI uses)
        const vOrder = await VendorOrders.findById(orderId);
        if (!vOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Security: Must be owner
        if (vOrder.customer_id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Safety: Can ONLY delete unpaid orders
        if (vOrder.status !== "pending_payment" && vOrder.status !== "failed" && vOrder.status !== "pending") {
            return res.status(400).json({ message: "Only unpaid orders can be deleted" });
        }

        // Execute deletions
        const parentId = vOrder.order_id;
        await VendorOrders.deleteMany({ order_id: parentId }); // Delete siblings too
        await Orders.deleteOne({ _id: parentId }); // Delete parent

        return res.status(200).json({
            success: true,
            message: "Unpaid order and associated commitments deleted successfully"
        });

    } catch (err) {
        console.error("DeleteOrder Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
