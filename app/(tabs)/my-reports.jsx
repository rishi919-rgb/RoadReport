/**
 * @file my-reports.jsx
 * @description Screen displaying the logged-in user's own civic reports - Neon Civic OS style.
 */

import React, { useEffect, useContext, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ReportContext } from '../../context/ReportContext';
import ReportCard from '../../components/ReportCard';

export default function MyReportsScreen() {
  const router = useRouter();
  const { myReports, loading, error, fetchMyReports } = useContext(ReportContext);

  // Filter & Search states
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Pagination & Refresh states
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchMyReports(1);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchMyReports(1);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || loading || myReports.length < 10) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchMyReports(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const filteredReports = myReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchText.toLowerCase()) ||
      report.description.toLowerCase().includes(searchText.toLowerCase());

    let matchesStatus = true;
    if (activeFilter === 'open') {
      matchesStatus = report.status === 'reported' || report.status === 'under_review';
    } else if (activeFilter === 'progress') {
      matchesStatus = report.status === 'assigned' || report.status === 'in_progress';
    } else if (activeFilter === 'resolved') {
      matchesStatus = report.status === 'resolved';
    }

    return matchesSearch && matchesStatus;
  });

  const navigateToDetails = (id) => {
    router.push(`/reports/${id}`);
  };

  const filterChips = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' }
  ];

  const renderHeader = () => {
    return (
      <View className="mb-4 mt-2">
        {/* Search Bar Input */}
        <View
          className="bg-surface border border-cardBorder rounded-2xl px-4 py-3 mb-4 flex-row items-center"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#A8A29E" style={{ marginRight: 10 }} />
          <TextInput
            className="text-textDark flex-1 text-sm font-medium"
            placeholder="Search your reports..."
            placeholderTextColor="#A8A29E"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#A8A29E" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips Horizontal Row */}
        <View className="flex-row justify-between mb-2">
          {filterChips.map((chip) => {
            const isChipActive = activeFilter === chip.id;
            const chipBg = isChipActive ? 'bg-primaryLight border-primaryMid shadow-sm' : 'bg-surface border-cardBorder';
            const chipText = isChipActive ? 'text-primary font-bold' : 'text-textBody font-medium';

            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setActiveFilter(chip.id)}
                className={`px-3.5 py-2 rounded-full border ${chipBg}`}
              >
                <Text className={`text-xs ${chipText}`}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View
        className="bg-surface border border-cardBorder p-8 rounded-3xl items-center justify-center mt-4"
        style={{
          shadowColor: '#1C1917',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Ionicons name="folder-open-outline" size={40} color="#D4C5BA" className="mb-2" />
        <Text className="text-textDark font-bold text-base text-center mt-2">No Reports Found</Text>
        <Text className="text-textMuted text-xs text-center mt-1.5 px-4 mb-5 leading-relaxed">
          {searchText || activeFilter !== 'all'
            ? "No reports match your current search criteria."
            : "You haven't submitted any civic issue reports yet."}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/report')}
          activeOpacity={0.85}
          className="bg-primary rounded-2xl px-6 py-3.5 flex-row items-center shadow-md"
          style={{
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name="add-circle" size={18} color="#FAFAF9" style={{ marginRight: 6 }} />
          <Text className="text-textLight font-bold text-sm">Report an Issue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 justify-center items-center">
        <ActivityIndicator size="small" color="#F97316" />
      </View>
    );
  };

  const renderError = error ? (
    <View className="bg-dangerLight border border-danger/20 rounded-2xl p-4 mb-3">
      <Text className="text-danger text-sm font-semibold text-center">{error}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      <View className="mb-2 mt-2">
        <Text className="text-textDark text-3xl font-extrabold tracking-tight">My Reports</Text>
        <Text className="text-textMuted text-xs font-medium mt-0.5">Track your submitted civic complaints & updates</Text>
      </View>

      {renderError}

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => navigateToDetails(item._id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
    </SafeAreaView>
  );
}
