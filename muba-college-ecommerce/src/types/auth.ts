// Centralized type definitions for authentication

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  rating: number;
  stores: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  data: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface OTPPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: SignInPayload) => Promise<void>;
  register: (payload: SignUpPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
