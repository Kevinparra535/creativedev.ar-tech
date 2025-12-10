import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { requireNativeViewManager } from 'expo-modules-core';
import { ViewProps, StyleSheet, findNodeHandle } from 'react-native';
import ExpoARKitModule from './ExpoARKitModule';

const NativeARKitView = requireNativeViewManager('ExpoARKit');

export interface ARKitViewProps extends ViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
}

export interface ARKitViewRef {
  addTestObject: () => void;
}

export const ARKitView = forwardRef<ARKitViewRef, ARKitViewProps>((props, ref) => {
  const nativeRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    addTestObject: async () => {
      try {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId !== null) {
          await ExpoARKitModule.addTestObject(viewId);
        }
      } catch (error) {
        console.error('Error adding test object:', error);
      }
    },
  }));

  return (
    <NativeARKitView
      ref={nativeRef}
      style={[styles.container, props.style]}
      onARInitialized={props.onARInitialized}
      onARError={props.onARError}
    />
  );
});

ARKitView.displayName = 'ARKitView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
