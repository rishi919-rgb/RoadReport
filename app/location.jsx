/**
 * @file location.jsx
 * @description Full-screen map location picker screen - Warm Stone & Amber civic super-app design.
 * Uses LeafletLocationPicker powered by CartoDB Voyager tiles for rock-solid Android compatibility.
 */

import React, { useEffect, useRef, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import useLocation from '../hooks/useLocation';
import { ReportContext } from '../context/ReportContext';
import LeafletLocationPicker from '../components/LeafletLocationPicker';

// Default fallback coordinates (e.g. Ahmedabad, India)
const DEFAULT_COORDS = {
  latitude: 23.0225,
  longitude: 72.5714
};

export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { reports } = useContext(ReportContext);
  const pickerRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  const {
    location,
    address,
    loading,
    setLocation,
    setAddress,
    getCurrentLocation
  } = useLocation();

  const activeCoords = location || {
    latitude: params.latitude ? parseFloat(params.latitude) : DEFAULT_COORDS.latitude,
    longitude: params.longitude ? parseFloat(params.longitude) : DEFAULT_COORDS.longitude
  };

  useEffect(() => {
    const initLocation = async () => {
      const res = await getCurrentLocation();
      if (res && res.coords) {
        setLocation(res.coords);
        if (pickerRef.current) {
          pickerRef.current.flyTo(res.coords.latitude, res.coords.longitude);
        }
      }
    };

    initLocation();
  }, []);

  const handleLocationChange = async (coords) => {
    setLocation(coords);
    try {
      const geocode = await Location.reverseGeocodeAsync(coords);
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addressParts = [
          place.name || place.streetNumber,
          place.street,
          place.district || place.subregion,
          place.city,
          place.region,
          place.postalCode
        ].filter(Boolean);

        setAddress(addressParts.join(', ') || 'Unknown Address');
      } else {
        setAddress('Address could not be determined');
      }
    } catch (e) {
      console.error('Drag reverse geocoding failed:', e.message);
      setAddress('Address could not be determined');
    }
  };

  const handleSnapToCurrent = async () => {
    setIsLocating(true);
    try {
      const res = await getCurrentLocation();
      if (res && res.coords) {
        setLocation(res.coords);
        if (pickerRef.current) {
          pickerRef.current.flyTo(res.coords.latitude, res.coords.longitude);
        }
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirmLocation = () => {
    if (!location && !activeCoords) return;
    const finalCoords = location || activeCoords;
    router.navigate({
      pathname: '/(tabs)/report',
      params: {
        ...params,
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
        address: address || 'Selected Location'
      }
    });
  };

  const renderConfirmButtonText = loading ? (
    <ActivityIndicator size="small" color="#FFFFFF" />
  ) : (
    <Text className="text-textLight text-center font-bold text-base">Confirm Location</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-background justify-between">
      
      {/* Top Header Navbar */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-surface border-b border-cardBorder">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-bold text-sm">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-textDark font-bold text-base">Pin Location</Text>
        <View className="w-12" />
      </View>

      {/* Map Area */}
      <View style={{ flex: 1 }} className="flex-1 bg-surface relative">
        <LeafletLocationPicker
          ref={pickerRef}
          initialCoords={activeCoords}
          onLocationChange={handleLocationChange}
          nearbyReports={reports}
        />

        <TouchableOpacity
          onPress={handleSnapToCurrent}
          disabled={isLocating}
          className="absolute bottom-6 right-6 bg-surface border border-cardBorder w-12 h-12 rounded-2xl items-center justify-center z-10"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 4
          }}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Ionicons name="locate" size={22} color="#F97316" />
          )}
        </TouchableOpacity>
      </View>

      {/* Details & Submit Panel */}
      <View
        className="bg-surface border-t border-cardBorder px-5 py-4"
        style={{
          shadowColor: '#1C1917',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 4
        }}
      >
        <Text className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-1">Detected Address</Text>
        <Text numberOfLines={2} className="text-textDark font-medium text-sm mb-4 h-10 leading-5">
          {address || 'Locating GPS... drag marker pin to adjust'}
        </Text>

        <TouchableOpacity
          onPress={handleConfirmLocation}
          disabled={loading || (!location && !activeCoords)}
          className={`py-3.5 rounded-2xl items-center ${
            !location && !activeCoords ? 'bg-cardBorder opacity-60' : 'bg-primary active:opacity-90'
          }`}
          style={location || activeCoords ? {
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 3
          } : undefined}
        >
          {renderConfirmButtonText}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
