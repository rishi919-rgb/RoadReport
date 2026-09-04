/**
 * @file categories.js
 * @description Defines constants for civic issue categories.
 * Maps category keys to names and vector icon metadata for premium UI rendering.
 */

import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const CATEGORIES = [
  {
    id: 'pothole',
    name: 'Pothole',
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'alert-rhombus-outline',
    color: '#EF4444' // Red
  },
  {
    id: 'streetlight',
    name: 'Streetlight',
    iconFamily: 'Ionicons',
    iconName: 'bulb-outline',
    color: '#EAB308' // Yellow
  },
  {
    id: 'garbage',
    name: 'Garbage Dump',
    iconFamily: 'Ionicons',
    iconName: 'trash-outline',
    color: '#A855F7' // Purple
  },
  {
    id: 'water_leak',
    name: 'Water Leak',
    iconFamily: 'Ionicons',
    iconName: 'water-outline',
    color: '#06B6D4' // Cyan
  },
  {
    id: 'water',
    name: 'Water Leak',
    iconFamily: 'Ionicons',
    iconName: 'water-outline',
    color: '#06B6D4' // Cyan alias
  },
  {
    id: 'traffic',
    name: 'Traffic Signal',
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'traffic-light',
    color: '#F97316' // Orange
  },
  {
    id: 'other',
    name: 'Other Issue',
    iconFamily: 'Ionicons',
    iconName: 'warning-outline',
    color: '#64748B' // Slate
  }
];

/**
 * Reusable Category Icon renderer component
 */
export const CategoryIcon = ({ categoryId, size = 20, color }) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  const iconColor = color || cat.color;

  if (cat.iconFamily === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={cat.iconName} size={size} color={iconColor} />;
  }
  return <Ionicons name={cat.iconName} size={size} color={iconColor} />;
};

export default CATEGORIES;
