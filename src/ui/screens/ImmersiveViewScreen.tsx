import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ARKitView,
  ARKitViewRef,
  ExpoARKitModule,
} from '../../../modules/expo-arkit';
import type { CollisionEvent } from '../../../modules/expo-arkit/src/ExpoARKitModule';
import type { RootStackParamList } from '../navigation/types';

type ImmersiveViewRouteProp = RouteProp<RootStackParamList, 'ImmersiveView'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ImmersiveView'>;

export const ImmersiveViewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ImmersiveViewRouteProp>();
  const arViewRef = useRef<ARKitViewRef>(null);

  const { modelPath, modelId, alignment, virtualWall, realWall } = route.params;

  // State
  const [portalModeEnabled, setPortalModeEnabled] = useState(true);
  const [meshReconstructionEnabled, setMeshReconstructionEnabled] = useState(true);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [arReady, setArReady] = useState(false);

  // Refs
  const collisionWarningTimeout = useRef<NodeJS.Timeout | null>(null);
  const modelLoadedRef = useRef(false);

  // Load model when AR is ready and re-apply alignment transformation
  useEffect(() => {
    if (!arReady || modelLoadedRef.current) return;

    const loadModelWithAlignment = async () => {
      const viewTag = arViewRef.current?.getViewTag?.();
      if (!viewTag) {
        console.error('❌ No view tag available');
        return;
      }

      try {
        console.log('📦 Loading model in Immersive View:', modelPath);

        // Load the model at origin (it will be transformed after loading)
        await arViewRef.current?.loadModel(modelPath, 1, [0, 0, -1]);

        // Wait a bit for the model to be placed
        await new Promise(resolve => setTimeout(resolve, 500));

        // Re-apply the alignment transformation
        console.log('🎯 Re-applying alignment transformation...');
        await ExpoARKitModule.applyAlignmentTransform(
          viewTag,
          modelId,
          alignment.transformMatrix ?? []
        );

        console.log('✅ Model loaded and aligned in Immersive View');

        // Disable plane detection since model is now placed
        arViewRef.current?.setPlaneVisibility(false);

        // Enable Portal Mode
        await ExpoARKitModule.setPortalMode(viewTag, true);

        // Enable occlusion
        await ExpoARKitModule.setOcclusionEnabled(viewTag, true);

        modelLoadedRef.current = true;
      } catch (error) {
        console.error('❌ Error loading model in Immersive View:', error);
        Alert.alert('Error', 'No se pudo cargar el modelo en vista inmersiva');
      }
    };

    loadModelWithAlignment();

    // Hide instructions after 8 seconds
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 8000);

    return () => {
      clearTimeout(timer);
      if (collisionWarningTimeout.current) {
        clearTimeout(collisionWarningTimeout.current);
      }
    };
  }, [arReady, modelId, modelPath, alignment]);

  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    if (event.nativeEvent.success) {
      setArReady(true);
      console.log('✅ AR Session initialized for Immersive View');
    }
  };

  const handleARError = (event: { nativeEvent: { error: string } }) => {
    const { error } = event.nativeEvent;
    console.error('❌ AR Error:', error);
    Alert.alert('Error de AR', error);
  };

  const handleTogglePortalMode = async () => {
    const viewTag = arViewRef.current?.getViewTag?.();
    if (!viewTag) return;

    const nextPortalMode = !portalModeEnabled;

    try {
      await ExpoARKitModule.setPortalMode(viewTag, nextPortalMode);
      setPortalModeEnabled(nextPortalMode);

      // Show brief feedback
      console.log(
        `🌌 Portal Mode ${nextPortalMode ? 'enabled' : 'disabled'}`
      );
    } catch (err) {
      console.error('Failed to toggle Portal Mode:', err);
      Alert.alert('Error', 'No se pudo cambiar el modo portal');
    }
  };

  const handleModelCollision = (event: { nativeEvent: CollisionEvent }) => {
    const { modelId: collidedModelId, contactPoint, collisionForce } = event.nativeEvent;

    console.log(
      `⚠️ Collision detected - Model: ${collidedModelId}, Force: ${collisionForce.toFixed(1)}`
    );

    // Clear previous warning timeout
    if (collisionWarningTimeout.current) {
      clearTimeout(collisionWarningTimeout.current);
    }

    // Show collision warning
    setCollisionWarning(`Objeto detectado`);

    // Auto-hide after 2 seconds
    collisionWarningTimeout.current = setTimeout(() => {
      setCollisionWarning(null);
    }, 2000);

    // Haptic feedback is handled natively
  };

  const handleFinish = () => {
    Alert.alert(
      '¿Finalizar vista inmersiva?',
      'Volverás al inicio del flujo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'default',
          onPress: () => {
            console.log('✅ Immersive View finished');
            // Return to top of stack (typically Home or ModelPreview)
            navigation.popToTop();
          },
        },
      ]
    );
  };

  const handleDismissInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* AR View (fullscreen) */}
      <View style={styles.arContainer}>
        <ARKitView
          ref={arViewRef}
          style={styles.arView}
          onARInitialized={handleARInitialized}
          onARError={handleARError}
          onModelCollision={handleModelCollision}
        />
      </View>

      {/* Portal Mode Toggle (top-left) */}
      <TouchableOpacity
        style={styles.portalToggle}
        onPress={handleTogglePortalMode}
        activeOpacity={0.7}
      >
        <Text style={styles.portalToggleText}>
          {portalModeEnabled ? '🌌 Portal ON' : '📹 Normal AR'}
        </Text>
      </TouchableOpacity>

      {/* Collision Warning (center-top) */}
      {collisionWarning && (
        <View style={styles.collisionWarning}>
          <Text style={styles.collisionWarningText}>⚠️ {collisionWarning}</Text>
        </View>
      )}

      {/* Instructions Panel (bottom, auto-hide) */}
      {showInstructions && (
        <View style={styles.instructionsPanel}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>🌌 Vista Inmersiva Activada</Text>
            <TouchableOpacity
              onPress={handleDismissInstructions}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.dismissButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.instructionsText}>
            Portal Mode está activo. Camina libremente dentro del modelo para explorar el diseño.
          </Text>
          <Text style={styles.instructionsSubtext}>
            Toca el botón "Portal" arriba para alternar entre vista inmersiva y AR normal.
          </Text>
        </View>
      )}

      {/* Finish Button (bottom) */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>Finalizar ✓</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  arContainer: {
    flex: 1,
    position: 'relative',
  },
  arView: {
    flex: 1,
  },
  portalToggle: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  portalToggleText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  collisionWarning: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 99,
  },
  collisionWarningText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  instructionsPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 98,
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  dismissButton: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  instructionsText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
    marginBottom: 8,
  },
  instructionsSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#38383A',
    zIndex: 97,
  },
  finishButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
