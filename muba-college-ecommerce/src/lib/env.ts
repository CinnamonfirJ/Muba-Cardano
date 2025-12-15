// Environment configuration for React app
interface AppConfig {
  API_BASE_URL: string;
  NODE_ENV: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
}

// Function to get environment variables safely
const getEnvVar = (key: string, defaultValue = ""): string => {
  // For Vite-based React apps
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[`VITE_${key}`] || defaultValue;
  }

  // For Create React App
  if (typeof process !== "undefined" && process.env) {
    return process.env[`REACT_APP_${key}`] || defaultValue;
  }

  // Fallback for browser environment
  return defaultValue;
};

// Determine if we're in development
const isDevelopment = (): boolean => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.DEV || import.meta.env.MODE === "development";
  }

  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV === "development";
  }

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

// Create configuration object
export const config: AppConfig = {
  API_BASE_URL: getEnvVar(
    "API_BASE_URL",
    isDevelopment()
      ? "http://localhost:5000"
      : "https://your-production-api.com"
  ),
  NODE_ENV: getEnvVar(
    "NODE_ENV",
    isDevelopment() ? "development" : "production"
  ),
  IS_DEVELOPMENT: isDevelopment(),
  IS_PRODUCTION: !isDevelopment(),
};

// Export individual config values for convenience
export const { API_BASE_URL, NODE_ENV, IS_DEVELOPMENT, IS_PRODUCTION } = config;

export default config;
