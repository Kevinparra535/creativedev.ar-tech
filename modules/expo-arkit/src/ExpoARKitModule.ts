import { requireNativeModule } from 'expo-modules-core';

// Define the module interface
interface ExpoARKitModuleType {
  addTestObject(viewTag: number): Promise<void>;
  loadModel(viewTag: number, path: string, scale: number, position: number[]): Promise<void>;
  placeModelOnTap(viewTag: number, path: string, scale: number): Promise<void>;
  removeAllAnchors(viewTag: number): Promise<void>;
}

// Get the native module and export it
export const ExpoARKitModule = requireNativeModule<ExpoARKitModuleType>('ExpoARKit');