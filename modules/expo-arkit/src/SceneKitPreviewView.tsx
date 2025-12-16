import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, StyleSheet, ViewProps } from 'react-native';

import { requireNativeViewManager } from 'expo-modules-core';

import { ExpoARKitModule } from './ExpoARKitModule';

const NativeSceneKitPreviewView = requireNativeViewManager('ExpoARKit', 'SceneKitPreviewView');

// Data types
export interface WallData {
  wallId: string;
  normal: [number, number, number];
  center: [number, number, number];
  dimensions: [number, number]; // [width, height]
  transform: number[][];
}

export interface ModelLoadedEvent {
  success: boolean;
  dimensions: [number, number, number];
  path: string;
}

export interface LoadErrorEvent {
  error: string;
  message: string;
  path?: string;
}

export interface CameraStateEvent {
  distance: number;
  azimuth: number;  // degrees
  elevation: number; // degrees
  minDistance: number;
  maxDistance: number;
}

// Component props
export interface SceneKitPreviewViewProps extends ViewProps {
  onPreviewModelLoaded?: (event: { nativeEvent: ModelLoadedEvent }) => void;
  onPreviewWallSelected?: (event: { nativeEvent: WallData }) => void;
  onPreviewWallDeselected?: (event: { nativeEvent: { deselected: boolean } }) => void;
  onPreviewLoadError?: (event: { nativeEvent: LoadErrorEvent }) => void;
  onPreviewTapFeedback?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onPreviewCameraChanged?: (event: { nativeEvent: CameraStateEvent }) => void;
}

// Component ref interface
export interface SceneKitPreviewViewRef {
  loadModelForPreview: (path: string) => Promise<void>;
  deselectWall: () => Promise<void>;
  getSelectedWallData: () => Promise<WallData | null>;
  resetCamera: () => Promise<void>;
  fitModelToView: () => Promise<void>;
  toggleGrid: () => Promise<void>;
  toggleBoundingBox: () => Promise<void>;
  setCameraViewFront: () => Promise<void>;
  setCameraViewRight: () => Promise<void>;
  setCameraViewTop: () => Promise<void>;
  setCameraViewPerspective: () => Promise<void>;
}

export const SceneKitPreviewView = forwardRef<SceneKitPreviewViewRef, SceneKitPreviewViewProps>(
  (props, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      loadModelForPreview: async (path: string) => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) {
            console.error('❌ viewId is null');
            return;
          }

          console.log('📦 Loading model for preview with viewId:', viewId, 'path:', path);
          await ExpoARKitModule.loadModelForPreview(viewId, path);
          console.log('✅ Model loaded for preview');
        } catch (error) {
          console.error('❌ Error loading model for preview:', error);
          throw error;
        }
      },

      deselectWall: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) {
            console.error('❌ viewId is null');
            return;
          }

          console.log('🔄 Deselecting wall with viewId:', viewId);
          await ExpoARKitModule.deselectWall(viewId);
          console.log('✅ Wall deselected');
        } catch (error) {
          console.error('❌ Error deselecting wall:', error);
          throw error;
        }
      },

      getSelectedWallData: async (): Promise<WallData | null> => {
        try {
          const viewId = findNodeHandle(nativeRef.current);

          if (viewId === null) {
            console.error('❌ viewId is null');
            return null;
          }

          console.log('📊 Getting selected wall data with viewId:', viewId);
          const wallData = await ExpoARKitModule.getSelectedWallData(viewId);
          console.log('✅ Wall data retrieved:', wallData);
          return wallData as WallData | null;
        } catch (error) {
          console.error('❌ Error getting wall data:', error);
          throw error;
        }
      },

      resetCamera: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.resetPreviewCamera(viewId);
        } catch (error) {
          console.error('❌ Error resetting camera:', error);
        }
      },

      fitModelToView: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.fitModelToView(viewId);
        } catch (error) {
          console.error('❌ Error fitting model to view:', error);
        }
      },

      toggleGrid: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.togglePreviewGrid(viewId);
        } catch (error) {
          console.error('❌ Error toggling grid:', error);
        }
      },

      toggleBoundingBox: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.togglePreviewBoundingBox(viewId);
        } catch (error) {
          console.error('❌ Error toggling bounding box:', error);
        }
      },

      setCameraViewFront: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.setPreviewCameraViewFront(viewId);
        } catch (error) {
          console.error('❌ Error setting front view:', error);
        }
      },

      setCameraViewRight: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.setPreviewCameraViewRight(viewId);
        } catch (error) {
          console.error('❌ Error setting right view:', error);
        }
      },

      setCameraViewTop: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.setPreviewCameraViewTop(viewId);
        } catch (error) {
          console.error('❌ Error setting top view:', error);
        }
      },

      setCameraViewPerspective: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) return;
          await ExpoARKitModule.setPreviewCameraViewPerspective(viewId);
        } catch (error) {
          console.error('❌ Error setting perspective view:', error);
        }
      },

    }));

    return (
      <NativeSceneKitPreviewView
        ref={nativeRef}
        style={[styles.container, props.style]}
        onPreviewModelLoaded={props.onPreviewModelLoaded}
        onPreviewWallSelected={props.onPreviewWallSelected}
        onPreviewWallDeselected={props.onPreviewWallDeselected}
        onPreviewLoadError={props.onPreviewLoadError}
        onPreviewTapFeedback={props.onPreviewTapFeedback}
        onPreviewCameraChanged={props.onPreviewCameraChanged}
      />
    );
  }
);

SceneKitPreviewView.displayName = 'SceneKitPreviewView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
