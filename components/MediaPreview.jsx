/**
 * @file MediaPreview.jsx
 * @description Component displaying a thumbnail of the selected image.
 * Features an absolute overlay button to remove/discard the photo.
 */

import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';

export default function MediaPreview({ uri, onRemove }) {
  if (!uri) return null;

  return (
    <View className="relative w-full h-48 rounded-2xl overflow-hidden border border-cardBorder bg-surface">
      {/* Thumbnail Image */}
      <Image
        source={{ uri }}
        className="w-full h-full"
        resizeMode="cover"
      />

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

// Enforces code quality rules on props
MediaPreview.propTypes = {
  uri: PropTypes.string,
  onRemove: PropTypes.func.isRequired
};

MediaPreview.defaultProps = {
  uri: ''
};
