// Create this file as: src/utils/authApiConnection.ts

import { setApiAccessToken, setAuthContextCallback } from "../services/api";

// Helper to update API token when it changes in AuthContext
export const updateApiToken = (token: string | null) => {
  setApiAccessToken(token);
};

// Helper to register auth context with API
export const registerAuthContext = (
  setAccessTokenCallback: (token: string | null) => void
) => {
  setAuthContextCallback(setAccessTokenCallback);
};
