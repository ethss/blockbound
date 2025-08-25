const universeIds = [3232589243, 7932044466, 5636005358, 5959478406];

const gamesContainer = document.getElementById("games");
const totalPlayersEl = document.getElementById("totalPlayers");
const totalVisitsEl = document.getElementById("totalVisits");

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
      id: gameData.rootPlaceId, // Use rootPlaceId for the play link
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
        <img src="${data.image}" alt="${data.name}">
        <div class="card-content">
          <h3>${data.name}</h3>
          <p>👥 ${data.playing.toLocaleString()} playing</p>
          <p>👁️ ${data.visits.toLocaleString()} visits</p>
          <a href="${playLink}" target="_blank" rel="noopener noreferrer">Play Now</a>
        </div>
      </div>
    `;
}

function animateCount(element, target) {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 100)); // Animation speed based on target size
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        element.textContent = current.toLocaleString();
    }, 15);
}

async function loadGames() {
  // 1. Show skeleton loaders
  gamesContainer.innerHTML = universeIds.map(() => createSkeletonCard()).join('');

  // 2. Fetch all game data in parallel
  const gameDataPromises = universeIds.map(fetchGameData);
  const allGameData = await Promise.all(gameDataPromises);

  // 3. Process and display data
  let totalPlayers = 0;
  let totalVisits = 0;
  let finalHTML = '';

  for (const data of allGameData) {
    totalPlayers += data.playing;
    totalVisits += data.visits;
    finalHTML += createGameCard(data);
  }
  
  gamesContainer.innerHTML = finalHTML;

  // 4. Update total stats with animation
  animateCount(totalPlayersEl, totalPlayers);
  animateCount(totalVisitsEl, totalVisits);
}

// Initial load
loadGames();

// Refresh every 60 seconds
setInterval(loadGames, 60000);
