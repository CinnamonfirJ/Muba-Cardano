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
  user_id: {
    _id: string;
    firstname: string;
    lastname?: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
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

  // Create new order
  async createOrder(id: string) {
    const response = await api.post("/api/v1/order", { id });
    return response.data;
  },

  // VENDOR METHODS REMOVED - Use vendorOrder.service.ts
};

export const OrderService = orderService;
export default orderService;
