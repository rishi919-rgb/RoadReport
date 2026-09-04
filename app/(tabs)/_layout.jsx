import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic bottom tab bar height incorporating safe area inset
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 10);
  const tabHeight = 54 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316', // Primary Amber
        tabBarInactiveTintColor: '#A8A29E', // Text Muted
        tabBarStyle: {
          backgroundColor: '#FDFAF7', // Surface — Warm White
          borderTopWidth: 1,
          borderTopColor: '#E8E0D8', // Card Border
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 16,
          shadowColor: '#78350F', // Warm amber-tinted shadow
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        }
      }}
    >
      {/* Home Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
          )
        }}
      />

      {/* Explore Map Tab */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={20} color={color} />
          )
        }}
      />

      {/* Report Issue Tab */}
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={focused ? '#F97316' : color} />
          )
        }}
      />

      {/* My Reports List Tab */}
      <Tabs.Screen
        name="my-reports"
        options={{
          title: 'My Reports',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={20} color={color} />
          )
        }}
      />

      {/* User Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
