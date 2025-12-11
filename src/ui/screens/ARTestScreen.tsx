import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import {
  ARKitView,
  ARKitViewRef,
  PlaneDetectedEvent,
  PlaneUpdatedEvent,
  PlaneRemovedEvent
} from '../ar/components';

export const ARTestScreen = () => {
  const arViewRef = useRef<ARKitViewRef>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing AR...');
  const [planeCount, setPlaneCount] = useState(0);

  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    const { success, message } = event.nativeEvent;
    if (success) {
      setIsARReady(true);
      setStatusMessage('AR Ready! Move device to detect planes.');
    } else {
      setStatusMessage(`AR Error: ${message}`);
    }
  };

  const handlePlaneDetected = (event: PlaneDetectedEvent) => {
    const { plane, totalPlanes } = event.nativeEvent;
    setPlaneCount(totalPlanes);
    console.log('✈️ Plane Detected:', {
      id: plane.id,
      type: plane.type,
      alignment: plane.alignment,
      size: `${(plane.width * 100).toFixed(0)}cm x ${(plane.height * 100).toFixed(0)}cm`,
      totalPlanes
    });
  };

  const handlePlaneUpdated = (event: PlaneUpdatedEvent) => {
    const { plane, totalPlanes } = event.nativeEvent;
    setPlaneCount(totalPlanes);
    console.log('🔄 Plane Updated:', plane.id);
  };

  const handlePlaneRemoved = (event: PlaneRemovedEvent) => {
    const { planeId, totalPlanes } = event.nativeEvent;
    setPlaneCount(totalPlanes);
    console.log('🗑️ Plane Removed:', planeId);
  };

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

  const handleLoadTestModel = async () => {
    if (!arViewRef.current) return;

    try {
      setStatusMessage('Opening file picker...');

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        setStatusMessage('File selection cancelled');
        return;
      }

      const file = result.assets[0];

      if (!file.name.toLowerCase().endsWith('.usdz')) {
        Alert.alert('Invalid File Type', 'Please select a USDZ file');
        setStatusMessage('Invalid file type selected');
        return;
      }

      setStatusMessage(`Loading ${file.name}...`);
      arViewRef.current.loadModel(file.uri, 1, [0, 0, -1]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to load model: ${errorMessage}`);
      setStatusMessage(`Error: ${errorMessage}`);
    }
  };

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
      />

      <View style={styles.overlay}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusMessage}</Text>
          {planeCount > 0 && (
            <Text style={styles.planeCountText}>Planes detected: {planeCount}</Text>
          )}
        </View>

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
            <Text style={styles.buttonText}>Import USDZ Model</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ARKit Test</Text>
            <Text style={styles.infoText}>
              • Move your device to initialize AR{'\n'}
              • Tap "Add Red Cube" to place a test object{'\n'}
              • Tap "Import USDZ Model" to load a 3D model
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
  planeCountText: {
    color: '#4CAF50',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600'
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
  }
});
