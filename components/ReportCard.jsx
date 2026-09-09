/**
 * @file ReportCard.jsx
 * @description Card component displaying a summary of a civic report - Neon Civic OS style.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { timeAgo } from '../utils/formatDate';
import { CATEGORIES, CategoryIcon } from '../constants/categories';

export default function ReportCard({ report, onPress }) {
  const { title, location, media, status, category, createdAt } = report;
  const address = location?.address || 'Unknown location';
  
  const [imageError, setImageError] = React.useState(false);
  const categoryDetails = CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1];

  const hasValidMedia = media && media.length > 0 && !imageError;

  const renderThumbnail = hasValidMedia ? (
    <Image
      source={{ uri: media[0] }}
      className="w-20 h-20 rounded-xl"
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  ) : (
    <View className="w-20 h-20 bg-primaryLight border border-primaryMid/40 rounded-xl items-center justify-center">
      <CategoryIcon categoryId={category} size={28} color="#F97316" />
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-surface rounded-2xl p-3.5 mb-3 flex-row items-center border border-cardBorder/60"
      style={{
        shadowColor: '#1C1917',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Thumbnail Area */}
      {renderThumbnail}

      {/* Report Info Details */}
      <View className="flex-1 ml-3.5 justify-between h-20 py-0.5">
        <View>
          <View className="flex-row items-center justify-between mb-1">
            <Text numberOfLines={1} className="text-textDark font-bold text-sm flex-1 pr-2">
              {title}
            </Text>
            <Text className="text-textMuted text-[11px] font-medium">
              {timeAgo(createdAt)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={13} color="#A8A29E" style={{ marginRight: 4 }} />
            <Text numberOfLines={1} className="text-textMuted text-xs font-medium flex-1">
              {address}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <StatusBadge status={status} />
      </View>
    </TouchableOpacity>
  );
}

ReportCard.propTypes = {
  report: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    location: PropTypes.shape({
      address: PropTypes.string
    }),
    media: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  onPress: PropTypes.func.isRequired
};
