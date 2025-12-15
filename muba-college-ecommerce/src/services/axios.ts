// import axios, { type AxiosInstance, type AxiosResponse } from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// // Types for our API responses
// interface RefreshTokenResponse {
//   access_token: string;
//   refresh_token: string;
// }

// // interface ApiError {
// //   message: string;
// //   status?: number;
// // }

// class AxiosService {
//   private axiosInstance: AxiosInstance;
//   private isRefreshing = false;
//   private failedQueue: Array<{
//     resolve: (value?: any) => void;
//     reject: (error?: any) => void;
//   }> = [];

//   constructor() {
//     this.axiosInstance = axios.create({
//       baseURL: API_BASE_URL || "http://localhost:5000",
//       timeout: 10000,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     this.setupInterceptors();
//   }

//   private setupInterceptors() {
//     // Request interceptor - attach access token to requests
//     this.axiosInstance.interceptors.request.use(
//       (config) => {
//         const token = this.getAccessToken();
//         if (token && config.headers) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor - handle token refresh
//     this.axiosInstance.interceptors.response.use(
//       (response: AxiosResponse) => response,
//       async (error) => {
//         const originalRequest = error.config;

//         // If error is 401 and we haven't already tried to refresh
//         if (error.response?.status === 401 && !originalRequest._retry) {
//           if (this.isRefreshing) {
//             // If already refreshing, queue the request
//             return new Promise((resolve, reject) => {
//               this.failedQueue.push({ resolve, reject });
//             })
//               .then((token) => {
//                 if (originalRequest.headers) {
//                   originalRequest.headers.Authorization = `Bearer ${token}`;
//                 }
//                 return this.axiosInstance(originalRequest);
//               })
//               .catch((err) => {
//                 return Promise.reject(err);
//               });
//           }

//           originalRequest._retry = true;
//           this.isRefreshing = true;

//           try {
//             const newToken = await this.refreshToken();
//             this.processQueue(null, newToken);

//             if (originalRequest.headers) {
//               originalRequest.headers.Authorization = `Bearer ${newToken}`;
//             }
//             return this.axiosInstance(originalRequest);
//           } catch (refreshError) {
//             this.processQueue(refreshError, null);
//             this.handleAuthError();
//             return Promise.reject(refreshError);
//           } finally {
//             this.isRefreshing = false;
//           }
//         }

//         return Promise.reject(error);
//       }
//     );
//   }

//   private processQueue(error: any, token: string | null = null) {
//     this.failedQueue.forEach(({ resolve, reject }) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(token);
//       }
//     });

//     this.failedQueue = [];
//   }

//   private async refreshToken(): Promise<string> {
//     const refreshToken = this.getRefreshToken();

//     if (!refreshToken) {
//       throw new Error("No refresh token available");
//     }

//     try {
//       const response = await axios.post<RefreshTokenResponse>(
//         `${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}/api/v1/auth/refresh`,
//         { refresh_token: refreshToken }
//       );

//       const { access_token, refresh_token: newRefreshToken } = response.data;

//       this.setTokens(access_token, newRefreshToken);
//       return access_token;
//     } catch (error) {
//       this.clearTokens();
//       throw error;
//     }
//   }

//   private handleAuthError() {
//     this.clearTokens();
//     // Redirect to login or dispatch logout action
//     window.location.href = "/login";
//   }

//   // Token management methods
//   private getAccessToken(): string | null {
//     return localStorage.getItem("access_token");
//   }

//   private getRefreshToken(): string | null {
//     return localStorage.getItem("refresh_token");
//   }

//   private setTokens(accessToken: string, refreshToken: string) {
//     localStorage.setItem("access_token", accessToken);
//     localStorage.setItem("refresh_token", refreshToken);
//   }

//   private clearTokens() {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("refresh_token");
//   }

//   // Public methods
//   public getInstance(): AxiosInstance {
//     return this.axiosInstance;
//   }

//   public setAuthTokens(accessToken: string, refreshToken: string) {
//     this.setTokens(accessToken, refreshToken);
//   }

//   public logout() {
//     this.clearTokens();
//   }

//   public isAuthenticated(): boolean {
//     return !!this.getAccessToken();
//   }
// }

// // Create and export a singleton instance
// const axiosService = new AxiosService();
// export default axiosService;
