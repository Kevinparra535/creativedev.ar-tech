import { requireNativeModule } from 'expo-modules-core';

// Model Dimensions Types
export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ModelDimensionsResponse {
  success: boolean;
  modelId?: string;
  dimensions?: ModelDimensions;
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

// Define the module interface
interface ExpoARKitModuleType {
  addTestObject(viewTag: number): Promise<void>;
  loadModel(viewTag: number, path: string, scale: number, position: number[]): Promise<void>;
  placeModelOnTap(viewTag: number, path: string, scale: number): Promise<void>;
  removeAllAnchors(viewTag: number): Promise<void>;
  undoLastModel(viewTag: number): Promise<void>;
  setPlaneVisibility(viewTag: number, visible: boolean): Promise<void>;
  getModelDimensions(viewTag: number, modelId: string): Promise<ModelDimensionsResponse>;
  getAllModelIds(viewTag: number): Promise<AllModelIdsResponse>;
  updateModelTransform(viewTag: number, modelId: string, scale?: number[], rotation?: number[], position?: number[]): Promise<ModelTransformResponse>;
  setModelScale(viewTag: number, modelId: string, scale: number[]): Promise<ModelTransformResponse>;
  setModelRotation(viewTag: number, modelId: string, rotation: number[]): Promise<ModelTransformResponse>;
  setModelPosition(viewTag: number, modelId: string, position: number[]): Promise<ModelTransformResponse>;
  getModelTransform(viewTag: number, modelId: string): Promise<ModelTransformData>;

  // SceneKit Preview functions
  loadModelForPreview(viewTag: number, path: string): Promise<void>;
  deselectWall(viewTag: number): Promise<void>;
  getSelectedWallData(viewTag: number): Promise<any>;

  // ARWallScanningView functions
  startWallScanning(viewTag: number): Promise<void>;
  stopWallScanning(viewTag: number): Promise<void>;
  deselectRealWall(viewTag: number): Promise<void>;
  getSelectedRealWallData(viewTag: number): Promise<any>;

  // Wall Alignment functions
  calculateAlignment(virtualWallData: any, realWallData: any): Promise<AlignmentResultResponse>;
  applyAlignmentTransform(viewTag: number, modelId: string, transformMatrix: number[][]): Promise<ModelTransformResponse>;

  // Alignment debug overlay
  setAlignmentDebug(
    viewTag: number,
    modelId: string,
    enabled: boolean,
    virtualNormal: number[],
    realNormal: number[]
  ): Promise<AlignmentDebugResponse>;
}

// Alignment Result Types
export interface AlignmentResultResponse {
  success: boolean;
  transformMatrix?: number[][];
  scale?: number;
  rotation?: number[]; // [x, y, z, w] quaternion
  translation?: number[]; // [x, y, z]
  confidence?: number; // 0.0 - 1.0
  error?: string;
}

export interface AlignmentDebugResponse {
  success: boolean;
  angleDegrees?: number;
  error?: string;
}

// Get the native module and export it
export const ExpoARKitModule = requireNativeModule<ExpoARKitModuleType>('ExpoARKit');