/**
 * @file MiniMapPreview.jsx
 * @description Ultra-fast, 100% native MapView preview for civic issues using react-native-maps.
 * Zero-webview overhead, instant native hardware rendering, and rock-solid compatibility across Expo versions.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const MiniMapPreview = ({ latitude = 23.0225, longitude = 72.5714, height = 180 }) => {
  const lat = parseFloat(latitude) || 23.0225;
  const lng = parseFloat(longitude) || 72.5714;

  return (
    <View style={[{ height, width: '100%' }, styles.container]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        region={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008
        }}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          pinColor="#F97316"
        />
      </MapView>

      {/* GPS Coordinate Tag Overlay */}
      <View style={styles.badge}>
        <Ionicons name="navigate" size={12} color="#F97316" style={{ marginRight: 4 }} />
        <Text style={styles.badgeText}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F5F0EB',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(253, 250, 247, 0.95)',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1917'
  }
});

export default memo(MiniMapPreview);
