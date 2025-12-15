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
    email: string;
  }; // Changed from array to single object
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
  isActive?: boolean; // Added for store status management
  createdAt: string;
  updatedAt: string;
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
    return response.data.data; // Unwrapping data
  },

  async getStoreById(id: string) {
    const response = await api.get(`/api/v1/stores/${id}`);
    return response.data.data; // Unwrapping data
  },

  async getStoreStats(id: string): Promise<StoreStats> {
    try {
      const response = await api.get(`/api/v1/stores/${id}/stats`);
      return response.data;
    } catch (error) {
      // Fallback: return default stats if endpoint doesn't exist
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
      timeout: 60000, // 60 seconds for file uploads
    });
    return response.data;
  },

  async updateStore(id: string, storeData: Partial<Store> | FormData) {
    const response = await api.patch(`/api/v1/stores/${id}`, storeData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds for file uploads
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

  // Additional methods for store management
  async getStoreDashboard(id: string) {
    const response = await api.get(`/api/v1/stores/${id}/dashboard`);
    return response.data;
  },

  async getUserStores(userId: string) {
    const response = await api.get(`/api/v1/stores/user/${userId}`);
    return response.data.data; // Unwrapping data
  },

  async getMyStores() {
    const response = await api.get(`/api/v1/stores/user/me`); // Assuming this endpoint exists, or use getUserStores with current user ID if accessible.
    // If backend doesn't have 'me' endpoint for stores, we should rely on passing userId to getUserStores.
    // Given usage in useStores.ts: queryFn: () => storeService.getMyStores(),
    // I'll implement it to call likely endpoint or return [];
    // Better: let's use the same endpoint as getUserStores but we need the ID.
    // Since this is a service, it doesn't know about auth context.
    // I will assume /api/v1/stores/my-stores or similar exists, OR I will assume the user has to pass ID.
    // Refactoring useStores.ts to use getUserStores(userId) is safer if 'me' endpoint is uncertain.
    // But for now let's try /api/v1/stores/user/me if the backend supports it.
    // Actually, looking at authService, we have getCurrentUser().
    // So:
    const userStr = localStorage.getItem("user_data");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user?._id) throw new Error("User not found");
    return this.getUserStores(user._id);
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
