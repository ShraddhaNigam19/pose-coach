import React from 'react';
import { Pose } from '../types/pose';

type ReferenceArtworkProps = {
  pose: Pose;
  className?: string;
};

export const ReferenceArtwork: React.FC<ReferenceArtworkProps> = ({ pose, className = '' }) => {
  const palette = {
    Traditional: ['#c084fc', '#8b5cf6', '#fbbf24'],
    Western: ['#93c5fd', '#6366f1', '#e2e8f0'],
    Selfie: ['#f472b6', '#ec4899', '#fbcfe8'],
    Couple: ['#f472b6', '#818cf8', '#c7d2fe'],
  } as const;

  const tones = palette[pose.category] ?? palette.Western;
  const skin = '#f8d7be';

  // Dynamic SVG path variations based on pose attributes
  const isWalking = pose.type === 'walk';
  const isSitting = pose.type === 'sitting';
  const isSelfie = pose.type === 'selfie';
  const isCouple = pose.type === 'couple';

  const leftArm = isWalking
    ? 'M86 138 L55 135 L40 170'
    : isSelfie
    ? 'M98 138 L72 130 L60 160'
    : pose.id === 2 // Pallu hold
    ? 'M88 138 L68 120 L78 95'
    : 'M90 139 L68 134 L52 168';

  const rightArm = isWalking
    ? 'M96 138 L118 128 L136 162'
    : isSelfie
    ? 'M102 138 L126 118 L142 144'
    : isCouple
    ? 'M92 140 L120 120 L136 162'
    : pose.id === 5 // Sherwani cuff adjustment
    ? 'M94 138 L116 126 L108 102'
    : 'M92 139 L116 130 L131 165';

  const legs = isSitting
    ? 'M84 170 L62 206 L72 232 M120 170 L146 202 L136 232'
    : isWalking
    ? 'M82 170 L54 204 L52 232 M118 170 L136 200 L149 232'
    : 'M86 170 L62 206 L64 236 M117 170 L140 206 L139 236';

  return (
    <svg
      className={className}
      viewBox="0 0 220 260"
      aria-label={`${pose.name} reference illustration`}
      role="img"
    >
      <defs>
        <linearGradient id={`pose-gradient-${pose.id}`} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={tones[0]} />
          <stop offset="100%" stopColor={tones[1]} />
        </linearGradient>
        <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={tones[0]} floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#soft-glow)">
        {/* Soft ground shadow */}
        <ellipse cx="110" cy="242" rx="48" ry="8" fill="rgba(0, 0, 0, 0.35)" />

        {/* Head */}
        <circle cx="110" cy="46" r="22" fill={skin} />

        {/* Collar / Neck drape */}
        <path
          d="M103 70 C98 82, 98 98, 110 108 C122 98, 122 82, 118 70 Z"
          fill={tones[1]}
          opacity="0.92"
        />

        {/* Torso */}
        <path
          d="M86 108 L114 108 L122 170 L78 170 Z"
          fill={`url(#pose-gradient-${pose.id})`}
        />

        {/* Left Arm */}
        <path
          d={leftArm}
          fill="none"
          stroke="#1e1b29"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Right Arm */}
        <path
          d={rightArm}
          fill="none"
          stroke="#1e1b29"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Legs */}
        <path
          d={legs}
          fill="none"
          stroke="#1e1b29"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Additional decorative cues */}
        {isSelfie && (
          <path
            d="M120 54 L138 58 L132 82"
            fill="none"
            stroke={tones[0]}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {isCouple && (
          <g transform="translate(-40, 6) scale(0.9)">
            <circle cx="95" cy="48" r="20" fill={skin} />
            <path d="M72 108 L100 108 L106 170 L66 170 Z" fill="#fda4af" opacity="0.9" />
            <path
              d="M70 170 L52 206 L50 236 M98 170 L118 206 L116 236"
              fill="none"
              stroke="#1e1b29"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {isSitting && (
          <path
            d="M80 170 C96 182, 122 186, 138 182"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.45"
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
};
