/**
 * @file useAuth.js
 * @description Custom hook that provides easy access to the AuthContext state.
 * Simplifies consuming authentication properties in screens and components.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth hook returns the current authentication state and actions.
 * @returns {Object} Context value including user, token, login, logout, and loading state.
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
