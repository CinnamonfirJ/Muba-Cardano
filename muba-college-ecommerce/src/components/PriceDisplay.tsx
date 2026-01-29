"use client";

import { SERVICE_FEE_AMOUNT, SERVICE_FEE_THRESHOLD, getDisplayPrice } from "@/utils/paymentSplit.util";

interface PriceDisplayProps {
    vendorPrice: number;
    showFeeBreakdown?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Consistent price display component that shows customer prices.
 * Automatically calculates and displays service fee when applicable.
 * 
 * @param vendorPrice - The vendor's set price
 * @param showFeeBreakdown - Whether to show "(incl. ₦100 service fee)" text
 * @param size - Text size: sm, md, or lg
 * @param className - Additional CSS classes
 */
export const PriceDisplay = ({
    vendorPrice,
    showFeeBreakdown = false,
    size = "md",
    className = "",
}: PriceDisplayProps) => {
    const serviceFeeApplies = vendorPrice >= SERVICE_FEE_THRESHOLD;
    const displayPrice = getDisplayPrice(vendorPrice);

    const sizeClasses = {
        sm: "text-sm",
        md: "text-base sm:text-lg",
        lg: "text-2xl lg:text-3xl",
    };

    if (showFeeBreakdown && serviceFeeApplies) {
        return (
            <div className={`flex flex-col ${className}`}>
                <span className={`font-bold text-[#3bb85e] ${sizeClasses[size]}`}>
                    ₦{displayPrice.toLocaleString()}
                </span>
                <span className="text-gray-400 text-[10px]">
                    (₦{vendorPrice.toLocaleString()} + ₦{SERVICE_FEE_AMOUNT} fee)
                </span>
            </div>
        );
    }

    return (
        <span className={`font-bold text-[#3bb85e] ${sizeClasses[size]} ${className}`}>
            ₦{displayPrice.toLocaleString()}
        </span>
    );
};

export default PriceDisplay;
