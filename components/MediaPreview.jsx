/**
 * @file MediaPreview.jsx
 * @description Component displaying a thumbnail of the selected image or video attachment (max 10s).
 * Features an absolute overlay button to remove/discard the media and a video duration indicator.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';

export default function MediaPreview({ uri, mediaType = 'image', duration = null, onRemove }) {
  if (!uri) return null;

  const isVideo = mediaType === 'video' ||
    uri.toLowerCase().endsWith('.mp4') ||
    uri.toLowerCase().endsWith('.mov') ||
    uri.toLowerCase().endsWith('.m4v');

  const formattedDuration = duration
    ? `${Math.round(duration > 100 ? duration / 1000 : duration)}s`
    : '≤ 10s';

  return (
    <View className="relative w-full h-52 rounded-2xl overflow-hidden border border-cardBorder bg-surface">
      {/* Media Thumbnail */}
      <Image
        source={{ uri }}
        className="w-full h-full"
        resizeMode="cover"
      />

      {/* Video Indicator Overlay */}
      {isVideo && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="w-14 h-14 rounded-full bg-primary/90 items-center justify-center shadow-lg">
            <Ionicons name="play" size={26} color="#FAFAF9" style={{ marginLeft: 3 }} />
          </View>
          <View className="mt-2 bg-surface/95 border border-cardBorder px-3 py-1 rounded-full flex-row items-center shadow-sm">
            <Ionicons name="videocam" size={13} color="#F97316" style={{ marginRight: 5 }} />
            <Text className="text-textDark font-bold text-xs">Video Clip ({formattedDuration})</Text>
          </View>
        </View>
      )}

      {/* Remove Overlay Button */}
      <TouchableOpacity
        onPress={onRemove}
        activeOpacity={0.8}
        className="absolute top-3 right-3 bg-danger w-8 h-8 rounded-full items-center justify-center shadow-sm"
        style={{ shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }}
      >
        <Ionicons name="close" size={18} color="#FAFAF9" />
      </TouchableOpacity>
    </View>
  );
}

MediaPreview.propTypes = {
  uri: PropTypes.string,
  mediaType: PropTypes.string,
  duration: PropTypes.number,
  onRemove: PropTypes.func.isRequired
};

MediaPreview.defaultProps = {
  uri: '',
  mediaType: 'image',
  duration: null
};
