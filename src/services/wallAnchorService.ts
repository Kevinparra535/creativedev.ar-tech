import {
  type AlignmentResultResponse,
  ExpoARKitModule,
  type RealWallData,
  type WallData
} from '../../modules/expo-arkit';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeXZ(v: [number, number, number]): { x: number; z: number } | null {
  const x = v[0];
  const z = v[2];
  const len = Math.hypot(x, z);
  if (len < 1e-6) return null;
  return { x: x / len, z: z / len };
}

// Signed angle that rotates v -> r in XZ plane.
function yawFromToXZ(v: { x: number; z: number }, r: { x: number; z: number }): number {
  const dot = clamp(v.x * r.x + v.z * r.z, -1, 1);
  const det = v.x * r.z - v.z * r.x;
  return Math.atan2(det, dot);
}

function averageAngles(angles: number[]): number {
  const s = angles.reduce((acc, a) => acc + Math.sin(a), 0);
  const c = angles.reduce((acc, a) => acc + Math.cos(a), 0);
  if (Math.abs(s) < 1e-6 && Math.abs(c) < 1e-6) return 0;
  return Math.atan2(s, c);
}

function rotateY(vec: [number, number, number], yaw: number): [number, number, number] {
  const [x, y, z] = vec;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [c * x + s * z, y, -s * x + c * z];
}

// Column-major 4x4 (matches simd_float4x4 columns in native code).
function buildTransformMatrix(params: {
  yaw: number;
  scale: number;
  translation: [number, number, number];
}): number[][] {
  const { yaw, scale, translation } = params;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  const [tx, ty, tz] = translation;
  return [
    [scale * c, 0, scale * -s, 0],
    [0, scale, 0, 0],
    [scale * s, 0, scale * c, 0],
    [tx, ty, tz, 1]
  ];
}

function quaternionFromYaw(yaw: number): number[] {
  const half = yaw / 2;
  return [0, Math.sin(half), 0, Math.cos(half)];
}

function wallArea(dimensions: [number, number]): number {
  return Math.max(0.001, dimensions[0] * dimensions[1]);
}

function safeRatio(numerator: number, denominator: number): number {
  if (Math.abs(denominator) < 1e-6) return 1;
  return numerator / denominator;
}

/**
 * Workflow state for the wall anchor system
 * Tracks the entire flow from model preview to final alignment
 */
export interface WallAnchorWorkflow {
  modelPath: string;
  virtualWall: WallData | null;
  realWall: RealWallData | null;
  alignmentResult: AlignmentResultResponse | null;
  currentStep: 'model_preview' | 'wall_scanning' | 'alignment' | 'complete';
}

/**
 * Validation result for alignment quality
 */
export interface AlignmentValidation {
  isValid: boolean;
  warnings: string[];
  qualityLevel: 'excellent' | 'good' | 'acceptable' | 'poor';
}

/**
 * Service for managing the wall-based anchor alignment workflow
 *
 * This service orchestrates the entire process of:
 * 1. Loading and previewing a 3D model
 * 2. Selecting a virtual wall from the model
 * 3. Scanning and selecting a corresponding real wall
 * 4. Calculating the alignment transformation
 * 5. Applying the transformation to anchor the model in AR
 */
export class WallAnchorService {
  private workflow: WallAnchorWorkflow;

  private createEmptyWorkflow(modelPath: string): WallAnchorWorkflow {
    return {
      modelPath,
      virtualWall: null,
      realWall: null,
      alignmentResult: null,
      currentStep: 'model_preview'
    };
  }

  constructor() {
    this.workflow = this.createEmptyWorkflow('');
  }

  /**
   * Initialize a new workflow with a model path
   */
  startWorkflow(modelPath: string): void {
    this.workflow = this.createEmptyWorkflow(modelPath);
  }

  /**
   * Set the selected virtual wall and move to wall scanning step
   */
  setVirtualWall(wallData: WallData): void {
    this.workflow.virtualWall = wallData;
    this.workflow.currentStep = 'wall_scanning';
  }

  /**
   * Set the selected real wall and move to alignment step
   */
  setRealWall(wallData: RealWallData): void {
    this.workflow.realWall = wallData;
    this.workflow.currentStep = 'alignment';
  }

