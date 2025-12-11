import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PlaneInfo } from './ARKitView';

interface PlaneStatsOverlayProps {
  totalPlanes: number;
  horizontalPlanes: number;
  verticalPlanes: number;
  selectedPlane?: PlaneInfo;
}

export const PlaneStatsOverlay: React.FC<PlaneStatsOverlayProps> = ({
  totalPlanes,
  horizontalPlanes,
  verticalPlanes,
  selectedPlane
}) => {
  const formatDistance = (value: number) => (value * 100).toFixed(1) + ' cm';

  const formatArea = (width: number, height: number) => {
    const areaM2 = width * height;
    return areaM2.toFixed(2) + ' m²';
  };

  return (
    <View style={styles.container}>
      {/* General Stats */}
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Planos Detectados</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Total:</Text>
          <Text style={styles.statsValue}>{totalPlanes}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.colorIndicator, styles.horizontalColor]} />
          <Text style={styles.statsLabel}>Horizontales:</Text>
          <Text style={styles.statsValue}>{horizontalPlanes}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.colorIndicator, styles.verticalColor]} />
          <Text style={styles.statsLabel}>Verticales:</Text>
          <Text style={styles.statsValue}>{verticalPlanes}</Text>
        </View>
      </View>

      {/* Selected Plane Info */}
      {selectedPlane && (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedTitle}>Plano Seleccionado</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo:</Text>
            <Text style={styles.infoValue}>
              {selectedPlane.type === 'unknown' ? 'Desconocido' : selectedPlane.type}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Orientación:</Text>
            <Text style={styles.infoValue}>
              {selectedPlane.alignment === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dimensiones:</Text>
            <Text style={styles.infoValue}>
              {formatDistance(selectedPlane.width)} × {formatDistance(selectedPlane.height)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Área:</Text>
            <Text style={styles.infoValue}>
              {formatArea(selectedPlane.width, selectedPlane.height)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Posición:</Text>
            <Text style={styles.infoValue}>
              ({selectedPlane.centerX.toFixed(2)}, {selectedPlane.centerY.toFixed(2)},{' '}
              {selectedPlane.centerZ.toFixed(2)})
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 12
  },
  statsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    minWidth: 220
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  statsLabel: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginLeft: 4
  },
  statsValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4
  },
  horizontalColor: {
    backgroundColor: 'rgba(51, 153, 255, 0.9)'
  },
  verticalColor: {
    backgroundColor: 'rgba(255, 153, 51, 0.9)'
  },
  selectedBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.8)',
    padding: 16,
    minWidth: 220
  },
  selectedTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  infoRow: {
    marginBottom: 8
  },
  infoLabel: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 2
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});
