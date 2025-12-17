/**
 * Auto-Alignment Hook
 *
 * React hook for automatic model alignment using dimension matching.
 * Integrates modelAlignment service with ARKit module.
 *
 * @module useAutoAlignment
 */

import { useCallback, useState } from 'react';

import { alignmentStorage } from '@/services/alignmentStorage';

import type { ModelDimensionsResponse } from '../../../../modules/expo-arkit';
import { ExpoARKitModule } from '../../../../modules/expo-arkit';
import type { AlignmentConfig, ModelInfo } from '../../../services/modelAlignment';
import {
  calculateAutoAlignment,
  checkProportionCompatibility,
  validateRealWorldScale
} from '../../../services/modelAlignment';

export interface AutoAlignmentState {
  isCalculating: boolean;
  isApplying: boolean;
  result: AlignmentConfig | null;
  error: string | null;
  sourceModelId: string | null;
  targetModelId: string | null;
}

export interface AutoAlignmentHookReturn {
  // State
  state: AutoAlignmentState;

  // Actions
  alignModels: (
    sourceModelId: string,
    targetModelId: string,
    viewTag: number
  ) => Promise<AlignmentConfig | null>;
  applyAlignment: (
    modelId: string,
    alignment: AlignmentConfig,
    viewTag: number
  ) => Promise<boolean>;
  reset: () => void;

  // Validation helpers
  validateModels: (
    sourceModelId: string,
    targetModelId: string,
    viewTag: number
  ) => Promise<{
    valid: boolean;
    warnings: string[];
    proportionCompatibility: number;
  }>;
}

/**
 * Hook for automatic model alignment
 *
 * @example
 * ```tsx
 * const { state, alignModels, applyAlignment } = useAutoAlignment();
 *
 * const handleAlign = async () => {
 *   const result = await alignModels(designModelId, roomScanId, viewTag);
 *   if (result && result.confidence > 0.7) {
 *     await applyAlignment(designModelId, result, viewTag);
 *   }
 * };
 * ```
 */
