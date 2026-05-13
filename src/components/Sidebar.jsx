import { useContext, useState } from 'react';
import { Home, Search, Library, Plus, ArrowRight, List, Heart, Clock } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
const Sidebar = () => {
  const { activeView, setActiveView, userPlaylists, createPlaylist, preferredArtists, likedSongs } = useContext(PlayerContext);
  const [libSearch, setLibSearch] = useState('');

  const handleCreatePlaylist = () => {
    const name = prompt("Enter playlist name:", "My New Playlist");
    if (name) createPlaylist(name);
  };

  const filteredLibrary = [
    ...(Array.isArray(userPlaylists) ? userPlaylists.map(p => ({ ...p, type: 'playlist' })) : []),
    ...(Array.isArray(preferredArtists) ? preferredArtists.map(a => ({ ...a, type: 'artist' })) : [])
  ].filter(item => (item.name || '').toLowerCase().includes(libSearch.toLowerCase()));

  return (
    <div className="sidebar">
      <div className="sidebar-box">
        <div className="nav-links">
          <div className={`nav-link ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
            <Home size={24} />
            <span>Home</span>
          </div>
          <div className={`nav-link ${activeView === 'search' ? 'active' : ''}`} onClick={() => setActiveView('search')}>
            <Search size={24} />
            <span>Search</span>
          </div>
          <div className={`nav-link ${activeView === 'recents' ? 'active' : ''}`} onClick={() => setActiveView('recents')}>
            <Clock size={24} />
            <span>Recents</span>
          </div>
        </div>
      </div>
      
      <div className="sidebar-box library-section">
        <div className="library-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Library size={24} />
            <span>Your Library</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="library-action" onClick={handleCreatePlaylist}><Plus size={16} /></button>
            <button className="library-action"><ArrowRight size={16} /></button>
          </div>
        </div>
        
        <div className="library-filters">
          <button className={`filter-chip ${activeView === 'playlists' ? 'active' : ''}`} onClick={() => setActiveView('playlists')}>Playlists</button>
          <button className={`filter-chip ${activeView === 'artists' ? 'active' : ''}`} onClick={() => setActiveView('artists')}>Artists</button>
          <button className={`filter-chip ${activeView === 'albums' ? 'active' : ''}`} onClick={() => setActiveView('albums')}>Albums</button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', alignItems: 'center' }}>
          <div className="library-search-inline">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search in library" 
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
            />
          </div>
          <button style={{ color: 'var(--text-subdued)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Recents <List size={16} />
          </button>
        </div>

        <div className="library-list">
          <div className={`playlist-item-row ${activeView === 'liked' ? 'active' : ''}`} onClick={() => setActiveView('liked')}>
            <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} fill="white" color="white" />
            </div>
            <div className="playlist-item-info">
              <span className="playlist-item-name">Liked Songs</span>
              <span className="playlist-item-desc">Playlist • {Array.isArray(likedSongs) ? likedSongs.length : 0} songs</span>
            </div>
          </div>

          {filteredLibrary.map(item => (
            <div key={item.id} className="playlist-item-row" onClick={() => item.type === 'playlist' ? setActiveView(`playlist-${item.id}`) : setActiveView(`artist-${item.id}`)}>
              <img src={item.img || item.image} className={`playlist-item-img ${item.type === 'artist' ? 'artist' : ''}`} alt={item.name} />
              <div className="playlist-item-info">
                <span className="playlist-item-name">{item.name}</span>
                <span className="playlist-item-desc">{item.type === 'artist' ? 'Artist' : 'Playlist'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
