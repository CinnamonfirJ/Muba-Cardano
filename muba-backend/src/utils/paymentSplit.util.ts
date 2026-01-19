/**
 * Payment Split Utility
 * Calculates the split between platform fees and vendor earnings.
 * All calculations are done in NAIRA and returned in NAIRA.
 */

export interface SplitResult {
    total_amount: number;
    platform_fee: number;
    vendor_amount: number;
}

/**
 * Platform Fees (GLOBAL RULE)
 * Orders < ₦1,000  => 2.5%
 * Orders ≥ ₦1,000 => 2.5% + ₦100
 */
export const calculateSplit = (totalAmountNaira: number): SplitResult => {
    let platformFee = 0;
    
    if (totalAmountNaira < 1000) {
        platformFee = totalAmountNaira * 0.025;
    } else {
        platformFee = (totalAmountNaira * 0.025) + 100;
    }

    // Round to 2 decimal places for financial calculations
    platformFee = Math.round(platformFee * 100) / 100;
    
    const vendorAmount = totalAmountNaira - platformFee;

    return {
        total_amount: totalAmountNaira,
        platform_fee: platformFee,
        vendor_amount: vendorAmount > 0 ? vendorAmount : 0,
    };
};
