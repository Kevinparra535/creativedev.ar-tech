import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MeshInfo } from './ARKitView';

interface MeshStatsOverlayProps {
  totalMeshes: number;
  meshes: Map<string, MeshInfo>;
  isVisible: boolean;
}

export const MeshStatsOverlay: React.FC<MeshStatsOverlayProps> = ({
  totalMeshes,
  meshes,
  isVisible
}) => {
  if (!isVisible) return null;

  // Calcular estadísticas
  const classificationCounts = new Map<string, number>();
  let totalVertices = 0;
  let totalFaces = 0;

  meshes.forEach((mesh) => {
    classificationCounts.set(
      mesh.classification,
      (classificationCounts.get(mesh.classification) || 0) + 1
    );
    totalVertices += mesh.vertexCount;
    totalFaces += mesh.faceCount;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reconstrucción de Escena</Text>

      <View style={styles.statsRow}>
        <Text style={styles.label}>Mallas:</Text>
        <Text style={styles.value}>{totalMeshes}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.label}>Vértices:</Text>
        <Text style={styles.value}>{totalVertices.toLocaleString()}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.label}>Caras:</Text>
        <Text style={styles.value}>{totalFaces.toLocaleString()}</Text>
      </View>

      {classificationCounts.size > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Clasificación:</Text>
          {Array.from(classificationCounts.entries()).map(([classification, count]) => (
            <View key={classification} style={styles.classificationRow}>
              <View style={[styles.indicator, getClassificationColor(classification)]} />
              <Text style={styles.classificationLabel}>{getClassificationLabel(classification)}:</Text>
              <Text style={styles.classificationValue}>{count}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

function getClassificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    floor: 'Piso',
    wall: 'Pared',
    ceiling: 'Techo',
    door: 'Puerta',
    window: 'Ventana',
    seat: 'Asiento',
    table: 'Mesa',
    none: 'Sin clasificar'
  };
  return labels[classification] || classification;
}

function getClassificationColor(classification: string): any {
  const colors: Record<string, any> = {
    floor: { backgroundColor: 'rgba(51, 128, 204, 0.9)' },
    wall: { backgroundColor: 'rgba(204, 128, 51, 0.9)' },
    ceiling: { backgroundColor: 'rgba(153, 153, 153, 0.9)' },
    door: { backgroundColor: 'rgba(128, 204, 128, 0.9)' },
    window: { backgroundColor: 'rgba(204, 204, 51, 0.9)' },
    seat: { backgroundColor: 'rgba(204, 51, 128, 0.9)' },
    table: { backgroundColor: 'rgba(128, 76, 204, 0.9)' },
    none: { backgroundColor: 'rgba(128, 128, 128, 0.5)' }
  };
  return colors[classification] || { backgroundColor: 'rgba(128, 128, 128, 0.5)' };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    minWidth: 240
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  subtitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    color: '#FFF',
    fontSize: 14
  },
  value: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12
  },
  classificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  classificationLabel: {
    color: '#FFF',
    fontSize: 13,
    flex: 1
  },
  classificationValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  }
});
