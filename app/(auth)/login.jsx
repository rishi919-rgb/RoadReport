/**
 * @file login.jsx
 * @description User Login screen - Neon Civic OS terminal style.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';

import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Validation and submit states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Performs form validations and attempts authentication.
   */
  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setApiError('');

    let isValid = true;

    const emailRegex = /\S+@\S+\.\S+/;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await authService.login(email.trim().toLowerCase(), password);
      
      if (response.success) {
        await login(response.data, response.data.token);
        router.replace('/(tabs)');
      } else {
        setApiError(response.message || 'Login failed');
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Invalid email or password');
      console.log('Login request failed:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoadingSpinner = isLoading ? (
    <ActivityIndicator size="small" color="#FAFAF9" />
  ) : (
    <Text className="text-textLight text-center font-bold text-base">Sign In</Text>
  );

  const renderApiErrorBanner = apiError ? (
    <View className="bg-dangerLight border border-danger/20 p-3.5 rounded-2xl mb-5 flex-row items-center">
      <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
      <Text className="text-danger text-sm font-semibold flex-1">{apiError}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }} className="px-6">
          
          {/* Header Area */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primaryLight border border-primaryMid rounded-3xl items-center justify-center mb-4 shadow-sm">
              <Ionicons name="shield-checkmark" size={36} color="#F97316" />
            </View>
            <Text className="text-3xl text-textDark font-extrabold tracking-tight text-center">
              Welcome Back
            </Text>
            <Text className="text-textMuted text-sm text-center leading-relaxed mt-1 px-4">
              Sign in to report civic issues and keep your neighborhood safe
            </Text>
          </View>

          {/* Error Banner */}
          {renderApiErrorBanner}

          {/* Form Fields */}
          <View className="mb-6">
            
            {/* Email Field */}
            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Email Address</Text>
            <View className="bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 flex-row items-center">
              <Ionicons name="mail-outline" size={18} color="#A8A29E" style={{ marginRight: 10 }} />
              <TextInput
                className="text-textDark flex-1 text-sm font-medium"
                placeholder="name@example.com"
                placeholderTextColor="#A8A29E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {emailError ? <Text className="text-danger text-xs mt-1.5 font-semibold ml-1">{emailError}</Text> : null}

            {/* Password Field */}
            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mt-4 mb-1.5">Password</Text>
            <View className="bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 flex-row items-center">
              <Ionicons name="lock-closed-outline" size={18} color="#A8A29E" style={{ marginRight: 10 }} />
              <TextInput
                className="text-textDark flex-1 text-sm font-medium"
                placeholder="••••••••••••"
                placeholderTextColor="#A8A29E"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>
            {passwordError ? <Text className="text-danger text-xs mt-1.5 font-semibold ml-1">{passwordError}</Text> : null}
            
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl py-4 items-center mb-6 flex-row justify-center shadow-md"
            style={{
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {renderLoadingSpinner}
          </TouchableOpacity>

          {/* Redirect Link */}
          <View className="flex-row justify-center items-center mt-2">
            <Text className="text-textMuted text-sm font-medium">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm font-bold ml-1">Register</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
