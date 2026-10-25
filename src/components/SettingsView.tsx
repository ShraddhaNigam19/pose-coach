import React from 'react';
import {
  Cpu,
  Download,
  ExternalLink,
  Lock,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';

type SettingsViewProps = {
  favoritesCount: number;
  onClearFavorites: () => void;
  onToast: (msg: string) => void;
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  favoritesCount,
  onClearFavorites,
  onToast,
}) => {
  return (
    <div className="settings-view-container">
      <section className="settings-header">
        <div className="section-eyebrow">
          <ShieldCheck size={13} />
          <span>SECURITY & OPEN SOURCE AI</span>
        </div>
        <h2>App & Privacy</h2>
        <p>Private by design. Real-time computer vision without cloud surveillance.</p>
      </section>

      <section className="settings-cards-list">
        {/* Privacy Card */}
        <div className="settings-info-card">
          <div className="card-heading-row">
            <div className="icon-circle privacy-icon">
              <Lock size={18} />
            </div>
            <div>
              <h4>100% On-Device Privacy</h4>
              <span className="card-sub">Zero cloud uploads</span>
            </div>
          </div>
          <p className="card-body-text">
            All camera frames and computer vision inference run strictly inside your local browser
            using WebAssembly. No photos, video streams, or biometric data are transmitted to any
            external server or cloud service.
          </p>
        </div>

        {/* AI & Model Card */}
        <div className="settings-info-card">
          <div className="card-heading-row">
            <div className="icon-circle model-icon">
              <Cpu size={18} />
            </div>
            <div>
              <h4>Open-Source AI Model</h4>
              <span className="card-sub">Google MediaPipe Pose Landmarker Lite</span>
            </div>
          </div>
          <p className="card-body-text">
            Powered by the official <code>@mediapipe/tasks-vision</code> runtime. The 33-point
            pose landmarker model (<code>pose_landmarker_lite.task</code>) is bundled locally and
            evaluated via client-side WebAssembly.
          </p>
          <div className="license-badge-row">
            <span className="tech-badge">Apache 2.0 License</span>
            <span className="tech-badge">Local WASM Binary</span>
          </div>
        </div>

        {/* Camera Hardware Card */}
        <div className="settings-info-card">
          <div className="card-heading-row">
            <div className="icon-circle camera-icon">
              <Smartphone size={18} />
            </div>
            <div>
              <h4>Camera Permissions</h4>
              <span className="card-sub">`navigator.mediaDevices.getUserMedia`</span>
            </div>
          </div>
          <p className="card-body-text">
            Camera permission is requested only when you explicitly start the camera in the studio.
            Camera hardware streams are completely stopped as soon as you pause the camera or leave
            the studio.
          </p>
        </div>

        {/* Downloads & Storage */}
        <div className="settings-info-card">
          <div className="card-heading-row">
            <div className="icon-circle download-icon">
              <Download size={18} />
            </div>
            <div>
              <h4>Downloads & Local Storage</h4>
              <span className="card-sub">{favoritesCount} saved favorites</span>
            </div>
          </div>
          <p className="card-body-text">
            Captured photos are downloaded directly to your device storage files. Bookmarked poses
            are preserved in browser <code>localStorage</code>.
          </p>

          {favoritesCount > 0 && (
            <button
              type="button"
              className="clear-storage-btn"
              onClick={() => {
                onClearFavorites();
                onToast('Favorites cleared');
              }}
            >
              <Trash2 size={15} />
              <span>Clear Saved Favorites</span>
            </button>
          )}
        </div>
      </section>

      <footer className="settings-footer">
        <p>Pose Coach v0.1.0 · Crafted for modern photography</p>
      </footer>
    </div>
  );
};
