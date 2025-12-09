import { useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { RoomPlanModule } = NativeModules;

interface RoomPlanEvents {
  onScanStart?: () => void;
  onScanProgress?: (progress: number) => void;
  onScanComplete?: () => void;
  onScanError?: (error: string) => void;
}

export const useRoomPlan = (events?: RoomPlanEvents) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const emitterRef = useRef<NativeEventEmitter | null>(null);

  useEffect(() => {
    // Inicializar emitter una sola vez
    if (!emitterRef.current) {
      emitterRef.current = new NativeEventEmitter(RoomPlanModule);
    }

    const emitter = emitterRef.current;

    // Event: onScanStart
    const startSub = emitter.addListener('onScanStart', () => {
      setIsScanning(true);
      setError(null);
      events?.onScanStart?.();
    });

    // Event: onScanProgress
    const progressSub = emitter.addListener('onScanProgress', (event: any) => {
      const progress = event?.progress ?? 0;
      setScanProgress(progress);
      events?.onScanProgress?.(progress);
    });

    // Event: onScanComplete
    const completeSub = emitter.addListener('onScanComplete', () => {
      setIsScanning(false);
      setScanProgress(100);
      events?.onScanComplete?.();
    });

    // Event: onScanError
    const errorSub = emitter.addListener('onScanError', (event: any) => {
      const errorMsg = event?.error ?? 'Unknown error';
      setIsScanning(false);
      setError(errorMsg);
      events?.onScanError?.(errorMsg);
    });

    return () => {
      startSub.remove();
      progressSub.remove();
      completeSub.remove();
      errorSub.remove();
    };
  }, [events]);

  const startScanning = () => {
    try {
      RoomPlanModule.startScanning();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start scanning';
      setError(errorMsg);
    }
  };

  const stopScanning = () => {
    try {
      RoomPlanModule.stopScanning();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop scanning';
      setError(errorMsg);
    }
  };

  const exportScan = (callback: (success: boolean, path?: string) => void) => {
    try {
      RoomPlanModule.exportScan((result: any) => {
        if (result?.success) {
          callback(true, result.path);
        } else {
          callback(false);
        }
      });
    } catch (err) {
      callback(false);
    }
  };

  return {
    isScanning,
    scanProgress,
    error,
    startScanning,
    stopScanning,
    exportScan
  };
};
