import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useRoomPlan } from '@/ui/ar/hooks/useRoomPlan';

export const RoomPlanTestScreen: React.FC = () => {
  const { startScanning } = useRoomPlan();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartScan = async () => {
    try {
      setIsScanning(true);
      setError(null);
      const scanName = `Room_${new Date().getTime()}`;
      console.log('[RoomPlanTest] Starting scan with name:', scanName);

      const result = await startScanning(scanName);
      console.log('[RoomPlanTest] Scan completed:', result);

      setLastScan(scanName);
      setIsScanning(false);
      Alert.alert('✅ Éxito', `Escaneo completado: ${scanName}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[RoomPlanTest] Error:', err);
      setError(errorMsg);
      setIsScanning(false);
      Alert.alert('❌ Error', errorMsg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RoomPlan Scanner</Text>
        <Text style={styles.subtitle}>Escanea espacios con LiDAR y exporta USDZ</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Estado</Text>
        <Text style={[styles.statusValue, isScanning && styles.statusScanning]}>
          {isScanning ? '🔴 Escaneando...' : '⏸ Listo'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleStartScan}
          disabled={isScanning}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Escaneando...' : '📱 Iniciar Escaneo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Last Scan Info */}
      {lastScan && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ Último Escaneo</Text>
          <Text style={styles.infoText}>{lastScan}</Text>
          <Text style={styles.infoSubtext}>
            El archivo USDZ fue exportado automáticamente
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚠️ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Help */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>💡 Cómo usar</Text>
        <Text style={styles.helpText}>1. Tap en "Iniciar Escaneo"</Text>
        <Text style={styles.helpText}>2. Se abrirá la interfaz de Apple RoomPlan</Text>
        <Text style={styles.helpText}>3. Sigue las instrucciones en pantalla</Text>
        <Text style={styles.helpText}>4. Apunta alrededor de la habitación</Text>
        <Text style={styles.helpText}>5. Mueve lentamente para cubrir toda el área</Text>
        <Text style={styles.helpText}>6. Completa el escaneo y revisa la vista previa</Text>
        <Text style={styles.helpText}>7. El archivo USDZ se exportará automáticamente</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoSubtext}>
          Esta app usa expo-roomplan para integrar Apple's RoomPlan SDK.{'\n\n'}
          Compatible con iOS 17.0 o superior.{'\n'}
          Requiere dispositivo con LiDAR (iPhone 12 Pro+, iPad Pro 2020+)
        </Text>
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  primaryButton: {
    backgroundColor: '#3498db'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
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
    color: '#186a3b',
    fontWeight: '500'
  },
  infoSubtext: {
    fontSize: 12,
    color: '#186a3b',
    marginTop: 8,
    lineHeight: 18
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
