import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { type RouteProp, useRoute } from '@react-navigation/native';
import {
  ARWallScanningView,
  type ARWallScanningViewRef,
  type RealWallData,
  SimpleModelPreviewView,
  type SimpleModelPreviewViewRef
} from 'expo-arkit';
import * as DocumentPicker from 'expo-document-picker';

import type { RootStackParamList } from '@/ui/navigation/types';

type FloatingModelTestRouteProp = RouteProp<RootStackParamList, 'FloatingModelTest'>;

type ScanPhase = 'idle' | 'scanning' | 'scanned';

function getStatusText(params: {
  modelPath: string | null;
  isLoadingModel: boolean;
  isWallSelected: boolean;
  isRealWallSelected: boolean;
  scanPhase: ScanPhase;
}): string {
  const { modelPath, isLoadingModel, isWallSelected, isRealWallSelected, scanPhase } = params;

  if (modelPath == null) return 'Selecciona un modelo (USDZ/USD)';
  if (isLoadingModel) return 'Cargando modelo…';
  if (scanPhase === 'scanning') {
    if (!isRealWallSelected) return 'Toca la pared real que escaneaste para seleccionarla';
    return 'Pared real seleccionada — presiona “Terminar escaneo”';
  }
  if (scanPhase === 'scanned') return 'Escaneo terminado';
  if (isWallSelected) return 'Pared seleccionada — presiona “Escanear”';
  return 'Toca una pared del modelo';
}

function getPrimaryButtonLabel(params: { modelPath: string | null; scanPhase: ScanPhase }): string {
  const { modelPath, scanPhase } = params;
  if (scanPhase === 'scanning') return 'Terminar escaneo';
  return modelPath ? 'Cambiar modelo' : 'Cargar modelo';
}

