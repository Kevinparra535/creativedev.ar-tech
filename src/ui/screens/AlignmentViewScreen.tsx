import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
    ModelPlacedEvent
} from '../../../modules/expo-arkit';
import type { AlignmentResultResponse } from '../../../modules/expo-arkit/src/ExpoARKitModule';
import { wallAnchorService } from '../../services/wallAnchorService';
import type { RootStackParamList } from '../navigation/types';

type AlignmentViewRouteProp = RouteProp<RootStackParamList, 'AlignmentView'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlignmentView'>;

function getInstructionCopy(params: {
  hasModel: boolean;
  arReady: boolean;
  isCalculating: boolean;
  isApplying: boolean;
  alignmentApplied: boolean;
}): { title: string; text: string } {
  const { hasModel, arReady, isCalculating, isApplying, alignmentApplied } = params;

  if (!hasModel) {
    if (!arReady) {
      return {
        title: 'Iniciando AR...',
        text: 'Inicializando cámara y sesión AR...'
      };
    }

    return {
      title: 'Cargando modelo...',
      text:
        'Colocando el modelo automáticamente (sin tap). Mantén el dispositivo estable por un momento.'
    };
  }

  if (isCalculating) {
    return { title: 'Calculando alineación...', text: 'Por favor espera...' };
  }

  if (isApplying) {
    return { title: 'Aplicando transformación...', text: 'Por favor espera...' };
  }

  if (alignmentApplied) {
    return {
      title: 'Alineación completada',
      text: 'El modelo está alineado con el entorno real. Presiona "Finalizar" para guardar.'
    };
  }

  return { title: 'Procesando...', text: 'Preparando alineación...' };
}

