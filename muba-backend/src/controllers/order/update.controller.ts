import { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model";
import Products from "../../models/products.model";
import Orders from "../../models/order.model";
import { 
  isValidTransition 
} from "../../utils/orderStatus.util";



export const UpdateVendorOrder = async (req: Request, res: Response) => {
  const { _id: orderId } = req.params;
  const user = (req as any).user;
  const { status, delivery_option, delivery_fee, rider_info } = req.body;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // First, find the order
    const existingOrder = await VendorOrders.findById(orderId)
      .populate({ path: 'vendor_id', select: 'owner' }); // vendor_id is a Store, get its owner
    
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the store (vendor_id is the Store, check its owner)
    const store = existingOrder.vendor_id as any;
    const storeOwner = store?.owner?.toString() || store?.toString();
    
    if (storeOwner !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: You don't own this store" });
    }

    const updateData: any = {};
    if (status) {
      // Validate status transition
      if (!isValidTransition(existingOrder.status, status)) {
        return res.status(400).json({ 
          message: `Invalid status transition from '${existingOrder.status}' to '${status}'` 
        });
      }
      updateData.status = status;
    }
    if (delivery_option) updateData.delivery_option = delivery_option;
    if (delivery_fee !== undefined) updateData.delivery_fee = delivery_fee;
    if (rider_info) updateData.rider_info = rider_info;

    // Check if we are cancelling or refunding to restore stock
    if (status === "cancelled" || status === "refunded") {
        // Only restore if it wasn't already cancelled/refunded
        if (existingOrder.status !== "cancelled" && existingOrder.status !== "refunded") {
             // Restore stock
             const restorePromises = existingOrder.items.map((item: any) => {
                 return Products.findByIdAndUpdate(item.product_id, {
                     $inc: { stockCount: item.quantity }
                 });
             });
             await Promise.all(restorePromises);
        }
    }

    const updatedOrder = await VendorOrders.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true }
    )
      .populate("customer_id", "firstname lastname email phone delivery_location matric_number")
      .populate("items.product_id", "title img price")
      .lean();

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // SYNC STATUS TO BUYER'S ORDER
    // Update the corresponding items in the parent Order so buyer sees the status change
    if (status && existingOrder.order_id) {
      const storeId = existingOrder.vendor_id?._id || existingOrder.vendor_id;
      
      await Orders.updateOne(
        { _id: existingOrder.order_id },
        { 
          $set: { 
            "items.$[elem].status": status 
          } 
        },
        { 
          arrayFilters: [{ "elem.store_id": storeId }] 
        }
      );
      
      console.log(`Synced status '${status}' to buyer's Order ${existingOrder.order_id} for store ${storeId}`);
    }

    return res.status(200).json({
      message: "Order Updated Successfully",
      data: updatedOrder,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error ${err}`,
    });
  }
};
