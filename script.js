const universeIds = [
  3232589243,
  8122362497,
  6537024096,
  6981450333,
  8193090582,
  8171547030,
  7997208413,
  7814701351,
  8214303681,
  8149179907,
  4277647261,
  7505844597,
  7563760340,
  7735871938,
  8641005108,
  8585817451,
  8611671744,
  6903320368,
  7478457834,
];


const gamesContainer = document.getElementById("games");
const totalPlayersEl = document.getElementById("totalPlayers");
const totalVisitsEl = document.getElementById("totalVisits");
const searchInput = document.getElementById("gameSearch");
const sortSelect = document.getElementById("sortSelect");

let cachedGames = [];

function createSkeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
    </div>
  `;
}

function createGameCard(data) {
  const playLink = data.id ? `https://www.roblox.com/games/${data.id}` : '#';
  return `
    <div class="game-card">
      <div class="media-wrap">
        <img src="${data.image}" alt="${data.name}">
        <span class="badge">👥 ${data.playing.toLocaleString()}</span>
      </div>
      <div class="card-content">
        <h3>${data.name}</h3>
        <p>👁️ ${data.visits.toLocaleString()} visits</p>
        <a href="${playLink}" target="_blank" rel="noopener noreferrer">Play Now</a>
      </div>
    </div>
  `;
}

function animateCount(element, target) {
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 100));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    element.textContent = current.toLocaleString();
  }, 15);
}

function renderGames(list) {
  if (!gamesContainer) return;
  gamesContainer.innerHTML = list.map(createGameCard).join('');
}

function applyFiltersAndRender() {
  let list = [...cachedGames];
  if (searchInput && searchInput.value) {
    const q = searchInput.value.toLowerCase();
    list = list.filter(g => g.name.toLowerCase().includes(q));
  }
  if (sortSelect) {
    const v = sortSelect.value;
    if (v === 'playing') list.sort((a, b) => b.playing - a.playing);
    else if (v === 'visits') list.sort((a, b) => b.visits - a.visits);
    else if (v === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  }
  renderGames(list);
}

async function loadGames() {
  if (gamesContainer) {
    gamesContainer.innerHTML = universeIds.map(() => createSkeletonCard()).join('');
  }

  const universeIdStr = universeIds.join(',');

  const corsProxy = "https://corsproxy.io/?";
  const gameAPI = `${corsProxy}https://games.roblox.com/v1/games?universeIds=${universeIdStr}`;
  const thumbAPI = `${corsProxy}https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIdStr}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`;

  try {
    const [gameRes, thumbRes] = await Promise.all([
      fetch(gameAPI),
      fetch(thumbAPI)
    ]);

    if (!gameRes.ok || !thumbRes.ok) {
      throw new Error("Failed to fetch game or thumbnail data");
    }

    const gamesData = (await gameRes.json()).data || [];
    const thumbsData = (await thumbRes.json()).data || [];

    const thumbMap = {};
    for (const thumb of thumbsData) {
      thumbMap[thumb.targetId] = thumb.imageUrl || "https://via.placeholder.com/512/1a1a1a/ffffff?text=No+Image";
    }

    let totalPlayers = 0;
    let totalVisits = 0;
    const usable = [];

    for (const game of gamesData) {
      const imageUrl = thumbMap[game.id] || "https://via.placeholder.com/512/1a1a1a/ffffff?text=No+Image";

      const gameInfo = {
        id: game.rootPlaceId,
        name: game.name || "Unknown Game",
        playing: game.playing || 0,
        visits: game.visits || 0,
        image: imageUrl
      };

      if (!gameInfo.id || gameInfo.name === "Unknown Game") continue;

      totalPlayers += gameInfo.playing;
      totalVisits += gameInfo.visits;
      usable.push(gameInfo);
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


if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndRender);

loadGames();
setInterval(loadGames, 60000); // Refresh every 60 seconds
