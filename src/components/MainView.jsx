import { useEffect, useState, useRef, useContext } from 'react';
import { ChevronLeft, ChevronRight, User, Play, Search, Loader, Heart, Plus, ListPlus, Check, Minus, Edit, Trash2, Info } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
import { searchMusic, fetchTopSongs, fetchFeaturedPlaylists, searchYouTube } from '../services/musicService';
import AuthView from './AuthView';
import ProfileView from './ProfileView';

const Card = ({ title, desc, img, isArtist, isLiked, onPlay, onLike, onAdd, onQueue, isPlayingTrack, isAlbumMode }) => (
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
      {!isArtist && (onAdd || onQueue) && (
        <div className="card-actions-container">
          {onAdd && (
            <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onAdd(); }} title="Add to Playlist">
              <Plus size={18} />
            </button>
          )}
          {onQueue && (
            <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onQueue(); }} title="Add to Queue">
              <ListPlus size={18} />
            </button>
          )}
        </div>
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
  const { playTrack, currentTrack, activeView, setActiveView, likedSongs, toggleLike, preferredArtists, history, userPlaylists, addToPlaylist, selectedArtists, toggleArtistSelection, userAlbums, toggleAlbumSelection, queue, removeFromQueue, clearQueue, addToQueue } = useContext(PlayerContext);
  
  const [topSongs, setTopSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('song');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [recentQueries, setRecentQueries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearchQueries') || '[]');
    } catch (e) {
      return [];
    }
  });

  const saveSearchQuery = (query) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      localStorage.setItem('recentSearchQueries', JSON.stringify(updated));
      return updated;
    });
  };
  
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
        saveSearchQuery(searchQuery);
        if (searchMode === 'song') {
          try {
            const [saavnRes, ytRes] = await Promise.all([
              searchMusic(searchQuery, 'song', 20),
              searchYouTube(searchQuery)
            ]);
            setSearchResults(Array.isArray(saavnRes) ? saavnRes : []);
            setYoutubeResults(Array.isArray(ytRes) ? ytRes : []);
          } catch (err) {
            console.error("Search failed:", err);
            setSearchResults([]);
            setYoutubeResults([]);
          }
        } else {
          const results = await searchMusic(searchQuery, searchMode, 20);
          setSearchResults(Array.isArray(results) ? results : []);
          setYoutubeResults([]);
        }
        setIsLoading(false);
      } else {
        setIsSearching(false);
        setSearchResults([]);
        setYoutubeResults([]);
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
              {/* Option 1: Premium Info disclaimer banner */}
              <div className="search-disclaimer-banner">
                <Info size={16} className="disclaimer-icon" />
                <span>Cherify searches regional hits from JioSaavn and global hits from YouTube.</span>
              </div>

              <div className="search-tabs">
                <button className={`search-tab ${searchMode === 'song' ? 'active' : ''}`} onClick={() => setSearchMode('song')}>Songs</button>
                <button className={`search-tab ${searchMode === 'artist' ? 'active' : ''}`} onClick={() => setSearchMode('artist')}>Artists</button>
              </div>

              {searchMode === 'song' && searchResults.length > 0 && (
                <>
                  <h2 className="section-title search-section-title">Regional Tracks</h2>
                  <div className="cards-grid">
                    {searchResults.map(item => (
                      <Card 
                        key={item.id} 
                        title={item.title || item.name} 
                        desc={item.artist} 
                        img={item.coverUrl || item.img} 
                        isLiked={likedSongs.some(s => s.id === item.id)} 
                        isArtist={false}
                        onPlay={() => {
                          addToSearchHistory(item);
                          handlePlay(item, searchResults);
                        }} 
                        onLike={() => toggleLike(item)} 
                        onAdd={() => handleAddToPlaylist(item)}
                        onQueue={() => addToQueue(item)}
                        isPlayingTrack={currentTrack?.id === item.id}
                      />
                    ))}
                  </div>
                </>
              )}

              {searchMode === 'artist' && searchResults.length > 0 && (
                <div className="cards-grid">
                  {searchResults.map(item => (
                    <Card 
                      key={item.id} 
                      title={item.name} 
                      desc="Artist" 
                      img={item.img} 
                      isLiked={preferredArtists.some(a => a.id === item.id)} 
                      isArtist={true}
                      onPlay={() => {
                        addToSearchHistory(item);
                        setCurrentArtistObj(item);
                        setActiveView(`artist-${item.id}`);
                      }} 
                      onLike={() => toggleArtistSelection(item)} 
                      onAdd={() => {}}
                      onQueue={() => {}}
                      isPlayingTrack={false}
                    />
                  ))}
                </div>
              )}

              {/* YouTube Fallback Results */}
              {searchMode === 'song' && youtubeResults.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h2 className="section-title search-section-title">Global Fallback Hits</h2>
                  <div className="cards-grid">
                    {youtubeResults.map(item => (
                      <Card 
                        key={item.id} 
                        title={item.title} 
                        desc={item.artist} 
                        img={item.coverUrl} 
                        isLiked={likedSongs.some(s => s.id === item.id)} 
                        isArtist={false}
                        onPlay={() => {
                          addToSearchHistory(item);
                          handlePlay(item, youtubeResults);
                        }} 
                        onLike={() => toggleLike(item)} 
                        onAdd={() => handleAddToPlaylist(item)}
                        onQueue={() => addToQueue(item)}
                        isPlayingTrack={currentTrack?.id === item.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && youtubeResults.length === 0 && (
                <div className="search-empty-state">No tracks found. Try a different search query.</div>
              )}
            </>
          ) : (
            <>
              {recentQueries.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Recent Searches</h2>
                    <button 
                      onClick={() => {
                        setRecentQueries([]);
                        localStorage.removeItem('recentSearchQueries');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '4px 8px'
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {recentQueries.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(q);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '24px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'rgba(255, 255, 255, 0.85)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        className="search-tag-item"
                      >
                        🔍 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

    if (activeView === 'queue') {
      const activeIdx = queue.findIndex(t => t.id === currentTrack?.id);
      const nextUp = activeIdx !== -1 ? queue.slice(activeIdx + 1) : queue;

      return (
        <section className="queue-manager-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Play Queue</h2>
            {queue.length > 1 && (
              <button 
                className="btn-primary" 
                style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '20px' }}
                 onClick={clearQueue}
              >
                Clear Queue
              </button>
            )}
          </div>

          <div style={{ marginBottom: '12px', color: 'var(--text-subdued)', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Now Playing</div>
          {currentTrack ? (
            <div className="queue-now-playing-card">
              <img src={currentTrack.coverUrl} className="queue-now-playing-img" alt={currentTrack.title} />
              <div className="queue-now-playing-info">
                <div className="queue-track-title">{currentTrack.title}</div>
                <div className="queue-track-artist">{currentTrack.artist}</div>
              </div>
              <span className="queue-playing-badge">Now Playing</span>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>No track is currently playing.</div>
          )}

          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-subdued)', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Next Up ({nextUp.length} songs)
            </div>
          </div>

          {nextUp.length > 0 ? (
            <div className="queue-list-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {nextUp.map((track, i) => (
                    <tr key={track.id + '-' + i} className="track-row" onClick={() => playTrack(track, queue)}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-subdued)', width: '40px' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={track.coverUrl} style={{ width: '40px', height: '40px', borderRadius: '4px' }} alt="" />
                          <div>
                            <div style={{ color: 'white', fontWeight: '500' }}>{track.title}</div>
                            <div style={{ color: 'var(--text-subdued)', fontSize: '13px' }}>{track.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                          <button 
                            className="queue-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(track.id);
                            }}
                            title="Remove from queue"
                            style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: '6px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>Queue is empty. Add songs from Search or Playlists!</div>
          )}
        </section>
      );
    }

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
                onQueue={() => addToQueue(track)}
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
                onPlay={() => setActiveView(`playlist-${playlist.id}`)} 
                onAdd={() => {}}
                onQueue={() => {}}
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
  const { likedSongs, toggleLike, currentTrack, isPlaying, userPlaylists, addToPlaylist, addToQueue } = useContext(PlayerContext);
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
                  <button className="list-add-btn" onClick={(e) => handleAdd(e, track)} title="Add to Playlist">
                    <Plus size={18} />
                  </button>
                  <button className="list-add-btn" onClick={(e) => { e.stopPropagation(); addToQueue(track); }} title="Add to Queue">
                    <ListPlus size={18} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(track); }} title="Like">
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
  const { userPlaylists, playTrack, deletePlaylist, renamePlaylist } = useContext(PlayerContext);
  const playlist = (Array.isArray(userPlaylists) ? userPlaylists : []).find(p => p.id === id);
  
  if (!playlist) return <div className="empty-state">Playlist not found</div>;

  const handleRename = () => {
    const newName = prompt("Rename playlist to:", playlist.name);
    if (newName && newName.trim()) {
      renamePlaylist(playlist.id, newName.trim());
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
    }
  };

  return (
    <section>
      <div className="playlist-header-mini">
        <img src={playlist.image} alt="" />
        <div style={{ flex: 1 }}>
          <span className="type">Playlist</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h2 style={{ margin: 0 }}>{playlist.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleRename} 
                title="Rename Playlist"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <Edit size={14} /> Rename
              </button>
              <button 
                onClick={handleDelete} 
                title="Delete Playlist"
                style={{ 
                  background: 'rgba(255,99,71,0.2)', 
                  border: 'none', 
                  color: '#ff6b6b', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,99,71,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,99,71,0.2)'}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
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
