/**
 * @file register.jsx
 * @description User Registration screen - Neon Civic OS terminal style.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';

import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error and Loading states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Performs full client-side validations and hits registration API.
   */
  const handleRegister = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setApiError('');

    let isValid = true;

    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }

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

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await authService.register(
        name.trim(),
        email.trim().toLowerCase(),
        password
      );

      if (response.success) {
        await login(response.data, response.data.token);
        router.replace('/(tabs)');
      } else {
        setApiError(response.message || 'Registration failed');
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Email is already registered');
      console.log('Registration request failed:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoadingSpinner = isLoading ? (
    <ActivityIndicator size="small" color="#FAFAF9" />
  ) : (
    <Text className="text-textLight text-center font-bold text-base">Create Account</Text>
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
          
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-primaryLight border border-primaryMid rounded-3xl items-center justify-center mb-4 shadow-sm">
              <Ionicons name="person-add" size={34} color="#F97316" />
            </View>
            <Text className="text-3xl text-textDark font-extrabold tracking-tight text-center">
              Create Account
            </Text>
            <Text className="text-textMuted text-sm text-center leading-relaxed mt-1 px-4">
              Join your community to report issues and earn civic rewards
            </Text>
          </View>

          {/* API Error Banner */}
          {renderApiErrorBanner}

          {/* Form */}
          <View className="mb-6">
            
            {/* Name Input */}
            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Full Name</Text>
            <View className="bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 flex-row items-center">
              <Ionicons name="person-outline" size={18} color="#A8A29E" style={{ marginRight: 10 }} />
              <TextInput
                className="text-textDark flex-1 text-sm font-medium"
                placeholder="Your full name"
                placeholderTextColor="#A8A29E"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>
            {nameError ? <Text className="text-danger text-xs mt-1.5 font-semibold ml-1">{nameError}</Text> : null}

            {/* Email Input */}
            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mt-4 mb-1.5">Email Address</Text>
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

            {/* Password Input */}
            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mt-4 mb-1.5">Password (min 6 characters)</Text>
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

            {/* Confirm Password Input */}
            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mt-4 mb-1.5">Confirm Password</Text>
            <View className="bg-surface border border-cardBorder rounded-2xl px-4 py-3.5 flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={18} color="#A8A29E" style={{ marginRight: 10 }} />
              <TextInput
                className="text-textDark flex-1 text-sm font-medium"
                placeholder="••••••••••••"
                placeholderTextColor="#A8A29E"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            {confirmPasswordError ? (
              <Text className="text-danger text-xs mt-1.5 font-semibold ml-1">{confirmPasswordError}</Text>
            ) : null}

          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleRegister}
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

          {/* Link to Login */}
          <View className="flex-row justify-center items-center mt-2">
            <Text className="text-textMuted text-sm font-medium">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm font-bold ml-1">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
