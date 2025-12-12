import React, { useRef, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';

import {
  ARKitView,
  ARKitViewRef,
  PlaneDetectedEvent,
  PlaneRemovedEvent,
  PlaneUpdatedEvent
} from '../ar/components';
import { useFileManager } from '../ar/hooks/useFileManager';
import { useModelTransformation } from '../ar/hooks/useModelTransformation';

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
  const [showTransformControls, setShowTransformControls] = useState(false);
  const [loadedModelIds, setLoadedModelIds] = useState<string[]>([]);

  // File manager hook for listing USDZ files
  const { usdzFiles, isLoading, error: fileError, listUsdzFiles, formatFileSize, formatDate } = useFileManager();

  // Model transformation hook
  const {
    transformations,
    selectedModelId,
    setSelectedModelId,
    updateScale,
    updateRotation,
    updatePosition,
    getTransformation
  } = useModelTransformation(arViewRef);

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

  const handleModelLoaded = (event: { nativeEvent: { success: boolean; message: string; path: string; modelId?: string } }) => {
    const { success, message, path, modelId } = event.nativeEvent;
    if (success) {
      setModelCount(prev => prev + 1);
      setStatusMessage(`Model loaded: ${path}`);

      // Track loaded model ID
      if (modelId) {
        setLoadedModelIds(prev => [...prev, modelId]);
        // Auto-select the first loaded model
        if (loadedModelIds.length === 0) {
          setSelectedModelId(modelId);
          // Get initial transformation
          getTransformation(modelId);
        }
      }

      // Auto-hide planes after first model is loaded
      if (modelCount === 0 && showPlanes) {
        handleTogglePlanes();
      }

      Alert.alert('Model Loaded', message);
    }
  };

  const handleModelPlaced = (event: { nativeEvent: { success: boolean; message: string; path: string; modelId?: string } }) => {
    const { success, message, modelId } = event.nativeEvent;
    if (success) {
      setModelCount(prev => prev + 1);
      setStatusMessage('Model placed successfully! Tap to place another or switch to Camera mode.');

      // Track loaded model ID
      if (modelId) {
        setLoadedModelIds(prev => [...prev, modelId]);
        // Auto-select the first loaded model
        if (loadedModelIds.length === 0) {
          setSelectedModelId(modelId);
          // Get initial transformation
          getTransformation(modelId);
        }
      }

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
      setModelCount(0);
      setLoadedModelIds([]);
      setSelectedModelId(null);
      setStatusMessage('All models cleared');
      Alert.alert('Models Cleared', 'All AR models have been removed from the scene');
    }
  };

  const handleUndo = () => {
    if (arViewRef.current && modelCount > 0) {
      arViewRef.current.undoLastModel();
      setModelCount(prev => prev - 1);
      // Remove last model ID
      setLoadedModelIds(prev => prev.slice(0, -1));
      setStatusMessage('Last model removed');
    }
  };

  const handleOpenTransformControls = () => {
    if (loadedModelIds.length === 0) {
      Alert.alert('No Models', 'Load a model first to use transformation controls');
      return;
    }
    setShowTransformControls(true);
  };

  const handleScaleChange = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedModelId) return;

    const currentTransform = transformations[selectedModelId];
    const newScale = {
      x: currentTransform?.scale?.x ?? 1,
      y: currentTransform?.scale?.y ?? 1,
      z: currentTransform?.scale?.z ?? 1,
      [axis]: value
    };

    try {
      await updateScale(selectedModelId, newScale);
    } catch (error) {
      console.error('Error updating scale:', error);
    }
  };

  const handleRotationChange = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedModelId) return;

    const currentTransform = transformations[selectedModelId];
    const newRotation = {
      x: currentTransform?.rotation?.x ?? 0,
      y: currentTransform?.rotation?.y ?? 0,
      z: currentTransform?.rotation?.z ?? 0,
      [axis]: value
    };

    try {
      await updateRotation(selectedModelId, newRotation);
    } catch (error) {
      console.error('Error updating rotation:', error);
    }
  };

  const handlePositionChange = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedModelId) return;

    const currentTransform = transformations[selectedModelId];
    const newPosition = {
      x: currentTransform?.position?.x ?? 0,
      y: currentTransform?.position?.y ?? 0,
      z: currentTransform?.position?.z ?? 0,
      [axis]: value
    };

    try {
      await updatePosition(selectedModelId, newPosition);
    } catch (error) {
      console.error('Error updating position:', error);
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

  const handleExportRoomScan = async (fileUri: string, fileName: string) => {
    try {
      await Share.share({
        url: fileUri,
        title: 'Export Room Scan',
        message: `Sharing ${fileName}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Export Error', `Failed to share file: ${errorMessage}`);
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

          <TouchableOpacity
            style={[styles.button, styles.buttonTransform, !isARReady && styles.buttonDisabled, modelCount === 0 && styles.buttonDisabled]}
            onPress={handleOpenTransformControls}
            disabled={!isARReady || modelCount === 0}
          >
            <Text style={styles.buttonText}>🎛️ Transform Model</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transformation Controls - Compact Bottom Sheet */}
      <Modal
        visible={showTransformControls}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransformControls(false)}
      >
        <TouchableOpacity
          style={styles.transformOverlay}
          activeOpacity={1}
          onPress={() => setShowTransformControls(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.transformPanel}
          >
            {/* Header */}
            <View style={styles.transformHeader}>
              <View style={styles.transformDragIndicator} />
              <View style={styles.transformHeaderContent}>
                <Text style={styles.transformTitle}>Transform</Text>
                <TouchableOpacity
                  style={styles.transformCloseButton}
                  onPress={() => setShowTransformControls(false)}
                >
                  <Text style={styles.transformCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.transformScrollView}
              showsVerticalScrollIndicator={false}
            >
              {selectedModelId && (
                <View style={styles.transformContent}>
                  {/* Model Selector - Compact */}
                  {loadedModelIds.length > 1 && (
                    <View style={styles.compactModelSelector}>
                      {loadedModelIds.map((modelId, index) => (
                        <TouchableOpacity
                          key={modelId}
                          style={[
                            styles.compactModelButton,
                            selectedModelId === modelId && styles.compactModelButtonActive
                          ]}
                          onPress={() => {
                            setSelectedModelId(modelId);
                            getTransformation(modelId);
                          }}
                        >
                          <Text style={[
                            styles.compactModelText,
                            selectedModelId === modelId && styles.compactModelTextActive
                          ]}>
                            {index + 1}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Compact Scale Control */}
                  <View style={styles.compactSection}>
                    <Text style={styles.compactSectionTitle}>Scale</Text>
                    <View style={styles.compactSlider}>
                      <Text style={styles.compactLabel}>Uniform</Text>
                      <Slider
                        style={styles.compactSliderControl}
                        minimumValue={0.1}
                        maximumValue={3}
                        value={transformations[selectedModelId]?.scale?.x ?? 1}
                        onValueChange={(value) => {
                          handleScaleChange('x', value);
                          handleScaleChange('y', value);
                          handleScaleChange('z', value);
                        }}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#3A3A3C"
                        thumbTintColor="#007AFF"
                      />
                      <Text style={styles.compactValue}>
                        {(transformations[selectedModelId]?.scale?.x ?? 1).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Compact Rotation Control */}
                  <View style={styles.compactSection}>
                    <Text style={styles.compactSectionTitle}>Rotation</Text>
                    <View style={styles.compactSlider}>
                      <Text style={styles.compactLabel}>Y</Text>
                      <Slider
                        style={styles.compactSliderControl}
                        minimumValue={-Math.PI}
                        maximumValue={Math.PI}
                        value={transformations[selectedModelId]?.rotation?.y ?? 0}
                        onValueChange={(value) => handleRotationChange('y', value)}
                        minimumTrackTintColor="#FF9500"
                        maximumTrackTintColor="#3A3A3C"
                        thumbTintColor="#FF9500"
                      />
                      <Text style={styles.compactValue}>
                        {Math.round(((transformations[selectedModelId]?.rotation?.y ?? 0) * 180) / Math.PI)}°
                      </Text>
                    </View>
                  </View>

                  {/* Compact Position Controls */}
                  <View style={styles.compactSection}>
                    <Text style={styles.compactSectionTitle}>Position</Text>
                    {['x', 'y', 'z'].map((axis) => (
                      <View key={`pos-${axis}`} style={styles.compactSlider}>
                        <Text style={styles.compactLabel}>{axis.toUpperCase()}</Text>
                        <Slider
                          style={styles.compactSliderControl}
                          minimumValue={-2}
                          maximumValue={2}
                          value={transformations[selectedModelId]?.position?.[axis as 'x' | 'y' | 'z'] ?? 0}
                          onValueChange={(value) => handlePositionChange(axis as 'x' | 'y' | 'z', value)}
                          minimumTrackTintColor="#34C759"
                          maximumTrackTintColor="#3A3A3C"
                          thumbTintColor="#34C759"
                        />
                        <Text style={styles.compactValue}>
                          {(transformations[selectedModelId]?.position?.[axis as 'x' | 'y' | 'z'] ?? 0).toFixed(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
                  <View style={styles.fileItem}>
                    <TouchableOpacity
                      style={styles.fileItemContent}
                      onPress={() => handleLoadRoomScan(item.uri, item.name)}
                    >
                      <View style={styles.fileItemInfo}>
                        <Text style={styles.fileItemName}>📁 {item.name}</Text>
                        <Text style={styles.fileItemDetails}>
                          {formatFileSize(item.size)} • {formatDate(item.modificationTime)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.fileItemExportButton}
                      onPress={() => handleExportRoomScan(item.uri, item.name)}
                    >
                      <Text style={styles.fileItemExportIcon}>↗️</Text>
                    </TouchableOpacity>
                  </View>
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
  buttonTransform: {
    backgroundColor: '#5856D6'
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
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center'
  },
  fileItemContent: {
    flex: 1,
    padding: 16
  },
  fileItemInfo: {
    flex: 1
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
  },
  fileItemExportButton: {
    padding: 16,
    backgroundColor: '#007AFF',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60
  },
  fileItemExportIcon: {
    fontSize: 24
  },
  // Transform controls styles - Compact Design
  transformOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  transformPanel: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  transformHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  transformDragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#48484A',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12
  },
  transformHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  transformTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600'
  },
  transformCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  transformCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  transformScrollView: {
    maxHeight: '100%'
  },
  transformContent: {
    padding: 20,
    paddingBottom: 40
  },
  compactModelSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  compactModelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  compactModelButtonActive: {
    backgroundColor: '#5856D6',
    borderColor: '#fff'
  },
  compactModelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600'
  },
  compactModelTextActive: {
    color: '#fff'
  },
  compactSection: {
    marginBottom: 20
  },
  compactSectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  compactSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  compactLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    width: 60
  },
  compactSliderControl: {
    flex: 1,
    marginHorizontal: 12
  },
  compactValue: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    width: 50,
    textAlign: 'right'
  },
  // Old transform styles (keep for compatibility)
  transformContainer: {
    padding: 20
  },
  transformSection: {
    marginBottom: 24
  },
  transformSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  modelSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  modelSelectorButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  modelSelectorButtonActive: {
    backgroundColor: '#5856D6',
    borderColor: '#fff'
  },
  modelSelectorText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600'
  },
  modelSelectorTextActive: {
    color: '#fff'
  },
  sliderContainer: {
    marginBottom: 16
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500'
  },
  slider: {
    width: '100%',
    height: 40
  }
});
