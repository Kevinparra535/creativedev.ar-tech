import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Slider from '@react-native-community/slider';

import type { ManualAdjustmentState } from '@/ui/ar/hooks/useManualAdjustment';

interface AlignmentControlsProps {
  state: ManualAdjustmentState;
  onPositionChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  onRotationChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  onScaleChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * Alignment Controls Component
 *
 * Provides sliders for manual adjustment of model transformations:
 * - Position X/Y/Z (-5m to +5m)
 * - Rotation X/Y/Z (-180° to +180°)
 * - Scale (0.1x to 10x)
 *
 * Real-time value display with 2 decimal precision.
 */
export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  state,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  disabled = false
}) => {
  // Convert radians to degrees for display
  const radToDeg = (rad: number) => (rad * 180) / Math.PI;

  return (
    <View style={styles.container}>
      {/* Position Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Position (meters)</Text>

        {/* Position X */}
        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>X:</Text>
            <Text style={styles.value}>{state.position.x.toFixed(2)}m</Text>
          </View>
          <Slider
            disabled={disabled}
            maximumValue={5}
            minimumValue={-5}
            onValueChange={(value) => onPositionChange('x', value)}
            step={0.01}
            style={styles.slider}
            value={state.position.x}
          />
        </View>

        {/* Position Y */}
        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Y:</Text>
            <Text style={styles.value}>{state.position.y.toFixed(2)}m</Text>
          </View>
          <Slider
            disabled={disabled}
            maximumValue={5}
            minimumValue={-5}
            onValueChange={(value) => onPositionChange('y', value)}
            step={0.01}
            style={styles.slider}
            value={state.position.y}
          />
        </View>

        {/* Position Z */}
        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Z:</Text>
            <Text style={styles.value}>{state.position.z.toFixed(2)}m</Text>
          </View>
          <Slider
            disabled={disabled}
             maximumValue={5}
             minimumValue={-5}
            onValueChange={(value) => onPositionChange('z', value)}
            step={0.01}
            style={styles.slider}
            value={state.position.z}
          />
        </View>
      </View>

      {/* Rotation Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rotation (degrees)</Text>

        {/* Rotation X */}
        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>X (Pitch):</Text>
            <Text style={styles.value}>{radToDeg(state.rotation.x).toFixed(0)}°</Text>
          </View>
          <Slider
            disabled={disabled}
            maximumValue={Math.PI}
            minimumValue={-Math.PI}
            onValueChange={(value) => onRotationChange('x', value)}
            step={Math.PI / 180}
            style={styles.slider}
            value={state.rotation.x}
          />
        </View>

        {/* Rotation Y */}
        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Y (Yaw):</Text>
            <Text style={styles.value}>{radToDeg(state.rotation.y).toFixed(0)}°</Text>
          </View>
          <Slider
            disabled={disabled}
            maximumValue={Math.PI}
            minimumValue={-Math.PI}
            onValueChange={(value) => onRotationChange('y', value)}
            step={Math.PI / 180}
            style={styles.slider}
            value={state.rotation.y}
          />
        </View>

        {/* Rotation Z */}
        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Z (Roll):</Text>
            <Text style={styles.value}>{radToDeg(state.rotation.z).toFixed(0)}°</Text>
          </View>
          <Slider
            disabled={disabled}
            maximumValue={Math.PI}
            minimumValue={-Math.PI}
            onValueChange={(value) => onRotationChange('z', value)}
            step={Math.PI / 180}
            style={styles.slider}
            value={state.rotation.z}
          />
        </View>
      </View>

      {/* Scale Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scale</Text>

        <View style={styles.control}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Uniform:</Text>
            <Text style={styles.value}>{state.scale.toFixed(2)}x</Text>
          </View>
          <Slider
            disabled={disabled}
              maximumValue={10}
            minimumValue={0.1}
            onValueChange={onScaleChange}
            step={0.01}
            style={styles.slider}
            value={state.scale}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  control: {
    marginBottom: 12
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  label: {
    fontSize: 14,
    color: '#666'
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF'
  },
  slider: {
    width: '100%',
    height: 40
  }
});
