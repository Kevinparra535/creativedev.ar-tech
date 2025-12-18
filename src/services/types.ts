/**
 * Shared types for services
 */

/**
 * Represents a wall from a 3D model
 * Compatible with WallData from expo-arkit
 */
export interface ModelWall {
  /** Unique identifier for the wall */
  id: string;

  /** Normal vector (outward facing direction) */
  normal: [number, number, number];

  /** Center position in 3D space */
  center: [number, number, number];

  /** Wall dimensions (width, height) */
  dimensions: {
    width: number;
    height: number;
  };

  /** Corner vertices of the wall */
  vertices: [number, number, number][];
}

/**
 * Wall pair for alignment calculation
 * Associates a model wall with its corresponding real-world wall
 */
export interface WallPair {
  modelWall: ModelWall;
  realWallId: string;
  confidence: number;
}

/**
 * Progress information for multi-wall validation
 */
export interface ValidationProgress {
  totalWalls: number;
  validatedWalls: number;
  currentPhase: 'scanning' | 'validating' | 'complete';
  qualityScore: number; // 0.0 - 1.0
}
