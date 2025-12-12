import { ExportType, useRoomPlan as useExpoRoomPlanLib } from 'expo-roomplan';

export interface RoomScanResult {
  success: boolean;
  filePath: string | null;
  scanName: string;
  error?: string;
}

/**
 * Hook wrapper for expo-roomplan
 * Uses the simplest API: useRoomPlan with startRoomPlan
 *
 * This hook:
 * 1. Opens RoomPlan UI modal
 * 2. User scans room with instructions
 * 3. User reviews in preview
 * 4. Auto-exports if exportOnFinish=true
 * 5. Returns to app with file path
 *
 * The file path is available in the scanUrl property after scanning completes
 */
export const useRoomPlan = () => {
  const { startRoomPlan, scanUrl, jsonUrl, roomScanStatus } = useExpoRoomPlanLib({
    exportType: ExportType.Parametric,
    sendFileLoc: true
  });

  /**
   * Start a new room scan
   * @param scanName - Name for the exported files (e.g., "My Room")
   * @returns Promise that resolves when scan UI is dismissed
   */
  const startScanning = async (scanName: string = 'My Scan'): Promise<RoomScanResult> => {
    try {
      console.log('[RoomPlan] Starting scan with name:', scanName);
      await startRoomPlan(scanName);
      console.log('[RoomPlan] Scan completed. Status:', roomScanStatus);
      console.log('[RoomPlan] Scan URL:', scanUrl);

      // scanUrl contains the path to the exported USDZ file
      return {
        success: roomScanStatus === 'OK',
        filePath: scanUrl,
        scanName: scanName
      };
    } catch (error) {
      console.error('[RoomPlan] Scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        filePath: null,
        scanName: scanName,
        error: errorMessage
      };
    }
  };

  return {
    startScanning,
    scanUrl,
    jsonUrl,
    roomScanStatus
  };
};
