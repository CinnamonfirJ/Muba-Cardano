import api from "./api";

export interface Bank {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
}

export interface PayoutSettings {
  account_number: string;
  bank_code: string;
  bank_name?: string;
}

export const payoutService = {
  async getBanks(): Promise<Bank[]> {
    const response = await api.get("/api/v1/vendors/banks");
    // The controller returns: return res.status(200).json(data); where data is the Paystack response object
    // Paystack response structure: { status: boolean, message: string, data: Bank[] }
    return response.data.data;
  },

  async savePayoutSettings(storeId: string, settings: PayoutSettings) {
    const response = await api.post("/api/v1/vendors/payout-settings", {
      storeId,
      ...settings,
    });
    return response.data;
  },
};

export default payoutService;
