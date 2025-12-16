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
    ARErrorEvent,
    ARSessionStartedEvent,
    ARWallScanningView,
    ARWallScanningViewRef,
    RealWallData,
    TrackingStateChangedEvent,
    VerticalPlaneDetectedEvent,
} from '../../../modules/expo-arkit';
import type { RootStackParamList } from '../navigation/types';

type WallScanningRouteProp = RouteProp<RootStackParamList, 'WallScanning'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'WallScanning'>;

function getScanInstructionCopy(params: {
  arSessionReady: boolean;
  detectedPlanes: number;
  hasSelectedWall: boolean;
  canLockWall: boolean;
  selectedWallText: string;
}): { title: string; text: string } {
  const { arSessionReady, detectedPlanes, hasSelectedWall, canLockWall, selectedWallText } = params;

  if (!arSessionReady) {
    return {
      title: 'Iniciando AR...',
      text: 'Configurando detección de planos verticales...'
    };
  }

  if (detectedPlanes === 0) {
    return {
      title: 'Escanea el entorno',
      text: 'Mueve el dispositivo lentamente para detectar paredes.'
    };
  }

  if (!hasSelectedWall) {
    return {
      title: 'Toca una pared para seleccionarla',
      text: `${detectedPlanes} pared${detectedPlanes > 1 ? 'es' : ''} detectada${detectedPlanes > 1 ? 's' : ''}. Toca la pared física que corresponde a la pared del modelo.`
    };
  }

  return {
    title: canLockWall ? 'Listo para bloquear pared' : 'Pared seleccionada (validando...)',
    text: selectedWallText
  };
}

