import { describe, expect, it } from 'vitest';
import { LandmarkLike } from '../types/pose';
import { evaluatePoseSimilarity } from './poseSimilarity';
import { calculateAngle, distance2D, normalizePoseLandmarks } from './geometry';

const createLandmarks = (anglesOverride: Record<number, [number, number]> = {}): LandmarkLike[] => {
  const baseLandmarks: Record<number, [number, number]> = {
    0: [0.5, 0.12],
    11: [0.43, 0.23], // left shoulder
    12: [0.57, 0.23], // right shoulder
    13: [0.4, 0.38], // left elbow
    14: [0.6, 0.38], // right elbow
    15: [0.38, 0.52], // left wrist
    16: [0.62, 0.52], // right wrist
    23: [0.46, 0.52], // left hip
    24: [0.54, 0.52], // right hip
    25: [0.45, 0.72], // left knee
    26: [0.55, 0.72], // right knee
    27: [0.44, 0.9], // left ankle
    28: [0.56, 0.9], // right ankle
  };

  const list: LandmarkLike[] = [];
  for (let i = 0; i < 33; i++) {
    const coords = anglesOverride[i] ?? baseLandmarks[i] ?? [0.5, 0.5];
    list.push({
      x: coords[0],
      y: coords[1],
      z: 0,
      visibility: 0.95,
    });
  }
  return list;
};

describe('geometry utilities', () => {
  it('calculates 90-degree and 180-degree angles correctly', () => {
    // Right angle at (0, 0)
    const a = { x: 0, y: 1 };
    const b = { x: 0, y: 0 };
    const c = { x: 1, y: 0 };
    expect(calculateAngle(a, b, c)).toBeCloseTo(90, 1);

    // Straight line
    const p1 = { x: -1, y: 0 };
    const p2 = { x: 0, y: 0 };
    const p3 = { x: 1, y: 0 };
    expect(calculateAngle(p1, p2, p3)).toBeCloseTo(180, 1);
  });

  it('normalizes pose coordinates with scale and translation invariance', () => {
    const poseA = createLandmarks();
    // Shifted and scaled version of the same pose
    const poseB: LandmarkLike[] = poseA.map((pt) => ({
      x: pt.x * 1.5 + 0.2,
      y: pt.y * 1.5 + 0.1,
      visibility: pt.visibility,
    }));

    const normA = normalizePoseLandmarks(poseA);
    const normB = normalizePoseLandmarks(poseB);

    // After normalization, relative coordinates should match
    expect(normA[11].x).toBeCloseTo(normB[11].x, 2);
    expect(normA[11].y).toBeCloseTo(normB[11].y, 2);
  });
});

describe('evaluatePoseSimilarity', () => {
  it('gives a high match score when detected pose matches the template', () => {
    const template = createLandmarks();
    const detected = createLandmarks();

    const result = evaluatePoseSimilarity(detected, template);
    expect(result.isReliable).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.feedback).toMatch(/great|good|spot on/i);
  });

  it('detects arm angle discrepancy and suggests actionable correction', () => {
    const template = createLandmarks();
    // Move left wrist way up and bent (raise left arm)
    const detected = createLandmarks({
      13: [0.35, 0.24],
      15: [0.32, 0.12],
    });

    const result = evaluatePoseSimilarity(detected, template);
    expect(result.isReliable).toBe(true);
    expect(result.score).toBeLessThan(85);
    expect(result.feedback).toMatch(/left arm|elbow|closer|straighten/i);
    expect(result.jointDifferences.length).toBeGreaterThan(0);
  });

  it('flags unreliability when key upper body joints are occluded or invisible', () => {
    const template = createLandmarks();
    const occluded = createLandmarks().map((pt, i) => {
      // Hide all arms and shoulders
      if ([11, 12, 13, 14, 15, 16].includes(i)) {
        return { ...pt, visibility: 0.1 };
      }
      return pt;
    });

    const result = evaluatePoseSimilarity(occluded, template);
    expect(result.isReliable).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toMatch(/shoulders|arms|view/i);
  });

  it('handles missing template safely', () => {
    const detected = createLandmarks();
    const result = evaluatePoseSimilarity(detected, undefined);
    expect(result.isReliable).toBe(false);
    expect(result.score).toBe(0);
  });
});
