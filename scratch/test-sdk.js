import { Song } from '@saavn-labs/sdk';

async function run() {
  try {
    console.log("Searching...");
    const searchResult = await Song.search({ query: 'Perfect' });
    const songs = searchResult?.results || searchResult?.data?.results || searchResult || [];
    console.log("Found search songs count:", songs.length);
    if (songs.length > 0) {
      const first = songs[0];
      console.log("First song sample:", JSON.stringify(first).slice(0, 200));
      const songId = first.id;
      console.log(`Fetching details for ID: ${songId}`);
      try {
        const details = await Song.getById({ songIds: [songId] });
        console.log("Details Success:", JSON.stringify(details).slice(0, 500));
      } catch (e) {
        console.log("getById failed for searched song ID:", e.message);
        try {
          const details2 = await Song.getById({ songIds: songId });
          console.log("Details Success (string):", JSON.stringify(details2).slice(0, 500));
        } catch (e2) {
          console.log("getById string failed too:", e2.message);
        }
      }
    }
  } catch (err) {
    console.error("General error:", err);
  }
}
run();
