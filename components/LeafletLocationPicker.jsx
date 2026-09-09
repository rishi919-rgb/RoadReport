/**
 * @file LeafletLocationPicker.jsx
 * @description Full-screen map location picker powered by Leaflet and CartoDB Voyager tiles.
 * Proven, rock-solid map picker from working APK build.
 */

import React, { useRef, useImperativeHandle, forwardRef, useState, memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletLocationPicker = forwardRef(({
  initialCoords = { latitude: 23.0225, longitude: 72.5714 },
  onLocationChange,
  nearbyReports = []
}, ref) => {
  const webViewRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Safety fallback: never leave the screen covered by loading overlay for more than 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const initLat = parseFloat(initialCoords?.latitude) || 23.0225;
  const initLng = parseFloat(initialCoords?.longitude) || 72.5714;

  const safeReports = (nearbyReports || []).map((r) => {
    if (!r || !r.location) return null;
    const lat = parseFloat(r.location.latitude);
    const lng = parseFloat(r.location.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      id: String(r._id || Math.random()),
      title: String(r.title || 'Civic Issue').slice(0, 80),
      lat: lat,
      lng: lng,
      category: r.category || 'other'
    };
  }).filter(Boolean);

  useImperativeHandle(ref, () => ({
    flyTo: (latitude, longitude) => {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng) && webViewRef.current) {
        const js = `window.setPickerLocation && window.setPickerLocation(${lat}, ${lng}); true;`;
        webViewRef.current.injectJavaScript(js);
      }
    }
  }));

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
            -webkit-user-select: none;
            user-select: none;
          }
          .leaflet-control-zoom {
            border: 1px solid #E8E0D8 !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 6px rgba(28,25,23,0.08) !important;
          }
          .leaflet-control-zoom a {
            background-color: #FFFFFF !important;
            color: #1C1917 !important;
          }
          .amber-pin {
            width: 38px;
            height: 50px;
            cursor: pointer;
            filter: drop-shadow(0 4px 6px rgba(28,25,23,0.25));
            transition: transform 0.15s ease;
          }
          .amber-pin:active {
            transform: scale(1.15);
          }
          .nearby-badge {
            width: 26px;
            height: 26px;
            background: #FFFFFF;
            border: 2px solid #F97316;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          .nearby-dot {
            width: 8px;
            height: 8px;
            background: #F97316;
            border-radius: 50%;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js" onerror="this.onerror=null;this.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';"></script>
        <script>
          (function() {
            var map, pickerMarker;
            var retries = 0;

            function checkReady() {
              if (typeof window.L !== 'undefined' && window.L.map) {
                initMap();
              } else if (retries < 120) {
                retries++;
                setTimeout(checkReady, 50);
              } else {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                }
              }
            }

            function initMap() {
              try {
                map = L.map('map', {
                  center: [${initLat}, ${initLng}],
                  zoom: 16,
                  zoomControl: false,
                  tap: true,
                  attributionControl: false
                });

                var voyagerLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                  subdomains: 'abcd',
                  maxZoom: 19
                }).addTo(map);

                voyagerLayer.on('tileerror', function() {
                  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                });

                // Draggable Amber Pin SVG
                var pinSvg = '<svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                  '<defs>' +
                  '<linearGradient id="pinG" x1="0" y1="0" x2="0" y2="50" gradientUnits="userSpaceOnUse">' +
                  '<stop stop-color="#FB923C"/>' +
                  '<stop offset="1" stop-color="#EA580C"/>' +
                  '</linearGradient>' +
                  '</defs>' +
                  '<path d="M19 0C8.50659 0 0 8.50659 0 19C0 31 19 50 19 50C19 50 38 31 38 19C38 8.50659 29.4934 0 19 0Z" fill="url(#pinG)"/>' +
                  '<circle cx="19" cy="18" r="7" fill="#FFFFFF"/>' +
                  '<circle cx="19" cy="18" r="3.5" fill="#EA580C"/>' +
                  '</svg>';

                var pinIcon = L.divIcon({
                  html: pinSvg,
                  className: 'amber-pin',
                  iconSize: [38, 50],
                  iconAnchor: [19, 50]
                });

                pickerMarker = L.marker([${initLat}, ${initLng}], {
                  icon: pinIcon,
                  draggable: true,
                  autoPan: true
                }).addTo(map);

                function sendCoords(lat, lng) {
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'LOCATION_CHANGED',
                      latitude: lat,
                      longitude: lng
                    }));
                  }
                }

                pickerMarker.on('dragend', function(e) {
                  var pos = pickerMarker.getLatLng();
                  sendCoords(pos.lat, pos.lng);
                });

                map.on('click', function(e) {
                  pickerMarker.setLatLng(e.latlng);
                  sendCoords(e.latlng.lat, e.latlng.lng);
                });

                var nearby = ${JSON.stringify(safeReports)};
                var nearbyIcon = L.divIcon({
                  html: '<div class="nearby-badge"><div class="nearby-dot"></div></div>',
                  className: 'nearby-marker',
                  iconSize: [26, 26],
                  iconAnchor: [13, 13]
                });

                nearby.forEach(function(item) {
                  if (item.lat && item.lng) {
                    L.marker([item.lat, item.lng], { icon: nearbyIcon })
                      .addTo(map)
                      .bindPopup('<b>' + item.title + '</b><br><span style="color:#F97316;font-size:11px;">Existing Report</span>');
                  }
                });

                setTimeout(function() { if (map) map.invalidateSize(); }, 150);
                setTimeout(function() { if (map) map.invalidateSize(); }, 500);

                window.addEventListener('resize', function() {
                  if (map) map.invalidateSize();
                });

                window.setPickerLocation = function(lat, lng) {
                  if (pickerMarker) pickerMarker.setLatLng([lat, lng]);
                  if (map) map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
                  sendCoords(lat, lng);
                };

                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                }
              } catch (err) {
                console.error('Picker init error:', err);
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                }
              }
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', checkReady);
            } else {
              checkReady();
            }
          })();
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setMapLoaded(true);
      } else if (data.type === 'LOCATION_CHANGED' && onLocationChange) {
        onLocationChange({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://cdnjs.cloudflare.com' }}
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
        onMessage={handleMessage}
        onLoadEnd={() => setMapLoaded(true)}
        onError={() => setMapLoaded(true)}
        style={styles.webView}
      />

      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#F5F0EB'
  },
  webView: {
    flex: 1,
    backgroundColor: '#F5F0EB'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5
  }
});

export default memo(LeafletLocationPicker);
