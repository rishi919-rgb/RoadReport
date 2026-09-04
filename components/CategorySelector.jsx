/**
 * @file CategorySelector.jsx
 * @description Grid selector for report categories.
 * Renders a list of choices with vector icons and bubbles up selections.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { CATEGORIES, CategoryIcon } from '../constants/categories';

export default function CategorySelector({ selected, onSelect }) {
  // Deduplicate list (excluding alias keys like water vs water_leak)
  const uniqueCategories = CATEGORIES.filter((c, index, self) => 
    index === self.findIndex((t) => t.name === c.name)
  );

  return (
    <View className="flex-row flex-wrap justify-between">
      {uniqueCategories.map((category) => {
        const isSelected =
          selected === category.id ||
          (selected === 'water' && category.id === 'water_leak') ||
          (selected === 'water_leak' && category.id === 'water');
        
        const borderStyle = isSelected ? 'border-primary bg-primaryLight' : 'border-cardBorder bg-surface';
        const textStyle = isSelected ? 'text-primary font-bold' : 'text-textBody font-semibold';

        return (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelect(category.id)}
            className={`w-[48%] border py-4 px-3 rounded-2xl mb-4 flex-col items-center justify-center ${borderStyle}`}
            style={isSelected ? {
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 3,
            } : {
              shadowColor: '#1C1917',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            {/* Category Vector Icon Container */}
            <View className={`w-12 h-12 rounded-xl items-center justify-center mb-2 ${isSelected ? 'bg-primaryMid border border-primary/30' : 'bg-surfaceAlt border border-cardBorder'}`}>
              <CategoryIcon categoryId={category.id} size={24} color={isSelected ? '#F97316' : category.color} />
            </View>

            {/* Category Label */}
            <Text className={`text-xs text-center ${textStyle}`}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

CategorySelector.propTypes = {
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

CategorySelector.defaultProps = {
  selected: ''
};
