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
}

// Get the native module and export it
export const ExpoARKitModule = requireNativeModule<ExpoARKitModuleType>('ExpoARKit');