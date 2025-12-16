import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';

import {
  LoadErrorEvent,
  ModelLoadedEvent,
  SceneKitPreviewView,
  SceneKitPreviewViewRef,
  WallData,
} from '../../../modules/expo-arkit/src/SceneKitPreviewView';
import { loadRoomPlanWallsFromJsonUri } from '../../services/roomPlanJson';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ModelPreview'>;

export const ModelPreviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const sceneViewRef = useRef<SceneKitPreviewViewRef>(null);

  const [modelPath, setModelPath] = useState<string | null>(null);
  const [selectedWall, setSelectedWall] = useState<WallData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<string | null>(null);

  const [roomJsonPath, setRoomJsonPath] = useState<string | null>(null);
  const [roomJsonWalls, setRoomJsonWalls] = useState<WallData[]>([]);
  const [roomJsonVersion, setRoomJsonVersion] = useState<number | null>(null);
  const [isRoomJsonLoading, setIsRoomJsonLoading] = useState(false);
  const [wallSource, setWallSource] = useState<'model' | 'roomJson' | null>(null);

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
      // Allow any file type so the picker shows files from all providers.
      // We validate USDZ by extension below.
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

        // Validate USDZ extension (uri can vary by provider)
        const uriLower = filePath.toLowerCase();
        const nameLower = (file.name ?? '').toLowerCase();
        const isUsdz = uriLower.endsWith('.usdz') || nameLower.endsWith('.usdz');
        if (!isUsdz) {
          Alert.alert(
            'Formato no soportado',
            'Solo se aceptan modelos USDZ (.usdz). Exporta tu modelo a USDZ e inténtalo de nuevo.'
          );
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
        setWallSource(null);
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

  const handleSelectRoomJson = async () => {
    try {
      setIsRoomJsonLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const uriLower = (file.uri ?? '').toLowerCase();
      const nameLower = (file.name ?? '').toLowerCase();
      const isJson = uriLower.endsWith('.json') || nameLower.endsWith('.json');
      if (!isJson) {
        Alert.alert('Formato no soportado', 'Selecciona el archivo Room.json exportado por RoomPlan.');
        return;
      }

      const { version, wallCount, walls } = await loadRoomPlanWallsFromJsonUri(file.uri);
      setRoomJsonPath(file.uri);
      setRoomJsonWalls(walls);
      setRoomJsonVersion(typeof version === 'number' ? version : null);

      Alert.alert(
        'RoomPlan JSON cargado',
        `Paredes encontradas: ${wallCount}\nVersión: ${version ?? '—'}\n\nSelecciona una pared de la lista para usarla como pared virtual.`
      );
    } catch (error) {
      console.error('❌ Error selecting Room.json:', error);
      Alert.alert('Error', `No se pudo cargar Room.json: ${String(error)}`);
    } finally {
      setIsRoomJsonLoading(false);
    }
  };

  const handleModelLoaded = (event: { nativeEvent: ModelLoadedEvent }) => {
    const { success, dimensions, path } = event.nativeEvent;
    console.log('✅ Model loaded:', { success, dimensions, path });

    if (success) {
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
    setWallSource('model');

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
    setWallSource(null);
  };

  const handleSelectRoomJsonWall = (wallData: WallData) => {
    setSelectedWall(wallData);
    setWallSource('roomJson');
    setTapFeedback(null);

    Alert.alert(
      'Pared (Room.json) seleccionada',
      `Dimensiones: ${wallData.dimensions[0].toFixed(2)}m x ${wallData.dimensions[1].toFixed(2)}m\n\nAhora presiona "Continuar" y selecciona la pared física correspondiente.`
    );
  };

  const handleTapFeedback = (event: { nativeEvent: { success: boolean; message: string } }) => {
    const { success, message } = event.nativeEvent;
    if (success) {
      setTapFeedback(null);
      return;
    }
    setTapFeedback(message);
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
    if (wallSource === 'model') {
      await sceneViewRef.current?.deselectWall();
    }
    setSelectedWall(null);
    setWallSource(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
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
            onPreviewTapFeedback={handleTapFeedback}
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
          {modelPath
            ? selectedWall
              ? '3. Presiona Continuar'
              : '2. Toca una pared del modelo'
            : '1. Selecciona un modelo USDZ (.usdz)'}
        </Text>
        <Text style={styles.instructionsText}>
          {modelPath
            ? selectedWall
              ? `Pared seleccionada: ${selectedWall.dimensions[0].toFixed(2)}m x ${selectedWall.dimensions[1].toFixed(2)}m`
              : 'Usa pan (arrastrar) para rotar la cámara y pinch para hacer zoom. Toca una pared del modelo para seleccionarla como referencia.'
            : 'Carga un archivo USDZ (.usdz) exportado desde SketchUp u otra aplicación de modelado 3D.'}
        </Text>

        {!!modelPath && (
          <TouchableOpacity
            style={styles.inlineSecondaryButton}
            onPress={handleSelectRoomJson}
            disabled={isRoomJsonLoading}
          >
            <Text style={styles.inlineSecondaryButtonText}>
              {isRoomJsonLoading ? 'Cargando Room.json...' : 'Importar Room.json (opcional)'}
            </Text>
          </TouchableOpacity>
        )}

        {!!modelPath && !!roomJsonPath && !selectedWall && (
          <Text style={styles.instructionsSubtle}>
            Room.json cargado (v{roomJsonVersion ?? '—'}) • {roomJsonWalls.length} paredes
          </Text>
        )}

        {!!modelPath && !selectedWall && !!tapFeedback && (
          <Text style={styles.tapFeedbackText}>{tapFeedback}</Text>
        )}
      </View>

      {!!modelPath && roomJsonWalls.length > 0 && !selectedWall && (
        <View style={styles.roomJsonPanel}>
          <Text style={styles.roomJsonTitle}>Selecciona pared desde Room.json (opcional)</Text>
          <Text style={styles.roomJsonSubtitle}>
            Elige una pared grande para mejor estabilidad.
          </Text>
          <ScrollView style={styles.roomJsonList} contentContainerStyle={styles.roomJsonListContent}>
            {roomJsonWalls.slice(0, 12).map((wall) => {
              const area = wall.dimensions[0] * wall.dimensions[1];
              const idShort = wall.wallId.split('-')[0];
              return (
                <TouchableOpacity
                  key={wall.wallId}
                  style={styles.roomJsonItem}
                  onPress={() => handleSelectRoomJsonWall(wall)}
                >
                  <Text style={styles.roomJsonItemTitle}>
                    Wall {idShort} • {wall.dimensions[0].toFixed(2)}m x {wall.dimensions[1].toFixed(2)}m
                  </Text>
                  <Text style={styles.roomJsonItemSubtitle}>Área: {area.toFixed(2)} m²</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {roomJsonWalls.length > 12 && (
            <Text style={styles.roomJsonFooter}>
              Mostrando 12/{roomJsonWalls.length}. (Luego lo expandimos a “ver todas” si hace falta.)
            </Text>
          )}
        </View>
      )}

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
        {modelPath && selectedWall ? (
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
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSelectModel}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {modelPath ? 'Cambiar Modelo' : 'Seleccionar Modelo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#858585',
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
    backgroundColor: '#858585',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ffffff',
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
  inlineSecondaryButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  inlineSecondaryButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  instructionsSubtle: {
    marginTop: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
  tapFeedbackText: {
    marginTop: 10,
    fontSize: 13,
    color: '#FFD60A',
    lineHeight: 18,
  },
  roomJsonPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  roomJsonTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  roomJsonSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 8,
  },
  roomJsonList: {
    maxHeight: 220,
  },
  roomJsonListContent: {
    gap: 8,
  },
  roomJsonItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  roomJsonItemTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  roomJsonItemSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  roomJsonFooter: {
    marginTop: 8,
    color: '#8E8E93',
    fontSize: 12,
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
