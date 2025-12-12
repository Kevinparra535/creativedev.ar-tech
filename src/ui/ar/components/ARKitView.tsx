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

export interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: [number, number, number]) => void;
  placeModelOnTap: (path: string, scale?: number) => void;
  removeAllAnchors: () => void;
  undoLastModel: () => void;
  setPlaneVisibility: (visible: boolean) => void;
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
