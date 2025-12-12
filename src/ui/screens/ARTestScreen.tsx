import React, { useRef, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as DocumentPicker from 'expo-document-picker';

import {
  ARKitView,
  ARKitViewRef,
  PlaneDetectedEvent,
  PlaneRemovedEvent,
  PlaneUpdatedEvent
} from '../ar/components';
import { useFileManager } from '../ar/hooks/useFileManager';

export const ARTestScreen = () => {
  const arViewRef = useRef<ARKitViewRef>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing AR...');
  const [planeCount, setPlaneCount] = useState(0);
  const [isTapMode, setIsTapMode] = useState(false);
  const [pendingModelPath, setPendingModelPath] = useState<string | null>(null);
  const [showPlanes, setShowPlanes] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const [modelCount, setModelCount] = useState(0);
  const [showRoomScanPicker, setShowRoomScanPicker] = useState(false);

  // File manager hook for listing USDZ files
  const { usdzFiles, isLoading, error: fileError, listUsdzFiles, formatFileSize, formatDate } = useFileManager();

  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    const { success, message } = event.nativeEvent;
    if (success) {
      setIsARReady(true);
      setStatusMessage('Scanning... Move your device slowly to detect surfaces');
      setIsScanning(true);
    } else {
      setStatusMessage(`AR Error: ${message}`);
    }
  };

  const handlePlaneDetected = (event: PlaneDetectedEvent) => {
    const { plane, totalPlanes } = event.nativeEvent;
    setPlaneCount(totalPlanes);

    // End scanning phase after detecting first plane
    if (isScanning && totalPlanes >= 1) {
      setIsScanning(false);
      setStatusMessage('Surfaces detected! Ready to place models.');
    }

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
      setModelCount(prev => prev + 1);
      setStatusMessage(`Model loaded: ${path}`);

      // Auto-hide planes after first model is loaded
      if (modelCount === 0 && showPlanes) {
        handleTogglePlanes();
      }

      Alert.alert('Model Loaded', message);
    }
  };

  const handleModelPlaced = (event: { nativeEvent: { success: boolean; message: string; path: string } }) => {
    const { success, message } = event.nativeEvent;
    if (success) {
      setModelCount(prev => prev + 1);
      setStatusMessage('Model placed successfully! Tap to place another or switch to Camera mode.');

      // Auto-hide planes after first model is placed
      if (modelCount === 0 && showPlanes) {
        handleTogglePlanes();
      }

      Alert.alert('Model Placed', message);
    } else {
      setStatusMessage('Failed to place model');
      Alert.alert('Placement Error', message);
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

      if (isTapMode) {
        setStatusMessage('Tap mode ready! Tap on a plane to place the model.');
        setPendingModelPath(file.uri);
        arViewRef.current.placeModelOnTap(file.uri, 1);
      } else {
        setStatusMessage(`Loading ${file.name}...`);
        arViewRef.current.loadModel(file.uri, 1, [0, 0, -1]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to load model: ${errorMessage}`);
      setStatusMessage(`Error: ${errorMessage}`);
    }
  };

  const handleToggleMode = () => {
    const newMode = !isTapMode;
    setIsTapMode(newMode);
    if (newMode) {
      setStatusMessage('Tap mode activated. Import a model and tap on a plane to place it.');
    } else {
      setStatusMessage('Camera mode activated. Models will appear in front of the camera.');
      setPendingModelPath(null);
    }
  };

  const handleClearAllModels = () => {
    if (arViewRef.current) {
      arViewRef.current.removeAllAnchors();
      setPendingModelPath(null);
      setModelCount(0);
      setStatusMessage('All models cleared');
      Alert.alert('Models Cleared', 'All AR models have been removed from the scene');
    }
  };

  const handleUndo = () => {
    if (arViewRef.current && modelCount > 0) {
      arViewRef.current.undoLastModel();
      setModelCount(prev => prev - 1);
      setStatusMessage('Last model removed');
    }
  };

  const handleTogglePlanes = () => {
    if (arViewRef.current) {
      const newVisibility = !showPlanes;
      setShowPlanes(newVisibility);
      arViewRef.current.setPlaneVisibility(newVisibility);
      setStatusMessage(newVisibility ? 'Plane visualization enabled' : 'Plane visualization disabled');
    }
  };

  const handleOpenRoomScanPicker = () => {
    listUsdzFiles(); // Refresh the list
    setShowRoomScanPicker(true);
  };

  const handleLoadRoomScan = (fileUri: string, fileName: string) => {
    if (!arViewRef.current) return;

    try {
      setShowRoomScanPicker(false);
      setStatusMessage(`Loading room scan: ${fileName}...`);

      if (isTapMode) {
        setStatusMessage('Tap mode ready! Tap on a plane to place the room scan.');
        setPendingModelPath(fileUri);
        arViewRef.current.placeModelOnTap(fileUri, 1);
      } else {
        arViewRef.current.loadModel(fileUri, 1, [0, 0, -1]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to load room scan: ${errorMessage}`);
      setStatusMessage(`Error: ${errorMessage}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ARKitView
        ref={arViewRef}
        style={styles.arView}
        onARInitialized={handleARInitialized}
        onARError={handleARError}
        onModelLoaded={handleModelLoaded}
        onModelPlaced={handleModelPlaced}
        onPlaneDetected={handlePlaneDetected}
        onPlaneUpdated={handlePlaneUpdated}
        onPlaneRemoved={handlePlaneRemoved}
      />

      <View style={styles.overlay}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusMessage}</Text>
          {isScanning && (
            <Text style={styles.scanningText}>Scanning for surfaces...</Text>
          )}
          {planeCount > 0 && !isScanning && (
            <Text style={styles.planeCountText}>Surfaces detected: {planeCount}</Text>
          )}
          {modelCount > 0 && (
            <Text style={styles.modelCountText}>Models: {modelCount}</Text>
          )}
          {isTapMode && (
            <View style={styles.tapModeIndicator}>
              <Text style={styles.tapModeText}>TAP MODE ACTIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonToggle, isTapMode && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
              onPress={handleToggleMode}
              disabled={!isARReady}
            >
              <Text style={styles.buttonText}>{isTapMode ? 'Camera Mode' : 'Tap Mode'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonInfo, showPlanes && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
              onPress={handleTogglePlanes}
              disabled={!isARReady}
            >
              <Text style={styles.buttonText}>{showPlanes ? 'Hide Planes' : 'Show Planes'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonWarning, !isARReady && styles.buttonDisabled, modelCount === 0 && styles.buttonDisabled]}
              onPress={handleUndo}
              disabled={!isARReady || modelCount === 0}
            >
              <Text style={styles.buttonText}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger, !isARReady && styles.buttonDisabled]}
              onPress={handleClearAllModels}
              disabled={!isARReady}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* <TouchableOpacity
            style={[styles.button, !isARReady && styles.buttonDisabled]}
            onPress={handleAddTestObject}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>Add Red Cube</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, !isARReady && styles.buttonDisabled]}
            onPress={handleLoadTestModel}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>Import USDZ Model</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonRoomScan, !isARReady && styles.buttonDisabled]}
            onPress={handleOpenRoomScanPicker}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>📦 Load Room Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Room Scan Picker Modal */}
      <Modal
        visible={showRoomScanPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoomScanPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Room Scan</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRoomScanPicker(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoading && (
              <View style={styles.modalMessageContainer}>
                <Text style={styles.modalMessageText}>Loading files...</Text>
              </View>
            )}

            {fileError && (
              <View style={styles.modalMessageContainer}>
                <Text style={styles.modalErrorText}>Error: {fileError}</Text>
              </View>
            )}

            {!isLoading && !fileError && usdzFiles.length === 0 && (
              <View style={styles.modalMessageContainer}>
                <Text style={styles.modalMessageText}>No room scans found.</Text>
                <Text style={styles.modalHintText}>
                  Create a room scan first using the Room Plan Test screen.
                </Text>
              </View>
            )}

            {!isLoading && usdzFiles.length > 0 && (
              <FlatList
                data={usdzFiles}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.fileItem}
                    onPress={() => handleLoadRoomScan(item.uri, item.name)}
                  >
                    <View style={styles.fileItemContent}>
                      <Text style={styles.fileItemName}>📁 {item.name}</Text>
                      <Text style={styles.fileItemDetails}>
                        {formatFileSize(item.size)} • {formatDate(item.modificationTime)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.fileList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 25 : 0,
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
  scanningText: {
    color: '#FF9500',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
    fontStyle: 'italic'
  },
  modelCountText: {
    color: '#5AC8FA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600'
  },
  tapModeIndicator: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    borderRadius: 4,
    alignSelf: 'center'
  },
  tapModeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  controlsContainer: {
    padding: 16,
    gap: 16
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12
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
  buttonToggle: {
    flex: 1,
    backgroundColor: '#5856D6'
  },
  buttonToggleActive: {
    backgroundColor: '#FF9500'
  },
  buttonDanger: {
    flex: 1,
    backgroundColor: '#FF3B30'
  },
  buttonWarning: {
    flex: 1,
    backgroundColor: '#FF9500'
  },
  buttonInfo: {
    flex: 1,
    backgroundColor: '#5AC8FA'
  },
  buttonRoomScan: {
    backgroundColor: '#AF52DE'
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  modalMessageContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalMessageText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center'
  },
  modalErrorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center'
  },
  modalHintText: {
    color: '#636366',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8
  },
  fileList: {
    padding: 16
  },
  fileItem: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden'
  },
  fileItemContent: {
    padding: 16
  },
  fileItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  fileItemDetails: {
    color: '#8E8E93',
    fontSize: 13
  }
});
