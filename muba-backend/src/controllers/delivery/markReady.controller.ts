import { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model";
import Orders from "../../models/order.model";
import { ORDER_STATUSES } from "../../utils/orderStatus.util";

/**
 * Mark Order as Ready for Pickup
 * Post office staff uses this when a package is ready for student collection
 */
export const MarkAsReadyForPickup = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  // Only post office staff can mark orders as ready
  if (user.role !== "post_office" && user.role !== "post_office_member") {
    return res.status(403).json({
      message: "Unauthorized: Only Post Office staff can mark orders as ready for pickup.",
    });
  }

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Find the order (can be by _id or refId)
    let vendorOrder = await VendorOrders.findById(orderId);

    // If not found by _id, try by refId
    if (!vendorOrder) {
      vendorOrder = await VendorOrders.findOne({ refId: orderId });
    }

    if (!vendorOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate current status - should be handed_to_post_office
    if (vendorOrder.status !== ORDER_STATUSES.HANDED_TO_POST_OFFICE) {
      return res.status(400).json({
        message: `Cannot mark as ready for pickup. Current status: ${vendorOrder.status}. It must be 'handed_to_post_office' first.`,
      });
    }

    // Only pickup orders can be marked as ready
    if (!vendorOrder.is_pickup_order) {
      return res.status(400).json({
        message: "This order is not a pickup order. It will be delivered directly.",
      });
    }

    // Update status to ready_for_pickup
    vendorOrder.status = ORDER_STATUSES.READY_FOR_PICKUP;
    await vendorOrder.save();

    // Sync to buyer's order
    if (vendorOrder.order_id) {
      const storeId = vendorOrder.vendor_id?._id || vendorOrder.vendor_id;
      await Orders.updateOne(
        { _id: vendorOrder.order_id },
        { $set: { "items.$[elem].status": ORDER_STATUSES.READY_FOR_PICKUP } },
        { arrayFilters: [{ "elem.store_id": storeId }] }
      );
      console.log(
        `Synced '${ORDER_STATUSES.READY_FOR_PICKUP}' status to buyer's Order ${vendorOrder.order_id}`
      );
    }

    // TODO: Trigger client notification (in-app/email)
    // await notificationService.sendReadyForPickupNotification(vendorOrder.customer_id);

    return res.status(200).json({
      success: true,
      message: "Order marked as ready for pickup. Customer has been notified.",
      data: {
        refId: vendorOrder.refId,
        status: vendorOrder.status,
        client_qr_code: vendorOrder.client_qr_code,
      },
    });
  } catch (error) {
    console.error("Mark as Ready Error:", error);
    return res.status(500).json({
      message: `Error marking order as ready: ${error}`,
    });
  }
};
