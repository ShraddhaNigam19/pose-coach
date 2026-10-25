import { LandmarkLike } from '../types/pose';

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const distance2D = (a: LandmarkLike, b: LandmarkLike): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates the angle in degrees at vertex B formed by line segments BA and BC.
 * Returns angle between 0 and 180 degrees.
 */
export const calculateAngle = (a: LandmarkLike, b: LandmarkLike, c: LandmarkLike): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
};

export type BoundingBox = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export const getPersonBounds = (landmarks: LandmarkLike[], minVisibility = 0.2): BoundingBox | null => {
  const visible = landmarks.filter((point) => (point.visibility ?? 1) > minVisibility);
  if (!visible.length) return null;

  const xs = visible.map((point) => point.x);
  const ys = visible.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

/**
 * Normalizes landmarks so that:
 * 1. Midpoint of hips (or shoulders if hips missing) is at (0, 0).
 * 2. Coordinates are scaled by torso length (distance between shoulder midpoint and hip midpoint).
 * This makes the pose scale- and translation-invariant.
 */
export const normalizePoseLandmarks = (landmarks: LandmarkLike[]): LandmarkLike[] => {
  if (landmarks.length < 33) return landmarks;

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // Anchor point: Midpoint of hips or shoulders
  const anchorX = (leftHip.x + rightHip.x) / 2;
  const anchorY = (leftHip.y + rightHip.y) / 2;

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

  const torsoLength = distance2D(
    { x: anchorX, y: anchorY },
    { x: shoulderMidX, y: shoulderMidY }
  ) || 0.25; // fallback scale

  return landmarks.map((pt) => ({
    x: (pt.x - anchorX) / torsoLength,
    y: (pt.y - anchorY) / torsoLength,
    z: pt.z !== undefined ? pt.z / torsoLength : undefined,
    visibility: pt.visibility,
  }));
};
