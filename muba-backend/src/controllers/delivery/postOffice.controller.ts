import { Request, Response } from "express";
import PostOfficeHandover from "../../models/postOffice.model";
import VendorOrders from "../../models/vendorOrder.model";
import Users from "../../models/users.model";
import Orders from "../../models/order.model";
import { CardanoService } from "../../services/cardano.service";
import { nanoid } from "nanoid";
import { ORDER_STATUSES, isPickupOrder } from "../../utils/orderStatus.util";

// Step 1: Item Handover (Seller -> Post Office)
export const HandoverItem = async (req: Request, res: Response) => {
    // Frontend sends 'orderId'. This could be the VendorOrder _id OR a custom shorter ID (like payment_reference).
    const { vendorOrderId, orderId, qrCode } = req.body;
    const targetId = vendorOrderId || orderId;

    console.log("Handover Request:", { targetId, qrCode, user: (req as any).user._id });

    const user = (req as any).user; 

    // Expect Post Office Staff to facilitate this.
    if (user.role !== 'post_office' && user.role !== 'post_office_member') {
        return res.status(403).json({ message: "Unauthorized: Only Post Office staff can scan handoffs." });
    }

    if (!targetId) {
        return res.status(400).json({ message: "Order ID is required" });
    }

    try {
        let vendorOrder;
        
        // 1. PRIORITY: Try finding by refId, vendor_qr_code, or client_qr_code
        vendorOrder = await VendorOrders.findOne({ 
            $or: [
                { refId: targetId },
                { vendor_qr_code: targetId },
                { client_qr_code: targetId }
            ]
        }).populate('customer_id');
        
        // 2. If not found, try finding by _id if it's a valid MongoDB ObjectId
        if (!vendorOrder && targetId.match(/^[0-9a-fA-F]{24}$/)) {
            vendorOrder = await VendorOrders.findById(targetId).populate('customer_id');
        }
        
        // 3. If still not found, try matching by _id SUFFIX (last 8 chars pattern like "CB9D33F2")
        //    This handles the case where the frontend shows order._id.substring(0, 8) or slice(-8)
        if (!vendorOrder && targetId.match(/^[0-9a-fA-F]{6,8}$/i)) {
            console.log("Searching by _id suffix pattern...", targetId);
            // Find order where _id ends with targetId (case insensitive)
            const allOrders = await VendorOrders.find().select('_id').lean();
            const matchingOrder = allOrders.find((o: any) => 
                o._id.toString().toLowerCase().endsWith(targetId.toLowerCase()) ||
                o._id.toString().toLowerCase().startsWith(targetId.toLowerCase())
            );
            if (matchingOrder) {
                vendorOrder = await VendorOrders.findById(matchingOrder._id).populate('customer_id');
            }
        }

        // 4. If still not found, try searching via payment_reference in Orders
        if (!vendorOrder) {
             console.log("Searching by Payment Reference...");
             const Orders = require("../../models/order.model").default;
             
             const parentOrder = await Orders.findOne({ 
                 $or: [
                    { payment_reference: targetId },
                    { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null }
                 ]
             });

             if (parentOrder) {
                 vendorOrder = await VendorOrders.findOne({ order_id: parentOrder._id }).populate('customer_id');
             }
        }

        if (!vendorOrder) {
             console.log("Order not found in DB for ID:", targetId);
             return res.status(404).json({ message: "Order not found" });
        }

        // Detect which QR code was used to determine the action
        let isClientPickup = false;
        
        // Simple string comparison
        if (targetId === vendorOrder.client_qr_code) {
           isClientPickup = true;
        }

        // JSON payload check (from OrderQR component)
        if (qrCode) {
            try {
                const parsed = JSON.parse(qrCode);
                if (parsed.type === "pickup" || parsed.orderId === vendorOrder.client_qr_code) {
                    isClientPickup = true;
                }
            } catch (e) {}
        }

        // --- Security Validation ---
        if (isClientPickup) {
            if (qrCode) {
                try {
                    const parsed = JSON.parse(qrCode);
                    if (parsed.orderId !== vendorOrder.client_qr_code) {
                        return res.status(403).json({ message: "Invalid Client QR code for this pickup." });
                    }
                } catch (e) {
                    if (qrCode !== vendorOrder.client_qr_code) {
                        return res.status(403).json({ message: "Invalid Client QR code." });
                    }
                }
            }
        } else {
             // Validate Vendor QR Code for Handoff
             if (qrCode && vendorOrder.vendor_qr_code && qrCode !== vendorOrder.vendor_qr_code) {
                 try {
                    const parsed = JSON.parse(qrCode);
                    if (parsed.orderId !== vendorOrder.vendor_qr_code) {
                        return res.status(403).json({ message: "Invalid Vendor QR code for this handoff." });
                    }
                 } catch (e) {
                    if (qrCode !== vendorOrder.vendor_qr_code) {
                        return res.status(403).json({ message: "Invalid Vendor QR code." });
                    }
                 }
             }
        }

        const timestamp = Date.now();
        const sellerId = vendorOrder.vendor_id?.owner || vendorOrder.vendor_id; 
        
        if (isClientPickup) {
            // --- PROCESS PICKUP (DELIVERY) ---
            
            // --- CARDANO DELIVERY PROOF ---
            const metadata = CardanoService.createDeliveryMetadata(
                vendorOrder.order_id.toString(), 
                vendorOrder.customer_id._id.toString(), 
                timestamp, 
                user._id.toString()
            );
            const proof = await CardanoService.submitProof(metadata);
            // ------------------------------

            // Find and update Handover record
            const handover = await PostOfficeHandover.findOneAndUpdate(
                { vendorOrderId: vendorOrder._id },
                { 
                    status: 'collected',
                    pickupTime: new Date(),
                    deliveryTxHash: proof.txHash
                },
                { new: true }
            );

            // Update Statuses
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
                data: { status: nextStatus, txHash: proof.txHash },
                proof: proof
            });

        } else {
            // --- PROCESS VENDOR HANDOFF ---
            
            // --- CARDANO HANDOFF PROOF ---
            const metadata = CardanoService.createHandoffMetadata(
                vendorOrder.order_id.toString(), 
                sellerId.toString(), 
                timestamp, 
                user._id.toString()
            );
            const proof = await CardanoService.submitProof(metadata);
            // -----------------------------

            // Create or update Handover Record
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

            // Update Statuses
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
                data: { ...handover.toObject(), status: nextStatus },
                proof: proof
            });
        }
    } catch (error) {
        console.error("Handover Error:", error);
        return res.status(500).json({ message: `Error handing over item: ${error}` });
    }
};

