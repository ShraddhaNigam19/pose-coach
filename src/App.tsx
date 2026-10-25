import React, { useEffect, useState } from 'react';
import {
  Aperture,
  Bookmark,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { Pose } from './types/pose';
import { poses } from './data/poses';
import { CameraStudio } from './components/CameraStudio';
import { ExploreView } from './components/ExploreView';
import { SavedView } from './components/SavedView';
import { SettingsView } from './components/SettingsView';

type Tab = 'camera' | 'explore' | 'saved' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('camera');
  const [selectedPose, setSelectedPose] = useState<Pose>(poses[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('posecoach-favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('posecoach-favorites', JSON.stringify(favorites));
    } catch (err) {
      console.warn('Failed to save favorites to localStorage:', err);
    }
  }, [favorites]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const toggleFavorite = (poseId: number) => {
    const isFav = favorites.includes(poseId);
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== poseId));
      showToast('Removed from saved poses');
    } else {
      setFavorites((prev) => [...prev, poseId]);
      showToast('Saved to your collection');
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const handleLaunchCamera = (pose: Pose) => {
    setSelectedPose(pose);
    setActiveTab('camera');
    showToast(`Loaded "${pose.name}" in Camera`);
  };

  const navItems = [
    { id: 'camera' as const, label: 'Camera', icon: Camera },
    { id: 'explore' as const, label: 'Explore', icon: ImageIcon },
    { id: 'saved' as const, label: 'Saved', icon: Bookmark, badge: favorites.length },
    { id: 'settings' as const, label: 'Settings', icon: ShieldCheck },
  ];

  return (
    <div className="pose-coach-app">
      {/* Top Header */}
      <header className="app-topbar">
        <div className="topbar-brand" onClick={() => setActiveTab('camera')}>
          <div className="topbar-logo-box">
            <Aperture size={19} />
          </div>
          <div className="topbar-brand-text">
            <span className="brand-name">
              pose<span className="brand-accent">coach</span>
            </span>
            <span className="brand-sub">SMART PHOTOGRAPHY AI</span>
          </div>
        </div>

        <div className="topbar-tag">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>ON-DEVICE AI</span>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="app-main-viewport">
        {activeTab === 'camera' && (
          <CameraStudio
            activePose={selectedPose}
            allPoses={poses}
            onSelectPose={setSelectedPose}
            onToast={showToast}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            poses={poses}
            selectedPose={selectedPose}
            favorites={favorites}
            onSelectPose={setSelectedPose}
            onToggleFavorite={toggleFavorite}
            onLaunchCamera={handleLaunchCamera}
          />
        )}

        {activeTab === 'saved' && (
          <SavedView
            allPoses={poses}
            favorites={favorites}
            onSelectPose={setSelectedPose}
            onToggleFavorite={toggleFavorite}
            onLaunchCamera={handleLaunchCamera}
            onGoToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            favoritesCount={favorites.length}
            onClearFavorites={clearFavorites}
            onToast={showToast}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Main Navigation">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              aria-label={label}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
                {badge && badge > 0 ? <span className="nav-badge">{badge}</span> : null}
              </div>
              <span className="nav-label">{label}</span>
              {isActive && <span className="nav-active-pill" />}
            </button>
          );
        })}
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="app-toast-banner" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
