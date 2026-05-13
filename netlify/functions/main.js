const https = require('https');

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

const formatSong = (song) => ({
  id: song.id,
  title: song.name || song.title || 'Unknown',
  artist: song.artists?.primary?.[0]?.name || 'Unknown Artist',
  album: song.album?.title || song.album?.name || '',
  coverUrl: song.images?.[2]?.url || song.images?.[1]?.url || song.images?.[0]?.url || '',
  duration: song.duration || 0,
  encryptedUrl: song.media?.encryptedUrl || ''
});

exports.handler = async (event) => {
  const { path, queryStringParameters: searchParams } = event;
  const m = await import('@saavn-labs/sdk');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    if (path.includes('/api/search')) {
      const query = searchParams.q;
      const result = await m.Song.search({ query });
      const songs = (result?.results || result?.data?.results || []).slice(0, 20);
      return { statusCode: 200, headers, body: JSON.stringify(songs.map(formatSong)) };
    }

    if (path.includes('/api/trending')) {
      const result = await m.Song.search({ query: 'top hits' });
      const songs = (result?.results || result?.data?.results || []).slice(0, 12);
      return { statusCode: 200, headers, body: JSON.stringify(songs.map(formatSong)) };
    }

    if (path.includes('/api/stream')) {
      const encUrl = searchParams.url;
      const streams = await m.Song.experimental.fetchStreamUrls(encUrl, 'node', true);
      const best = streams.find(s => s.bitrate === '320kbps') || streams[streams.length - 1];
      return { statusCode: 200, headers, body: JSON.stringify({ streamUrl: best?.url || '' }) };
    }

    if (path.includes('/api/lyrics')) {
      const id = searchParams.id;
      const songName = searchParams.title || '';
      const artistName = searchParams.artist || '';
      
      let finalLyrics = '';
      try {
        const lyricsObj = await m.Song.getLyrics(id);
        finalLyrics = lyricsObj?.lyrics || '';
      } catch (e) {}

      if (!finalLyrics || finalLyrics.length < 10) {
        try {
          const lrcData = await httpsGet(`https://lrclib.net/api/search?track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`);
          if (lrcData && lrcData[0]) {
            finalLyrics = lrcData[0].lyrics || lrcData[0].plainLyrics || '';
          }
          if (!finalLyrics) {
            const broadData = await httpsGet(`https://lrclib.net/api/search?q=${encodeURIComponent(artistName + ' ' + songName)}`);
            finalLyrics = broadData && broadData[0] ? (broadData[0].lyrics || broadData[0].plainLyrics || '') : '';
          }
        } catch(e) {}
      }
      return { statusCode: 200, headers, body: JSON.stringify({ lyrics: finalLyrics || '' }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not Found' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