  /**
   * Calculate alignment between virtual and real walls
   * Uses the native alignment engine via ExpoARKitModule
   */
  async calculateAlignment(
    virtualWall: WallData,
    realWall: RealWallData
  ): Promise<AlignmentResultResponse> {
    console.log('🔧 Calculating alignment...');
    console.log('Virtual wall:', virtualWall);
    console.log('Real wall:', realWall);

    try {
      // Call native module to calculate alignment
      const result = await ExpoARKitModule.calculateAlignment(
        {
          id: virtualWall.wallId,
          normal: virtualWall.normal,
          center: virtualWall.center,
          dimensions: virtualWall.dimensions
        },
        {
          id: realWall.wallId,
          normal: realWall.normal,
          center: realWall.center,
          dimensions: realWall.dimensions
        }
      );

      console.log('✅ Alignment calculated:', result);

      // Store result in workflow
      this.workflow.alignmentResult = result;

      return result;
    } catch (error) {
      console.error('❌ Error calculating alignment:', error);
      throw error;
    }
  }

  /**
   * Calculate alignment using two virtual walls and two real walls.
   *
   * This is a JS-side solver that computes a yaw-only rotation, uniform scale, and translation
   * that best aligns both wall normals and centers.
   */
  calculateAlignmentTwoWalls(params: {
    virtualWall1: WallData;
    virtualWall2: WallData;
    realWall1: RealWallData;
    realWall2: RealWallData;
    flipVirtualNormals?: boolean;
  }): AlignmentResultResponse {
    const { virtualWall1, virtualWall2, realWall1, realWall2, flipVirtualNormals } = params;

    const solve = (flip: boolean): AlignmentResultResponse => {
      const v1n: [number, number, number] = flip
        ? ([-virtualWall1.normal[0], -virtualWall1.normal[1], -virtualWall1.normal[2]] as [
            number,
            number,
            number
          ])
        : virtualWall1.normal;
      const v2n: [number, number, number] = flip
        ? ([-virtualWall2.normal[0], -virtualWall2.normal[1], -virtualWall2.normal[2]] as [
            number,
            number,
            number
          ])
        : virtualWall2.normal;

      const v1 = normalizeXZ(v1n);
      const v2 = normalizeXZ(v2n);
      const r1 = normalizeXZ(realWall1.normal);
      const r2 = normalizeXZ(realWall2.normal);
      if (!v1 || !v2 || !r1 || !r2) {
        return { success: false, error: 'Normales inválidas para resolver yaw (XZ)' };
      }

      const yaw1 = yawFromToXZ(v1, r1);
      const yaw2 = yawFromToXZ(v2, r2);
      const yaw = averageAngles([yaw1, yaw2]);

      const scale1 = safeRatio(realWall1.dimensions[0], virtualWall1.dimensions[0]);
      const scale2 = safeRatio(realWall2.dimensions[0], virtualWall2.dimensions[0]);
      const scale = (scale1 + scale2) / 2;

      const v1cScaled: [number, number, number] = [
        virtualWall1.center[0] * scale,
        virtualWall1.center[1] * scale,
        virtualWall1.center[2] * scale
      ];
      const v2cScaled: [number, number, number] = [
        virtualWall2.center[0] * scale,
        virtualWall2.center[1] * scale,
        virtualWall2.center[2] * scale
      ];

      const v1cWorld = rotateY(v1cScaled, yaw);
      const v2cWorld = rotateY(v2cScaled, yaw);

      const t1: [number, number, number] = [
        realWall1.center[0] - v1cWorld[0],
        realWall1.center[1] - v1cWorld[1],
        realWall1.center[2] - v1cWorld[2]
      ];
      const t2: [number, number, number] = [
        realWall2.center[0] - v2cWorld[0],
        realWall2.center[1] - v2cWorld[1],
        realWall2.center[2] - v2cWorld[2]
      ];

      const w1 = wallArea(realWall1.dimensions);
      const w2 = wallArea(realWall2.dimensions);
      const translation: [number, number, number] = [
        (t1[0] * w1 + t2[0] * w2) / (w1 + w2),
        (t1[1] * w1 + t2[1] * w2) / (w1 + w2),
        (t1[2] * w1 + t2[2] * w2) / (w1 + w2)
      ];

      // Compute fit error for confidence.
      const v1After = rotateY(v1n, yaw);
      const v2After = rotateY(v2n, yaw);
      const v1AfterXZ = normalizeXZ(v1After);
      const v2AfterXZ = normalizeXZ(v2After);
      const r1XZ = normalizeXZ(realWall1.normal);
      const r2XZ = normalizeXZ(realWall2.normal);

      let avgErr = 0;
      if (v1AfterXZ && v2AfterXZ && r1XZ && r2XZ) {
        const err1 = Math.acos(clamp(v1AfterXZ.x * r1XZ.x + v1AfterXZ.z * r1XZ.z, -1, 1));
        const err2 = Math.acos(clamp(v2AfterXZ.x * r2XZ.x + v2AfterXZ.z * r2XZ.z, -1, 1));
        avgErr = (err1 + err2) / 2;
      }

      const baseConfidence = clamp(1 - avgErr / (Math.PI / 4), 0, 1); // 45° -> 0
      const scalePenalty = scale < 0.3 || scale > 3 ? 0.4 : scale < 0.5 || scale > 2 ? 0.2 : 0;
      const confidence = clamp(baseConfidence - scalePenalty, 0, 1);

      return {
        success: true,
        transformMatrix: buildTransformMatrix({ yaw, scale, translation }),
        scale,
        rotation: quaternionFromYaw(yaw),
        translation: [...translation],
        confidence
      };
    };

    if (typeof flipVirtualNormals === 'boolean') {
      return solve(flipVirtualNormals);
    }

    const normalSolve = solve(false);
    const flippedSolve = solve(true);
    if (!normalSolve.success) return flippedSolve;
    if (!flippedSolve.success) return normalSolve;
    return (flippedSolve.confidence ?? 0) > (normalSolve.confidence ?? 0)
      ? flippedSolve
      : normalSolve;
  }

