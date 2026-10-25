export type Category = 'Traditional' | 'Western' | 'Selfie' | 'Couple';
export type CompositionMode = 'full-body' | 'waist-up' | 'headshot' | 'selfie' | 'couple';
export type Difficulty = 'Easy' | 'Moderate' | 'Advanced';
export type CameraFacing = 'user' | 'environment';

export type LandmarkLike = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type Pose = {
  id: number;
  name: string;
  category: Category;
  difficulty: Difficulty;
  description: string;
  instructions: string[];
  tag: string;
  outfit: string;
  occasion: string;
  composition: CompositionMode;
  type: 'standing' | 'sitting' | 'selfie' | 'couple' | 'walk';
  templateLandmarks?: LandmarkLike[];
};

export type FramingResult = {
  subjectCenter: { x: number; y: number };
  subjectSize: { width: number; height: number };
  headroom: number;
  sideMargins: { left: number; right: number };
  outsideFrame: {
    head: boolean;
    body: boolean;
    knees: boolean;
    ankles: boolean;
    feet: boolean;
  };
  movement: { x: number; y: number };
  message: string;
  ready: boolean;
  confidence: number;
};

export type PoseMatchResult = {
  score: number; // 0 to 100
  isReliable: boolean;
  feedback: string;
  jointDifferences: {
    joint: string;
    differenceAngle: number;
    suggestion: string;
  }[];
};
