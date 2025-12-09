import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ARCanvas } from '@/ui/ar/components/ARCanvas';
import { ARControls } from '@/ui/ar/components/ARControls';
import { ARPermissionPrompt } from '@/ui/ar/components/ARPermissionPrompt';
import { MaterialPicker } from '@/ui/ar/components/MaterialPicker';
import { use3DScene } from '@/ui/ar/hooks/use3DScene';
import { useARSession } from '@/ui/ar/hooks/useARSession';

export const ARScreen: React.FC = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { isARActive, hasPermission, startAR, stopAR } = useARSession();
  const { sceneManager, isReady, currentMaterial, changeMaterial } = use3DScene();

  if (!permissionGranted) {
    return <ARPermissionPrompt onPermissionGranted={() => setPermissionGranted(true)} />;
  }

  return (
    <View style={styles.container}>
      <ARCanvas sceneManager={sceneManager} isReady={isReady} isARMode={isARActive} />
      <ARControls isActive={isARActive} onStart={startAR} onStop={stopAR} />
      <MaterialPicker currentMaterial={currentMaterial} onMaterialChange={changeMaterial} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  }
});
