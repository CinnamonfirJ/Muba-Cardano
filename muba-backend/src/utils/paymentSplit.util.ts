/**
 * Payment Split Utility - Vendor Fees
 * 
 * VENDOR FEES (What vendors pay from their revenue - NOT visible to customers):
 * - Orders >= ₦1,000: Platform takes 2.5% + ₦100
 * - Orders < ₦1,000: Platform takes 2.5% only
 * 
 * These fees are DEDUCTED from the vendor's earnings.
 * 
 * ARCHITECTURE: Uses Paystack Subaccount Charging Model
 * - Each vendor receives payment directly to their subaccount
 * - Platform fee is extracted via `transaction_charge`
 * - NO manual splits or post-payment transfers
 */

export interface SplitResult {
    total_amount: number;
    platform_fee: number;
    vendor_amount: number;
}

export interface VendorFeeResult {
    subtotal: number;      // Vendor's portion of order (Naira)
    fee: number;           // Platform fee for this vendor (Naira)
    vendorAmount: number;  // What vendor receives after fee (Naira)
}

const PLATFORM_PERCENTAGE = 0.025; // 2.5%
const PLATFORM_FLAT_FEE = 100;     // ₦100
const FLAT_FEE_THRESHOLD = 1000;   // ₦1000

/**
 * Calculate platform fee split for an order.
 * 
 * Platform Fee Rules:
 * - Orders >= ₦1,000: 2.5% + ₦100
 * - Orders < ₦1,000: 2.5% only
 * 
 * @param totalAmountNaira - The total order amount in Naira
 */
export const calculateSplit = (totalAmountNaira: number): SplitResult => {
    let platformFee = 0;
    
    if (totalAmountNaira >= FLAT_FEE_THRESHOLD) {
        platformFee = (totalAmountNaira * PLATFORM_PERCENTAGE) + PLATFORM_FLAT_FEE;
    } else {
        platformFee = totalAmountNaira * PLATFORM_PERCENTAGE;
    }

    // NO ROUNDING - exact decimal logic
    // Kobo conversion handles final integer rounding
    
    const vendorAmount = totalAmountNaira - platformFee;

    return {
        total_amount: totalAmountNaira,
        platform_fee: platformFee,
        vendor_amount: vendorAmount > 0 ? vendorAmount : 0,
    };
};

/**
 * Calculate platform fee for a single vendor's subtotal.
 * Used for per-vendor subaccount charging.
 * 
 * @param vendorSubtotal - The vendor's portion of the order (Naira)
 * @returns Fee breakdown for this vendor
 */
export const calculateVendorFee = (vendorSubtotal: number): VendorFeeResult => {
    let fee = 0;
    
    if (vendorSubtotal >= FLAT_FEE_THRESHOLD) {
        fee = (vendorSubtotal * PLATFORM_PERCENTAGE) + PLATFORM_FLAT_FEE;
    } else {
        fee = vendorSubtotal * PLATFORM_PERCENTAGE;
    }
    
    // NO ROUNDING - exact decimal, kobo conversion rounds at the end
    return {
        subtotal: vendorSubtotal,
        fee,
        vendorAmount: vendorSubtotal - fee
    };
};
