import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { type RouteProp, useRoute } from '@react-navigation/native';
import { SimpleModelPreviewView, type SimpleModelPreviewViewRef } from 'expo-arkit';
import * as DocumentPicker from 'expo-document-picker';

import { ARKitView } from '@/ui/ar/components';
import type { RootStackParamList } from '@/ui/navigation/types';

type FloatingModelTestRouteProp = RouteProp<RootStackParamList, 'FloatingModelTest'>;

export const FloatingModelTestScreen = () => {
  const route = useRoute<FloatingModelTestRouteProp>();
  const previewRef = useRef<SimpleModelPreviewViewRef>(null);

  const [selectedModelPath, setSelectedModelPath] = useState<string | null>(null);

  const modelPath = selectedModelPath ?? route.params?.modelPath ?? null;

  useEffect(() => {
    if (!modelPath) return;
    if (!previewRef.current) return;

    previewRef.current.loadModel(modelPath).catch((error) => {
      Alert.alert('Error', `No se pudo cargar el modelo: ${String(error)}`);
    });
  }, [modelPath]);

  const handleSelectModel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['com.pixar.universal-scene-description-mobile', '*/*'],
        copyToCacheDirectory: false,
        multiple: false,
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

  return (
    <View style={styles.container}>
      <ARKitView style={styles.arView} />

      <View style={styles.previewBox}>
        {modelPath ? <SimpleModelPreviewView ref={previewRef} style={styles.previewView} /> : null}
      </View>

      <TouchableOpacity style={styles.loadButton} onPress={handleSelectModel}>
        <Text style={styles.loadButtonText}>Cargar modelo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  arView: {
    flex: 1,
  },
  previewBox: {
    position: 'absolute',
    bottom: '0%',
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewView: {
    flex: 1,
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
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
