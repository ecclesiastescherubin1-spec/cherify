import { useContext } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Mic2, MonitorSpeaker, Heart, Maximize2, ListMusic, Loader } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';

const PlaybackBar = () => {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    duration, 
    volume, 
    setVolume, 
    togglePlay, 
    playNext, 
    playPrev, 
    seek, 
    formatTime,
    isLoading,
    likedSongs,
    toggleLike,
    shuffleMode,
    setShuffleMode,
    loopMode,
    toggleLoop,
    activeView,
    setActiveView,
    toggleFullscreen
  } = useContext(PlayerContext);
  
  const isCurrentTrackLiked = currentTrack && likedSongs.some(s => s.id === currentTrack.id);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  const toggleMute = () => {
    if (volume > 0) setVolume(0);
    else setVolume(1);
  };

  return (
    <div className="playback-bar">
      <div className="now-playing">
        {currentTrack ? (
          <>
            <img src={currentTrack.coverUrl || "https://images.unsplash.com/photo-1621360841013-c76831f1628f?w=100&h=100&fit=crop"} alt="Album Cover" className="now-playing-img" />
            <div className="now-playing-info">
              <div className="now-playing-title">{currentTrack.title}</div>
              <div className="now-playing-artist">{currentTrack.artist}</div>
            </div>
            <div className="now-playing-actions">
              <button onClick={() => toggleLike(currentTrack)} style={{ color: isCurrentTrackLiked ? 'var(--text-bright-accent)' : 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Heart size={16} fill={isCurrentTrackLiked ? 'var(--text-bright-accent)' : 'none'} color={isCurrentTrackLiked ? 'var(--text-bright-accent)' : 'currentColor'} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-subdued)' }}>No track playing</div>
        )}
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className={`player-btn ${shuffleMode ? 'active' : ''}`} onClick={() => setShuffleMode(!shuffleMode)}>
            <Shuffle size={16} color={shuffleMode ? 'var(--text-bright-accent)' : 'currentColor'} />
          </button>
          <button className="player-btn" onClick={playPrev}><SkipBack size={20} fill="currentColor" /></button>
          <button className="play-pause-btn" onClick={togglePlay} disabled={isLoading}>
            {isLoading ? (
              <Loader size={16} className="spin-animation" color="black" />
            ) : isPlaying ? (
              <Pause size={16} fill="black" />
            ) : (
              <Play size={16} fill="black" style={{ marginLeft: '2px' }} />
            )}
          </button>
          <button className="player-btn" onClick={playNext}><SkipForward size={20} fill="currentColor" /></button>
          <button className={`player-btn ${loopMode !== 'none' ? 'active' : ''}`} onClick={toggleLoop}>
            {loopMode === 'one' ? <Repeat size={16} color="var(--text-bright-accent)" style={{ position: 'relative' }} /> : <Repeat size={16} color={loopMode === 'all' ? 'var(--text-bright-accent)' : 'currentColor'} />}
            {loopMode === 'one' && <span style={{ fontSize: '8px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-bright-accent)', fontWeight: '900' }}>1</span>}
          </button>
        </div>
        
        <div className="playback-timeline">
          <span className="time-text">{formatTime(progress)}</span>
          <div className="progress-bar-container" onClick={handleSeek}>
            <div className="progress-bar" style={{ width: `${(progress / duration) * 100 || 0}%` }}></div>
          </div>
          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="volume-controls">
        <button className={`player-btn ${activeView === 'queue' ? 'active' : ''}`} onClick={() => setActiveView('queue')}>
          <ListMusic size={16} color={activeView === 'queue' ? 'var(--text-bright-accent)' : 'currentColor'} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="player-btn" onClick={toggleMute}>
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="volume-bar-container" onClick={handleVolume}>
            <div className="volume-bar" style={{ width: `${volume * 100}%` }}></div>
          </div>
        </div>
        
        <button className="player-btn" onClick={toggleFullscreen}><Maximize2 size={16} /></button>
      </div>
    </div>
  );
};

export default PlaybackBar;
