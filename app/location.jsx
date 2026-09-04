/**
 * @file location.jsx
 * @description Full-screen map location picker screen - Warm Stone & Amber civic super-app design.
 */

import React, { useEffect, useState, useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import useLocation from '../hooks/useLocation';
import { ReportContext } from '../context/ReportContext';
import { CATEGORIES, CategoryIcon } from '../constants/categories';

// Default fallback coordinates (e.g. Ahmedabad, India)
const DEFAULT_COORDS = {
  latitude: 23.0225,
  longitude: 72.5714,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015
};

export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { reports } = useContext(ReportContext);
  
  const {
    location,
    address,
    loading,
    setLocation,
    setAddress,
    getCurrentLocation
  } = useLocation();

  const [region, setRegion] = useState({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    latitudeDelta: DEFAULT_COORDS.latitudeDelta,
    longitudeDelta: DEFAULT_COORDS.longitudeDelta
  });

  useEffect(() => {
    const initLocation = async () => {
      const res = await getCurrentLocation();
      if (res && res.coords) {
        setRegion({
          latitude: res.coords.latitude,
          longitude: res.coords.longitude,
          latitudeDelta: DEFAULT_COORDS.latitudeDelta,
          longitudeDelta: DEFAULT_COORDS.longitudeDelta
        });
      }
    };
    
    initLocation();
  }, []);

  const handleMarkerDragEnd = async (coords) => {
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
    const res = await getCurrentLocation();
    if (res && res.coords) {
      setRegion({
        latitude: res.coords.latitude,
        longitude: res.coords.longitude,
        latitudeDelta: DEFAULT_COORDS.latitudeDelta,
        longitudeDelta: DEFAULT_COORDS.longitudeDelta
      });
    }
  };

  const handleConfirmLocation = () => {
    if (!location) return;
    router.navigate({
      pathname: '/(tabs)/report',
      params: {
        ...params,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address
      }
    });
  };

  const nearbyIssueMarkers = useMemo(() => {
    return reports.map((rep) => {
      if (!rep.location || !rep.location.latitude || !rep.location.longitude) return null;

      return (
        <Marker
          key={`nearby_${rep._id}`}
          coordinate={{
            latitude: parseFloat(rep.location.latitude),
            longitude: parseFloat(rep.location.longitude)
          }}
          opacity={0.85}
          tracksViewChanges={false}
        >
          <View
            className="bg-surface border border-cardBorder w-8 h-8 rounded-xl items-center justify-center"
            style={{
              shadowColor: '#1C1917',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2
            }}
          >
            <CategoryIcon categoryId={rep.category} size={16} color="#F97316" />
          </View>
          <Callout tooltip={false}>
            <View style={{ padding: 8, width: 160, backgroundColor: '#FDFAF7', borderRadius: 12, borderWidth: 1, borderColor: '#E8E0D8' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1C1917' }} numberOfLines={1}>
                {String(rep.title || 'Civic Issue')}
              </Text>
              <Text style={{ fontSize: 10, color: '#F97316', fontWeight: '700', marginTop: 2 }}>
                Existing Report
              </Text>
            </View>
          </Callout>
        </Marker>
      );
    }).filter(Boolean);
  }, [reports]);

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
      <View className="flex-1 bg-surface justify-center items-center">
        <MapView
          style={{ width: '100%', height: '100%' }}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {nearbyIssueMarkers}
          {location ? (
            <Marker
              coordinate={location}
              draggable
              onDragEnd={(e) => handleMarkerDragEnd(e.nativeEvent.coordinate)}
              title="Drag me to the issue"
              description={address || ''}
              pinColor="#F97316"
            />
          ) : null}
        </MapView>

        <TouchableOpacity
          onPress={handleSnapToCurrent}
          className="absolute bottom-6 right-6 bg-surface border border-cardBorder w-12 h-12 rounded-2xl items-center justify-center z-10"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 4
          }}
        >
          <Ionicons name="locate" size={22} color="#F97316" />
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
          disabled={loading || !location}
          className={`py-3.5 rounded-2xl items-center ${
            !location ? 'bg-cardBorder opacity-60' : 'bg-primary active:opacity-90'
          }`}
          style={location ? {
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
