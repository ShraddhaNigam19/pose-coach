import { LandmarkLike, PoseMatchResult } from '../types/pose';
import { calculateAngle, clamp } from './geometry';

type JointDef = {
  name: string;
  label: string;
  points: [number, number, number]; // [A, B, C] where B is vertex
  minVisibilityRequired?: number;
  weight: number;
  actionHint: (detectedAngle: number, templateAngle: number) => string;
};

const JOINTS: JointDef[] = [
  {
    name: 'leftElbow',
    label: 'Left arm',
    points: [11, 13, 15],
    weight: 1.2,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Straighten your left arm a bit more' : 'Bend your left elbow slightly',
  },
  {
    name: 'rightElbow',
    label: 'Right arm',
    points: [12, 14, 16],
    weight: 1.2,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Straighten your right arm a bit more' : 'Bend your right elbow slightly',
  },
  {
    name: 'leftShoulder',
    label: 'Left shoulder',
    points: [23, 11, 13],
    weight: 1.0,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Raise your left arm outwards' : 'Bring your left arm closer to your body',
  },
  {
    name: 'rightShoulder',
    label: 'Right shoulder',
    points: [24, 12, 14],
    weight: 1.0,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Raise your right arm outwards' : 'Bring your right arm closer to your body',
  },
  {
    name: 'leftHip',
    label: 'Left hip / stance',
    points: [11, 23, 25],
    weight: 0.8,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Shift weight onto your left hip' : 'Relax your left hip stance',
  },
  {
    name: 'rightHip',
    label: 'Right hip / stance',
    points: [12, 24, 26],
    weight: 0.8,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Shift weight onto your right hip' : 'Relax your right hip stance',
  },
  {
    name: 'leftKnee',
    label: 'Left leg',
    points: [23, 25, 27],
    weight: 0.8,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Straighten your left leg slightly' : 'Bend your left knee slightly',
  },
  {
    name: 'rightKnee',
    label: 'Right leg',
    points: [24, 26, 28],
    weight: 0.8,
    actionHint: (det, tmpl) =>
      det < tmpl ? 'Straighten your right leg slightly' : 'Bend your right knee slightly',
  },
];

export const evaluatePoseSimilarity = (
  detectedLandmarks: LandmarkLike[],
  templateLandmarks?: LandmarkLike[]
): PoseMatchResult => {
  if (!templateLandmarks || templateLandmarks.length < 33 || detectedLandmarks.length < 33) {
    return {
      score: 0,
      isReliable: false,
      feedback: 'Select a pose guide to measure alignment.',
      jointDifferences: [],
    };
  }

  // Check key landmarks visibility (shoulders, elbows, hips)
  const keyPoints = [11, 12, 13, 14, 23, 24];
  const visibleKeyPoints = keyPoints.filter(
    (i) => (detectedLandmarks[i]?.visibility ?? 1) >= 0.35
  );

  if (visibleKeyPoints.length < 4) {
    return {
      score: 0,
      isReliable: false,
      feedback: 'Keep your shoulders and arms in view to match the pose.',
      jointDifferences: [],
    };
  }

  const differences: {
    joint: string;
    differenceAngle: number;
    suggestion: string;
    weight: number;
  }[] = [];

  let totalScoreWeighted = 0;
  let totalWeight = 0;

  for (const joint of JOINTS) {
    const [pA, pB, pC] = joint.points;
    const ptA = detectedLandmarks[pA];
    const ptB = detectedLandmarks[pB];
    const ptC = detectedLandmarks[pC];

    const tmplA = templateLandmarks[pA];
    const tmplB = templateLandmarks[pB];
    const tmplC = templateLandmarks[pC];

    if (!ptA || !ptB || !ptC || !tmplA || !tmplB || !tmplC) continue;

    // Check visibility of vertex and arms
    const minVis = Math.min(
      ptA.visibility ?? 1,
      ptB.visibility ?? 1,
      ptC.visibility ?? 1
    );

    if (minVis < 0.25) continue; // Skip occluded joint

    const detAngle = calculateAngle(ptA, ptB, ptC);
    const tmplAngle = calculateAngle(tmplA, tmplB, tmplC);
    const diff = Math.abs(detAngle - tmplAngle);

    // Score for this joint: 0 diff = 100%, 45+ diff = 0%
    const jointScore = Math.max(0, 100 - (diff / 45) * 100);
    const weight = joint.weight * clamp(minVis, 0.4, 1.0);

    totalScoreWeighted += jointScore * weight;
    totalWeight += weight;

    if (diff > 16) {
      differences.push({
        joint: joint.label,
        differenceAngle: Math.round(diff),
        suggestion: joint.actionHint(detAngle, tmplAngle),
        weight,
      });
    }
  }

  if (totalWeight < 1.5) {
    return {
      score: 0,
      isReliable: false,
      feedback: 'Position yourself to match the reference guide.',
      jointDifferences: [],
    };
  }

  // Sort by angle difference descending
  differences.sort((a, b) => b.differenceAngle - a.differenceAngle);

  const rawScore = Math.round(totalScoreWeighted / totalWeight);
  const score = clamp(rawScore, 10, 98);

  let feedback = 'Pose alignment looks great!';
  if (differences.length > 0) {
    feedback = differences[0].suggestion;
    if (differences.length > 1 && score < 70) {
      feedback += `, and ${differences[1].suggestion.toLowerCase()}`;
    }
  }

  return {
    score,
    isReliable: true,
    feedback,
    jointDifferences: differences.map(({ joint, differenceAngle, suggestion }) => ({
      joint,
      differenceAngle,
      suggestion,
    })),
  };
};
