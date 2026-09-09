/**
 * @file index.jsx
 * @description Home dashboard screen - Warm Stone & Amber civic super-app design.
 * Features Citizen & Municipal Authority role switching, 36h SLA monitoring, and Emergency Road Hazard SOS alerts.
 */

import React, { useEffect, useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import useAuth from '../../hooks/useAuth';
import { ReportContext } from '../../context/ReportContext';
import ReportCard from '../../components/ReportCard';
import EmergencySOSBanner from '../../components/EmergencySOSBanner';
import AuthorityDashboardView from '../../components/AuthorityDashboardView';

export default function HomeDashboard() {
  const router = useRouter();
  const { user, currentRole, switchRole } = useAuth();
  const {
    reports,
    loading,
    error,
    fetchReports,
    emergencyAlerts,
    fetchEmergencyAlerts,
    assignReportWorkOrder,
    resolveReportProof
  } = useContext(ReportContext);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReports({ limit: 15 });
    if (fetchEmergencyAlerts) {
      fetchEmergencyAlerts();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchReports({ limit: 15 }),
      fetchEmergencyAlerts ? fetchEmergencyAlerts() : Promise.resolve()
    ]);
    setRefreshing(false);
  };

  const recentReports = reports.slice(0, 8);

  const navigateToDetails = (id) => {
    router.push(`/reports/${id}`);
  };

  const renderRoleToggle = () => (
    <View className="flex-row items-center justify-between bg-surfaceAlt border border-cardBorder p-1 rounded-2xl mb-4">
      <TouchableOpacity
        onPress={() => switchRole('citizen')}
        activeOpacity={0.8}
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
          currentRole === 'citizen' ? 'bg-primary shadow-sm' : 'bg-transparent'
        }`}
      >
        <Ionicons name="person" size={14} color={currentRole === 'citizen' ? '#FFFFFF' : '#A8A29E'} />
        <Text
          className={`ml-1.5 text-xs font-extrabold ${
            currentRole === 'citizen' ? 'text-white' : 'text-textMuted'
          }`}
        >
          Citizen View
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchRole('authority')}
        activeOpacity={0.8}
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
          currentRole === 'authority' ? 'bg-slate-900 shadow-sm' : 'bg-transparent'
        }`}
      >
        <Ionicons
          name="shield-checkmark"
          size={14}
          color={currentRole === 'authority' ? '#38BDF8' : '#A8A29E'}
        />
        <Text
          className={`ml-1.5 text-xs font-extrabold ${
            currentRole === 'authority' ? 'text-sky-400' : 'text-textMuted'
          }`}
        >
          Authority Ops (36h SLA)
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => {
    const streakCount = user?.streakCount || 1;
    const civicCredits = user?.civicCredits || 0;
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const activeStreakIndex = Math.min(streakCount, 7);

    return (
      <View className="mb-6">
        {/* Top Role Switcher */}
        {renderRoleToggle()}

        {/* High-Priority Emergency Road Hazard SOS Ticker */}
        {emergencyAlerts && emergencyAlerts.length > 0 ? (
          <EmergencySOSBanner alerts={emergencyAlerts} />
        ) : null}

        {/* Welcome Section */}
        <View className="mb-5 mt-1 flex-row justify-between items-center">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center mb-1">
              <View className="bg-primaryLight border border-primaryMid px-2 py-0.5 rounded-full mr-2">
                <Text className="text-primary text-[10px] font-bold uppercase tracking-wider">
                  {user?.ward || 'Ward 12'}
                </Text>
              </View>
              <Text className="text-textMuted text-[10px] font-bold uppercase tracking-wider">
                Civic Pulse
              </Text>
            </View>
            <Text className="text-textDark text-2xl font-extrabold tracking-tight">
              Namaste, <Text className="text-primary">{user?.name?.split(' ')[0] || 'Citizen'}</Text>
            </Text>
            <Text className="text-textMuted text-xs font-medium mt-0.5">
              Keep your neighborhood clean & safe today
            </Text>
          </View>

          {/* Citizen Profile Avatar Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="w-12 h-12 rounded-2xl bg-surface border border-cardBorder items-center justify-center relative"
            style={{
              shadowColor: '#1C1917',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="person" size={22} color="#F97316" />
            <View className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-surface" />
          </TouchableOpacity>
        </View>

        {/* Unified Civic Impact & Rewards Hub */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push('/rewards')}
          className="bg-surface border border-cardBorder rounded-3xl p-4 mb-6"
          style={{
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {/* Top Row: Split Streak and CC Wallet */}
          <View className="flex-row items-center justify-between">
            {/* Streak Column */}
            <View className="flex-1 flex-row items-center pr-2">
              <View className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 items-center justify-center mr-3">
                <Ionicons name="flame" size={24} color="#F97316" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-textDark font-extrabold text-lg">
                    {streakCount}
                  </Text>
                  <Text className="text-textDark font-bold text-sm ml-0.5">d</Text>
                  <View className="bg-orange-500/15 px-1.5 py-0.5 rounded ml-1.5">
                    <Text className="text-primary font-extrabold text-[9px] uppercase tracking-wider">
                      STREAK
                    </Text>
                  </View>
                </View>
                <Text className="text-textMuted text-xs font-medium mt-0.5">
                  Daily Citizen Duty
                </Text>
              </View>
            </View>

            {/* Vertical Divider */}
            <View className="w-[1px] h-10 bg-cardBorder mx-2" />

            {/* Civic Credits (CC) Column */}
            <View className="flex-1 flex-row items-center pl-2">
              <View className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center mr-3">
                <Ionicons name="sparkles" size={22} color="#D97706" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-textDark font-extrabold text-lg">
                    {civicCredits}
                  </Text>
                  <Text className="text-textDark font-bold text-sm ml-0.5">CC</Text>
                </View>
                <Text className="text-warning font-bold text-xs mt-0.5">
                  Wallet Balance
                </Text>
              </View>
            </View>
          </View>

          {/* 7-Day Visual Streak Tracker */}
          <View className="flex-row justify-between items-center mt-3.5 pt-3 border-t border-cardBorder/60 px-1">
            {weekDays.map((day, idx) => {
              const isCompleted = idx < activeStreakIndex;
              const isCurrent = idx === activeStreakIndex - 1;
              return (
                <View key={idx} className="items-center">
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center mb-1 ${
                      isCompleted
                        ? 'bg-primary'
                        : 'bg-surfaceAlt border border-cardBorder'
                    }`}
                    style={isCompleted ? {
                      shadowColor: '#F97316',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3,
                      elevation: 2,
                    } : undefined}
                  >
                    {isCompleted ? (
                      <Ionicons name="flame" size={13} color="#FFFFFF" />
                    ) : (
                      <Text className="text-textMuted text-[10px] font-bold">{day}</Text>
                    )}
                  </View>
                  <Text className={`text-[10px] ${isCurrent ? 'text-primary font-extrabold' : isCompleted ? 'text-textDark font-semibold' : 'text-textMuted font-medium'}`}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Bottom Perks Banner Ticker */}
          <View className="flex-row items-center justify-between bg-primaryLight/70 rounded-2xl px-3.5 py-2.5 mt-3.5 border border-primaryMid/70">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="gift" size={15} color="#F97316" />
              <Text numberOfLines={1} className="text-textDark font-bold text-xs ml-2 flex-1">
                Metro Pass & Milk Vouchers Ready
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-primary font-bold text-xs mr-1">Redeem Perks</Text>
              <Ionicons name="arrow-forward" size={12} color="#F97316" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Action Shortcuts Grid */}
        <View className="flex-row justify-between mb-8">
          {/* Report Shortcut */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/report')}
            className="w-[23%] bg-surface border border-cardBorder/60 rounded-2xl p-3 items-center"
            style={{
              shadowColor: '#F97316',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="add-circle" size={24} color="#F97316" />
            <Text className="text-primary text-[10px] font-bold text-center mt-1.5">Report</Text>
          </TouchableOpacity>

          {/* Emergency SOS Shortcut */}
          <TouchableOpacity
            onPress={() => router.push('/emergency')}
            className="w-[23%] bg-red-500/10 border border-red-500/30 rounded-2xl p-3 items-center"
            style={{
              shadowColor: '#EF4444',
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text className="text-danger text-[10px] font-bold text-center mt-1.5">SOS Hub</Text>
          </TouchableOpacity>

          {/* View Map Shortcut */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/explore')}
            className="w-[23%] bg-surface border border-cardBorder/60 rounded-2xl p-3 items-center"
            style={{
              shadowColor: '#2563EB',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="map" size={24} color="#2563EB" />
            <Text className="text-infoBlue text-[10px] font-bold text-center mt-1.5">Explore</Text>
          </TouchableOpacity>

          {/* My Reports Shortcut */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/my-reports')}
            className="w-[23%] bg-surface border border-cardBorder/60 rounded-2xl p-3 items-center"
            style={{
              shadowColor: '#16A34A',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="folder-open" size={24} color="#16A34A" />
            <Text className="text-success text-[10px] font-bold text-center mt-1.5">My Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Feed Title */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-textDark text-base font-extrabold">Recent Civic Feed</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} className="flex-row items-center">
            <Text className="text-primary text-xs font-bold mr-1">View Map</Text>
            <Ionicons name="arrow-forward" size={13} color="#F97316" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View
        className="bg-surface border border-cardBorder p-8 rounded-3xl items-center justify-center mt-2"
        style={{
          shadowColor: '#1C1917',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Ionicons name="checkmark-done-circle-outline" size={40} color="#D4C5BA" className="mb-2" />
        <Text className="text-textDark font-bold text-base text-center mt-2">No Reports in Your Area</Text>
        <Text className="text-textMuted text-xs text-center mt-1 leading-5 px-4">
          All clear! There are no civic issues reported recently in your ward.
        </Text>
      </View>
    );
  };

  const renderErrorComponent = error ? (
    <View className="bg-dangerLight border border-danger/20 rounded-2xl p-4 mb-4">
      <Text className="text-danger text-sm font-semibold text-center">{error}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      {renderErrorComponent}

      {/* If Authority Ops mode is toggled, render the municipal field command console */}
      {currentRole === 'authority' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
              tintColor="#0284C7"
            />
          }
        >
          <View className="pt-2">
            {renderRoleToggle()}
            <AuthorityDashboardView
              reports={reports}
              onAssignWorkOrder={assignReportWorkOrder}
              onResolveWithProof={resolveReportProof}
              onNavigateToReport={navigateToDetails}
            />
          </View>
        </ScrollView>
      ) : (
        /* Otherwise render citizen public feed */
        <FlatList
          data={recentReports}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onPress={() => navigateToDetails(item._id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#F97316']}
              tintColor="#F97316"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
