const cleanTitle = (title) => {
  if (!title) return '';
  return title
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\(From.*?\)/gi, '') // Removes (From "Movie")
    .replace(/\[.*?\]/g, '')      // Removes [Brackets]
    .replace(/\s+/g, ' ')         // Collapses extra spaces
    .trim();
};

export const searchMusic = async (query, type = 'song', limit = 20) => {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}&limit=${encodeURIComponent(limit)}`);
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      id: item.id,
      title: cleanTitle(item.title),
      artist: cleanTitle(item.artist),
      album: cleanTitle(item.album),
      coverUrl: item.coverUrl,
      encryptedUrl: item.encryptedUrl,
      duration: item.duration,
      streamUrl: null
    }));
  } catch (err) {
    console.error("Internal search failed:", err);
    return [];
  }
};

export const getStreamUrl = async (encryptedUrl) => {
  try {
    if (!encryptedUrl) return null;
    // Corrected endpoint to match vite.config.js logic
    const response = await fetch(`/api/stream?url=${encodeURIComponent(encryptedUrl)}`);
    const data = await response.json();
    return data.streamUrl; 
  } catch (err) {
    console.error("Internal stream fetch failed:", err);
    return null;
  }
};

export const fetchTopSongs = async () => {
  try {
    const response = await fetch('/api/trending');
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item,
      title: cleanTitle(item.title),
      artist: cleanTitle(item.artist),
      album: cleanTitle(item.album)
    }));
  } catch (err) {
    console.error("Internal trending fetch failed:", err);
    return [];
  }
};

export const fetchFeaturedPlaylists = async () => {
  const categories = ['Trending Now', 'Global Top 50', 'Lofi Chill', 'Party Mix', 'Classical'];
  return categories.map((name, i) => ({
    id: `p-${i}`,
    name,
    description: `Complete ${name} collection.`,
    image: `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&h=500&fit=crop`
  }));
};
