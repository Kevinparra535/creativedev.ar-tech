import { WallData } from '../../../modules/expo-arkit/src/SceneKitPreviewView';
import { RealWallData } from '../../../modules/expo-arkit/src/ARWallScanningView';

export type RootStackParamList = {
  Home: undefined;
  Modal: undefined;
  ARTest: undefined;
  RoomPlanTestScreen: undefined;
  ModelPreview: undefined;
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
