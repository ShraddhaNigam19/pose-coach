import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraFacing } from '../types/pose';

type UseCameraOptions = {
  initialFacing?: CameraFacing;
};

export const useCamera = ({ initialFacing = 'environment' }: UseCameraOptions = {}) => {
  const [facing, setFacing] = useState<CameraFacing>(initialFacing);
  const [cameraOn, setCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setIsLoading(false);
  }, []);

  const openCamera = useCallback(
    async (facingMode = facing) => {
      setError(null);
      setIsLoading(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'Camera access requires a secure connection (HTTPS or localhost). Please open this app on a secure host.'
        );
        setIsLoading(false);
        return false;
      }

      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 1920, max: 1920 },
          },
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (strictErr) {
          console.warn('Strict video constraints failed, retrying basic constraints', strictErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode },
          });
        }

        streamRef.current = stream;
        setFacing(facingMode);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraOn(true);
        setIsLoading(false);
        return true;
      } catch (err: unknown) {
        const domErr = err as DOMException;
        console.error('Camera open error:', domErr);
        if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
          setError(
            'Camera permission was denied. Please allow camera access in your browser site settings and reload.'
          );
        } else if (domErr.name === 'NotFoundError' || domErr.name === 'DevicesNotFoundError') {
          setError('No camera device found on this system.');
        } else if (domErr.name === 'NotReadableError' || domErr.name === 'TrackStartError') {
          setError('Camera is in use by another application. Please close other camera apps and retry.');
        } else {
          setError(`Unable to open camera: ${domErr.message || 'Unknown error'}`);
        }
        setCameraOn(false);
        setIsLoading(false);
        return false;
      }
    },
    [facing]
  );

  const switchCamera = useCallback(async () => {
    const nextFacing: CameraFacing = facing === 'user' ? 'environment' : 'user';
    if (cameraOn) {
      stopCamera();
      // Brief timeout to let OS release camera hardware
      setTimeout(() => {
        void openCamera(nextFacing);
      }, 150);
    } else {
      setFacing(nextFacing);
    }
  }, [cameraOn, facing, openCamera, stopCamera]);

  // Cleanup tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    streamRef,
    facing,
    cameraOn,
    isLoading,
    error,
    openCamera,
    stopCamera,
    switchCamera,
  };
};
