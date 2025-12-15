import api from "./api"; // Re-using existing api instance for auth/config

export interface AuditEvent {
  order_id: string;
  action: "handoff" | "pickup";
  seller_id?: string;
  metadata?: any;
}

export interface AuditResponse {
  success: boolean;
  data: {
    tx_hash: string;
    status: string;
    block_height?: number;
  };
  message: string;
}

export const auditService = {
  // Record an audit event
  async recordEvent(event: AuditEvent): Promise<AuditResponse> {
    try {
      // We use the Next.js API route we just created
      const response = await api.post("/api/audit", {
        ...event,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error: any) {
      console.error("Audit Record Error:", error);
      // Fail gracefully as per requirements: "If Cardano fails -> system still works"
      // We define a fallback response so the UI flow doesn't break
      return {
        success: false,
        data: {
          tx_hash: "offline-hash",
          status: "failed-but-logged-locally",
        },
        message: "Audit server unreachable, logged locally.",
      };
    }
  },

  // In the future, we could add methods to fetch audit history
  // async getAuditHistory(orderId: string) { ... }
};
