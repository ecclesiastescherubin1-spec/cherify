import React, { useContext, useState, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { MoreHorizontal, Maximize2, Share2, CheckCircle2, Loader } from 'lucide-react';
import { searchMusic } from '../services/musicService';

const RightSidebar = () => {
  const { currentTrack, toggleFullscreen, likedSongs, toggleLike } = useContext(PlayerContext);
  const [artistImg, setArtistImg] = useState('');
  const [activeTab, setActiveTab] = useState('artist');
  const [lyrics, setLyrics] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    if (!currentTrack?.artist) return;
    const fetchArtistImage = async () => {
      try {
        const results = await searchMusic(currentTrack.artist, 'artist', 1);
        if (results && results.length > 0) {
          setArtistImg(results[0].img);
        } else {
          setArtistImg(currentTrack.coverUrl);
        }
      } catch (err) {
        console.error("Error fetching artist image:", err);
        setArtistImg(currentTrack.coverUrl);
      }
    };
    fetchArtistImage();
  }, [currentTrack?.artist, currentTrack?.coverUrl]);

  useEffect(() => {
    setLyrics('');
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack?.id || activeTab !== 'lyrics') return;
    const fetchLyrics = async () => {
      setLyricsLoading(true);
      try {
        const response = await fetch(`/api/lyrics?id=${currentTrack.id}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
        const data = await response.json();
        setLyrics(data.lyrics || '');
      } catch (err) {
        console.error("Error fetching lyrics:", err);
        setLyrics('');
      } finally {
        setLyricsLoading(false);
      }
    };
    fetchLyrics();
  }, [currentTrack?.id, activeTab]);

  const isSongLiked = currentTrack && likedSongs?.some(s => s.id === currentTrack.id);

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
                className={isSongLiked ? "rs-icon-check active" : "rs-icon-check"} 
                onClick={() => toggleLike(currentTrack)}
                fill={isSongLiked ? 'var(--accent-primary)' : 'none'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rs-tabs">
        <button className={`rs-tab ${activeTab === 'artist' ? 'active' : ''}`} onClick={() => setActiveTab('artist')}>Artist</button>
        <button className={`rs-tab ${activeTab === 'lyrics' ? 'active' : ''}`} onClick={() => setActiveTab('lyrics')}>Lyrics</button>
      </div>

      {activeTab === 'artist' ? (
        <div className="rs-about-artist">
          <div className="rs-artist-card">
            <img src={artistImg || currentTrack.coverUrl} className="rs-artist-img" alt="" />
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
      ) : (
        <div className="rs-lyrics-section">
          {lyricsLoading ? (
            <div className="rs-lyrics-loading">
              <Loader size={20} className="spin-animation" color="var(--accent-primary)" />
              <span>Fetching lyrics...</span>
            </div>
          ) : (lyrics && typeof lyrics === 'string') ? (
            <div className="rs-lyrics-content">
              {lyrics.split('\n').map((line, idx) => (
                <p key={idx} className="rs-lyrics-line">{line}</p>
              ))}
            </div>
          ) : (
            <div className="rs-lyrics-empty">Lyrics not available for this song</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
