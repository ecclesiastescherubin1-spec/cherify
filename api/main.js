import https from 'https';

const httpsGetHtml = (url) => new Promise((resolve, reject) => {
  const get = (url) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  };
  get(url);
});

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
      } else if (type === 'album') {
        const result = await m.Album.search({ query });
        const albums = (result?.results || result?.data?.results || []).slice(0, 20);
        return res.end(JSON.stringify(albums.map(a => {
          let imageUrl = a.images?.[2]?.url || a.images?.[1]?.url || a.images?.[0]?.url || a.image?.[2]?.link || a.image?.[0]?.link || '';
          imageUrl = imageUrl.replace(/50x50|150x150/g, '500x500');
          if (!imageUrl || imageUrl.includes('default') || imageUrl.includes('missing')) {
            imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || a.title || 'Album')}&background=random&size=500`;
          }
          return {
            id: a.id,
            name: a.name || a.title || 'Unknown Album',
            artist: a.primaryArtists || a.artist || 'Unknown Artist',
            img: imageUrl
          };
        })));
      } else {
        const result = await m.Song.search({ query });
        const songs = (result?.results || result?.data?.results || []).slice(0, 20);
        return res.end(JSON.stringify(songs.map(formatSong)));
      }
    }

    if (pathname.includes('/api/youtube-search')) {
      const query = searchParams.get('q');
      try {
        const html = await httpsGetHtml(`https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}&sp=EgIQAQ%253D%253D`);
        const match = html.match(/ytInitialData\s*=\s*({.+?});/);
        if (match) {
          const json = JSON.parse(match[1]);
          const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
          const videos = [];
          for (const item of contents) {
            if (item.videoRenderer) {
              const vr = item.videoRenderer;
              const videoId = vr.videoId;
              if (!videoId) continue;
              const title = vr.title?.runs?.[0]?.text || '';
              // Filter out obvious noise or non-songs if needed, but let's keep it simple
              const artist = vr.ownerText?.runs?.[0]?.text || '';
              let coverUrl = vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || '';
              if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
              const durationStr = vr.lengthText?.simpleText || '0:00';
              const parts = durationStr.split(':').map(Number);
              let duration = 0;
              if (parts.length === 2) duration = parts[0] * 60 + parts[1];
              else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
              
              videos.push({
                id: `yt-${videoId}`,
                youtubeId: videoId,
                title,
                artist,
                album: 'YouTube Music',
                coverUrl,
                duration,
                type: 'youtube'
              });
            }
          }
          return res.end(JSON.stringify(videos.slice(0, 15)));
        }
      } catch (err) {
        console.error("YouTube search error:", err);
      }
      return res.end(JSON.stringify([]));
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
      
      let plainLyrics = '';
      let syncedLyrics = '';
      
      try {
        let lrcData = await httpsGet(`https://lrclib.net/api/search?track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`);
        if (!lrcData || !Array.isArray(lrcData) || lrcData.length === 0) {
          const cleanSong = songName.split('(')[0].split('-')[0].trim();
          lrcData = await httpsGet(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanSong)}&artist_name=${encodeURIComponent(artistName)}`);
        }
        if (!lrcData || !Array.isArray(lrcData) || lrcData.length === 0) {
          lrcData = await httpsGet(`https://lrclib.net/api/search?q=${encodeURIComponent(artistName + ' ' + songName)}`);
        }
        
        if (lrcData && lrcData[0]) {
          plainLyrics = lrcData[0].plainLyrics || lrcData[0].lyrics || '';
          syncedLyrics = lrcData[0].syncedLyrics || '';
        }
      } catch (err) {}

      if (!plainLyrics && id) {
        try {
          const lyricsObj = await m.Song.getLyrics(id);
          plainLyrics = lyricsObj?.lyrics || '';
        } catch (e) {}
      }

      return res.end(JSON.stringify({ 
        lyrics: plainLyrics || '', 
        syncedLyrics: syncedLyrics || '' 
      }));
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
}
