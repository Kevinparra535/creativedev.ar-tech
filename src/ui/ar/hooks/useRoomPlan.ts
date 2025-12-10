import { useRoomPlan as useExpoRoomPlanLib, ExportType } from 'expo-roomplan';

/**
 * Hook wrapper for expo-roomplan
 * Uses the simplest API: useRoomPlan with startRoomPlan
 *
 * This hook:
 * 1. Opens RoomPlan UI modal
 * 2. User scans room with instructions
 * 3. User reviews in preview
 * 4. Auto-exports if exportOnFinish=true
 * 5. Returns to app
 */
export const useRoomPlan = () => {
  const { startRoomPlan } = useExpoRoomPlanLib({
    exportType: ExportType.Parametric,
    sendFileLoc: true
  });

  /**
   * Start a new room scan
   * @param scanName - Name for the exported files (e.g., "My Room")
   * @returns Promise that resolves when scan is complete
   */
  const startScanning = async (scanName: string = 'My Scan') => {
    try {
      console.log('[RoomPlan] Starting scan with name:', scanName);
      const result = await startRoomPlan(scanName);
      console.log('[RoomPlan] Scan completed:', result);
      return result;
    } catch (error) {
      console.error('[RoomPlan] Scan error:', error);
      throw error;
    }
  };

  return {
    startScanning
  };
};
