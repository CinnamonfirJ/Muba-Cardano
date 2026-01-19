import express from "express";
import type { Request, Response } from "express";
import PostOfficeHandover from "../../models/postOffice.model.ts";
import VendorOrders from "../../models/vendorOrder.model.ts";
import Users from "../../models/users.model.ts";
import Orders from "../../models/order.model.ts";
import Stores from "../../models/stores.model.ts"; 
import { CardanoService } from "../../services/cardano.service.ts";
import * as PayoutService from "../../services/payout.service.ts"; 
import { nanoid } from "nanoid";
import { ORDER_STATUSES, isPickupOrder } from "../../utils/orderStatus.util.ts";

// Step 1: Item Handover (Seller -> Post Office)
export const HandoverItem = async (req: Request, res: Response) => {
    const { vendorOrderId, orderId, qrCode } = req.body;
    const targetId = vendorOrderId || orderId;

    const user = (req as any).user; 

    if (user.role !== 'post_office' && user.role !== 'post_office_member') {
        return res.status(403).json({ message: "Unauthorized: Only Post Office staff can scan handoffs." });
    }

    if (!targetId) {
        return res.status(400).json({ message: "Order ID is required" });
    }

    try {
        let vendorOrder;
        
        vendorOrder = await VendorOrders.findOne({ 
            $or: [
                { refId: targetId },
                { vendor_qr_code: targetId },
                { client_qr_code: targetId }
            ]
        }).populate('customer_id');
        
        if (!vendorOrder && targetId.match(/^[0-9a-fA-F]{24}$/)) {
            vendorOrder = await VendorOrders.findById(targetId).populate('customer_id');
        }
        
        if (!vendorOrder) {
             return res.status(404).json({ message: "Order not found" });
        }

        let isClientPickup = false;
        if (targetId === vendorOrder.client_qr_code) {
           isClientPickup = true;
        }

        if (qrCode) {
            try {
                const parsed = JSON.parse(qrCode);
                if (parsed.type === "pickup" || parsed.orderId === vendorOrder.client_qr_code) {
                    isClientPickup = true;
                }
            } catch (e) {}
        }

        const timestamp = Date.now();
        const sellerId = vendorOrder.vendor_id?.owner || vendorOrder.vendor_id; 
        
        if (isClientPickup) {
            const metadata = CardanoService.createDeliveryMetadata(
                vendorOrder.order_id.toString(), 
                vendorOrder.customer_id._id.toString(), 
                timestamp, 
                user._id.toString()
            );
            const proof = await CardanoService.submitProof(metadata);

            const handover = await PostOfficeHandover.findOneAndUpdate(
                { vendorOrderId: vendorOrder._id },
                { 
                    status: 'collected',
                    pickupTime: new Date(),
                    deliveryTxHash: proof.txHash
                },
                { new: true }
            );

            const nextStatus = ORDER_STATUSES.DELIVERED;
            vendorOrder.status = nextStatus;
            await vendorOrder.save();

            if (vendorOrder.order_id) {
                const storeId = vendorOrder.vendor_id?._id || vendorOrder.vendor_id;
                await Orders.updateOne(
                    { _id: vendorOrder.order_id },
                    { $set: { "items.$[elem].status": nextStatus } },
                    { arrayFilters: [{ "elem.store_id": storeId }] }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Order picked up and marked as Delivered",
                data: { status: nextStatus, txHash: proof.txHash }
            });

        } else {
            const metadata = CardanoService.createHandoffMetadata(
                vendorOrder.order_id.toString(), 
                sellerId.toString(), 
                timestamp, 
                user._id.toString()
            );
            const proof = await CardanoService.submitProof(metadata);

            const handover = await PostOfficeHandover.findOneAndUpdate(
                { vendorOrderId: vendorOrder._id },
                {
                    orderId: vendorOrder.order_id,
                    vendorOrderId: vendorOrder._id,
                    sellerId: sellerId,
                    buyerId: vendorOrder.customer_id._id,
                    qrCode: qrCode || `PO-${Date.now()}`, 
                    status: 'handed_over',
                    handoffTxHash: proof.txHash,
                    onChainStatus: proof.status === 'confirmed' ? 'confirmed' : 'failed'
                },
                { upsert: true, new: true }
            );

            const nextStatus = ORDER_STATUSES.HANDED_TO_POST_OFFICE;
            vendorOrder.status = nextStatus;
            await vendorOrder.save();
            
            const clientQrCode = vendorOrder.client_qr_code || vendorOrder.refId;

            if (vendorOrder.order_id) {
                const storeId = vendorOrder.vendor_id?._id || vendorOrder.vendor_id;
                await Orders.updateOne(
                    { _id: vendorOrder.order_id },
                    { 
                        $set: { 
                            "items.$[elem].status": nextStatus,
                            "items.$[elem].client_qr_code": clientQrCode,
                            "items.$[elem].vendor_qr_code": vendorOrder.vendor_qr_code
                        } 
                    },
                    { arrayFilters: [{ "elem.store_id": storeId }] }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Item handed over successfully",
                data: { ...handover.toObject(), status: nextStatus }
            });
        }
    } catch (error) {
        return res.status(500).json({ message: `Error handing over item: ${error}` });
    }
};

