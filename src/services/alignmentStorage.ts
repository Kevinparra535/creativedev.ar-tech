import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_MANUAL_ALIGNMENT_KEY = '@alignment:last_manual_transform:v1';
const LAST_AUTO_ALIGNMENT_KEY = '@alignment:last_auto_transform:v1';

export interface AlignmentVector3 {
  x: number;
  y: number;
  z: number;
}

export interface AlignmentTransform {
  position: AlignmentVector3;
  rotation: AlignmentVector3;
  scale: number;
}

export interface LastManualAlignmentPayload {
  transformation: AlignmentTransform;
  modelId?: string;
  updatedAt: number;
}

export interface LastAutoAlignmentPayload {
  transformation: AlignmentTransform;
  modelId?: string;
  sourceModelId?: string;
  targetModelId?: string;
  updatedAt: number;
}

export const alignmentStorage = {
  async loadLastManualAlignment(): Promise<LastManualAlignmentPayload | null> {
    try {
      const raw = await AsyncStorage.getItem(LAST_MANUAL_ALIGNMENT_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as LastManualAlignmentPayload;

      if (!parsed?.transformation || typeof parsed.updatedAt !== 'number') {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  async saveLastManualAlignment(payload: Omit<LastManualAlignmentPayload, 'updatedAt'>) {
    const data: LastManualAlignmentPayload = {
      ...payload,
      updatedAt: Date.now()
    };

    await AsyncStorage.setItem(LAST_MANUAL_ALIGNMENT_KEY, JSON.stringify(data));
  },

  async clearLastManualAlignment() {
    await AsyncStorage.removeItem(LAST_MANUAL_ALIGNMENT_KEY);
  },

  async loadLastAutoAlignment(): Promise<LastAutoAlignmentPayload | null> {
    try {
      const raw = await AsyncStorage.getItem(LAST_AUTO_ALIGNMENT_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as LastAutoAlignmentPayload;

      if (!parsed?.transformation || typeof parsed.updatedAt !== 'number') {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  async saveLastAutoAlignment(payload: Omit<LastAutoAlignmentPayload, 'updatedAt'>) {
    const data: LastAutoAlignmentPayload = {
      ...payload,
      updatedAt: Date.now()
    };

    await AsyncStorage.setItem(LAST_AUTO_ALIGNMENT_KEY, JSON.stringify(data));
  },

  async clearLastAutoAlignment() {
    await AsyncStorage.removeItem(LAST_AUTO_ALIGNMENT_KEY);
  }
};
