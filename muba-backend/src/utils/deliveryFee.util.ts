/**
 * Delivery Fee Calculation Utility
 * Centralized logic for calculating delivery fees based on delivery option
 */

export const DELIVERY_OPTIONS = {
  SCHOOL_POST: "school_post",
  SELF: "self",
  RIDER: "rider",
} as const;

export const DELIVERY_FEES = {
  school_post: 500, // Campus post office delivery (Matches Frontend)
  self: 0, // Self-pickup
  rider: 2000, // Third-party rider delivery
} as const;

/**
 * Calculate delivery fee based on delivery option
 * @param deliveryOption - The selected delivery method
 * @returns The delivery fee amount in kobo/cents
 */
export const calculateDeliveryFee = (
  deliveryOption: string
): number => {
  switch (deliveryOption) {
    case DELIVERY_OPTIONS.SCHOOL_POST:
      return DELIVERY_FEES.school_post;
    case DELIVERY_OPTIONS.SELF:
      return DELIVERY_FEES.self;
    case DELIVERY_OPTIONS.RIDER:
      return DELIVERY_FEES.rider;
    default:
      // Default to school post if invalid option
      console.warn(
        `Unknown delivery option: ${deliveryOption}. Defaulting to school_post.`
      );
      return DELIVERY_FEES.school_post;
  }
};

/**
 * Get human-readable delivery option label
 */
export const getDeliveryOptionLabel = (option: string): string => {
  switch (option) {
    case DELIVERY_OPTIONS.SCHOOL_POST:
      return "Campus Post Office";
    case DELIVERY_OPTIONS.SELF:
      return "Self Pickup";
    case DELIVERY_OPTIONS.RIDER:
      return "Rider Delivery";
    default:
      return option;
  }
};
