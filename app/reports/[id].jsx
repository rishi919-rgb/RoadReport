/**
 * @file [id].jsx
 * @description Detailed screen for a single civic report - Neon Civic OS style.
 */

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MiniMapPreview from '../../components/MiniMapPreview';

import { ReportContext } from '../../context/ReportContext';
import reportService from '../../services/reportService';
import LoadingScreen from '../../components/LoadingScreen';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { CATEGORIES, CategoryIcon } from '../../constants/categories';
import useAuth from '../../hooks/useAuth';

const STATUS_STEPS = [
  { key: 'reported', label: 'Reported', iconName: 'checkmark-circle-outline' },
  { key: 'under_review', label: 'Review', iconName: 'search-outline' },
  { key: 'assigned', label: 'Assigned', iconName: 'person-outline' },
  { key: 'in_progress', label: 'Progress', iconName: 'construct-outline' },
  { key: 'resolved', label: 'Resolved', iconName: 'checkmark-done-circle-outline' }
];

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toggleUpvote, updateReportStatus } = useContext(ReportContext);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await reportService.getReportById(id);
        if (res.success) {
          setReport(res.data);
          setUpvotesCount(res.data.upvotes?.length || 0);
          
          if (user && user._id && res.data.upvotes) {
            const hasUpvoted = res.data.upvotes.some(
              (u) => (u._id || u).toString() === user._id.toString()
            );
            setIsUpvoted(hasUpvoted);
          }
        } else {
          Alert.alert('Error', 'Unable to fetch report details.');
          router.back();
        }
      } catch (err) {
        console.error('Fetch detail error:', err.message);
        Alert.alert('Error', 'Report details could not be retrieved.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id, user?._id]);

  const handleToggleUpvote = async () => {
    if (isUpvoting) return;
    setIsUpvoting(true);
    const res = await toggleUpvote(id);
    if (res.success) {
      setIsUpvoted(res.isUpvoted);
      setUpvotesCount(res.count);
    }
    setIsUpvoting(false);
  };

  const handleShareReport = async () => {
    try {
      const shareUrl = `roadreport://reports/${id}`;
      await Share.share({
        title: `RoadReport: ${report.title}`,
        message: `Check out this reported civic issue: "${report.title}" at ${report.location.address}. Help us upvote to get it resolved! Link: ${shareUrl}`
      });
    } catch (e) {
      console.error('Share failure:', e.message);
    }
  };

  const handleAdvanceStatus = async () => {
    const currentIndex = STATUS_STEPS.findIndex((s) => s.key === report.status);
    if (currentIndex === -1 || currentIndex === STATUS_STEPS.length - 1) {
      const newStatus = 'reported';
      const success = await updateReportStatus(id, newStatus);
      if (success) {
        setReport((prev) => ({ ...prev, status: newStatus }));
      }
      return;
    }

    const newStatus = STATUS_STEPS[currentIndex + 1].key;
    const success = await updateReportStatus(id, newStatus);
    if (success) {
      setReport((prev) => ({ ...prev, status: newStatus }));
    }
  };

  if (loading) {
    return <LoadingScreen message="Fetching telemetry details..." />;
  }

  if (!report) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textMuted font-medium">Report not found</Text>
      </View>
    );
  }

  const catDetails = CATEGORIES.find((c) => c.id === report.category) || CATEGORIES[CATEGORIES.length - 1];
  const activeStatusIndex = STATUS_STEPS.findIndex((s) => s.key === report.status);

  const upvoteText = isUpvoted ? 'Upvoted Issue' : 'Upvote Issue';
  const upvoteBg = isUpvoted ? 'bg-primaryLight border-primaryMid' : 'bg-surface border-cardBorder';
  const upvoteTextColor = isUpvoted ? 'text-primary font-bold' : 'text-textBody font-medium';

  return (
    <SafeAreaView className="flex-1 bg-background">
      
      {/* Top Navbar */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-surface border-b border-cardBorder">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={18} color="#F97316" style={{ marginRight: 4 }} />
          <Text className="text-primary font-bold text-sm">Back</Text>
        </TouchableOpacity>
        <Text className="text-textDark font-extrabold text-base tracking-tight">Issue Details</Text>
        <TouchableOpacity onPress={handleShareReport} className="flex-row items-center p-1">
          <Ionicons name="share-social-outline" size={20} color="#F97316" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        
        {/* Attached Image Viewer */}
        <View
          className="w-full h-56 rounded-3xl overflow-hidden bg-surface mb-5 border border-cardBorder"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {report.media && report.media.length > 0 ? (
            <View className="w-full h-full relative">
              <Image
                source={{ uri: report.media[0] }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {(report.media[0].toLowerCase().endsWith('.mp4') ||
                report.media[0].toLowerCase().endsWith('.mov') ||
                report.media[0].toLowerCase().endsWith('.m4v')) && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <View className="w-14 h-14 rounded-full bg-primary/90 items-center justify-center shadow-lg">
                    <Ionicons name="play" size={26} color="#FAFAF9" style={{ marginLeft: 3 }} />
                  </View>
                  <View className="mt-2 bg-surface/95 border border-cardBorder px-3 py-1 rounded-full flex-row items-center shadow-sm">
                    <Ionicons name="videocam" size={13} color="#F97316" style={{ marginRight: 5 }} />
                    <Text className="text-textDark font-bold text-xs">Video Evidence (≤10s)</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View className="w-full h-full items-center justify-center bg-surfaceAlt">
              <CategoryIcon categoryId={report.category} size={48} color="#F97316" />
              <Text className="text-textMuted text-xs mt-2 font-medium">No media evidence attached</Text>
            </View>
          )}
        </View>

        {/* Title, Date & Badges */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <StatusBadge status={report.status} />
            <Text className="text-textMuted text-xs font-medium">
              Reported on {formatDate(report.createdAt)}
            </Text>
          </View>
          <Text className="text-textDark text-2xl font-extrabold tracking-tight mb-2.5">
            {report.title}
          </Text>
          <View className="flex-row items-center">
            <View className="bg-surfaceAlt px-3 py-1.5 rounded-full mr-2 border border-cardBorder flex-row items-center">
              <CategoryIcon categoryId={report.category} size={14} color="#F97316" />
              <Text className="text-textDark text-xs ml-1.5 font-medium capitalize">
                {catDetails.name}
              </Text>
            </View>
            <View className="bg-dangerLight px-3 py-1.5 rounded-full border border-danger/30">
              <Text className="text-danger text-xs font-bold capitalize">
                {report.severity} Priority
              </Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View
          className="bg-surface border border-cardBorder p-4 rounded-3xl mb-5"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-1.5">Description</Text>
          <Text className="text-textBody text-sm leading-relaxed font-medium">
            {report.description || 'No description provided.'}
          </Text>
        </View>

        {/* Upvotes & Reporter Info Row */}
        <View className="flex-row justify-between items-center mb-6 gap-4">
          
          <TouchableOpacity
            onPress={handleToggleUpvote}
            disabled={isUpvoting}
            activeOpacity={0.85}
            className={`flex-1 border py-3.5 rounded-2xl flex-row items-center justify-center shadow-sm ${upvoteBg}`}
            style={{
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isUpvoted ? 0.2 : 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {isUpvoting ? (
              <ActivityIndicator size="small" color="#F97316" />
            ) : (
              <>
                <Ionicons name={isUpvoted ? 'thumbs-up' : 'thumbs-up-outline'} size={18} color={isUpvoted ? '#F97316' : '#A8A29E'} style={{ marginRight: 6 }} />
                <Text className={`text-sm ${upvoteTextColor}`}>{upvoteText}</Text>
                <View className="bg-surface px-2.5 py-0.5 rounded-full ml-2 border border-cardBorder">
                  <Text className="text-primary font-bold text-xs">{upvotesCount}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <View className="justify-center items-start">
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider">
              Reported By
            </Text>
            {report.isAnonymous ? (
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="eye-off" size={14} color="#F97316" style={{ marginRight: 4 }} />
                <Text className="text-primary text-xs font-bold">Anonymous Citizen</Text>
              </View>
            ) : (
              <Text className="text-textDark text-xs font-bold mt-0.5">
                {report.user?.name || 'Citizen'}
              </Text>
            )}
          </View>

        </View>

        {/* Status Timeline step tracker */}
        <View
          className="mb-5 bg-surface border border-cardBorder p-5 rounded-3xl"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="text-textDark font-bold text-sm mb-4">Resolution Progress</Text>
          
          <View className="flex-row justify-between items-center relative">
            <View className="absolute top-[14px] left-[18px] right-[18px] h-[2px] bg-cardBorder z-0" />

            {STATUS_STEPS.map((stepItem, index) => {
              const isPassed = index <= activeStatusIndex;
              const dotBg = isPassed ? 'bg-primary border-primary' : 'bg-surfaceAlt border-cardBorder';
              const dotColor = isPassed ? '#FAFAF9' : '#A8A29E';

              return (
                <View key={stepItem.key} className="items-center flex-1 z-10">
                  <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${dotBg} shadow-sm`}>
                    <Ionicons name={stepItem.iconName} size={15} color={dotColor} />
                  </View>
                  <Text className={`text-[10px] mt-1.5 font-bold text-center ${isPassed ? 'text-primary' : 'text-textMuted'}`}>
                    {stepItem.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Location GPS coordinates Card */}
        <View
          className="mb-8 bg-surface border border-cardBorder p-5 rounded-3xl"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="text-textDark font-bold text-sm mb-1.5">Tagged Location</Text>
          <View className="flex-row items-center mb-3.5">
            <Ionicons name="location-outline" size={15} color="#F97316" style={{ marginRight: 5 }} />
            <Text className="text-textBody text-xs flex-1 font-medium">
              {report.location?.address}
            </Text>
          </View>

          <MiniMapPreview
            latitude={report.location?.latitude}
            longitude={report.location?.longitude}
            height={176}
          />
        </View>

        <TouchableOpacity
          onPress={handleAdvanceStatus}
          className="mt-1 bg-surface border border-cardBorder py-3.5 rounded-2xl items-center flex-row justify-center active:opacity-80"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <Ionicons name="options-outline" size={16} color="#F97316" style={{ marginRight: 6 }} />
          <Text className="text-primary text-xs font-bold">
            Simulate Status Update (Demo)
          </Text>
        </TouchableOpacity>

        <View className="h-10" />

      </ScrollView>

    </SafeAreaView>
  );
}
