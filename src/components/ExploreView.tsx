import React, { useState } from 'react';
import {
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Category, Pose } from '../types/pose';
import { ReferenceArtwork } from './ReferenceArtwork';

type ExploreViewProps = {
  poses: Pose[];
  selectedPose: Pose;
  favorites: number[];
  onSelectPose: (pose: Pose) => void;
  onToggleFavorite: (poseId: number) => void;
  onLaunchCamera: (pose: Pose) => void;
};

const CATEGORIES: (Category | 'All')[] = ['All', 'Traditional', 'Western', 'Selfie', 'Couple'];

export const ExploreView: React.FC<ExploreViewProps> = ({
  poses,
  selectedPose,
  favorites,
  onSelectPose,
  onToggleFavorite,
  onLaunchCamera,
}) => {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailPose, setDetailPose] = useState<Pose | null>(null);

  // Filtered poses
  const filteredPoses = poses.filter((pose) => {
    const matchesCategory = activeCategory === 'All' || pose.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      pose.name.toLowerCase().includes(query) ||
      pose.tag.toLowerCase().includes(query) ||
      pose.outfit.toLowerCase().includes(query) ||
      pose.occasion.toLowerCase().includes(query) ||
      pose.description.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="explore-view-container">
      {/* Header section */}
      <section className="explore-header">
        <div className="section-eyebrow">
          <Sparkles size={13} />
          <span>INSPIRATION & POSE LIBRARY</span>
        </div>
        <h2>Match the vibe.</h2>
        <p>Curated poses with real-time AI guidance for every outfit, occasion, and style.</p>

        {/* Search bar */}
        <div className="search-bar-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by pose, saree, street, couple, etc…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="category-scroll-ribbon">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span>{cat}</span>
              {activeCategory === cat && <span className="cat-active-dot" />}
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Pose Cards */}
      <section className="poses-grid-section">
        <div className="grid-meta-row">
          <span className="results-count">
            {filteredPoses.length} {filteredPoses.length === 1 ? 'pose' : 'poses'} available
          </span>
        </div>

        {filteredPoses.length === 0 ? (
          <div className="empty-search-state">
            <Filter size={32} />
            <p>No poses match &quot;{searchQuery}&quot;.</p>
            <button
              type="button"
              className="reset-search-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
            >
              View all poses
            </button>
          </div>
        ) : (
          <div className="pose-cards-grid">
            {filteredPoses.map((pose) => {
              const isFav = favorites.includes(pose.id);
              const isSelected = selectedPose.id === pose.id;

              return (
                <div
                  key={pose.id}
                  className={`pose-item-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setDetailPose(pose)}
                >
                  <div className="card-figure-box">
                    <ReferenceArtwork pose={pose} className="card-figure-artwork" />
                    <span className="card-difficulty-tag">{pose.difficulty}</span>
                    <button
                      type="button"
                      className={`card-fav-btn ${isFav ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pose.id);
                      }}
                      aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                    >
                      <Bookmark size={15} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="card-content">
                    <div className="card-tags-row">
                      <span className="category-badge">{pose.category}</span>
                      <span className="composition-badge">{pose.composition}</span>
                    </div>

                    <h4 className="card-pose-title">{pose.name}</h4>
                    <p className="card-pose-desc">{pose.description}</p>

                    <div className="card-footer-action">
                      <button
                        type="button"
                        className="launch-pose-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPose(pose);
                          onLaunchCamera(pose);
                        }}
                      >
                        <Camera size={14} />
                        <span>Use Pose</span>
                      </button>
                      <span className="details-link">
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {detailPose && (
        <div className="pose-detail-modal-backdrop" onClick={() => setDetailPose(null)}>
          <div className="pose-detail-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-category">{detailPose.category.toUpperCase()} POSE</span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDetailPose(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-artwork-box">
                <ReferenceArtwork pose={detailPose} className="modal-figure-artwork" />
              </div>

              <div className="modal-info">
                <h3>{detailPose.name}</h3>
                <div className="modal-badges">
                  <span className="detail-chip">{detailPose.tag}</span>
                  <span className="detail-chip">{detailPose.composition}</span>
                  <span className="detail-chip">{detailPose.difficulty}</span>
                </div>

                <p className="modal-description">{detailPose.description}</p>

                <div className="instructions-section">
                  <h5>Step-by-step guidance</h5>
                  <ol className="instructions-list">
                    {detailPose.instructions.map((step, idx) => (
                      <li key={idx}>
                        <span className="step-num">{idx + 1}</span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="styling-notes">
                  <div className="note-item">
                    <strong>Recommended outfit:</strong> {detailPose.outfit}
                  </div>
                  <div className="note-item">
                    <strong>Best occasion:</strong> {detailPose.occasion}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-bottom-actions">
              <button
                type="button"
                className={`modal-favorite-btn ${
                  favorites.includes(detailPose.id) ? 'active' : ''
                }`}
                onClick={() => onToggleFavorite(detailPose.id)}
              >
                <Bookmark
                  size={16}
                  fill={favorites.includes(detailPose.id) ? 'currentColor' : 'none'}
                />
                <span>{favorites.includes(detailPose.id) ? 'Saved' : 'Save Pose'}</span>
              </button>

              <button
                type="button"
                className="modal-start-camera-btn"
                onClick={() => {
                  onSelectPose(detailPose);
                  setDetailPose(null);
                  onLaunchCamera(detailPose);
                }}
              >
                <Camera size={16} />
                <span>Shoot with this Pose</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
