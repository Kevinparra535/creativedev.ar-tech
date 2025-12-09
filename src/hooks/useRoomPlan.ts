import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { RoomPlanModule } = NativeModules;

export interface RoomData {
  surfaces: number;
  walls: number;
  doors: number;
  windows: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ExportResult {
  success: boolean;
  path?: string;
  fileName?: string;
  fileSize?: number;
  surfaces?: number;
  error?: string;
}

export const useRoomPlan = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const subsRef = useRef<any[]>([]);
  const emitterRef = useRef<NativeEventEmitter | null>(null);

  useEffect(() => {
    // Inicializar emitter una sola vez
    if (!emitterRef.current) {
      emitterRef.current = new NativeEventEmitter(RoomPlanModule);
    }

    const emitter = emitterRef.current;

    // Event: onScanStart
    const startSub = emitter.addListener('onScanStart', () => {
      console.log('[RoomPlan] Scan started');
      setIsScanning(true);
      setError(null);
      setRoomData(null);
    });

    // Event: onScanProgress
    const progressSub = emitter.addListener('onScanProgress', (event: any) => {
      console.log('[RoomPlan] Progress:', event);
    });

    // Event: onScanComplete
    const completeSub = emitter.addListener('onScanComplete', (event: any) => {
      console.log('[RoomPlan] Scan complete:', event);
      setIsScanning(false);
      setRoomData(event as RoomData);
      setError(null);
    });

    // Event: onScanError
    const errorSub = emitter.addListener('onScanError', (event: any) => {
      console.log('[RoomPlan] Error:', event);
      setIsScanning(false);
      setError(event?.error || 'Unknown error');
    });

    subsRef.current = [startSub, progressSub, completeSub, errorSub];

    return () => {
      subsRef.current.forEach((sub) => sub.remove());
    };
  }, []);

  const startScanning = useCallback(() => {
    try {
      console.log('[RoomPlan] Starting scan...');
      RoomPlanModule.startScanning();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start scanning';
      setError(errorMsg);
      console.error('[RoomPlan] Error:', err);
    }
  }, []);

  const stopScanning = useCallback(() => {
    try {
      console.log('[RoomPlan] Stopping scan...');
      RoomPlanModule.stopScanning();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop scanning';
      setError(errorMsg);
      console.error('[RoomPlan] Error:', err);
    }
  }, []);

  const exportScan = useCallback((onComplete?: (result: ExportResult) => void) => {
    try {
      setIsExporting(true);
      console.log('[RoomPlan] Exporting scan...');

      RoomPlanModule.exportScan((result: ExportResult[]) => {
        setIsExporting(false);

        if (result && result[0]) {
          const exportResult = result[0];
          if (exportResult.success) {
            console.log('[RoomPlan] Export successful:', exportResult);
            setError(null);
          } else {
            console.error('[RoomPlan] Export failed:', exportResult.error);
            setError(exportResult.error || 'Export failed');
          }
          onComplete?.(exportResult);
        }
      });
    } catch (err) {
      setIsExporting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to export scan';
      setError(errorMsg);
      console.error('[RoomPlan] Error:', err);
    }
  }, []);

  return {
    isScanning,
    roomData,
    error,
    isExporting,
    startScanning,
    stopScanning,
    exportScan
  };
};
