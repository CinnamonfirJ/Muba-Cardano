/**
 * Customer Service Fee Logic
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

export interface PricingBreakdown {
    basePrice: number;           // Vendor's set price per unit
    quantity: number;
    subtotal: number;            // basePrice * quantity
    serviceFee: number;          // ₦100 or 0
    total: number;               // subtotal + serviceFee
    serviceFeeApplies: boolean;  // For display logic
}

export const SERVICE_FEE_AMOUNT = 100;
export const SERVICE_FEE_THRESHOLD = 1000;

/**
 * Determines if the ₦100 service fee applies to an order.
 * Fee applies when order subtotal >= ₦1000
 */
export const shouldApplyServiceFee = (basePrice: number, quantity: number): boolean => {
    const subtotal = basePrice * quantity;
    return subtotal >= SERVICE_FEE_THRESHOLD;
};

/**
 * Calculate the service fee for an order.
 */
export const calculateServiceFee = (basePrice: number, quantity: number): number => {
    return shouldApplyServiceFee(basePrice, quantity) ? SERVICE_FEE_AMOUNT : 0;
};

/**
 * Get the display price for a single item on product cards/marketplace.
 * Shows the price customer will pay for 1 unit.
 * 
 * If vendorPrice >= ₦1000, display shows vendorPrice + ₦100
 * If vendorPrice < ₦1000, display shows vendorPrice
 */
export const getDisplayPrice = (vendorPrice: number): number => {
    if (vendorPrice >= SERVICE_FEE_THRESHOLD) {
        return vendorPrice + SERVICE_FEE_AMOUNT;
    }
    return vendorPrice;
};

/**
 * Get a complete pricing breakdown for checkout.
 */
export const getCheckoutBreakdown = (basePrice: number, quantity: number): PricingBreakdown => {
    const subtotal = basePrice * quantity;
    const serviceFeeApplies = subtotal >= SERVICE_FEE_THRESHOLD;
    const serviceFee = serviceFeeApplies ? SERVICE_FEE_AMOUNT : 0;

    return {
        basePrice,
        quantity,
        subtotal,
        serviceFee,
        total: subtotal + serviceFee,
        serviceFeeApplies,
    };
};

/**
 * Calculate total for a multi-item cart.
 * Service fee is applied ONCE per order if total >= ₦1000.
 */
export const getCartTotal = (items: Array<{ price: number; quantity: number }>): {
    subtotal: number;
    serviceFee: number;
    total: number;
    serviceFeeApplies: boolean;
} => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
 * DEPRECATED: Old function for backward compatibility
 * Use getCheckoutBreakdown instead.
 */
export const getCheckoutTotal = (vendorPrice: number, quantity: number): number => {
    const breakdown = getCheckoutBreakdown(vendorPrice, quantity);
    return breakdown.total;
};
