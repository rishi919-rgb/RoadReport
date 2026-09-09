/**
 * @file explore.jsx
 * @description Interactive civic issues map exploration screen - Warm Stone & Amber civic super-app design.
 * Powered by 100% native MapView from react-native-maps for 60fps buttery-smooth hardware rendering.
 */

import React, { useEffect, useContext, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { ReportContext } from '../../context/ReportContext';
import { CATEGORIES, CategoryIcon } from '../../constants/categories';

// Default initial map region fallback (Ahmedabad, India)
const INITIAL_REGION = {
  latitude: 23.0225,
  longitude: 72.5714,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15
};

// Map pin border & badge colors mapped to status pipeline steps
const STATUS_COLORS = {
  reported: '#A8A29E',    // Warm gray
  under_review: '#D97706',// Deep amber
  assigned: '#2563EB',    // Info blue
  in_progress: '#F97316', // Civic amber
  resolved: '#16A34A'     // Forest green
};

export default function ExploreScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { reports, fetchReports, loading } = useContext(ReportContext);

  // Filter & Map display states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('standard'); // 'standard' or 'hybrid'
  const [selectedReport, setSelectedReport] = useState(null);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  // Dynamic offsets for absolute map controls above bottom tab bar and below status bar
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8);
  const bottomOffset = (insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 16 : 8)) + 68;

  // Fetch all civic reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const uniqueCategories = useMemo(() => {
    return CATEGORIES.filter((c, index, self) => 
      index === self.findIndex((t) => t.name === c.name)
    );
  }, []);

  const filteredReports = useMemo(() => {
    if (selectedCategory === 'all') return reports || [];
    return (reports || []).filter((r) => r.category === selectedCategory);
  }, [reports, selectedCategory]);

  useEffect(() => {
    if (filteredReports.length > 0 && mapRef.current) {
      const coords = filteredReports
        .map((r) => {
          if (!r.location || !r.location.latitude || !r.location.longitude) return null;
          const lat = parseFloat(r.location.latitude);
          const lng = parseFloat(r.location.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          return { latitude: lat, longitude: lng };
        })
        .filter(Boolean);

      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 140, right: 60, bottom: 200, left: 60 },
          animated: true
        });
      }
    }
  }, [filteredReports]);

  const handleRecenterMap = () => {
    if (mapRef.current) {
      const coords = filteredReports
        .map((r) => {
          if (!r.location || !r.location.latitude || !r.location.longitude) return null;
          const lat = parseFloat(r.location.latitude);
          const lng = parseFloat(r.location.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          return { latitude: lat, longitude: lng };
        })
        .filter(Boolean);

      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 140, right: 60, bottom: 200, left: 60 },
          animated: true
        });
      } else {
        mapRef.current.animateToRegion(INITIAL_REGION, 800);
      }
    }
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'hybrid' : 'standard'));
  };

  // Analytics Stats Calculations
  const allList = reports || [];
  const totalReportsCount = allList.length;
  const highSeverityCount = allList.filter((r) => r.severity === 'high').length;
  const resolvedCount = allList.filter((r) => r.status === 'resolved').length;
  const inProgressCount = allList.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length;
  const healthScore = Math.max(40, Math.min(98, 100 - (highSeverityCount * 3)));

  const memoizedMarkers = useMemo(() => {
    return filteredReports.map((report) => {
      if (!report.location || !report.location.latitude || !report.location.longitude) {
        return null;
      }
      const lat = parseFloat(report.location.latitude);
      const lng = parseFloat(report.location.longitude);
      if (isNaN(lat) || isNaN(lng)) return null;

      const cat = CATEGORIES.find((c) => c.id === report.category) || CATEGORIES[CATEGORIES.length - 1];
      const statusColor = STATUS_COLORS[report.status] || '#F97316';
      const isSelected = selectedReport?._id === report._id;

      return (
        <Marker
          key={report._id}
          coordinate={{ latitude: lat, longitude: lng }}
          onPress={() => setSelectedReport(report)}
          tracksViewChanges={false}
        >
          {/* Custom Vector Marker Badge */}
          <View className="items-center">
            <View
              style={[
                styles.markerBadge,
                { borderColor: statusColor },
                isSelected ? styles.selectedMarker : null
              ]}
              className={`flex-row items-center px-3 py-1.5 rounded-2xl bg-surface border-2 ${
                isSelected ? 'scale-110 border-primary' : ''
              }`}
            >
              <View
                style={{ backgroundColor: `${statusColor}15` }}
                className="w-7 h-7 rounded-xl items-center justify-center mr-2 border border-cardBorder/60"
              >
                <CategoryIcon categoryId={report.category} size={15} color={statusColor} />
              </View>

              <View className="flex-col">
                <Text className="text-textDark font-bold text-[11px]" numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={{ color: statusColor }} className="text-[9px] font-bold capitalize">
                  • {(report.status || 'reported').replace('_', ' ')}
                </Text>
              </View>
            </View>

            <View
              style={{ borderTopColor: statusColor }}
              className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mt-[-1px]"
            />
          </View>

          <Callout
            onPress={() => router.push(`/reports/${report._id}`)}
            tooltip={false}
          >
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle} numberOfLines={1}>
                {String(report.title || 'Civic Issue')}
              </Text>
              
              <View style={styles.calloutMetaRow}>
                <Text style={styles.calloutCategory}>
                  {cat.name}
                </Text>
                <Text style={[styles.calloutStatus, { color: statusColor }]}>
                  • {(report.status || 'reported').replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <Text style={styles.calloutAddress} numberOfLines={1}>
                {report.location?.address || 'Tagged Location'}
              </Text>

              <Text style={styles.calloutLink}>
                View Full Details ➜
              </Text>
            </View>
          </Callout>
        </Marker>
      );
    }).filter(Boolean);
  }, [filteredReports, selectedReport]);

  const selectedCatDetails = selectedReport ? (
    CATEGORIES.find((c) => c.id === selectedReport.category) || CATEGORIES[CATEGORIES.length - 1]
  ) : null;

  const selectedStatusColor = selectedReport ? (STATUS_COLORS[selectedReport.status] || '#F97316') : '#F97316';

  return (
    <View className="flex-1 bg-background relative">
      
      {/* 100% Native MapView */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={INITIAL_REGION}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={() => setSelectedReport(null)}
      >
        {memoizedMarkers}
      </MapView>

      {/* Category Filter Chips Header Bar */}
      <View style={{ top: topInset + 6 }} className="absolute left-0 right-0 z-20">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            className={`mr-2 px-3.5 py-2 rounded-2xl border flex-row items-center ${
              selectedCategory === 'all'
                ? 'bg-primaryLight border-primaryMid shadow-sm'
                : 'bg-surface border-cardBorder shadow-sm'
            }`}
          >
            <Ionicons name="globe-outline" size={14} color={selectedCategory === 'all' ? '#F97316' : '#A8A29E'} className="mr-1.5" />
            <Text className={`text-xs font-bold ${selectedCategory === 'all' ? 'text-primary' : 'text-textBody'}`}>
              All ({allList.length})
            </Text>
          </TouchableOpacity>

          {uniqueCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const categoryCount = allList.filter((r) => r.category === cat.id).length;
            const bgClass = isSelected ? 'bg-primaryLight border-primaryMid shadow-sm' : 'bg-surface border-cardBorder shadow-sm';
            const textClass = isSelected ? 'text-primary font-bold' : 'text-textBody font-medium';

            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`mr-2 px-3.5 py-2 rounded-2xl border flex-row items-center ${bgClass}`}
              >
                <CategoryIcon categoryId={cat.id} size={14} color={isSelected ? '#F97316' : cat.color} />
                <Text className={`text-xs ml-1.5 ${textClass}`}>
                  {cat.name} ({categoryCount})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Top Right Action Controls */}
      <View style={{ top: topInset + 56 }} className="absolute right-4 z-20 flex-col gap-2">
        <TouchableOpacity
          onPress={() => setAnalyticsVisible(true)}
          className="bg-surface border border-cardBorder px-3.5 py-2 rounded-2xl flex-row items-center shadow-sm"
          style={{ shadowColor: '#1C1917', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }}
        >
          <Ionicons name="analytics" size={15} color="#F97316" style={{ marginRight: 5 }} />
          <Text className="text-textDark text-xs font-bold">Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleMapType}
          className="bg-surface border border-cardBorder px-3.5 py-2 rounded-2xl flex-row items-center justify-center shadow-sm"
          style={{ shadowColor: '#1C1917', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }}
        >
          <Ionicons name={mapType === 'standard' ? 'earth' : 'map-outline'} size={15} color="#44403C" style={{ marginRight: 5 }} />
          <Text className="text-xs font-bold text-textBody">
            {mapType === 'standard' ? 'Satellite' : 'Road'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Count Indicator */}
      <View
        style={{
          bottom: bottomOffset,
          shadowColor: '#1C1917',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3
        }}
        className="absolute left-4 flex-row items-center bg-surface border border-cardBorder px-3.5 py-2 rounded-2xl z-10"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#F97316" className="mr-2" />
        ) : (
          <View className="w-2.5 h-2.5 rounded-full bg-success mr-2" />
        )}
        <Text className="text-textDark text-xs font-bold">
          {filteredReports.length} {filteredReports.length === 1 ? 'Issue' : 'Issues'} nearby
        </Text>
      </View>

      {/* Floating Re-Center Button */}
      <TouchableOpacity
        onPress={handleRecenterMap}
        style={{
          bottom: bottomOffset,
          shadowColor: '#1C1917',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.10,
          shadowRadius: 6,
          elevation: 3
        }}
        className="absolute right-4 bg-surface border border-cardBorder w-11 h-11 rounded-2xl items-center justify-center z-10"
      >
        <Ionicons name="locate" size={20} color="#F97316" />
      </TouchableOpacity>

      {/* Bottom Drawer Preview Card */}
      {selectedReport ? (
        <View
          style={{
            bottom: bottomOffset - 4,
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6
          }}
          className="absolute left-4 right-4 bg-surface border border-cardBorder p-4 rounded-3xl z-30"
        >
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-10 h-10 rounded-2xl bg-surfaceAlt items-center justify-center mr-3 border border-cardBorder">
                <CategoryIcon categoryId={selectedReport.category} size={22} color="#F97316" />
              </View>

              <View className="flex-1">
                <Text numberOfLines={1} className="text-textDark font-bold text-base">
                  {selectedReport.title}
                </Text>
                <Text className="text-textMuted text-xs font-medium">
                  {selectedCatDetails?.name} • Severity: <Text className="text-warning font-bold capitalize">{selectedReport.severity}</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedReport(null)}
              className="bg-surfaceAlt w-8 h-8 rounded-full items-center justify-center border border-cardBorder"
            >
              <Ionicons name="close" size={16} color="#44403C" />
            </TouchableOpacity>
          </View>

          <Text numberOfLines={2} className="text-textBody text-sm leading-relaxed mb-3">
            {selectedReport.description}
          </Text>

          <View className="flex-row justify-between items-center mb-3.5">
            <View className="flex-row items-center flex-1 pr-2">
              <Ionicons name="location-outline" size={14} color="#A8A29E" style={{ marginRight: 4 }} />
              <Text numberOfLines={1} className="text-textMuted text-xs flex-1">
                {selectedReport.location?.address || 'Tagged Location'}
              </Text>
            </View>

            <View
              style={{ backgroundColor: `${selectedStatusColor}15`, borderColor: `${selectedStatusColor}40` }}
              className="px-2.5 py-1 rounded-full border"
            >
              <Text style={{ color: selectedStatusColor }} className="text-[11px] font-bold capitalize">
                {(selectedReport.status || 'reported').replace('_', ' ')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/reports/${selectedReport._id}`)}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl py-3.5 items-center flex-row justify-center shadow-md"
            style={{ shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
          >
            <Text className="text-textLight font-bold text-sm mr-2">View Full Details & Upvote</Text>
            <Ionicons name="arrow-forward" size={16} color="#FAFAF9" />
          </TouchableOpacity>

        </View>
      ) : null}

      {/* Analytics Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={analyticsVisible}
        onRequestClose={() => setAnalyticsVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface border-t border-cardBorder p-6 rounded-t-3xl max-h-[85%]">
            
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-textDark font-extrabold text-xl tracking-tight">Ward Infrastructure Health</Text>
                <Text className="text-textMuted text-xs font-medium">Ahmedabad / Gandhinagar Civic Sector</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAnalyticsVisible(false)}
                className="bg-surfaceAlt w-8 h-8 rounded-full items-center justify-center border border-cardBorder"
              >
                <Ionicons name="close" size={18} color="#44403C" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View className="bg-surfaceAlt border border-cardBorder p-4 rounded-2xl mb-5 flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-1">Infrastructure Health Index</Text>
                  <Text className="text-textDark text-3xl font-extrabold">{healthScore} / 100</Text>
                  <Text className="text-success text-xs font-bold mt-1">✓ Operating normally</Text>
                </View>

                <View className="bg-primaryLight border-2 border-primary w-16 h-16 rounded-2xl items-center justify-center shadow-sm">
                  <Text className="text-primary text-xl font-extrabold">{healthScore}%</Text>
                </View>
              </View>

              <Text className="text-textDark font-bold text-sm mb-3">Live Issue Status</Text>
              <View className="flex-row flex-wrap justify-between gap-3 mb-6">
                <View className="bg-surfaceAlt border border-cardBorder p-3.5 rounded-2xl w-[48%] flex-row items-center justify-between">
                  <Text className="text-textBody text-xs font-medium">Total Reports</Text>
                  <Text className="text-textDark text-lg font-extrabold">{totalReportsCount}</Text>
                </View>
                <View className="bg-dangerLight border border-danger/30 p-3.5 rounded-2xl w-[48%] flex-row items-center justify-between">
                  <Text className="text-danger text-xs font-medium">Critical High</Text>
                  <Text className="text-danger text-lg font-extrabold">{highSeverityCount}</Text>
                </View>
                <View className="bg-infoBlueLight border border-infoBlue/30 p-3.5 rounded-2xl w-[48%] flex-row items-center justify-between">
                  <Text className="text-infoBlue text-xs font-medium">In Progress</Text>
                  <Text className="text-infoBlue text-lg font-extrabold">{inProgressCount}</Text>
                </View>
                <View className="bg-successLight border border-success/30 p-3.5 rounded-2xl w-[48%] flex-row items-center justify-between">
                  <Text className="text-success text-xs font-medium">Resolved</Text>
                  <Text className="text-success text-lg font-extrabold">{resolvedCount}</Text>
                </View>
              </View>

              <View className="bg-primaryLight border border-primaryMid p-4 rounded-2xl mb-6">
                <Text className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Resolution Guarantee</Text>
                <Text className="text-textBody text-xs leading-relaxed font-medium">
                  Average municipal resolution turnaround time: <Text className="text-textDark font-bold">36 Hours</Text>.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setAnalyticsVisible(false)}
                activeOpacity={0.85}
                className="bg-primary rounded-2xl py-4 items-center mb-4 shadow-md"
                style={{ shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
              >
                <Text className="text-textLight font-bold text-base">Back to Map</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  markerBadge: {
    elevation: 6,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  selectedMarker: {
    elevation: 12,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  calloutContainer: {
    padding: 12,
    width: 220,
    backgroundColor: '#FDFAF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D8',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 4,
  },
  calloutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calloutCategory: {
    fontSize: 11,
    color: '#A8A29E',
    fontWeight: '600',
  },
  calloutStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  calloutAddress: {
    fontSize: 11,
    color: '#44403C',
    marginBottom: 6,
  },
  calloutLink: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F97316',
    marginTop: 2,
  },
});
