import React from 'react';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import PlaybackBar from './components/PlaybackBar';
import MobileNav from './components/MobileNav';
import RightSidebar from './components/RightSidebar';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';
import Welcome from './components/Welcome';
import AuthView from './components/AuthView';

const AppContent = () => {
  const { showWelcome, currentTrack } = React.useContext(PlayerContext);
  
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
      <div className={`yt-floating-player ${isYoutubePlaying ? 'visible' : ''}`}>
        <div id="yt-player-iframe"></div>
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
