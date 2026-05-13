import { useContext } from 'react';
import { Home, Search, Heart } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';

const MobileNav = () => {
  const { activeView, setActiveView } = useContext(PlayerContext);

  return (
    <div className="mobile-nav">
      <div className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
        <Home size={24} />
        <span>Home</span>
      </div>
      <div className={`nav-item ${activeView === 'search' ? 'active' : ''}`} onClick={() => setActiveView('search')}>
        <Search size={24} />
        <span>Search</span>
      </div>
      <div className={`nav-item ${activeView === 'liked' ? 'active' : ''}`} onClick={() => setActiveView('liked')}>
        <Heart size={24} />
        <span>Library</span>
      </div>
    </div>
  );
};

export default MobileNav;
