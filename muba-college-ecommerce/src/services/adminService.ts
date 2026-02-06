import api from "./api";
import type { User } from "./authService";

export interface MonthlyRevenueItem {
  month: string;
  totalAmount: number;
  count: number;
}

export interface VendorApplication {
  _id: string;
  userId: string;
  firstname: string;
  email: string;
  address: string;
  matric_number?: string;
  department: string;
  faculty: string;
  valid_id: string;
  picture: string;
  cac?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
   createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalPayments: number;
  monthlyRevenue: MonthlyRevenueItem[];
  pendingVendorApplications: number;
  rejectedApplications: number;
  reportedItems: number;
}

export const adminService = {
  // Get all users
  async getUsers(page = 1, limit = 10, search = ""): Promise<User[]> {
    const response = await api.get("/api/v1/admin/users", {
      params: { page, limit, q: search },
    });
    return response.data.data;
  },

  // Get users with role filter
  async getUsersByRole(role?: "user" | "vendor"): Promise<User[]> {
    const response = await api.get("/api/v1/admin/users", {
      params: role ? { role } : {},
    });
    return response.data.data;
  },

  // Get all vendor applications (following your pattern: /api/v1/vendors)
  async getVendorApplications(): Promise<VendorApplication[]> {
    const response = await api.get("/api/v1/admin/vendors");
    return response.data.data;
  },

  // Get pending vendor applications (for overview section)
  async getPendingVendorApplications(): Promise<VendorApplication[]> {
    const response = await api.get("/api/v1/admin/vendors/pending");
    return response.data.data;
  },

  // Approve vendor application
  async approveVendorApplication(applicationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.patch(
      `/api/v1/admin/vendors/${applicationId}/approve`
    );
    return response.data;
  },

  // Reject vendor application
  async rejectVendorApplication(
    applicationId: string,
    rejectionReason?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.patch(
      `/api/v1/admin/vendors/${applicationId}/reject`,
      { rejectionReason }
    );
    return response.data;
  },

  // Get admin dashboard stats
  async getDashboardStats(): Promise<AdminStats> {
    const response = await api.get("/api/v1/admin/stats");
    return response.data.data;
  },

  async getStats(): Promise<AdminStats> {
    return this.getDashboardStats();
  },

  // Get all stores for admin
  async getStores(page = 1, limit = 10, status = "all"): Promise<any[]> {
    const response = await api.get("/api/v1/admin/stores", {
      params: { page, limit, status },
    });
    return response.data.data;
  },

  // Verify a store
  async verifyStore(storeId: string): Promise<any> {
    const response = await api.patch(`/api/v1/admin/stores/${storeId}/verify`);
    return response.data;
  },

  // Ban/Unban user
  async toggleUserBan(
    userId: string,
    banned: boolean
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.patch(`/api/v1/admin/users/${userId}/ban`, {
      banned,
    });
    return response.data;
  },

  // Get vendor application details
  async getVendorApplicationDetails(
    applicationId: string
  ): Promise<VendorApplication> {
    const response = await api.get(`/api/v1/admin/vendors/${applicationId}`);
    return response.data.data;
  },

  // === NEW ANALYTICS ENDPOINTS ===

  // Get accurate platform revenue (MUBA earnings)
  async getPlatformRevenue(period?: "daily" | "monthly" | "all"): Promise<PlatformRevenueData> {
    const response = await api.get("/api/v1/admin/analytics/revenue", {
      params: period ? { period } : {},
    });
    return response.data.data;
  },

  // Get daily transaction volume (last 30 days)
  async getDailyTransactionVolume(): Promise<DailyVolumeItem[]> {
    const response = await api.get("/api/v1/admin/analytics/dtv");
    return response.data.data;
  },

  // Get vendor leaderboard
  async getVendorLeaderboard(
    sortBy: "revenue" | "orders" | "items" = "revenue",
    limit = 10
  ): Promise<VendorLeaderboardItem[]> {
    const response = await api.get("/api/v1/admin/analytics/vendors/leaderboard", {
      params: { sortBy, limit },
    });
    return response.data.data;
  },

  // Get product stats
  async getProductStats(): Promise<ProductStatsData> {
    const response = await api.get("/api/v1/admin/analytics/products");
    return response.data.data;
  },
};

// New Type Definitions for Analytics
export interface PlatformRevenueData {
  mubaRevenue: {
    total: number;
    platformFees: number;
    serviceFees: number;
  };
  transactions: {
    gmv: number;
    orderCount: number;
    itemsSold: number;
  };
  vendorMetrics: {
    totalEarnings: number;
    totalPaidOut: number;
    pendingPayout: number;
  };
  period: string;
  generatedAt: string;
}

export interface DailyVolumeItem {
  date: string;
  gmv: number;
  platformFee: number;
  serviceFee: number;
  mubaRevenue: number;
  vendorEarnings: number;
  orderCount: number;
}

export interface VendorLeaderboardItem {
  vendorId: string;
  storeName: string;
  storeImg?: string;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
}

export interface ProductStatsData {
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  stores: {
    total: number;
  };
  users: {
    customers: number;
    vendors: number;
    admins: number;
    postOffice: number;
  };
}

export const AdminService = adminService;
export default adminService;
