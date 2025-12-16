import React, { useRef, useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  SceneKitPreviewView,
  SceneKitPreviewViewRef,
  WallData,
  ModelLoadedEvent,
  LoadErrorEvent,
} from '../../../modules/expo-arkit/src/SceneKitPreviewView';

import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ModelPreview'>;

export const ModelPreviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const sceneViewRef = useRef<SceneKitPreviewViewRef>(null);

  const [modelPath, setModelPath] = useState<string | null>(null);
  const [selectedWall, setSelectedWall] = useState<WallData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelDimensions, setModelDimensions] = useState<[number, number, number] | null>(null);

  // Load model when modelPath changes and component is mounted
  useEffect(() => {
    if (modelPath && sceneViewRef.current) {
      console.log('📦 useEffect: Loading model from path:', modelPath);
      setIsLoading(true);

      sceneViewRef.current.loadModelForPreview(modelPath)
        .catch((error) => {
          console.error('❌ Error loading model in useEffect:', error);
          setIsLoading(false);
          Alert.alert('Error', `No se pudo cargar el modelo: ${error}`);
        });
    }
  }, [modelPath]);

  const handleSelectModel = async () => {
    try {
      // Use specific USDZ UTI and wildcard to show all files
      const result = await DocumentPicker.getDocumentAsync({
        type: ['com.pixar.universal-scene-description-mobile', '*/*'],
        copyToCacheDirectory: false, // Don't copy, use original path
        multiple: false,
      });

      console.log('📄 DocumentPicker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const filePath = file.uri;

        console.log('📦 Selected file:', filePath);
        console.log('📦 File name:', file.name);
        console.log('📦 File type:', file.mimeType);

        // Validate USDZ file
        if (!filePath.toLowerCase().endsWith('.usdz') && !filePath.toLowerCase().endsWith('.usd')) {
          Alert.alert('Error', 'Solo se aceptan archivos USDZ o USD');
          return;
        }

        // Convert URI to local path if needed
        let localPath = filePath;
        if (filePath.startsWith('file://')) {
          localPath = decodeURIComponent(filePath.replace('file://', ''));
        }

        console.log('📦 Setting modelPath to:', localPath);
        setModelPath(localPath);
        setSelectedWall(null);
        // isLoading will be set in useEffect when loading starts
      } else {
        console.log('📄 Selection canceled or no file selected');
      }
    } catch (error) {
      console.error('❌ Error selecting document:', error);
      Alert.alert('Error', `No se pudo seleccionar el archivo: ${error}`);
      setIsLoading(false);
    }
  };

  const handleModelLoaded = (event: { nativeEvent: ModelLoadedEvent }) => {
    const { success, dimensions, path } = event.nativeEvent;
    console.log('✅ Model loaded:', { success, dimensions, path });

    if (success) {
      setModelDimensions(dimensions);
      setIsLoading(false);
      Alert.alert(
        'Modelo Cargado',
        `Dimensiones: ${dimensions[0].toFixed(2)}m x ${dimensions[1].toFixed(2)}m x ${dimensions[2].toFixed(2)}m\n\nAhora toca una pared del modelo para seleccionarla.`
      );
    }
  };

  const handleWallSelected = (event: { nativeEvent: WallData }) => {
    const wallData = event.nativeEvent;
    console.log('🧱 Wall selected:', wallData);
    setSelectedWall(wallData);

    Alert.alert(
      'Pared Seleccionada',
      `Dimensiones: ${wallData.dimensions[0].toFixed(2)}m x ${wallData.dimensions[1].toFixed(2)}m\n\n` +
        `Presiona "Continuar" para escanear la pared física correspondiente.`,
      [{ text: 'OK' }]
    );
  };

  const handleWallDeselected = () => {
    console.log('ℹ️ Wall deselected');
    setSelectedWall(null);
  };

  const handleLoadError = (event: { nativeEvent: LoadErrorEvent }) => {
    const { error, message, path } = event.nativeEvent;
    console.error('❌ Load error:', { error, message, path });
    setIsLoading(false);

    Alert.alert(
      'Error al Cargar Modelo',
      `${message}\n\n${path || ''}`,
      [{ text: 'OK' }]
    );
  };

  const handleContinue = () => {
    if (!selectedWall || !modelPath) {
      Alert.alert('Error', 'Selecciona una pared primero');
      return;
    }

    // Navigate to WallScanningScreen
    navigation.navigate('WallScanning', {
      virtualWallData: selectedWall,
      modelPath: modelPath,
    });
  };

  const handleDeselectWall = async () => {
    await sceneViewRef.current?.deselectWall();
    setSelectedWall(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 3D Preview View */}
      <View style={styles.previewContainer}>
        {modelPath ? (
          <SceneKitPreviewView
            ref={sceneViewRef}
            style={styles.sceneView}
            onPreviewModelLoaded={handleModelLoaded}
            onPreviewWallSelected={handleWallSelected}
            onPreviewWallDeselected={handleWallDeselected}
            onPreviewLoadError={handleLoadError}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay modelo cargado
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Presiona "Seleccionar Modelo" para comenzar
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando modelo...</Text>
          </View>
        )}
      </View>

      {/* Instructions Panel */}
      <View style={styles.instructionsPanel}>
        <Text style={styles.instructionsTitle}>
          {!modelPath
            ? '1. Selecciona un modelo USDZ'
            : !selectedWall
            ? '2. Toca una pared del modelo'
            : '3. Presiona Continuar'}
        </Text>
        <Text style={styles.instructionsText}>
          {!modelPath
            ? 'Carga un archivo USDZ exportado desde SketchUp u otra aplicación de modelado 3D.'
            : !selectedWall
            ? 'Usa pan (arrastrar) para rotar la cámara y pinch para hacer zoom. Toca una pared del modelo para seleccionarla como referencia.'
            : `Pared seleccionada: ${selectedWall.dimensions[0].toFixed(2)}m x ${selectedWall.dimensions[1].toFixed(2)}m`}
        </Text>
      </View>

      {/* Wall Info (when selected) */}
      {selectedWall && (
        <View style={styles.wallInfoPanel}>
          <View style={styles.wallInfoHeader}>
            <Text style={styles.wallInfoTitle}>Pared Seleccionada</Text>
            <TouchableOpacity onPress={handleDeselectWall}>
              <Text style={styles.deselectButton}>Deseleccionar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.wallInfoText}>
            Ancho: {selectedWall.dimensions[0].toFixed(2)}m
          </Text>
          <Text style={styles.wallInfoText}>
            Alto: {selectedWall.dimensions[1].toFixed(2)}m
          </Text>
          <Text style={styles.wallInfoText}>
            Normal: [{selectedWall.normal[0].toFixed(2)}, {selectedWall.normal[1].toFixed(2)}, {selectedWall.normal[2].toFixed(2)}]
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!modelPath || !selectedWall ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSelectModel}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {modelPath ? 'Cambiar Modelo' : 'Seleccionar Modelo'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSelectModel}
            >
              <Text style={styles.secondaryButtonText}>Cambiar Modelo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.continueButton]}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Continuar →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  sceneView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
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
  wallInfoPanel: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  wallInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wallInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34C759',
  },
  deselectButton: {
    fontSize: 14,
    color: '#FF453A',
    fontWeight: '500',
  },
  wallInfoText: {
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
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    backgroundColor: '#34C759',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
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
