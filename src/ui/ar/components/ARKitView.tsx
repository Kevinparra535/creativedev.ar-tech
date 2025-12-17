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
    nativeEvent: { success: boolean; message: string; path: string; modelId?: string };
  }) => void;
  onModelPlaced?: (event: {
    nativeEvent: { success: boolean; message: string; path: string; modelId?: string };
  }) => void;
  onModelCollision?: (event: {
    nativeEvent: {
      modelId: string;
      meshType: string;
      contactPoint?: { x: number; y: number; z: number };
      collisionForce: number;
      totalCollisions: number;
    };
  }) => void;
  onBoundaryWarning?: (event: {
    nativeEvent: {
      distance: number;
      warningThreshold: number;
      meshType: string;
      cameraPosition: { x: number; y: number; z: number };
    };
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

export interface CollisionStatsResponse {
  enabled: boolean;
  debugMode: boolean;
  totalCollisions: number;
  modelsWithPhysics: number;
  meshesWithPhysics: number;
}

export interface QualityStatsResponse {
  occlusionQuality: string;
  occlusionEnabled: boolean;
  showFPS: boolean;
  currentFPS: number;
  meshCount: number;
  modelCount: number;
  isMeshReconstructionEnabled: boolean;
}

export interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: [number, number, number]) => void;
  placeModelOnTap: (path: string, scale?: number) => void;
  removeAllAnchors: () => void;
  undoLastModel: () => void;
  setPlaneVisibility: (visible: boolean) => void;

  // Phase 3.1–3.4
  setPortalMode: (enabled: boolean) => Promise<void>;
  getPortalModeState: () => Promise<boolean>;
  getMeshClassificationStats: () => Promise<Record<string, any>>;

  setCollisionDetection: (enabled: boolean) => Promise<void>;
  getCollisionDetectionState: () => Promise<boolean>;
  setCollisionDebugMode: (enabled: boolean) => Promise<void>;
  getCollisionStats: () => Promise<CollisionStatsResponse>;
  resetCollisionCount: () => Promise<void>;

  setOcclusionQuality: (quality: 'low' | 'medium' | 'high') => Promise<void>;
  getOcclusionQuality: () => Promise<string>;
  setOcclusionEnabled: (enabled: boolean) => Promise<void>;
  getOcclusionEnabled: () => Promise<boolean>;
  setShowFPS: (show: boolean) => Promise<void>;
  getShowFPS: () => Promise<boolean>;
  getCurrentFPS: () => Promise<number>;
  getQualityStats: () => Promise<QualityStatsResponse>;

  // Phase 3.5: Haptic Feedback & Boundary Warnings
  setHapticFeedback: (enabled: boolean) => Promise<void>;
  getHapticFeedbackState: () => Promise<boolean>;
  setBoundaryWarnings: (enabled: boolean) => Promise<void>;
  getBoundaryWarningsState: () => Promise<boolean>;
  setBoundaryWarningDistance: (distance: number) => Promise<void>;
  getBoundaryWarningDistance: () => Promise<number>;

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

  const getViewTag = () => {
    const viewTag = findNodeHandle(nativeRef.current);
    return viewTag ?? null;
  };

  useImperativeHandle(ref, () => ({
    addTestObject: () => {
      const viewTag = getViewTag();
      if (viewTag) {
        ExpoARKitModule.addTestObject(viewTag);
      }
    },
    loadModel: (
      path: string,
      scale: number = 1,
      position: [number, number, number] = [0, 0, -1]
    ) => {
      const viewTag = getViewTag();
      if (viewTag) {
        ExpoARKitModule.loadModel(viewTag, path, scale, position);
      }
    },
    placeModelOnTap: (path: string, scale: number = 1) => {
      const viewTag = getViewTag();
      if (viewTag) {
        ExpoARKitModule.placeModelOnTap(viewTag, path, scale);
      }
    },
    removeAllAnchors: () => {
      const viewTag = getViewTag();
      if (viewTag) {
        ExpoARKitModule.removeAllAnchors(viewTag);
      }
    },
    undoLastModel: () => {
      const viewTag = getViewTag();
      if (viewTag) {
        ExpoARKitModule.undoLastModel(viewTag);
      }
    },
    setPlaneVisibility: (visible: boolean) => {
      const viewTag = getViewTag();
      if (viewTag) {
        ExpoARKitModule.setPlaneVisibility(viewTag, visible);
      }
    },

    // Phase 3.1–3.4
    setPortalMode: async (enabled: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setPortalMode(viewTag, enabled);
    },
    getPortalModeState: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return false;
      return await ExpoARKitModule.getPortalModeState(viewTag);
    },
    getMeshClassificationStats: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return {};
      return await ExpoARKitModule.getMeshClassificationStats(viewTag);
    },

    setCollisionDetection: async (enabled: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setCollisionDetection(viewTag, enabled);
    },
    getCollisionDetectionState: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return false;
      return await ExpoARKitModule.getCollisionDetectionState(viewTag);
    },
    setCollisionDebugMode: async (enabled: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setCollisionDebugMode(viewTag, enabled);
    },
    getCollisionStats: async () => {
      const viewTag = getViewTag();
      if (!viewTag) {
        return { enabled: false, debugMode: false, totalCollisions: 0, modelsWithPhysics: 0, meshesWithPhysics: 0 };
      }
      return await ExpoARKitModule.getCollisionStats(viewTag);
    },
    resetCollisionCount: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.resetCollisionCount(viewTag);
    },

    setOcclusionQuality: async (quality: 'low' | 'medium' | 'high') => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setOcclusionQuality(viewTag, quality);
    },
    getOcclusionQuality: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return 'medium';
      return await ExpoARKitModule.getOcclusionQuality(viewTag);
    },
    setOcclusionEnabled: async (enabled: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setOcclusionEnabled(viewTag, enabled);
    },
    getOcclusionEnabled: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return true;
      return await ExpoARKitModule.getOcclusionEnabled(viewTag);
    },
    setShowFPS: async (show: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setShowFPS(viewTag, show);
    },
    getShowFPS: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return false;
      return await ExpoARKitModule.getShowFPS(viewTag);
    },
    getCurrentFPS: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return 0;
      return await ExpoARKitModule.getCurrentFPS(viewTag);
    },
    getQualityStats: async () => {
      const viewTag = getViewTag();
      if (!viewTag) {
        return {
          occlusionQuality: 'medium',
          occlusionEnabled: true,
          showFPS: false,
          currentFPS: 0,
          meshCount: 0,
          modelCount: 0,
          isMeshReconstructionEnabled: false
        };
      }
      return await ExpoARKitModule.getQualityStats(viewTag);
    },

    // Phase 3.5: Haptic Feedback & Boundary Warnings
    setHapticFeedback: async (enabled: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setHapticFeedback(viewTag, enabled);
    },
    getHapticFeedbackState: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return true;
      return await ExpoARKitModule.getHapticFeedbackState(viewTag);
    },
    setBoundaryWarnings: async (enabled: boolean) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setBoundaryWarnings(viewTag, enabled);
    },
    getBoundaryWarningsState: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return true;
      return await ExpoARKitModule.getBoundaryWarningsState(viewTag);
    },
    setBoundaryWarningDistance: async (distance: number) => {
      const viewTag = getViewTag();
      if (!viewTag) return;
      await ExpoARKitModule.setBoundaryWarningDistance(viewTag, distance);
    },
    getBoundaryWarningDistance: async () => {
      const viewTag = getViewTag();
      if (!viewTag) return 0.5;
      return await ExpoARKitModule.getBoundaryWarningDistance(viewTag);
    },

    getModelDimensions: async (modelId: string): Promise<ModelDimensionsResponse> => {
      const viewTag = getViewTag();
      if (viewTag) {
        return await ExpoARKitModule.getModelDimensions(viewTag, modelId);
      }
      return { success: false, error: 'View not found' };
    },
    getAllModelIds: async (): Promise<AllModelIdsResponse> => {
      const viewTag = getViewTag();
      if (viewTag) {
        return await ExpoARKitModule.getAllModelIds(viewTag);
      }
      return { success: false, error: 'View not found' };
    },
    updateModelTransform: async (modelId: string, scale?: number[], rotation?: number[], position?: number[]): Promise<ModelTransformResponse> => {
      const viewTag = getViewTag();
      if (viewTag) {
        return await ExpoARKitModule.updateModelTransform(viewTag, modelId, scale, rotation, position);
      }
      return { success: false, error: 'View not found' };
    },
    setModelScale: async (modelId: string, scale: number[]): Promise<ModelTransformResponse> => {
      const viewTag = getViewTag();
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
