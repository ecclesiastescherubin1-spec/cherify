import https from 'https';

const httpsGet = (url) => new Promise((resolve, reject) => {
  const get = (url) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve([]); }
      });
    }).on('error', reject);
  };
  get(url);
});

const formatSong = (song) => {
  let img = song.images?.[2]?.url || song.images?.[1]?.url || song.images?.[0]?.url || '';
  img = img.replace(/50x50|150x150/g, '500x500');
  if (!img || img.includes('default')) {
    img = `https://ui-avatars.com/api/?name=${encodeURIComponent(song.name || song.title || 'Song')}&background=random&size=500&font-size=0.33`;
  }
  return {
    id: song.id,
    title: song.name || song.title || 'Unknown',
    artist: song.artists?.primary?.[0]?.name || 'Unknown Artist',
    album: song.album?.title || song.album?.name || '',
    coverUrl: img,
    duration: song.duration || 0,
    encryptedUrl: song.media?.encryptedUrl || ''
  };
};

export default async function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const m = await import('@saavn-labs/sdk');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (pathname.includes('/api/search')) {
      const query = searchParams.get('q');
      const type = searchParams.get('type') || 'song';
      
      if (type === 'artist') {
        const result = await m.Artist.search({ query });
        const artists = (result?.results || result?.data?.results || []).slice(0, 20);
        return res.end(JSON.stringify(artists.map(a => {
          let imageUrl = a.images?.[2]?.url || a.images?.[1]?.url || a.images?.[0]?.url || a.image?.[2]?.link || a.image?.[0]?.link || '';
          imageUrl = imageUrl.replace(/50x50|150x150/g, '500x500');
          // If the image is a default placeholder or missing, use a nice UI avatar
          if (!imageUrl || imageUrl.includes('default') || imageUrl.includes('artist-default') || imageUrl.includes('missing')) {
            imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || 'Artist')}&background=random&size=500&font-size=0.33`;
          }
          return {
            id: a.id,
            name: a.name || a.title || 'Unknown',
            img: imageUrl
          };
        })));
      } else {
        const result = await m.Song.search({ query });
        const songs = (result?.results || result?.data?.results || []).slice(0, 20);
        return res.end(JSON.stringify(songs.map(formatSong)));
      }
    }

    if (pathname.includes('/api/trending')) {
      const result = await m.Song.search({ query: 'top hits' });
      const songs = (result?.results || result?.data?.results || []).slice(0, 12);
      return res.end(JSON.stringify(songs.map(formatSong)));
    }

    if (pathname.includes('/api/stream')) {
      const encUrl = searchParams.get('url');
      const streams = await m.Song.experimental.fetchStreamUrls(encUrl, 'node', true);
      const best = streams.find(s => s.bitrate === '320kbps') || streams[streams.length - 1];
      return res.end(JSON.stringify({ streamUrl: best?.url || '' }));
    }

    if (pathname.includes('/api/lyrics')) {
      const id = searchParams.get('id');
      const songName = searchParams.get('title') || '';
      const artistName = searchParams.get('artist') || '';
      
      let finalLyrics = '';
      try {
        const lyricsObj = await m.Song.getLyrics(id);
        finalLyrics = lyricsObj?.lyrics || '';
      } catch (e) {}

      if (!finalLyrics || finalLyrics.length < 10) {
        finalLyrics = await httpsGet(`https://lrclib.net/api/search?track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`);
        if (!finalLyrics) {
          const cleanSong = songName.split('(')[0].split('-')[0].trim();
          finalLyrics = await httpsGet(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanSong)}&artist_name=${encodeURIComponent(artistName)}`);
        }
        if (!finalLyrics) {
          const lrcData = await httpsGet(`https://lrclib.net/api/search?q=${encodeURIComponent(artistName + ' ' + songName)}`);
          finalLyrics = lrcData && lrcData[0] ? (lrcData[0].lyrics || lrcData[0].plainLyrics || '') : '';
        }
      }
      return res.end(JSON.stringify({ lyrics: finalLyrics || '' }));
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
}
