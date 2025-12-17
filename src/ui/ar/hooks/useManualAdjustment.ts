import { useCallback, useState } from 'react';

import { alignmentStorage } from '@/services/alignmentStorage';

import { ExpoARKitModule } from '../../../../modules/expo-arkit';

/**
 * Vector3 transformation type
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Manual adjustment state
 */
export interface ManualAdjustmentState {
  position: Vector3;
  rotation: Vector3;
  scale: number;
}

/**
 * Manual adjustment result after applying transformation
 */
export interface ManualAdjustmentResult {
  success: boolean;
  message: string;
  transformation: ManualAdjustmentState;
}

/**
 * Hook for manual model adjustment (position, rotation, scale)
 *
 * Allows fine-tuning of model transformations after auto-alignment
 * or from scratch. Applies transformations in real-time to ARKit models.
 *
 * @example
 * ```tsx
 * const { state, updatePosition, updateRotation, updateScale, applyTransformation, reset } =
 *   useManualAdjustment(modelId, viewTag);
 *
 * // Update position X
 * updatePosition('x', 0.5);
 *
 * // Apply all transformations
 * await applyTransformation();
 * ```
 */
export const useManualAdjustment = (initialModelId?: string, initialViewTag?: number) => {
  const [modelId, setModelId] = useState<string | undefined>(initialModelId);
  const [viewTag, setViewTag] = useState<number | undefined>(initialViewTag);

  // Transformation state
  const [state, setState] = useState<ManualAdjustmentState>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1
  });

  // Operation state
  const [isApplying, setIsApplying] = useState(false);
  const [lastResult, setLastResult] = useState<ManualAdjustmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update model ID and view tag
   */
  const setModel = useCallback((newModelId: string, newViewTag: number) => {
    setModelId(newModelId);
    setViewTag(newViewTag);
  }, []);

  /**
   * Update position component (x, y, or z)
   */
  const updatePosition = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    setState((prev) => ({
      ...prev,
      position: { ...prev.position, [axis]: value }
    }));
  }, []);

  /**
   * Update rotation component (x, y, or z) in radians
   */
  const updateRotation = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    setState((prev) => ({
      ...prev,
      rotation: { ...prev.rotation, [axis]: value }
    }));
  }, []);

  /**
   * Update uniform scale
   */
  const updateScale = useCallback((value: number) => {
    // Clamp scale to reasonable range (0.1 - 10.0)
    const clampedScale = Math.max(0.1, Math.min(10, value));
    setState((prev) => ({ ...prev, scale: clampedScale }));
  }, []);

  /**
   * Restore last saved manual alignment (Phase 2.3)
   */
  const restoreLastManualAlignment = useCallback(async () => {
    const saved = await alignmentStorage.loadLastManualAlignment();
    if (saved?.transformation) {
      setState(saved.transformation);
    }
    return saved;
  }, []);

  /**
   * Apply current transformation to ARKit model
   */
  const applyTransformation = useCallback(async (): Promise<ManualAdjustmentResult> => {
    if (!modelId) {
      const errorMsg = 'No model ID set. Use setModel() first.';
      setError(errorMsg);
      return { success: false, message: errorMsg, transformation: state };
    }

    if (viewTag === undefined) {
      const errorMsg = 'No view tag set. Use setModel() first.';
      setError(errorMsg);
      return { success: false, message: errorMsg, transformation: state };
    }

    setIsApplying(true);
    setError(null);

    try {
      console.log('[useManualAdjustment] Applying transformation:', {
        modelId,
        viewTag,
        state
      });

      // Apply transformation via native module
      await ExpoARKitModule.updateModelTransform(
        viewTag,
        modelId,
        [state.position.x, state.position.y, state.position.z], // position array
        [state.rotation.x, state.rotation.y, state.rotation.z], // rotation array (radians)
        [state.scale, state.scale, state.scale] // scale array (uniform)
      );

      const result: ManualAdjustmentResult = {
        success: true,
        message: 'Transformation applied successfully',
        transformation: state
      };

      await alignmentStorage.saveLastManualAlignment({
        modelId,
        transformation: state
      });

      setLastResult(result);
      console.log('[useManualAdjustment] Transformation applied:', result);

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to apply transformation';
      console.error('[useManualAdjustment] Error applying transformation:', err);
      setError(errorMsg);

      const result: ManualAdjustmentResult = {
        success: false,
        message: errorMsg,
        transformation: state
      };

      setLastResult(result);
      return result;
    } finally {
      setIsApplying(false);
    }
  }, [modelId, viewTag, state]);

  /**
   * Reset transformation to defaults
   */
  const reset = useCallback(() => {
    setState({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1
    });
    setError(null);
    setLastResult(null);
    console.log('[useManualAdjustment] State reset to defaults');
  }, []);

  /**
   * Load transformation from existing state (e.g., from auto-alignment)
   */
  const loadTransformation = useCallback((transformation: ManualAdjustmentState) => {
    setState(transformation);
    console.log('[useManualAdjustment] Loaded transformation:', transformation);
  }, []);

  /**
   * Preset transformations
   */
  const presets = {
    /**
     * Center model at origin
     */
    center: useCallback(() => {
      setState((prev) => ({
        ...prev,
        position: { x: 0, y: 0, z: 0 }
      }));
    }, []),

    /**
     * Rotate 90 degrees clockwise around Y axis
     */
    rotate90: useCallback(() => {
      setState((prev) => ({
        ...prev,
        rotation: { ...prev.rotation, y: prev.rotation.y + Math.PI / 2 }
      }));
    }, []),

    /**
     * Rotate 90 degrees counter-clockwise around Y axis
     */
    rotate90CCW: useCallback(() => {
      setState((prev) => ({
        ...prev,
        rotation: { ...prev.rotation, y: prev.rotation.y - Math.PI / 2 }
      }));
    }, []),

    /**
     * Double current scale
     */
    scaleUp: useCallback(() => {
      setState((prev) => ({
        ...prev,
        scale: Math.min(10, prev.scale * 2)
      }));
    }, []),

    /**
     * Halve current scale
     */
    scaleDown: useCallback(() => {
      setState((prev) => ({
        ...prev,
        scale: Math.max(0.1, prev.scale * 0.5)
      }));
    }, [])
  };

  return {
    // State
    state,
    modelId,
    viewTag,
    isApplying,
    lastResult,
    error,

    // Actions
    setModel,
    updatePosition,
    updateRotation,
    updateScale,
    applyTransformation,
    reset,
    loadTransformation,
    restoreLastManualAlignment,
    presets
  };
};
