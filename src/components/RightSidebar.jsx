import React, { useContext, useState, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { MoreHorizontal, Maximize2, Share2, CheckCircle2, Loader } from 'lucide-react';

const RightSidebar = () => {
  const { currentTrack, toggleFullscreen, likedSongs, toggleLike } = useContext(PlayerContext);
  const [lyrics, setLyrics] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    setLyrics('');
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack?.id) return;
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
  }, [currentTrack?.id]);



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

      <div className="rs-lyrics-section">
        {lyricsLoading ? (
          <div className="rs-lyrics-loading">
            <Loader size={20} className="spin-animation" color="var(--accent-primary)" />
            <span>Fetching lyrics...</span>
          </div>
        ) : (lyrics && typeof lyrics === 'string') ? (
          <div className="rs-lyrics-content scrollable">
            {lyrics.split('\n').map((line, idx) => (
              <p key={idx} className="rs-lyrics-line">{line}</p>
            ))}
          </div>
        ) : (
          <div className="rs-lyrics-empty">Lyrics not available for this song</div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
