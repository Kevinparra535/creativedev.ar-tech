import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { requireNativeViewManager } from 'expo-modules-core';
import { ViewProps, StyleSheet, findNodeHandle } from 'react-native';
import { ExpoARKitModule, ModelDimensionsResponse, AllModelIdsResponse, ModelTransformResponse, ModelTransformData } from './ExpoARKitModule';

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

export interface ARKitViewProps extends ViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
  onModelLoaded?: (event: { nativeEvent: { success: boolean; message: string; path: string; modelId: string } }) => void;
  onModelPlaced?: (event: { nativeEvent: ModelPlacedEvent }) => void;
  onPlaneDetected?: (event: { nativeEvent: { plane: PlaneData; totalPlanes: number } }) => void;
  onPlaneUpdated?: (event: { nativeEvent: { plane: PlaneData } }) => void;
  onPlaneRemoved?: (event: { nativeEvent: { planeId: string; totalPlanes: number } }) => void;
}

export interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: number[]) => void;
  placeModelOnTap: (path: string, scale?: number) => void;
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
        if (viewId !== null) {
          console.log('Calling addTestObject with viewId:', viewId);
          await ExpoARKitModule.addTestObject(viewId);
          console.log('addTestObject completed successfully');
        } else {
          console.error('viewId is null');
        }
      } catch (error) {
        console.error('Error adding test object:', error);
      }
    },
    loadModel: async (path: string, scale: number = 1.0, position: number[] = [0, 0, -1]) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling loadModel with viewId:', viewId, 'path:', path);
          await ExpoARKitModule.loadModel(viewId, path, scale, position);
          console.log('loadModel completed successfully');
        } else {
          console.error('viewId is null');
        }
      } catch (error) {
        console.error('Error loading model:', error);
      }
    },
    placeModelOnTap: async (path: string, scale: number = 1.0) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling placeModelOnTap with viewId:', viewId, 'path:', path);
          await ExpoARKitModule.placeModelOnTap(viewId, path, scale);
          console.log('Model prepared for tap placement - tap on a surface to place');
        } else {
          console.error('viewId is null');
        }
      } catch (error) {
        console.error('Error preparing model for tap placement:', error);
      }
    },
    removeAllAnchors: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling removeAllAnchors with viewId:', viewId);
          await ExpoARKitModule.removeAllAnchors(viewId);
          console.log('All anchors removed successfully');
        } else {
          console.error('viewId is null');
        }
      } catch (error) {
        console.error('Error removing anchors:', error);
      }
    },
    undoLastModel: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling undoLastModel with viewId:', viewId);
          await ExpoARKitModule.undoLastModel(viewId);
          console.log('Last model undone successfully');
        } else {
          console.error('viewId is null');
        }
      } catch (error) {
        console.error('Error undoing last model:', error);
      }
    },
    setPlaneVisibility: async (visible: boolean) => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling setPlaneVisibility with viewId:', viewId, 'visible:', visible);
          await ExpoARKitModule.setPlaneVisibility(viewId, visible);
          console.log('Plane visibility set successfully');
        } else {
          console.error('viewId is null');
        }
      } catch (error) {
        console.error('Error setting plane visibility:', error);
      }
    },
    getModelDimensions: async (modelId: string): Promise<ModelDimensionsResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling getModelDimensions with viewId:', viewId, 'modelId:', modelId);
          const result = await ExpoARKitModule.getModelDimensions(viewId, modelId);
          console.log('Model dimensions retrieved:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error getting model dimensions:', error);
        return { success: false, error: String(error) };
      }
    },
    getAllModelIds: async (): Promise<AllModelIdsResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling getAllModelIds with viewId:', viewId);
          const result = await ExpoARKitModule.getAllModelIds(viewId);
          console.log('All model IDs retrieved:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error getting all model IDs:', error);
        return { success: false, error: String(error) };
      }
    },
    updateModelTransform: async (modelId: string, scale?: number[], rotation?: number[], position?: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling updateModelTransform with viewId:', viewId, 'modelId:', modelId);
          const result = await ExpoARKitModule.updateModelTransform(viewId, modelId, scale, rotation, position);
          console.log('Model transform updated:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error updating model transform:', error);
        return { success: false, error: String(error) };
      }
    },
    setModelScale: async (modelId: string, scale: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling setModelScale with viewId:', viewId, 'modelId:', modelId, 'scale:', scale);
          const result = await ExpoARKitModule.setModelScale(viewId, modelId, scale);
          console.log('Model scale set:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error setting model scale:', error);
        return { success: false, error: String(error) };
      }
    },
    setModelRotation: async (modelId: string, rotation: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling setModelRotation with viewId:', viewId, 'modelId:', modelId, 'rotation:', rotation);
          const result = await ExpoARKitModule.setModelRotation(viewId, modelId, rotation);
          console.log('Model rotation set:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error setting model rotation:', error);
        return { success: false, error: String(error) };
      }
    },
    setModelPosition: async (modelId: string, position: number[]): Promise<ModelTransformResponse> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling setModelPosition with viewId:', viewId, 'modelId:', modelId, 'position:', position);
          const result = await ExpoARKitModule.setModelPosition(viewId, modelId, position);
          console.log('Model position set:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error setting model position:', error);
        return { success: false, error: String(error) };
      }
    },
    getModelTransform: async (modelId: string): Promise<ModelTransformData> => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          console.log('Calling getModelTransform with viewId:', viewId, 'modelId:', modelId);
          const result = await ExpoARKitModule.getModelTransform(viewId, modelId);
          console.log('Model transform retrieved:', result);
          return result;
        } else {
          console.error('viewId is null');
          return { success: false, error: 'viewId is null' };
        }
      } catch (error) {
        console.error('Error getting model transform:', error);
        return { success: false, error: String(error) };
      }
    },
    getViewTag: () => {
      return findNodeHandle(nativeRef.current);
    },
  }));

  return (
    <NativeARKitView
      ref={nativeRef}
      style={[styles.container, props.style]}
      onARInitialized={props.onARInitialized}
      onARError={props.onARError}
      onModelLoaded={props.onModelLoaded}
      onModelPlaced={props.onModelPlaced}
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
