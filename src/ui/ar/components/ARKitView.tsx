import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, StyleSheet, ViewProps } from 'react-native';

import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';

const NativeARKitView = requireNativeViewManager('ExpoARKit');
const ExpoARKitModule = requireNativeModule('ExpoARKit');

// Plane detection types
export interface PlaneInfo {
  id: string;
  type: string;
  alignment: 'horizontal' | 'vertical' | 'unknown';
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

export interface PlaneDetectedEvent {
  nativeEvent: {
    plane: PlaneInfo;
    totalPlanes: number;
  };
}

export interface PlaneUpdatedEvent {
  nativeEvent: {
    plane: PlaneInfo;
    totalPlanes: number;
  };
}

export interface PlaneRemovedEvent {
  nativeEvent: {
    planeId: string;
    totalPlanes: number;
  };
}

export interface PlaneSelectedEvent {
  nativeEvent: {
    plane?: PlaneInfo;
    selected: boolean;
  };
}

// Mesh reconstruction types
export type MeshClassification =
  | 'wall'
  | 'floor'
  | 'ceiling'
  | 'door'
  | 'window'
  | 'seat'
  | 'table'
  | 'none'
  | 'unknown';

export interface MeshInfo {
  id: string;
  vertexCount: number;
  faceCount: number;
  classification: MeshClassification;
  centerX: number;
  centerY: number;
  centerZ: number;
  extentX: number;
  extentY: number;
  extentZ: number;
}

export interface MeshAddedEvent {
  nativeEvent: {
    mesh: MeshInfo;
    totalMeshes: number;
  };
}

export interface MeshUpdatedEvent {
  nativeEvent: {
    mesh: MeshInfo;
    totalMeshes: number;
  };
}

export interface MeshRemovedEvent {
  nativeEvent: {
    meshId: string;
    totalMeshes: number;
  };
}

export interface ARKitViewProps extends ViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
  onModelLoaded?: (event: {
    nativeEvent: { success: boolean; message: string; path: string };
  }) => void;
  onModelPlaced?: (event: {
    nativeEvent: { success: boolean; message: string; path: string };
  }) => void;
  onPlaneDetected?: (event: PlaneDetectedEvent) => void;
  onPlaneUpdated?: (event: PlaneUpdatedEvent) => void;
  onPlaneRemoved?: (event: PlaneRemovedEvent) => void;
  onPlaneSelected?: (event: PlaneSelectedEvent) => void;
  onMeshAdded?: (event: MeshAddedEvent) => void;
  onMeshUpdated?: (event: MeshUpdatedEvent) => void;
  onMeshRemoved?: (event: MeshRemovedEvent) => void;
}

// Model transformation types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ModelDimensionsResponse {
  success: boolean;
  modelId?: string;
  dimensions?: { width: number; height: number; depth: number };
  center?: Vector3;
  position?: Vector3;
  volume?: number;
  scale?: Vector3;
  error?: string;
}

export interface AllModelIdsResponse {
  success: boolean;
  modelIds?: string[];
  count?: number;
  error?: string;
}

export interface ModelTransformResponse {
  success: boolean;
  modelId?: string;
  message?: string;
  scale?: Vector3;
  rotation?: Vector3;
  position?: Vector3;
  error?: string;
}

export interface ModelTransformData {
  success: boolean;
  modelId?: string;
  scale?: Vector3;
  rotation?: Vector3;
  position?: Vector3;
  error?: string;
}

export interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: [number, number, number]) => void;
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
}

export const ARKitView = forwardRef<ARKitViewRef, ARKitViewProps>((props, ref) => {
  const nativeRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    addTestObject: () => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        ExpoARKitModule.addTestObject(viewTag);
      }
    },
    loadModel: (
      path: string,
      scale: number = 1,
      position: [number, number, number] = [0, 0, -1]
    ) => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        ExpoARKitModule.loadModel(viewTag, path, scale, position);
      }
    },
    placeModelOnTap: (path: string, scale: number = 1) => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        ExpoARKitModule.placeModelOnTap(viewTag, path, scale);
      }
    },
    removeAllAnchors: () => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        ExpoARKitModule.removeAllAnchors(viewTag);
      }
    },
    undoLastModel: () => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        ExpoARKitModule.undoLastModel(viewTag);
      }
    },
    setPlaneVisibility: (visible: boolean) => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        ExpoARKitModule.setPlaneVisibility(viewTag, visible);
      }
    },
    getModelDimensions: async (modelId: string): Promise<ModelDimensionsResponse> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.getModelDimensions(viewTag, modelId);
      }
      return { success: false, error: 'View not found' };
    },
    getAllModelIds: async (): Promise<AllModelIdsResponse> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.getAllModelIds(viewTag);
      }
      return { success: false, error: 'View not found' };
    },
    updateModelTransform: async (modelId: string, scale?: number[], rotation?: number[], position?: number[]): Promise<ModelTransformResponse> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.updateModelTransform(viewTag, modelId, scale, rotation, position);
      }
      return { success: false, error: 'View not found' };
    },
    setModelScale: async (modelId: string, scale: number[]): Promise<ModelTransformResponse> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.setModelScale(viewTag, modelId, scale);
      }
      return { success: false, error: 'View not found' };
    },
    setModelRotation: async (modelId: string, rotation: number[]): Promise<ModelTransformResponse> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.setModelRotation(viewTag, modelId, rotation);
      }
      return { success: false, error: 'View not found' };
    },
    setModelPosition: async (modelId: string, position: number[]): Promise<ModelTransformResponse> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.setModelPosition(viewTag, modelId, position);
      }
      return { success: false, error: 'View not found' };
    },
    getModelTransform: async (modelId: string): Promise<ModelTransformData> => {
      const viewTag = findNodeHandle(nativeRef.current);
      if (viewTag) {
        return await ExpoARKitModule.getModelTransform(viewTag, modelId);
      }
      return { success: false, error: 'View not found' };
    }
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
      onPlaneSelected={props.onPlaneSelected}
      onMeshAdded={props.onMeshAdded}
      onMeshUpdated={props.onMeshUpdated}
      onMeshRemoved={props.onMeshRemoved}
    />
  );
});

ARKitView.displayName = 'ARKitView';

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
