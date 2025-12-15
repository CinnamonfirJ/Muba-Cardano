"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, type User } from "../services/authService";
import {
  updateApiToken,
  registerAuthContext,
} from "../utils/authApiConnection";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (
    email: string,
    password: string,
    matric_number?: string
  ) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const handleSetAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    updateApiToken(token); // Update API interceptor
  };

  // Register auth context with API on mount
  useEffect(() => {
    registerAuthContext(handleSetAccessToken);
  }, []);

  // Update API token whenever accessToken changes
  useEffect(() => {
    updateApiToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    // Check if user is logged in on app start
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);

    try {
      const isAuth = authService.isAuthenticated();
      if (isAuth) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);

          // Try to get a fresh access token using the HttpOnly refresh token cookie
          try {
            const { access_token } = await authService.refreshToken();
            handleSetAccessToken(access_token);

            // Optionally refresh user data from server to get latest info
            await refreshUser(false); // false to prevent setting loading state again
          } catch (error) {
            console.log(
              "Failed to refresh token on init, user needs to login again"
            );
            // Clear invalid auth state
            await logout();
          }
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      // Clear invalid auth data
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    matric_number?: string
  ): Promise<void> => {
    try {
      const loginData: any = { email, password };
      if (matric_number) {
        loginData.matric_number = matric_number;
      }

      const result = await authService.login(loginData);
      setUser(result.user);
      handleSetAccessToken(result.access_token);
      // toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      await authService.register(userData);
      toast.success("Registration successful! Please check your email.");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      handleSetAccessToken(null);
      // toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if server logout fails
      setUser(null);
      handleSetAccessToken(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Update localStorage as well
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async (showLoading: boolean = true): Promise<void> => {
    try {
      if (showLoading) setIsLoading(true);

      const updatedUser = await authService.getUserProfile();
      setUser(updatedUser);
    } catch (error: any) {
      console.error("Failed to refresh user data:", error);

      // If it's an auth error (401/403), logout the user
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout();
        return;
      }

      // For other errors, don't break the app
      throw error;
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    setAccessToken: handleSetAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
