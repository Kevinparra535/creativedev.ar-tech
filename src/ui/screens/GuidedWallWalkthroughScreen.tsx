import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ARKitView, ARKitViewRef, ModelPlacedEvent } from '../../../modules/expo-arkit';
import type { RootStackParamList } from '../navigation/types';

type GuidedWallWalkthroughRouteProp = RouteProp<RootStackParamList, 'GuidedWallWalkthrough'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GuidedWallWalkthrough'>;

type Step = 'scan' | 'ready' | 'walk';

export const GuidedWallWalkthroughScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GuidedWallWalkthroughRouteProp>();
  const arViewRef = useRef<ARKitViewRef>(null);

  const { modelPath, modelDimensions } = route.params;

  const [arReady, setArReady] = useState(false);
  const [step, setStep] = useState<Step>('scan');
  const [coverage, setCoverage] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [isScanReady, setIsScanReady] = useState(false);
  const [observedPlane, setObservedPlane] = useState<{ width?: number; height?: number }>({});
  const [modelId, setModelId] = useState<string | null>(null);
  const [arErrorMessage, setArErrorMessage] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const target = useMemo(() => {
    const width = modelDimensions[0];
    const height = modelDimensions[1];
    const depth = modelDimensions[2];

    const padW = 0.6;
    const padH = 0.6;

    const minW = 0.9;
    const maxW = 4;
    const minH = 1.2;
    const maxH = 3.2;

    const unclampedW = width + padW;
    const unclampedH = height + padH;
    const targetWidth = Math.max(minW, Math.min(maxW, width + padW));
    const targetHeight = Math.max(minH, Math.min(maxH, height + padH));

    const wasWidthClamped = targetWidth !== unclampedW;
    const wasHeightClamped = targetHeight !== unclampedH;

    // Push the model away from the wall so it doesn't clip.
    const depthOffset = Math.max(0.15, Math.min(1.5, depth / 2));

    return { targetWidth, targetHeight, depthOffset, wasWidthClamped, wasHeightClamped };
  }, [modelDimensions]);

  const scaleHint = useMemo(() => {
    const width = modelDimensions[0];
    const height = modelDimensions[1];
    const depth = modelDimensions[2];
    const maxDim = Math.max(width, height, depth);

    // Heuristic for interior-scale assets authored in the wrong unit.
    // ARKit/SceneKit expects 1 unit = 1 meter for 1:1.
    if (maxDim > 30 && maxDim <= 3000) {
      return { suggestedScale: 0.01, reason: 'El modelo parece estar en centímetros (cm) en vez de metros.' };
    }
    if (maxDim > 3000) {
      return { suggestedScale: 0.001, reason: 'El modelo parece estar en milímetros (mm) en vez de metros.' };
    }
    if (maxDim > 0 && maxDim < 0.8) {
      return {
        suggestedScale: 100,
        reason: 'El modelo es muy pequeño para un interior; podría estar en metros pero escalado como cm.'
      };
    }
    return null;
  }, [modelDimensions]);

  useEffect(() => {
    if (!arReady) return;

    const viewRef = arViewRef.current;

    const timer = setTimeout(() => {
      viewRef?.setPlaneVisibility(true);
      viewRef?.startWallScanGuidance(
        modelPath,
        1,
        target.targetWidth,
        target.targetHeight,
        target.depthOffset
      );
    }, 350);

    return () => {
      clearTimeout(timer);
      viewRef?.stopScanGuidance();
    };
  }, [arReady, modelPath, target.depthOffset, target.targetHeight, target.targetWidth]);

  useEffect(() => {
    if (modelId) {
      setStep('walk');
      return;
    }

    if (isScanReady) {
      setStep('ready');
    } else {
      setStep('scan');
    }
  }, [isScanReady, modelId]);

  const handleARInitialized = (event: { nativeEvent: { success: boolean } }) => {
    if (event.nativeEvent.success) {
      setArReady(true);
    }
  };

  const handleScanGuidanceUpdated = (event: {
    nativeEvent: {
      coverage: number;
      isStable: boolean;
      ready: boolean;
      mode?: string;
      observedWidth?: number;
      observedHeight?: number;
    };
  }) => {
    // We only care about wall mode here; ignore other events.
    if (event.nativeEvent.mode && event.nativeEvent.mode !== 'wall') return;

    setCoverage(event.nativeEvent.coverage);
    setIsStable(event.nativeEvent.isStable);
    setIsScanReady(event.nativeEvent.ready);

    if (typeof event.nativeEvent.observedWidth === 'number' || typeof event.nativeEvent.observedHeight === 'number') {
      setObservedPlane({
        width: event.nativeEvent.observedWidth,
        height: event.nativeEvent.observedHeight
      });
    }
  };

  const handleARError = (event: { nativeEvent: { error: string } }) => {
    setArErrorMessage(event.nativeEvent.error);
  };

  const handleModelPlaced = (event: { nativeEvent: ModelPlacedEvent }) => {
    const { success, modelId: placedModelId } = event.nativeEvent;
    if (!success || !placedModelId) {
      Alert.alert('Error', 'No se pudo colocar el modelo');
      setIsPlacing(false);
      return;
    }

    setModelId(placedModelId);
    setIsPlacing(false);

    // Hide planes for walkthrough.
    arViewRef.current?.setPlaneVisibility(false);
  };

  const handlePlace = async () => {
    if (!arReady || !isScanReady || isPlacing) return;

    setIsPlacing(true);
    setArErrorMessage(null);

    try {
      arViewRef.current?.confirmGuidedPlacement();
    } catch (e) {
      setIsPlacing(false);
      Alert.alert('Error', String(e));
    }
  };

  const handleReset = () => {
    Alert.alert('Reset', '¿Deseas reiniciar el escaneo y la colocación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          arViewRef.current?.removeAllAnchors();
          arViewRef.current?.setPlaneVisibility(true);

          setModelId(null);
          setCoverage(0);
          setIsStable(false);
          setIsScanReady(false);
          setArErrorMessage(null);
          setIsPlacing(false);

          setTimeout(() => {
            arViewRef.current?.startWallScanGuidance(
              modelPath,
              1,
              target.targetWidth,
              target.targetHeight,
              target.depthOffset
            );
          }, 350);
        }
      }
    ]);
  };

  const handleFinish = () => {
    Alert.alert('Finalizar', '¿Deseas volver al inicio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Volver',
        onPress: () => navigation.navigate('Home')
      }
    ]);
  };

  const progressPct = Math.round(coverage * 100);

  const title = (() => {
    if (!arReady) return 'Iniciando AR...';
    if (step === 'walk') return 'Walkthrough';
    if (step === 'ready') return 'Listo para colocar';
    return 'Escaneo guiado (Pared)';
  })();

  const description = (() => {
    if (!arReady) return 'Inicializando cámara y sesión AR...';

    if (step === 'walk') {
      return 'Camina dentro del modelo. Si necesitas recalibrar, usa Reset.';
    }

    if (step === 'ready') {
      return 'Pared escaneada y estable. Presiona “Colocar” para fijar el modelo contra la pared.';
    }

    const width = modelDimensions[0];
    const height = modelDimensions[1];
    const depth = modelDimensions[2];
    const modelInfo = `Modelo (según USDZ): ${width.toFixed(2)}m x ${height.toFixed(2)}m x ${depth.toFixed(2)}m • Escala usada: 1.0`;

    const planeInfo =
      typeof observedPlane.width === 'number' && typeof observedPlane.height === 'number'
        ? `Plano detectado: ${observedPlane.width.toFixed(2)}m x ${observedPlane.height.toFixed(2)}m`
        : 'Plano detectado: —';

    const clampWarning =
      target.wasWidthClamped || target.wasHeightClamped
        ? '⚠️ Dimensiones del modelo fuera de rango para el walkthrough; posible mismatch de unidades.'
        : '';

    const scaleHintText = scaleHint
      ? `Sugerencia: prueba scale=${scaleHint.suggestedScale} si el modelo se ve gigante/chiquito. (${scaleHint.reason})`
      : '';

    return (
      `Escanea solo el rectángulo de la pared (aprox. ${target.targetWidth.toFixed(1)}m x ${target.targetHeight.toFixed(1)}m) para estabilizar la detección. ` +
      `Esto NO recalibra la escala: el modelo queda 1:1 si el USDZ está en metros. ` +
      `Progreso: ${progressPct}% • Estable: ${isStable ? 'sí' : 'no'}\n` +
      `${modelInfo}\n${planeInfo}` +
      (clampWarning ? `\n${clampWarning}` : '') +
      (scaleHintText ? `\n${scaleHintText}` : '')
    );
  })();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.arContainer}>
        <ARKitView
          ref={arViewRef}
          style={styles.arView}
          onARInitialized={handleARInitialized}
          onARError={handleARError}
          onScanGuidanceUpdated={handleScanGuidanceUpdated}
          onModelPlaced={handleModelPlaced}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{description}</Text>
        {!!arErrorMessage && (
          <Text style={[styles.text, { marginTop: 6, color: '#FFD60A' }]}>
            ⚠️ {arErrorMessage}
          </Text>
        )}
      </View>

      {(step === 'scan' || step === 'ready') && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, (!arReady || !isScanReady || isPlacing) && styles.disabledButton]}
            onPress={handlePlace}
            disabled={!arReady || !isScanReady || isPlacing}
          >
            <Text
              style={[
                styles.primaryButtonText,
                (!arReady || !isScanReady || isPlacing) && styles.disabledButtonText
              ]}
            >
              {isPlacing ? 'Colocando...' : 'Colocar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'walk' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleFinish}>
            <Text style={styles.primaryButtonText}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  arContainer: {
    flex: 1
  },
  arView: {
    flex: 1
  },
  panel: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
    backgroundColor: 'rgba(28, 28, 30, 0.95)'
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#1C1C1E'
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38383A'
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '500'
  },
  disabledButton: {
    backgroundColor: '#2C2C2E',
    opacity: 0.5
  },
  disabledButtonText: {
    color: '#8E8E93'
  }
});
