import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AlignmentViewScreen } from '@/ui/screens/AlignmentViewScreen';
import { ARTestScreen } from '@/ui/screens/ARTestScreen';
import AutoAlignmentTestScreen from '@/ui/screens/AutoAlignmentTestScreen';
import { GuidedModelSelectScreen } from '@/ui/screens/GuidedModelSelectScreen';
import { GuidedWalkthroughScreen } from '@/ui/screens/GuidedWalkthroughScreen';
import { GuidedWallWalkthroughScreen } from '@/ui/screens/GuidedWallWalkthroughScreen';
import ManualAlignmentScreen from '@/ui/screens/ManualAlignmentScreen';
import { ModelPreviewScreen } from '@/ui/screens/ModelPreviewScreen';
import { RoomPlanTestScreen } from '@/ui/screens/RoomPlanTestScreen';
import { WallScanningScreen } from '@/ui/screens/WallScanningScreen';

import { RootStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen name='Home' component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name='ARTest' component={ARTestScreen} options={{ title: 'AR Test' }} />
        <Stack.Screen name='RoomPlanTestScreen' component={RoomPlanTestScreen} />
        <Stack.Screen
          name='AutoAlignmentTest'
          component={AutoAlignmentTestScreen}
          options={{ title: 'Auto-Alignment Test' }}
        />
        <Stack.Screen
          name='ManualAlignment'
          component={ManualAlignmentScreen}
          options={{ title: 'Manual Alignment' }}
        />
        <Stack.Screen
          name='ModelPreview'
          component={ModelPreviewScreen}
          options={{ title: 'Vista Previa del Modelo' }}
        />
        <Stack.Screen
          name='GuidedModelSelect'
          component={GuidedModelSelectScreen}
          options={{ title: 'Seleccionar Modelo' }}
        />
        <Stack.Screen
          name='GuidedWalkthrough'
          component={GuidedWalkthroughScreen}
          options={{ title: 'Walkthrough Guiado' }}
        />
        <Stack.Screen
          name='GuidedWallWalkthrough'
          component={GuidedWallWalkthroughScreen}
          options={{ title: 'Walkthrough Pared (Guiado)' }}
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
