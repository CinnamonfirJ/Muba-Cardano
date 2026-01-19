"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import orderService from "@/services/orderService";

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorOrderId: string;
    onSuccess: () => void;
}

export default function DisputeModal({ isOpen, onClose, vendorOrderId, onSuccess }: DisputeModalProps) {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason || !description) {
            toast.error("Please provide a reason and description");
            return;
        }

        setIsSubmitting(true);
        try {
            await orderService.openDispute({
                vendorOrderId,
                reason,
                description,
            });
            toast.success("Dispute opened successfully. Our team will review it.");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to open dispute");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <ShieldAlert className="w-12 h-12 text-red-500 mb-2 mx-auto" />
                    <DialogTitle className="text-center text-2xl font-bold font-mona">Report an Issue</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">What's the problem?</Label>
                        <Select onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="item_missing">Item is missing / Never arrived</SelectItem>
                                <SelectItem value="item_damaged">Item is damaged</SelectItem>
                                <SelectItem value="wrong_item">Wrong item received</SelectItem>
                                <SelectItem value="fake_item">Item is fake / counterfeit</SelectItem>
                                <SelectItem value="delivery_delayed">Delivery significantly delayed</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Describe the issue in detail</Label>
                        <Textarea 
                            id="description" 
                            placeholder="Please provide as much detail as possible. This helps us resolve it faster."
                            className="h-32 rounded-xl"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 font-bold"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Dispute"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