export const WallScanningScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WallScanningRouteProp>();
  const arViewRef = useRef<ARWallScanningViewRef>(null);

  const { virtualWallData, modelPath } = route.params;

  const [detectedPlanes, setDetectedPlanes] = useState<number>(0);
  const [selectedRealWall, setSelectedRealWall] = useState<RealWallData | null>(null);
  const [arSessionReady, setArSessionReady] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingStateChangedEvent['state']>('limited');
  const [trackingReason, setTrackingReason] = useState<TrackingStateChangedEvent['reason']>('initializing');
  const [trackingNormalSince, setTrackingNormalSince] = useState<number | null>(null);
  const [selectedWallSince, setSelectedWallSince] = useState<number | null>(null);

  // Start scanning when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      arViewRef.current?.startWallScanning();
    }, 500); // Small delay to ensure view is mounted

    return () => {
      clearTimeout(timer);
      arViewRef.current?.stopWallScanning();
    };
  }, []);

  // Timeout warning if no planes detected
  useEffect(() => {
    if (!arSessionReady) return;

    const timeout = setTimeout(() => {
      if (detectedPlanes === 0) {
        Alert.alert(
          'No se detectaron paredes',
          'Aseg�rate de tener buena iluminaci�n y mueve el dispositivo lentamente para escanear las paredes.',
          [
            { text: 'Seguir Intentando' },
            { text: 'Cancelar', style: 'cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timeout);
  }, [detectedPlanes, arSessionReady, navigation]);

  const handleARSessionStarted = (event: { nativeEvent: ARSessionStartedEvent }) => {
    const { started } = event.nativeEvent;
    console.log(' AR Session started:', started);
    setArSessionReady(true);
  };

  const handlePlaneDetected = (event: { nativeEvent: VerticalPlaneDetectedEvent }) => {
    const { totalPlanes, width, height, area } = event.nativeEvent;
    console.log('=� Plane detected:', { totalPlanes, width, height, area });
    setDetectedPlanes(totalPlanes);
  };

  const handleTrackingStateChanged = (event: { nativeEvent: TrackingStateChangedEvent }) => {
    const { state, reason } = event.nativeEvent;
    setTrackingState(state);
    setTrackingReason(reason);

    const now = Date.now();
    if (state === 'normal') {
      setTrackingNormalSince((prev) => prev ?? now);
    } else {
      setTrackingNormalSince(null);
    }
  };

  const handleRealWallSelected = (event: { nativeEvent: RealWallData }) => {
    const wallData = event.nativeEvent;
    console.log('>� Real wall selected:', wallData);
    setSelectedRealWall(wallData);
    setSelectedWallSince(Date.now());

    const virtualDim = `${virtualWallData.dimensions[0].toFixed(2)}m x ${virtualWallData.dimensions[1].toFixed(2)}m`;
    const realDim = `${wallData.dimensions[0].toFixed(2)}m x ${wallData.dimensions[1].toFixed(2)}m`;

    Alert.alert(
      'Pared Real Seleccionada',
      `Dimensiones: ${realDim}\n\nPared virtual: ${virtualDim}\n\nPresiona "Aceptar" para calcular la alineaci�n.`,
      [{ text: 'OK' }]
    );
  };

  const handleRealWallDeselected = () => {
    console.log('9 Real wall deselected');
    setSelectedRealWall(null);
    setSelectedWallSince(null);
  };

  const handleRealWallUpdated = (event: { nativeEvent: RealWallData }) => {
    setSelectedRealWall(event.nativeEvent);
  };

  const handleARError = (event: { nativeEvent: ARErrorEvent }) => {
    const { error, message } = event.nativeEvent;
    console.error('L AR Error:', { error, message });
    Alert.alert('Error de AR', message);
  };

  const handleAccept = () => {
    if (!selectedRealWall) {
      Alert.alert('Error', 'Selecciona una pared primero');
      return;
    }

    const now = Date.now();
    const selectedArea = selectedRealWall.dimensions[0] * selectedRealWall.dimensions[1];
    const trackingNormalMs = trackingNormalSince ? now - trackingNormalSince : 0;
    const selectedWallMs = selectedWallSince ? now - selectedWallSince : 0;

    // Quality gates (Spec v0.2)
    if (selectedArea < 0.8) {
      Alert.alert(
        'Pared muy pequeña',
        'Sigue escaneando hasta que ARKit detecte una pared más grande (idealmente > 0.8 m²).'
      );
      return;
    }

    if (trackingState !== 'normal' || trackingNormalMs < 1500) {
      Alert.alert(
        'Tracking no estable',
        'Espera a que el tracking esté en estado normal por un momento antes de bloquear la pared.'
      );
      return;
    }

    // Optional stability gate (v0.2): give ARKit a short settle window
    if (selectedWallMs < 500) {
      Alert.alert(
        'Confirmando pared...',
        'Mantén el dispositivo quieto un momento para estabilizar la detección.'
      );
      return;
    }

    // Stop scanning before moving to the next AR screen (avoid ARSession contention)
    arViewRef.current?.stopWallScanning();

    // Navigate to AlignmentViewScreen
    navigation.navigate('AlignmentView', {
      modelPath,
      virtualWall: virtualWallData,
      realWall: selectedRealWall,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Escaneo',
      '�Deseas volver a la vista previa del modelo?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'S�',
          style: 'destructive',
          onPress: () => {
            arViewRef.current?.stopWallScanning();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeselectWall = async () => {
    await arViewRef.current?.deselectRealWall();
    setSelectedRealWall(null);
    setSelectedWallSince(null);
  };

  const selectedArea = selectedRealWall
    ? selectedRealWall.dimensions[0] * selectedRealWall.dimensions[1]
    : 0;
  const trackingNormalMs = trackingNormalSince ? Date.now() - trackingNormalSince : 0;
  const selectedWallMs = selectedWallSince ? Date.now() - selectedWallSince : 0;
  const canLockWall =
    !!selectedRealWall &&
    selectedArea >= 0.8 &&
    trackingState === 'normal' &&
    trackingNormalMs >= 1500 &&
    selectedWallMs >= 500;

  const trackingCopy =
    trackingState === 'normal'
      ? 'Tracking: Normal'
      : trackingState === 'notAvailable'
      ? 'Tracking: No disponible'
      : `Tracking: Limitado (${trackingReason})`;

  const hasSelectedWall = selectedRealWall !== null;
  const selectedWallText = hasSelectedWall
    ? `Pared real: ${selectedRealWall.dimensions[0].toFixed(2)}m x ${selectedRealWall.dimensions[1].toFixed(2)}m (área: ${selectedArea.toFixed(2)}m²)`
    : '';

  const { title: instructionsTitle, text: instructionsText } = getScanInstructionCopy({
    arSessionReady,
    detectedPlanes,
    hasSelectedWall,
    canLockWall,
    selectedWallText
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.arContainer}>
        <ARWallScanningView
          ref={arViewRef}
          style={styles.arView}
          onARSessionStarted={handleARSessionStarted}
          onVerticalPlaneDetected={handlePlaneDetected}
          onRealWallSelected={handleRealWallSelected}
          onRealWallUpdated={handleRealWallUpdated}
          onRealWallDeselected={handleRealWallDeselected}
          onTrackingStateChanged={handleTrackingStateChanged}
          onARError={handleARError}
        />
      </View>

      <View style={styles.instructionsPanel}>
        <Text style={styles.instructionsTitle}>{instructionsTitle}</Text>
        <Text style={styles.instructionsText}>{instructionsText}</Text>
        {!!arSessionReady && (
          <Text style={[styles.instructionsText, { marginTop: 6 }]}>{trackingCopy}</Text>
        )}
        {!!hasSelectedWall && !canLockWall && (
          <Text style={[styles.instructionsText, { marginTop: 6 }]}>
            Requisitos: área ≥ 0.8m², tracking normal ~1–2s.
          </Text>
        )}
      </View>

      <View style={styles.referencePanel}>
        <Text style={styles.referencePanelTitle}>Pared Virtual (Referencia)</Text>
        <Text style={styles.referencePanelText}>
          Ancho: {virtualWallData.dimensions[0].toFixed(2)}m
        </Text>
        <Text style={styles.referencePanelText}>
          Alto: {virtualWallData.dimensions[1].toFixed(2)}m
        </Text>
        <Text style={styles.referencePanelSubtext}>
          Selecciona la pared f�sica correspondiente
        </Text>
      </View>

      {selectedRealWall && (
        <View style={styles.selectedWallPanel}>
          <View style={styles.selectedWallHeader}>
            <Text style={styles.selectedWallTitle}>Pared Real Seleccionada</Text>
            <TouchableOpacity onPress={handleDeselectWall}>
              <Text style={styles.deselectButton}>Deseleccionar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedWallText}>
            Ancho: {selectedRealWall.dimensions[0].toFixed(2)}m
          </Text>
          <Text style={styles.selectedWallText}>
            Alto: {selectedRealWall.dimensions[1].toFixed(2)}m
          </Text>
          <Text style={styles.selectedWallText}>
            Normal: [{selectedRealWall.normal[0].toFixed(2)}, {selectedRealWall.normal[1].toFixed(2)}, {selectedRealWall.normal[2].toFixed(2)}]
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancel}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canLockWall && styles.disabledButton
          ]}
          onPress={handleAccept}
          disabled={!canLockWall}
        >
          <Text style={[
            styles.primaryButtonText,
            !canLockWall && styles.disabledButtonText
          ]}>
            Lock Wall →
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
  referencePanel: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  referencePanelTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A84FF',
    marginBottom: 8,
  },
  referencePanelText: {
    fontSize: 13,
    color: '#FFF',
    marginBottom: 2,
    fontFamily: 'Menlo',
  },
  referencePanelSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedWallPanel: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  selectedWallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedWallTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34C759',
  },
  deselectButton: {
    fontSize: 14,
    color: '#FF453A',
    fontWeight: '500',
  },
  selectedWallText: {
    fontSize: 13,
    color: '#FFF',
    marginBottom: 2,
    fontFamily: 'Menlo',
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
