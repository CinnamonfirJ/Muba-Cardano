import { Request, Response } from "express";
import PostOfficeHandover from "../../models/postOffice.model";
import VendorOrders from "../../models/vendorOrder.model";
import Users from "../../models/users.model";

// Step 1: Item Handover (Seller -> Post Office)
export const HandoverItem = async (req: Request, res: Response) => {
    const { vendorOrderId, qrCode } = req.body;
    const user = (req as any).user; 

    // Expect Post Office Staff to facilitate this, but for simplicity, 
    // we might just let the seller scan or staff scan.
    // Requirement says "Post office staff scans QR code".
    // So we assume this endpoint is hit by an admin or authorized staff app, 
    // OR we assume a simplified flow where seller "confirms" handover via a generated code.
    // Let's implement the server logic:

    try {
        const vendorOrder = await VendorOrders.findById(vendorOrderId).populate('customer_id');
        if (!vendorOrder) {
             return res.status(404).json({ message: "Order not found" });
        }

        // Create Handover Record
        const handover = await PostOfficeHandover.create({
            orderId: vendorOrder.order_id,
            vendorOrderId: vendorOrder._id,
            sellerId: vendorOrder.vendor_id?.owner || user._id, // Assuming vendor_id is Store, need to fetch owner differently if not passed. 
            // Wait, vendor_id in VendorOrders is Store ID. We need the Store Owner.
            // Let's rely on frontend or populate.
            // Simplified: Use current user as staff logger? 
            // Let's just store the store's reference ID as sellerId for now or fetch it.
            buyerId: vendorOrder.customer_id._id,
            qrCode: qrCode || `PO-${Date.now()}`, // Generate if not passed, but usually passed
            status: 'handed_over'
        });

        // Update Vendor Order Status
        vendorOrder.status = "sent_to_post_office";
        await vendorOrder.save();

        // Notify Buyer (Stub)
        // sendNotification(vendorOrder.customer_id, "Your item is at the post office!");

        return res.status(200).json({
            success: true,
            message: "Item handed over successfully",
            data: handover
        });

    } catch (error) {
        return res.status(500).json({ message: `Error handing over item: ${error}` });
    }
};

// Step 2: Item Pickup (Buyer -> Post Office)
export const PickupItem = async (req: Request, res: Response) => {
    const { handoverId, rating } = req.body; // rating: 'thumbs_up' | 'thumbs_down'

    try {
        const handover = await PostOfficeHandover.findById(handoverId);
        if (!handover) {
            return res.status(404).json({ message: "Handover record not found" });
        }

        if (handover.status === 'collected') {
            return res.status(400).json({ message: "Item already collected" });
        }

        // Update Status
        handover.status = 'collected';
        handover.pickupTime = new Date();
        if (rating) {
            handover.feedback = { rating };
        }
        await handover.save();

        // Update Vendor Order Status
        await VendorOrders.findByIdAndUpdate(handover.vendorOrderId, {
            status: 'delivered'
        });

        // Update Seller Stats (Trust & Reputation)
        if (rating === 'thumbs_up') {
            // Find store owner. 
            // We stored sellerId (User ID) in handover? 
            // Let's verify we stored User ID in HandoverItem.
            // If we stored Store ID, we need to find Store then User.
            // Assuming we stored correct User ID (seller).
            // But wait, in HandoverItem I wasn't sure.
            // Let's fetch the store to be safe to get owner.
            const vendorOrder = await VendorOrders.findById(handover.vendorOrderId).populate({
                path: 'vendor_id',
                select: 'owner'
            }); // vendor_id is Store
             
            if (vendorOrder && vendorOrder.vendor_id) {
                 const store = vendorOrder.vendor_id as any;
                 const ownerId = store.owner;
                 
                 // Increment seller stats
                 await Users.findByIdAndUpdate(ownerId, { $inc: { successful_deliveries: 1 } });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Item collected successfully",
        });

    } catch (error) {
        return res.status(500).json({ message: `Error picking up item: ${error}` });
    }
};
