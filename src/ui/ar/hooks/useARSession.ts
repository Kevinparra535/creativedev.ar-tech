import { useState } from 'react';

export const useARSession = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  const startAR = () => {
    setIsARActive(true);
  };

  const stopAR = () => {
    setIsARActive(false);
  };

  return {
    isARActive,
    hasPermission,
    startAR,
    stopAR,
    setHasPermission
  };
};
