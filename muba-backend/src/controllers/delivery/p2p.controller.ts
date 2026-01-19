import express from "express";
import type { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model.ts";
import Orders from "../../models/order.model.ts";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts";
import * as PayoutService from "../../services/payout.service.ts";
import { ORDER_STATUSES } from "../../utils/orderStatus.util.ts";
import { CardanoService } from "../../services/cardano.service.ts";

/**
 * Confirm Peer-to-Peer Delivery
 * Only the BUYER can trigger this.
 */
export const ConfirmP2PDelivery = async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // 1. Find Order
        const vendorOrder = await VendorOrders.findById(orderId);
        if (!vendorOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 2. Verify User is the Buyer
        if (vendorOrder.customer_id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Forbidden: Only the buyer can confirm delivery." });
        }

        // 3. Verify Order State
        const allowedStatuses = [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.ORDER_CONFIRMED, ORDER_STATUSES.DISPATCHED];
        
        if (!allowedStatuses.includes(vendorOrder.status)) {
             return res.status(400).json({ 
                 message: `Cannot confirm delivery. Current status: ${vendorOrder.status}. Vendor must mark as shipped/processing first.` 
             });
        }

        if (vendorOrder.status === ORDER_STATUSES.DELIVERED) {
            return res.status(400).json({ message: "Order already delivered." });
        }

        // 4. Update Status to Delivered
        const timestamp = Date.now();
        
        const metadata = CardanoService.createDeliveryMetadata(
            vendorOrder.order_id.toString(), 
            vendorOrder.customer_id.toString(), 
            timestamp, 
            vendorOrder.vendor_id.toString() 
        );
        
        let proof = { txHash: "P2P-CONFIRMATION" }; 
        try {
            proof = await CardanoService.submitProof(metadata);
        } catch (e) {
            console.warn("Cardano Proof failed for P2P:", e);
        }
        
        vendorOrder.status = ORDER_STATUSES.DELIVERED;
        await vendorOrder.save();

        // 5. Sync to Parent Order
        if (vendorOrder.order_id) {
            const storeId = vendorOrder.vendor_id?._id || vendorOrder.vendor_id;
            await Orders.updateOne(
                { _id: vendorOrder.order_id },
                { $set: { "items.$[elem].status": ORDER_STATUSES.DELIVERED } },
                { arrayFilters: [{ "elem.store_id": storeId }] }
            );
        }

        // 6. Update Vendor Stats
        const store = await Stores.findById(vendorOrder.vendor_id);
        if (store && store.owner) {
             await Users.findByIdAndUpdate(store.owner, { $inc: { successful_deliveries: 1 } });
        }

        // 7. Settlement handled automatically via Paystack Split Payments.
        // Manual payout logic removed.

        return res.status(200).json({
            success: true,
            message: "Delivery confirmed successfully",
            data: { status: ORDER_STATUSES.DELIVERED, txHash: proof.txHash }
        });

    } catch (err) {
        console.error("P2P Confirm Error:", err);
        return res.status(500).json({ message: `Server Error: ${err}` });
    }
};
