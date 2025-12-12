import { useCallback, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ARKitViewRef } from '../../../../modules/expo-arkit/src/ARKitView';

const STORAGE_KEY = '@ar_model_transformations';

export interface ModelTransform {
  modelId: string;
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}

export interface SavedTransformations {
  [modelId: string]: ModelTransform;
}

/**
 * Hook to manage model transformations with AsyncStorage persistence
 * Allows manual control of scale, rotation, and position for AR models
 */
export const useModelTransformation = (arViewRef: React.RefObject<ARKitViewRef>) => {
  const [transformations, setTransformations] = useState<SavedTransformations>({});
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transformations from AsyncStorage on mount
  useEffect(() => {
    loadTransformations();
  }, []);

  /**
   * Load saved transformations from AsyncStorage
   */
  const loadTransformations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as SavedTransformations;
        setTransformations(parsed);
        console.log('[ModelTransformation] Loaded transformations:', parsed);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transformations';
      console.error('[ModelTransformation] Error loading transformations:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save transformations to AsyncStorage
   */
  const saveTransformations = async (data: SavedTransformations) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('[ModelTransformation] Saved transformations:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save transformations';
      console.error('[ModelTransformation] Error saving transformations:', errorMessage);
      setError(errorMessage);
    }
  };

  /**
   * Get transformation for a specific model
   */
  const getTransformation = useCallback(
    async (modelId: string): Promise<ModelTransform | null> => {
      try {
        if (!arViewRef.current) {
          console.error('[ModelTransformation] ARView ref is null');
          return null;
        }

        if (typeof arViewRef.current.getModelTransform !== 'function') {
          console.error(
            '[ModelTransformation] getModelTransform method not available - app may need rebuilding'
          );
          return null;
        }

        const result = await arViewRef.current.getModelTransform(modelId);

        if (result.success && result.scale && result.rotation && result.position) {
          const transform: ModelTransform = {
            modelId,
            scale: result.scale,
            rotation: result.rotation,
            position: result.position
          };

          // Update local state
          setTransformations((prev) => ({
            ...prev,
            [modelId]: transform
          }));

          return transform;
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get transformation';
        console.error('[ModelTransformation] Error getting transformation:', errorMessage);
        setError(errorMessage);
        return null;
      }
    },
    [arViewRef]
  );

  /**
   * Update model scale
   */
  const updateScale = useCallback(
    async (modelId: string, scale: { x: number; y: number; z: number }) => {
      try {
        if (!arViewRef.current) {
          throw new Error('ARView ref is null');
        }

        const result = await arViewRef.current.setModelScale(modelId, [scale.x, scale.y, scale.z]);

        if (result.success) {
          const updatedTransform: ModelTransform = {
            ...transformations[modelId],
            modelId,
            scale
          };

          const newTransformations = {
            ...transformations,
            [modelId]: updatedTransform
          };

          setTransformations(newTransformations);
          await saveTransformations(newTransformations);

          console.log('[ModelTransformation] Updated scale for model:', modelId, scale);
        } else {
          throw new Error(result.error || 'Failed to update scale');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update scale';
        console.error('[ModelTransformation] Error updating scale:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [arViewRef, transformations]
  );

  /**
   * Update model rotation
   */
  const updateRotation = useCallback(
    async (modelId: string, rotation: { x: number; y: number; z: number }) => {
      try {
        if (!arViewRef.current) {
          throw new Error('ARView ref is null');
        }

        const result = await arViewRef.current.setModelRotation(modelId, [
          rotation.x,
          rotation.y,
          rotation.z
        ]);

        if (result.success) {
          const updatedTransform: ModelTransform = {
            ...transformations[modelId],
            modelId,
            rotation
          };

          const newTransformations = {
            ...transformations,
            [modelId]: updatedTransform
          };

          setTransformations(newTransformations);
          await saveTransformations(newTransformations);

          console.log('[ModelTransformation] Updated rotation for model:', modelId, rotation);
        } else {
          throw new Error(result.error || 'Failed to update rotation');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update rotation';
        console.error('[ModelTransformation] Error updating rotation:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [arViewRef, transformations]
  );

  /**
   * Update model position
   */
  const updatePosition = useCallback(
    async (modelId: string, position: { x: number; y: number; z: number }) => {
      try {
        if (!arViewRef.current) {
          throw new Error('ARView ref is null');
        }

        const result = await arViewRef.current.setModelPosition(modelId, [
          position.x,
          position.y,
          position.z
        ]);

        if (result.success) {
          const updatedTransform: ModelTransform = {
            ...transformations[modelId],
            modelId,
            position
          };

          const newTransformations = {
            ...transformations,
            [modelId]: updatedTransform
          };

          setTransformations(newTransformations);
          await saveTransformations(newTransformations);

          console.log('[ModelTransformation] Updated position for model:', modelId, position);
        } else {
          throw new Error(result.error || 'Failed to update position');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update position';
        console.error('[ModelTransformation] Error updating position:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [arViewRef, transformations]
  );

  /**
   * Update multiple transformation properties at once
   */
  const updateTransform = useCallback(
    async (
      modelId: string,
      scale?: { x: number; y: number; z: number },
      rotation?: { x: number; y: number; z: number },
      position?: { x: number; y: number; z: number }
    ) => {
      try {
        if (!arViewRef.current) {
          throw new Error('ARView ref is null');
        }

        const scaleArray = scale ? [scale.x, scale.y, scale.z] : undefined;
        const rotationArray = rotation ? [rotation.x, rotation.y, rotation.z] : undefined;
        const positionArray = position ? [position.x, position.y, position.z] : undefined;

        const result = await arViewRef.current.updateModelTransform(
          modelId,
          scaleArray,
          rotationArray,
          positionArray
        );

        if (result.success) {
          const updatedTransform: ModelTransform = {
            ...transformations[modelId],
            modelId,
            ...(scale && { scale }),
            ...(rotation && { rotation }),
            ...(position && { position })
          };

          const newTransformations = {
            ...transformations,
            [modelId]: updatedTransform
          };

          setTransformations(newTransformations);
          await saveTransformations(newTransformations);

          console.log('[ModelTransformation] Updated transform for model:', modelId);
        } else {
          throw new Error(result.error || 'Failed to update transform');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update transform';
        console.error('[ModelTransformation] Error updating transform:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [arViewRef, transformations]
  );

  /**
   * Apply saved transformation to a model
   */
  const applyTransformation = useCallback(
    async (modelId: string) => {
      const savedTransform = transformations[modelId];
      if (!savedTransform) {
        console.log('[ModelTransformation] No saved transformation for model:', modelId);
        return;
      }

      await updateTransform(
        modelId,
        savedTransform.scale,
        savedTransform.rotation,
        savedTransform.position
      );
    },
    [transformations, updateTransform]
  );

  /**
   * Clear transformation for a specific model
   */
  const clearTransformation = useCallback(
    async (modelId: string) => {
      const newTransformations = { ...transformations };
      delete newTransformations[modelId];
      setTransformations(newTransformations);
      await saveTransformations(newTransformations);
      console.log('[ModelTransformation] Cleared transformation for model:', modelId);
    },
    [transformations]
  );

  /**
   * Clear all transformations
   */
  const clearAllTransformations = useCallback(async () => {
    setTransformations({});
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[ModelTransformation] Cleared all transformations');
  }, []);

  return {
    transformations,
    selectedModelId,
    setSelectedModelId,
    isLoading,
    error,
    getTransformation,
    updateScale,
    updateRotation,
    updatePosition,
    updateTransform,
    applyTransformation,
    clearTransformation,
    clearAllTransformations,
    loadTransformations
  };
};
