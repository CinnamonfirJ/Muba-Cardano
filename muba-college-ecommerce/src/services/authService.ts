import api, { setApiAccessToken } from "./api";

export interface LoginData {
  email: string;
  password: string;
  matric_number?: string;
}

export interface RegisterData {
  firstname: string;
  middlename?: string;
  lastname: string;
  email: string;
  password: string;
  phone: string;
  matric_number?: string;
}

export interface User {
  _id: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  email: string;
  role: "user" | "vendor" | "admin" | "post_office" | "post_office_member";
  matric_number?: string;
  phone?: string;
  delivery_location?: string;
  bio?: string;
  isVerified?: boolean;
  avatar?: string;
  profile_img?: string;
  rating?: number;
  successful_deliveries?: number;
  stores?: any[];
  vendorStatus?: "none" | "pending" | "accepted" | "rejected";
  postOfficeStatus?: "none" | "pending" | "accepted" | "rejected";
  postOfficeName?: string;
  createdAt?: string;
  updatedAt?: string;
  favorites?: string[];
}

export const authService = {
  async login(data: LoginData) {
    const response = await api.post("/api/v1/auth/sign-in", data);
    
    // Defensive null check
    if (!response?.data) {
      throw new Error("Invalid response from server");
    }

    const { access_token, data: userData } = response.data;
    
    if (!access_token) {
      throw new Error("No access token received from server");
    }

    if (!userData) {
      throw new Error("No user data received from server");
    }

    // Note: refresh_token is now stored as HttpOnly cookie by backend
    // We only store user data in localStorage for persistence
    localStorage.setItem("user_data", JSON.stringify(userData));
    setApiAccessToken(access_token);

    return {
      user: userData,
      access_token, // This will be stored in React state only
    };
  },

  async register(data: RegisterData) {
    const response = await api.post("/api/v1/auth/sign-up", data);
    return response.data;
  },

  async logout() {
    try {
      await api.post("/api/v1/auth/signout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Only clear user data from localStorage
      // HttpOnly cookies will be cleared by the backend
      localStorage.removeItem("user_data");
    }
  },

  async refreshToken() {
    // Call refresh endpoint - refresh token will be sent automatically via HttpOnly cookie
    const response = await api.post("/api/v1/auth/refresh");
    
    if (!response?.data?.access_token) {
      throw new Error("No access token received from refresh endpoint");
    }

    const { access_token } = response.data;
    return { access_token };
  },

  async getUserProfile(): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser?._id) {
      throw new Error("No user ID available");
    }

    try {
      // Use the correct route: /api/v1/users/:_id (plural "users")
      const response = await api.get(`/api/v1/users/${currentUser._id}`);
      const userData = response.data.data;

      // Update stored user data
      localStorage.setItem("user_data", JSON.stringify(userData));

      return userData;
    } catch (error: any) {
      console.error("Error fetching user profile:", error);

      // If it's a schema error or server error, return cached data
      if (error.response?.status === 500 || error.message?.includes("Schema")) {
        console.log("Server error encountered, using cached user data");
        if (currentUser) {
          return currentUser;
        }
      }

      // For auth errors, throw to trigger logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }

      // For other errors, return cached data if available
      if (currentUser) {
        console.log("API call failed, using cached user data");
        return currentUser;
      }

      throw error;
    }
  },

  async requestOTP(email: string) {
    const response = await api.post("/api/v1/auth/otp", { email });
    return response.data;
  },

  async updateProfile(userData: Partial<User>) {
    const currentUser = this.getCurrentUser();
    if (!currentUser?._id) {
      throw new Error("No user ID available");
    }

    try {
        const response = await api.patch(`/api/v1/users/${currentUser._id}`, userData);
        
        // Update stored user data if successful
        if (response.data && response.data.data) {
             const updatedUser = response.data.data;
             localStorage.setItem("user_data", JSON.stringify(updatedUser));
             return updatedUser;
        }
        return response.data;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const currentUser = this.getCurrentUser();
    if (!currentUser?._id) {
      throw new Error("No user ID available");
    }

    try {
      const response = await api.post("/api/v1/auth/change-password", {
        userId: currentUser._id,
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const response = await api.post("/api/v1/auth/reset-password", {
      email,
      otp,
      password: newPassword,
    });
    return response.data;
  },

  getCurrentUser(): User | null {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    const userData = localStorage.getItem("user_data");
    // We only check for user data since access token is in memory
    // and refresh token is HttpOnly cookie
    return !!userData;
  },
};

export const AuthService = authService;
export default authService;
