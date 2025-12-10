import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, ViewProps } from 'react-native';

import { NativeModulesProxy, requireNativeViewManager } from 'expo-modules-core';

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
    addTestObject: () => {
      if (nativeRef.current) {
        NativeModulesProxy.ExpoARKit.addTestObject(nativeRef.current);
      }
    }
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
    flex: 1
  }
});
