import { RealWallData } from '../../../modules/expo-arkit/src/ARWallScanningView';
import { WallData } from '../../../modules/expo-arkit/src/SceneKitPreviewView';

export type RootStackParamList = {
  Home: undefined;
  Modal: undefined;
  ARTest: undefined;
  RoomPlanTestScreen: undefined;
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
};

export type TabParamList = {
  Explore: undefined;
};
