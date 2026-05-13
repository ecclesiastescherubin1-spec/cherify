import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'saavn-api',
      configureServer(server) {
        
        const formatSong = (song) => ({
          id: song.id,
          title: song.name || song.title || 'Unknown',
          artist: song.artists?.primary?.[0]?.name || 'Unknown Artist',
          album: song.album?.title || song.album?.name || '',
          coverUrl: song.images?.[2]?.url || song.images?.[1]?.url || song.images?.[0]?.url || '',
          duration: song.duration || 0,
          encryptedUrl: song.media?.encryptedUrl || ''
        });

        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url, `http://${req.headers.host}`);
          
          if (url.pathname === '/api/search') {
            console.log('[API] Search:', url.searchParams.get('q'));
            const query = url.searchParams.get('q');
            if (!query) { res.statusCode = 400; return res.end('Query required'); }

            import('@saavn-labs/sdk').then(m => {
              m.Song.search({ query }).then(result => {
                const songs = (result?.results || result?.data?.results || []).slice(0, 20);
                const formatted = songs.map(formatSong);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(formatted));
              }).catch(err => {
                console.error('[saavn search error]', err.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              });
            }).catch(next);
            return;
          }

          if (url.pathname === '/api/trending') {
            console.log('[API] Trending');
            import('@saavn-labs/sdk').then(m => {
              m.Song.search({ query: 'top hits' }).then(result => {
                const songs = (result?.results || result?.data?.results || []).slice(0, 12);
                const formatted = songs.map(formatSong);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(formatted));
              }).catch(err => {
                console.error('[saavn trending error]', err.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              });
            }).catch(next);
            return;
          }

          if (url.pathname === '/api/stream') {
            console.log('[API] Stream URL');
            const encUrl = url.searchParams.get('url');
            if (!encUrl) { res.statusCode = 400; return res.end('Encrypted URL required'); }
            
            import('@saavn-labs/sdk').then(m => {
              m.Song.experimental.fetchStreamUrls(encUrl, 'node', true).then(streams => {
                const best = streams.find(s => s.bitrate === '320kbps') || streams[streams.length - 1];
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ streamUrl: best?.url || '' }));
              }).catch(err => {
                console.error('[saavn stream error]', err.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              });
            }).catch(next);
            return;
          }

          if (url.pathname === '/api/lyrics') {
            const id = url.searchParams.get('id');
            const songName = url.searchParams.get('title') || '';
            const artistName = url.searchParams.get('artist') || '';
            
            if (!id) { res.statusCode = 400; return res.end('Song ID required'); }
            
            import('@saavn-labs/sdk').then(async (m) => {
              let finalLyrics = '';
              
              // 1. Try SDK first
              try {
                const lyricsObj = await m.Song.getLyrics(id);
                finalLyrics = lyricsObj?.lyrics || '';
              } catch (e) {}

              // 2. Try LRCLIB Fallback if needed
              if (!finalLyrics || finalLyrics.length < 10) {
                try {
                  const https = await import('https');
                  const getLrc = (query) => new Promise((resolve) => {
                    https.get(`https://lrclib.net/api/search?${query}`, (lrcRes) => {
                      let data = '';
                      lrcRes.on('data', chunk => data += chunk);
                      lrcRes.on('end', () => {
                        try {
                           const parsed = JSON.parse(data);
                           resolve(parsed && parsed[0] ? (parsed[0].lyrics || parsed[0].plainLyrics || '') : '');
                        } catch(e) { resolve(''); }
                      });
                    }).on('error', () => resolve(''));
                  });

                  // Try exact, then clean, then broad
                  finalLyrics = await getLrc(`track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`);
                  if (!finalLyrics) {
                    const cleanSong = songName.split('(')[0].split('-')[0].trim();
                    finalLyrics = await getLrc(`track_name=${encodeURIComponent(cleanSong)}&artist_name=${encodeURIComponent(artistName)}`);
                  }
                  if (!finalLyrics) {
                    finalLyrics = await getLrc(`q=${encodeURIComponent(artistName + ' ' + songName)}`);
                  }
                } catch (e) {}
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ lyrics: finalLyrics || '' }));
            }).catch(err => {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal server error' }));
            });
            return;
          }

          next();
        });
      }
    }
  ],
})
