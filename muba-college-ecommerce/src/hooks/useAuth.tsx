import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authService,
  type LoginData,
  type RegisterData,
  type User,
} from "../services/authService";
import toast from "react-hot-toast";

// Custom hook for login
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (data) => {
      // Cache the user data
      queryClient.setQueryData(["user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Login successful!");
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
};

// Custom hook for registration
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      // Note: Registration usually requires login afterwards or auto-logins
      // If it returns user data and token, we can treat it like login
       if (data.token) {
           queryClient.setQueryData(["user"], data.user);
           queryClient.invalidateQueries({ queryKey: ["user"] });
       }
      toast.success("Registration successful! Please login.");
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });
};

// Custom hook for logout
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // queryClient.setQueryData(["user"], null);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    },
    onError: (error: any) => {
      console.error("Logout failed:", error);
      // Still clear cache even if logout fails
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};

// Custom hook for getting current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => authService.getUserProfile(),
    // enabled: authService.isAuthenticated(), // Check if we have basic local storage data
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// Custom hook for OTP request
export const useRequestOTP = () => {
  return useMutation({
    mutationFn: (email: string) => authService.requestOTP(email),
    onSuccess: () => {
        toast.success("OTP sent to your email");
    },
    onError: (error: any) => {
      console.error("OTP request failed:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    },
  });
};

// Custom hook for password reset
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (payload: {
      email: string;
      otp: string;
      newPassword: string;
    }) => authService.resetPassword(payload.email, payload.otp, payload.newPassword),
    onSuccess: () => {
        toast.success("Password reset successful. Please login.");
    },
    onError: (error: any) => {
      console.error("Password reset failed:", error);
      toast.error(error.response?.data?.message || "Password reset failed");
    },
  });
};

