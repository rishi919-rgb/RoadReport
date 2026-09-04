/**
 * @file api.js
 * @description Configures the global Axios instance for making API calls.
 * Implements request interceptors for JWT injection and adaptive network fallback for seamless local development.
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically retrieves Metro bundler's host IP address.
 * Ensures API connection matches whichever local Wi-Fi IP Metro is running on.
 */
const getMetroHostIp = () => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.tool || Constants.manifest?.debuggerHost || '';
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {
    // Fallback if Constants hostUri is unavailable
  }
  return null;
};

/**
 * Builds candidate API base URLs based on platform, dynamic Metro host IP, and environment variables.
 * @returns {string[]} Array of candidate base URLs.
 */
const getCandidateUrls = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const metroIp = getMetroHostIp();
  const list = [];

  if (metroIp) {
    list.push(`http://${metroIp}:5001/api`);
  }

  if (envUrl) {
    list.push(envUrl);
  }

  if (Platform.OS === 'android') {
    list.push('http://192.168.1.92:5001/api');
    list.push('http://10.0.2.2:5001/api');
    list.push('http://127.0.0.1:5001/api');
  } else {
    list.push('http://192.168.1.92:5001/api');
    list.push('http://127.0.0.1:5001/api');
    list.push('http://localhost:5001/api');
  }

  return Array.from(new Set(list));
};

const candidateUrls = getCandidateUrls();
let currentUrlIndex = 0;

const api = axios.create({
  baseURL: candidateUrls[0],
  timeout: 3000,
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
 * Intercepts responses to catch 401 errors for auto-logout, and handles automatic network host failovers.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle 401 Unauthorized Session Expired
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

    // 2. Handle Network Errors (connection refused / unroutable IP) by cycling candidate URLs
    if (!error.response && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      if (currentUrlIndex < candidateUrls.length - 1) {
        currentUrlIndex += 1;
        const nextUrl = candidateUrls[currentUrlIndex];
        
        api.defaults.baseURL = nextUrl;
        originalRequest.baseURL = nextUrl;
        
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
