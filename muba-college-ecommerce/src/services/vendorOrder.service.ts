import api from "./api";

export interface VendorOrder {
  _id: string;
  order_id: string;
  vendor_id: string;
  customer_id: {
    _id: string;
    firstname: string;
    email: string;
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
  rider_info?: {
    name: string;
    phone: string;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "sent_to_post_office"
    | "out_for_delivery"
    | "assigned_to_rider"
    | "delivered"
    | "cancelled";
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
