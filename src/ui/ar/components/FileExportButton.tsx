import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FileExport } from '../../../modules';

interface FileExportButtonProps {
  filePath?: string;
  fileName?: string;
  onExportComplete?: (path: string) => void;
}

/**
 * Componente para exportar y compartir archivos
 * Muestra botones para:
 * 1. Exportar a la carpeta de Documentos (visible en la app Files)
 * 2. Compartir usando el Share Sheet de iOS
 */
export const FileExportButton: React.FC<FileExportButtonProps> = ({
  filePath,
  fileName = 'exported-model.usdz',
  onExportComplete,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportToDocuments = async () => {
    if (!filePath) {
      Alert.alert('Error', 'No hay archivo para exportar');
      return;
    }

    setIsExporting(true);
    try {
      const result = await FileExport.exportToDocuments(filePath, fileName);

      Alert.alert(
        'Exportado Exitosamente',
        `El archivo se guardó en:\n\nArchivos > En mi iPhone > creativedev.ar-tech\n\nNombre: ${result.fileName}`,
        [
          {
            text: 'OK',
            onPress: () => onExportComplete?.(result.path),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', `No se pudo exportar el archivo: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareFile = async () => {
    if (!filePath) {
      Alert.alert('Error', 'No hay archivo para compartir');
      return;
    }

    setIsExporting(true);
    try {
      const result = await FileExport.shareFile(filePath);

      if (result.completed) {
        Alert.alert('Compartido', 'El archivo se compartió exitosamente');
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo compartir el archivo: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDocumentsInfo = () => {
    const documentsPath = FileExport.getDocumentsDirectory();
    const files = FileExport.listDocumentsFiles();

    const fileList = files.length > 0
      ? files.map(f => `• ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')
      : 'No hay archivos exportados';

    Alert.alert(
      'Carpeta de Documentos',
      `Ubicación:\n${documentsPath}\n\nArchivos:\n${fileList}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.exportButton, isExporting && styles.buttonDisabled]}
        onPress={handleExportToDocuments}
        disabled={isExporting || !filePath}
      >
        <Text style={styles.buttonText}>
          {isExporting ? 'Exportando...' : '📁 Exportar a Archivos'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.shareButton, isExporting && styles.buttonDisabled]}
        onPress={handleShareFile}
        disabled={isExporting || !filePath}
      >
        <Text style={styles.buttonText}>
          📤 Compartir Archivo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.infoButton]}
        onPress={handleViewDocumentsInfo}
      >
        <Text style={styles.buttonText}>
          ℹ️ Ver Archivos Guardados
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Cómo ver los archivos en tu iPhone:{'\n\n'}
          1. Abre la app "Archivos" 📱{'\n'}
          2. Ve a "En mi iPhone" o "On My iPhone"{'\n'}
          3. Busca la carpeta "creativedev.ar-tech"{'\n'}
          4. Toca el archivo para previsualizarlo
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  infoButton: {
    backgroundColor: '#5856D6',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    color: '#007AFF',
    fontSize: 13,
    lineHeight: 20,
  },
});
