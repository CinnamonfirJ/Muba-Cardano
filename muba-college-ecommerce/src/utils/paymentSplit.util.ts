/**
 * Customer Service Fee Logic (Frontend)
 * 
 * ₦100 Service Fee applies ONLY when order total >= ₦1000
 * 
 * This is a CUSTOMER-FACING fee (added to the price they pay).
 * Vendors set their price; customers see price + service fee when applicable.
 * 
 * Examples:
 * - ₦1000 item, qty 1 → Total ₦1100 (fee applies)
 * - ₦500 item, qty 1 → Total ₦500 (no fee)
 * - ₦800 item, qty 2 → Total ₦1700 (fee applies because 1600 >= 1000)
 * - ₦400 item, qty 2 → Total ₦800 (no fee because 800 < 1000)
 */

export const SERVICE_FEE_AMOUNT = 100;
export const SERVICE_FEE_THRESHOLD = 1000;

export interface CartPricingResult {
    subtotal: number;
    serviceFee: number;
    total: number;
    serviceFeeApplies: boolean;
}

/**
 * Calculate cart pricing with service fee.
 * Service fee is applied ONCE per order if total >= ₦1000.
 */
export const calculateCartPricing = (subtotal: number): CartPricingResult => {
    const serviceFeeApplies = subtotal >= SERVICE_FEE_THRESHOLD;
    const serviceFee = serviceFeeApplies ? SERVICE_FEE_AMOUNT : 0;

    return {
        subtotal,
        serviceFee,
        total: subtotal + serviceFee,
        serviceFeeApplies,
    };
};

/**
 * Get display price for product card (single item view).
 * If vendorPrice >= ₦1000, shows vendorPrice + ₦100
 * If vendorPrice < ₦1000, shows vendorPrice
 */
export const getDisplayPrice = (vendorPrice: number): number => {
    if (vendorPrice >= SERVICE_FEE_THRESHOLD) {
        return vendorPrice + SERVICE_FEE_AMOUNT;
    }
    return vendorPrice;
};

/**
 * Check if service fee applies for a given subtotal.
 */
export const shouldApplyServiceFee = (subtotal: number): boolean => {
    return subtotal >= SERVICE_FEE_THRESHOLD;
};

/**
 * DEPRECATED: Old interface for backward compatibility.
 * Use calculateCartPricing instead.
 */
export interface SplitResult {
    subtotal: number;
    platform_fee: number;
    vendor_amount: number;
    total_amount: number;
}

/**
 * DEPRECATED: Use calculateCartPricing instead.
 * Kept for backward compatibility with existing code.
 */
export const calculateSplit = (subtotal: number): SplitResult => {
    const pricing = calculateCartPricing(subtotal);
    
    return {
        subtotal,
        platform_fee: pricing.serviceFee,
        vendor_amount: subtotal,
        total_amount: pricing.total,
    };
};
