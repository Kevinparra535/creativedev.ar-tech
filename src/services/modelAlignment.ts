/**
 * Model Alignment Service
 *
 * Provides algorithms for automatic alignment of 3D models:
 * - Dimension matching between room scans and architect models
 * - Auto-scaling calculation
 * - Proportion compatibility checking
 * - Real-world scale validation
 */

import type { ModelDimensions, Vector3 } from '../../modules/expo-arkit/src/ExpoARKitModule';

// Re-export types for convenience
export type { ModelDimensions, Vector3 };

/**
 * Complete alignment configuration with position, rotation, and scale
 */
export interface AlignmentConfig {
  scale: number;
  position: Vector3;
  rotation: Vector3;
  confidence: number; // 0-1, confidence score of the alignment
}

/**
 * Extended model info including dimensions and metadata
 */
export interface ModelInfo {
  modelId: string;
  dimensions: ModelDimensions;
  center: Vector3;
  position: Vector3;
  volume: number;
}

/**
 * Result of scale validation
 */
export interface ScaleValidation {
  valid: boolean;
  warnings: string[];
  suggestions?: string[];
}

// ============================================================================
// DIMENSION MATCHING ALGORITHMS
// ============================================================================

/**
 * Calculate optimal scale factor to match target dimensions
 *
 * Uses weighted average of dimension ratios to find best overall scale.
 * Prioritizes the largest dimension to maintain primary proportions.
 *
 * @param source - Source model dimensions (to be scaled)
 * @param target - Target model dimensions (reference)
 * @returns Optimal scale factor
 */
export function calculateOptimalScale(source: ModelDimensions, target: ModelDimensions): number {
  // Calculate scale factor for each dimension
  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;
  const scaleZ = target.depth / source.depth;

  // Find which dimension is largest in target (most important)
  const maxTargetDim = Math.max(target.width, target.height, target.depth);
  const weights = {
    x: target.width / maxTargetDim,
    y: target.height / maxTargetDim,
    z: target.depth / maxTargetDim
  };

  // Weighted average scale (gives more weight to larger dimensions)
  const weightedScale =
    (scaleX * weights.x + scaleY * weights.y + scaleZ * weights.z) /
    (weights.x + weights.y + weights.z);

  console.log('[Alignment] Scale factors:', {
    scaleX: scaleX.toFixed(3),
    scaleY: scaleY.toFixed(3),
    scaleZ: scaleZ.toFixed(3),
    weighted: weightedScale.toFixed(3),
    weights
  });

  return weightedScale;
}

/**
 * Calculate simple uniform scale (average of all dimensions)
 *
 * Simpler alternative to weighted scale, good for testing.
 *
 * @param source - Source model dimensions
 * @param target - Target model dimensions
 * @returns Simple average scale factor
 */
export function calculateSimpleScale(source: ModelDimensions, target: ModelDimensions): number {
  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;
  const scaleZ = target.depth / source.depth;

  return (scaleX + scaleY + scaleZ) / 3;
}

/**
 * Check if two models have compatible proportions
 *
 * Compares aspect ratios to determine if models have similar shape.
 * Returns confidence score (0-1) where 1 is perfect match.
 *
 * @param source - Source model dimensions
 * @param target - Target model dimensions
 * @returns Confidence score (0-1)
 */
export function checkProportionCompatibility(
  source: ModelDimensions,
  target: ModelDimensions
): number {
  // Calculate aspect ratios for both models
  const sourceRatioXY = source.width / source.height;
  const sourceRatioXZ = source.width / source.depth;
  const sourceRatioYZ = source.height / source.depth;

  const targetRatioXY = target.width / target.height;
  const targetRatioXZ = target.width / target.depth;
  const targetRatioYZ = target.height / target.depth;

  // Calculate similarity for each ratio (1.0 = perfect match, 0.0 = very different)
  const similarityXY =
    1 -
    Math.min(Math.abs(sourceRatioXY - targetRatioXY) / Math.max(sourceRatioXY, targetRatioXY), 1);
  const similarityXZ =
    1 -
    Math.min(Math.abs(sourceRatioXZ - targetRatioXZ) / Math.max(sourceRatioXZ, targetRatioXZ), 1);
  const similarityYZ =
    1 -
    Math.min(Math.abs(sourceRatioYZ - targetRatioYZ) / Math.max(sourceRatioYZ, targetRatioYZ), 1);

  // Average similarity across all ratios
  const confidence = (similarityXY + similarityXZ + similarityYZ) / 3;

  console.log('[Alignment] Proportion compatibility:', {
    sourceRatios: {
      xy: sourceRatioXY.toFixed(2),
      xz: sourceRatioXZ.toFixed(2),
      yz: sourceRatioYZ.toFixed(2)
    },
    targetRatios: {
      xy: targetRatioXY.toFixed(2),
      xz: targetRatioXZ.toFixed(2),
      yz: targetRatioYZ.toFixed(2)
    },
    similarities: {
      xy: (similarityXY * 100).toFixed(1) + '%',
      xz: (similarityXZ * 100).toFixed(1) + '%',
      yz: (similarityYZ * 100).toFixed(1) + '%'
    },
    confidence: (confidence * 100).toFixed(1) + '%'
  });

  return confidence;
}

