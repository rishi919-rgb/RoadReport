/**
 * @file index.jsx
 * @description Splash screen. Checks user session token on app launch and redirects.
 * 
 * VIVA QUESTION: "Why check the token here and not inside the tab layout?"
 * ANSWER: Checking the token in the entry splash screen avoids screen flashing and prevents
 * mounting tab components when the user is unauthorized. If we checked it inside the tab layout,
 * unauthorized users might momentarily see home elements before being kicked out to login.
 * Handling session validation at the root splash screen ensures a smooth, secure routing flow.
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Show splash screen elements for a minimum of 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        // Read JWT from device secure storage
        const token = await SecureStore.getItemAsync('roadreport_jwt_token');
        
        if (token) {
          // If token exists, direct user to dashboard
          router.replace('/(tabs)');
        } else {
          // If token is missing, redirect to login page
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Error during splash screen auth check:', error.message);
        router.replace('/(auth)/login');
      }
    };

    checkAuthAndRedirect();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center">
      <View className="items-center">
        {/* Road icon / brand header */}
        <View className="w-20 h-20 bg-primary/10 border border-primary/40 rounded-3xl items-center justify-center mb-4 shadow-xl">
          <Ionicons name="construct" size={40} color="#F97316" />
        </View>
        <Text className="text-4xl text-textLight font-extrabold tracking-wider">
          Road<Text className="text-primary">Report</Text>
        </Text>
        
        {/* Civic project tagline */}
        <Text className="text-gray-400 text-sm text-center px-8 mt-3 font-medium">
          Photograph, locate, and report civic issues for a better community
        </Text>
      </View>

      {/* Loading state indicator */}
      <View className="absolute bottom-20">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-500 text-xs mt-3 text-center">Checking session...</Text>
      </View>
    </SafeAreaView>
  );
}
