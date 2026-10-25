import React, { useState } from 'react';
import { ArrowLeft, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

type CapturePreviewProps = {
  imageUrl: string;
  onRetake: () => void;
  onToast: (msg: string) => void;
};

export const CapturePreview: React.FC<CapturePreviewProps> = ({
  imageUrl,
  onRetake,
  onToast,
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = imageUrl;
      link.download = `pose-coach-${timestamp}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      onToast('Photo downloaded to your device files');
    } catch (err) {
      console.error('Failed to download photo:', err);
      onToast('Download failed. Please check permissions.');
    }
  };

  return (
    <div className="capture-preview-screen" role="dialog" aria-label="Photo Preview">
      <div className="preview-topbar">
        <button
          type="button"
          className="preview-back-btn"
          onClick={onRetake}
          aria-label="Back to camera"
        >
          <ArrowLeft size={20} />
          <span>Retake</span>
        </button>
        <div className="preview-title">
          <span>Captured Portrait</span>
        </div>
        <div className="preview-spacer" />
      </div>

      <div className="preview-viewport">
        <img
          src={imageUrl}
          alt="Captured shot"
          className="preview-image"
        />
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={onRetake}
        >
          <RefreshCw size={18} />
          <span>Retake</span>
        </button>

        <button
          type="button"
          className="primary-btn download-btn"
          onClick={handleDownload}
        >
          {downloaded ? (
            <>
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Downloaded</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Save & Download</span>
            </>
          )}
        </button>
      </div>

      <p className="preview-privacy-hint">
        Stored locally on this device. Photos are never uploaded to any server.
      </p>
    </div>
  );
};
