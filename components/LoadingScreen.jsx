/**
 * @file LoadingScreen.jsx
 * @description Full-screen activity loading component.
 * Blocks interaction and provides visual feedback during API transitions.
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import PropTypes from 'prop-types';

export default function LoadingScreen({ message }) {
  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      {/* Loading Spinner */}
      <ActivityIndicator size="large" color="#F97316" />
      
      {/* Loading Label */}
      <Text className="text-textMuted text-sm font-semibold mt-4 text-center">
        {message}
      </Text>
    </View>
  );
}

// Enforces code quality rules on props
LoadingScreen.propTypes = {
  message: PropTypes.string
};

LoadingScreen.defaultProps = {
  message: 'Loading details, please wait...'
};
