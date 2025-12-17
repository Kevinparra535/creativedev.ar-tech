/**
 * Auto-Alignment Test Screen
 * 
 * Testing screen for Phase 2: Automatic Model Alignment
 * Allows testing dimension matching and auto-alignment algorithms
 */

import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as DocumentPicker from 'expo-document-picker';

import { useAutoAlignment } from '@/ui/ar/hooks/useAutoAlignment';

import { ARKitView, type ARKitViewRef, ExpoARKitModule, type ModelDimensionsResponse } from '../../../modules/expo-arkit';
import { formatDimensions, getConfidenceLevel } from '../../services/modelAlignment';

export default function AutoAlignmentTestScreen() {
  const viewRef = useRef<ARKitViewRef | null>(null);
  const [viewTag, setViewTag] = useState<number | null>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [designModelId, setDesignModelId] = useState<string | null>(null);
  const [roomScanId, setRoomScanId] = useState<string | null>(null);
  const [designDimensions, setDesignDimensions] = useState<ModelDimensionsResponse | null>(null);
  const [roomDimensions, setRoomDimensions] = useState<ModelDimensionsResponse | null>(null);

  const { state: alignmentState, alignModels, applyAlignment, validateModels, reset } = useAutoAlignment();

  const getCurrentViewTag = (): number | null => {
    const tag = viewRef.current?.getViewTag?.();
    return typeof tag === 'number' ? tag : null;
  };

  /**
   * Handle AR initialization
   */
  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    const { success, message } = event.nativeEvent;
    console.log('AR Initialized:', success, message);

    if (success) {
      setIsARReady(true);
      const tag = getCurrentViewTag();
      if (tag != null) {
        setViewTag(tag);
        console.log('ARKit View Tag:', tag);
      }
    } else {
      Alert.alert('AR Error', message);
    }
  };

  /**
   * Load architectural design model
   */
  const handleLoadDesignModel = async () => {
    if (!isARReady) {
      Alert.alert('Error', 'ARKit is not ready. Please wait.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Loading design model:', asset.uri);

        const currentViewTag = viewTag ?? getCurrentViewTag();
        if (currentViewTag == null) {
          Alert.alert('Error', 'AR view not ready');
          return;
        }

        if (viewTag == null) {
          setViewTag(currentViewTag);
        }

        // Load in camera mode (floating in front)
        await ExpoARKitModule.loadModel(currentViewTag, asset.uri, 1, [0, 0, -1.5]);

        Alert.alert('Success', 'Design model loaded. Tap to place or proceed to load room scan.');
      }
    } catch (error) {
      console.error('Error loading design model:', error);
      Alert.alert('Error', 'Failed to load design model');
    }
  };

  /**
   * Load room scan model
   */
  const handleLoadRoomScan = async () => {
    if (!isARReady) {
      Alert.alert('Error', 'ARKit is not ready. Please wait.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Loading room scan:', asset.uri);

        const currentViewTag = viewTag ?? getCurrentViewTag();
        if (currentViewTag == null) {
          Alert.alert('Error', 'AR view not ready');
          return;
        }

        if (viewTag == null) {
          setViewTag(currentViewTag);
        }

        // Load at origin
        await ExpoARKitModule.loadModel(currentViewTag, asset.uri, 1, [0, 0, 0]);

        Alert.alert('Success', 'Room scan loaded. Now fetch dimensions of both models.');
      }
    } catch (error) {
      console.error('Error loading room scan:', error);
      Alert.alert('Error', 'Failed to load room scan');
    }
  };

  /**
   * Handle model placed event
   */
  const handleModelPlaced = async (event: {
    nativeEvent: { success: boolean; modelId: string };
  }) => {
    const { success, modelId } = event.nativeEvent;

    if (success) {
      console.log('Model placed:', modelId);

      // Auto-determine if this is design or room scan based on order
      if (!designModelId) {
        setDesignModelId(modelId);
        console.log('Set as design model:', modelId);
      } else if (!roomScanId) {
        setRoomScanId(modelId);
        console.log('Set as room scan:', modelId);
        Alert.alert('Ready', 'Both models loaded! Now tap "Get Dimensions" to analyze them.');
      }
    }
  };

  /**
   * Fetch dimensions of loaded models
   */
  const handleGetDimensions = async () => {
    const currentViewTag = viewTag ?? getCurrentViewTag();
    if (!currentViewTag || !designModelId || !roomScanId) {
      Alert.alert('Error', 'Please load both design model and room scan first');
      return;
    }

    if (viewTag == null) {
      setViewTag(currentViewTag);
    }

    try {
      const designResult = await ExpoARKitModule.getModelDimensions(currentViewTag, designModelId);
      const roomResult = await ExpoARKitModule.getModelDimensions(currentViewTag, roomScanId);

      if (designResult.success && roomResult.success) {
        setDesignDimensions(designResult);
        setRoomDimensions(roomResult);
        Alert.alert('Success', 'Dimensions fetched! Review them below, then tap "Calculate Alignment".');
      } else {
        Alert.alert('Error', 'Failed to get dimensions of one or both models');
      }
    } catch (error) {
      console.error('Error getting dimensions:', error);
      Alert.alert('Error', 'Failed to fetch dimensions');
    }
  };

  /**
   * Validate models before alignment
   */
  const handleValidate = async () => {
    if (!viewTag || !designModelId || !roomScanId) {
      Alert.alert('Error', 'Please load both models and get dimensions first');
      return;
    }

    try {
      const validation = await validateModels(designModelId, roomScanId, viewTag);

      if (validation.valid) {
        Alert.alert(
          'Validation Passed',
          `Models are compatible!\n\nProportion Match: ${(validation.proportionCompatibility * 100).toFixed(0)}%\n\nYou can proceed with alignment.`
        );
      } else {
        Alert.alert(
          'Validation Issues',
          `⚠️ Found issues:\n\n${validation.warnings.join('\n')}\n\nProportion Match: ${(validation.proportionCompatibility * 100).toFixed(0)}%\n\nYou can still try alignment, but results may not be optimal.`
        );
      }
    } catch (error) {
      console.error('Error validating models:', error);
      Alert.alert('Error', 'Validation failed');
    }
  };

  /**
   * Calculate alignment
   */
  const handleCalculateAlignment = async () => {
    if (!viewTag || !designModelId || !roomScanId) {
      Alert.alert('Error', 'Please load both models and get dimensions first');
      return;
    }

    const result = await alignModels(designModelId, roomScanId, viewTag);

    if (result) {
      const confidenceLevel = getConfidenceLevel(result.confidence);
      Alert.alert(
        'Alignment Calculated',
        `✅ Alignment complete!\n\nConfidence: ${(result.confidence * 100).toFixed(0)}% (${confidenceLevel})\nScale: ${result.scale.toFixed(3)}x\n\nReview details below, then tap "Apply Alignment" to transform the model.`
      );
    } else {
      Alert.alert('Error', alignmentState.error || 'Failed to calculate alignment');
    }
  };

  /**
   * Apply alignment to design model
   */
  const handleApplyAlignment = async () => {
    if (!viewTag || !designModelId || !alignmentState.result) {
      Alert.alert('Error', 'Please calculate alignment first');
      return;
    }

    const success = await applyAlignment(designModelId, alignmentState.result, viewTag);

    if (success) {
      Alert.alert(
        'Success',
        '🎉 Alignment applied!\n\nThe design model has been automatically aligned with the room scan.\n\nWalk around to verify the alignment is correct.'
      );
    } else {
      Alert.alert('Error', alignmentState.error || 'Failed to apply alignment');
    }
  };

  /**
   * Reset everything
   */
  const handleReset = async () => {
    if (!viewTag) return;

    try {
      await ExpoARKitModule.removeAllAnchors(viewTag);
      setDesignModelId(null);
      setRoomScanId(null);
      setDesignDimensions(null);
      setRoomDimensions(null);
      reset();
      Alert.alert('Reset', 'All models removed. Start fresh.');
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* ARKit View */}
      <View style={styles.arViewContainer}>
        <ARKitView
          ref={viewRef}
          style={styles.arView}
          onARInitialized={handleARInitialized}
          onModelPlaced={handleModelPlaced}
        />
      </View>

      {/* Controls */}
      <ScrollView style={styles.controls}>
        <Text style={styles.title}>Auto-Alignment Test - Phase 2</Text>

        {/* AR Status */}
        {!isARReady && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>⏳ Initializing ARKit...</Text>
          </View>
        )}
        {isARReady && (
          <View style={styles.statusContainerReady}>
            <Text style={styles.statusTextReady}>✅ ARKit Ready</Text>
          </View>
        )}

        {/* Step 1: Load Models */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Load Models</Text>

          <TouchableOpacity
            style={[styles.button, !isARReady && styles.buttonDisabled]}
            onPress={handleLoadDesignModel}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>📐 Load Design Model (1st)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !isARReady && styles.buttonDisabled]}
            onPress={handleLoadRoomScan}
            disabled={!isARReady}
          >
            <Text style={styles.buttonText}>🏠 Load Room Scan (2nd)</Text>
          </TouchableOpacity>

          {designModelId && (
            <Text style={styles.infoText}>✅ Design loaded: {designModelId.substring(0, 8)}...</Text>
          )}
          {roomScanId && (
            <Text style={styles.infoText}>✅ Room scan loaded: {roomScanId.substring(0, 8)}...</Text>
          )}
        </View>

        {/* Step 2: Get Dimensions */}
        {designModelId && roomScanId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 2: Analyze Dimensions</Text>

            <TouchableOpacity style={styles.button} onPress={handleGetDimensions}>
              <Text style={styles.buttonText}>📏 Get Dimensions</Text>
            </TouchableOpacity>

            {designDimensions?.dimensions && (
              <View style={styles.dimensionsCard}>
                <Text style={styles.dimensionsTitle}>📐 Design Model</Text>
                <Text style={styles.dimensionsText}>
                  {formatDimensions(designDimensions.dimensions)}
                </Text>
                {designDimensions.volume && (
                  <Text style={styles.dimensionsTextSmall}>
                    Volume: {designDimensions.volume.toFixed(2)}m³
                  </Text>
                )}
              </View>
            )}

            {roomDimensions?.dimensions && (
              <View style={styles.dimensionsCard}>
                <Text style={styles.dimensionsTitle}>🏠 Room Scan</Text>
                <Text style={styles.dimensionsText}>
                  {formatDimensions(roomDimensions.dimensions)}
                </Text>
                {roomDimensions.volume && (
                  <Text style={styles.dimensionsTextSmall}>
                    Volume: {roomDimensions.volume.toFixed(2)}m³
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Validate */}
        {designDimensions && roomDimensions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 3: Validate Compatibility</Text>

            <TouchableOpacity style={styles.button} onPress={handleValidate}>
              <Text style={styles.buttonText}>🔍 Validate Models</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Calculate Alignment */}
        {designDimensions && roomDimensions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 4: Calculate Alignment</Text>

            <TouchableOpacity
              style={[styles.button, alignmentState.isCalculating && styles.buttonDisabled]}
              onPress={handleCalculateAlignment}
              disabled={alignmentState.isCalculating}
            >
              <Text style={styles.buttonText}>
                {alignmentState.isCalculating ? '⏳ Calculating...' : '🎯 Calculate Alignment'}
              </Text>
            </TouchableOpacity>

            {alignmentState.result && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>✅ Alignment Result</Text>
                <Text style={styles.resultText}>
                  Confidence: {(alignmentState.result.confidence * 100).toFixed(0)}% (
                  {getConfidenceLevel(alignmentState.result.confidence)})
                </Text>
                <Text style={styles.resultText}>
                  Scale: {alignmentState.result.scale.toFixed(3)}x
                </Text>
                <Text style={styles.resultTextSmall}>
                  Position: ({alignmentState.result.position.x.toFixed(2)}, {alignmentState.result.position.y.toFixed(2)}, {alignmentState.result.position.z.toFixed(2)})
                </Text>
              </View>
            )}

            {alignmentState.error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>❌ {alignmentState.error}</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 5: Apply Alignment */}
        {alignmentState.result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 5: Apply Alignment</Text>

            <TouchableOpacity
              style={[styles.buttonPrimary, alignmentState.isApplying && styles.buttonDisabled]}
              onPress={handleApplyAlignment}
              disabled={alignmentState.isApplying}
            >
              <Text style={styles.buttonText}>
                {alignmentState.isApplying ? '⏳ Applying...' : '🚀 Apply Alignment'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reset */}
        <TouchableOpacity style={styles.buttonReset} onPress={handleReset}>
          <Text style={styles.buttonText}>🔄 Reset All</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Load Design Model (architectural USDZ){'\n'}
            2. Tap on plane to place it{'\n'}
            3. Load Room Scan (RoomPlan USDZ){'\n'}
            4. Tap on plane to place it{'\n'}
            5. Get Dimensions → Validate → Calculate{'\n'}
            6. Apply Alignment → Walk around to verify
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  arViewContainer: {
    height: '35%',
    backgroundColor: '#1a1a1a'
  },
  arView: {
    flex: 1
  },
  controls: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  statusContainerReady: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#e8f5e9'
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  statusTextReady: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600'
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center'
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center'
  },
  buttonReset: {
    backgroundColor: '#FF5722',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  infoText: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 4,
    marginLeft: 4
  },
  dimensionsCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  dimensionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333'
  },
  dimensionsText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace'
  },
  dimensionsTextSmall: {
    fontSize: 12,
    color: '#777',
    marginTop: 2
  },
  resultCard: {
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 8,
    marginTop: 8
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#2e7d32'
  },
  resultText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 2
  },
  resultTextSmall: {
    fontSize: 12,
    color: '#558b2f',
    marginTop: 4,
    fontFamily: 'monospace'
  },
  errorCard: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  errorText: {
    fontSize: 13,
    color: '#c62828'
  },
  instructions: {
    backgroundColor: '#e3f2fd',
    padding: 14,
    borderRadius: 8,
    marginTop: 8
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1565c0'
  },
  instructionsText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 20
  }
});
