import React, { useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { MoreHorizontal, Maximize2, Share2, CheckCircle2 } from 'lucide-react';

const RightSidebar = () => {
  const { currentTrack, toggleFullscreen, toggleArtistSelection, selectedArtists } = useContext(PlayerContext);

  const isArtistFollowed = currentTrack && selectedArtists?.some(a => a.name === currentTrack.artist);

  const handleShare = () => {
    navigator.clipboard.writeText(`Listening to ${currentTrack.title} by ${currentTrack.artist} on Cherify!`);
    alert("Share link copied to clipboard!");
  };

  const handleMore = () => {
    alert("More options: Add to Playlist, View Album, View Artist");
  };

  if (!currentTrack) return (
    <div className="right-sidebar sidebar-box">
      <div className="empty-state-sidebar">
        <p>Play a song to see details</p>
      </div>
    </div>
  );

  return (
    <div className="right-sidebar sidebar-box">
      <div className="rs-header">
        <span className="rs-track-title">{currentTrack.title}</span>
        <div className="rs-header-actions">
          <MoreHorizontal size={20} className="rs-icon" onClick={handleMore} />
          <Maximize2 size={18} className="rs-icon" onClick={toggleFullscreen} />
        </div>
      </div>

      <div className="rs-main-card">
        <img src={currentTrack.coverUrl} className="rs-cover-img" alt={currentTrack.title} />
        
        <div className="rs-track-info">
          <div className="rs-info-row">
            <div>
              <h2 className="rs-title">{currentTrack.title}</h2>
              <p className="rs-artist">{currentTrack.artist}</p>
            </div>
            <div className="rs-status-icons">
              <Share2 size={20} className="rs-icon" onClick={handleShare} />
              <CheckCircle2 
                size={20} 
                className={isArtistFollowed ? "rs-icon-check active" : "rs-icon-check"} 
                onClick={() => toggleArtistSelection({ name: currentTrack.artist, img: currentTrack.coverUrl })}
                fill={isArtistFollowed ? 'var(--accent-primary)' : 'none'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rs-about-artist">
        <div className="rs-artist-card">
          <img src={currentTrack.coverUrl} className="rs-artist-img" alt="" />
          <div className="rs-artist-overlay">
            <span className="rs-about-label">About the artist</span>
            <h3 className="rs-artist-name">{currentTrack.artist}</h3>
          </div>
        </div>
        <div className="rs-artist-stats">
          <div className="stat-item">
            <span className="stat-value">24.5M</span>
            <span className="stat-label">Monthly Listeners</span>
          </div>
          <p className="rs-artist-bio">
            Exploring the boundaries of sound with {currentTrack.artist}. 
            A leading voice in the current high-fidelity music scene.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
