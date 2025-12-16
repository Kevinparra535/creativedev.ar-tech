import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { ARKitView, ARKitViewRef, ModelPlacedEvent, PlaneData } from '../../../modules/expo-arkit';
import type { RootStackParamList } from '../navigation/types';

type GuidedWalkthroughRouteProp = RouteProp<RootStackParamList, 'GuidedWalkthrough'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GuidedWalkthrough'>;

type Step = 'scan' | 'ready' | 'walk';

export const GuidedWalkthroughScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GuidedWalkthroughRouteProp>();
  const arViewRef = useRef<ARKitViewRef>(null);

  const { modelPath, modelDimensions } = route.params;

  const [arReady, setArReady] = useState(false);
  const [planeCount, setPlaneCount] = useState(0);
  const [step, setStep] = useState<Step>('scan');
  const [coverage, setCoverage] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [isScanReady, setIsScanReady] = useState(false);
  const [modelId, setModelId] = useState<string | null>(null);
  const [arErrorMessage, setArErrorMessage] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const target = useMemo(() => {
    const width = modelDimensions[0];
    const depth = modelDimensions[2];

    const pad = 1;
    const minSide = 1.2;
    const maxSide = 4;

    const targetWidth = Math.max(minSide, Math.min(maxSide, width + pad));
    const targetLength = Math.max(minSide, Math.min(maxSide, depth + pad));

    return { targetWidth, targetLength };
  }, [modelDimensions]);

  useEffect(() => {
    if (!arReady) return;

    const viewRef = arViewRef.current;

    const timer = setTimeout(() => {
      viewRef?.setPlaneVisibility(true);
      viewRef?.startScanGuidance(modelPath, 1, target.targetWidth, target.targetLength);
    }, 350);

    return () => {
      clearTimeout(timer);
      viewRef?.stopScanGuidance();
    };
  }, [arReady, modelPath, target.targetLength, target.targetWidth]);

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

  const handleARInitialized = (event: { nativeEvent: { success: boolean; message: string } }) => {
    if (event.nativeEvent.success) {
      setArReady(true);
    }
  };

  const handlePlaneDetected = (event: { nativeEvent: { plane: PlaneData; totalPlanes: number } }) => {
    setPlaneCount(event.nativeEvent.totalPlanes);
  };

  const handleScanGuidanceUpdated = (event: {
    nativeEvent: { coverage: number; isStable: boolean; ready: boolean };
  }) => {
    setCoverage(event.nativeEvent.coverage);
    setIsStable(event.nativeEvent.isStable);
    setIsScanReady(event.nativeEvent.ready);
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
            arViewRef.current?.startScanGuidance(modelPath, 1, target.targetWidth, target.targetLength);
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
    return 'Escaneo guiado';
  })();

  const description = (() => {
    if (!arReady) return 'Inicializando cámara y sesión AR...';

    if (step === 'walk') {
      return 'Camina dentro del modelo. Si necesitas recalibrar, usa Reset.';
    }

    if (step === 'ready') {
      return 'Zona escaneada y estable. Presiona “Colocar” para fijar el modelo.';
    }

    // scan
    if (planeCount === 0) {
      return 'Apunta al piso y mueve el dispositivo lentamente hasta detectar una superficie.';
    }

    return (
      `Escanea solo el rectángulo indicado (aprox. ${target.targetWidth.toFixed(1)}m x ${target.targetLength.toFixed(1)}m). ` +
      `Progreso: ${progressPct}% • Estable: ${isStable ? 'sí' : 'no'}`
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
          onPlaneDetected={handlePlaneDetected}
          onScanGuidanceUpdated={handleScanGuidanceUpdated}
          onModelPlaced={handleModelPlaced}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{description}</Text>
        {!!arErrorMessage && (
          <Text style={[styles.text, { marginTop: 6, color: '#FFD60A' }]}>⚠️ {arErrorMessage}</Text>
        )}
      </View>

      {(step === 'scan' || step === 'ready') && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, (!arReady || !isScanReady || isPlacing) && styles.disabledButton]}
            onPress={handlePlace}
            disabled={!arReady || !isScanReady || isPlacing}
          >
            <Text style={[styles.primaryButtonText, (!arReady || !isScanReady || isPlacing) && styles.disabledButtonText]}>
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
            <Text style={styles.primaryButtonText}>Finalizar ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {(step === 'scan' || step === 'ready') && !arReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0A84FF" />
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
    flex: 1,
    position: 'relative'
  },
  arView: {
    flex: 1
  },
  panel: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#38383A'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6
  },
  text: {
    fontSize: 14,
    color: '#8E8E93',
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
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
