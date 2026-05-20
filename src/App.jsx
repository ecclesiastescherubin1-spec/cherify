import React, { useRef, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import PlaybackBar from './components/PlaybackBar';
import MobileNav from './components/MobileNav';
import RightSidebar from './components/RightSidebar';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';
import Welcome from './components/Welcome';

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
  const { showWelcome, currentTrack } = React.useContext(PlayerContext);
  const playerRef = useRef(null);
  const handleRef = useRef(null);

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

  if (showWelcome) return <Welcome />;

  const isYoutubePlaying = currentTrack?.type === 'youtube';

  return (
    <div className="app-container">
      <Sidebar />
      <MainView />
      <RightSidebar />
      <MobileNav />
      <PlaybackBar />
      
      {/* Floating YouTube Player Container */}
      <div 
        ref={playerRef} 
        className={`yt-floating-player ${isYoutubePlaying ? 'visible' : ''}`}
      >
        <div ref={handleRef} className="yt-drag-handle">
          <div className="yt-drag-dots">⋮⋮</div>
          <span className="yt-drag-title">Floating Player</span>
        </div>
        <YoutubePlayer />
      </div>
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
