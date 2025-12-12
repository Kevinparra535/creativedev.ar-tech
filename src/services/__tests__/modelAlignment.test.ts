/**
 * Model Alignment Service - Test Examples
 *
 * These examples demonstrate how to use the alignment algorithms.
 * Run these tests to verify the algorithms work correctly.
 */

import {
  calculateOptimalScale,
  calculateSimpleScale,
  checkProportionCompatibility,
  calculateAutoAlignment,
  validateRealWorldScale,
  compareDimensions,
  applyScaleToDimensions,
  formatDimensions,
  getConfidenceLevel,
  suggestScaleAdjustment,
  type ModelDimensions,
  type ModelInfo
} from '../modelAlignment';

// ============================================================================
// TEST DATA
// ============================================================================

// Typical room scan (3.5m x 2.4m x 4.2m)
const roomScanDimensions: ModelDimensions = {
  width: 3.5,
  height: 2.4,
  depth: 4.2
};

// Architect model at correct scale
const architectModelCorrectScale: ModelDimensions = {
  width: 3.6, // Slightly different (design vs actual)
  height: 2.5,
  depth: 4.1
};

// Architect model at wrong scale (10x too large)
const architectModelWrongScale: ModelDimensions = {
  width: 35.0,
  height: 24.0,
  depth: 41.0
};

// Furniture model (table)
const furnitureDimensions: ModelDimensions = {
  width: 1.2,
  height: 0.75,
  depth: 2.0
};

// ============================================================================
// TEST CASES
// ============================================================================

console.log('===== MODEL ALIGNMENT SERVICE TESTS =====\n');

// Test 1: Optimal Scale Calculation
console.log('TEST 1: Calculate Optimal Scale');
console.log('--------------------------------');
const scale1 = calculateOptimalScale(architectModelCorrectScale, roomScanDimensions);
console.log(`✅ Scale factor: ${scale1.toFixed(3)} (should be ~0.97)\n`);

// Test 2: Scale Calculation for Wrong Scale Model
console.log('TEST 2: Calculate Scale for Oversized Model');
console.log('--------------------------------------------');
const scale2 = calculateOptimalScale(architectModelWrongScale, roomScanDimensions);
console.log(`✅ Scale factor: ${scale2.toFixed(3)} (should be ~0.1)\n`);

// Test 3: Proportion Compatibility - Good Match
console.log('TEST 3: Proportion Compatibility - Good Match');
console.log('----------------------------------------------');
const confidence1 = checkProportionCompatibility(architectModelCorrectScale, roomScanDimensions);
console.log(`✅ Confidence: ${(confidence1 * 100).toFixed(1)}% (${getConfidenceLevel(confidence1)})\n`);

// Test 4: Proportion Compatibility - Poor Match
console.log('TEST 4: Proportion Compatibility - Poor Match (Furniture vs Room)');
console.log('------------------------------------------------------------------');
const confidence2 = checkProportionCompatibility(furnitureDimensions, roomScanDimensions);
console.log(`✅ Confidence: ${(confidence2 * 100).toFixed(1)}% (${getConfidenceLevel(confidence2)})\n`);

// Test 5: Real-World Scale Validation - Valid Room
console.log('TEST 5: Validate Real-World Scale - Valid Room');
console.log('-----------------------------------------------');
const validation1 = validateRealWorldScale(roomScanDimensions, 'room');
console.log(`✅ Valid: ${validation1.valid}`);
console.log(`   Dimensions: ${formatDimensions(roomScanDimensions)}\n`);

// Test 6: Real-World Scale Validation - Oversized Model
console.log('TEST 6: Validate Real-World Scale - Oversized Model');
console.log('----------------------------------------------------');
const validation2 = validateRealWorldScale(architectModelWrongScale, 'room');
console.log(`✅ Valid: ${validation2.valid}`);
console.log(`   Warnings: ${validation2.warnings.join(', ')}`);
console.log(`   Suggestions: ${validation2.suggestions?.join(', ')}`);
const suggestedScale = suggestScaleAdjustment(validation2, architectModelWrongScale);
console.log(`   Suggested scale: ${suggestedScale.toFixed(3)}x\n`);

