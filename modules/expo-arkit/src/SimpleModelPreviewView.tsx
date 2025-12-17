import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, StyleSheet, type ViewProps } from 'react-native';

import { requireNativeViewManager } from 'expo-modules-core';

import { ExpoARKitModule } from './ExpoARKitModule';

const NativeSimpleModelPreviewView = requireNativeViewManager('ExpoARKit', 'SimpleModelPreviewView');

export interface SimpleModelLoadedEvent {
  success: boolean;
  path: string;
}

export interface SimpleLoadErrorEvent {
  error: string;
  message: string;
  path?: string;
}

export interface SimpleModelPreviewViewProps extends ViewProps {
  onSimpleModelLoaded?: (event: { nativeEvent: SimpleModelLoadedEvent }) => void;
  onSimpleLoadError?: (event: { nativeEvent: SimpleLoadErrorEvent }) => void;
}

export interface SimpleModelPreviewViewRef {
  loadModel: (path: string) => Promise<void>;
}

export const SimpleModelPreviewView = forwardRef<SimpleModelPreviewViewRef, SimpleModelPreviewViewProps>(
  (props, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      loadModel: async (path: string) => {
        const viewId = findNodeHandle(nativeRef.current);
        if (viewId == null) return;
        await ExpoARKitModule.loadModelForSimplePreview(viewId, path);
      },
    }));

    return (
      <NativeSimpleModelPreviewView
        ref={nativeRef}
        style={[styles.container, props.style]}
        onSimpleModelLoaded={props.onSimpleModelLoaded}
        onSimpleLoadError={props.onSimpleLoadError}
      />
    );
  }
);

SimpleModelPreviewView.displayName = 'SimpleModelPreviewView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
