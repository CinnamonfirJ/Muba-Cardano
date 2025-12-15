import { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model";
import Stores from "../../models/stores.model";

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
        // We need to import Stores model.
        // Assuming Stores model is needed here.
        const userStores = await Stores.find({ owner: vendorId }).select('_id');
        storeIds = userStores.map(s => s._id);
    }

    // Search VendorOrders by vendor_id (which is actually Store ID)
    const orders = await VendorOrders.find({ vendor_id: { $in: storeIds } })
      .populate("customer_id", "firstname email")
      .populate("items.product_id", "title img price")
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
      .populate("customer_id", "firstname email")
      .populate("items.product_id", "title img price")
      .populate("vendor_id") // Populate vendor/store to check ownership
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Check Permissions
    const orderData = order as any;
    const isCustomer = orderData.customer_id?._id?.toString() === userId.toString() || orderData.customer_id?.toString() === userId.toString();
    
    // Check if user owns the store (vendor)
    // We assume populate('vendor_id') returns the Store object which has an 'owner' field.
    // If populating fails or schema differs, fallback to database check.
    const store = orderData.vendor_id as any; 
    const isVendor = store?.owner?.toString() === userId.toString();

    // If we didn't populate vendor fully or need more robust check:
    // const userStores = await Stores.find({ owner: userId }).distinct('_id');
    // const isVendor = userStores.some(id => id.toString() === order.vendor_id.toString());

    if (!isCustomer && !isVendor) {
       // Check if we need to fetch stores to confirm vendor ownership (if populating above wasn't sufficient)
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
    const orders = await VendorOrders.find({ customer_id: userId })
      .populate({
        path: "items.product_id",
        select: "title img price store",
        populate: { path: "store", select: "name" }
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