  /**
   * Apply the calculated alignment transformation to a model in AR
   */
  async applyAlignment(
    viewTag: number,
    modelId: string,
    alignment: AlignmentResultResponse
  ): Promise<void> {
    if (!alignment.transformMatrix) {
      throw new Error('Alignment result does not contain a transform matrix');
    }

    console.log('🎯 Applying alignment transform to model:', modelId);

    try {
      await ExpoARKitModule.applyAlignmentTransform(viewTag, modelId, alignment.transformMatrix);

      console.log('✅ Alignment applied successfully');
      this.workflow.currentStep = 'complete';
    } catch (error) {
      console.error('❌ Error applying alignment:', error);
      throw error;
    }
  }

  /**
   * Validate the quality of the alignment result
   * Returns validation with warnings and quality assessment
   */
  validateAlignment(alignment: AlignmentResultResponse): AlignmentValidation {
    const warnings: string[] = [];
    let qualityLevel: AlignmentValidation['qualityLevel'] = 'excellent';

    // Check confidence score
    const confidence = alignment.confidence ?? 0;

    if (confidence < 0.4) {
      warnings.push('Confianza muy baja en la alineación');
      qualityLevel = 'poor';
    } else if (confidence < 0.6) {
      warnings.push('Confianza moderada - considera ajustes manuales');
      qualityLevel = 'acceptable';
    } else if (confidence < 0.7) {
      qualityLevel = 'good';
    }

    // Check scale reasonableness
    const scale = alignment.scale ?? 1;

    if (scale < 0.5 || scale > 2) {
      warnings.push(`Escala fuera de rango normal: ${scale.toFixed(2)}x`);
      if (qualityLevel === 'excellent') qualityLevel = 'good';
    }

    if (scale < 0.3 || scale > 3) {
      warnings.push('Escala extrema - verifica que las paredes sean correctas');
      qualityLevel = 'poor';
    }

    // Determine overall validity
    const isValid = warnings.length === 0 || confidence >= 0.4;

    return {
      isValid,
      warnings,
      qualityLevel
    };
  }

  /**
   * Get a human-readable description of the alignment quality
   */
  getQualityDescription(validation: AlignmentValidation): string {
    switch (validation.qualityLevel) {
      case 'excellent':
        return 'Excelente alineación';
      case 'good':
        return 'Buena alineación';
      case 'acceptable':
        return 'Alineación aceptable - ajusta si es necesario';
      case 'poor':
        return 'Alineación pobre - considera seleccionar otra pared';
    }
  }

  /**
   * Get a color code for the quality level (for UI)
   */
  getQualityColor(validation: AlignmentValidation): string {
    switch (validation.qualityLevel) {
      case 'excellent':
        return '#34C759'; // Green
      case 'good':
        return '#30D158'; // Light green
      case 'acceptable':
        return '#FFD60A'; // Yellow
      case 'poor':
        return '#FF453A'; // Red
    }
  }

  /**
   * Get the current workflow state
   */
  getWorkflow(): WallAnchorWorkflow {
    return { ...this.workflow };
  }

  /**
   * Reset the workflow to start fresh
   */
  reset(): void {
    this.workflow = this.createEmptyWorkflow('');
  }
}

// Export a singleton instance for easy use across the app
export const wallAnchorService = new WallAnchorService();
