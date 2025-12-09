import { useEffect, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';

export interface DeviceOrientation {
  alpha: number; // Rotación Z (compass)
  beta: number;  // Rotación X (pitch)
  gamma: number; // Rotación Y (roll)
}

export const useDeviceOrientation = (isActive: boolean) => {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: 0,
    beta: 0,
    gamma: 0
  });

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Configurar frecuencia de actualización (60 FPS)
    DeviceMotion.setUpdateInterval(16);

    const subscription = DeviceMotion.addListener((motionData) => {
      if (motionData.rotation) {
        setOrientation({
          alpha: motionData.rotation.alpha,
          beta: motionData.rotation.beta,
          gamma: motionData.rotation.gamma
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  return orientation;
};
