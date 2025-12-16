import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ARTestScreen } from '@/ui/screens/ARTestScreen';
import { ModelPreviewScreen } from '@/ui/screens/ModelPreviewScreen';
import { RoomPlanTestScreen } from '@/ui/screens/RoomPlanTestScreen';
import { WallScanningScreen } from '@/ui/screens/WallScanningScreen';
import { AlignmentViewScreen } from '@/ui/screens/AlignmentViewScreen';

import { RootStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen name='Home' component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name='ARTest' component={ARTestScreen} options={{ title: 'ARKit Test' }} />
        <Stack.Screen name='RoomPlanTestScreen' component={RoomPlanTestScreen} />
        <Stack.Screen
          name='ModelPreview'
          component={ModelPreviewScreen}
          options={{ title: 'Vista Previa del Modelo' }}
        />
        <Stack.Screen
          name='WallScanning'
          component={WallScanningScreen}
          options={{ title: 'Escanear Pared' }}
        />
        <Stack.Screen
          name='AlignmentView'
          component={AlignmentViewScreen}
          options={{ title: 'Alineación AR' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
