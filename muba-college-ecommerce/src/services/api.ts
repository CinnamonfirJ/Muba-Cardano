import axios from "axios";
// import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // IMPORTANT: This sends HttpOnly cookies
});

// Store for access token in memory
let accessToken: string | null = null;

// Store for auth context callback
let authContextCallback: ((token: string | null) => void) | null = null;

// Function to set access token (called from AuthContext)
export const setApiAccessToken = (token: string | null) => {
  accessToken = token;
};

// Function to get access token
export const getApiAccessToken = () => accessToken;

// Function to register auth context callback
export const setAuthContextCallback = (
  callback: (token: string | null) => void
) => {
  authContextCallback = callback;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token using HttpOnly cookie
        // No need to send refresh token in body - it's in the cookie
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {}, // Empty body
          {
            withCredentials: true, // Send HttpOnly cookie
          }
        );

        const { access_token } = response.data;

        // Update the access token in memory
        accessToken = access_token;

        // Update auth context if callback is available
        if (authContextCallback) {
          authContextCallback(access_token);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear access token and redirect to login
        accessToken = null;

        // Update auth context if callback is available
        if (authContextCallback) {
          authContextCallback(null);
        }

        // Clear user data
        localStorage.removeItem("user_data");

        // Only redirect if not already on login page
        // if (!window.location.pathname.includes("/login")) {
        //   window.location.href = "/login";
        // }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    // if (error.response?.data?.message) {
    //   toast.error(error.response.data.message);
    // } else if (error.response?.status >= 500) {
    //   toast.error("Server error. Please try again later.");
    // } else if (error.response?.status === 404) {
    //   toast.error("Resource not found.");
    // } else {
    //   toast.error("An error occurred. Please try again.");
    // }

    return Promise.reject(error);
  }
);

export default api;
