/**
 * Order Status Management Utility
 * Centralized logic for order status flow, validation, and labels
 */

export const ORDER_STATUSES = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  ORDER_CONFIRMED: "order_confirmed",
  HANDED_TO_POST_OFFICE: "handed_to_post_office",
  READY_FOR_PICKUP: "ready_for_pickup",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case ORDER_STATUSES.PENDING_PAYMENT:
      return "Pending Payment";
    case ORDER_STATUSES.PAID:
      return "Paid";
    case ORDER_STATUSES.ORDER_CONFIRMED:
      return "Order Confirmed";
    case ORDER_STATUSES.HANDED_TO_POST_OFFICE:
      return "Handed to Post Office";
    case ORDER_STATUSES.READY_FOR_PICKUP:
      return "Ready for Pickup";
    case ORDER_STATUSES.DELIVERED:
      return "Delivered";
    case ORDER_STATUSES.CANCELLED:
      return "Cancelled";
    default:
      return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

/**
 * Valid status transitions map
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: [ORDER_STATUSES.PAID, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PAID]: [ORDER_STATUSES.ORDER_CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.ORDER_CONFIRMED]: [ORDER_STATUSES.HANDED_TO_POST_OFFICE, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.HANDED_TO_POST_OFFICE]: [ORDER_STATUSES.READY_FOR_PICKUP],
  [ORDER_STATUSES.READY_FOR_PICKUP]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.DELIVERED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

/**
 * Validate if status transition is allowed
 */
export const isValidTransition = (
  currentStatus: string,
  newStatus: string
): boolean => {
  if (currentStatus === newStatus) return true;
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Determine if an order is a pickup order based on delivery option
 */
export const isPickupOrder = (deliveryOption: string): boolean => {
  return deliveryOption === "school_post";
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case ORDER_STATUSES.PENDING_PAYMENT:
      return "gray";
    case ORDER_STATUSES.PAID:
      return "blue";
    case ORDER_STATUSES.ORDER_CONFIRMED:
      return "blue";
    case ORDER_STATUSES.HANDED_TO_POST_OFFICE:
      return "purple";
    case ORDER_STATUSES.READY_FOR_PICKUP:
      return "orange";
    case ORDER_STATUSES.DELIVERED:
      return "green";
    case ORDER_STATUSES.CANCELLED:
      return "red";
    default:
      return "gray";
  }
};
