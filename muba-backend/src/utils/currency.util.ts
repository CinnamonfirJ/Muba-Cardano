/**
 * Currency Utility
 * Enforces Kobo <-> Naira conversion rules.
 * Paystack expects amounts in Kobo.
 * Database stores amounts in Naira.
 */

// Convert Naira to Kobo (multiply by 100)
export const toKobo = (naira: number | string): number => {
    const value = typeof naira === 'string' ? Number(naira) : naira;
    if (isNaN(value)) return 0;
    
    // Use Math.round to handle floating point errors like 30600.0000000004
    return Math.round(value * 100);
};

// Convert Kobo to Naira (divide by 100)
export const toNaira = (kobo: number | string): number => {
    const value = typeof kobo === 'string' ? Number(kobo) : kobo;
    if (isNaN(value)) return 0;

    // Use toFixed or similar if needed for display, but backend stores number.
    // parseFloat( ... toFixed(2) ) ensures 2 decimal places if needed.
    return Number((value / 100).toFixed(2));
};

// Calculate absolute total from line items without external math
export const calculateLineItemTotal = (price: number, quantity: number): number => {
    return price * quantity;
};
