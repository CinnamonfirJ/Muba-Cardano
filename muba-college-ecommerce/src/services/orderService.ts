import api from "./api";

export interface OrderItem {
  _id: string;
  product_id: any;
  store_id: any;
  vendor_id: string;
  quantity: number;
  price: number;
  status: string;
  name?: string;
  img?: string;
  variant?: string;
}

export interface Order {
  _id: string;
  user_id?: {
    _id: string;
    firstname: string;
    lastname?: string;
    email: string;
  };
  customer_id?: {
      _id: string;
      firstname: string;
      lastname?: string;
      phone?: string;
      delivery_location?: string;
      matric_number?: string;
  };
  items: OrderItem[];
  total_amount: number;
  payment_reference?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  // BUYER METHODS
  
  // Get logged-in user's orders
  async getMyOrders() {
    const response = await api.get("/api/v1/order/my-orders");
    return response.data;
  },

  // Get single order by ID (Buyer)
  async getOrderById(id: string) {
    const response = await api.get(`/api/v1/order/${id}`);
    return response.data;
  },

  // Get order by payment reference (AliExpress Model Polling)
  async getOrderByReference(reference: string) {
    const response = await api.get(`/api/v1/order/by-reference/${reference}`);
    return response.data;
  },

  // Create new order
  async createOrder(id: string) {
    const response = await api.post("/api/v1/order", { id });
    return response.data;
  },

  // Delete unpaid order
  async deleteOrder(id: string) {
    const response = await api.delete(`/api/v1/order/${id}`);
    return response.data;
  },

  // Confirm P2P Delivery (Buyer Only)
  async confirmP2PDelivery(orderId: string) {
     const response = await api.post("/api/v1/delivery/p2p/confirm", { orderId });
     return response.data;
  },

  // --- DISPUTES ---
  
  // Open a new dispute
  async openDispute(payload: { vendorOrderId: string, reason: string, description: string, evidence?: string[] }) {
    const response = await api.post("/api/v1/order/dispute", payload);
    return response.data;
  },

  // Submit response to existing dispute
  async submitDisputeResponse(payload: { disputeId: string, message: string, evidence?: string[] }) {
    const response = await api.post("/api/v1/order/dispute/respond", payload);
    return response.data;
  },

  // Get dispute details
  async getDispute(id: string) {
    const response = await api.get(`/api/v1/order/dispute/${id}`);
    return response.data;
  }
};

export const OrderService = orderService;
export default orderService;
