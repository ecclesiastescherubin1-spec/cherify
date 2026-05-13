export const fetchLyrics = async (songId, songTitle, artist) => {
  try {
    const response = await fetch(`/api/lyrics?id=${encodeURIComponent(songId)}&title=${encodeURIComponent(songTitle)}&artist=${encodeURIComponent(artist)}`);
    const data = await response.json();
    
    if (data.lyrics && data.lyrics.length > 5) {
      // Clean and split lyrics
      const lines = data.lyrics
        .replace(/<br\s*\/?>/gi, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      
      return {
        original: lines,
        translated: lines, // Translation would need another API call
        lang: 'Original'
      };
    }
  } catch (err) {
    console.warn("Failed to fetch real lyrics, using generated fallback", err);
  }

  // Fallback for songs without real lyrics
  const fallback = [
    `Verse 1: ${songTitle}`,
    `Performing by ${artist}`,
    "...",
    "Searching for the rhythm",
    "Feeling the vibe of this melody",
    "Cherify brings you the soul of music",
    "...",
    "Ending on a high note."
  ];

  return {
    original: fallback,
    translated: fallback,
    lang: 'English'
  };
};
