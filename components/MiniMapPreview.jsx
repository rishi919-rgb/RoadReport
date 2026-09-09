/**
 * @file MiniMapPreview.jsx
 * @description Ultra-fast, lightweight Leaflet map preview using CartoDB Voyager tiles.
 * Provides a reliable, crystal-clear map preview without relying on external static image servers.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const MiniMapPreview = ({ latitude = 23.0225, longitude = 72.5714, height = 180 }) => {
  const lat = parseFloat(latitude) || 23.0225;
  const lng = parseFloat(longitude) || 72.5714;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #F5F0EB;
            overflow: hidden;
          }
          .leaflet-control-container { display: none !important; }
          .amber-pin {
            width: 32px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js" onerror="this.onerror=null;this.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';"></script>
        <script>
          try {
            var map = L.map('map', {
              center: [${lat}, ${lng}],
              zoom: 16,
              zoomControl: false,
              dragging: false,
              touchZoom: false,
              doubleClickZoom: false,
              scrollWheelZoom: false,
              boxZoom: false,
              keyboard: false,
              attributionControl: false
            });

            L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              maxZoom: 20
            }).addTo(map);

            var pinSvg = '<svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M15 0C6.71573 0 0 6.71573 0 15C0 24.5 15 40 15 40C15 40 30 24.5 30 15C30 6.71573 23.2843 0 15 0Z" fill="#F97316"/>' +
              '<circle cx="15" cy="14" r="5.5" fill="#FFFFFF"/>' +
              '<circle cx="15" cy="14" r="2.5" fill="#EA580C"/>' +
              '</svg>';

            var icon = L.divIcon({
              html: pinSvg,
              className: 'amber-pin',
              iconSize: [30, 40],
              iconAnchor: [15, 40]
            });

            L.marker([${lat}, ${lng}], { icon: icon }).addTo(map);
          } catch (e) {
            console.error('MiniMap error:', e);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[{ height, width: '100%' }, styles.container]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        cacheEnabled={true}
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        style={{ flex: 1, backgroundColor: '#F5F0EB' }}
      />
      
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
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F0EB',
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(253, 250, 247, 0.95)',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  badgeText: {
    color: '#1C1917',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default memo(MiniMapPreview);
