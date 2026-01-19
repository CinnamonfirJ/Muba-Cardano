import api from "./api";

export interface VendorOrder {
  _id: string;
  refId?: string;
  order_id: string;
  vendor_id: string;
  customer_id: {
    _id: string;
    firstname: string;
    lastname?: string;
    email: string;
    phone?: string;
    delivery_location: string;
    matric_number?: string;
  };
  items: Array<{
    product_id: {
      _id: string;
      title: string;
      img: string[];
      price: number;
    };
    quantity: number;
    price: number;
    name: string;
    img: string[];
    variant?: string;
  }>;
  delivery_option: "school_post" | "self" | "rider";
  delivery_fee: number;
  platform_fee: number;
  total_amount: number;
  vendor_earnings: number;
  rider_info?: {
    name: string;
    phone: string;
  };
  vendor_qr_code?: string;
  client_qr_code?: string;
  is_pickup_order?: boolean;
  status:
    | "pending_payment"
    | "order_confirmed"
    | "processing"
    | "picked_up_by_post_office"
    | "in_transit"
    | "ready_for_pickup"
    | "delivered"
    | "cancelled"
    // Legacy statuses for backward compatibility
    | "pending"
    | "confirmed"
    | "sent_to_post_office"
    | "out_for_delivery"
    | "assigned_to_rider";
  createdAt: string;
  updatedAt: string;
}

export const getVendorOrders = async (vendorId?: string) => {
  const params = vendorId ? { vendorId } : {};
  const response = await api.get<{ data: VendorOrder[] }>("/api/v1/order", { params });
  return response.data.data;
};

export const getVendorOrder = async (orderId: string, vendorId?: string) => {
  const params = vendorId ? { vendorId } : {};
  const response = await api.get<{ data: VendorOrder }>(`/api/v1/order/${orderId}`, {
    params,
  });
  return response.data.data;
};

export const updateVendorOrder = async (
  orderId: string,
  data: Partial<VendorOrder>,
  vendorId?: string
) => {
  const params = vendorId ? { vendorId } : {};
  const response = await api.patch<{ data: VendorOrder }>(
    `/api/v1/order/${orderId}`,
    data,
    { params }
  );
  return response.data.data;
};

export const markAsReadyForPickup = async (orderId: string) => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data: {
      refId: string;
      status: string;
      client_qr_code: string;
    };
  }>(`/api/v1/delivery/mark-ready/${orderId}`);
  return response.data;
};

export const vendorOrderService = {
  getVendorOrders,
  getVendorOrder,
  updateVendorOrder,
  markAsReadyForPickup,
};

export const VendorOrderService = vendorOrderService;
export default vendorOrderService;