export const FloatingModelTestScreen = () => {
  const route = useRoute<FloatingModelTestRouteProp>();
  const previewRef = useRef<SimpleModelPreviewViewRef>(null);
  const wallScanRef = useRef<ARWallScanningViewRef>(null);

  const [selectedModelPath, setSelectedModelPath] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<string | null>(null);
  const [selectedRealWall, setSelectedRealWall] = useState<RealWallData | null>(null);

  const modelPath = selectedModelPath ?? route.params?.modelPath ?? null;

  useEffect(() => {
    const preview = previewRef.current;
    if (modelPath == null || preview == null) return;

    setSelectedWallId(null);
    setScanPhase('idle');
    setTapFeedback(null);
    setSelectedRealWall(null);
    setIsLoadingModel(true);

    preview.loadModel(modelPath).catch((error) => {
      setIsLoadingModel(false);
      Alert.alert('Error', `No se pudo cargar el modelo: ${String(error)}`);
    });
  }, [modelPath]);

  useEffect(() => {
    const scanView = wallScanRef.current;
    if (scanView == null) return;

    if (scanPhase === 'scanning') {
      setSelectedRealWall(null);
      const timer = setTimeout(() => {
        scanView.startWallScanning().catch(() => {
          // no-op: native layer will emit errors to console; keep UI simple
        });
      }, 250);

      return () => {
        clearTimeout(timer);
      };
    }

    scanView.stopWallScanning().catch(() => {
      // no-op
    });
  }, [scanPhase]);

  const isWallSelected = selectedWallId != null;
  const isRealWallSelected = selectedRealWall != null;
  const isPreviewCompact = scanPhase !== 'idle';

  const statusText = getStatusText({
    modelPath,
    isLoadingModel,
    isWallSelected,
    isRealWallSelected,
    scanPhase
  });
  const primaryButtonLabel = getPrimaryButtonLabel({ modelPath, scanPhase });
  const isPrimaryDisabled = scanPhase === 'scanning' && !isRealWallSelected;

  const handleSelectModel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['com.pixar.universal-scene-description-mobile', '*/*'],
        copyToCacheDirectory: false,
        multiple: false
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const uri = file.uri;

      if (!uri.toLowerCase().endsWith('.usdz') && !uri.toLowerCase().endsWith('.usd')) {
        Alert.alert('Error', 'Solo se aceptan archivos USDZ o USD');
        return;
      }

      let localPath = uri;
      if (uri.startsWith('file://')) {
        localPath = decodeURIComponent(uri.replace('file://', ''));
      }

      setSelectedModelPath(localPath);
    } catch (error) {
      Alert.alert('Error', `No se pudo seleccionar el archivo: ${String(error)}`);
    }
  };

  const handleStartScan = () => {
    if (!isWallSelected) return;
    if (isLoadingModel) return;
    setTapFeedback(null);
    setScanPhase('scanning');
  };

  const finishScan = async () => {
    if (!isRealWallSelected) {
      Alert.alert('Selecciona una pared', 'Toca la pared real que escaneaste para poder continuar.');
      return;
    }

    if (selectedWallId == null) {
      setScanPhase('scanned');
      return;
    }

    const preview = previewRef.current;
    if (preview == null) {
      setScanPhase('scanned');
      return;
    }

    try {
      await preview.markWallScanned(selectedWallId);
      await wallScanRef.current?.stopWallScanning();
      setScanPhase('scanned');
    } catch (error) {
      Alert.alert('Error', `No se pudo terminar el escaneo: ${String(error)}`);
    }
  };

  const handlePrimaryAction = async () => {
    if (scanPhase === 'scanning') {
      await finishScan();
      return;
    }
    await handleSelectModel();
  };

  return (
    <View style={styles.container}>
      <ARWallScanningView
        ref={wallScanRef}
        style={styles.arView}
        onRealWallSelected={(event) => {
          setSelectedRealWall(event.nativeEvent);
        }}
        onRealWallDeselected={() => {
          setSelectedRealWall(null);
        }}
        onRealWallUpdated={(event) => {
          setSelectedRealWall(event.nativeEvent);
        }}
      />

      <View style={[styles.previewBoxExpanded, isPreviewCompact ? styles.previewBoxCompact : null]}>
        {modelPath ? (
          <SimpleModelPreviewView
            ref={previewRef}
            style={styles.previewView}
            onSimpleModelLoaded={() => {
              setIsLoadingModel(false);
              setTapFeedback(null);
            }}
            onSimpleLoadError={(event) => {
              setIsLoadingModel(false);
              const { message } = event.nativeEvent;
              Alert.alert('Error', message || 'No se pudo cargar el modelo');
            }}
            onSimpleWallSelected={(event) => {
              setTapFeedback(null);
              setSelectedWallId(event.nativeEvent.wallId);
              if (scanPhase !== 'scanning') setScanPhase('idle');
            }}
            onSimpleWallDeselected={() => {
              setSelectedWallId(null);
              setScanPhase('idle');
            }}
            onSimpleTapFeedback={(event) => {
              const { success, message } = event.nativeEvent;
              if (success) {
                setTapFeedback(null);
                return;
              }
              setTapFeedback(message || null);
            }}
          />
        ) : null}

        {/* In-preview action: Escanear (only after wall selection, before scanning) */}
        {modelPath != null && isWallSelected && scanPhase === 'idle' && !isLoadingModel ? (
          <View style={styles.scanButtonContainer}>
            <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
              <Text style={styles.scanButtonText}>Escanear</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Visual feedback overlay (does not block taps) */}
        <View pointerEvents='none' style={styles.previewOverlay}>
          <View style={styles.statusPill}>
            {isLoadingModel ? <ActivityIndicator size='small' color='#fff' /> : null}
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          {!!tapFeedback && !isWallSelected ? (
            <View style={styles.feedbackPill}>
              <Text style={styles.feedbackText}>{tapFeedback}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.loadButton, isPrimaryDisabled ? styles.loadButtonDisabled : null]}
        onPress={handlePrimaryAction}
        disabled={isPrimaryDisabled}
      >
        <Text style={styles.loadButtonText}>{primaryButtonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000'
  },
  arView: {
    flex: 1
  },
  // Expanded: used after model is chosen (to make wall selection easy)
  previewBoxExpanded: {
    position: 'absolute',
    bottom: '0%',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 28, 30, 1)'
  },
  // Compact: used after a wall is selected
  previewBoxCompact: {
    bottom: '0%',
    width: '100%',
    height: 400
  },
  previewView: {
    flex: 1
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 16,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 10
  },
  scanButtonContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: 'center'
  },
  scanButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)'
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  feedbackPill: {
    maxWidth: '92%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  },
  feedbackText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500'
  },
  loadButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  loadButtonDisabled: {
    opacity: 0.55
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});
