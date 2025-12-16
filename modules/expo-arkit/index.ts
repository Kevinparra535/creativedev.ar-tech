// Export module
export { ExpoARKitModule } from './src/ExpoARKitModule';

// Export ARKit view
export { ARKitView } from './src/ARKitView';
export type { ARKitViewProps, ARKitViewRef, ModelPlacedEvent, PlaneData } from './src/ARKitView';

// Export SceneKit Preview view
export { SceneKitPreviewView } from './src/SceneKitPreviewView';
export type {
  SceneKitPreviewViewProps,
  SceneKitPreviewViewRef,
  WallData,
  ModelLoadedEvent,
  LoadErrorEvent,
} from './src/SceneKitPreviewView';

// Export AR Wall Scanning view
export { ARWallScanningView } from './src/ARWallScanningView';
export type {
  ARWallScanningViewProps,
  ARWallScanningViewRef,
  RealWallData,
  ARSessionStartedEvent,
  VerticalPlaneDetectedEvent,
  ARErrorEvent,
} from './src/ARWallScanningView';

// Export types from module
export type {
  ModelDimensions,
  Vector3,
  ModelDimensionsResponse,
  AllModelIdsResponse,
  ModelTransformResponse,
  ModelTransformData,
  AlignmentResultResponse,
} from './src/ExpoARKitModule';
