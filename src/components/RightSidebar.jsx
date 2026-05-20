import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { MoreHorizontal, Maximize2, Share2, CheckCircle2, Loader, ListCollapse, AlignCenter, Info } from 'lucide-react';
import Visualizer from './Visualizer';

const RightSidebar = () => {
  const { currentTrack, toggleFullscreen, likedSongs, toggleLike, progress, seek, formatTime } = useContext(PlayerContext);
  const [lyrics, setLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const fullLyricsContainerRef = useRef(null);

  useEffect(() => {
    setLyrics('');
    setSyncedLyrics('');
    setShowFullLyrics(false);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack?.id) return;
    const fetchLyrics = async () => {
      setLyricsLoading(true);
      try {
        const response = await fetch(`/api/lyrics?id=${currentTrack.id}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
        const data = await response.json();
        setLyrics(data.lyrics || '');
        setSyncedLyrics(data.syncedLyrics || '');
      } catch (err) {
        console.error("Error fetching lyrics:", err);
        setLyrics('');
        setSyncedLyrics('');
      } finally {
        setLyricsLoading(false);
      }
    };
    fetchLyrics();
  }, [currentTrack?.id]);

  // LRC Parser
  const parsedLyrics = useMemo(() => {
    if (!syncedLyrics || typeof syncedLyrics !== 'string') return [];
    const lines = syncedLyrics.split('\n');
    const parsedLines = [];
    const timeReg = /\[(\d+):(\d+(?:\.\d+)?)\]/;

    for (let line of lines) {
      line = line.trim();
      const match = timeReg.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        const time = minutes * 60 + seconds;
        const text = line.replace(timeReg, '').trim();
        if (text) {
          parsedLines.push({ time, text });
        }
      }
    }
    return parsedLines.sort((a, b) => a.time - b.time);
  }, [syncedLyrics]);

  // Determine active, previous, and next lines
  const activeIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (progress >= parsedLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [parsedLyrics, progress]);

  // Auto-scroll the full lyrics view to keep the active line in center
  useEffect(() => {
    if (showFullLyrics && fullLyricsContainerRef.current && activeIndex !== -1) {
      const container = fullLyricsContainerRef.current;
      const activeEl = container.querySelector('.rs-full-lyric-line.active');
      if (activeEl) {
        const activeTop = activeEl.offsetTop;
        const containerHeight = container.clientHeight;
        container.scrollTo({
          top: activeTop - containerHeight / 2 + activeEl.clientHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex, showFullLyrics]);

  const { previousLine, activeLine, nextLine } = useMemo(() => {
    if (parsedLyrics.length === 0) return { previousLine: '', activeLine: '', nextLine: '' };
    
    if (activeIndex === -1) {
      return {
        previousLine: '',
        activeLine: 'Instrumental / Waiting...',
        nextLine: parsedLyrics[0]?.text || ''
      };
    }

    return {
      previousLine: activeIndex > 0 ? parsedLyrics[activeIndex - 1].text : '',
      activeLine: parsedLyrics[activeIndex].text,
      nextLine: activeIndex + 1 < parsedLyrics.length ? parsedLyrics[activeIndex + 1].text : ''
    };
  }, [parsedLyrics, activeIndex]);

  const isSongLiked = currentTrack && likedSongs?.some(s => s.id === currentTrack.id);

  const handleShare = () => {
    let shareUrl = '';
    if (currentTrack.type === 'youtube') {
      shareUrl = `${window.location.origin}/?yt=${currentTrack.youtubeId}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}&cover=${encodeURIComponent(currentTrack.coverUrl)}&duration=${currentTrack.duration}`;
    } else {
      shareUrl = `${window.location.origin}/?track=${currentTrack.id}`;
    }
    navigator.clipboard.writeText(shareUrl);
    alert("Redirectable share link copied to clipboard!");
  };

  const handleMore = () => {
    setShowInfoModal(true);
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
              <Share2 size={19} className="rs-icon" onClick={handleShare} />
              <CheckCircle2 
                size={19} 
                className={isSongLiked ? "rs-icon-check active" : "rs-icon-check"} 
                onClick={() => toggleLike(currentTrack)}
                fill={isSongLiked ? 'var(--accent-primary)' : 'none'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Live Canvas Audio Visualizer component */}
      <Visualizer />

      <div className="rs-lyrics-header-panel">
        <span className="rs-lyrics-panel-title">Lyrics</span>
        {parsedLyrics.length > 0 && (
          <button 
            className="rs-lyrics-toggle-btn"
            onClick={() => setShowFullLyrics(prev => !prev)}
            title={showFullLyrics ? "Switch to Karaoke Mode" : "Switch to Full Synced Sheet"}
          >
            {showFullLyrics ? (
              <><AlignCenter size={13} /> Karaoke Mode</>
            ) : (
              <><ListCollapse size={13} /> Interactive Sheet</>
            )}
          </button>
        )}
      </div>

      <div className="rs-lyrics-section">
        {lyricsLoading ? (
          <div className="rs-lyrics-loading">
            <Loader size={20} className="spin-animation" color="var(--accent-primary)" />
            <span>Fetching lyrics...</span>
          </div>
        ) : parsedLyrics.length > 0 ? (
          showFullLyrics ? (
            /* Interactive Full Synced Lyrics Sheet (Click-to-Seek) */
            <div 
              ref={fullLyricsContainerRef} 
              className="rs-full-lyrics-container scrollable"
            >
              {parsedLyrics.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`rs-full-lyric-line ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => seek(line.time)}
                >
                  <span className="rs-lyric-time">{formatTime(line.time)}</span>
                  <span className="rs-lyric-text">{line.text}</span>
                </div>
              ))}
            </div>
          ) : (
            /* Dynamic Synced Lyrics (Karaoke Mode) */
            <div className="rs-synced-lyrics-container">
              <p className="rs-synced-line previous">{previousLine}</p>
              <p className="rs-synced-line active">{activeLine}</p>
              <p className="rs-synced-line next">{nextLine}</p>
            </div>
          )
        ) : lyrics ? (
          /* Plain Lyrics Fallback */
          <div className="rs-plain-lyrics-container scrollable">
            {lyrics.split('\n').map((line, idx) => (
              <p key={idx} className="rs-plain-lyrics-line">{line}</p>
            ))}
          </div>
        ) : (
          <div className="rs-lyrics-empty">Lyrics not available for this song</div>
        )}
      </div>

      {showInfoModal && (
        <div className="info-modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="info-modal-content" onClick={e => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>Track Information</h3>
              <button className="info-modal-close" onClick={() => setShowInfoModal(false)}>×</button>
            </div>
            <div className="info-modal-body">
              <div className="info-modal-item">
                <span className="info-label">Title</span>
                <span className="info-value">{currentTrack.title}</span>
              </div>
              <div className="info-modal-item">
                <span className="info-label">Artist</span>
                <span className="info-value">{currentTrack.artist}</span>
              </div>
              <div className="info-modal-item">
                <span className="info-label">Album</span>
                <span className="info-value">{currentTrack.album || 'N/A'}</span>
              </div>
              <div className="info-modal-item">
                <span className="info-label">Duration</span>
                <span className="info-value">{formatTime(currentTrack.duration)}</span>
              </div>
              <div className="info-modal-item">
                <span className="info-label">Source</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>
                  {currentTrack.type === 'youtube' ? 'YouTube Music' : 'JioSaavn'}
                </span>
              </div>
              {currentTrack.type !== 'youtube' && (
                <>
                  <div className="info-modal-item">
                    <span className="info-label">Year</span>
                    <span className="info-value">{currentTrack.year || 'N/A'}</span>
                  </div>
                  <div className="info-modal-item">
                    <span className="info-label">Language</span>
                    <span className="info-value" style={{ textTransform: 'capitalize' }}>
                      {currentTrack.language || 'N/A'}
                    </span>
                  </div>
                  <div className="info-modal-item">
                    <span className="info-label">Record Label</span>
                    <span className="info-value">{currentTrack.label || 'N/A'}</span>
                  </div>
                  <div className="info-modal-item">
                    <span className="info-label">Play Count</span>
                    <span className="info-value">{currentTrack.playCount || 'N/A'}</span>
                  </div>
                  <div className="info-modal-item">
                    <span className="info-label">Stream Quality</span>
                    <span className="info-value">320 kbps (Super High Quality)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