/**
 * Calculate automatic alignment configuration
 *
 * Main function that combines scale calculation and position alignment.
 * Centers the source model on the target model and applies optimal scale.
 *
 * @param sourceInfo - Source model information
 * @param targetInfo - Target model information (reference)
 * @returns Complete alignment configuration
 */
export function calculateAutoAlignment(
  sourceInfo: ModelInfo,
  targetInfo: ModelInfo
): AlignmentConfig {
  // Calculate optimal scale
  const scale = calculateOptimalScale(sourceInfo.dimensions, targetInfo.dimensions);

  // Calculate position offset to align centers
  // After scaling, the source center will be at: source.center * scale
  // We want it to match target.center, so offset = target - (source * scale)
  const position: Vector3 = {
    x: targetInfo.center.x - sourceInfo.center.x * scale,
    y: targetInfo.center.y - sourceInfo.center.y * scale,
    z: targetInfo.center.z - sourceInfo.center.z * scale
  };

  // For now, no rotation (could be enhanced with PCA or feature matching)
  const rotation: Vector3 = { x: 0, y: 0, z: 0 };

  // Calculate confidence based on proportion compatibility
  const confidence = checkProportionCompatibility(sourceInfo.dimensions, targetInfo.dimensions);

  console.log('[Alignment] Auto-alignment calculated:', {
    scale: scale.toFixed(3),
    position: {
      x: position.x.toFixed(3),
      y: position.y.toFixed(3),
      z: position.z.toFixed(3)
    },
    confidence: (confidence * 100).toFixed(1) + '%'
  });

  return {
    scale,
    position,
    rotation,
    confidence
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that model dimensions are at real-world scale (in meters)
 *
 * Checks if dimensions are reasonable for a room or building interior.
 * Provides warnings and suggestions for unusual dimensions.
 *
 * @param dimensions - Model dimensions to validate
 * @param context - Optional context ("room", "building", "furniture")
 * @returns Validation result with warnings and suggestions
 */
export function validateRealWorldScale(
  dimensions: ModelDimensions,
  context: 'room' | 'building' | 'furniture' | 'auto' = 'auto'
): ScaleValidation {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let valid = true;

  // Determine reasonable ranges based on context
  let minSize: number, maxSize: number, minHeight: number, maxHeight: number;

  if (context === 'auto') {
    // Auto-detect context based on dimensions
    const avgDim = (dimensions.width + dimensions.height + dimensions.depth) / 3;
    if (avgDim < 1.0) {
      context = 'furniture';
    } else if (avgDim > 10.0) {
      context = 'building';
    } else {
      context = 'room';
    }
  }

  switch (context) {
    case 'furniture':
      minSize = 0.1; // 10cm minimum
      maxSize = 5.0; // 5m maximum
      minHeight = 0.1;
      maxHeight = 3.0;
      break;
    case 'building':
      minSize = 5.0; // 5m minimum
      maxSize = 100.0; // 100m maximum
      minHeight = 2.4;
      maxHeight = 50.0;
      break;
    case 'room':
    default:
      minSize = 1.0; // 1m minimum
      maxSize = 20.0; // 20m maximum
      minHeight = 2.0; // 2m minimum ceiling
      maxHeight = 5.0; // 5m maximum ceiling
  }

  // Check width
  if (dimensions.width < minSize) {
    warnings.push(`Width ${dimensions.width.toFixed(2)}m is very small for a ${context}`);
    suggestions.push(`Consider scaling up by ${(minSize / dimensions.width).toFixed(1)}x`);
    valid = false;
  } else if (dimensions.width > maxSize) {
    warnings.push(`Width ${dimensions.width.toFixed(2)}m is very large for a ${context}`);
    suggestions.push(`Consider scaling down by ${(dimensions.width / maxSize).toFixed(1)}x`);
    valid = false;
  }

  // Check height
  if (dimensions.height < minHeight) {
    warnings.push(`Height ${dimensions.height.toFixed(2)}m is very small for a ${context}`);
    if (context === 'room') {
      suggestions.push('Typical ceiling height is 2.4m - 3.0m');
    }
    valid = false;
  } else if (dimensions.height > maxHeight) {
    warnings.push(`Height ${dimensions.height.toFixed(2)}m is very tall for a ${context}`);
    valid = false;
  }

  // Check depth
  if (dimensions.depth < minSize) {
    warnings.push(`Depth ${dimensions.depth.toFixed(2)}m is very small for a ${context}`);
    suggestions.push(`Consider scaling up by ${(minSize / dimensions.depth).toFixed(1)}x`);
    valid = false;
  } else if (dimensions.depth > maxSize) {
    warnings.push(`Depth ${dimensions.depth.toFixed(2)}m is very large for a ${context}`);
    suggestions.push(`Consider scaling down by ${(dimensions.depth / maxSize).toFixed(1)}x`);
    valid = false;
  }

  // Additional checks for rooms
  if (context === 'room') {
    // Check aspect ratios (room shouldn't be too narrow or elongated)
    const maxAspect = Math.max(
      dimensions.width / dimensions.depth,
      dimensions.depth / dimensions.width
    );

    if (maxAspect > 5.0) {
      warnings.push(`Room has unusual proportions (${maxAspect.toFixed(1)}:1 aspect ratio)`);
      suggestions.push('Verify model is correct scale and orientation');
    }

    // Check ceiling height relative to floor area
    const floorArea = dimensions.width * dimensions.depth;
    const heightRatio = dimensions.height / Math.sqrt(floorArea);

    if (heightRatio < 0.3) {
      warnings.push('Ceiling height seems low relative to floor area');
    } else if (heightRatio > 1.5) {
      warnings.push('Ceiling height seems very high relative to floor area');
    }
  }

  if (valid) {
    console.log(`✅ Model dimensions valid for ${context}:`, {
      width: `${dimensions.width.toFixed(2)}m`,
      height: `${dimensions.height.toFixed(2)}m`,
      depth: `${dimensions.depth.toFixed(2)}m`
    });
  } else {
    console.warn(`⚠️ Model dimensions may need adjustment (${context}):`, {
      dimensions,
      warnings,
      suggestions
    });
  }

  return { valid, warnings, suggestions };
}

/**
 * Compare two dimension sets and calculate difference percentage
 *
 * @param dimensions1 - First model dimensions
 * @param dimensions2 - Second model dimensions
 * @returns Percentage difference for each dimension
 */
export function compareDimensions(
  dimensions1: ModelDimensions,
  dimensions2: ModelDimensions
): { width: number; height: number; depth: number; average: number } {
  const widthDiff = Math.abs(dimensions1.width - dimensions2.width) / dimensions2.width;
  const heightDiff = Math.abs(dimensions1.height - dimensions2.height) / dimensions2.height;
  const depthDiff = Math.abs(dimensions1.depth - dimensions2.depth) / dimensions2.depth;

  const average = (widthDiff + heightDiff + depthDiff) / 3;

  return {
    width: widthDiff * 100,
    height: heightDiff * 100,
    depth: depthDiff * 100,
    average: average * 100
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Apply scale transformation to dimensions
 *
 * @param dimensions - Original dimensions
 * @param scale - Scale factor to apply
 * @returns Scaled dimensions
 */
export function applyScaleToDimensions(
  dimensions: ModelDimensions,
  scale: number
): ModelDimensions {
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    depth: dimensions.depth * scale
  };
}

/**
 * Format dimensions as human-readable string
 *
 * @param dimensions - Dimensions to format
 * @param precision - Decimal places (default: 2)
 * @returns Formatted string (e.g., "3.50m x 2.40m x 4.20m")
 */
export function formatDimensions(dimensions: ModelDimensions, precision: number = 2): string {
  return `${dimensions.width.toFixed(precision)}m x ${dimensions.height.toFixed(precision)}m x ${dimensions.depth.toFixed(precision)}m`;
}

/**
 * Calculate volume from dimensions
 *
 * @param dimensions - Model dimensions
 * @returns Volume in cubic meters
 */
export function calculateVolume(dimensions: ModelDimensions): number {
  return dimensions.width * dimensions.height * dimensions.depth;
}

/**
 * Get confidence level as string
 *
 * @param confidence - Confidence score (0-1)
 * @returns Human-readable confidence level
 */
export function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.9) return 'Excellent';
  if (confidence >= 0.75) return 'Good';
  if (confidence >= 0.6) return 'Fair';
  if (confidence >= 0.4) return 'Poor';
  return 'Very Poor';
}

/**
 * Suggest scaling adjustment based on validation
 *
 * @param validation - Scale validation result
 * @param currentDimensions - Current model dimensions
 * @returns Suggested scale factor (1.0 = no change)
 */
export function suggestScaleAdjustment(
  validation: ScaleValidation,
  currentDimensions: ModelDimensions
): number {
  if (validation.valid) return 1.0;

  // Look for scale suggestion in suggestions array
  for (const suggestion of validation.suggestions || []) {
    const match = suggestion.match(/scaling (up|down) by ([\d.]+)x/);
    if (match) {
      const direction = match[1];
      const factor = parseFloat(match[2]);
      return direction === 'up' ? factor : 1 / factor;
    }
  }

  // Fallback: suggest bringing to reasonable room size if too small/large
  const avgDim =
    (currentDimensions.width + currentDimensions.height + currentDimensions.depth) / 3;

  if (avgDim < 1.0) {
    // Too small, scale up
    return 3.0 / avgDim; // Target ~3m average
  } else if (avgDim > 10.0) {
    // Too large, scale down
    return 3.0 / avgDim;
  }

  return 1.0;
}
