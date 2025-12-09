import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ARScreen } from '@/ui/screens/ARScreen';
import { HomeScreen } from '@/ui/screens/HomeScreen';

import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Tab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='home-outline' size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name='AR'
        component={ARScreen}
        options={{
          title: 'AR View',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='cube-outline' size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
}
