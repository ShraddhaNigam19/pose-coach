import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Grid,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Timer as TimerIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { CameraFacing, Pose } from '../types/pose';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { PoseOverlay } from './PoseOverlay';
import { CapturePreview } from './CapturePreview';

type CameraStudioProps = {
  activePose: Pose;
  allPoses: Pose[];
  onSelectPose: (pose: Pose) => void;
  onToast: (msg: string) => void;
};

export const CameraStudio: React.FC<CameraStudioProps> = ({
  activePose,
  allPoses,
  onSelectPose,
  onToast,
}) => {
  // Studio preferences
  const [showGuide, setShowGuide] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [opacity, setOpacity] = useState(70);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 5 | 10>(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  // Initial facing based on pose composition
  const initialFacing: CameraFacing = activePose.composition === 'selfie' ? 'user' : 'environment';

  // Hooks
  const {
    videoRef,
    facing,
    cameraOn,
    isLoading: cameraLoading,
    error: cameraError,
    openCamera,
    stopCamera,
    switchCamera,
  } = useCamera({ initialFacing });

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    aiStatus,
    modelError,
    peopleDetected,
    framingResult,
    matchResult,
    retryAi,
  } = usePoseDetection({
    videoRef,
    canvasRef: overlayCanvasRef,
    activePose,
    facing,
    cameraOn,
    showSkeleton,
  });

  // Photo capture logic
  const executeCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraOn || !video.videoWidth) {
      onToast('Start camera first to take a photo.');
      return;
    }

    let canvas = captureCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      captureCanvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle mirrored image for front camera so user gets what they see
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    setCapturedImage(dataUrl);
  }, [cameraOn, facing, onToast, videoRef]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      executeCapture();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, executeCapture]);

  const handleStartCapture = () => {
    if (!cameraOn) {
      onToast('Turn on the camera to capture.');
      return;
    }

    if (timerSeconds === 0) {
      executeCapture();
    } else {
      setCountdown(timerSeconds);
    }
  };

  const cycleTimer = () => {
    setTimerSeconds((prev) => {
      if (prev === 0) return 3;
      if (prev === 3) return 5;
      if (prev === 5) return 10;
      return 0;
    });
  };

  const navigatePose = (direction: -1 | 1) => {
    const currentIndex = allPoses.findIndex((p) => p.id === activePose.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + direction + allPoses.length) % allPoses.length;
    onSelectPose(allPoses[nextIndex]);
  };

  if (capturedImage) {
    return (
      <CapturePreview
        imageUrl={capturedImage}
        onRetake={() => setCapturedImage(null)}
        onToast={onToast}
      />
    );
  }

  const isFramingReady = framingResult?.ready ?? false;
  const framingMessage = framingResult?.message ?? (cameraOn ? 'Analyzing camera frame…' : 'Start camera to get AI guidance');
  const matchScore = matchResult?.isReliable ? matchResult.score : null;

  return (
    <div className="camera-studio-container">
      {/* Top Camera Status & Quick Action Toolbar */}
      <div className="studio-topbar">
        <div className="studio-brand">
          <span className="studio-brand-dot" />
          <span className="studio-brand-name">STUDIO VIEW</span>
        </div>

        <div className="studio-top-actions">
          <button
            type="button"
            className={`tool-icon-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid((v) => !v)}
            aria-label="Toggle composition grid"
            title="Composition Grid"
          >
            <Grid size={17} />
          </button>

          <button
            type="button"
            className={`tool-icon-btn ${showSkeleton ? 'active' : ''}`}
            onClick={() => setShowSkeleton((v) => !v)}
            aria-label="Toggle detected skeleton overlay"
            title="AI Skeleton"
          >
            <Activity size={17} />
          </button>

          <button
            type="button"
            className={`tool-icon-btn ${showGuide ? 'active' : ''}`}
            onClick={() => setShowGuide((v) => !v)}
            aria-label="Toggle pose reference guide"
            title="Reference Guide"
          >
            <Layers size={17} />
          </button>

          <button
            type="button"
            className={`tool-icon-btn ${showControlsDrawer ? 'active' : ''}`}
            onClick={() => setShowControlsDrawer((v) => !v)}
            aria-label="Fine tune overlay settings"
            title="Settings"
          >
            <Sliders size={17} />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Stage */}
      <div className="studio-viewfinder">
        <video
          ref={videoRef}
          className={`viewfinder-video ${cameraOn ? 'active' : ''} ${facing === 'user' ? 'mirrored' : ''}`}
          playsInline
          muted
          autoPlay
        />

        <canvas
          ref={overlayCanvasRef}
          className={`viewfinder-canvas ${cameraOn ? 'active' : ''} ${facing === 'user' ? 'mirrored' : ''}`}
          aria-hidden="true"
        />

        {cameraOn && (
          <PoseOverlay
            pose={activePose}
            opacity={opacity}
            showGuide={showGuide}
            showGrid={showGrid}
          />
        )}

        {/* Camera Off Placeholder */}
        {!cameraOn && (
          <div className="camera-standby-placeholder">
            <div className="standby-icon-box">
              <Camera size={34} />
            </div>
            <h3>Camera is paused</h3>
            <p>Start the camera to begin live AI composition and pose guidance.</p>
            <button
              type="button"
              className="start-camera-cta"
              onClick={() => void openCamera()}
              disabled={cameraLoading}
            >
              {cameraLoading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Connecting camera…</span>
                </>
              ) : (
                <>
                  <Camera size={17} />
                  <span>Start Camera</span>
                </>
              )}
            </button>
            {cameraError && <div className="camera-error-banner">{cameraError}</div>}
          </div>
        )}

        {/* Live AI Status Floating Pill */}
        {cameraOn && (
          <div className="ai-status-pill">
            <span
              className={`status-pulse-dot ${
                aiStatus === 'active'
                  ? isFramingReady
                    ? 'ready'
                    : 'active'
                  : aiStatus === 'error'
                  ? 'error'
                  : 'loading'
              }`}
            />
            <span className="status-text">
              {aiStatus === 'loading'
                ? 'Loading AI model…'
                : aiStatus === 'active'
                ? peopleDetected === 0
                  ? 'Searching for subject'
                  : peopleDetected === 1
                  ? '1 person detected'
                  : `${peopleDetected} people detected`
                : 'AI unavailable'}
            </span>
            {isFramingReady && <span className="ready-tag">READY</span>}
            {aiStatus === 'error' && (
              <button type="button" className="retry-ai-btn" onClick={retryAi}>
                Retry
              </button>
            )}
          </div>
        )}

        {/* Match Percentage Badge */}
        {cameraOn && matchResult?.isReliable && matchScore !== null && (
          <div className="match-score-badge">
            <div className="score-ring">
              <span className="score-number">{matchScore}%</span>
            </div>
            <div className="score-label">
              <span>POSE MATCH</span>
            </div>
          </div>
        )}

        {/* Live Countdown Overlay */}
        {countdown !== null && (
          <div className="countdown-viewfinder-overlay" aria-live="assertive">
            <div className="countdown-number-box">
              <span>{countdown === 0 ? '📸' : countdown}</span>
            </div>
            <span className="countdown-caption">HOLD STILL</span>
            <button
              type="button"
              className="cancel-countdown-btn"
              onClick={() => setCountdown(null)}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Actionable Coach Feedback HUD */}
      {cameraOn && (
        <div className={`coach-feedback-hud ${isFramingReady ? 'ready-state' : ''}`}>
          <div className="hud-primary-message">
            <Sparkles size={16} className="sparkle-icon" />
            <span>{framingMessage}</span>
          </div>

          {matchResult?.isReliable && matchResult.feedback && !isFramingReady && (
            <div className="hud-joint-hint">
              <span>💡 {matchResult.feedback}</span>
            </div>
          )}

          {modelError && <div className="hud-model-error">{modelError}</div>}
        </div>
      )}

      {/* Quick Pose Switcher Ribbon */}
      <div className="pose-switcher-ribbon">
        <button
          type="button"
          className="pose-nav-arrow"
          onClick={() => navigatePose(-1)}
          aria-label="Previous pose"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="pose-ribbon-info">
          <span className="pose-ribbon-category">{activePose.category.toUpperCase()}</span>
          <span className="pose-ribbon-title">{activePose.name}</span>
          <span className="pose-ribbon-composition">{activePose.composition}</span>
        </div>

        <button
          type="button"
          className="pose-nav-arrow"
          onClick={() => navigatePose(1)}
          aria-label="Next pose"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bottom Camera Controls Bar */}
      <div className="studio-controls-bar">
        {/* Switch Camera */}
        <button
          type="button"
          className="camera-sub-control"
          onClick={switchCamera}
          aria-label="Switch camera facing"
          title={`Switch to ${facing === 'user' ? 'rear' : 'front'} camera`}
        >
          <RotateCcw size={18} />
          <span className="control-label">{facing === 'user' ? 'Front' : 'Rear'}</span>
        </button>

        {/* Large Shutter Button */}
        <button
          type="button"
          className="studio-shutter-btn"
          onClick={handleStartCapture}
          aria-label="Capture photograph"
        >
          <div className="shutter-outer-ring">
            <div className={`shutter-inner-core ${isFramingReady ? 'ready' : ''}`} />
          </div>
        </button>

        {/* Timer Control */}
        <button
          type="button"
          className="camera-sub-control"
          onClick={cycleTimer}
          aria-label={`Timer: ${timerSeconds === 0 ? 'Off' : `${timerSeconds} seconds`}`}
          title="Timer"
        >
          <TimerIcon size={18} />
          <span className="control-label">
            {timerSeconds === 0 ? 'Off' : `${timerSeconds}s`}
          </span>
        </button>
      </div>

      {/* Fine-tune Drawer / Modal */}
      {showControlsDrawer && (
        <div className="controls-drawer">
          <div className="drawer-header">
            <h4>Viewfinder Adjustments</h4>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setShowControlsDrawer(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="drawer-slider-row">
            <span className="slider-label">Guide Opacity</span>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="studio-slider"
            />
            <span className="slider-val">{opacity}%</span>
          </div>

          <div className="drawer-toggles-row">
            <button
              type="button"
              className={`toggle-chip ${showGuide ? 'selected' : ''}`}
              onClick={() => setShowGuide((v) => !v)}
            >
              Pose Ghost
            </button>
            <button
              type="button"
              className={`toggle-chip ${showSkeleton ? 'selected' : ''}`}
              onClick={() => setShowSkeleton((v) => !v)}
            >
              AI Skeleton
            </button>
            <button
              type="button"
              className={`toggle-chip ${showGrid ? 'selected' : ''}`}
              onClick={() => setShowGrid((v) => !v)}
            >
              Rule of Thirds
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
