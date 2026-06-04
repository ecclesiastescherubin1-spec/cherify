import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import PlaybackBar from './components/PlaybackBar';
import MobileNav from './components/MobileNav';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';

const MainView = lazy(() => import('./components/MainView'));
const RightSidebar = lazy(() => import('./components/RightSidebar'));
const Welcome = lazy(() => import('./components/Welcome'));

const SuspenseFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-subdued)' }}>
    <div className="spin-animation" style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
  </div>
);

// Isolated YoutubePlayer component to prevent React Virtual DOM reconciliation issues
const YoutubePlayer = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Dynamically create the player element so React doesn't try to reconcile it when state changes
    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-iframe';
    if (containerRef.current) {
      containerRef.current.appendChild(playerDiv);
    }

    const initYT = () => {
      if (window.YT && window.YT.Player && !window.ytPlayer) {
        window.ytPlayer = new window.YT.Player('yt-player-iframe', {
          height: '100%',
          width: '100%',
          videoId: '',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            origin: window.location.origin
          },
          events: {
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                if (typeof window.playNextTrack === 'function') {
                  window.playNextTrack();
                }
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                if (window.ytPlayer?.getDuration) {
                  window.setTrackDuration(window.ytPlayer.getDuration());
                }
                if (typeof window.setPlayerIsPlaying === 'function') {
                  window.setPlayerIsPlaying(true);
                }
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                if (typeof window.setPlayerIsPlaying === 'function') {
                  window.setPlayerIsPlaying(false);
                }
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYT();
      };
    }

    return () => {
      if (window.ytPlayer && typeof window.ytPlayer.destroy === 'function') {
        window.ytPlayer.destroy();
        window.ytPlayer = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="yt-iframe-wrapper" />;
};

const AppContent = () => {
  const { showWelcome, currentTrack, showShortcutsModal, setShowShortcutsModal, toast } = React.useContext(PlayerContext);
  const playerRef = useRef(null);
  const handleRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Drag and drop mechanics for the floating player
  useEffect(() => {
    if (showWelcome) return;
    const el = playerRef.current;
    const handle = handleRef.current;
    if (!el || !handle) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // Only left-click
      isDragging = true;
      startX = e.clientX - el.getBoundingClientRect().left;
      startY = e.clientY - el.getBoundingClientRect().top;
      el.style.transition = 'none'; // Disable transition while dragging
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      let left = e.clientX - startX;
      let top = e.clientY - startY;

      // Constrain within viewport boundary
      const maxLeft = window.innerWidth - el.offsetWidth - 10;
      const maxTop = window.innerHeight - el.offsetHeight - 10;

      left = Math.max(10, Math.min(left, maxLeft));
      top = Math.max(10, Math.min(top, maxTop));

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.bottom = 'auto';
      el.style.right = 'auto';
    };

    const handleMouseUp = () => {
      isDragging = false;
      el.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    handle.addEventListener('mousedown', handleMouseDown);
    return () => {
      handle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showWelcome]);

  if (showWelcome) return <Suspense fallback={<SuspenseFallback />}><Welcome /></Suspense>;

  const isYoutubePlaying = currentTrack?.type === 'youtube';

  return (
    <div className="app-container">
      <Sidebar />
      <Suspense fallback={<SuspenseFallback />}>
        <MainView />
      </Suspense>
      <Suspense fallback={<SuspenseFallback />}>
        <RightSidebar />
      </Suspense>
      <MobileNav />
      <PlaybackBar />
      
      {/* Floating YouTube Player Container */}
      <div 
        ref={playerRef} 
        className={`yt-floating-player ${isYoutubePlaying ? 'visible' : ''} ${isMinimized ? 'minimized' : ''}`}
      >
        <div ref={handleRef} className="yt-drag-handle">
          <div className="yt-drag-dots">⋮⋮</div>
          <span className="yt-drag-title">Floating Player</span>
          <button 
            className="yt-min-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(prev => !prev);
            }}
            title={isMinimized ? "Expand Player" : "Minimize Player"}
          >
            {isMinimized ? '+' : '−'}
          </button>
        </div>
        <YoutubePlayer />
      </div>

      {showShortcutsModal && (
        <div 
          className="shortcuts-modal-overlay"
          onClick={() => setShowShortcutsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="shortcuts-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 40px var(--accent-glow)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '480px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowShortcutsModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              ✕
            </button>
            
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
              ⌨️ Keyboard Shortcuts
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              {[
                { keys: ['Space'], desc: 'Play / Pause' },
                { keys: ['ArrowLeft', 'ArrowRight'], desc: 'Seek Backward / Forward 10s' },
                { keys: ['ArrowUp', 'ArrowDown'], desc: 'Adjust Volume Up / Down 5%' },
                { keys: ['M'], desc: 'Mute / Unmute Volume' },
                { keys: ['P', 'N'], desc: 'Previous / Next Track' },
                { keys: ['Ctrl+D'], desc: 'Toggle Dark / Light Theme' },
                { keys: ['?'], desc: 'Toggle Shortcuts Help Modal' }
              ].map((s, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{s.desc}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {s.keys.map((k, kIdx) => (
                      <kbd 
                        key={kIdx}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'var(--accent-primary)',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.5)',
                          textShadow: '0 0 8px var(--accent-glow)',
                          fontFamily: 'system-ui, sans-serif'
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '10px' }}>
              Press <kbd style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}>?</kbd> anytime to toggle this modal.
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}

export default App;
