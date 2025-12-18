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

  // Placement preview (reticle + confirm)
  startPlacementPreview(viewTag: number, path: string, scale: number): Promise<void>;
  stopPlacementPreview(viewTag: number): Promise<void>;
  confirmPlacement(viewTag: number): Promise<void>;

  // Guided scan + deterministic placement (no tap)
  startScanGuidance(
    viewTag: number,
    path: string,
    scale: number,
    targetWidth: number,
    targetLength: number
  ): Promise<void>;

  startWallScanGuidance(
    viewTag: number,
    path: string,
    scale: number,
    targetWidth: number,
    targetHeight: number,
    depthOffset: number
  ): Promise<void>;
  stopScanGuidance(viewTag: number): Promise<void>;
  confirmGuidedPlacement(viewTag: number): Promise<void>;

  removeAllAnchors(viewTag: number): Promise<void>;
  undoLastModel(viewTag: number): Promise<void>;
  setPlaneVisibility(viewTag: number, visible: boolean): Promise<void>;

  // Portal Mode (Phase 3)
  setPortalMode(viewTag: number, enabled: boolean): Promise<void>;
  getPortalModeState(viewTag: number): Promise<boolean>;
  getMeshClassificationStats(viewTag: number): Promise<Record<string, any>>;

  getModelDimensions(viewTag: number, modelId: string): Promise<ModelDimensionsResponse>;
  getAllModelIds(viewTag: number): Promise<AllModelIdsResponse>;
  updateModelTransform(
    viewTag: number,
    modelId: string,
    scale?: number[],
    rotation?: number[],
    position?: number[]
  ): Promise<ModelTransformResponse>;
  setModelScale(
    viewTag: number,
    modelId: string,
    scale: number[]
  ): Promise<ModelTransformResponse>;
  setModelRotation(
    viewTag: number,
    modelId: string,
    rotation: number[]
  ): Promise<ModelTransformResponse>;
  setModelPosition(
    viewTag: number,
    modelId: string,
    position: number[]
  ): Promise<ModelTransformResponse>;
  getModelTransform(viewTag: number, modelId: string): Promise<ModelTransformData>;

  // SceneKit Preview functions
  loadModelForPreview(viewTag: number, path: string): Promise<void>;
  // Simple Model Preview (minimal, no controls)
  loadModelForSimplePreview(viewTag: number, path: string): Promise<void>;
  markSimplePreviewWallScanned(viewTag: number, wallId: string): Promise<void>;
  markSimplePreviewWallCritical(viewTag: number, wallId: string): Promise<void>;
  getAllSimplePreviewWallIds(viewTag: number): Promise<string[]>;
  resetSimplePreviewCamera(viewTag: number): Promise<void>;
  deselectWall(viewTag: number): Promise<void>;
  getSelectedWallData(viewTag: number): Promise<any>;

  // SceneKit Preview camera controls
  resetPreviewCamera(viewTag: number): Promise<void>;
  fitModelToView(viewTag: number): Promise<void>;
  togglePreviewGrid(viewTag: number): Promise<void>;
  togglePreviewBoundingBox(viewTag: number): Promise<void>;

  // SceneKit Preview preset camera views
  setPreviewCameraViewFront(viewTag: number): Promise<void>;
  setPreviewCameraViewRight(viewTag: number): Promise<void>;
  setPreviewCameraViewTop(viewTag: number): Promise<void>;
  setPreviewCameraViewPerspective(viewTag: number): Promise<void>;

  // ARWallScanningView functions
  startWallScanning(viewTag: number): Promise<void>;
  stopWallScanning(viewTag: number): Promise<void>;
  deselectRealWall(viewTag: number): Promise<void>;
  getSelectedRealWallData(viewTag: number): Promise<any>;

  // Wall Alignment functions
  calculateAlignment(virtualWallData: any, realWallData: any): Promise<AlignmentResultResponse>;
  applyAlignmentTransform(
    viewTag: number,
    modelId: string,
    transformMatrix: number[][]
  ): Promise<ModelTransformResponse>;

  // Alignment debug overlay
  setAlignmentDebug(
    viewTag: number,
    modelId: string,
    enabled: boolean,
    virtualNormal: number[],
    realNormal: number[]
  ): Promise<AlignmentDebugResponse>;

  // Collision Detection (Phase 3.3)
  setCollisionDetection(viewTag: number, enabled: boolean): Promise<void>;
  getCollisionDetectionState(viewTag: number): Promise<boolean>;
  setCollisionDebugMode(viewTag: number, enabled: boolean): Promise<void>;
  getCollisionStats(viewTag: number): Promise<CollisionStatsResponse>;
  resetCollisionCount(viewTag: number): Promise<void>;

  // Quality Settings (Phase 3.4)
  setOcclusionQuality(viewTag: number, quality: 'low' | 'medium' | 'high'): Promise<void>;
  getOcclusionQuality(viewTag: number): Promise<string>;
  setOcclusionEnabled(viewTag: number, enabled: boolean): Promise<void>;
  getOcclusionEnabled(viewTag: number): Promise<boolean>;
  setShowFPS(viewTag: number, show: boolean): Promise<void>;
  getShowFPS(viewTag: number): Promise<boolean>;
  getCurrentFPS(viewTag: number): Promise<number>;
  getQualityStats(viewTag: number): Promise<QualityStatsResponse>;

  // Haptic Feedback & Boundary Warnings (Phase 3.5)
  setHapticFeedback(viewTag: number, enabled: boolean): Promise<void>;
  getHapticFeedbackState(viewTag: number): Promise<boolean>;
  setBoundaryWarnings(viewTag: number, enabled: boolean): Promise<void>;
  getBoundaryWarningsState(viewTag: number): Promise<boolean>;
  setBoundaryWarningDistance(viewTag: number, distance: number): Promise<void>;
  getBoundaryWarningDistance(viewTag: number): Promise<number>;
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

// Collision Detection Types (Phase 3.3)
export interface CollisionStatsResponse {
  enabled: boolean;
  debugMode: boolean;
  totalCollisions: number;
  modelsWithPhysics: number;
  meshesWithPhysics: number;
}

export interface CollisionEvent {
  modelId: string;
  meshType: string;
  contactPoint: Vector3;
  collisionForce: number;
  totalCollisions: number;
}

// Quality Settings Types (Phase 3.4)
export interface QualityStatsResponse {
  occlusionQuality: 'low' | 'medium' | 'high';
  occlusionEnabled: boolean;
  showFPS: boolean;
  currentFPS: number;
  meshCount: number;
  modelCount: number;
  isMeshReconstructionEnabled: boolean;
}

// Haptic Feedback & Boundary Warnings Types (Phase 3.5)
export interface BoundaryWarningEvent {
  distance: number;
  warningThreshold: number;
  meshType: string;
  cameraPosition: Vector3;
}

// Get the native module and export it
export const ExpoARKitModule = requireNativeModule<ExpoARKitModuleType>('ExpoARKit');
