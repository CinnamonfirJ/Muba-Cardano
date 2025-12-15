import { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model";
import Products from "../../models/products.model";

export const UpdateVendorOrder = async (req: Request, res: Response) => {
  const { _id: orderId } = req.params;
  const vendorId = req.query.vendorId || (req as any).user?._id;
  const { status, delivery_option, delivery_fee, rider_info } = req.body;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    const updateData: any = {};
    if (status) updateData.status = status;
    if (delivery_option) updateData.delivery_option = delivery_option;
    if (delivery_fee !== undefined) updateData.delivery_fee = delivery_fee;
    if (rider_info) updateData.rider_info = rider_info;

    // Check if we are cancelling or refunding to restore stock
    if (status === "cancelled" || status === "refunded") {
        const existingOrder = await VendorOrders.findOne({ _id: orderId, vendor_id: vendorId });
        
        // Only restore if it wasn't already cancelled/refunded
        if (existingOrder && existingOrder.status !== "cancelled" && existingOrder.status !== "refunded") {
             // Restore stock
             const restorePromises = existingOrder.items.map((item: any) => {
                 return Products.findByIdAndUpdate(item.product_id, {
                     $inc: { stockCount: item.quantity }
                 });
             });
             await Promise.all(restorePromises);
        }
    }

    const updatedOrder = await VendorOrders.findOneAndUpdate(
      {
        _id: orderId,
        vendor_id: vendorId,
      },
      {
        $set: updateData,
      },
      { new: true }
    )
      .populate("customer_id", "firstname email")
      .populate("items.product_id", "title img price")
      .lean();

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found or access denied",
      });
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
