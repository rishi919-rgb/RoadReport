/**
 * @file StatusBadge.jsx
 * @description Component rendering a styled status label badge - Neon Civic OS style.
 */

import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Maps database status keys to user-facing labels and tailwind color classes.
 */
const STATUS_CONFIG = {
  reported: {
    label: 'Reported',
    containerClass: 'bg-surfaceAlt border-cardBorder',
    textClass: 'text-textMuted'
  },
  under_review: {
    label: 'Under Review',
    containerClass: 'bg-warningLight border-warning/30',
    textClass: 'text-warning'
  },
  assigned: {
    label: 'Assigned',
    containerClass: 'bg-infoBlueLight border-infoBlue/30',
    textClass: 'text-infoBlue'
  },
  in_progress: {
    label: 'In Progress',
    containerClass: 'bg-primaryMid border-primary/30',
    textClass: 'text-primary'
  },
  resolved: {
    label: 'Resolved',
    containerClass: 'bg-successLight border-success/30',
    textClass: 'text-success'
  },
  rejected: {
    label: 'Rejected',
    containerClass: 'bg-dangerLight border-danger/30',
    textClass: 'text-danger'
  }
};

export default function StatusBadge({ status }) {
  const normalizedKey = (status || '').toLowerCase();
  const config = STATUS_CONFIG[normalizedKey] || STATUS_CONFIG.reported;

  return (
    <View className={`px-2.5 py-1 rounded-full border ${config.containerClass} self-start`}>
      <Text className={`text-[11px] font-bold capitalize ${config.textClass}`}>
        {config.label}
      </Text>
    </View>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string
};

StatusBadge.defaultProps = {
  status: 'reported'
};
