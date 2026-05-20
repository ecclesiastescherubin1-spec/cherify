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

  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    audioRef.current.crossOrigin = 'anonymous';
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      try {
        audioContextRef.current = new AudioContextClass();
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(audioContextRef.current.destination);
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
      if (!user) {
        setLikedSongs([]);
        setUserPlaylists([]);
        setUserAlbums([]);
        setHistory([]);
      }
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

  useEffect(() => { audioRef.current.volume = volume; }, [volume]);

  const playTrack = async (track, trackList = null) => {
    if (!track) return;
    initAudioContext();
    setIsLoading(true);
    try {
      let streamUrl = track.streamUrl;
      if (!streamUrl && track.encryptedUrl) {
        streamUrl = await getStreamUrl(track.encryptedUrl);
      }
      if (!streamUrl) { setIsLoading(false); return; }

      const updatedTrack = { ...track, streamUrl };
      
      if (trackList) {
        setQueue(trackList);
        const index = trackList.findIndex(t => t.id === track.id);
        setCurrentIndex(index !== -1 ? index : 0);
      } else {
        const index = queue.findIndex(t => t.id === track.id);
        if (index !== -1) {
          setCurrentIndex(index);
        } else {
          setQueue([updatedTrack]);
          setCurrentIndex(0);
        }
      }
      
      setCurrentTrack(updatedTrack);
      audioRef.current.src = streamUrl;
      audioRef.current.play();
      setIsPlaying(true);

      // Save to History in Firestore
      if (user) {
        const userDocRef = doc(db, 'users', user.id);
        updateDoc(userDocRef, {
          history: arrayUnion(updatedTrack)
        });
      }
    } catch (err) { console.error("PlayTrack error:", err); }
    setIsLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function playNext() {
    if (queue.length === 0) return;
    let nextIndex = shuffleMode ? Math.floor(Math.random() * queue.length) : (currentIndex + 1) % queue.length;
    if (nextIndex === 0 && loopMode === 'none') { setIsPlaying(false); return; }
    playTrack(queue[nextIndex]);
  }

  const togglePlay = () => {
    if (!currentTrack) return;
    initAudioContext();
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex]);
  };

  const toggleLike = async (track) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    const isLiked = likedSongs.some(s => s.id === track.id);
    await updateDoc(userDocRef, {
      likedSongs: isLiked ? arrayRemove(likedSongs.find(s => s.id === track.id)) : arrayUnion(track)
    });
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

  const addAlbum = async (album) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    await updateDoc(userDocRef, { albums: arrayUnion(album) });
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

  const toggleArtistSelection = (artist) => {
    setSelectedArtists(prev => {
      const exists = prev.find(a => a.id === artist.id);
      if (exists) {
        return prev.filter(a => a.id !== artist.id);
      } else {
        return [...prev, artist];
      }
    });
    // Also switch to home view to show the artists section
    setActiveView('home');
  };

  const seek = (time) => { audioRef.current.currentTime = time; setProgress(time); };
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume, setVolume,
      playTrack, togglePlay, playNext, playPrev, seek, formatTime,
      queue, isLoading, likedSongs, toggleLike, activeView, setActiveView,
      showWelcome, setShowWelcome, user, register: registerUser, login: loginUser, logout: logoutUser,
      loginAnonymously, isAuthLoading,
      userPlaylists, createPlaylist, preferredArtists, setPreferredArtists,
      userAlbums, addAlbum,
      selectedArtists, toggleArtistSelection,
      toggleFullscreen: () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
      },
      loopMode, toggleLoop: () => setLoopMode(prev => ['none', 'one', 'all'][(['none', 'one', 'all'].indexOf(prev) + 1) % 3]),
      shuffleMode, setShuffleMode, history, addToPlaylist, resetPassword, updateUserProfile
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
