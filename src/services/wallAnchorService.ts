import { ExpoARKitModule, AlignmentResultResponse } from '../../modules/expo-arkit/src/ExpoARKitModule';
import type { WallData } from '../../modules/expo-arkit';
import type { RealWallData } from '../../modules/expo-arkit';

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

  constructor() {
    this.workflow = {
      modelPath: '',
      virtualWall: null,
      realWall: null,
      alignmentResult: null,
      currentStep: 'model_preview',
    };
  }

  /**
   * Initialize a new workflow with a model path
   */
  startWorkflow(modelPath: string): void {
    this.workflow = {
      modelPath,
      virtualWall: null,
      realWall: null,
      alignmentResult: null,
      currentStep: 'model_preview',
    };
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
          dimensions: virtualWall.dimensions,
        },
        {
          id: realWall.wallId,
          normal: realWall.normal,
          center: realWall.center,
          dimensions: realWall.dimensions,
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
      await ExpoARKitModule.applyAlignmentTransform(
        viewTag,
        modelId,
        alignment.transformMatrix
      );

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
    const scale = alignment.scale ?? 1.0;

    if (scale < 0.5 || scale > 2.0) {
      warnings.push(`Escala fuera de rango normal: ${scale.toFixed(2)}x`);
      if (qualityLevel === 'excellent') qualityLevel = 'good';
    }

    if (scale < 0.3 || scale > 3.0) {
      warnings.push('Escala extrema - verifica que las paredes sean correctas');
      qualityLevel = 'poor';
    }

    // Determine overall validity
    const isValid = warnings.length === 0 || confidence >= 0.4;

    return {
      isValid,
      warnings,
      qualityLevel,
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
    this.workflow = {
      modelPath: '',
      virtualWall: null,
      realWall: null,
      alignmentResult: null,
      currentStep: 'model_preview',
    };
  }
}

// Export a singleton instance for easy use across the app
export const wallAnchorService = new WallAnchorService();
