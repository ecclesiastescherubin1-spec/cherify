/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useRef } from 'react';
import { getStreamUrl } from '../services/musicService';
import { auth, db } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]);
  const [activeView, setActiveView] = useState('home');
  const [showWelcome, setShowWelcome] = useState(true);
  
  const [user, setUser] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [userAlbums, setUserAlbums] = useState([]);
  const [history, setHistory] = useState([]);
  const [preferredArtists, setPreferredArtists] = useState([]);
  const [loopMode, setLoopMode] = useState('none');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('cherify-accent') || '#818cf8');
  const [sleepTimer, setSleepTimer] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [preMuteVolume, setPreMuteVolume] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sleep Timer Countdown & Linear Fade-Out Effect
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      const fadeOutAndPause = async () => {
        const originalVolume = volume;
        const steps = 10;
        const interval = 300; // total 3 seconds linear fade out
        for (let i = 1; i <= steps; i++) {
          const tempVol = originalVolume * (1 - i / steps);
          setVolume(tempVol);
          if (currentTrack?.type === 'youtube') {
            if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
              window.ytPlayer.setVolume(tempVol * 100);
            }
          } else {
            audioRef.current.volume = tempVol;
          }
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        // Pause track
        setIsPlaying(false);
        if (currentTrack?.type === 'youtube') {
          if (window.ytPlayer && typeof window.ytPlayer.pauseVideo === 'function') {
            window.ytPlayer.pauseVideo();
          }
        } else {
          audioRef.current.pause();
        }

        // Reset volume levels back to user's original volume
        setVolume(originalVolume);
        if (currentTrack?.type === 'youtube') {
          if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
            window.ytPlayer.setVolume(originalVolume * 100);
          }
        } else {
          audioRef.current.volume = originalVolume;
        }
      };
      fadeOutAndPause();
      setSleepTimer(null);
      return;
    }

    const intervalId = setInterval(() => {
      setSleepTimer(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sleepTimer, volume, currentTrack]);



  useEffect(() => {
    const glowMap = {
      '#818cf8': 'rgba(129, 140, 248, 0.45)', // Indigo
      '#ec4899': 'rgba(236, 72, 153, 0.45)', // Pink
      '#10b981': 'rgba(16, 185, 129, 0.45)', // Green
      '#06b6d4': 'rgba(6, 182, 212, 0.45)',  // Cyan
      '#f97316': 'rgba(249, 115, 22, 0.45)'   // Orange
    };
    const glowColor = glowMap[accentColor] || 'rgba(129, 140, 248, 0.45)';
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    document.documentElement.style.setProperty('--text-bright-accent', accentColor);
    document.documentElement.style.setProperty('--accent-glow', glowColor);
  }, [accentColor]);

  const changeAccentColor = (colorHex) => {
    setAccentColor(colorHex);
    localStorage.setItem('cherify-accent', colorHex);
  };

  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    audioRef.current.crossOrigin = 'anonymous';
    
    // 1. Load YouTube Iframe API Script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      try {
        audioContextRef.current = new AudioContextClass();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.error('AudioContext error:', err);
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || 'guest@cherify.com',
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Guest User'),
          isAnonymous: firebaseUser.isAnonymous
        });
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (hasSeenWelcome) setShowWelcome(false);
      } else {
        setUser(null);
        // Always show welcome screen for unauthenticated visitors to ensure premium onboarding
        setShowWelcome(true);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-Time Firestore Listener for User Data
  useEffect(() => {
    if (!user || user.id === 'guest') {
      try {
        const guestLikedStr = localStorage.getItem('guestLikedSongs');
        const guestLiked = guestLikedStr ? JSON.parse(guestLikedStr) : [];
        setLikedSongs(Array.isArray(guestLiked) ? guestLiked : []);

        const guestArtistsStr = localStorage.getItem('guestArtists');
        const guestArtists = guestArtistsStr ? JSON.parse(guestArtistsStr) : [];
        setPreferredArtists(Array.isArray(guestArtists) ? guestArtists : []);
      } catch (e) {
        setLikedSongs([]);
        setPreferredArtists([]);
      }
      setUserPlaylists([]);
      setUserAlbums([]);
      setHistory([]);
      return;
    }

    const userDocRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.likedSongs) setLikedSongs(data.likedSongs);
        if (data.playlists) setUserPlaylists(data.playlists);
        if (data.albums) setUserAlbums(data.albums);
        if (data.preferredArtists) setPreferredArtists(data.preferredArtists);
        if (data.history) setHistory(data.history);
        
        // Update user profile info without triggering a re-subscription loop
        setUser(prev => {
          if (prev.name === data.name && prev.profileImg === data.profileImg) return prev;
          return { ...prev, name: data.name || prev.name, profileImg: data.profileImg || prev.profileImg };
        });
      } else {
        setDoc(userDocRef, {
          email: user.email,
          name: user.name,
          likedSongs: [],
          playlists: [],
          albums: [],
          preferredArtists: [],
          history: []
        }).catch(err => console.error("Init error:", err));
      }
    }, (error) => console.error("Firestore error:", error));

    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    window.setPlayerIsPlaying = (val) => {
      setIsPlaying(val);
    };
    window.setTrackDuration = (d) => {
      setDuration(d);
    };
  }, []);

  // Poll progress for YouTube tracks
  useEffect(() => {
    let interval;
    if (isPlaying && currentTrack?.type === 'youtube') {
      interval = setInterval(() => {
        if (window.ytPlayer && typeof window.ytPlayer.getCurrentTime === 'function') {
          setProgress(window.ytPlayer.getCurrentTime());
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id, currentTrack?.type]);

  // Player Logic (Same as before but stable)
  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => setProgress(audio.currentTime);
    const handleEnded = () => loopMode === 'one' ? (audio.currentTime = 0, audio.play()) : playNext();
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [loopMode, playNext]);

  useEffect(() => {
    audioRef.current.volume = volume;
    if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
      window.ytPlayer.setVolume(volume * 100);
    }
  }, [volume]);

  const removeFromQueue = (trackId) => {
    setQueue(prev => {
      const idx = prev.findIndex(t => String(t.id) === String(trackId));
      if (idx === -1) return prev;
      
      const track = prev[idx];
      const newQueue = prev.filter(t => String(t.id) !== String(trackId));
      showToast(`Removed "${track.title}" from queue`, 'info');
      
      if (idx < currentIndex) {
        setCurrentIndex(prevIndex => prevIndex - 1);
      } else if (idx === currentIndex) {
        if (newQueue.length > 0) {
          const nextIndex = idx % newQueue.length;
          setCurrentIndex(nextIndex);
          setCurrentTrack(newQueue[nextIndex]);
        } else {
          setCurrentTrack(null);
          setCurrentIndex(-1);
          setIsPlaying(false);
          if (window.ytPlayer && typeof window.ytPlayer.stopVideo === 'function') {
            window.ytPlayer.stopVideo();
          }
        }
      }
      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setCurrentIndex(currentTrack ? 0 : -1);
    showToast('Queue cleared', 'info');
  };

  const addToQueue = (track) => {
    if (!track) return;
    setQueue(prev => {
      if (prev.some(t => String(t.id) === String(track.id))) {
        showToast(`"${track.title}" is already in the queue`, 'info');
        return prev;
      }
      showToast(`Added "${track.title}" to queue`, 'success');
      return [...prev, track];
    });
  };

  const playTrack = async (track, trackList = null) => {
    if (!track) return;
    initAudioContext();
    setIsLoading(true);
    try {
      if (trackList) {
        setQueue(trackList);
        const index = trackList.findIndex(t => String(t.id) === String(track.id));
        setCurrentIndex(index !== -1 ? index : 0);
      } else {
        const index = queue.findIndex(t => String(t.id) === String(track.id));
        if (index !== -1) {
          setCurrentIndex(index);
        } else {
          setQueue([track]);
          setCurrentIndex(0);
        }
      }

      setCurrentTrack(track);
      setProgress(0);

      if (track.type === 'youtube') {
        // Pause JioSaavn stream
        audioRef.current.pause();
        
        // Play YouTube Video
        const startYoutube = () => {
          if (window.ytPlayer && typeof window.ytPlayer.loadVideoById === 'function') {
            window.ytPlayer.loadVideoById(track.youtubeId);
            window.ytPlayer.setVolume(volume * 100);
            setDuration(track.duration || 0);
            setIsPlaying(true);
          }
        };

        if (window.ytPlayer && typeof window.ytPlayer.loadVideoById === 'function') {
          startYoutube();
        } else {
          setTimeout(startYoutube, 1000);
        }
      } else {
        // Pause YouTube Video
        if (window.ytPlayer && typeof window.ytPlayer.pauseVideo === 'function') {
          window.ytPlayer.pauseVideo();
        }

        let streamUrl = track.streamUrl;
        if (!streamUrl && track.encryptedUrl) {
          streamUrl = await getStreamUrl(track.encryptedUrl);
        }
        if (!streamUrl) { setIsLoading(false); return; }

        const updatedTrack = { ...track, streamUrl };
        setCurrentTrack(updatedTrack);
        audioRef.current.src = streamUrl;
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playErr) {
          console.warn("Autoplay block or playback failed:", playErr);
          setIsPlaying(false);
        }
      }

      // Save to History in Firestore
      if (user) {
        const userDocRef = doc(db, 'users', user.id);
        const sanitizedTrack = JSON.parse(JSON.stringify(track));
        updateDoc(userDocRef, {
          history: arrayUnion(sanitizedTrack)
        });
      }
    } catch (err) { console.error("PlayTrack error:", err); }
    setIsLoading(false);
  };

  // Handle direct shared song redirection parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    const ytId = params.get('yt');

    const loadSharedTrack = async () => {
      if (trackId) {
        setShowWelcome(false);
        setIsLoading(true);
        try {
          const res = await fetch(`/api/song-details?id=${trackId}`);
          const song = await res.json();
          if (song && !song.error) {
            playTrack(song);
          }
        } catch (e) {
          console.error("Failed to load shared track:", e);
        }
        setIsLoading(false);
      } else if (ytId) {
        setShowWelcome(false);
        const title = params.get('title') || 'Shared YouTube Track';
        const artist = params.get('artist') || 'Unknown Artist';
        const cover = params.get('cover') || 'https://images.unsplash.com/photo-1621360841013-c76831f1628f?w=100&h=100&fit=crop';
        const duration = parseInt(params.get('duration') || '0');

        const ytTrack = {
          id: `yt-${ytId}`,
          youtubeId: ytId,
          title: decodeURIComponent(title),
          artist: decodeURIComponent(artist),
          album: 'YouTube Music',
          coverUrl: decodeURIComponent(cover),
          duration: duration,
          type: 'youtube'
        };
        playTrack(ytTrack);
      }
    };

    loadSharedTrack();
    if (trackId || ytId) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.playNextTrack = () => {
      playNext();
    };
  }, [playNext]);

  function playNext() {
    if (queue.length === 0) return;
    let nextIndex = shuffleMode ? Math.floor(Math.random() * queue.length) : (currentIndex + 1) % queue.length;
    if (nextIndex === 0 && loopMode === 'none') { setIsPlaying(false); return; }
    playTrack(queue[nextIndex]);
  }

  const togglePlay = () => {
    if (!currentTrack) return;
    initAudioContext();
    if (currentTrack.type === 'youtube') {
      if (window.ytPlayer && typeof window.ytPlayer.getPlayerState === 'function') {
        const state = window.ytPlayer.getPlayerState();
        if (state === 1) {
          window.ytPlayer.pauseVideo();
          setIsPlaying(false);
        } else {
          window.ytPlayer.playVideo();
          setIsPlaying(true);
        }
      }
    } else {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    if (currentTrack?.type === 'youtube') {
      if (progress > 3) { seek(0); return; }
    } else {
      if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex]);
  };

  const toggleLike = async (track) => {
    if (!track || !track.id) return;
    const currentLiked = Array.isArray(likedSongs) ? likedSongs : [];
    const isLiked = currentLiked.some(s => s.id === track.id);
    if (!user) {
      const updated = isLiked ? currentLiked.filter(s => s.id !== track.id) : [...currentLiked, track];
      setLikedSongs(updated);
      try {
        localStorage.setItem('guestLikedSongs', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save guestLikedSongs to localStorage:", e);
      }
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.id);
      // Sanitize track to remove any undefined properties which cause Firestore errors
      const sanitizedTrack = JSON.parse(JSON.stringify(track));
      await updateDoc(userDocRef, {
        likedSongs: isLiked ? arrayRemove(currentLiked.find(s => s.id === track.id)) : arrayUnion(sanitizedTrack)
      });
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const addToPlaylist = async (playlistId, track) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    const updatedPlaylists = userPlaylists.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => s.id === track.id)) return p;
        return { ...p, songs: [...p.songs, track] };
      }
      return p;
    });
    await updateDoc(userDocRef, { playlists: updatedPlaylists });
  };

  const createPlaylist = async (name) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    const newPlaylist = { 
      id: Date.now().toString(), 
      name, 
      songs: [], 
      image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop' 
    };
    await updateDoc(userDocRef, { playlists: arrayUnion(newPlaylist) });
  };

  const deletePlaylist = async (playlistId) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    const updatedPlaylists = userPlaylists.filter(p => p.id !== playlistId);
    await updateDoc(userDocRef, { playlists: updatedPlaylists });
    if (activeView === `playlist-${playlistId}`) {
      setActiveView('home');
    }
  };

  const renamePlaylist = async (playlistId, newName) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    const updatedPlaylists = userPlaylists.map(p => {
      if (p.id === playlistId) {
        return { ...p, name: newName };
      }
      return p;
    });
    await updateDoc(userDocRef, { playlists: updatedPlaylists });
  };

  const toggleAlbumSelection = async (album) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    const safeAlbums = userAlbums || [];
    const exists = safeAlbums.find(a => a.id === album.id);
    let updatedAlbums;
    if (exists) {
      updatedAlbums = safeAlbums.filter(a => a.id !== album.id);
    } else {
      updatedAlbums = [...safeAlbums, { id: album.id, name: album.name || album.title || 'Unknown Album', img: album.img || album.coverUrl || '', artist: album.artist || 'Unknown Artist', type: 'album' }];
    }
    await updateDoc(userDocRef, { albums: updatedAlbums });
  };

  const loginUser = (email, password) => {
    if (typeof email === 'object') {
      return signInWithEmailAndPassword(auth, email.email, email.password);
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerUser = async (email, password, name) => {
    let finalEmail = email;
    let finalPassword = password;
    let finalName = name;
    
    if (typeof email === 'object') {
      finalEmail = email.email;
      finalPassword = email.password;
      finalName = email.name;
    }

    // const { updateProfile } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, finalPassword);
    if (finalName) {
      await updateProfile(userCredential.user, { displayName: finalName });
    }
    return userCredential;
  };
  const logoutUser = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    localStorage.removeItem('hasSeenWelcome');
    setShowWelcome(true);
    setPreferredArtists([]); // Clear artists on logout
    return signOut(auth);
  };

  const loginAnonymously = () => signInAnonymously(auth);
  
  const resetPassword = (email) => {
    sendPasswordResetEmail(auth, email)
      .then(() => alert("Password reset link sent to your email!"))
      .catch(err => alert(err.message));
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    await updateDoc(userDocRef, updates);
    // UI will update automatically via the onSnapshot listener
  };

  const toggleArtistSelection = async (artist) => {
    if (!artist || !artist.id) return;
    const safeArtists = Array.isArray(preferredArtists) ? preferredArtists : [];
    const exists = safeArtists.find(a => a.id === artist.id);
    let updatedArtists;
    
    if (exists) {
      updatedArtists = safeArtists.filter(a => a.id !== artist.id);
    } else {
      updatedArtists = [...safeArtists, { id: artist.id, name: artist.name || artist.title || 'Unknown', img: artist.img || artist.coverUrl || '', type: 'artist' }];
    }

    // Optimistic UI update
    setPreferredArtists(updatedArtists);

    if (!user) {
      try {
        localStorage.setItem('guestArtists', JSON.stringify(updatedArtists));
      } catch (e) {
        console.error("Failed to save guestArtists to localStorage:", e);
      }
      return;
    }
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        preferredArtists: updatedArtists
      });
    } catch (err) {
      console.error("Error toggling artist:", err);
      // Revert on failure
      setPreferredArtists(safeArtists);
    }
  };

  const seek = (time) => {
    if (currentTrack?.type === 'youtube') {
      if (window.ytPlayer && typeof window.ytPlayer.seekTo === 'function') {
        window.ytPlayer.seekTo(time, true);
        setProgress(time);
      }
    } else {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Toggle Mute Helper
  const toggleMute = () => {
    if (volume > 0) {
      setPreMuteVolume(volume);
      setVolume(0);
      if (currentTrack?.type === 'youtube') {
        if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
          window.ytPlayer.setVolume(0);
        }
      } else {
        audioRef.current.volume = 0;
      }
    } else {
      const targetVol = preMuteVolume || 0.5;
      setVolume(targetVol);
      if (currentTrack?.type === 'youtube') {
        if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
          window.ytPlayer.setVolume(targetVol * 100);
        }
      } else {
        audioRef.current.volume = targetVol;
      }
    }
  };

  // Keyboard Shortcuts Keydown Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bypasses triggers if active element is typing-focused
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, progress + 10));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, progress - 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => {
            const nextVol = Math.min(1, parseFloat((v + 0.05).toFixed(2)));
            if (currentTrack?.type === 'youtube') {
              if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
                window.ytPlayer.setVolume(nextVol * 100);
              }
            } else {
              audioRef.current.volume = nextVol;
            }
            return nextVol;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => {
            const nextVol = Math.max(0, parseFloat((v - 0.05).toFixed(2)));
            if (currentTrack?.type === 'youtube') {
              if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
                window.ytPlayer.setVolume(nextVol * 100);
              }
            } else {
              audioRef.current.volume = nextVol;
            }
            return nextVol;
          });
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'n':
        case 'N':
          playNext();
          break;
        case 'p':
        case 'P':
          playPrev();
          break;
        case '?':
          setShowShortcutsModal(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, progress, duration, playNext, playPrev, volume, currentTrack, preMuteVolume]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume, setVolume,
      playTrack, togglePlay, playNext, playPrev, seek, formatTime,
      queue, setQueue, removeFromQueue, clearQueue, addToQueue, isLoading, likedSongs, toggleLike, activeView, setActiveView,
      showWelcome, setShowWelcome, user, register: registerUser, login: loginUser, logout: logoutUser,
      loginAnonymously, isAuthLoading,
      userPlaylists, createPlaylist, deletePlaylist, renamePlaylist, preferredArtists, setPreferredArtists,
      userAlbums, toggleAlbumSelection,
      selectedArtists, toggleArtistSelection,
      analyserRef,
      toggleFullscreen: () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
      },
      loopMode, toggleLoop: () => setLoopMode(prev => ['none', 'one', 'all'][(['none', 'one', 'all'].indexOf(prev) + 1) % 3]),
      shuffleMode, setShuffleMode, history, addToPlaylist, resetPassword, updateUserProfile,
      accentColor, changeAccentColor,
      sleepTimer, setSleepTimer,
      showShortcutsModal, setShowShortcutsModal,
      toggleMute,
      toast,
      showToast
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
