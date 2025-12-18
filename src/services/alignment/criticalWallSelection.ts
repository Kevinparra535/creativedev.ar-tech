/**
 * Critical Wall Selection Algorithm
 *
 * Selects 2-3 most important walls to validate for accurate alignment.
 * Scoring based on:
 * - Perpendicularity to primary wall (dot product close to 0 or ±1)
 * - Wall area (larger walls are more reliable)
 * - Adjacency to primary wall (connected walls preferred)
 */

import type { ModelWall } from '../types';

export interface WallScore {
  wallIndex: number;
  wall: ModelWall;
  score: number;
  perpendicularityScore: number;
  areaScore: number;
  adjacencyScore: number;
}

/**
 * Calculate dot product between two wall normal vectors
 */
function calculateDotProduct(
  normal1: [number, number, number],
  normal2: [number, number, number]
): number {
  return normal1[0] * normal2[0] + normal1[1] * normal2[1] + normal1[2] * normal2[2];
}

/**
 * Calculate wall area from dimensions
 */
function calculateWallArea(wall: ModelWall): number {
  return wall.dimensions.width * wall.dimensions.height;
}

/**
 * Check if two walls share vertices (are adjacent)
 */
function areWallsAdjacent(wall1: ModelWall, wall2: ModelWall): boolean {
  const threshold = 0.01; // 1cm tolerance for adjacency

  for (const v1 of wall1.vertices) {
    for (const v2 of wall2.vertices) {
      const distance = Math.sqrt(
        Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2) + Math.pow(v1[2] - v2[2], 2)
      );
      if (distance < threshold) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Score a wall based on perpendicularity to primary wall
 * Returns 0.0 (parallel) to 1.0 (perpendicular)
 */
function scorePerpendicularly(wall: ModelWall, primaryWall: ModelWall): number {
  const dotProduct = Math.abs(calculateDotProduct(wall.normal, primaryWall.normal));
  // Dot product of 0 = perpendicular (best), 1 = parallel (worst)
  return 1.0 - dotProduct;
}

/**
 * Score a wall based on its area
 * Normalized to 0.0-1.0 range
 */
function scoreArea(wall: ModelWall, maxArea: number): number {
  const area = calculateWallArea(wall);
  return Math.min(area / maxArea, 1.0);
}

/**
 * Score a wall based on adjacency to primary wall
 * Returns 1.0 if adjacent, 0.0 if not
 */
function scoreAdjacency(wall: ModelWall, primaryWall: ModelWall): number {
  return areWallsAdjacent(wall, primaryWall) ? 1.0 : 0.0;
}

/**
 * Select 2-3 critical walls for validation
 *
 * @param primaryWallIndex - Index of the wall already selected by user
 * @param modelWalls - All walls in the model
 * @param maxCriticalWalls - Maximum number of critical walls to select (default: 3, including primary)
 * @returns Array of critical wall indices (including primary)
 */
export function selectCriticalWalls(
  primaryWallIndex: number,
  modelWalls: ModelWall[],
  maxCriticalWalls: number = 3
): number[] {
  if (modelWalls.length === 0) {
    return [];
  }

  if (primaryWallIndex < 0 || primaryWallIndex >= modelWalls.length) {
    console.error('[selectCriticalWalls] Invalid primaryWallIndex:', primaryWallIndex);
    return [];
  }

  const primaryWall = modelWalls[primaryWallIndex];
  const scores: WallScore[] = [];

  // Calculate max area for normalization
  const maxArea = Math.max(...modelWalls.map(calculateWallArea));

  // Score all walls except the primary
  modelWalls.forEach((wall, index) => {
    if (index === primaryWallIndex) {
      return; // Skip primary wall
    }

    const perpendicularityScore = scorePerpendicularly(wall, primaryWall);
    const areaScore = scoreArea(wall, maxArea);
    const adjacencyScore = scoreAdjacency(wall, primaryWall);

    // Weighted scoring
    // Perpendicularity: 50% (most important for constraint)
    // Area: 30% (larger = more reliable)
    // Adjacency: 20% (connected walls help)
    const totalScore = perpendicularityScore * 0.5 + areaScore * 0.3 + adjacencyScore * 0.2;

    scores.push({
      wallIndex: index,
      wall,
      score: totalScore,
      perpendicularityScore,
      areaScore,
      adjacencyScore
    });
  });

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  // Select top N-1 walls (primary + N-1 = maxCriticalWalls)
  const numToSelect = Math.min(maxCriticalWalls - 1, scores.length);
  const selectedIndices = scores.slice(0, numToSelect).map((s) => s.wallIndex);

  // Always include primary wall first
  const result = [primaryWallIndex, ...selectedIndices];

  console.log('[selectCriticalWalls] Selected critical walls:', {
    primary: primaryWallIndex,
    additional: selectedIndices,
    total: result.length,
    scores: scores.slice(0, numToSelect).map((s) => ({
      index: s.wallIndex,
      score: s.score.toFixed(3),
      perpendicularity: s.perpendicularityScore.toFixed(3),
      area: s.areaScore.toFixed(3),
      adjacency: s.adjacencyScore.toFixed(3)
    }))
  });

  return result;
}

/**
 * Get detailed scoring information for debugging
 */
export function getCriticalWallsWithScores(
  primaryWallIndex: number,
  modelWalls: ModelWall[]
): WallScore[] {
  if (modelWalls.length === 0) {
    return [];
  }

  const primaryWall = modelWalls[primaryWallIndex];
  const scores: WallScore[] = [];
  const maxArea = Math.max(...modelWalls.map(calculateWallArea));

  modelWalls.forEach((wall, index) => {
    if (index === primaryWallIndex) {
      return;
    }

    const perpendicularityScore = scorePerpendicularly(wall, primaryWall);
    const areaScore = scoreArea(wall, maxArea);
    const adjacencyScore = scoreAdjacency(wall, primaryWall);

    const totalScore = perpendicularityScore * 0.5 + areaScore * 0.3 + adjacencyScore * 0.2;

    scores.push({
      wallIndex: index,
      wall,
      score: totalScore,
      perpendicularityScore,
      areaScore,
      adjacencyScore
    });
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}
