/**
 * @file LeafletExploreMap.jsx
 * @description Interactive Leaflet exploration map for civic issues with dual tile support (Road & Satellite).
 * Replaces native Google Maps with a reliable, API-key-free Leaflet implementation.
 */

import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect, memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletExploreMap = forwardRef(({
  reports = [],
  selectedCategory = 'all',
  mapType = 'standard',
  onSelectReport,
  onDeselect
}, ref) => {
  const webViewRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Serialize and sanitize reports for WebView
  const safeReports = reports.map((r) => {
    if (!r.location || !r.location.latitude || !r.location.longitude) return null;
    return {
      id: r._id,
      title: String(r.title || 'Civic Issue').replace(/'/g, "\\'"),
      description: String(r.description || '').replace(/'/g, "\\'"),
      category: r.category || 'other',
      status: r.status || 'reported',
      severity: r.severity || 'medium',
      address: String(r.location.address || '').replace(/'/g, "\\'"),
      lat: parseFloat(r.location.latitude),
      lng: parseFloat(r.location.longitude)
    };
  }).filter(Boolean);

  // Imperative handle for parent screen controls
  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript('window.fitAllMarkers(); true;');
      }
    },
    setLayer: (type) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.setMapLayer('${type}'); true;`);
      }
    },
    filterCategory: (catId) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.filterCategory('${catId}'); true;`);
      }
    },
    flyTo: (lat, lng) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.flyToCoords(${lat}, ${lng}); true;`);
      }
    }
  }));

  // Update map layer when mapType prop changes
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setMapLayer('${mapType}'); true;`);
    }
  }, [mapType, mapLoaded]);

  // Update category filter when selectedCategory prop changes
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.filterCategory('${selectedCategory}'); true;`);
    }
  }, [selectedCategory, mapLoaded]);

  // Update markers when reports change
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      const serialized = JSON.stringify(safeReports);
      webViewRef.current.injectJavaScript(`window.updateReports(${serialized}); true;`);
    }
  }, [reports, mapLoaded]);

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
          .custom-marker {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          }
          .marker-card {
            display: flex;
            align-items: center;
            padding: 4px 8px;
            background: #FDFAF7;
            border-radius: 14px;
            border: 2px solid #F97316;
            box-shadow: 0 4px 10px rgba(28, 25, 23, 0.2);
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            transition: transform 0.15s ease;
          }
          .marker-card:active {
            transform: scale(1.1);
          }
          .marker-icon-box {
            width: 22px;
            height: 22px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 6px;
          }
          .marker-title {
            font-size: 11px;
            font-weight: 700;
            color: #1C1917;
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .marker-arrow {
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #F97316;
            margin-top: -1px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js" onerror="this.onerror=null;this.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';"></script>
        <script>
          (function() {
            var map, voyagerLayer, satelliteLayer, currentLayer;
            var markers = [];
            var allReports = ${JSON.stringify(safeReports)};
            var currentCategory = '${selectedCategory}';

            var STATUS_COLORS = {
              'reported': '#A8A29E',
              'under_review': '#D97706',
              'assigned': '#2563EB',
              'in_progress': '#F97316',
              'resolved': '#16A34A'
            };

            var CATEGORY_ICONS = {
              'road': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.44 21L14 3h-4L4.56 21h3.31l1.53-5h5.2l1.53 5h3.31zM11 13l1-3.33L13 13h-2z"/></svg>',
              'pothole': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
              'water': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              'streetlight': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>',
              'garbage': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
              'traffic': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
              'other': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
            };

            function initMap() {
              map = L.map('map', {
                center: [23.0225, 72.5714],
                zoom: 13,
                zoomControl: false,
                attributionControl: false,
                tap: true
              });

              voyagerLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20
              });

              satelliteLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20
              });

              currentLayer = voyagerLayer;
              currentLayer.addTo(map);

              map.on('click', function(e) {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT' }));
                }
              });

              renderMarkers();

              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
              }
            }

            function renderMarkers() {
              // Clear old markers
              markers.forEach(function(m) { map.removeLayer(m); });
              markers = [];

              var bounds = [];

              allReports.forEach(function(report) {
                if (!report.lat || !report.lng) return;
                if (currentCategory !== 'all' && report.category !== currentCategory) return;

                var color = STATUS_COLORS[report.status] || '#F97316';
                var iconSvg = CATEGORY_ICONS[report.category] || CATEGORY_ICONS['other'];

                var html = '<div class="custom-marker">' +
                  '<div class="marker-card" style="border-color:' + color + ';">' +
                  '<div class="marker-icon-box" style="background:' + color + '15; color:' + color + ';">' +
                  iconSvg +
                  '</div>' +
                  '<div class="marker-title">' + report.title + '</div>' +
                  '</div>' +
                  '<div class="marker-arrow" style="border-top-color:' + color + ';"></div>' +
                  '</div>';

                var icon = L.divIcon({
                  html: html,
                  className: '',
                  iconSize: [120, 36],
                  iconAnchor: [60, 36]
                });

                var marker = L.marker([report.lat, report.lng], { icon: icon }).addTo(map);

                marker.on('click', function(e) {
                  L.DomEvent.stopPropagation(e);
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'SELECT_REPORT',
                      id: report.id
                    }));
                  }
                });

                markers.push(marker);
                bounds.push([report.lat, report.lng]);
              });

              if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
              }
            }

            window.setMapLayer = function(type) {
              if (type === 'hybrid' || type === 'satellite') {
                if (currentLayer !== satelliteLayer) {
                  map.removeLayer(currentLayer);
                  satelliteLayer.addTo(map);
                  currentLayer = satelliteLayer;
                }
              } else {
                if (currentLayer !== voyagerLayer) {
                  map.removeLayer(currentLayer);
                  voyagerLayer.addTo(map);
                  currentLayer = voyagerLayer;
                }
              }
            };

            window.filterCategory = function(catId) {
              currentCategory = catId;
              renderMarkers();
            };

            window.updateReports = function(newReports) {
              allReports = newReports;
              renderMarkers();
            };

            window.fitAllMarkers = function() {
              if (markers.length > 0) {
                var group = L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.15));
              } else {
                map.setView([23.0225, 72.5714], 13);
              }
            };

            window.flyToCoords = function(lat, lng) {
              map.flyTo([lat, lng], 16, { duration: 0.8 });
            };

            initMap();
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
      } else if (data.type === 'SELECT_REPORT') {
        const found = reports.find((r) => r._id === data.id);
        if (found && onSelectReport) {
          onSelectReport(found);
        }
      } else if (data.type === 'DESELECT' && onDeselect) {
        onDeselect();
      }
    } catch (e) {
      console.error('Failed to parse ExploreMap message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
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
        onMessage={handleMessage}
        onLoadEnd={() => setMapLoaded(true)}
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
    ...StyleSheet.absoluteFillObject,
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

export default memo(LeafletExploreMap);
