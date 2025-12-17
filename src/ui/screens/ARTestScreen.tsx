import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';

import {
    ARKitView,
    ARKitViewRef,
    AROnboardingModal,
    PlaneDetectedEvent,
    PlaneRemovedEvent,
    PlaneUpdatedEvent
} from '../ar/components';
import { useFileManager } from '../ar/hooks/useFileManager';
import { useModelTransformation } from '../ar/hooks/useModelTransformation';

export const ARTestScreen = () => {
  type Axis = 'x' | 'y' | 'z';

  const arViewRef = useRef<ARKitViewRef>(null);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing AR...');
  const [planeCount, setPlaneCount] = useState(0);
  const [isTapMode, setIsTapMode] = useState(false);
  const [showPlanes, setShowPlanes] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const [modelCount, setModelCount] = useState(0);
  const [showRoomScanPicker, setShowRoomScanPicker] = useState(false);
  const [showTransformControls, setShowTransformControls] = useState(false);
  const [loadedModelIds, setLoadedModelIds] = useState<string[]>([]);
  
  // Portal Mode (Phase 3)
  const [isPortalMode, setIsPortalMode] = useState(false);
  
  // Mesh Classification Stats (Phase 3.2)
  const [meshStats, setMeshStats] = useState<Record<string, any> | null>(null);
  const [showMeshStats, setShowMeshStats] = useState(false);
  
  // Collision Detection (Phase 3.3)
  const [isCollisionEnabled, setIsCollisionEnabled] = useState(true);
  const [isCollisionDebugMode, setIsCollisionDebugMode] = useState(false);
  const [collisionStats, setCollisionStats] = useState<any>(null);
  const [showCollisionStats, setShowCollisionStats] = useState(false);
  const [lastCollision, setLastCollision] = useState<string | null>(null);
  
  // Quality Settings (Phase 3.4)
  const [occlusionQuality, setOcclusionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isOcclusionEnabled, setIsOcclusionEnabled] = useState(true);
  const [showFPSCounter, setShowFPSCounter] = useState(false);
  const [currentFPS, setCurrentFPS] = useState<number>(0);
  const [qualityStats, setQualityStats] = useState<any>(null);
  const [showQualitySettings, setShowQualitySettings] = useState(false);

  // Haptic Feedback & Boundary Warnings (Phase 3.5)
  const [isHapticEnabled, setIsHapticEnabled] = useState(true);
  const [isBoundaryWarningsEnabled, setIsBoundaryWarningsEnabled] = useState(true);
  const [boundaryDistance, setBoundaryDistance] = useState(0.5); // meters
  const [lastBoundaryWarning, setLastBoundaryWarning] = useState<string | null>(null);
  const [showHapticSettings, setShowHapticSettings] = useState(false);

  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  // Check if first time user - show onboarding
  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('ar_test_onboarding_seen');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkFirstTime();
  }, []);

  const handleCloseOnboarding = async () => {
    try {
      await AsyncStorage.setItem('ar_test_onboarding_seen', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  useEffect(() => {
    if (!showFPSCounter) {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
        fpsIntervalRef.current = null;
      }
      return;
    }

    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }

    fpsIntervalRef.current = setInterval(async () => {
      try {
        if (!arViewRef.current) return;
        const fps = await arViewRef.current.getCurrentFPS();
        setCurrentFPS(fps);
      } catch (error) {
        console.error('Error polling FPS:', error);
      }
    }, 500);

    return () => {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
        fpsIntervalRef.current = null;
      }
    };
  }, [showFPSCounter]);

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

  const handleScaleChange = async (axis: Axis, value: number) => {
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

  const handleRotationChange = async (axis: Axis, value: number) => {
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

  const handlePositionChange = async (axis: Axis, value: number) => {
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

  const handleTogglePortalMode = async () => {
    if (!arViewRef.current) return;

    const newMode = !isPortalMode;
    setIsPortalMode(newMode);
    await arViewRef.current.setPortalMode(newMode);
    
    if (newMode) {
      setStatusMessage('Portal Mode: Camera feed hidden, 3D only');
      Alert.alert(
        'Portal Mode Enabled',
        'Camera feed is now hidden. You\'ll see only 3D models with occlusion.\n\nNote: Scene reconstruction (occlusion mesh) requires LiDAR device.'
      );
    } else {
      setStatusMessage('Normal AR Mode: Camera feed visible');
    }
  };

  const handleShowMeshStats = async () => {
    if (!arViewRef.current) return;

    try {
      const stats = await arViewRef.current.getMeshClassificationStats();
      setMeshStats(stats);
      setShowMeshStats(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get mesh classification stats');
      console.error('Mesh stats error:', error);
    }
  };
  
  // Collision Detection Handlers (Phase 3.3)
  const handleModelCollision = (event: any) => {
    const { modelId, meshType, collisionForce, totalCollisions } = event.nativeEvent;
    const message = `Model ${modelId.substring(0, 8)} hit ${meshType}!\nForce: ${collisionForce.toFixed(2)}\nTotal: ${totalCollisions}`;
    setLastCollision(message);
    console.log('🔴 Collision detected:', event.nativeEvent);
  };
  
  const handleToggleCollision = async () => {
    if (!arViewRef.current) return;
    
    try {
      const newState = !isCollisionEnabled;
      await arViewRef.current.setCollisionDetection(newState);
      setIsCollisionEnabled(newState);
    } catch (error) {
      console.error('Error toggling collision:', error);
    }
  };
  
  const handleToggleCollisionDebug = async () => {
    if (!arViewRef.current) return;
    
    try {
      const newState = !isCollisionDebugMode;
      await arViewRef.current.setCollisionDebugMode(newState);
      setIsCollisionDebugMode(newState);
    } catch (error) {
      console.error('Error toggling collision debug:', error);
    }
  };
  
  const handleShowCollisionStats = async () => {
    if (!arViewRef.current) return;

    try {
      const stats = await arViewRef.current.getCollisionStats();
      setCollisionStats(stats);
      setShowCollisionStats(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get collision stats');
      console.error('Collision stats error:', error);
    }
  };
  
  const handleResetCollisionCount = async () => {
    if (!arViewRef.current) return;
    
    try {
      await arViewRef.current.resetCollisionCount();
      setLastCollision(null);
      Alert.alert('Reset', 'Collision count reset to 0');
    } catch (error) {
      console.error('Error resetting collision count:', error);
    }
  };

  // Quality Settings Handlers (Phase 3.4)
  const handleSetOcclusionQuality = async (quality: 'low' | 'medium' | 'high') => {
    if (!arViewRef.current) return;
    
    try {
      await arViewRef.current.setOcclusionQuality(quality);
      setOcclusionQuality(quality);
      Alert.alert('Quality Updated', `Occlusion quality set to: ${quality}`);
    } catch (error) {
      console.error('Error setting occlusion quality:', error);
    }
  };
  
  const handleToggleOcclusion = async () => {
    if (!arViewRef.current) return;
    
    try {
      const newState = !isOcclusionEnabled;
      await arViewRef.current.setOcclusionEnabled(newState);
      setIsOcclusionEnabled(newState);
      Alert.alert(
        newState ? 'Occlusion Enabled' : 'Occlusion Disabled',
        newState
          ? 'Scene reconstruction occlusion is active.'
          : 'Scene reconstruction occlusion is inactive.'
      );
    } catch (error) {
      console.error('Error toggling occlusion:', error);
    }
  };
  
  const handleToggleFPS = async () => {
    if (!arViewRef.current) return;
    
    try {
      const newState = !showFPSCounter;
      await arViewRef.current.setShowFPS(newState);
      setShowFPSCounter(newState);

      if (!newState) setCurrentFPS(0);
    } catch (error) {
      console.error('Error toggling FPS:', error);
    }
  };
  
  const handleShowQualitySettings = async () => {
    if (!arViewRef.current) return;
    
    try {
      const stats = await arViewRef.current.getQualityStats();
      setQualityStats(stats);
      setShowQualitySettings(true);
    } catch (error) {
      console.error('Error fetching quality stats:', error);
      Alert.alert('Error', 'Failed to load quality statistics');
    }
  };

  // Phase 3.5: Haptic Feedback & Boundary Warnings Handlers
  const handleToggleHaptic = async () => {
    if (!arViewRef.current) return;
    
    try {
      const newState = !isHapticEnabled;
      await arViewRef.current.setHapticFeedback(newState);
      setIsHapticEnabled(newState);
      Alert.alert(
        newState ? 'Haptic Feedback Enabled' : 'Haptic Feedback Disabled',
        newState
          ? 'You will feel vibrations when models collide with scene meshes.'
          : 'Haptic feedback on collisions is disabled.'
      );
    } catch (error) {
      console.error('Error toggling haptic feedback:', error);
    }
  };

  const handleToggleBoundaryWarnings = async () => {
    if (!arViewRef.current) return;
    
    try {
      const newState = !isBoundaryWarningsEnabled;
      await arViewRef.current.setBoundaryWarnings(newState);
      setIsBoundaryWarningsEnabled(newState);
      Alert.alert(
        newState ? 'Boundary Warnings Enabled' : 'Boundary Warnings Disabled',
        newState
          ? 'You will be warned when approaching real walls or obstacles.'
          : 'Boundary proximity warnings are disabled.'
      );
    } catch (error) {
      console.error('Error toggling boundary warnings:', error);
    }
  };

  const handleSetBoundaryDistance = async (distance: number) => {
    if (!arViewRef.current) return;
    
    try {
      await arViewRef.current.setBoundaryWarningDistance(distance);
      setBoundaryDistance(distance);
    } catch (error) {
      console.error('Error setting boundary distance:', error);
    }
  };

  const handleBoundaryWarning = (event: {
    nativeEvent: {
      distance: number;
      warningThreshold: number;
      meshType: string;
      cameraPosition: { x: number; y: number; z: number };
    };
  }) => {
    const { distance, warningThreshold, meshType, cameraPosition } = event.nativeEvent;
    const warningText = `⚠️ ${meshType.toUpperCase()} - ${(distance * 100).toFixed(0)}cm away`;
    setLastBoundaryWarning(warningText);
    
    console.log('⚠️ Boundary Warning:', {
      distance: `${(distance * 100).toFixed(0)}cm`,
      threshold: `${(warningThreshold * 100).toFixed(0)}cm`,
      meshType,
      cameraPosition
    });
    
    // Auto-clear after 3 seconds
    setTimeout(() => setLastBoundaryWarning(null), 3000);
  };

  const handleShowHapticSettings = async () => {
    if (!arViewRef.current) return;
    
    try {
      const hapticState = await arViewRef.current.getHapticFeedbackState();
      const boundaryState = await arViewRef.current.getBoundaryWarningsState();
      const distance = await arViewRef.current.getBoundaryWarningDistance();
      
      setIsHapticEnabled(hapticState);
      setIsBoundaryWarningsEnabled(boundaryState);
      setBoundaryDistance(distance);
      setShowHapticSettings(true);
    } catch (error) {
      console.error('Error fetching haptic settings:', error);
      Alert.alert('Error', 'Failed to load haptic settings');
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
        onModelCollision={handleModelCollision}
        onBoundaryWarning={handleBoundaryWarning}
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

        {/* Help Button - Top Right */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={handleShowOnboarding}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>

        <View style={styles.bottomControls} pointerEvents="box-none">
          <View style={styles.controlsToggleRow} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.controlsToggleButton, !isARReady && styles.buttonDisabled]}
              onPress={() => setControlsCollapsed(prev => !prev)}
              disabled={!isARReady}
            >
              <Text style={styles.controlsToggleText}>
                {controlsCollapsed ? '▲ Controls' : '▼ Controls'}
              </Text>
            </TouchableOpacity>
          </View>

          {!controlsCollapsed && (
            <ScrollView
              style={styles.controlsScroll}
              contentContainerStyle={styles.controlsContainer}
              showsVerticalScrollIndicator={false}
            >
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
                  style={[styles.button, styles.buttonPortal, isPortalMode && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleTogglePortalMode}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{isPortalMode ? '🌌 Portal ON' : '📹 Normal AR'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, !isARReady && styles.buttonDisabled]}
                  onPress={handleShowMeshStats}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>📊 Mesh Stats</Text>
                </TouchableOpacity>
              </View>

              {/* Collision Detection Controls (Phase 3.3) */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonWarning, isCollisionEnabled && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleToggleCollision}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{isCollisionEnabled ? '⚡ Collision ON' : '⚡ Collision OFF'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, !isARReady && styles.buttonDisabled]}
                  onPress={handleShowCollisionStats}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>📈 Collision Stats</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, isCollisionDebugMode && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleToggleCollisionDebug}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{isCollisionDebugMode ? '🐛 Debug ON' : '🐛 Debug OFF'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger, !isARReady && styles.buttonDisabled]}
                  onPress={handleResetCollisionCount}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>Reset Count</Text>
                </TouchableOpacity>
              </View>

              {lastCollision && (
                <View style={styles.collisionAlert}>
                  <Text style={styles.collisionAlertTitle}>🔴 Collision Detected!</Text>
                  <Text style={styles.collisionAlertText}>{lastCollision}</Text>
                </View>
              )}

              {lastBoundaryWarning && (
                <View style={styles.boundaryWarningAlert}>
                  <Text style={styles.boundaryWarningText}>{lastBoundaryWarning}</Text>
                </View>
              )}

              {/* Quality Settings Controls (Phase 3.4) */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, isOcclusionEnabled && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleToggleOcclusion}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{isOcclusionEnabled ? '👁️ Occlusion ON' : '👁️ Occlusion OFF'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, !isARReady && styles.buttonDisabled]}
                  onPress={handleShowQualitySettings}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>⚙️ Quality Stats</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, showFPSCounter && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleToggleFPS}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{showFPSCounter ? '📊 FPS ON' : '📊 FPS OFF'}</Text>
                </TouchableOpacity>

                {showFPSCounter && (
                  <View style={[styles.button, styles.fpsDisplay]}>
                    <Text style={styles.fpsText}>{currentFPS.toFixed(1)} FPS</Text>
                  </View>
                )}
              </View>

              {/* Haptic Feedback & Boundary Warnings Controls (Phase 3.5) */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, isHapticEnabled && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleToggleHaptic}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{isHapticEnabled ? '📳 Haptic ON' : '📳 Haptic OFF'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, !isARReady && styles.buttonDisabled]}
                  onPress={handleShowHapticSettings}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>⚙️ Haptic Settings</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, isBoundaryWarningsEnabled && styles.buttonToggleActive, !isARReady && styles.buttonDisabled]}
                  onPress={handleToggleBoundaryWarnings}
                  disabled={!isARReady}
                >
                  <Text style={styles.buttonText}>{isBoundaryWarningsEnabled ? '⚠️ Boundary ON' : '⚠️ Boundary OFF'}</Text>
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
            </ScrollView>
          )}
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
                          value={transformations[selectedModelId]?.position?.[axis as Axis] ?? 0}
                          onValueChange={(value) => handlePositionChange(axis as Axis, value)}
                          minimumTrackTintColor="#34C759"
                          maximumTrackTintColor="#3A3A3C"
                          thumbTintColor="#34C759"
                        />
                        <Text style={styles.compactValue}>
                          {(transformations[selectedModelId]?.position?.[axis as Axis] ?? 0).toFixed(1)}
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

      {/* Mesh Classification Stats Modal */}
      <Modal
        visible={showMeshStats}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMeshStats(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowMeshStats(false)}
        >
          <TouchableOpacity
            style={styles.statsPanel}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>📊 Mesh Classification Stats</Text>
              <TouchableOpacity
                style={styles.transformCloseButton}
                onPress={() => setShowMeshStats(false)}
              >
                <Text style={styles.transformCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statsContent}>
              {meshStats && (
                <View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Meshes:</Text>
                    <Text style={styles.statValue}>{meshStats.totalMeshes || 0}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Scene Reconstruction:</Text>
                    <Text style={[styles.statValue, meshStats.meshReconstructionEnabled ? styles.statEnabled : styles.statDisabled]}>
                      {meshStats.meshReconstructionEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Portal Mode:</Text>
                    <Text style={[styles.statValue, meshStats.portalModeEnabled ? styles.statEnabled : styles.statDisabled]}>
                      {meshStats.portalModeEnabled ? '✅ Active' : 'Inactive'}
                    </Text>
                  </View>

                  {meshStats.meshClassifications && Object.keys(meshStats.meshClassifications).length > 0 && (
                    <>
                      <Text style={styles.statsSubtitle}>Detected Surfaces:</Text>
                      {Object.entries(meshStats.meshClassifications).map(([type, count]) => (
                        <View key={type} style={styles.statRow}>
                          <Text style={styles.statLabel}>{type}:</Text>
                          <Text style={styles.statValue}>{count as number}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {(!meshStats.meshClassifications || Object.keys(meshStats.meshClassifications).length === 0) && (
                    <View style={styles.statsNote}>
                      <Text style={styles.statsNoteText}>
                        ℹ️ No surface classifications detected yet.
                        {'\n\n'}
                        Scene reconstruction requires:
                        {'\n'}• LiDAR device (iPhone 12 Pro+ / iPad Pro 2020+)
                        {'\n'}• iOS 13.0+
                        {'\n\n'}
                        Move your device slowly to scan the environment.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {!meshStats && (
                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>Loading mesh statistics...</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Collision Detection Stats Modal (Phase 3.3) */}
      <Modal
        visible={showCollisionStats}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCollisionStats(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowCollisionStats(false)}
        >
          <TouchableOpacity
            style={styles.statsPanel}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>⚡ Collision Detection Stats</Text>
              <TouchableOpacity
                style={styles.transformCloseButton}
                onPress={() => setShowCollisionStats(false)}
              >
                <Text style={styles.transformCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statsContent}>
              {collisionStats && (
                <View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Collision Detection:</Text>
                    <Text style={[styles.statValue, collisionStats.enabled ? styles.statEnabled : styles.statDisabled]}>
                      {collisionStats.enabled ? '✅ Enabled' : '❌ Disabled'}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Debug Mode:</Text>
                    <Text style={[styles.statValue, collisionStats.debugMode ? styles.statEnabled : styles.statDisabled]}>
                      {collisionStats.debugMode ? '✅ Active' : 'Inactive'}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Collisions:</Text>
                    <Text style={styles.statValue}>{collisionStats.totalCollisions || 0}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Models with Physics:</Text>
                    <Text style={styles.statValue}>{collisionStats.modelsWithPhysics || 0}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Meshes with Physics:</Text>
                    <Text style={styles.statValue}>{collisionStats.meshesWithPhysics || 0}</Text>
                  </View>

                  <View style={styles.statsNote}>
                    <Text style={styles.statsNoteText}>
                      ℹ️ Collision Detection Info:
                      {'\n\n'}
                      • Models use dynamic physics bodies
                      {'\n'}• Meshes use static physics bodies
                      {'\n'}• Debug mode shows collision points
                      {'\n'}• Red spheres appear at contact points
                      {'\n\n'}
                      Requires scene reconstruction mesh from LiDAR scanning.
                    </Text>
                  </View>
                </View>
              )}

              {!collisionStats && (
                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>Loading collision statistics...</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Quality Settings Modal (Phase 3.4) */}
      <Modal
        visible={showQualitySettings}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQualitySettings(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowQualitySettings(false)}
        >
          <TouchableOpacity
            style={styles.statsPanel}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>⚙️ Quality & Performance Settings</Text>
              <TouchableOpacity
                style={styles.transformCloseButton}
                onPress={() => setShowQualitySettings(false)}
              >
                <Text style={styles.transformCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statsContent}>
              {qualityStats && (
                <View>
                  {/* Occlusion Quality Selector */}
                  <Text style={styles.statsSubtitle}>Occlusion Quality:</Text>
                  <View style={styles.qualityButtonRow}>
                    <TouchableOpacity
                      style={[styles.qualityButton, occlusionQuality === 'low' && styles.qualityButtonActive]}
                      onPress={() => handleSetOcclusionQuality('low')}
                    >
                      <Text style={[styles.qualityButtonText, occlusionQuality === 'low' && styles.qualityButtonTextActive]}>Low</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.qualityButton, occlusionQuality === 'medium' && styles.qualityButtonActive]}
                      onPress={() => handleSetOcclusionQuality('medium')}
                    >
                      <Text style={[styles.qualityButtonText, occlusionQuality === 'medium' && styles.qualityButtonTextActive]}>Medium</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.qualityButton, occlusionQuality === 'high' && styles.qualityButtonActive]}
                      onPress={() => handleSetOcclusionQuality('high')}
                    >
                      <Text style={[styles.qualityButtonText, occlusionQuality === 'high' && styles.qualityButtonTextActive]}>High</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Occlusion Enabled:</Text>
                    <Text style={[styles.statValue, qualityStats.occlusionEnabled ? styles.statEnabled : styles.statDisabled]}>
                      {qualityStats.occlusionEnabled ? '✅ Yes' : '❌ No'}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>FPS Counter:</Text>
                    <Text style={[styles.statValue, qualityStats.showFPS ? styles.statEnabled : styles.statDisabled]}>
                      {qualityStats.showFPS ? '✅ Active' : 'Inactive'}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Current FPS:</Text>
                    <Text style={styles.statValue}>{qualityStats.currentFPS.toFixed(1)}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Mesh Count:</Text>
                    <Text style={styles.statValue}>{qualityStats.meshCount}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Model Count:</Text>
                    <Text style={styles.statValue}>{qualityStats.modelCount}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Scene Reconstruction:</Text>
                    <Text style={[styles.statValue, qualityStats.isMeshReconstructionEnabled ? styles.statEnabled : styles.statDisabled]}>
                      {qualityStats.isMeshReconstructionEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </Text>
                  </View>

                  <View style={styles.statsNote}>
                    <Text style={styles.statsNoteText}>
                      ℹ️ Performance Tips:
                      {'\n\n'}
                      • Lower occlusion quality for better FPS
                      {'\n'}• Disable occlusion temporarily for debugging
                      {'\n'}• Scene reconstruction requires LiDAR device
                      {'\n'}• Target FPS: 60 (ideal), 30+ (acceptable)
                      {'\n\n'}
                      Occlusion quality affects mesh density and processing overhead.
                    </Text>
                  </View>
                </View>
              )}

              {!qualityStats && (
                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>Loading quality statistics...</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Haptic Feedback & Boundary Warnings Settings Modal (Phase 3.5) */}
      <Modal
        visible={showHapticSettings}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHapticSettings(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowHapticSettings(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📳 Haptic Feedback & Boundary Settings</Text>
              <TouchableOpacity onPress={() => setShowHapticSettings(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Haptic Feedback Section */}
              <View style={styles.statsSection}>
                <Text style={styles.statsTitle}>Haptic Feedback</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Status:</Text>
                  <Text style={[styles.statValue, isHapticEnabled ? styles.statEnabled : styles.statDisabled]}>
                    {isHapticEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, isHapticEnabled && styles.buttonToggleActive]}
                  onPress={handleToggleHaptic}
                >
                  <Text style={styles.buttonText}>{isHapticEnabled ? 'Disable Haptics' : 'Enable Haptics'}</Text>
                </TouchableOpacity>

                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>
                    Haptic feedback provides tactile vibrations when 3D models collide with scene meshes (walls, floors, etc).
                    Collision intensity determines vibration strength.
                  </Text>
                </View>
              </View>

              {/* Boundary Warnings Section */}
              <View style={styles.statsSection}>
                <Text style={styles.statsTitle}>Boundary Warnings</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Status:</Text>
                  <Text style={[styles.statValue, isBoundaryWarningsEnabled ? styles.statEnabled : styles.statDisabled]}>
                    {isBoundaryWarningsEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.buttonInfo, isBoundaryWarningsEnabled && styles.buttonToggleActive]}
                  onPress={handleToggleBoundaryWarnings}
                >
                  <Text style={styles.buttonText}>{isBoundaryWarningsEnabled ? 'Disable Warnings' : 'Enable Warnings'}</Text>
                </TouchableOpacity>

                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>
                    Boundary warnings alert you when your camera approaches real walls or obstacles.
                    Helps prevent collisions with physical environment.
                  </Text>
                </View>
              </View>

              {/* Warning Distance Slider */}
              <View style={styles.statsSection}>
                <Text style={styles.statsTitle}>Warning Distance</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Current Distance:</Text>
                  <Text style={styles.statValue}>{(boundaryDistance * 100).toFixed(0)} cm</Text>
                </View>

                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>10 cm</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.1}
                    maximumValue={2.0}
                    step={0.1}
                    value={boundaryDistance}
                    onValueChange={handleSetBoundaryDistance}
                    minimumTrackTintColor="#4A90E2"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#4A90E2"
                  />
                  <Text style={styles.sliderLabel}>200 cm</Text>
                </View>

                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>
                    Adjust the distance at which boundary warnings trigger.
                    Lower values = closer to walls before warning.
                    Higher values = more advance notice.
                  </Text>
                </View>
              </View>

              {/* Tips Section */}
              <View style={styles.statsSection}>
                <View style={styles.statsNote}>
                  <Text style={styles.statsNoteText}>
                    ℹ️ Usage Tips:
                    {'\n\n'}
                    • Haptics require iOS device with Taptic Engine
                    {'\n'}• Boundary warnings use LiDAR scene reconstruction
                    {'\n'}• Warnings throttled to prevent spam (1 per second)
                    {'\n'}• Double-tap haptic pattern for boundary warnings
                    {'\n'}• Collision haptics scale with impact force
                  </Text>
                </View>
              </View>
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

      {/* Onboarding Modal */}
      <AROnboardingModal
        visible={showOnboarding}
        onClose={handleCloseOnboarding}
      />
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
  helpButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  controlsContainer: {
    padding: 12,
    gap: 12
  },
  bottomControls: {
    marginBottom: 16,
    pointerEvents: 'box-none'
  },
  controlsToggleRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none'
  },
  controlsToggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  controlsToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  controlsScroll: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 12,
    maxHeight: '42%'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  buttonPortal: {
    flex: 1,
    backgroundColor: '#5856D6'
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
    fontSize: 14,
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
  // Mesh Stats Modal styles
  statsPanel: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 100,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  statsContent: {
    padding: 20
  },
  statsSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 15
  },
  statValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  statEnabled: {
    color: '#34C759'
  },
  statDisabled: {
    color: '#FF3B30'
  },
  statsNote: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginTop: 16
  },
  statsNoteText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20
  },
  // Collision Alert (Phase 3.3)
  collisionAlert: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5
  },
  collisionAlertTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  collisionAlertText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18
  },
  // Boundary Warning Alert (Phase 3.5)
  boundaryWarningAlert: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3
  },
  boundaryWarningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  // Quality Settings (Phase 3.4)
  qualityButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8
  },
  qualityButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center'
  },
  qualityButtonActive: {
    backgroundColor: '#5856D6',
    borderColor: '#fff'
  },
  qualityButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600'
  },
  qualityButtonTextActive: {
    color: '#fff'
  },
  fpsDisplay: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fpsText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: 'bold'
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
