import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, StyleSheet, ViewProps } from 'react-native';

import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';

const NativeARKitView = requireNativeViewManager('ExpoARKit');
const ExpoARKitModule = requireNativeModule('ExpoARKit');

export interface ARKitViewProps extends ViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
  onModelLoaded?: (event: {
    nativeEvent: { success: boolean; message: string; path: string };
  }) => void;
}

export interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: [number, number, number]) => void;
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
    }
  }));

  return (
    <NativeARKitView
      ref={nativeRef}
      style={[styles.container, props.style]}
      onARInitialized={props.onARInitialized}
      onARError={props.onARError}
      onModelLoaded={props.onModelLoaded}
    />
  );
});

ARKitView.displayName = 'ARKitView';

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