export const AlignmentViewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AlignmentViewRouteProp>();
  const arViewRef = useRef<ARKitViewRef>(null);

  const { modelPath, virtualWall, realWall } = route.params;

  const [modelId, setModelId] = useState<string | null>(null);
  const [alignment, setAlignment] = useState<AlignmentResultResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [alignmentApplied, setAlignmentApplied] = useState(false);
  const [arReady, setArReady] = useState(false);
  const [arErrorMessage, setArErrorMessage] = useState<string | null>(null);
  const [showAlignmentAids, setShowAlignmentAids] = useState(false);
  const [isOrientationFlipped, setIsOrientationFlipped] = useState(false);

  // Auto-load model (no tap) when AR is ready.
  useEffect(() => {
    if (!arReady) return;
    if (modelId) return;

    const timer = setTimeout(() => {
      arViewRef.current?.loadModel(modelPath, 1, [0, 0, -1]);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [arReady, modelId, modelPath]);

  // Ensure debug overlay is turned off when leaving the screen
  useEffect(() => {
    const viewRef = arViewRef.current;

    return () => {
      const viewTag = viewRef?.getViewTag?.();
      if (viewTag && modelId && showAlignmentAids) {
        ExpoARKitModule.setAlignmentDebug(viewTag, modelId, false, [0, 1, 0], [0, 1, 0]).catch(
          () => undefined
        );
      }
    };
  }, [modelId, showAlignmentAids]);

  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    if (event.nativeEvent.success) {
      setArReady(true);
    }
  };

  const handleARError = (event: { nativeEvent: { error: string } }) => {
    const { error } = event.nativeEvent;
    setArErrorMessage(error);
  };

  const handleModelReady = async (nextModelId: string) => {
    console.log('📦 Model ready with ID:', nextModelId);
    setModelId(nextModelId);
    arViewRef.current?.setPlaneVisibility(false);
    await calculateAndApplyAlignment(nextModelId);
  };

  const handleModelLoaded = async (event: {
    nativeEvent: { success: boolean; message: string; path: string; modelId: string };
  }) => {
    const { success, modelId: loadedModelId } = event.nativeEvent;
    if (!success || !loadedModelId) {
      Alert.alert('Error', 'No se pudo cargar el modelo');
      return;
    }
    await handleModelReady(loadedModelId);
  };

  const handleModelPlaced = async (event: { nativeEvent: ModelPlacedEvent }) => {
    const { modelId: placedModelId, success } = event.nativeEvent;
    if (!success || !placedModelId) {
      Alert.alert('Error', 'No se pudo colocar el modelo');
      return;
    }
    await handleModelReady(placedModelId);
  };

  const calculateAndApplyAlignment = async (modelIdToAlign: string, flipOrientation?: boolean) => {
    setIsCalculating(true);

    const shouldFlip = flipOrientation ?? isOrientationFlipped;
    const virtualWallForAlignment = shouldFlip
      ? {
          ...virtualWall,
          normal: [-virtualWall.normal[0], -virtualWall.normal[1], -virtualWall.normal[2]] as [number, number, number]
        }
      : virtualWall;

    try {
      // Calculate alignment using the service
      console.log('🔧 Calculating alignment...');
      const alignmentResult = await wallAnchorService.calculateAlignment(
        virtualWallForAlignment,
        realWall
      );

      setAlignment(alignmentResult);
      setIsCalculating(false);

      // Validate alignment quality
      const validation = wallAnchorService.validateAlignment(alignmentResult);
      const qualityDescription = wallAnchorService.getQualityDescription(validation);
      const confidence = (alignmentResult.confidence ?? 0) * 100;

      console.log('📊 Alignment quality:', validation.qualityLevel);
      console.log('📊 Confidence:', confidence.toFixed(0) + '%');

      // Show quality alert if poor
      if (validation.qualityLevel === 'poor') {
        Alert.alert(
          'Advertencia: Baja Confianza',
          `${qualityDescription}\n\nConfianza: ${confidence.toFixed(0)}%\n\n` +
            `Dimensiones:\n` +
            `Virtual: ${virtualWall.dimensions[0].toFixed(2)}m x ${virtualWall.dimensions[1].toFixed(2)}m\n` +
            `Real: ${realWall.dimensions[0].toFixed(2)}m x ${realWall.dimensions[1].toFixed(2)}m\n\n` +
            `Escala calculada: ${alignmentResult.scale?.toFixed(2)}x\n\n` +
            `${validation.warnings.join('\n')}\n\n` +
            `¿Deseas continuar o seleccionar otra pared?`,
          [
            {
              text: 'Seleccionar Otra Pared',
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Continuar de Todos Modos',
              onPress: () => applyAlignmentToModel(modelIdToAlign, alignmentResult, virtualWallForAlignment),
            },
          ]
        );
      } else {
        // Good quality - apply automatically
        await applyAlignmentToModel(modelIdToAlign, alignmentResult, virtualWallForAlignment);
      }
    } catch (error) {
      setIsCalculating(false);
      console.error('❌ Error calculating alignment:', error);
      Alert.alert('Error', 'No se pudo calcular la alineación');
    }
  };

  const applyAlignmentToModel = async (
    modelIdToAlign: string,
    alignmentResult: AlignmentResultResponse,
    virtualWallUsed: typeof virtualWall
  ) => {
    setIsApplying(true);

    try {
      // Get the view tag from the ref
      const viewTag = arViewRef.current?.getViewTag?.();

      if (!viewTag) {
        throw new Error('No se pudo obtener el tag de la vista AR');
      }

      console.log('🎯 Applying alignment to model:', modelIdToAlign);
      await wallAnchorService.applyAlignment(viewTag, modelIdToAlign, alignmentResult);

      setIsApplying(false);
      setAlignmentApplied(true);

      // Show success message
      const validation = wallAnchorService.validateAlignment(alignmentResult);
      const qualityDescription = wallAnchorService.getQualityDescription(validation);

      Alert.alert(
        'Alineación Completada',
        `${qualityDescription}\n\nConfianza: ${((alignmentResult.confidence ?? 0) * 100).toFixed(0)}%\n\n` +
          `El modelo ha sido alineado con el entorno real.`,
        [{ text: 'OK' }]
      );

      if (showAlignmentAids) {
        ExpoARKitModule.setAlignmentDebug(
          viewTag,
          modelIdToAlign,
          true,
          [...virtualWallUsed.normal],
          [...realWall.normal]
        ).catch(() => {});
      }
    } catch (error) {
      setIsApplying(false);
      console.error('❌ Error applying alignment:', error);
      Alert.alert('Error', 'No se pudo aplicar la alineación');
    }
  };

  const handleToggleAlignmentAids = async () => {
    if (!modelId) return;

    const viewTag = arViewRef.current?.getViewTag?.();
    if (!viewTag) return;

    const next = !showAlignmentAids;
    setShowAlignmentAids(next);

    const virtualWallUsed = isOrientationFlipped
      ? {
          ...virtualWall,
          normal: [-virtualWall.normal[0], -virtualWall.normal[1], -virtualWall.normal[2]] as [number, number, number]
        }
      : virtualWall;

    try {
      await ExpoARKitModule.setAlignmentDebug(
        viewTag,
        modelId,
        next,
        [...virtualWallUsed.normal],
        [...realWall.normal]
      );
    } catch {
      // Non-fatal
    }
  };

  const handleFlipOrientation = () => {
    if (!modelId) return;

    Alert.alert(
      'Flip orientación',
      'Si el modelo quedó invertido respecto a la pared, esto invierte la normal virtual y recalcula la alineación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Flip',
          onPress: () => {
            const next = !isOrientationFlipped;
            setIsOrientationFlipped(next);
            setAlignmentApplied(false);
            setAlignment(null);

            const viewTag = arViewRef.current?.getViewTag?.();
            if (viewTag && showAlignmentAids) {
              ExpoARKitModule.setAlignmentDebug(viewTag, modelId, false, [0, 1, 0], [0, 1, 0]).catch(
                () => {}
              );
            }
            calculateAndApplyAlignment(modelId, next);
          },
        },
      ]
    );
  };

  const handleResetPlacement = () => {
    Alert.alert('Reset', '¿Deseas reiniciar la colocación del modelo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: async () => {
          const viewTag = arViewRef.current?.getViewTag?.();
          if (viewTag && modelId && showAlignmentAids) {
            ExpoARKitModule.setAlignmentDebug(viewTag, modelId, false, [0, 1, 0], [0, 1, 0]).catch(() => {});
          }

          arViewRef.current?.removeAllAnchors();
          arViewRef.current?.setPlaneVisibility(true);

          setModelId(null);
          setAlignment(null);
          setIsCalculating(false);
          setIsApplying(false);
          setAlignmentApplied(false);
          setArErrorMessage(null);
          setShowAlignmentAids(false);
          setIsOrientationFlipped(false);

          setTimeout(() => {
            arViewRef.current?.loadModel(modelPath, 1, [0, 0, -1]);
          }, 350);
        },
      },
    ]);
  };

  const handleFinish = () => {
    Alert.alert(
      'Finalizar',
      '¿Deseas guardar esta alineación y volver al inicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => {
            // Reset workflow
            wallAnchorService.reset();
            // Navigate to home
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const handleRecalculate = () => {
    if (!modelId) return;

    Alert.alert(
      'Recalcular Alineación',
      '¿Deseas recalcular la alineación del modelo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recalcular',
          onPress: () => {
            setAlignmentApplied(false);
            calculateAndApplyAlignment(modelId);
          },
        },
      ]
    );
  };

  const validation = alignment ? wallAnchorService.validateAlignment(alignment) : null;
  const qualityColor = validation ? wallAnchorService.getQualityColor(validation) : '#8E8E93';
  const qualityDescription = validation
    ? wallAnchorService.getQualityDescription(validation)
    : 'Calculando...';
  const confidence = alignment ? (alignment.confidence ?? 0) * 100 : 0;

  const { title: instructionsTitle, text: instructionsText } = getInstructionCopy({
    hasModel: modelId !== null,
    arReady,
    isCalculating,
    isApplying,
    alignmentApplied
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.arContainer}>
        <ARKitView
          ref={arViewRef}
          style={styles.arView}
          onModelLoaded={handleModelLoaded}
          onModelPlaced={handleModelPlaced}
          onARInitialized={handleARInitialized}
          onARError={handleARError}
        />
      </View>

      {/* Instructions Panel */}
      <View style={styles.instructionsPanel}>
        <Text style={styles.instructionsTitle}>{instructionsTitle}</Text>
        <Text style={styles.instructionsText}>{instructionsText}</Text>
        {!!arErrorMessage && !alignmentApplied && (
          <Text style={[styles.instructionsText, { marginTop: 6, color: '#FFD60A' }]}>⚠️ {arErrorMessage}</Text>
        )}
      </View>

      {/* Alignment Quality Panel */}
      {alignment && !isCalculating && (
        <View
          style={[
            styles.qualityPanel,
            { borderColor: qualityColor + '50', backgroundColor: qualityColor + '20' },
          ]}
        >
          <View style={styles.qualityHeader}>
            <View style={[styles.qualityIndicator, { backgroundColor: qualityColor }]} />
            <Text style={[styles.qualityTitle, { color: qualityColor }]}>
              {qualityDescription}
            </Text>
          </View>
          <Text style={styles.qualityText}>Confianza: {confidence.toFixed(0)}%</Text>
          <Text style={styles.qualityText}>
            Escala: {alignment.scale?.toFixed(2)}x
          </Text>
          {validation && validation.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {validation.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Loading Indicator */}
      {(isCalculating || isApplying) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={styles.loadingText}>
              {isCalculating ? 'Calculando alineación...' : 'Aplicando transformación...'}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {alignmentApplied && (
          <>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRecalculate}>
              <Text style={styles.secondaryButtonText}>Recalcular</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryButtonText}>Re-escanear Pared</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFlipOrientation}>
              <Text style={styles.secondaryButtonText}>Flip orientación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleToggleAlignmentAids}>
              <Text style={styles.secondaryButtonText}>
                {showAlignmentAids ? 'Ocultar ayudas' : 'Mostrar ayudas'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleResetPlacement}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !alignmentApplied && styles.disabledButton,
          ]}
          onPress={handleFinish}
          disabled={!alignmentApplied}
        >
          <Text
            style={[
              styles.primaryButtonText,
              !alignmentApplied && styles.disabledButtonText,
            ]}
          >
            Finalizar ✓
          </Text>
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
  instructionsPanel: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  qualityPanel: {
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  qualityTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  qualityText: {
    fontSize: 13,
    color: '#FFF',
    marginBottom: 2,
    fontFamily: 'Menlo',
  },
  warningsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  warningText: {
    fontSize: 12,
    color: '#FFD60A',
    marginBottom: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#1C1C1E',
    gap: 12,
  },
  primaryButton: {
    flexBasis: '100%',
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#2C2C2E',
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
  secondaryButton: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '500',
  },
});
