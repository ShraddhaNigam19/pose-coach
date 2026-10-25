import React, { useState } from 'react';
import { Bookmark, Camera, Sparkles, Trash2 } from 'lucide-react';
import { Category, Pose } from '../types/pose';
import { ReferenceArtwork } from './ReferenceArtwork';

type SavedViewProps = {
  allPoses: Pose[];
  favorites: number[];
  onSelectPose: (pose: Pose) => void;
  onToggleFavorite: (poseId: number) => void;
  onLaunchCamera: (pose: Pose) => void;
  onGoToExplore: () => void;
};

export const SavedView: React.FC<SavedViewProps> = ({
  allPoses,
  favorites,
  onSelectPose,
  onToggleFavorite,
  onLaunchCamera,
  onGoToExplore,
}) => {
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');

  const savedPoses = allPoses.filter((p) => favorites.includes(p.id));
  const filteredSaved = savedPoses.filter(
    (p) => filterCategory === 'All' || p.category === filterCategory
  );

  return (
    <div className="saved-view-container">
      <section className="saved-header">
        <div className="section-eyebrow">
          <Sparkles size={13} />
          <span>YOUR CURATED COLLECTION</span>
        </div>
        <h2>Saved Poses</h2>
        <p>Bookmarked reference ideas stored locally on your device.</p>

        {savedPoses.length > 0 && (
          <div className="category-scroll-ribbon">
            {(['All', 'Traditional', 'Western', 'Selfie', 'Couple'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="saved-content-section">
        {savedPoses.length === 0 ? (
          <div className="saved-empty-card">
            <div className="empty-bookmark-box">
              <Bookmark size={36} />
            </div>
            <h3>No saved poses yet</h3>
            <p>
              When you find poses you love in the Explore library, tap the bookmark icon to save
              them here for fast access.
            </p>
            <button type="button" className="browse-poses-cta" onClick={onGoToExplore}>
              Browse Pose Library
            </button>
          </div>
        ) : filteredSaved.length === 0 ? (
          <div className="saved-empty-card">
            <p>No saved poses in &quot;{filterCategory}&quot; category.</p>
            <button
              type="button"
              className="browse-poses-cta"
              onClick={() => setFilterCategory('All')}
            >
              Show all saved
            </button>
          </div>
        ) : (
          <div className="saved-cards-list">
            {filteredSaved.map((pose) => (
              <div key={pose.id} className="saved-pose-row">
                <div className="saved-art-thumb">
                  <ReferenceArtwork pose={pose} className="saved-thumb-art" />
                </div>

                <div className="saved-row-info">
                  <div className="row-tags">
                    <span className="row-cat">{pose.category}</span>
                    <span className="row-comp">{pose.composition}</span>
                  </div>
                  <h4>{pose.name}</h4>
                  <p>{pose.tag} · {pose.outfit}</p>
                </div>

                <div className="saved-row-actions">
                  <button
                    type="button"
                    className="saved-shoot-btn"
                    onClick={() => {
                      onSelectPose(pose);
                      onLaunchCamera(pose);
                    }}
                    title="Shoot with this pose"
                  >
                    <Camera size={16} />
                    <span>Shoot</span>
                  </button>

                  <button
                    type="button"
                    className="saved-remove-btn"
                    onClick={() => onToggleFavorite(pose.id)}
                    title="Remove from saved"
                    aria-label="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
