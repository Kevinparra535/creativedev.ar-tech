/**
 * RoomPlan JSON parsing utilities
 *
 * Parses Apple's RoomPlan export JSON (Room.json) into wall records
 * that can be used as "virtual walls" for alignment.
 */

import { File } from 'expo-file-system';

import type { WallData } from '../../modules/expo-arkit/src/SceneKitPreviewView';

type RoomPlanWallJson = {
  identifier?: string;
  dimensions?: number[]; // [width, height, 0]
  transform?: number[]; // 16 floats, column-major 4x4
};

type RoomPlanExportJson = {
  version?: number;
  referenceOriginTransform?: number[];
  walls?: RoomPlanWallJson[];
};

function toNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function normalize3(v: [number, number, number]): [number, number, number] | null {
  const [x, y, z] = v;
  const len = Math.hypot(x, y, z);
  if (len < 1e-6) return null;
  return [x / len, y / len, z / len];
}

function toMatrix4x4FromColumnMajorFlat(t: number[]): number[][] {
  // Build a standard 4x4 matrix as row arrays.
  // The source is column-major flattened (translation at indices 12..14).
  return [
    [t[0], t[4], t[8], t[12]],
    [t[1], t[5], t[9], t[13]],
    [t[2], t[6], t[10], t[14]],
    [t[3], t[7], t[11], t[15]]
  ];
}

function wallFromRoomPlanJson(wall: RoomPlanWallJson): WallData | null {
  const id =
    typeof wall.identifier === 'string' && wall.identifier.length > 0 ? wall.identifier : null;
  const dims = Array.isArray(wall.dimensions) ? wall.dimensions : null;
  const transform = Array.isArray(wall.transform) ? wall.transform : null;

  if (!id || !dims || dims.length < 2 || !transform || transform.length !== 16) return null;

  const width = toNumber(dims[0]);
  const height = toNumber(dims[1]);
  if (width == null || height == null) return null;

  // Reject tiny walls (usually noise).
  if (width < 0.15 || height < 0.5) return null;

  // RoomPlan wall transforms appear to be standard Y-up transforms:
  // - X axis: along wall width
  // - Y axis: up
  // - Z axis: wall normal
  const zAxis: [number, number, number] = [transform[8], transform[9], transform[10]];
  const normal = normalize3(zAxis);
  if (!normal) return null;

  const center: [number, number, number] = [transform[12], transform[13], transform[14]];

  return {
    wallId: id,
    normal,
    center,
    dimensions: [width, height],
    transform: toMatrix4x4FromColumnMajorFlat(transform)
  };
}

export async function loadRoomPlanWallsFromJsonUri(jsonUri: string): Promise<{
  version?: number;
  wallCount: number;
  walls: WallData[];
}> {
  const jsonText = await new File(jsonUri).text();
  const parsed = JSON.parse(jsonText) as RoomPlanExportJson;

  const walls = Array.isArray(parsed.walls) ? parsed.walls : [];
  const wallData = walls
    .map(wallFromRoomPlanJson)
    .filter((w): w is WallData => w != null)
    .sort((a, b) => b.dimensions[0] * b.dimensions[1] - a.dimensions[0] * a.dimensions[1]);

  return {
    version: parsed.version,
    wallCount: wallData.length,
    walls: wallData
  };
}