// Step 2: Item Pickup (Buyer -> Post Office)
export const PickupItem = async (req: Request, res: Response) => {
    const { handoverId, clientQrCode, rating } = req.body; 
    const user = (req as any).user;

    // The student scans the QR code to collect their package
    // We need to verify:
    // 1. The QR code matches the one generated for this order
    // 2. The user is the actual buyer
    // 3. The order status is ready_for_pickup
    
    try {
        const handover = await PostOfficeHandover.findById(handoverId);
        if (!handover) {
            return res.status(404).json({ message: "Handover record not found" });
        }

        // Get the vendor order to verify QR code
        const vendorOrder = await VendorOrders.findById(handover.vendorOrderId);
        if (!vendorOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify client QR code
        if (clientQrCode && vendorOrder.client_qr_code !== clientQrCode) {
            // Check if it's a JSON string from our OrderQR component
            try {
                const parsed = JSON.parse(clientQrCode);
                if (parsed.orderId + "-C" !== vendorOrder.client_qr_code && parsed.orderId !== vendorOrder.client_qr_code) {
                    return res.status(403).json({ 
                        message: "Invalid Pickup QR code. This package does not belong to you." 
                    });
                }
            } catch (e) {
                return res.status(403).json({ 
                    message: "Invalid QR code format." 
                });
            }
        }

        // Verify User is the Buyer
        if (handover.buyerId.toString() !== user._id.toString()) {
             return res.status(403).json({ message: "Unauthorized: You are not the buyer of this order." });
        }

        // Check if order is ready for pickup or at post office
        if (vendorOrder.status !== ORDER_STATUSES.READY_FOR_PICKUP && 
            vendorOrder.status !== ORDER_STATUSES.HANDED_TO_POST_OFFICE) {
            return res.status(400).json({ 
                message: `Order is not available for pickup. Current status: ${vendorOrder.status}` 
            });
        }

        if (handover.status === 'collected') {
            return res.status(400).json({ message: "Item already collected" });
        }

        // --- CARDANO DELIVERY PROOF ---
        const timestamp = Date.now();
        const metadata = CardanoService.createDeliveryMetadata(
            handover.orderId.toString(), 
            handover.buyerId.toString(), 
            timestamp, 
            user._id.toString()
        );
        const proof = await CardanoService.submitProof(metadata);
        // ------------------------------

        // Update Status
        handover.status = 'collected';
        handover.pickupTime = new Date();
        handover.deliveryTxHash = proof.txHash; // Save delivery proof
        
        if (rating) {
            handover.feedback = { rating };
        }
        await handover.save();

        // Update Vendor Order Status
        vendorOrder.status = ORDER_STATUSES.DELIVERED;
        await vendorOrder.save();

        // SYNC TO BUYER'S ORDER - Mark items as "delivered"
        if (vendorOrder && vendorOrder.order_id) {
            const storeId = vendorOrder.vendor_id?._id || vendorOrder.vendor_id;
            await Orders.updateOne(
                { _id: vendorOrder.order_id },
                { $set: { "items.$[elem].status": ORDER_STATUSES.DELIVERED } },
                { arrayFilters: [{ "elem.store_id": storeId }] }
            );
            console.log(`Synced status '${ORDER_STATUSES.DELIVERED}' to buyer's Order ${vendorOrder.order_id}`);
        }

        // Update Seller Stats (Trust & Reputation)
        if (rating === 'thumbs_up') {
            const vendorOrder = await VendorOrders.findById(handover.vendorOrderId).populate({
                path: 'vendor_id',
                select: 'owner'
            }); 
             
            if (vendorOrder && vendorOrder.vendor_id) {
                 const store = vendorOrder.vendor_id as any;
                 const ownerId = store.owner;
                 
                 await Users.findByIdAndUpdate(ownerId, { $inc: { successful_deliveries: 1 } });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Item collected successfully",
            proof: proof
        });

    } catch (error) {
        return res.status(500).json({ message: `Error picking up item: ${error}` });
    }
};
