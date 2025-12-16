import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, StyleSheet, ViewProps } from 'react-native';

import { requireNativeViewManager } from 'expo-modules-core';

import { ExpoARKitModule } from './ExpoARKitModule';

const NativeARWallScanningView = requireNativeViewManager('ExpoARKit', 'ARWallScanningView');

// Data types
export interface RealWallData {
  wallId: string;
  normal: [number, number, number];
  center: [number, number, number];
  dimensions: [number, number]; // [width, height]
  anchorId: string;
}

export interface ARSessionStartedEvent {
  started: boolean;
  planeDetection: string;
}

export interface VerticalPlaneDetectedEvent {
  planeId: string;
  width: number;
  height: number;
  area: number;
  totalPlanes: number;
}

export interface ARErrorEvent {
  error: string;
  message: string;
}

// Component props
export interface ARWallScanningViewProps extends ViewProps {
  onARSessionStarted?: (event: { nativeEvent: ARSessionStartedEvent }) => void;
  onVerticalPlaneDetected?: (event: { nativeEvent: VerticalPlaneDetectedEvent }) => void;
  onRealWallSelected?: (event: { nativeEvent: RealWallData }) => void;
  onRealWallDeselected?: (event: { nativeEvent: { deselected: boolean } }) => void;
  onARError?: (event: { nativeEvent: ARErrorEvent }) => void;
}

// Component ref interface
export interface ARWallScanningViewRef {
  startWallScanning: () => Promise<void>;
  stopWallScanning: () => Promise<void>;
  deselectRealWall: () => Promise<void>;
  getSelectedRealWallData: () => Promise<RealWallData | null>;
}

export const ARWallScanningView = forwardRef<ARWallScanningViewRef, ARWallScanningViewProps>(
  (props, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      startWallScanning: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) {
            console.error('❌ viewId is null');
            return;
          }

          console.log('📡 Starting wall scanning with viewId:', viewId);
          await ExpoARKitModule.startWallScanning(viewId);
          console.log('✅ Wall scanning started');
        } catch (error) {
          console.error('❌ Error starting wall scanning:', error);
          throw error;
        }
      },

      stopWallScanning: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) {
            console.error('❌ viewId is null');
            return;
          }

          console.log('⏸ Stopping wall scanning with viewId:', viewId);
          await ExpoARKitModule.stopWallScanning(viewId);
          console.log('✅ Wall scanning stopped');
        } catch (error) {
          console.error('❌ Error stopping wall scanning:', error);
          throw error;
        }
      },

      deselectRealWall: async () => {
        try {
          const viewId = findNodeHandle(nativeRef.current);
          if (viewId === null) {
            console.error('❌ viewId is null');
            return;
          }

          console.log('🔄 Deselecting real wall with viewId:', viewId);
          await ExpoARKitModule.deselectRealWall(viewId);
          console.log('✅ Real wall deselected');
        } catch (error) {
          console.error('❌ Error deselecting real wall:', error);
          throw error;
        }
      },

      getSelectedRealWallData: async (): Promise<RealWallData | null> => {
        try {
          const viewId = findNodeHandle(nativeRef.current);

          if (viewId === null) {
            console.error('❌ viewId is null');
            return null;
          }

          console.log('📊 Getting selected real wall data with viewId:', viewId);
          const wallData = await ExpoARKitModule.getSelectedRealWallData(viewId);
          console.log('✅ Real wall data retrieved:', wallData);
          return wallData as RealWallData | null;
        } catch (error) {
          console.error('❌ Error getting real wall data:', error);
          throw error;
        }
      },
    }));

    return (
      <NativeARWallScanningView
        ref={nativeRef}
        style={[styles.container, props.style]}
        onARSessionStarted={props.onARSessionStarted}
        onVerticalPlaneDetected={props.onVerticalPlaneDetected}
        onRealWallSelected={props.onRealWallSelected}
        onRealWallDeselected={props.onRealWallDeselected}
        onARError={props.onARError}
      />
    );
  }
);

ARWallScanningView.displayName = 'ARWallScanningView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
