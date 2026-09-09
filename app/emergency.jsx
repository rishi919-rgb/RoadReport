/**
 * @file emergency.jsx
 * @description Dedicated Emergency Road Hazard SOS Network Hub.
 * Broadcasts urgent hazards (open manholes, live wires, flash floods) with proximity indicators & WhatsApp sharing.
 */

import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ReportContext } from '../context/ReportContext';
import MiniMapPreview from '../components/MiniMapPreview';

const HAZARD_LABELS = {
  open_manhole: { name: 'Open Manhole', icon: 'warning', color: '#EF4444' },
  live_wire: { name: 'Exposed Live Wire', icon: 'flash', color: '#EAB308' },
  flash_flood: { name: 'Flash Flood / Waterlogging', icon: 'water', color: '#3B82F6' },
  road_cave_in: { name: 'Road Cave-in / Sinkhole', icon: 'alert-circle', color: '#DC2626' },
  fallen_tree: { name: 'Fallen Tree / Blockage', icon: 'leaf', color: '#16A34A' },
  none: { name: 'Critical Road Hazard', icon: 'warning', color: '#F97316' }
};

export default function EmergencyHubScreen() {
  const router = useRouter();
  const { emergencyAlerts, fetchEmergencyAlerts, loading } = useContext(ReportContext);
  const [activeHazardIndex, setActiveHazardIndex] = useState(0);

  useEffect(() => {
    fetchEmergencyAlerts();
  }, []);

  const currentHazard = emergencyAlerts && emergencyAlerts.length > 0 ? emergencyAlerts[activeHazardIndex] : null;

  const handleShareHazard = async (alert) => {
    try {
      const hazardName = HAZARD_LABELS[alert.hazardType]?.name || 'Road Hazard';
      await Share.share({
        message: `🚨 URGENT CIVIC ALERT: ${hazardName} reported at ${alert.location?.address || 'nearby location'}. Please avoid this route! Reported on RoadReport civic network.`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:112'); // National Emergency Number India
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-between">
      
      {/* Top Navbar */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-surface border-b border-cardBorder">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={20} color="#F97316" style={{ marginRight: 4 }} />
          <Text className="text-primary font-bold text-sm">Back</Text>
        </TouchableOpacity>
        <Text className="text-danger font-extrabold text-base tracking-tight">🚨 Emergency Hazard Hub</Text>
        <TouchableOpacity onPress={handleCallHelpline} className="bg-danger px-2.5 py-1 rounded-full flex-row items-center shadow-sm">
          <Ionicons name="call" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text className="text-white text-[11px] font-extrabold">112 SOS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        
        {/* Banner */}
        <View className="bg-danger p-4 rounded-3xl mb-5 shadow-md" style={{ shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
          <View className="flex-row items-center mb-1">
            <Ionicons name="shield-half" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text className="text-white font-extrabold text-sm uppercase tracking-wider">Citizen Safety Warning</Text>
          </View>
          <Text className="text-white/95 text-xs leading-5 font-medium">
            Active road hazards within your sector flagged by fellow citizens. Avoid traveling near these pinpointed locations until field teams clear the hazard.
          </Text>
        </View>

        {/* Live Active Hazards List */}
        <Text className="text-textDark font-extrabold text-base mb-3">Live Active Hazards ({emergencyAlerts.length})</Text>

        {emergencyAlerts.length === 0 ? (
          <View className="bg-surface border border-cardBorder p-8 rounded-3xl items-center justify-center my-2">
            <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
            <Text className="text-textDark font-extrabold text-base mt-3">All Clear! No Active Hazards</Text>
            <Text className="text-textMuted text-xs text-center mt-1">
              There are currently zero life-threatening road hazards reported in your jurisdiction.
            </Text>
          </View>
        ) : (
          emergencyAlerts.map((alert, index) => {
            const hInfo = HAZARD_LABELS[alert.hazardType] || HAZARD_LABELS.none;
            const isSelected = index === activeHazardIndex;

            return (
              <TouchableOpacity
                key={alert._id}
                onPress={() => setActiveHazardIndex(index)}
                activeOpacity={0.9}
                className={`p-4 rounded-3xl border mb-3 ${
                  isSelected ? 'bg-surface border-2 border-danger shadow-md' : 'bg-surface border-cardBorder'
                }`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View style={{ backgroundColor: `${hInfo.color}15`, borderColor: `${hInfo.color}40` }} className="w-10 h-10 rounded-2xl border items-center justify-center mr-3">
                      <Ionicons name={hInfo.icon} size={20} color={hInfo.color} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: hInfo.color }} className="font-extrabold text-[10px] uppercase tracking-wider">
                        {hInfo.name}
                      </Text>
                      <Text numberOfLines={1} className="text-textDark font-bold text-sm">
                        {alert.title}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-dangerLight border border-danger/30 px-2 py-0.5 rounded-full">
                    <Text className="text-danger text-[10px] font-bold">URGENT</Text>
                  </View>
                </View>

                <Text numberOfLines={2} className="text-textBody text-xs leading-relaxed mb-3">
                  {alert.description}
                </Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-cardBorder">
                  <View className="flex-row items-center flex-1 pr-2">
                    <Ionicons name="location-outline" size={13} color="#78716C" style={{ marginRight: 4 }} />
                    <Text numberOfLines={1} className="text-textMuted text-[11px]">
                      {alert.location?.address || 'Near Ward 12'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleShareHazard(alert)}
                    className="bg-primaryLight border border-primaryMid px-3 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons name="share-social-outline" size={13} color="#F97316" style={{ marginRight: 4 }} />
                    <Text className="text-primary font-bold text-xs">Share</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Selected Hazard Map Preview */}
        {currentHazard && currentHazard.location && (
          <View className="mt-4 mb-8 bg-surface border border-cardBorder p-4 rounded-3xl">
            <Text className="text-textDark font-extrabold text-sm mb-1">Hazard GPS Radar</Text>
            <Text className="text-textMuted text-xs mb-3">{currentHazard.location.address}</Text>
            
            <MiniMapPreview
              latitude={currentHazard.location.latitude}
              longitude={currentHazard.location.longitude}
              height={180}
            />
          </View>
        )}

      </ScrollView>

      {/* Floating Report Hazard Button */}
      <View className="p-4 bg-surface border-t border-cardBorder">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/report')}
          activeOpacity={0.85}
          className="bg-danger py-4 rounded-2xl flex-row items-center justify-center shadow-md"
          style={{ shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
        >
          <Ionicons name="alert-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white font-extrabold text-base">Broadcast New Emergency Hazard</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
