import { requireNativeModule } from 'expo-modules-core';

// Define the module interface
interface ExpoARKitModuleType {
  addTestObject(viewTag: number): Promise<void>;
}

// Get the native module
const ExpoARKitModule = requireNativeModule<ExpoARKitModuleType>('ExpoARKit');

export default ExpoARKitModule;