// Step 2: Item Pickup (Buyer -> Post Office)
export const PickupItem = async (req: Request, res: Response) => {
    const { handoverId, clientQrCode, rating } = req.body; 
    const user = (req as any).user;

    try {
        const handover = await PostOfficeHandover.findById(handoverId);
        if (!handover) return res.status(404).json({ message: "Handover record not found" });

        const vendorOrder = await VendorOrders.findById(handover.vendorOrderId);
        if (!vendorOrder) return res.status(404).json({ message: "Order not found" });

        if (clientQrCode && vendorOrder.client_qr_code !== clientQrCode) {
            try {
                const parsed = JSON.parse(clientQrCode);
                if (parsed.orderId !== vendorOrder.client_qr_code) {
                    return res.status(403).json({ message: "Invalid Pickup QR code." });
                }
            } catch (e) {
                return res.status(403).json({ message: "Invalid QR code format." });
            }
        }

        if (handover.buyerId.toString() !== user._id.toString()) {
             return res.status(403).json({ message: "Unauthorized: You are not the buyer." });
        }

        if (vendorOrder.status !== ORDER_STATUSES.READY_FOR_PICKUP && 
            vendorOrder.status !== ORDER_STATUSES.HANDED_TO_POST_OFFICE) {
            return res.status(400).json({ message: `Order is not available for pickup. Status: ${vendorOrder.status}` });
        }

        if (handover.status === 'collected') {
            return res.status(400).json({ message: "Item already collected" });
        }

        const timestamp = Date.now();
        const metadata = CardanoService.createDeliveryMetadata(
            handover.orderId.toString(), 
            handover.buyerId.toString(), 
            timestamp, 
            user._id.toString()
        );
        const proof = await CardanoService.submitProof(metadata);

        handover.status = 'collected';
        handover.pickupTime = new Date();
        handover.deliveryTxHash = proof.txHash; 
        
        if (rating) handover.feedback = { rating };
        await handover.save();

        vendorOrder.status = ORDER_STATUSES.DELIVERED;
        await vendorOrder.save();

        if (vendorOrder.order_id) {
            const storeId = vendorOrder.vendor_id?._id || vendorOrder.vendor_id;
            await Orders.updateOne(
                { _id: vendorOrder.order_id },
                { $set: { "items.$[elem].status": ORDER_STATUSES.DELIVERED } },
                { arrayFilters: [{ "elem.store_id": storeId }] }
            );
        }

        if (rating === 'thumbs_up') {
             const store = await Stores.findById(vendorOrder.vendor_id);
             if (store) {
                  await Users.findByIdAndUpdate(store.owner, { $inc: { successful_deliveries: 1 } });
             }
        }

        // 7. Settlement handled automatically via Paystack Split Payments.
        // Manual payout logic removed.

        return res.status(200).json({
            success: true,
            message: "Item collected successfully",
            proof: proof
        });

    } catch (error) {
        return res.status(500).json({ message: `Error picking up item: ${error}` });
    }
};
