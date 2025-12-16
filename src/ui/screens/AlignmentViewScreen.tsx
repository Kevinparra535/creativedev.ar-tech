import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ARKitView,
  ARKitViewRef,
  ModelLoadedEvent,
  ModelPlacedEvent,
} from '../../../modules/expo-arkit';
import { wallAnchorService } from '../../services/wallAnchorService';
import type { AlignmentResultResponse } from '../../../modules/expo-arkit/src/ExpoARKitModule';
import type { RootStackParamList } from '../navigation/types';

type AlignmentViewRouteProp = RouteProp<RootStackParamList, 'AlignmentView'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlignmentView'>;

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

  // Start tap-to-place flow when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      arViewRef.current?.placeModelOnTap(modelPath, 1.0);
    }, 1000); // Delay to ensure AR is initialized

    return () => clearTimeout(timer);
  }, [modelPath]);

  const handleModelPlaced = async (event: { nativeEvent: ModelPlacedEvent }) => {
    const { modelId: placedModelId, success } = event.nativeEvent;

    if (!success || !placedModelId) {
      Alert.alert('Error', 'No se pudo colocar el modelo');
      return;
    }

    console.log('📦 Model placed with ID:', placedModelId);
    setModelId(placedModelId);

    // Automatically calculate and apply alignment
    await calculateAndApplyAlignment(placedModelId);
  };

  const calculateAndApplyAlignment = async (modelIdToAlign: string) => {
    setIsCalculating(true);

    try {
      // Calculate alignment using the service
      console.log('🔧 Calculating alignment...');
      const alignmentResult = await wallAnchorService.calculateAlignment(
        virtualWall,
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
              onPress: () => applyAlignmentToModel(modelIdToAlign, alignmentResult),
            },
          ]
        );
      } else {
        // Good quality - apply automatically
        await applyAlignmentToModel(modelIdToAlign, alignmentResult);
      }
    } catch (error) {
      setIsCalculating(false);
      console.error('❌ Error calculating alignment:', error);
      Alert.alert('Error', 'No se pudo calcular la alineación');
    }
  };

  const applyAlignmentToModel = async (
    modelIdToAlign: string,
    alignmentResult: AlignmentResultResponse
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
    } catch (error) {
      setIsApplying(false);
      console.error('❌ Error applying alignment:', error);
      Alert.alert('Error', 'No se pudo aplicar la alineación');
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.arContainer}>
        <ARKitView
          ref={arViewRef}
          style={styles.arView}
          onModelPlaced={handleModelPlaced}
        />
      </View>

      {/* Instructions Panel */}
      <View style={styles.instructionsPanel}>
        <Text style={styles.instructionsTitle}>
          {!modelId
            ? 'Toca una superficie para colocar el modelo'
            : isCalculating
            ? 'Calculando alineación...'
            : isApplying
            ? 'Aplicando transformación...'
            : alignmentApplied
            ? 'Alineación completada'
            : 'Procesando...'}
        </Text>
        <Text style={styles.instructionsText}>
          {!modelId
            ? 'Selecciona dónde quieres anclar el modelo en el espacio real'
            : isCalculating || isApplying
            ? 'Por favor espera...'
            : alignmentApplied
            ? 'El modelo está alineado con el entorno real. Presiona "Finalizar" para guardar.'
            : 'Preparando alineación...'}
        </Text>
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
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRecalculate}>
            <Text style={styles.secondaryButtonText}>Recalcular</Text>
          </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#1C1C1E',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
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
    flex: 1,
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
