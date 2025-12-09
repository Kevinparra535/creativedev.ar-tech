import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { useRoomPlan } from '@/hooks/useRoomPlan';

export const RoomPlanTestScreen = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { isScanning, scanProgress, error, startScanning, stopScanning, exportScan } = useRoomPlan(
    {
      onScanStart: () => {
        console.log('Scan started');
      },
      onScanComplete: () => {
        console.log('Scan completed');
      },
      onScanError: (err) => {
        console.error('Scan error:', err);
      }
    }
  );

  const handleExport = () => {
    setIsExporting(true);
    exportScan((success) => {
      setIsExporting(false);
      if (success) {
        alert('Export successful!');
      } else {
        alert('Export failed');
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoomPlan Test</Text>
      <View style={styles.statusSection}>
        <Text style={styles.label}>Status: {isScanning ? 'Scanning' : 'Ready'}</Text>
        {isScanning && <ActivityIndicator size='large' color='#007AFF' />}
      </View>
      <View style={styles.buttonRow}>
        <Button
          title={isScanning ? 'Stop' : 'Start'}
          onPress={isScanning ? stopScanning : startScanning}
          color='#007AFF'
        />
      </View>
      <View style={styles.buttonRow}>
        <Button
          title={isExporting ? 'Exporting' : 'Export'}
          onPress={handleExport}
          color='#34C759'
          disabled={isExporting || scanProgress === 0}
        />
      </View>
      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  statusSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    marginBottom: 8
  },
  buttonRow: {
    marginBottom: 12
  },
  error: {
    color: '#FF3B30',
    marginTop: 12
  }
});
