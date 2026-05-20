import { useEffect, useState, useRef, useContext } from 'react';
import { ChevronLeft, ChevronRight, User, Play, Search, Loader, Heart, Plus, Check, Minus } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
import { searchMusic, fetchTopSongs, fetchFeaturedPlaylists } from '../services/musicService';
import AuthView from './AuthView';
import ProfileView from './ProfileView';

const Card = ({ title, desc, img, isArtist, isLiked, onPlay, onLike, onAdd, isPlayingTrack, isAlbumMode }) => (
  <div className={`card ${isPlayingTrack ? 'active-playing' : ''}`}>
    <div 
      className={`card-img-container ${isArtist ? 'artist' : ''}`} 
      onClick={onPlay}
      style={{ '--card-bg-img': `url(${img || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&h=500&fit=crop'})` }}
    >
      <img src={img || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&h=500&fit=crop'} alt={title} className="card-img" />
      <button className="play-btn">
        {isPlayingTrack ? <Loader size={24} className="spin-animation" color="black" /> : <Play size={24} fill="black" />}
      </button>
      {!isArtist && (
        <button className="card-action-overlay add-btn" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
          <Plus size={18} />
        </button>
      )}
    </div>
    <div className="card-info-footer">
      <div className="card-text" onClick={onPlay}>
        <div className={`card-title ${isPlayingTrack ? 'text-accent' : ''}`}>{title}</div>
        <div className="card-desc">{desc}</div>
      </div>
      <button className="card-like-btn" onClick={(e) => { e.stopPropagation(); onLike(); }}>
        {isArtist ? (
          isLiked ? <Minus size={18} color="var(--text-bright-accent)" /> : <Plus size={18} color="var(--text-subdued)" />
        ) : (
          <Heart size={18} fill={isLiked ? 'var(--text-bright-accent)' : 'none'} color={isLiked ? 'var(--text-bright-accent)' : 'var(--text-subdued)'} />
        )}
      </button>
    </div>
  </div>
);

const BrowseCard = ({ title, color, img, onClick }) => (
  <div className="browse-card" style={{ backgroundColor: color }} onClick={onClick}>
    <span className="browse-card-title">{title}</span>
    <img src={img} className="browse-card-img" alt="" />
  </div>
);

const MainView = () => {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef(null);
  const { playTrack, currentTrack, activeView, setActiveView, likedSongs, toggleLike, preferredArtists, history, userPlaylists, addToPlaylist, selectedArtists, toggleArtistSelection, userAlbums, toggleAlbumSelection } = useContext(PlayerContext);
  
  const [topSongs, setTopSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('song');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  
  const addToSearchHistory = (item) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(x => x.id !== item.id);
      const updated = [item, ...filtered].slice(0, 15);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    const handleScroll = () => setScrolled(el.scrollTop > 50);
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [songs, featured] = await Promise.all([
          fetchTopSongs(),
          fetchFeaturedPlaylists()
        ]);
        
        let personalizedSongs = Array.isArray(songs) ? songs : [];
        if (preferredArtists && preferredArtists.length > 0) {
          const prefNames = preferredArtists.map(a => a.name.toLowerCase());
          personalizedSongs = [
            ...personalizedSongs.filter(s => prefNames.includes(s.artist?.toLowerCase())),
            ...personalizedSongs.filter(s => !prefNames.includes(s.artist?.toLowerCase()))
          ];
        }

        setTopSongs(personalizedSongs);
        setPlaylists(Array.isArray(featured) ? featured : []);
      } catch (err) {
        console.error("Failed to load music data", err);
      }
      setIsLoading(false);
    };
    loadInitialData();
  }, [preferredArtists]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        setIsLoading(true);
        const results = await searchMusic(searchQuery, searchMode, 20);
        setSearchResults(Array.isArray(results) ? results : []);
        setIsLoading(false);
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchMode]);

  const [artistSongs, setArtistSongs] = useState([]);
  const [currentArtistId, setCurrentArtistId] = useState(null);
  const [currentArtistObj, setCurrentArtistObj] = useState(null);

  useEffect(() => {
    if (activeView.startsWith('artist-')) {
      const artistId = activeView.split('-')[1];
      if (artistId !== currentArtistId) {
        const artist = (Array.isArray(preferredArtists) ? preferredArtists : []).find(a => a.id === artistId)
                      || (currentArtistObj?.id === artistId ? currentArtistObj : null)
                      || searchResults.find(a => a.id === artistId);
        
        if (artist) {
          const fetchArtistTopHits = async () => {
            setIsLoading(true);
            const results = await searchMusic(artist.name, 'song', 20);
            setArtistSongs(results);
            setCurrentArtistId(artistId);
            setIsLoading(false);
          };
          fetchArtistTopHits();
        } else {
          setArtistSongs([]);
          setIsLoading(false);
        }
      }
    }
  }, [activeView, preferredArtists, currentArtistId, currentArtistObj, searchResults]);

  const handlePlay = (track, trackList) => {
    playTrack(track, trackList);
  };

  const handleAddToPlaylist = (track) => {
    if (userPlaylists.length === 0) {
      alert("You don't have any playlists yet. Create one in the sidebar!");
      return;
    }
    const playlistNames = userPlaylists.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const choice = prompt(`Add "${track.title}" to which playlist?\n\n${playlistNames}\n\nEnter the number:`);
    if (choice) {
      const index = parseInt(choice) - 1;
      if (userPlaylists[index]) {
        addToPlaylist(userPlaylists[index].id, track);
        alert(`Added to ${userPlaylists[index].name}!`);
      }
    }
  };

  const categories = [
    { title: 'Podcasts', color: '#e13300', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&h=200&fit=crop' },
    { title: 'Made For You', color: '#1e3264', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f924?w=200&h=200&fit=crop' },
    { title: 'Charts', color: '#8d67ab', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop' },
    { title: 'New Releases', color: '#e8115b', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop' },
    { title: 'Discover', color: '#8d67ab', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop' },
    { title: 'Live Events', color: '#7358ff', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&h=200&fit=crop' },
    { title: 'Pop', color: '#148a08', img: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop' },
    { title: 'Hip-Hop', color: '#ba5d07', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f924?w=200&h=200&fit=crop' }
  ];

  const renderContent = () => {
    if (isLoading && !isSearching && activeView === 'home') {
      return (
        <div className="loader-container">
          <Loader size={48} className="spin-animation" color="var(--accent-primary)" />
          <div style={{ color: 'var(--text-subdued)', fontSize: '18px' }}>Fetching your music...</div>
        </div>
      );
    }

    if (activeView === 'auth') return <AuthView />;
    if (activeView === 'profile') return <ProfileView />;
    
    // Artist View
    if (activeView.startsWith('artist-')) {
      const artistId = activeView.split('-')[1];
      const artist = (Array.isArray(preferredArtists) ? preferredArtists : []).find(a => a.id === artistId)
                    || (currentArtistObj?.id === artistId ? currentArtistObj : null)
                    || searchResults.find(a => a.id === artistId);
      
      return (
        <section>
          <div className="artist-banner-perfect">
            <img src={artist?.img || artist?.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&h=500&fit=crop'} className="artist-banner-img" alt="" />
            <div className="artist-banner-info">
              <span className="badge">Verified Artist</span>
              <h1>{artist?.name || artist?.title || 'Unknown Artist'}</h1>
              <div className="stats">24,567,890 monthly listeners</div>
            </div>
          </div>
          <h2 className="section-title">Popular Tracks</h2>
          {artistSongs.length > 0 ? (
            <SongList songs={artistSongs} onPlay={(t) => handlePlay(t, artistSongs)} />
          ) : (
            <div style={{ color: 'var(--text-subdued)', marginTop: '20px' }}>No songs found.</div>
          )}
        </section>
      );
    }

    // Search View
    if (activeView === 'search') {
      return (
        <section>
          {isSearching ? (
            <>
              <h2 className="section-title">Top Results</h2>
              <div className="search-tabs">
                <button className={`search-tab ${searchMode === 'song' ? 'active' : ''}`} onClick={() => setSearchMode('song')}>Songs</button>
                <button className={`search-tab ${searchMode === 'artist' ? 'active' : ''}`} onClick={() => setSearchMode('artist')}>Artists</button>
              </div>
              <div className="cards-grid">
                {searchResults.map(item => (
                  <Card 
                    key={item.id} 
                    title={item.title || item.name} 
                    desc={item.artist} 
                    img={item.coverUrl || item.img} 
                    isLiked={
                      (searchMode === 'artist' || item.type === 'artist') 
                        ? preferredArtists.some(a => a.id === item.id) 
                        : likedSongs.some(s => s.id === item.id)
                    } 
                    isArtist={searchMode === 'artist' || item.type === 'artist'}
                    onPlay={() => {
                      addToSearchHistory(item);
                      if (searchMode === 'song' || item.type === 'song') handlePlay(item, searchResults);
                      else if (searchMode === 'artist' || item.type === 'artist') {
                        setCurrentArtistObj(item);
                        setActiveView(`artist-${item.id}`);
                      }
                    }} 
                    onLike={() => {
                      if (searchMode === 'song' || item.type === 'song') toggleLike(item);
                      else if (searchMode === 'artist' || item.type === 'artist') {
                           toggleArtistSelection(item);
                      }
                    }} 
                    onAdd={() => handleAddToPlaylist(item)}
                    isPlayingTrack={currentTrack?.id === item.id}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {history.length > 0 && (
                <div style={{ marginBottom: '32px', maxWidth: '600px' }}>
                  <h2 className="section-title">Recently Played Songs</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {history.slice(0, 15).map((item, i) => (
                      <div 
                        key={`hist-${item.id}-${i}`} 
                        className="recent-list-item" 
                        onClick={() => handlePlay(item, history)} 
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <img 
                          src={item.coverUrl} 
                          alt="" 
                          style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} 
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ color: 'white', fontWeight: '500', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </div>
                          <div style={{ color: 'var(--text-subdued)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Song • {item.artist}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h2 className="section-title">Browse all</h2>
              <div className="browse-grid">
                {categories.map((cat, i) => (
                  <BrowseCard 
                    key={i} 
                    title={cat.title} 
                    color={cat.color} 
                    img={cat.img} 
                    onClick={() => { setSearchQuery(cat.title); }} 
                  />
                ))}
              </div>
            </>
          )}
        </section>
      );
    }

    if (activeView === 'recents') return (
      <section>
        <h2 className="section-title">Recently Listened</h2>
        <SongList songs={history} onPlay={(t) => handlePlay(t, history)} />
      </section>
    );
    if (activeView === 'liked') return (
      <section>
        <h2 className="section-title">Liked Songs</h2>
        <SongList songs={likedSongs} onPlay={(t) => handlePlay(t, likedSongs)} />
      </section>
    );
    
    // Filtered Views (Playlists, Artists, Albums)
    if (activeView === 'playlists') return (
      <section>
        <h2 className="section-title">Your Playlists</h2>
        <div className="cards-grid">
          {(Array.isArray(userPlaylists) ? userPlaylists : []).map(p => (
            <Card key={p.id} title={p.name} desc={`Playlist • ${p.songs?.length || 0} songs`} img={p.image} onPlay={() => setActiveView(`playlist-${p.id}`)} />
          ))}
        </div>
      </section>
    );

    if (activeView === 'artists') return (
      <section>
        <h2 className="section-title">Your Artists</h2>
        <div className="cards-grid">
          <div className="card add-card-perfect" onClick={() => { setSearchMode('artist'); setActiveView('search'); }}>
            <div className="card-img-container plus-tile">
              <Plus size={48} color="rgba(255,255,255,0.4)" />
            </div>
            <div className="card-info-footer">
              <div className="card-title">Add Artist</div>
              <div className="card-desc">Find more artists</div>
            </div>
          </div>
          {(Array.isArray(preferredArtists) ? preferredArtists : []).map(a => (
            <Card 
              key={a.id} 
              title={a.name} 
              desc="Artist" 
              img={a.img} 
              isArtist 
              isLiked={true} 
              onLike={() => toggleArtistSelection(a)}
              onPlay={() => setActiveView(`artist-${a.id}`)} 
            />
          ))}
        </div>
      </section>
    );

    if (activeView.startsWith('playlist-')) return <PlaylistDetail id={activeView.split('-')[1]} />;
    if (activeView.startsWith('album-')) return <AlbumDetail id={activeView.split('-')[1]} />;

    if (activeView === 'queue') return (
      <section>
        <h2 className="section-title">Queue</h2>
        <div style={{ marginBottom: '20px', color: 'var(--text-subdued)' }}>Now Playing</div>
        {currentTrack && <SongList songs={[currentTrack]} onPlay={() => {}} />}
        <div style={{ marginTop: '40px', marginBottom: '20px', color: 'var(--text-subdued)' }}>Next Up</div>
        <SongList songs={topSongs.slice(0, 10)} onPlay={(t) => handlePlay(t, topSongs)} />
      </section>
    );

    // Default Home View
    return (
      <>
        <section>
          <div className="section-header">
            <h2 className="section-title">Trending Now</h2>
            <span className="show-all" onClick={() => setActiveView('show-all-trending')}>Show all</span>
          </div>
          <div className="cards-grid">
            {(Array.isArray(topSongs) ? topSongs.slice(0, 6) : []).map((track) => (
              <Card 
                key={track.id} 
                title={track.title} 
                desc={track.artist} 
                img={track.coverUrl} 
                isLiked={likedSongs.some(s => s.id === track.id)} 
                onPlay={() => handlePlay(track, topSongs)} 
                onLike={() => toggleLike(track)} 
                onAdd={() => handleAddToPlaylist(track)}
                isPlayingTrack={currentTrack?.id === track.id}
              />
            ))}
          </div>
        </section>

        {selectedArtists.length > 0 && (
          <div className="selected-artists-container">
            {selectedArtists.map(artist => (
              <ArtistSongSection key={artist.id} artist={artist} onPlay={handlePlay} />
            ))}
          </div>
        )}

        <section style={{ marginTop: '40px' }}>
          <div className="section-header">
            <h2 className="section-title">Featured Playlists</h2>
            <span className="show-all" onClick={() => setActiveView('show-all-featured')}>Show all</span>
          </div>
          <div className="cards-grid">
            {(Array.isArray(playlists) ? playlists.slice(0, 6) : []).map((playlist) => (
              <Card 
                key={playlist.id} 
                title={playlist.name} 
                desc={playlist.description} 
                img={playlist.image} 
                onPlay={() => {}} 
              />
            ))}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="main-view" ref={scrollRef}>
      <div className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-arrows">
          <button className="nav-arrow" onClick={() => setActiveView('home')}><ChevronLeft size={24} /></button>
          <button className="nav-arrow" onClick={() => setActiveView('search')}><ChevronRight size={24} /></button>
        </div>
        
        <div className="search-bar">
          <Search size={20} color="rgba(255,255,255,0.6)" />
          <input 
            type="text" 
            placeholder="Search for songs, artists..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeView !== 'search') setActiveView('search');
            }}
          />
        </div>

        <div className="topbar-actions">
          <UserActions />
        </div>
      </div>

      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

const UserActions = () => {
  const { user, setActiveView, isAuthLoading } = useContext(PlayerContext);
  
  if (isAuthLoading) return <div className="loader-mini"><Loader size={18} className="spin-animation" /></div>;

  if (!user) return <button className="btn-primary" onClick={() => setActiveView('auth')}>Sign In</button>;
  
  return (
    <div className="user-profile-display" onClick={() => setActiveView('profile')}>
      <span className="user-name-text">{user.isAnonymous ? 'Guest User' : user.name}</span>
      <div className="profile-btn">
        {user.profileImg ? <img src={user.profileImg} className="profile-img-small" alt="" /> : <User size={18} color="white" />}
      </div>
    </div>
  );
};

const SongList = ({ songs, onPlay }) => {
  const { likedSongs, toggleLike, currentTrack, isPlaying, userPlaylists, addToPlaylist } = useContext(PlayerContext);
  const safeSongs = Array.isArray(songs) ? songs : [];

  const handleAdd = (e, track) => {
    e.stopPropagation();
    if (userPlaylists.length === 0) {
      alert("You don't have any playlists yet. Create one in the sidebar!");
      return;
    }
    const playlistNames = userPlaylists.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const choice = prompt(`Add "${track.title}" to which playlist?\n\n${playlistNames}\n\nEnter the number:`);
    if (choice) {
      const index = parseInt(choice) - 1;
      if (userPlaylists[index]) {
        addToPlaylist(userPlaylists[index].id, track);
      }
    }
  };
  if (safeSongs.length === 0) return <div className="empty-state">No songs found.</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {safeSongs.map((track, i) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <tr key={track.id} className={`track-row ${isCurrent ? 'active-row' : ''}`} onClick={() => onPlay(track)}>
              <td style={{ padding: '12px 8px', color: isCurrent ? 'var(--text-bright-accent)' : 'var(--text-subdued)', width: '40px' }}>
                {isCurrent && isPlaying ? <div className="playing-indicator"><span></span><span></span><span></span></div> : i + 1}
              </td>
              <td style={{ padding: '12px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={track.coverUrl} style={{ width: '40px', height: '40px', borderRadius: '4px' }} alt="" />
                  <div>
                    <div style={{ color: isCurrent ? 'var(--text-bright-accent)' : 'white', fontWeight: '500' }}>{track.title}</div>
                    <div style={{ color: 'var(--text-subdued)', fontSize: '13px' }}>{track.artist}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                  <button className="list-add-btn" onClick={(e) => handleAdd(e, track)}>
                    <Plus size={18} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(track); }}>
                    <Heart size={18} fill={likedSongs.some(s => s.id === track.id) ? 'var(--text-bright-accent)' : 'none'} color={likedSongs.some(s => s.id === track.id) ? 'var(--text-bright-accent)' : 'var(--text-subdued)'} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const PlaylistDetail = ({ id }) => {
  const { userPlaylists, playTrack } = useContext(PlayerContext);
  const playlist = (Array.isArray(userPlaylists) ? userPlaylists : []).find(p => p.id === id);
  if (!playlist) return <div className="empty-state">Playlist not found</div>;
  return (
    <section>
      <div className="playlist-header-mini">
        <img src={playlist.image} alt="" />
        <div>
          <span className="type">Playlist</span>
          <h2>{playlist.name}</h2>
          <span className="count">{playlist.songs?.length || 0} songs</span>
        </div>
      </div>
      <SongList songs={playlist.songs} onPlay={(t) => playTrack(t, playlist.songs)} />
    </section>
  );
};

const AlbumDetail = ({ id }) => {
  const { playTrack } = useContext(PlayerContext);
  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbum = async () => {
      setLoading(true);
      // For now, we search for the album name to get its tracks
      // In a real API, we'd fetch by ID
      const results = await searchMusic(id, 'song', 15); 
      setSongs(results);
      if (results.length > 0) {
        setAlbum({ name: results[0].album, artist: results[0].artist, image: results[0].coverUrl });
      }
      setLoading(false);
    };
    loadAlbum();
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader className="spin-animation" /></div>;
  if (!album) return <div className="empty-state">Album not found</div>;

  return (
    <section>
      <div className="playlist-header-mini">
        <img src={album.image} alt="" />
        <div>
          <span className="type">Album</span>
          <h2>{album.name}</h2>
          <span className="count">By {album.artist} • {songs.length} tracks</span>
        </div>
      </div>
      <SongList songs={songs} onPlay={(t) => playTrack(t, songs)} />
    </section>
  );
};

const ArtistSongSection = ({ artist, onPlay }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtistSongs = async () => {
      setLoading(true);
      try {
        const results = await searchMusic(artist.name, 'song', 15);
        setSongs(results);
      } catch (err) {
        console.error("Failed to load songs for", artist.name, err);
      }
      setLoading(false);
    };
    loadArtistSongs();
  }, [artist]);

  return (
    <section className="artist-songs-section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={artist.img} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>{artist.name}</h2>
            <div style={{ color: 'var(--text-subdued)', fontSize: '14px' }}>Top 15 Tracks</div>
          </div>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Loader className="spin-animation" />
        </div>
      ) : (
        <SongList songs={songs} onPlay={(t) => onPlay(t, songs)} />
      )}
    </section>
  );
};

export default MainView;
