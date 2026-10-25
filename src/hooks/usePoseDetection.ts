import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { CameraFacing, FramingResult, LandmarkLike, Pose, PoseMatchResult } from '../types/pose';
import { evaluateFraming } from '../utils/framing';
import { evaluatePoseSimilarity } from '../utils/poseSimilarity';

const MODEL_ASSET_PATH = '/models/pose_landmarker_lite.task';
const WASM_BASE_PATH = '/mediapipe/wasm';

type UsePoseDetectionOptions = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activePose: Pose;
  facing: CameraFacing;
  cameraOn: boolean;
  showSkeleton?: boolean;
};

export const usePoseDetection = ({
  videoRef,
  canvasRef,
  activePose,
  facing,
  cameraOn,
  showSkeleton = true,
}: UsePoseDetectionOptions) => {
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [modelError, setModelError] = useState<string | null>(null);
  const [peopleDetected, setPeopleDetected] = useState(0);
  const [framingResult, setFramingResult] = useState<FramingResult | null>(null);
  const [matchResult, setMatchResult] = useState<PoseMatchResult | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastInferenceRef = useRef(0);
  const stableFramesRef = useRef(0);

  // Keep references to current props for the RAF loop without restarting it
  const activePoseRef = useRef(activePose);
  activePoseRef.current = activePose;
  const facingRef = useRef(facing);
  facingRef.current = facing;
  const showSkeletonRef = useRef(showSkeleton);
  showSkeletonRef.current = showSkeleton;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  const drawSkeleton = useCallback(
    (landmarksList: LandmarkLike[][], width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      if (!showSkeletonRef.current) return;

      const connections = PoseLandmarker.POSE_CONNECTIONS as Array<{ start: number; end: number }>;

      landmarksList.forEach((landmarks, personIndex) => {
        // Person 1: Violet/lavender glow, Person 2: Rose/amber
        const strokeColor = personIndex === 0 ? 'rgba(192, 132, 252, 0.85)' : 'rgba(251, 146, 60, 0.85)';
        const jointColor = personIndex === 0 ? '#e9d5ff' : '#fed7aa';

        ctx.lineWidth = Math.max(2.5, width / 320);
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = jointColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw connections
        for (const { start, end } of connections) {
          const a = landmarks[start];
          const b = landmarks[end];
          if (!a || !b) continue;
          if ((a.visibility ?? 1) < 0.25 || (b.visibility ?? 1) < 0.25) continue;

          ctx.beginPath();
          ctx.moveTo(a.x * width, a.y * height);
          ctx.lineTo(b.x * width, b.y * height);
          ctx.stroke();
        }

        // Draw joint points
        for (const pt of landmarks) {
          if ((pt.visibility ?? 1) < 0.3) continue;
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, Math.max(3, width / 160), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    [canvasRef]
  );

  const initModel = useCallback(async () => {
    if (landmarkerRef.current) {
      setAiStatus('active');
      setModelError(null);
      return landmarkerRef.current;
    }

    try {
      setAiStatus('loading');
      setModelError(null);

      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
      const model = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
        },
        runningMode: 'VIDEO',
        numPoses: 2,
        minPoseDetectionConfidence: 0.35,
        minPosePresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      });

      landmarkerRef.current = model;
      setAiStatus('active');
      setModelError(null);
      return model;
    } catch (err) {
      console.error('Failed to load MediaPipe Pose Landmarker:', err);
      setAiStatus('error');
      setModelError('Failed to load on-device AI pose model. Check browser WebAssembly support.');
      throw err;
    }
  }, []);

  // Inference loop
  useEffect(() => {
    if (!cameraOn) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      clearCanvas();
      setFramingResult(null);
      setMatchResult(null);
      setPeopleDetected(0);
      return;
    }

    let isMounted = true;

    const startDetection = async () => {
      let model: PoseLandmarker;
      try {
        model = await initModel();
      } catch {
        return;
      }

      const loop = (timestamp: number) => {
        if (!isMounted) return;

        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        // Throttle inference: run every ~65ms (~15 FPS) for optimal battery and UI responsiveness
        if (timestamp - lastInferenceRef.current > 65) {
          lastInferenceRef.current = timestamp;

          try {
            const result: PoseLandmarkerResult = model.detectForVideo(video, timestamp);
            const visiblePoses = result.landmarks.filter((person) =>
              person.some((pt) => (pt.visibility ?? 1) > 0.2)
            );

            setPeopleDetected(visiblePoses.length);

            if (visiblePoses.length > 0) {
              drawSkeleton(visiblePoses, video.videoWidth, video.videoHeight);

              // Framing evaluation
              const comp = activePoseRef.current.composition;
              const framing = evaluateFraming({
                landmarks: visiblePoses,
                width: video.videoWidth,
                height: video.videoHeight,
                composition: comp,
                cameraFacing: facingRef.current,
                mirrored: facingRef.current === 'user',
                confidence: 0.85,
                stableFrames: stableFramesRef.current,
              });

              stableFramesRef.current = framing.ready
                ? Math.min(stableFramesRef.current + 1, 5)
                : 0;
              setFramingResult(framing);

              // Pose matching evaluation against the primary person
              const match = evaluatePoseSimilarity(
                visiblePoses[0],
                activePoseRef.current.templateLandmarks
              );
              setMatchResult(match);
            } else {
              clearCanvas();
              setFramingResult({
                subjectCenter: { x: 0.5, y: 0.5 },
                subjectSize: { width: 0, height: 0 },
                headroom: 0,
                sideMargins: { left: 0, right: 0 },
                outsideFrame: { head: false, body: false, knees: false, ankles: false, feet: false },
                movement: { x: 0, y: 0 },
                message: 'Step into the camera frame so I can guide your pose.',
                ready: false,
                confidence: 0,
              });
              setMatchResult(null);
            }
          } catch (inferErr) {
            console.error('Frame inference error:', inferErr);
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    void startDetection();

    return () => {
      isMounted = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      clearCanvas();
    };
  }, [cameraOn, clearCanvas, drawSkeleton, initModel, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // ignore
        }
        landmarkerRef.current = null;
      }
    };
  }, []);

  const retryAi = useCallback(async () => {
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch {
        // ignore
      }
      landmarkerRef.current = null;
    }
    setAiStatus('idle');
    setModelError(null);
    await initModel();
  }, [initModel]);

  return {
    aiStatus,
    modelError,
    peopleDetected,
    framingResult,
    matchResult,
    retryAi,
  };
};
