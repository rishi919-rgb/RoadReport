/**
 * @file AuthContext.jsx
 * @description Provides global state for user authentication.
 * Stores user data and authorization tokens, persisting the session using expo-secure-store.
 */

import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { registerLogoutCallback } from '../services/api';
import { getProfile, updateProfile, redeemPerk, convertPoints } from '../services/authService';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Context object
export const AuthContext = createContext({});

// Hardcode storage keys
const TOKEN_KEY = 'roadreport_jwt_token';
const ROLE_KEY = 'roadreport_active_role';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('citizen'); // 'citizen' | 'authority'

  // Register logout callback for interceptor
  useEffect(() => {
    registerLogoutCallback(logout);
  }, []);

  // Initialize and check for existing token on app mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Read token from secure device storage
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        
        if (storedToken) {
          setToken(storedToken);
          // Use getProfile (which uses global api instance with adaptive network failovers)
          const response = await getProfile();
          
          if (response && response.success) {
            setUser(response.data);
          } else {
            // Token is invalid, clean up
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }

        const savedRole = await AsyncStorage.getItem(ROLE_KEY);
        if (savedRole) {
          setCurrentRole(savedRole);
        }
      } catch (e) {
        console.log('No token found or validation failed:', e.message);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  /**
   * Log in user, store token securely, and update state.
   * @param {Object} userData - User information returned from backend.
   * @param {string} userToken - Signed JWT from backend.
   */
  const login = async (userData, userToken) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, userToken);
      setToken(userToken);
      setUser(userData);
    } catch (e) {
      console.error('Error saving authentication session:', e.message);
    }
  };

  /**
   * Updates profile data in backend and syncs global AuthContext user state.
   * @param {Object} profileData - User profile fields (name, phone, ward).
   * @returns {Promise<Object>} API result.
   */
  const updateUserProfile = async (profileData) => {
    try {
      const response = await updateProfile(profileData);
      if (response && response.success) {
        setUser((prev) => ({ ...prev, ...response.data }));
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message || 'Failed to update profile' };
    } catch (e) {
      return { success: false, message: e.message || 'Profile update failed' };
    }
  };

  /**
   * Redeems a municipal perk and updates local user credits & vouchers.
   * @param {Object} perkData - Perk details (perkId, title, cost).
   * @returns {Promise<Object>} API response payload.
   */
  const redeemUserPerk = async (perkData) => {
    try {
      const response = await redeemPerk(perkData);
      if (response && response.success) {
        setUser((prev) => ({
          ...prev,
          civicCredits: response.data.civicCredits,
          redeemedPerks: [response.data.voucher, ...(prev.redeemedPerks || [])]
        }));
        return { success: true, voucher: response.data.voucher, credits: response.data.civicCredits };
      }
      return { success: false, message: response.message || 'Perk redemption failed' };
    } catch (e) {
      return { success: false, message: e.message || 'Redemption error' };
    }
  };

  /**
   * Converts user Karma / Reputation Points into Civic Credits (CC).
   * @param {number} pointsToConvert - Number of points to convert.
   * @returns {Promise<Object>} API response payload.
   */
  const convertUserPoints = async (pointsToConvert) => {
    try {
      const response = await convertPoints(pointsToConvert);
      if (response && response.success) {
        setUser((prev) => ({
          ...prev,
          reputationPoints: response.data.reputationPoints,
          civicCredits: response.data.civicCredits
        }));
        return { success: true, data: response.data, message: response.message };
      }
      return { success: false, message: response.message || 'Conversion failed' };
    } catch (e) {
      return { success: false, message: e.message || 'Conversion error' };
    }
  };

  /**
   * Log out user, delete token securely, and reset state.
   */
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Error destroying authentication session:', e.message);
    }
  };

  /**
   * Switches user mode between citizen and municipal authority.
   * @param {string} [role] - Target role or toggles if empty.
   */
  const switchRole = async (role) => {
    try {
      const nextRole = role || (currentRole === 'citizen' ? 'authority' : 'citizen');
      setCurrentRole(nextRole);
      await AsyncStorage.setItem(ROLE_KEY, nextRole);
      return nextRole;
    } catch (e) {
      console.error('Error switching role:', e);
      return currentRole;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      updateUserProfile,
      redeemUserPerk,
      convertUserPoints,
      loading,
      setUser,
      currentRole,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
