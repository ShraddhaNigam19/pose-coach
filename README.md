# Pose Coach — AI-Powered Smart Photography Assistant

Pose Coach is a mobile-first photography assistant powered by on-device computer vision. It coaches framing, posture, composition, and alignment in real time directly over the live camera preview—enabling solo photographers and couples to capture publication-grade portraits without needing a director.

---

## 🌟 Core Features

- **Live On-Device AI Pose Detection**: Powered by MediaPipe Pose Landmarker Lite running client-side WebAssembly via `@mediapipe/tasks-vision`.
- **Real-Time Skeleton & Landmark Overlay**: Renders 33 tracked skeletal landmarks and bone connections with confidence thresholding and smooth frame interpolation.
- **Smart Framing Engine**: Pure TypeScript geometry module computing headroom, subject centering, margins, and distance heuristics across 5 composition modes:
  - `full-body`: Head and feet visibility, floor space, vertical clearance.
  - `waist-up`: Torso balance, shoulder space, upright spine posture.
  - `headshot`: Face centering, eye-line grid alignment.
  - `selfie`: Mirrored coordinate transforms, chin angle, front-camera compensation.
  - `couple`: Multi-person bounding box calculation, spacing, overlap detection, and duo instructions.
- **Pose Similarity & Live Feedback Engine**:
  - Scale- and translation-invariant landmark normalization (anchored on torso scale).
  - Joint angle calculation across 8 key anatomical vertices (elbows, shoulders, hips, knees).
  - Real-time pose match percentage (0–100%) and prioritized actionable corrections (e.g., *"Raise your right elbow slightly"*).
- **Curated 20+ Pose Library**:
  - **Traditional**: Saree draping, pallu holds, festive twirls, sherwanis, anarkali seated poses.
  - **Western**: Casual street stances, walk-into-frame motion, hands in pockets, studio stool perch.
  - **Selfie**: High-angle golden hour, jawline touch, mirror fit check, chin-down editorial.
  - **Couple**: Romantic close & candid, walking duo, forehead touch, playful duo selfie, royal ethnic wedding.
- **Camera Studio**:
  - Live front/rear camera toggle with `navigator.mediaDevices.getUserMedia`.
  - Rule-of-thirds grid line toggle.
  - Viewfinder guide corners and adjustable ghost reference overlay opacity (20%–100%).
  - Real countdown timers (`Off`, `3s`, `5s`, `10s`) with animated numbers and cancellation.
  - Tactile high-precision shutter capturing native video resolution frames to off-screen canvas.
- **Photo Review, Retake & Local Downloads**:
  - Fullscreen photo preview with clean capture (guide removed by default).
  - Direct local image download (`pose-coach-YYYY-MM-DD.jpg`).
- **Offline & Local Storage**:
  - Bookmarked favorites persisted in browser `localStorage`.
  - 100% on-device inference with zero cloud server uploads.

---

## 🏗️ Project Architecture

```
pose-coach-mobile/
├── public/
│   ├── mediapipe/wasm/             # Local WebAssembly binaries for vision tasks
│   └── models/
│       └── pose_landmarker_lite.task # On-device MediaPipe pose model
├── src/
│   ├── components/
│   │   ├── CameraStudio.tsx        # Immersive camera studio, viewfinder, shutter & HUD
│   │   ├── CapturePreview.tsx      # High-res photo review, retake, and download flow
│   │   ├── ExploreView.tsx         # Searchable category pose library & detail drawer
│   │   ├── PoseOverlay.tsx         # Reference overlay & rule-of-thirds grid
│   │   ├── ReferenceArtwork.tsx    # Responsive SVG pose illustrations
│   │   ├── SavedView.tsx           # Local favorites management & quick camera launch
│   │   └── SettingsView.tsx        # Privacy guarantee, hardware permissions, licenses
│   ├── data/
│   │   └── poses.ts                # 20+ poses with metadata & 33-point normalized templates
│   ├── hooks/
│   │   ├── useCamera.ts            # MediaStream lifecycle, tracks, facing switch
│   │   └── usePoseDetection.ts     # MediaPipe PoseLandmarker lifecycle & throttled RAF loop
│   ├── types/
│   │   └── pose.ts                 # TypeScript type definitions for poses, framing & matches
│   ├── utils/
│   │   ├── geometry.ts             # Vector math, joint angles, normalization, bounding box
│   │   ├── framing.ts              # Pure framing calculation & priority messaging
│   │   ├── framing.test.ts         # Vitest unit tests for framing engine (8 tests)
│   │   ├── poseSimilarity.ts       # Angle comparison, similarity score, actionable hints
│   │   └── poseSimilarity.test.ts  # Vitest unit tests for pose comparison (6 tests)
│   ├── App.tsx                     # Topbar, bottom navigation & tab router
│   ├── main.tsx                    # React DOM entry point
│   └── styles.css                  # Mobile-first dark studio UI stylesheet
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Setup & Development

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5174/` (or the network IP shown in the console to test directly on your mobile device over Wi-Fi).

> **Note on Camera Permissions**:
> Modern mobile browsers strictly require a secure context (`https://` or `http://localhost`) to access camera hardware via `getUserMedia`.

### 3. Run Automated Tests
```bash
npm test
```
Runs the full Vitest suite covering geometry, framing boundaries, crop detection, mirrored front cameras, multi-person spacing, scale invariance, and pose similarity.

### 4. Production Build
```bash
npm run build
```
Typechecks and compiles production assets into `dist/`.

---

## 🔒 Privacy & Open-Source AI Model Attribution

- **AI Package**: `@mediapipe/tasks-vision` (Google LLC, Apache 2.0 License).
- **Model**: `pose_landmarker_lite.task` (Official Google MediaPipe Model Asset).
- **Execution**: 100% Client-side WebAssembly execution inside the browser runtime.
- **Privacy Assurance**: Camera streams are processed locally frame-by-frame. No photos, video frames, audio, or biometric coordinates are ever uploaded or transmitted to any external server.

---

## 🧪 Verification Status

- **Unit Tests**: 14/14 tests passing across `framing.test.ts` and `poseSimilarity.test.ts`.
- **TypeScript**: Strict typechecking passed with 0 errors (`tsc -b`).
- **Production Build**: Vite build completed successfully (`dist/assets/`).
- **Live Server**: Active on `http://localhost:5174/` (and local network Wi-Fi).

---

## 📋 Known Limitations

1. **Relative vs. Absolute Distance**: The app computes framing using 2D image coordinates and relative torso scales; it does not perform clinical millimeter-accurate depth estimation.
2. **Extreme Lighting & Occlusion**: Dense crowd scenes or extreme low light may degrade MediaPipe landmark confidence. The app detects this and prompts the user to adjust lighting or step into the frame.
3. **Multi-Person Couple Tracking**: Two-person pose detection uses the `numPoses: 2` detector mode and checks bounding boxes; highly occluded or overlapping bodies may occasionally merge landmarks.
