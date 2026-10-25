import { describe, expect, it } from 'vitest';
import { evaluateFraming, type LandmarkLike } from './framing';

const makePerson = (
  centerX = 0.5,
  centerY = 0.5,
  width = 0.18,
  height = 0.55,
  extra: Partial<Record<number, Partial<LandmarkLike>>> = {}
): LandmarkLike[] => {
  const person: LandmarkLike[] = Array.from({ length: 33 }, () => ({
    x: centerX,
    y: centerY,
    visibility: 0.9,
    z: 0,
  }));

  const landmarks: Record<number, [number, number]> = {
    0: [0.5, 0.08],
    1: [0.46, 0.08],
    2: [0.54, 0.08],
    3: [0.42, 0.12],
    4: [0.58, 0.12],
    5: [0.36, 0.18],
    6: [0.64, 0.18],
    7: [0.3, 0.24],
    8: [0.7, 0.24],
    9: [0.28, 0.35],
    10: [0.72, 0.35],
    11: [0.25, 0.42],
    12: [0.75, 0.42],
    13: [0.22, 0.52],
    14: [0.78, 0.52],
    15: [0.18, 0.62],
    16: [0.82, 0.62],
    17: [0.32, 0.7],
    18: [0.68, 0.7],
    19: [0.34, 0.82],
    20: [0.66, 0.82],
    21: [0.38, 0.9],
    22: [0.62, 0.9],
    23: [0.4, 0.96],
    24: [0.6, 0.96],
    25: [0.36, 1.0],
    26: [0.64, 1.0],
    27: [0.38, 1.08],
    28: [0.62, 1.08],
    29: [0.42, 1.12],
    30: [0.58, 1.12],
    31: [0.4, 0.48],
    32: [0.6, 0.48],
  };

  Object.entries(landmarks).forEach(([idx, [x, y]]) => {
    const i = Number(idx);
    person[i] = {
      x: centerX + (x - 0.5) * width,
      y: centerY + (y - 0.5) * height,
      visibility: 0.9,
      z: 0,
    };
  });

  Object.entries(extra).forEach(([idx, value]) => {
    const i = Number(idx);
    person[i] = { ...person[i], ...value };
  });

  return person;
};

describe('evaluateFraming', () => {
  it('returns a centered and ready result when the subject is well framed', () => {
    const result = evaluateFraming({
      landmarks: [makePerson(0.5, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 3,
    });

    expect(result.ready).toBe(true);
    expect(result.message).toContain('ready');
  });

  it('flags a subject that is too small in the frame', () => {
    const result = evaluateFraming({
      landmarks: [makePerson(0.5, 0.5, 0.12, 0.35)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });

    expect(result.message).toMatch(/closer|full body|step back/i);
    expect(result.ready).toBe(false);
  });

  it('detects head cropping and feet cropping', () => {
    const croppedHead = evaluateFraming({
      landmarks: [makePerson(0.5, 0.2, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(croppedHead.message).toMatch(/head|space above/i);

    const croppedFeet = evaluateFraming({
      landmarks: [makePerson(0.5, 0.82, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(croppedFeet.message).toMatch(/feet|outside the frame|step back/i);
  });

  it('points left and right for off-centre subjects', () => {
    const left = evaluateFraming({
      landmarks: [makePerson(0.2, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(left.message).toMatch(/left|right/i);

    const right = evaluateFraming({
      landmarks: [makePerson(0.82, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(right.message).toMatch(/left|right/i);
  });

  it('handles low-confidence and missing person cases safely', () => {
    const lowConfidence = evaluateFraming({
      landmarks: [makePerson(0.5, 0.5, 0.18, 0.5, { 0: { visibility: 0.12 } })],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.2,
      stableFrames: 0,
    });
    expect(lowConfidence.ready).toBe(false);
    expect(lowConfidence.message).toMatch(/insufficient|hold still|not enough/i);

    const missing = evaluateFraming({
      landmarks: [],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0,
      stableFrames: 0,
    });
    expect(missing.message).toMatch(/frame|move into|step into/i);
  });

  it('accounts for mirrored front-camera coordinates and couple spacing', () => {
    const mirrored = evaluateFraming({
      landmarks: [makePerson(0.2, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'selfie',
      cameraFacing: 'user',
      mirrored: true,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(mirrored.message).toMatch(/left|right|centre|center/i);

    const couple = evaluateFraming({
      landmarks: [makePerson(0.35, 0.5, 0.18, 0.5), makePerson(0.78, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'couple',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(couple.message).toMatch(/closer together|couple|move/i);
  });

  it('requires stable consecutive frames before transitioning to ready state', () => {
    // Unstable (stableFrames = 0)
    const unstable = evaluateFraming({
      landmarks: [makePerson(0.5, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(unstable.ready).toBe(false);

    // Stable (stableFrames >= 2)
    const stable = evaluateFraming({
      landmarks: [makePerson(0.5, 0.5, 0.18, 0.5)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 2,
    });
    expect(stable.ready).toBe(true);
  });

  it('handles subject too large in full body framing', () => {
    const tooLarge = evaluateFraming({
      landmarks: [makePerson(0.5, 0.5, 0.4, 0.92)],
      width: 1280,
      height: 720,
      composition: 'full-body',
      cameraFacing: 'environment',
      mirrored: false,
      confidence: 0.9,
      stableFrames: 0,
    });
    expect(tooLarge.ready).toBe(false);
    expect(tooLarge.message).toMatch(/step back|space|feet/i);
  });
});
