import {
  CameraFacing,
  CompositionMode,
  FramingResult,
  LandmarkLike,
} from '../types/pose';
import { clamp, getPersonBounds } from './geometry';

export type { CameraFacing, CompositionMode, FramingResult, LandmarkLike };

export type FramingInput = {
  landmarks: LandmarkLike[][];
  width: number;
  height: number;
  composition: CompositionMode;
  cameraFacing: CameraFacing;
  mirrored: boolean;
  confidence: number;
  stableFrames: number;
};

const directionalHint = (value: number, mirrored: boolean, facing: CameraFacing): string => {
  const direction = value < 0.5 ? 'left' : 'right';
  const mirroredDirection =
    mirrored && facing === 'user' ? (direction === 'left' ? 'right' : 'left') : direction;
  return `Move slightly to your ${mirroredDirection}.`;
};

const getMessagePriority = (messages: string[], fallback: string): string => {
  if (!messages.length) return fallback;
  return (
    messages.find((message) =>
      /step back|closer|left|right|above|below|feet|head|centre|center|together|good|ready/i.test(
        message
      )
    ) ?? messages[0]
  );
};

export const evaluateFraming = ({
  landmarks,
  composition,
  cameraFacing,
  mirrored,
  confidence,
  stableFrames,
}: FramingInput): FramingResult => {
  const safeConfidence = clamp(confidence, 0, 1);

  if (!landmarks.length) {
    return {
      subjectCenter: { x: 0.5, y: 0.5 },
      subjectSize: { width: 0, height: 0 },
      headroom: 0,
      sideMargins: { left: 0, right: 0 },
      outsideFrame: { head: false, body: false, knees: false, ankles: false, feet: false },
      movement: { x: 0, y: 0 },
      message: 'Step into the frame so I can detect your pose.',
      ready: false,
      confidence: 0,
    };
  }

  const person = landmarks.find((points) =>
    points.some((point) => (point.visibility ?? 1) > 0.2)
  );

  if (!person || safeConfidence < 0.24) {
    return {
      subjectCenter: { x: 0.5, y: 0.5 },
      subjectSize: { width: 0, height: 0 },
      headroom: 0,
      sideMargins: { left: 0, right: 0 },
      outsideFrame: { head: false, body: false, knees: false, ankles: false, feet: false },
      movement: { x: 0, y: 0 },
      message: 'Hold still while I gather enough landmarks to judge the framing.',
      ready: false,
      confidence: safeConfidence,
    };
  }

  const bounds = getPersonBounds(person);
  if (!bounds) {
    return {
      subjectCenter: { x: 0.5, y: 0.5 },
      subjectSize: { width: 0, height: 0 },
      headroom: 0,
      sideMargins: { left: 0, right: 0 },
      outsideFrame: { head: false, body: false, knees: false, ankles: false, feet: false },
      movement: { x: 0, y: 0 },
      message: 'Not enough body landmarks are visible to judge the composition yet.',
      ready: false,
      confidence: safeConfidence,
    };
  }

  const centerX = bounds.centerX;
  const centerY = bounds.centerY;
  const heightRatio = bounds.height;
  const widthRatio = bounds.width;

  const messageCandidates: string[] = [];
  const leftSide = bounds.minX;
  const rightSide = bounds.maxX;
  const topSide = bounds.minY;
  const bottomSide = bounds.maxY;

  // Couple framing check
  if (composition === 'couple' && landmarks.length > 1) {
    const secondPerson = landmarks[1];
    const secondBounds = getPersonBounds(secondPerson);
    if (secondBounds) {
      const spacing = Math.abs(secondBounds.centerX - centerX);
      if (spacing > 0.22) {
        messageCandidates.push('Both of you move slightly closer together.');
      } else if (spacing < 0.05) {
        messageCandidates.push('Spread out slightly so both of you are visible.');
      }
    }
  } else if (composition === 'couple' && landmarks.length === 1) {
    messageCandidates.push('Second person step into the frame.');
  }

  // Horizontal position check
  if (centerX < 0.43) {
    messageCandidates.push(directionalHint(centerX, mirrored, cameraFacing));
  } else if (centerX > 0.57) {
    messageCandidates.push(directionalHint(centerX, mirrored, cameraFacing));
  }

  // Headroom & vertical checks
  if (topSide < 0.12) {
    messageCandidates.push('Keep a little more space above your head.');
  }
  if (bottomSide > 0.9) {
    messageCandidates.push('Your feet are outside the frame. Step back a little.');
  }

  // Size ratio based on composition mode
  if (composition === 'full-body') {
    if (heightRatio < 0.38) {
      messageCandidates.push('Step back a little to fit your full body.');
    } else if (heightRatio > 0.85) {
      messageCandidates.push('Step back slightly so your entire pose fits comfortably.');
    }
  } else if (composition === 'waist-up') {
    if (heightRatio < 0.25) {
      messageCandidates.push('Step closer for a waist-up framing.');
    } else if (heightRatio > 0.7) {
      messageCandidates.push('Step back slightly to leave room around your shoulders.');
    }
  } else if (composition === 'headshot') {
    if (heightRatio < 0.2) {
      messageCandidates.push('Move closer for a balanced headshot.');
    } else if (heightRatio > 0.6) {
      messageCandidates.push('Move slightly back from the camera.');
    }
  } else if (composition === 'selfie') {
    if (centerY < 0.28) {
      messageCandidates.push('Lower your chin a little to keep your face balanced.');
    } else if (centerY > 0.72) {
      messageCandidates.push('Tilt camera slightly down to frame your face.');
    }
  } else {
    if (heightRatio < 0.38) {
      messageCandidates.push('Step back a little to fit your full body.');
    } else if (heightRatio > 0.78) {
      messageCandidates.push('Move slightly closer so your pose fits in frame.');
    }
  }

  if (widthRatio > 0.72 && composition === 'couple') {
    messageCandidates.push('Take a small step back so both of you fit.');
  }

  if (
    Math.abs(centerX - 0.5) < 0.08 &&
    Math.abs(centerY - 0.5) < 0.08 &&
    heightRatio > 0.35 &&
    heightRatio < 0.75 &&
    bottomSide < 0.9 &&
    topSide > 0.12
  ) {
    messageCandidates.push('Framing looks good. You are ready!');
  }

  const ready =
    stableFrames >= 2 &&
    safeConfidence > 0.6 &&
    Math.abs(centerX - 0.5) < 0.12 &&
    topSide > 0.12 &&
    bottomSide < 0.9 &&
    heightRatio > 0.38 &&
    heightRatio < 0.78;

  const priorityMessage = getMessagePriority(
    messageCandidates,
    'Hold still while we check the framing.'
  );
  const finalMessage = ready ? 'Framing looks good. You are ready!' : priorityMessage;

  return {
    subjectCenter: { x: centerX, y: centerY },
    subjectSize: { width: widthRatio, height: heightRatio },
    headroom: clamp(0.5 - topSide, 0, 1),
    sideMargins: { left: clamp(leftSide, 0, 1), right: clamp(1 - rightSide, 0, 1) },
    outsideFrame: {
      head: topSide < 0.08,
      body: leftSide < 0.08 || rightSide > 0.92,
      knees: false,
      ankles: false,
      feet: bottomSide > 0.92,
    },
    movement: { x: clamp((centerX - 0.5) * 2, -1, 1), y: clamp((centerY - 0.5) * 2, -1, 1) },
    message: finalMessage,
    ready,
    confidence: clamp(
      (safeConfidence + (heightRatio > 0.38 && heightRatio < 0.78 ? 0.2 : 0)) * 0.9,
      0,
      1
    ),
  };
};
