import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { use3DScene } from '@/ui/ar/hooks/use3DScene';
import { useARSession } from '@/ui/ar/hooks/useARSession';
import { ARCanvas } from '@/ui/ar/components/ARCanvas';
import { MaterialPicker } from '@/ui/ar/components/MaterialPicker';
import { ARControls } from '@/ui/ar/components/ARControls';
import { ARPermissionPrompt } from '@/ui/ar/components/ARPermissionPrompt';

export const ARScreen: React.FC = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { isARActive, hasPermission, startAR, stopAR } = useARSession();
  const { sceneManager, isReady, currentMaterial, changeMaterial } = use3DScene();

  if (!permissionGranted) {
    return (
      <ARPermissionPrompt
        onPermissionGranted={() => setPermissionGranted(true)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ARCanvas sceneManager={sceneManager} isReady={isReady} />
      <ARControls
        isActive={isARActive}
        onStart={startAR}
        onStop={stopAR}
      />
      <MaterialPicker
        currentMaterial={currentMaterial}
        onMaterialChange={changeMaterial}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
