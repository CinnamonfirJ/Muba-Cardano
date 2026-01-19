/**
 * Order Status Utilities for Frontend
 * Human-readable labels and styling for order statuses
 */

export const ORDER_STATUSES = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  ORDER_CONFIRMED: "order_confirmed",
  HANDED_TO_POST_OFFICE: "handed_to_post_office",
  READY_FOR_PICKUP: "ready_for_pickup",
  SHIPPED: "shipped",
  DISPATCHED: "dispatched",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

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
    case ORDER_STATUSES.SHIPPED:
      return "Shipped";
    case ORDER_STATUSES.DISPATCHED:
      return "Dispatched";
    case ORDER_STATUSES.DELIVERED:
      return "Delivered";
    case ORDER_STATUSES.CANCELLED:
      return "Cancelled";
    default:
      return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Pending";
  }
};

export const getStatusBadgeClass = (status: string): string => {
  const baseClass = "px-3 py-1 rounded-full text-xs font-semibold";
  
  switch (status) {
    case ORDER_STATUSES.PENDING_PAYMENT:
    case "pending":
      return `${baseClass} bg-gray-100 text-gray-800`;
    case ORDER_STATUSES.PAID:
    case ORDER_STATUSES.ORDER_CONFIRMED:
    case "confirmed":
      return `${baseClass} bg-blue-100 text-blue-800`;
    case ORDER_STATUSES.HANDED_TO_POST_OFFICE:
      return `${baseClass} bg-purple-100 text-purple-800`;
    case ORDER_STATUSES.READY_FOR_PICKUP:
      return `${baseClass} bg-orange-100 text-orange-800`;
    case ORDER_STATUSES.SHIPPED:
    case ORDER_STATUSES.DISPATCHED:
      return `${baseClass} bg-indigo-100 text-indigo-800`;
    case ORDER_STATUSES.DELIVERED:
    case "delivered":
      return `${baseClass} bg-green-100 text-green-800`;
    case ORDER_STATUSES.CANCELLED:
    case "cancelled":
      return `${baseClass} bg-red-100 text-red-800`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800`;
  }
};

export const getDeliveryOptionLabel = (option: string): string => {
  switch (option) {
    case "school_post":
      return "Campus Post Office";
    case "self":
      return "Self Pickup";
    case "rider":
      return "Rider Delivery";
    default:
      return option;
  }
};

export const formatDeliveryFee = (fee: number): string => {
  if (fee === 0) return "Free";
  return `₦${fee.toLocaleString()}`;
};
