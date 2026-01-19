/**
 * Shared Platform Fee Logic
 * Rules:
 * - Orders < ₦1,000: 2.5% fee
 * - Orders >= ₦1,000: 2.5% fee + ₦100 flat fee
 */

export interface SplitResult {
    subtotal: number;
    platform_fee: number;
    vendor_amount: number;
    total_amount: number;
}

export const calculateSplit = (subtotal: number): SplitResult => {
    let platform_fee = 0;
    
    if (subtotal < 1000) {
        platform_fee = Math.round(subtotal * 0.025);
    } else {
        platform_fee = Math.round((subtotal * 0.025) + 100);
    }

    const vendor_amount = subtotal - platform_fee;

    return {
        subtotal,
        platform_fee,
        vendor_amount,
        total_amount: subtotal // Customer pays the item total
    };
};
