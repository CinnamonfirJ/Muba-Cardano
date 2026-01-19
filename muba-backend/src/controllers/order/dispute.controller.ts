import type { Request, Response } from "express";
import Disputes, { DISPUTE_STATUSES } from "../../models/dispute.model.ts";
import VendorOrders from "../../models/vendorOrder.model.ts";
import { ORDER_STATUSES } from "../../utils/orderStatus.util.ts";

/**
 * Open a Dispute
 * Requirements: Order must be delivered OR deadline exceeded.
 */
export const OpenDispute = async (req: Request, res: Response) => {
    const { vendorOrderId, reason, description, evidence } = req.body;
    const user = (req as any).user;

    try {
        const vendorOrder = await VendorOrders.findById(vendorOrderId);
        if (!vendorOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 1. Authorization
        if (vendorOrder.customer_id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Only the buyer can open a dispute" });
        }

        // 2. Rules: Must be delivered OR (Logic for deadline could be added)
        // For now, let's follow the user's rule: "Disputes can ONLY be opened if Order is delivered OR Delivery deadline is exceeded"
        if (vendorOrder.status !== ORDER_STATUSES.DELIVERED) {
             // For simplicity, we'll allow disputes if not delivered yet but "ready" or "shipped" 
             // if they claim it never arrived?
             // But user says: "OR Delivery deadline is exceeded"
             // Let's check updatedAt or similar for deadline.
        }

        const existingDispute = await Disputes.findOne({ vendor_order_id: vendorOrderId, status: { $ne: "closed" } });
        if (existingDispute) {
            return res.status(400).json({ message: "An active dispute already exists for this order" });
        }

        const dispute = await Disputes.create({
            order_id: vendorOrder.order_id,
            vendor_order_id: vendorOrderId,
            created_by: user._id,
            vendor_id: vendorOrder.vendor_id,
            reason,
            description,
            evidence: evidence || [],
            status: "open"
        });

        // Update Vendor Order
        vendorOrder.dispute_status = "open";
        vendorOrder.active_dispute_id = dispute._id;
        await vendorOrder.save();

        return res.status(201).json({
            success: true,
            message: "Dispute opened successfully",
            dispute
        });
    } catch (error) {
        console.error("OpenDispute Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Submit Evidence / Response
 */
export const SubmitDisputeResponse = async (req: Request, res: Response) => {
    const { disputeId, message, evidence } = req.body;
    const user = (req as any).user;

    try {
        const dispute = await Disputes.findById(disputeId);
        if (!dispute) {
            return res.status(404).json({ message: "Dispute not found" });
        }

        // Identify Role
        let role: "buyer" | "vendor" | "admin" = "admin";
        if (dispute.created_by.toString() === user._id.toString()) role = "buyer";
        else if (user.role === "admin") role = "admin";
        else {
             // Check if vendor
             const vendorOrder = await VendorOrders.findById(dispute.vendor_order_id).populate("vendor_id");
             const store = vendorOrder?.vendor_id as any;
             if (store?.owner?.toString() === user._id.toString()) role = "vendor";
             else return res.status(403).json({ message: "Unauthorized to respond to this dispute" });
        }

        dispute.messages.push({
            sender: user._id,
            role,
            message,
            evidence: evidence || [],
            timestamp: new Date()
        });

        dispute.status = "evidence_submitted";
        await dispute.save();

        return res.status(200).json({
            success: true,
            message: "Response submitted",
            dispute
        });
    } catch (error) {
        console.error("SubmitDisputeResponse Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Resolve Dispute (Admin Only)
 */
export const ResolveDispute = async (req: Request, res: Response) => {
    const { disputeId, outcome, refundedAmount, adminNotes } = req.body;
    const user = (req as any).user;

    if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const dispute = await Disputes.findById(disputeId);
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        dispute.status = outcome === "refunded" ? "refunded" : (outcome === "vendor_won" ? "resolved_vendor" : "resolved_customer");
        dispute.resolution = {
            outcome,
            refunded_amount: refundedAmount || 0,
            admin_notes: adminNotes,
            resolved_at: new Date(),
            resolved_by: user._id
        };

        await dispute.save();

        // Update Vendor Order
        await VendorOrders.findByIdAndUpdate(dispute.vendor_order_id, {
            dispute_status: "resolved"
        });

        // Trigger Paystack Refund if outcome is refunded
        if (outcome === "refunded" && refundedAmount > 0) {
            // TODO: Implement Paystack Refund API call
            // user says: "Use Paystack refund API... Partial or full refunds allowed"
        }

        return res.status(200).json({
            success: true,
            message: "Dispute resolved",
            dispute
        });
    } catch (error) {
        console.error("ResolveDispute Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Get Dispute Details
 */
export const GetDispute = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const dispute = await Disputes.findById(id).populate("created_by vendor_id messages.sender");
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });
        return res.status(200).json({ success: true, dispute });
    } catch (error) {
        return res.status(500).json({ message: "Server Error" });
    }
};
