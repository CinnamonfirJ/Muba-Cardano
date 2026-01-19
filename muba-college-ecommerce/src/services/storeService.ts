import api from "./api";

export interface Store {
  _id: string;
  name: string;
  description: string;
  img: string;
  location: string;
  owner: {
    _id: string;
    firstname: string;
    lastname?: string;
    email: string;
    successful_deliveries?: number;
    postOfficeStatus?: string;
  }; 
  rating: number;
  followers: string[];
  reviewsCount: number;
  reviews: string[];
  categories: string[];
  products: string[];
  shippingPolicy: string;
  returnPolicy: string;
  warranty: string;
  lastActive: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  settlement_bank?: string;
  account_number?: string;
  paystack_recipient_code?: string;
  paystack_subaccount_code?: string;
  bank_name?: string;
}

export interface StoreFilters {
  q?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface StoreStats {
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  totalSales: number;
  revenue: number;
  averageRating: number;
  recentOrders: number;
}

export const storeService = {
  async getAllStores(filters?: StoreFilters) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/api/v1/stores?${params.toString()}`);
    return response.data.data;
  },

  async getStoreById(id: string) {
    const response = await api.get(`/api/v1/stores/${id}`);
    return response.data.data;
  },

  async getStoreStats(id: string): Promise<StoreStats> {
    try {
      const response = await api.get(`/api/v1/stores/${id}/stats`);
      return response.data;
    } catch (error) {
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalViews: 0,
        totalSales: 0,
        revenue: 0,
        averageRating: 0,
        recentOrders: 0,
      };
    }
  },

  async getStoreProducts(
    id: string,
    filters?: { search?: string; page?: number; limit?: number }
  ) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/api/v1/stores/user/${id}`);
    return response.data;
  },

  async searchStores(searchData: StoreFilters) {
    const response = await api.get("/api/v1/stores/search", {
      params: searchData,
    });
    return response.data;
  },

  async createStore(storeData: Partial<Store> | FormData) {
    const response = await api.post("/api/v1/stores", storeData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
    return response.data;
  },

  async updateStore(id: string, storeData: Partial<Store> | FormData) {
    const response = await api.patch(`/api/v1/stores/${id}`, storeData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
    return response.data;
  },

  async updateStoreStatus(id: string, isActive: boolean) {
    const response = await api.patch(`/api/v1/stores/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  async deleteStore(id: string) {
    const response = await api.delete(`/api/v1/stores/${id}`);
    return response.data;
  },

  async followStore(id: string) {
    const response = await api.post(`/api/v1/stores/${id}/follow`);
    return response.data;
  },

  async unfollowStore(id: string) {
    const response = await api.post(`/api/v1/stores/${id}/unfollow`);
    return response.data;
  },

  async rateStore(id: string, data: { rating: number; review: string }) {
    const response = await api.post(`/api/v1/stores/${id}/rate`, data);
    return response.data;
  },

  async getStoreReviews(id: string) {
    const response = await api.get(`/api/v1/stores/${id}/reviews`);
    return response.data;
  },

  async getStoreDashboard(id: string) {
    const response = await api.get(`/api/v1/stores/${id}/dashboard`);
    return response.data;
  },

  async getUserStores(userId: string) {
    const response = await api.get(`/api/v1/stores/user/${userId}`);
    return response.data.data;
  },

  async getMyStores() {
    const response = await api.get(`/api/v1/stores/user/me`);
    return response.data.data;
  },

  async getVendorStore() {
    const stores = await this.getMyStores();
    return stores && stores.length > 0 ? stores[0] : null;
  },

  async getStoreAnalytics(
    id: string,
    period: "week" | "month" | "year" = "month"
  ) {
    const response = await api.get(`/api/v1/stores/${id}/analytics`, {
      params: { period },
    });
    return response.data;
  },
};

export const StoreService = storeService;
export const getVendorStore = () => storeService.getVendorStore();
export default storeService;
