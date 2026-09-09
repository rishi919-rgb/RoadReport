/**
 * @file EmergencySOSBanner.jsx
 * @description Pulsating high-priority road hazard emergency alert banner.
 * Alerts citizens to life-threatening conditions (open manholes, live wires, flash floods) within their area.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EmergencySOSBanner({ alerts = [] }) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (alerts.length > 0) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [alerts.length]);

  if (!alerts || alerts.length === 0) return null;

  const activeAlert = alerts[0];
  const hazardLabel = activeAlert.hazardType
    ? activeAlert.hazardType.replace('_', ' ').toUpperCase()
    : 'ROAD HAZARD';

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="mb-3">
      <TouchableOpacity
        onPress={() => router.push('/emergency')}
        activeOpacity={0.9}
        className="bg-danger/10 border-2 border-danger rounded-2xl p-3.5 flex-row items-center justify-between shadow-sm"
        style={{
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 3
        }}
      >
        <View className="flex-row items-center flex-1 pr-2">
          <View className="w-9 h-9 rounded-xl bg-danger items-center justify-center mr-3 shadow-sm">
            <Ionicons name="warning" size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-danger font-extrabold text-[11px] tracking-wider uppercase mr-2">
                🚨 SOS HAZARD ALERT
              </Text>
              <View className="bg-danger px-1.5 py-0.2 rounded">
                <Text className="text-white text-[9px] font-bold uppercase">{hazardLabel}</Text>
              </View>
            </View>
            <Text numberOfLines={1} className="text-textDark font-bold text-xs mt-0.5">
              {activeAlert.title}
            </Text>
            <Text numberOfLines={1} className="text-textMuted text-[10px]">
              {activeAlert.location?.address || 'Near your sector'} • Avoid this route
            </Text>
          </View>
        </View>

        <View className="bg-danger px-2.5 py-1.5 rounded-xl items-center justify-center flex-row">
          <Text className="text-white font-bold text-xs mr-1">View Hub</Text>
          <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
