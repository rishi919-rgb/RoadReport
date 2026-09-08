/**
 * @file api.js
 * @description Configures the global Axios instance for making API calls.
 * Implements request interceptors for JWT injection and adaptive network fallback for seamless local development.
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URL is pulled from an environment variable so the same code
// works against a local dev server or the deployed Render backend
// without changing this file.
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://roadreport-plu6.onrender.com/api',
  timeout: 45000, // 45 seconds to comfortably accommodate Render free-tier cold-start wake-up times
});

// A callback to notify AuthContext to update UI state on 401 unauthorized
let logoutCallback = null;

export const registerLogoutCallback = (callback) => {
  logoutCallback = callback;
};

/**
 * Request Interceptor
 * 
 * VIVA QUESTION: "How does the token get sent on every request?"
 * ANSWER: We register a Request Interceptor on our Axios instance. Right before Axios sends
 * any HTTP request to the backend, this interceptor intercepts it, reads the JWT token asynchronously
 * from the device's Secure Store, and appends it as a 'Bearer <token>' string to the
 * 'Authorization' header. This keeps the screens from having to manually pass the token.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('roadreport_jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to retrieve token for request headers:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Intercepts responses to catch 401 errors for auto-logout, and handles automatic network retry on Render cold boot.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;

    // 1. Auto-retry once on network error, ECONNABORTED (timeout), or 502/503/504 Bad Gateway / Service Unavailable during Render spin-up
    if (config && (!config._retryCount || config._retryCount < 2)) {
      const isNetworkOrTimeout =
        !error.response ||
        error.code === 'ECONNABORTED' ||
        [502, 503, 504].includes(error.response?.status);

      if (isNetworkOrTimeout) {
        config._retryCount = (config._retryCount || 0) + 1;
        console.log(`[API Retry] Attempt ${config._retryCount} for ${config.url} due to Render cold boot or network lag...`);
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return api(config);
      }
    }

    // 2. Handle 401 Unauthorized Session Expired
    if (error.response && error.response.status === 401) {
      try {
        await SecureStore.deleteItemAsync('roadreport_jwt_token');
        if (logoutCallback) {
          logoutCallback();
        }
      } catch (e) {
        console.error('Failed to clean token on 401:', e.message);
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
