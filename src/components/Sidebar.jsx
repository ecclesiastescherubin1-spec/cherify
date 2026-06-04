import { useContext, useState } from 'react';
import { Home, Search, Library, Plus, ArrowRight, List, Heart, Clock } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
const Sidebar = () => {
  const { activeView, setActiveView, userPlaylists, createPlaylist, preferredArtists, likedSongs, userAlbums } = useContext(PlayerContext);
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
    <div className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-box">
        <div className="nav-links" role="list">
          <div
            className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => setActiveView('home')}
            role="listitem"
            aria-label="Home"
            aria-current={activeView === 'home' ? 'page' : undefined}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setActiveView('home')}
          >
            <Home size={24} />
            <span>Home</span>
          </div>
          <div
            className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
            onClick={() => setActiveView('search')}
            role="listitem"
            aria-label="Search"
            aria-current={activeView === 'search' ? 'page' : undefined}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setActiveView('search')}
          >
            <Search size={24} />
            <span>Search</span>
          </div>
          <div
            className={`nav-link ${activeView === 'recents' ? 'active' : ''}`}
            onClick={() => setActiveView('recents')}
            role="listitem"
            aria-label="Recents"
            aria-current={activeView === 'recents' ? 'page' : undefined}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setActiveView('recents')}
          >
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
            <button className="library-action" onClick={handleCreatePlaylist} aria-label="Create new playlist"><Plus size={16} /></button>
            <button className="library-action" aria-label="Expand library"><ArrowRight size={16} /></button>
          </div>
        </div>
        
        <div className="library-filters" role="group" aria-label="Library filter tabs">
          <button className={`filter-chip ${activeView === 'playlists' ? 'active' : ''}`} onClick={() => setActiveView('playlists')} aria-label="Filter by playlists" aria-pressed={activeView === 'playlists'}>Playlists</button>
          <button className={`filter-chip ${activeView === 'artists' ? 'active' : ''}`} onClick={() => setActiveView('artists')} aria-label="Filter by artists" aria-pressed={activeView === 'artists'}>Artists</button>
        </div>
        
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', alignItems: 'center' }}>
          <div className="library-search-inline">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search in library"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              aria-label="Search your library"
            />
          </div>
          <button style={{ color: 'var(--text-subdued)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }} aria-label="Sort library by recents">
            Recents <List size={16} />
          </button>
        </div>

        <div className="library-list" role="list" aria-label="Your library">
          <div
            className={`playlist-item-row ${activeView === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveView('liked')}
            role="listitem"
            aria-label={`Liked Songs, ${Array.isArray(likedSongs) ? likedSongs.length : 0} songs`}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setActiveView('liked')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} fill="white" color="white" aria-hidden="true" />
            </div>
            <div className="playlist-item-info">
              <span className="playlist-item-name">Liked Songs</span>
              <span className="playlist-item-desc">Playlist • {Array.isArray(likedSongs) ? likedSongs.length : 0} songs</span>
            </div>
          </div>

          {filteredLibrary.map(item => (
            <div
              key={item.id}
              className="playlist-item-row"
              onClick={() => item.type === 'playlist' ? setActiveView(`playlist-${item.id}`) : setActiveView(`artist-${item.id}`)}
              role="listitem"
              aria-label={`${item.name}, ${item.type === 'artist' ? 'Artist' : 'Playlist'}`}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && (item.type === 'playlist' ? setActiveView(`playlist-${item.id}`) : setActiveView(`artist-${item.id}`))}
            >
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
