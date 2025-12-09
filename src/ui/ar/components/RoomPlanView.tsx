import { requireNativeComponent, StyleProp, ViewStyle } from 'react-native';

interface RoomPlanViewProps {
  style?: StyleProp<ViewStyle>;
}

export const RoomPlanView = requireNativeComponent<RoomPlanViewProps>('RoomPlanView');
