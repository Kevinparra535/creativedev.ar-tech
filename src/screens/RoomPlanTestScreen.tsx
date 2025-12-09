import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRoomPlan, ExportResult } from '@/hooks/useRoomPlan';

export const RoomPlanTestScreen: React.FC = () => {
  const { isScanning, roomData, error, isExporting, startScanning, stopScanning, exportScan } =
    useRoomPlan();
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExport = () => {
    exportScan((result: ExportResult) => {
      if (result.success && result.fileName) {
        setLastExport(result.fileName);
        Alert.alert('✅ Éxito', `Archivo guardado: ${result.fileName}`);
      } else {
        Alert.alert('❌ Error', result.error || 'No se pudo exportar');
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RoomPlan Scanner</Text>
        <Text style={styles.subtitle}>Escanea espacios con LiDAR</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Estado</Text>
        <Text style={[styles.statusValue, isScanning && styles.statusScanning]}>
          {isScanning ? '🔴 Escaneando...' : roomData ? '✅ Completado' : '⏸ Inactivo'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={[styles.button, isScanning && styles.buttonDisabled]}
          onPress={isScanning ? stopScanning : startScanning}
          disabled={isExporting}
        >
          <Text style={styles.buttonText}>{isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.exportButton, (!roomData || isExporting) && styles.buttonDisabled]}
          onPress={handleExport}
          disabled={!roomData || isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}> Exportando...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>📤 Exportar USDZ</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Room Data Display */}
      {roomData && (
        <View style={styles.dataCard}>
          <Text style={styles.dataTitle}>Datos del Escaneo</Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Superficies</Text>
            <Text style={styles.dataValue}>{roomData.surfaces}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Paredes</Text>
            <Text style={styles.dataValue}>{roomData.walls}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Puertas</Text>
            <Text style={styles.dataValue}>{roomData.doors}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Ventanas</Text>
            <Text style={styles.dataValue}>{roomData.windows}</Text>
          </View>

          {roomData.dimensions && (
            <>
              <View style={styles.divider} />
              <Text style={styles.dataLabel}>Dimensiones</Text>
              <Text style={styles.dimensionText}>
                {Math.round(roomData.dimensions.length)}m × {Math.round(roomData.dimensions.width)}m
                × {Math.round(roomData.dimensions.height)}m
              </Text>
            </>
          )}
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚠️ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Last Export */}
      {lastExport && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📁 Último Archivo</Text>
          <Text style={styles.infoText}>{lastExport}</Text>
        </View>
      )}

      {/* Help */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>💡 Cómo usar</Text>
        <Text style={styles.helpText}>1. Tap en "Iniciar Escaneo"</Text>
        <Text style={styles.helpText}>2. Apunta el dispositivo alrededor de la habitación</Text>
        <Text style={styles.helpText}>3. Mueve lentamente para cubrir toda el área</Text>
        <Text style={styles.helpText}>4. Tap en "Detener Escaneo" cuando termines</Text>
        <Text style={styles.helpText}>5. Tap en "Exportar USDZ" para guardar</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#2c3e50'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  subtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 4
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  statusLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 8
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  statusScanning: {
    color: '#e74c3c'
  },
  controlsSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#3498db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  exportButton: {
    backgroundColor: '#27ae60'
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  dataCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  dataLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  dataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12
  },
  dimensionText: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 8,
    fontWeight: '500'
  },
  errorCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fadbd8',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c'
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c0392b',
    marginBottom: 4
  },
  errorText: {
    fontSize: 13,
    color: '#a93226'
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#d5f4e6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60'
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e8449',
    marginBottom: 4
  },
  infoText: {
    fontSize: 13,
    color: '#186a3b'
  },
  helpCard: {
    margin: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fef5e7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12'
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d68910',
    marginBottom: 8
  },
  helpText: {
    fontSize: 13,
    color: '#b7950b',
    marginVertical: 4,
    lineHeight: 18
  }
});
