import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlaneInfo } from './ARKitView';

interface ARDebugOverlayProps {
  isARReady: boolean;
  statusMessage: string;
  totalPlanes: number;
  horizontalPlanes: number;
  verticalPlanes: number;
  planes: Map<string, PlaneInfo>;
  selectedPlane?: PlaneInfo;
}

export const ARDebugOverlay: React.FC<ARDebugOverlayProps> = ({
  isARReady,
  statusMessage,
  totalPlanes,
  horizontalPlanes,
  verticalPlanes,
  planes,
  selectedPlane
}) => {
  return (
    <View style={styles.container}>
      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 AR Status</Text>
        <Text style={[styles.statusText, isARReady ? styles.statusReady : styles.statusNotReady]}>
          {isARReady ? '✅ Ready' : '⏳ Initializing'}
        </Text>
        <Text style={styles.text}>{statusMessage}</Text>
      </View>

      {/* Plane Detection Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✈️ Plane Detection</Text>
        <Text style={styles.text}>Total: {totalPlanes}</Text>
        <Text style={styles.text}>🔵 Horizontal: {horizontalPlanes}</Text>
        <Text style={styles.text}>🟠 Vertical: {verticalPlanes}</Text>
      </View>

      {/* Detected Planes List */}
      {totalPlanes > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Detected Planes</Text>
          <ScrollView style={styles.planeList} nestedScrollEnabled>
            {Array.from(planes.values()).map((plane, index) => (
              <View
                key={plane.id}
                style={[
                  styles.planeItem,
                  selectedPlane?.id === plane.id && styles.planeItemSelected
                ]}
              >
                <Text style={styles.planeText}>
                  {index + 1}. {plane.alignment === 'horizontal' ? '🔵' : '🟠'} {plane.type}
                </Text>
                <Text style={styles.planeTextSmall}>
                  {(plane.width * 100).toFixed(0)}cm × {(plane.height * 100).toFixed(0)}cm
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selected Plane Details */}
      {selectedPlane && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Selected Plane</Text>
          <Text style={styles.text}>Type: {selectedPlane.type}</Text>
          <Text style={styles.text}>
            Size: {(selectedPlane.width * 100).toFixed(1)}cm × {(selectedPlane.height * 100).toFixed(1)}cm
          </Text>
          <Text style={styles.text}>
            Position: ({selectedPlane.centerX.toFixed(2)}, {selectedPlane.centerY.toFixed(2)},{' '}
            {selectedPlane.centerZ.toFixed(2)})
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Instructions</Text>
        <Text style={styles.instructionText}>1. Move device slowly</Text>
        <Text style={styles.instructionText}>2. Point at flat surfaces</Text>
        <Text style={styles.instructionText}>3. Keep good lighting</Text>
        <Text style={styles.instructionText}>4. Check Xcode logs for details</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    maxHeight: '80%',
    width: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  section: {
    marginBottom: 8
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6
  },
  text: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4
  },
  statusReady: {
    color: '#4CAF50'
  },
  statusNotReady: {
    color: '#FFA500'
  },
  planeList: {
    maxHeight: 150
  },
  planeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4
  },
  planeItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  planeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  planeTextSmall: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2
  },
  instructionText: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 2
  }
});
