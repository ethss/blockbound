async function loadGames() {
  if (gamesContainer) {
    gamesContainer.innerHTML = universeIds.map(() => createSkeletonCard()).join('');
  }

  const universeIdStr = universeIds.join(',');

  try {
    const [gameRes, thumbRes] = await Promise.all([
      fetch(`https://games.roproxy.com/v1/games?universeIds=${universeIdStr}`),
      fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeIdStr}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`)
    ]);

    if (!gameRes.ok || !thumbRes.ok) {
      throw new Error("Failed to fetch game or thumbnail data");
    }

    const gamesData = (await gameRes.json()).data || [];
    const thumbsData = (await thumbRes.json()).data || [];

    // Build a quick lookup for thumbnails by universeId
    const thumbsMap = {};
    for (const thumb of thumbsData) {
      thumbsMap[thumb.targetId] = thumb.imageUrl;
    }

    let totalPlayers = 0;
    let totalVisits = 0;
    const usable = [];

    for (const game of gamesData) {
      const imageUrl = thumbsMap[game.id] || "https://via.placeholder.com/512/1a1a1a/ffffff?text=No+Image";

      usable.push({
        id: game.rootPlaceId,
        name: game.name || "Unknown Game",
        playing: game.playing || 0,
        visits: game.visits || 0,
        image: imageUrl
      });

      totalPlayers += game.playing || 0;
      totalVisits += game.visits || 0;
    }

    cachedGames = usable;
    animateCount(totalPlayersEl, totalPlayers);
    animateCount(totalVisitsEl, totalVisits);
    applyFiltersAndRender();
  } catch (err) {
    console.error("Error loading games:", err);
    gamesContainer.innerHTML = `<p class="error">Failed to load games. Please try again later.</p>`;
  }
}
