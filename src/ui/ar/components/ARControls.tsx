import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ARControlsProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const ARControls: React.FC<ARControlsProps> = ({
  isActive,
  onStart,
  onStop,
}) => {
  return (
    <View style={styles.container}>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
