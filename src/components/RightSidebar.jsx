import React, { useContext, useState, useEffect, useMemo } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { MoreHorizontal, Maximize2, Share2, CheckCircle2, Loader } from 'lucide-react';

const RightSidebar = () => {
  const { currentTrack, toggleFullscreen, likedSongs, toggleLike, progress } = useContext(PlayerContext);
  const [lyrics, setLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    setLyrics('');
    setSyncedLyrics('');
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
        ) : parsedLyrics.length > 0 ? (
          /* Dynamic Synced Lyrics (Karaoke Mode) */
          <div className="rs-synced-lyrics-container">
            <p className="rs-synced-line previous">{previousLine}</p>
            <p className="rs-synced-line active">{activeLine}</p>
            <p className="rs-synced-line next">{nextLine}</p>
          </div>
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
    </div>
  );
};

export default RightSidebar;
