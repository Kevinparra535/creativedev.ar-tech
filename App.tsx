import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from '@/ui/navigation/AppNavigator';

import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Hide splash screen when app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style='auto' />
    </SafeAreaProvider>
  );
}
