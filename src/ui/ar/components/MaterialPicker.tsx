import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MaterialType } from '../utils/materials';

interface MaterialPickerProps {
  currentMaterial: MaterialType;
  onMaterialChange: (material: MaterialType) => void;
}

export const MaterialPicker: React.FC<MaterialPickerProps> = ({
  currentMaterial,
  onMaterialChange
}) => {
  const materials: { type: MaterialType; label: string }[] = [
    { type: 'default', label: 'Default' },
    { type: 'wood', label: 'Wood' },
    { type: 'concrete', label: 'Concrete' }
  ];

  return (
    <View style={styles.container}>
      {materials.map((material) => (
        <TouchableOpacity
          key={material.type}
          style={[styles.button, currentMaterial === material.type && styles.activeButton]}
          onPress={() => onMaterialChange(material.type)}
        >
          <Text
            style={[
              styles.buttonText,
              currentMaterial === material.type && styles.activeButtonText
            ]}
          >
            {material.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  activeButton: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  activeButtonText: {
    fontWeight: '700'
  }
});
