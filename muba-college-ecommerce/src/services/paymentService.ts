import api from "./api";

export interface PaymentInitData {
  email: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: boolean;
  reference: string;
  tx: any;
  authorization_url: string;
}

export interface VerifyResponse {
  status: boolean;
  message: string;
  data?: any;
}

class PaymentService {
  // 🔹 Initialize payment
  async initializePayment(payload: PaymentInitData): Promise<PaymentResponse> {
    try {
      const response = await api.post<PaymentResponse>(
        "/api/v1/payment/",
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error("Initialize Payment Error:", error);
      throw (
        error.response?.data || { message: "Payment initialization failed" }
      );
    }
  }

  // 🔹 Verify payment
  async verifyPayment(reference: string): Promise<VerifyResponse> {
    try {
      const response = await api.get<VerifyResponse>(
        `/api/v1/payment?reference=${reference}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Verify Payment Error:", error);
      throw error.response?.data || { message: "Payment verification failed" };
    }
  }

  // Get payment Stats
  async getPaymentStats() {
    try {
      const response = await api.get("/api/v1/payment/stats");
      return response.data;
    } catch (error: any) {
      console.error("Get Payment Stats Error:", error);
      throw (
        error.response?.data || { message: "Failed to fetch payment stats" }
      );
    }
  }
}

const paymentService = new PaymentService();
export { paymentService };
export default paymentService;
