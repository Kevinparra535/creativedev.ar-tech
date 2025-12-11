import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ARDebugOverlay,
  ARKitView,
  ARKitViewRef,
  MeshAddedEvent,
  MeshInfo,
  MeshRemovedEvent,
  MeshStatsOverlay,
  MeshUpdatedEvent,
  PlaneDetectedEvent,
  PlaneInfo,
  PlaneRemovedEvent,
  PlaneSelectedEvent,
  PlaneStatsOverlay,
  PlaneUpdatedEvent
} from '../ar/components';

export const ARTestScreen = () => {
  const arViewRef = useRef<ARKitViewRef>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing AR...');
  const [showDebug, setShowDebug] = useState(true); // Debug overlay enabled by default

  // Plane detection state
  const [planes, setPlanes] = useState<Map<string, PlaneInfo>>(new Map());
  const [selectedPlane, setSelectedPlane] = useState<PlaneInfo | undefined>();

  // Mesh reconstruction state
  const [meshes, setMeshes] = useState<Map<string, MeshInfo>>(new Map());
  const [showMeshStats, setShowMeshStats] = useState(true);
  const [meshUpdateThrottle, setMeshUpdateThrottle] = useState<NodeJS.Timeout | null>(null);

  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    const { success, message } = event.nativeEvent;
    if (success) {
      setIsARReady(true);
      setStatusMessage('AR Ready! Move your device to detect planes.');
    } else {
      setStatusMessage(`AR Error: ${message}`);
    }
  };

  // Plane detection event handlers
  const handlePlaneDetected = (event: PlaneDetectedEvent) => {
    const { plane } = event.nativeEvent;
    setPlanes((prevPlanes) => {
      const newPlanes = new Map(prevPlanes);
      newPlanes.set(plane.id, plane);
      return newPlanes;
    });
  };

  const handlePlaneUpdated = (event: PlaneUpdatedEvent) => {
    const { plane } = event.nativeEvent;
    setPlanes((prevPlanes) => {
      const newPlanes = new Map(prevPlanes);
      newPlanes.set(plane.id, plane);
      return newPlanes;
    });

    // Update selected plane if it's the one that was updated
    if (selectedPlane && selectedPlane.id === plane.id) {
      setSelectedPlane(plane);
    }
  };

  const handlePlaneRemoved = (event: PlaneRemovedEvent) => {
    const { planeId } = event.nativeEvent;
    setPlanes((prevPlanes) => {
      const newPlanes = new Map(prevPlanes);
      newPlanes.delete(planeId);
      return newPlanes;
    });

    // Clear selection if removed plane was selected
    if (selectedPlane && selectedPlane.id === planeId) {
      setSelectedPlane(undefined);
    }
  };

  const handlePlaneSelected = (event: PlaneSelectedEvent) => {
    const { plane, selected } = event.nativeEvent;
    if (selected && plane) {
      setSelectedPlane(plane);
    } else {
      setSelectedPlane(undefined);
    }
  };

  // Mesh reconstruction event handlers
  const handleMeshAdded = (event: MeshAddedEvent) => {
    const { mesh } = event.nativeEvent;
    setMeshes((prev) => {
      const newMeshes = new Map(prev);
      newMeshes.set(mesh.id, mesh);
      return newMeshes;
    });
  };

  const handleMeshUpdated = (event: MeshUpdatedEvent) => {
    const { mesh } = event.nativeEvent;

    // THROTTLING: Solo actualizar cada 500ms para evitar renders constantes
    if (meshUpdateThrottle) {
      clearTimeout(meshUpdateThrottle);
    }

    const timeout = setTimeout(() => {
      setMeshes((prev) => {
        const newMeshes = new Map(prev);
        newMeshes.set(mesh.id, mesh);
        return newMeshes;
      });
    }, 500);

    setMeshUpdateThrottle(timeout);
  };

  const handleMeshRemoved = (event: MeshRemovedEvent) => {
    const { meshId } = event.nativeEvent;
    setMeshes((prev) => {
      const newMeshes = new Map(prev);
      newMeshes.delete(meshId);
      return newMeshes;
    });
  };

  // Cleanup effect for throttle
  useEffect(() => {
    return () => {
      if (meshUpdateThrottle) {
        clearTimeout(meshUpdateThrottle);
      }
    };
  }, [meshUpdateThrottle]);

  const handleARError = (event: { nativeEvent: { error: string } }) => {
    const { error } = event.nativeEvent;
    setIsARReady(false);
    setStatusMessage(`Error: ${error}`);
    Alert.alert('ARKit Error', error);
  };

  const handleModelLoaded = (event: { nativeEvent: { success: boolean; message: string; path: string } }) => {
    const { success, message, path } = event.nativeEvent;
    if (success) {
      setStatusMessage(`Model loaded: ${path}`);
      Alert.alert('Model Loaded', message);
    }
  };

  const handleAddTestObject = () => {
    if (arViewRef.current) {
      arViewRef.current.addTestObject();
      Alert.alert('Object Added', 'A red cube has been added to the AR scene!');
    }
  };

  const handleLoadTestModel = () => {
    if (arViewRef.current) {
      // For now, prompt for a path - in a real app, use expo-document-picker
      Alert.prompt(
        'Load USDZ Model',
        'Enter the path to a USDZ file:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Load',
            onPress: (path?: string) => {
              if (path && arViewRef.current) {
                arViewRef.current.loadModel(path);
                setStatusMessage('Loading model...');
              }
            }
          }
        ],
        'plain-text',
        '/path/to/model.usdz'
      );
    }
  };

  // Calculate plane statistics
  const totalPlanes = planes.size;
  const horizontalPlanes = Array.from(planes.values()).filter(
    (p) => p.alignment === 'horizontal'
  ).length;
  const verticalPlanes = Array.from(planes.values()).filter((p) => p.alignment === 'vertical')
    .length;

  return (
    <SafeAreaView style={styles.container}>
      <ARKitView
        ref={arViewRef}
        style={styles.arView}
        onARInitialized={handleARInitialized}
        onARError={handleARError}
        onModelLoaded={handleModelLoaded}
        onPlaneDetected={handlePlaneDetected}
        onPlaneUpdated={handlePlaneUpdated}
        onPlaneRemoved={handlePlaneRemoved}
        onPlaneSelected={handlePlaneSelected}
        onMeshAdded={handleMeshAdded}
        onMeshUpdated={handleMeshUpdated}
        onMeshRemoved={handleMeshRemoved}
      />

      <View style={styles.overlay}>
        {/* Toggle Debug Button */}
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setShowDebug(!showDebug)}
        >
          <Text style={styles.debugToggleText}>{showDebug ? '🐛 Hide Debug' : '🐛 Show Debug'}</Text>
        </TouchableOpacity>

        {/* Debug Overlay */}
        {showDebug && (
          <ARDebugOverlay
            isARReady={isARReady}
            statusMessage={statusMessage}
            totalPlanes={totalPlanes}
            horizontalPlanes={horizontalPlanes}
            verticalPlanes={verticalPlanes}
            planes={planes}
            selectedPlane={selectedPlane}
          />
        )}

        {/* Plane Stats Overlay (Normal View) */}
        {!showDebug && (
          <>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>

            <PlaneStatsOverlay
              totalPlanes={totalPlanes}
              horizontalPlanes={horizontalPlanes}
              verticalPlanes={verticalPlanes}
              selectedPlane={selectedPlane}
            />

            <View style={styles.meshStatsContainer}>
              <MeshStatsOverlay totalMeshes={meshes.size} meshes={meshes} isVisible={showMeshStats} />
            </View>
          </>
        )}

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.button, !isARReady && styles.buttonDisabled]}
            onPress={handleAddTestObject}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>Add Red Cube</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, !isARReady && styles.buttonDisabled]}
            onPress={handleLoadTestModel}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>Load USDZ Model</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonTertiary]}
            onPress={() => setShowMeshStats(!showMeshStats)}
          >
            <Text style={styles.buttonText}>
              {showMeshStats ? 'Ocultar Mallas' : 'Mostrar Mallas'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ARKit Plane Detection</Text>
            <Text style={styles.infoText}>
              • Move your device to detect planes{'\n'}• Planes appear in blue (horizontal) or
              orange (vertical){'\n'}• Tap on a plane to select it (turns yellow){'\n'}• View
              statistics in the top-right corner{'\n'}• Tap "Add Red Cube" to place test objects
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  arView: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    pointerEvents: 'box-none'
  },
  debugToggle: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000
  },
  debugToggleText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600'
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    pointerEvents: 'none'
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center'
  },
  controlsContainer: {
    padding: 16,
    gap: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonSecondary: {
    backgroundColor: '#34C759'
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 8
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20
  },
  meshStatsContainer: {
    position: 'absolute',
    bottom: 240,
    right: 16
  },
  buttonTertiary: {
    backgroundColor: '#AF52DE'
  }
});
