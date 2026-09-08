/**
 * @file _layout.jsx
 * @description Root layout of the application.
 * Wraps the app in AuthProvider and ReportProvider contexts, and manages offline sync.
 * 
 * VIVA QUESTION: "Why Expo Router instead of React Navigation?"
 * ANSWER: React Navigation requires manual routing setup where you write custom NavigationContainers,
 * declare stack/tab screens in Javascript variables, and handle deep linking configs manually.
 * Expo Router is a file-based router built on top of React Navigation. It maps the directories in
 * `/app` directly to navigation structures, making configuration automated, self-documenting,
 * and aligned with modern web framework routing patterns (like Next.js/Remix).
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { ReportProvider } from '../context/ReportContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reportService from '../services/reportService';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function RootLayout() {
  
  // Non-blocking pre-warming ping to ensure Render container is spinning up immediately on app start
  useEffect(() => {
    axios.get('https://roadreport-plu6.onrender.com/health', { timeout: 45000 })
      .then(() => console.log('Render backend pre-warmed successfully 🚀'))
      .catch((err) => console.log('Pre-warming ping sent (server spinning up):', err.message));
  }, []);

  // Attempt to sync offline report queue on application launch
  useEffect(() => {
    const syncOfflineQueue = async () => {
      try {
        // Only attempt sync if we have a valid stored token (user is authenticated)
        const token = await SecureStore.getItemAsync('roadreport_jwt_token');
        if (!token) return;

        const queueJson = await AsyncStorage.getItem('roadreport_pending_reports');
        if (!queueJson) return;

        const pendingReports = JSON.parse(queueJson);
        if (pendingReports.length === 0) return;

        console.log(`Found ${pendingReports.length} pending offline reports. Initiating upload...`);
        const remainingQueue = [];

        for (const report of pendingReports) {
          try {
            // Track sync attempts to discard unresolvable reports
            const attempts = (report._syncAttempts || 0) + 1;
            if (attempts > 3) {
              console.log(`Discarding unresolvable offline report: "${report.title || 'Untitled'}"`);
              continue;
            }

            const { _id, _syncAttempts, ...reportData } = report;
            const res = await reportService.createReport(reportData);
            
            if (res && res.success) {
              console.log(`Successfully synced pending report: "${reportData.title || 'Untitled'}"`);
            } else {
              remainingQueue.push({ ...report, _syncAttempts: attempts });
            }
          } catch (err) {
            const attempts = (report._syncAttempts || 0) + 1;
            if (attempts <= 3) {
              remainingQueue.push({ ...report, _syncAttempts: attempts });
            }
          }
        }

        // Update queue in storage with remaining reports
        await AsyncStorage.setItem('roadreport_pending_reports', JSON.stringify(remainingQueue));
      } catch (e) {
        console.error('Error during offline report sync process:', e.message);
      }
    };

    syncOfflineQueue();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#F5F0EB" />
      <AuthProvider>
        <ReportProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F0EB' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="reports/[id]" />
            <Stack.Screen name="rewards" />
            <Stack.Screen name="camera" />
            <Stack.Screen name="location" />
          </Stack>
        </ReportProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

