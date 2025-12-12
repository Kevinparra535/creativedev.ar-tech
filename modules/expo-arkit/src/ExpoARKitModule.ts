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
}

// Get the native module and export it
export const ExpoARKitModule = requireNativeModule<ExpoARKitModuleType>('ExpoARKit');