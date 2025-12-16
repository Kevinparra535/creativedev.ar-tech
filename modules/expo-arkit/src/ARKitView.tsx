import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, StyleSheet, ViewProps } from 'react-native';

import { requireNativeViewManager } from 'expo-modules-core';

import { AllModelIdsResponse, ExpoARKitModule, ModelDimensionsResponse, ModelTransformData, ModelTransformResponse } from './ExpoARKitModule';

const NativeARKitView = requireNativeViewManager('ExpoARKit');

// Event types
export interface PlaneData {
  id: string;
  type: string;
  alignment: string;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

export interface ModelPlacedEvent {
  success: boolean;
  modelId: string;
  anchorId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  path: string;
}

export interface PlacementPreviewUpdatedEvent {
  valid: boolean;
  distance?: number;
  isEstimated?: boolean;
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ScanGuidanceUpdatedEvent {
  coverage: number;
  isStable: boolean;
  ready: boolean;
  mode?: 'floor' | 'wall' | 'none';
  observedWidth?: number;
  observedHeight?: number;
}

export interface ARKitViewProps extends ViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
  onModelLoaded?: (event: { nativeEvent: { success: boolean; message: string; path: string; modelId: string } }) => void;
  onModelPlaced?: (event: { nativeEvent: ModelPlacedEvent }) => void;
  onPlacementPreviewUpdated?: (event: { nativeEvent: PlacementPreviewUpdatedEvent }) => void;
  onScanGuidanceUpdated?: (event: { nativeEvent: ScanGuidanceUpdatedEvent }) => void;
  onPlaneDetected?: (event: { nativeEvent: { plane: PlaneData; totalPlanes: number } }) => void;
  onPlaneUpdated?: (event: { nativeEvent: { plane: PlaneData } }) => void;
  onPlaneRemoved?: (event: { nativeEvent: { planeId: string; totalPlanes: number } }) => void;
}

export interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: number[]) => void;
  placeModelOnTap: (path: string, scale?: number) => void;
  startPlacementPreview: (path: string, scale?: number) => void;
  stopPlacementPreview: () => void;
  confirmPlacement: () => void;
  startScanGuidance: (path: string, scale: number, targetWidth: number, targetLength: number) => void;
  startWallScanGuidance: (
    path: string,
    scale: number,
    targetWidth: number,
    targetHeight: number,
    depthOffset: number
  ) => void;
  stopScanGuidance: () => void;
  confirmGuidedPlacement: () => void;
  removeAllAnchors: () => void;
  undoLastModel: () => void;
  setPlaneVisibility: (visible: boolean) => void;
  getModelDimensions: (modelId: string) => Promise<ModelDimensionsResponse>;
  getAllModelIds: () => Promise<AllModelIdsResponse>;
  updateModelTransform: (modelId: string, scale?: number[], rotation?: number[], position?: number[]) => Promise<ModelTransformResponse>;
  setModelScale: (modelId: string, scale: number[]) => Promise<ModelTransformResponse>;
  setModelRotation: (modelId: string, rotation: number[]) => Promise<ModelTransformResponse>;
  setModelPosition: (modelId: string, position: number[]) => Promise<ModelTransformResponse>;
  getModelTransform: (modelId: string) => Promise<ModelTransformData>;
  getViewTag: () => number | null;
}

