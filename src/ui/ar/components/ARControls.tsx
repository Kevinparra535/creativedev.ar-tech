import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ARControlsProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const ARControls: React.FC<ARControlsProps> = ({ isActive, onStart, onStop }) => (
  <View style={styles.container}>
    <TouchableOpacity
      style={[styles.button, isActive && styles.activeButton]}
      onPress={isActive ? onStop : onStart}
    >
      <Ionicons name={isActive ? 'camera' : 'camera-outline'} size={20} color='#fff' />
      <Text style={styles.buttonText}>{isActive ? 'AR Mode ON' : 'Enable AR'}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  activeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.6)'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
