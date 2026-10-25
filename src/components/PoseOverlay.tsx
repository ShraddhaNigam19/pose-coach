import React from 'react';
import { Pose } from '../types/pose';
import { ReferenceArtwork } from './ReferenceArtwork';

type PoseOverlayProps = {
  pose: Pose;
  opacity: number;
  showGuide: boolean;
  showGrid: boolean;
};

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  pose,
  opacity,
  showGuide,
  showGrid,
}) => {
  return (
    <>
      {/* Rule of thirds grid lines */}
      {showGrid && (
        <div className="gridlines" aria-hidden="true">
          <div className="gridline-v left" />
          <div className="gridline-v right" />
          <div className="gridline-h top" />
          <div className="gridline-h bottom" />
        </div>
      )}

      {/* Reference Pose Guide */}
      {showGuide && (
        <div
          className="pose-guide-container"
          style={{ opacity: opacity / 100 }}
          aria-hidden="true"
        >
          {/* Studio viewfinder corner brackets */}
          <div className="viewfinder-corners">
            <span className="corner top-left" />
            <span className="corner top-right" />
            <span className="corner bottom-left" />
            <span className="corner bottom-right" />
          </div>

          <div className="guide-artwork-wrapper">
            <ReferenceArtwork pose={pose} className="guide-figure" />
          </div>

          <div className="guide-pill-badge">
            <span>{pose.name.toUpperCase()} · REFERENCE</span>
          </div>
        </div>
      )}
    </>
  );
};