export const ARKitView = forwardRef<ARKitViewRef, ARKitViewProps>((props, ref) => {
  const nativeRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    addTestObject: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling addTestObject with viewId:', viewId);
        await ExpoARKitModule.addTestObject(viewId);
        console.log('addTestObject completed successfully');
      } catch (error) {
        console.error('Error adding test object:', error);
      }
    },
    loadModel: async (path: string, scale: number = 1, position: number[] = [0, 0, -1]) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling loadModel with viewId:', viewId, 'path:', path);
        await ExpoARKitModule.loadModel(viewId, path, scale, position);
        console.log('loadModel completed successfully');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    },
    placeModelOnTap: async (path: string, scale: number = 1) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling placeModelOnTap with viewId:', viewId, 'path:', path);
        await ExpoARKitModule.placeModelOnTap(viewId, path, scale);
        console.log('Model prepared for tap placement - tap on a surface to place');
      } catch (error) {
        console.error('Error preparing model for tap placement:', error);
      }
    },

    startPlacementPreview: async (path: string, scale: number = 1) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling startPlacementPreview with viewId:', viewId, 'path:', path);
        await ExpoARKitModule.startPlacementPreview(viewId, path, scale);
        console.log('Placement preview started');
      } catch (error) {
        console.error('Error starting placement preview:', error);
      }
    },

    stopPlacementPreview: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling stopPlacementPreview with viewId:', viewId);
        await ExpoARKitModule.stopPlacementPreview(viewId);
        console.log('Placement preview stopped');
      } catch (error) {
        console.error('Error stopping placement preview:', error);
      }
    },

    confirmPlacement: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling confirmPlacement with viewId:', viewId);
        await ExpoARKitModule.confirmPlacement(viewId);
        console.log('Placement confirmed');
      } catch (error) {
        console.error('Error confirming placement:', error);
      }
    },

    startScanGuidance: async (path: string, scale: number, targetWidth: number, targetLength: number) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        await ExpoARKitModule.startScanGuidance(viewId, path, scale, targetWidth, targetLength);
      } catch (error) {
        console.error('Error starting scan guidance:', error);
      }
    },

    startWallScanGuidance: async (
      path: string,
      scale: number,
      targetWidth: number,
      targetHeight: number,
      depthOffset: number
    ) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        await ExpoARKitModule.startWallScanGuidance(
          viewId,
          path,
          scale,
          targetWidth,
          targetHeight,
          depthOffset
        );
      } catch (error) {
        console.error('Error starting wall scan guidance:', error);
      }
    },

    stopScanGuidance: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        await ExpoARKitModule.stopScanGuidance(viewId);
      } catch (error) {
        console.error('Error stopping scan guidance:', error);
      }
    },

    confirmGuidedPlacement: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        await ExpoARKitModule.confirmGuidedPlacement(viewId);
      } catch (error) {
        console.error('Error confirming guided placement:', error);
      }
    },
    removeAllAnchors: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling removeAllAnchors with viewId:', viewId);
        await ExpoARKitModule.removeAllAnchors(viewId);
        console.log('All anchors removed successfully');
      } catch (error) {
        console.error('Error removing anchors:', error);
      }
    },
    undoLastModel: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling undoLastModel with viewId:', viewId);
        await ExpoARKitModule.undoLastModel(viewId);
        console.log('Last model undone successfully');
      } catch (error) {
        console.error('Error undoing last model:', error);
      }
    },
    setPlaneVisibility: async (visible: boolean) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return;
        }

        console.log('Calling setPlaneVisibility with viewId:', viewId, 'visible:', visible);
        await ExpoARKitModule.setPlaneVisibility(viewId, visible);
        console.log('Plane visibility set successfully');
      } catch (error) {
        console.error('Error setting plane visibility:', error);
      }
    },
    getModelDimensions: async (modelId: string): Promise<ModelDimensionsResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling getModelDimensions with viewId:', viewId, 'modelId:', modelId);
        const result = await ExpoARKitModule.getModelDimensions(viewId, modelId);
        console.log('Model dimensions retrieved:', result);
        return result;
      } catch (error) {
        console.error('Error getting model dimensions:', error);
        return { success: false, error: String(error) };
      }
    },
    getAllModelIds: async (): Promise<AllModelIdsResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling getAllModelIds with viewId:', viewId);
        const result = await ExpoARKitModule.getAllModelIds(viewId);
        console.log('All model IDs retrieved:', result);
        return result;
      } catch (error) {
        console.error('Error getting all model IDs:', error);
        return { success: false, error: String(error) };
      }
    },
    updateModelTransform: async (modelId: string, scale?: number[], rotation?: number[], position?: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling updateModelTransform with viewId:', viewId, 'modelId:', modelId);
        const result = await ExpoARKitModule.updateModelTransform(viewId, modelId, scale, rotation, position);
        console.log('Model transform updated:', result);
        return result;
      } catch (error) {
        console.error('Error updating model transform:', error);
        return { success: false, error: String(error) };
      }
    },
    setModelScale: async (modelId: string, scale: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling setModelScale with viewId:', viewId, 'modelId:', modelId, 'scale:', scale);
        const result = await ExpoARKitModule.setModelScale(viewId, modelId, scale);
        console.log('Model scale set:', result);
        return result;
      } catch (error) {
        console.error('Error setting model scale:', error);
        return { success: false, error: String(error) };
      }
    },
    setModelRotation: async (modelId: string, rotation: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling setModelRotation with viewId:', viewId, 'modelId:', modelId, 'rotation:', rotation);
        const result = await ExpoARKitModule.setModelRotation(viewId, modelId, rotation);
        console.log('Model rotation set:', result);
        return result;
      } catch (error) {
        console.error('Error setting model rotation:', error);
        return { success: false, error: String(error) };
      }
    },
    setModelPosition: async (modelId: string, position: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling setModelPosition with viewId:', viewId, 'modelId:', modelId, 'position:', position);
        const result = await ExpoARKitModule.setModelPosition(viewId, modelId, position);
        console.log('Model position set:', result);
        return result;
      } catch (error) {
        console.error('Error setting model position:', error);
        return { success: false, error: String(error) };
      }
    },
    getModelTransform: async (modelId: string): Promise<ModelTransformData> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }

        console.log('Calling getModelTransform with viewId:', viewId, 'modelId:', modelId);
        const result = await ExpoARKitModule.getModelTransform(viewId, modelId);
        console.log('Model transform retrieved:', result);
        return result;
      } catch (error) {
        console.error('Error getting model transform:', error);
        return { success: false, error: String(error) };
      }
    },
    getViewTag: () => findNodeHandle(nativeRef.current),
  }));

  return (
    <NativeARKitView
      ref={nativeRef}
      style={[styles.container, props.style]}
      onARInitialized={props.onARInitialized}
      onARError={props.onARError}
      onModelLoaded={props.onModelLoaded}
      onModelPlaced={props.onModelPlaced}
      onPlacementPreviewUpdated={props.onPlacementPreviewUpdated}
      onScanGuidanceUpdated={props.onScanGuidanceUpdated}
      onPlaneDetected={props.onPlaneDetected}
      onPlaneUpdated={props.onPlaneUpdated}
      onPlaneRemoved={props.onPlaneRemoved}
    />
  );
});

ARKitView.displayName = 'ARKitView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