export function useAutoAlignment(): AutoAlignmentHookReturn {
  const [state, setState] = useState<AutoAlignmentState>({
    isCalculating: false,
    isApplying: false,
    result: null,
    error: null,
    sourceModelId: null,
    targetModelId: null
  });

  /**
   * Convert ModelDimensionsResponse to ModelInfo
   */
  const convertToModelInfo = useCallback(
    (modelId: string, response: ModelDimensionsResponse): ModelInfo | null => {
      if (!response.success || !response.dimensions || !response.center) {
        return null;
      }

      return {
        modelId,
        dimensions: response.dimensions,
        center: response.center,
        position: response.position || { x: 0, y: 0, z: 0 },
        volume: response.volume || 0
      };
    },
    []
  );

  /**
   * Validate both models before alignment
   */
  const validateModels = useCallback(
    async (
      sourceModelId: string,
      targetModelId: string,
      viewTag: number
    ): Promise<{
      valid: boolean;
      warnings: string[];
      proportionCompatibility: number;
    }> => {
      const warnings: string[] = [];

      try {
        // Get dimensions of both models
        const sourceResult = await ExpoARKitModule.getModelDimensions(viewTag, sourceModelId);
        const targetResult = await ExpoARKitModule.getModelDimensions(viewTag, targetModelId);

        if (!sourceResult.success || !targetResult.success) {
          return {
            valid: false,
            warnings: ['Failed to get model dimensions'],
            proportionCompatibility: 0
          };
        }

        if (!sourceResult.dimensions || !targetResult.dimensions) {
          return {
            valid: false,
            warnings: ['Model dimensions not available'],
            proportionCompatibility: 0
          };
        }

        // Validate real-world scale
        const sourceValidation = validateRealWorldScale(sourceResult.dimensions, 'auto');
        const targetValidation = validateRealWorldScale(targetResult.dimensions, 'auto');

        if (!sourceValidation.valid) {
          warnings.push(`Source model: ${sourceValidation.warnings.join(', ')}`);
        }

        if (!targetValidation.valid) {
          warnings.push(`Target model: ${targetValidation.warnings.join(', ')}`);
        }

        // Check proportion compatibility
        const proportionCompatibility = checkProportionCompatibility(
          sourceResult.dimensions,
          targetResult.dimensions
        );

        if (proportionCompatibility < 0.6) {
          warnings.push(
            `Low proportion compatibility: ${(proportionCompatibility * 100).toFixed(0)}%`
          );
        }

        const valid = warnings.length === 0 || proportionCompatibility >= 0.6;

        return {
          valid,
          warnings,
          proportionCompatibility
        };
      } catch (error) {
        console.error('[useAutoAlignment] Validation error:', error);
        return {
          valid: false,
          warnings: [
            'Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')
          ],
          proportionCompatibility: 0
        };
      }
    },
    []
  );

  /**
   * Calculate alignment between two models
   */
  const alignModels = useCallback(
    async (
      sourceModelId: string,
      targetModelId: string,
      viewTag: number
    ): Promise<AlignmentConfig | null> => {
      console.log('[useAutoAlignment] Starting alignment calculation...', {
        source: sourceModelId,
        target: targetModelId
      });

      setState((prev) => ({
        ...prev,
        isCalculating: true,
        error: null,
        sourceModelId,
        targetModelId
      }));

      try {
        // Get dimensions of both models
        const sourceResult = await ExpoARKitModule.getModelDimensions(viewTag, sourceModelId);
        const targetResult = await ExpoARKitModule.getModelDimensions(viewTag, targetModelId);

        if (!sourceResult.success || !targetResult.success) {
          throw new Error('Failed to get model dimensions');
        }

        // Convert to ModelInfo
        const sourceInfo = convertToModelInfo(sourceModelId, sourceResult);
        const targetInfo = convertToModelInfo(targetModelId, targetResult);

        if (!sourceInfo || !targetInfo) {
          throw new Error('Invalid model information');
        }

        // Calculate alignment
        const alignment = calculateAutoAlignment(sourceInfo, targetInfo);

        console.log('[useAutoAlignment] ✅ Alignment calculated:', {
          scale: alignment.scale.toFixed(3),
          confidence: (alignment.confidence * 100).toFixed(0) + '%'
        });

        setState((prev) => ({
          ...prev,
          isCalculating: false,
          result: alignment
        }));

        return alignment;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[useAutoAlignment] ❌ Alignment calculation failed:', errorMessage);

        setState((prev) => ({
          ...prev,
          isCalculating: false,
          error: errorMessage
        }));

        return null;
      }
    },
    [convertToModelInfo]
  );

  /**
   * Apply calculated alignment to a model
   */
  const applyAlignment = useCallback(
    async (modelId: string, alignment: AlignmentConfig, viewTag: number): Promise<boolean> => {
      console.log('[useAutoAlignment] Applying alignment...', { modelId });

      setState((prev) => ({
        ...prev,
        isApplying: true,
        error: null
      }));

      try {
        // Apply transformation
        const result = await ExpoARKitModule.updateModelTransform(
          viewTag,
          modelId,
          [alignment.position.x, alignment.position.y, alignment.position.z],
          [alignment.rotation.x, alignment.rotation.y, alignment.rotation.z],
          [alignment.scale, alignment.scale, alignment.scale]
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to apply transformation');
        }

        await alignmentStorage.saveLastAutoAlignment({
          modelId,
          sourceModelId: state.sourceModelId ?? undefined,
          targetModelId: state.targetModelId ?? undefined,
          transformation: {
            position: alignment.position,
            rotation: alignment.rotation,
            scale: alignment.scale
          }
        });

        console.log('[useAutoAlignment] ✅ Alignment applied successfully');

        setState((prev) => ({
          ...prev,
          isApplying: false
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[useAutoAlignment] ❌ Failed to apply alignment:', errorMessage);

        setState((prev) => ({
          ...prev,
          isApplying: false,
          error: errorMessage
        }));

        return false;
      }
    },
    [state.sourceModelId, state.targetModelId]
  );

  /**
   * Reset alignment state
   */
  const reset = useCallback(() => {
    setState({
      isCalculating: false,
      isApplying: false,
      result: null,
      error: null,
      sourceModelId: null,
      targetModelId: null
    });
  }, []);

  return {
    state,
    alignModels,
    applyAlignment,
    reset,
    validateModels
  };
}
