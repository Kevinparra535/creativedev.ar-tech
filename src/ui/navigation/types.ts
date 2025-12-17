import type { AlignmentResultResponse, RealWallData, WallData } from 'expo-arkit';

export type RootStackParamList = {
  Home: undefined;
  Modal: undefined;
  ARTest: undefined;
  RoomPlanTestScreen: undefined;
  FloatingModelTest: { modelPath?: string } | undefined;
  AutoAlignmentTest: undefined;
  ManualAlignment: undefined;
  ModelPreview: undefined;
  GuidedModelSelect: { mode?: 'floor' | 'wall' } | undefined;
  GuidedWalkthrough: {
    modelPath: string;
    modelDimensions: [number, number, number];
  };
  GuidedWallWalkthrough: {
    modelPath: string;
    modelDimensions: [number, number, number];
  };
  WallScanning: {
    virtualWallData: WallData;
    modelPath: string;
  };
  AlignmentView: {
    modelPath: string;
    virtualWall: WallData;
    realWall: RealWallData;
  };
  ImmersiveView: {
    modelPath: string;
    modelId: string;
    alignment: AlignmentResultResponse;
    virtualWall: WallData;
    realWall: RealWallData;
  };
};

export type TabParamList = {
  Explore: undefined;
};
