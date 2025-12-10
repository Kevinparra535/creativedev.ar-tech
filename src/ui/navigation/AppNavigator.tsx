import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ARTestScreen } from '@/ui/screens/ARTestScreen';
import { RoomPlanTestScreen } from '@/ui/screens/RoomPlanTestScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ARTest">
        <Stack.Screen name='ARTest' component={ARTestScreen} options={{ title: 'ARKit Test' }} />
        <Stack.Screen name='Home' component={RoomPlanTestScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}