import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';

import { AlignmentControls } from '@/ui/ar/components/AlignmentControls';
import { useManualAdjustment } from '@/ui/ar/hooks/useManualAdjustment';

import { ARKitView, type ARKitViewRef, ExpoARKitModule } from '../../../modules/expo-arkit';

/**
 * Manual Alignment Test Screen
 *
 * Allows manual fine-tuning of model transformations:
 * - Load USDZ model
 * - Adjust position, rotation, scale with sliders
 * - Real-time preview in AR
 * - Preset transformations (center, rotate, scale)
 */
export default function ManualAlignmentScreen() {
  const arViewRef = useRef<ARKitViewRef | null>(null);
  const [viewTag, setViewTag] = useState<number | null>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // Manual adjustment hook
  const {
    state,
    isApplying,
    lastResult,
    error,
    setModel,
    updatePosition,
    updateRotation,
    updateScale,
    applyTransformation,
    reset,
    restoreLastManualAlignment,
    presets
  } = useManualAdjustment();

  const getCurrentViewTag = (): number | null => {
    const tag = arViewRef.current?.getViewTag?.();
    return typeof tag === 'number' ? tag : null;
  };

  /**
   * Handle AR view initialization
   */
  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    const { success, message } = event.nativeEvent;
    console.log('[ManualAlignmentScreen] AR initialized:', success, message);

    if (!success) {
      Alert.alert('AR Error', message);
      return;
    }

    setIsARReady(true);

    const tag = getCurrentViewTag();
    if (tag != null) {
      setViewTag(tag);
    }
  };

  /**
   * Handle model loaded event
   */
  const handleModelPlaced = async (event: { nativeEvent: { success: boolean; modelId: string } }) => {
    const { success, modelId: placedModelId } = event.nativeEvent;

    if (!success) {
      return;
    }

    console.log('[ManualAlignmentScreen] Model placed:', placedModelId);
    setModelId(placedModelId);

    const currentViewTag = viewTag ?? getCurrentViewTag();
    if (currentViewTag == null) {
      return;
    }

    if (viewTag == null) {
      setViewTag(currentViewTag);
    }

    setModel(placedModelId, currentViewTag);

    const restored = await restoreLastManualAlignment();
    if (restored?.transformation) {
      Alert.alert('Model Loaded', 'Model loaded. Restored last saved transformation.');
    } else {
      Alert.alert('Model Loaded', 'Model loaded. Use sliders to adjust transformation.');
    }
  };

  /**
   * Load USDZ model
   */
  const handleLoadModel = async () => {
    if (!isARReady) {
      Alert.alert('Error', 'AR not initialized yet. Please wait.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      setModelPath(asset.uri);
      setIsLoadingModel(true);

      console.log('[ManualAlignmentScreen] Loading model:', asset.uri);

      // Get viewTag right before using it
      const currentViewTag = viewTag ?? getCurrentViewTag();
      if (currentViewTag == null) {
        Alert.alert('Error', 'AR view not ready');
        setIsLoadingModel(false);
        return;
      }

      if (viewTag == null) {
        setViewTag(currentViewTag);
      }

      // Load model at camera position (1.5m in front)
      await ExpoARKitModule.loadModel(currentViewTag, asset.uri, 1, [0, 0, -1.5]);

      Alert.alert('Success', 'Model loaded. Tap in AR to place, then adjust with sliders.');
    } catch (err) {
      console.error('[ManualAlignmentScreen] Error loading model:', err);
      Alert.alert('Error', 'Failed to load model');
    } finally {
      setIsLoadingModel(false);
    }
  };

  /**
   * Apply current transformation
   */
  const handleApplyTransformation = async () => {
    if (!modelId) {
      Alert.alert('Error', 'No model loaded. Load a model first.');
      return;
    }

    const result = await applyTransformation();

    if (result.success) {
      Alert.alert('Success', 'Transformation applied successfully!');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  /**
   * Reset transformation
   */
  const handleReset = () => {
    reset();
    Alert.alert('Reset', 'Transformation reset to defaults');
  };

  return (
    <View style={styles.container}>
      {/* AR View */}
      <View style={styles.arContainer}>
        <ARKitView
          ref={arViewRef}
          onARInitialized={handleARInitialized}
          onModelPlaced={handleModelPlaced}
          style={styles.arView}
        />

        {/* Loading Indicator */}
        {isLoadingModel && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.loadingText}>Loading model...</Text>
          </View>
        )}

        {/* Instructions */}
        {!modelPath && (
          <View style={styles.instructionsOverlay}>
            <Text style={styles.instructionsText}>1. Load USDZ model</Text>
            <Text style={styles.instructionsText}>2. Tap in AR to place</Text>
            <Text style={styles.instructionsText}>3. Adjust with sliders</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <ScrollView contentContainerStyle={styles.controlsContainer} style={styles.controlsScroll}>
        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            disabled={isLoadingModel}
            onPress={handleLoadModel}
            style={[styles.button, styles.buttonPrimary]}
          >
            <Text style={styles.buttonText}>Load Model</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!modelId || isApplying}
            onPress={handleApplyTransformation}
            style={[styles.button, styles.buttonSuccess, (!modelId || isApplying) && styles.buttonDisabled]}
          >
            {isApplying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Apply</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!modelId}
            onPress={handleReset}
            style={[styles.button, styles.buttonSecondary, !modelId && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Transformations */}
        {modelId && (
          <View style={styles.presetsSection}>
            <Text style={styles.presetsTitle}>Quick Presets</Text>
            <View style={styles.presetsRow}>
              <TouchableOpacity onPress={presets.center} style={styles.presetButton}>
                <Text style={styles.presetButtonText}>📍 Center</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={presets.rotate90} style={styles.presetButton}>
                <Text style={styles.presetButtonText}>↻ 90°</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={presets.rotate90CCW} style={styles.presetButton}>
                <Text style={styles.presetButtonText}>↺ -90°</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={presets.scaleUp} style={styles.presetButton}>
                <Text style={styles.presetButtonText}>🔍+ x2</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={presets.scaleDown} style={styles.presetButton}>
                <Text style={styles.presetButtonText}>🔍- ÷2</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Alignment Controls */}
        {modelId && (
          <AlignmentControls
            disabled={!modelId}
            onPositionChange={updatePosition}
            onRotationChange={updateRotation}
            onScaleChange={updateScale}
            state={state}
          />
        )}

        {/* Status Info */}
        {lastResult && (
          <View
            style={[
              styles.statusCard,
              lastResult.success ? styles.statusSuccess : styles.statusError
            ]}
          >
            <Text style={styles.statusTitle}>
              {lastResult.success ? '✅ Success' : '❌ Error'}
            </Text>
            <Text style={styles.statusMessage}>{lastResult.message}</Text>
          </View>
        )}

        {error && (
          <View style={[styles.statusCard, styles.statusError]}>
            <Text style={styles.statusTitle}>❌ Error</Text>
            <Text style={styles.statusMessage}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  arContainer: {
    height: '40%',
    position: 'relative'
  },
  arView: {
    flex: 1
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 8
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4
  },
  controlsScroll: {
    flex: 1,
    backgroundColor: '#fff'
  },
  controlsContainer: {
    padding: 16
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimary: {
    backgroundColor: '#007AFF'
  },
  buttonSuccess: {
    backgroundColor: '#34C759'
  },
  buttonSecondary: {
    backgroundColor: '#8E8E93'
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  presetsSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  presetButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500'
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9'
  },
  statusError: {
    backgroundColor: '#FFEBEE'
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  statusMessage: {
    fontSize: 13,
    color: '#666'
  }
});