// Test 7: Auto-Alignment Full Test
console.log('TEST 7: Full Auto-Alignment Calculation');
console.log('----------------------------------------');
const sourceInfo: ModelInfo = {
  modelId: 'architect-model-uuid',
  dimensions: architectModelWrongScale,
  center: { x: 0, y: 1.2, z: 0 },
  position: { x: 0, y: 0, z: -2 },
  volume: 35.0 * 24.0 * 41.0
};

const targetInfo: ModelInfo = {
  modelId: 'room-scan-uuid',
  dimensions: roomScanDimensions,
  center: { x: 0, y: 1.2, z: 0 },
  position: { x: 0, y: 0, z: 0 },
  volume: 3.5 * 2.4 * 4.2
};

const alignment = calculateAutoAlignment(sourceInfo, targetInfo);
console.log('✅ Alignment Result:');
console.log(`   Scale: ${alignment.scale.toFixed(3)}x`);
console.log(`   Position: (${alignment.position.x.toFixed(2)}, ${alignment.position.y.toFixed(2)}, ${alignment.position.z.toFixed(2)})`);
console.log(`   Rotation: (${alignment.rotation.x.toFixed(2)}, ${alignment.rotation.y.toFixed(2)}, ${alignment.rotation.z.toFixed(2)})`);
console.log(`   Confidence: ${(alignment.confidence * 100).toFixed(1)}% (${getConfidenceLevel(alignment.confidence)})\n`);

// Test 8: Dimension Comparison
console.log('TEST 8: Compare Dimensions');
console.log('--------------------------');
const comparison = compareDimensions(architectModelCorrectScale, roomScanDimensions);
console.log('✅ Dimension Differences:');
console.log(`   Width: ${comparison.width.toFixed(1)}%`);
console.log(`   Height: ${comparison.height.toFixed(1)}%`);
console.log(`   Depth: ${comparison.depth.toFixed(1)}%`);
console.log(`   Average: ${comparison.average.toFixed(1)}%\n`);

// Test 9: Apply Scale Transformation
console.log('TEST 9: Apply Scale Transformation');
console.log('-----------------------------------');
const scaledDimensions = applyScaleToDimensions(architectModelWrongScale, scale2);
console.log(`✅ Original: ${formatDimensions(architectModelWrongScale)}`);
console.log(`   Scaled: ${formatDimensions(scaledDimensions)}`);
console.log(`   Target: ${formatDimensions(roomScanDimensions)}\n`);

// Test 10: Auto-detect Context
console.log('TEST 10: Auto-detect Model Context');
console.log('-----------------------------------');
const furnitureValidation = validateRealWorldScale(furnitureDimensions, 'auto');
console.log(`✅ Furniture dimensions: ${formatDimensions(furnitureDimensions)}`);
console.log(`   Auto-detected as furniture: ${!furnitureValidation.warnings.some(w => w.includes('small'))}\n`);

console.log('===== ALL TESTS COMPLETED =====\n');

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

export const USAGE_EXAMPLES = `
USAGE EXAMPLES:
===============

1. Basic Auto-Alignment:
------------------------
import { calculateAutoAlignment } from '@/services/modelAlignment';

const alignment = calculateAutoAlignment(sourceModelInfo, targetModelInfo);
console.log('Apply scale:', alignment.scale);
console.log('Move to position:', alignment.position);
console.log('Confidence:', alignment.confidence);

2. Validate Model Scale:
------------------------
import { validateRealWorldScale } from '@/services/modelAlignment';

const validation = validateRealWorldScale(modelDimensions, 'room');
if (!validation.valid) {
  console.warn('Scale issues:', validation.warnings);
  console.log('Suggestions:', validation.suggestions);
}

3. Check Compatibility:
----------------------
import { checkProportionCompatibility } from '@/services/modelAlignment';

const confidence = checkProportionCompatibility(model1, model2);
if (confidence < 0.6) {
  alert('Warning: Models have very different proportions!');
}

4. Compare Two Models:
---------------------
import { compareDimensions } from '@/services/modelAlignment';

const diff = compareDimensions(scannedRoom, architectModel);
console.log(\`Models differ by \${diff.average.toFixed(1)}% on average\`);
`;

console.log(USAGE_EXAMPLES);
