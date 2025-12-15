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
  async getUsers(): Promise<User[]> {
    const response = await api.get("/api/v1/admin/users");
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
};
