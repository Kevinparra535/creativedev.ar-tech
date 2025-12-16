import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';

import {
  LoadErrorEvent,
  ModelLoadedEvent,
  SceneKitPreviewView,
  SceneKitPreviewViewRef
} from '../../../modules/expo-arkit/src/SceneKitPreviewView';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GuidedModelSelect'>;
type GuidedModelSelectRouteProp = RouteProp<RootStackParamList, 'GuidedModelSelect'>;

type ModelDims = [number, number, number];

export const GuidedModelSelectScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GuidedModelSelectRouteProp>();
  const sceneViewRef = useRef<SceneKitPreviewViewRef>(null);

  const [modelPath, setModelPath] = useState<string | null>(null);
  const [modelDims, setModelDims] = useState<ModelDims | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!modelPath) return;
    if (!sceneViewRef.current) return;

    setIsLoading(true);
    sceneViewRef.current
      .loadModelForPreview(modelPath)
      .catch((error) => {
        setIsLoading(false);
        Alert.alert('Error', `No se pudo cargar el modelo: ${String(error)}`);
      });
  }, [modelPath]);

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

      setModelDims(null);
      setModelPath(localPath);
    } catch (error) {
      Alert.alert('Error', `No se pudo seleccionar el archivo: ${String(error)}`);
    }
  };

  const handleModelLoaded = (event: { nativeEvent: ModelLoadedEvent }) => {
    const { success, dimensions } = event.nativeEvent;
    if (!success) return;

    setIsLoading(false);
    setModelDims(dimensions);
  };

  const handleLoadError = (event: { nativeEvent: LoadErrorEvent }) => {
    setIsLoading(false);
    Alert.alert('Error al Cargar Modelo', event.nativeEvent.message);
  };

  const handleContinue = () => {
    if (!modelPath || !modelDims) {
      Alert.alert('Error', 'Selecciona un modelo primero');
      return;
    }

    const mode = route.params?.mode ?? 'floor';
    const destination = mode === 'wall' ? 'GuidedWallWalkthrough' : 'GuidedWalkthrough';

    navigation.navigate(destination, {
      modelPath,
      modelDimensions: modelDims
    } as never);
  };

  const dimsText = modelDims
    ? `${modelDims[0].toFixed(2)}m x ${modelDims[1].toFixed(2)}m x ${modelDims[2].toFixed(2)}m`
    : '—';

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.previewContainer}>
        {modelPath ? (
          <SceneKitPreviewView
            ref={sceneViewRef}
            style={styles.sceneView}
            onPreviewModelLoaded={handleModelLoaded}
            onPreviewLoadError={handleLoadError}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Selecciona un modelo</Text>
            <Text style={styles.emptyText}>USDZ/USD a escala real (1:1).</Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando modelo...</Text>
          </View>
        )}
      </View>

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>Modelo</Text>
        <Text style={styles.infoText}>Dimensiones: {dimsText}</Text>
        <Text style={styles.infoHint}>
          En el siguiente paso vas a escanear solo el área necesaria para colocar el modelo con precisión.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSelectModel}>
          <Text style={styles.secondaryButtonText}>{modelPath ? 'Cambiar Modelo' : 'Seleccionar Modelo'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, (!modelPath || !modelDims) && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!modelPath || !modelDims}
        >
          <Text style={[styles.primaryButtonText, (!modelPath || !modelDims) && styles.disabledButtonText]}>
            Continuar →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  previewContainer: {
    flex: 1,
    position: 'relative'
  },
  sceneView: {
    flex: 1
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#FFF'
  },
  infoPanel: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
    backgroundColor: 'rgba(28, 28, 30, 0.95)'
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6
  },
  infoText: {
    color: '#FFF',
    fontFamily: 'Menlo',
    fontSize: 13
  },
  infoHint: {
    marginTop: 8,
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20
  },
  buttonContainer: {
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
