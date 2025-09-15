const universeIds = [3232589243, 8122362497, 6915315137, 6981450333, 6064308019,8193090582, 5892853733, 8171547030, 7997208413,7814701351,8149179907];

const gamesContainer = document.getElementById("games");
const totalPlayersEl = document.getElementById("totalPlayers");
const totalVisitsEl = document.getElementById("totalVisits");
const searchInput = document.getElementById("gameSearch");
const sortSelect = document.getElementById("sortSelect");
let cachedGames = [];

async function fetchGameData(universeId) {
  try {
    const [gameRes, thumbRes] = await Promise.all([
      fetch(`https://games.roproxy.com/v1/games?universeIds=${universeId}`),
      fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`)
    ]);

    if (!gameRes.ok || !thumbRes.ok) {
        throw new Error(`Failed to fetch data for Universe ID ${universeId}`);
    }

    const gameData = (await gameRes.json()).data?.[0] || {};
    const thumbData = (await thumbRes.json()).data?.[0] || {};

    return {
      id: gameData.rootPlaceId,
      name: gameData.name || "Unknown Game",
      playing: gameData.playing || 0,
      visits: gameData.visits || 0,
      image: thumbData.imageUrl || "https://via.placeholder.com/512/1a1a1a/ffffff?text=No+Image"
    };

  } catch (err) {
    console.error(err);
    return {
      id: null,
      name: "Error Loading Game",
      playing: 0,
      visits: 0,
      image: "https://via.placeholder.com/512/1a1a1a/ffffff?text=Error"
    };
  }
}

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
    if (v === 'playing') list.sort((a,b) => b.playing - a.playing);
    else if (v === 'visits') list.sort((a,b) => b.visits - a.visits);
    else if (v === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
  }
  renderGames(list);
}

async function loadGames() {
  if (gamesContainer) {
    gamesContainer.innerHTML = universeIds.map(() => createSkeletonCard()).join('');
  }

  const gameDataPromises = universeIds.map(fetchGameData);
  const allGameData = await Promise.all(gameDataPromises);

  let totalPlayers = 0;
  let totalVisits = 0;
  const usable = [];

  for (const data of allGameData) {
    if (!data.id || data.name === "Unknown Game" || data.name === "Error Loading Game") {
      continue;
    }
    totalPlayers += data.playing;
    totalVisits += data.visits;
    usable.push(data);
  }

  cachedGames = usable;
  animateCount(totalPlayersEl, totalPlayers);
  animateCount(totalVisitsEl, totalVisits);
  applyFiltersAndRender();
}

if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndRender);

loadGames();
setInterval(loadGames, 60000);
