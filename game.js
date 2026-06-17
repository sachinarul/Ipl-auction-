// ============================================================
// game.js — Main Game Controller (v2)
// Screens, tabs, state management, squad rendering
// All teams start with 0 players — auction fills them
// ============================================================

// ─── Game State ───────────────────────────────────────────────────────────────
const gameState = {
  myTeam: null,
  auctionType: "mega",
  season: 1,
  myPurse: 120,             // ₹120 Cr
  mySquad: [],              // always starts empty
  myRTMCards: 2,
  allTeams: [],             // deep copy of IPL_TEAMS — all start with squad: []
  auctionComplete: false,
  auctionSets: [
    { id: 1, name: "MARQUEE", enabled: true },
    { id: 2, name: "SET 1", enabled: true },
    { id: 3, name: "SET 2", enabled: true },
    { id: 4, name: "SET 3", enabled: true },
    { id: 5, name: "SET 4", enabled: true },
    { id: 6, name: "BA1", enabled: true },
    { id: 7, name: "AL1", enabled: true },
    { id: 8, name: "WK1", enabled: true },
    { id: 9, name: "FA1", enabled: true },
    { id: 10, name: "SP1", enabled: true },
    { id: 11, name: "UBA1", enabled: true },
    { id: 12, name: "UAL1", enabled: true },
    { id: 13, name: "UWK1", enabled: true },
    { id: 14, name: "UFA1", enabled: true },
    { id: 15, name: "USP1", enabled: true },
    { id: 16, name: "BA2", enabled: true },
    { id: 17, name: "AL2", enabled: true },
    { id: 18, name: "WK2", enabled: true },
    { id: 19, name: "FA2", enabled: true },
    { id: 20, name: "SP2", enabled: true },
    { id: 21, name: "UBA2", enabled: true },
    { id: 22, name: "UAL2", enabled: true },
    { id: 23, name: "UWK2", enabled: true },
    { id: 24, name: "UFA2", enabled: true },
    { id: 25, name: "USP2", enabled: true },
    { id: 26, name: "AL3", enabled: true },
    { id: 27, name: "FA3", enabled: true },
    { id: 28, name: "UBA3", enabled: true },
    { id: 29, name: "UAL3", enabled: true },
    { id: 30, name: "UWK3", enabled: true },
    { id: 31, name: "UFA3", enabled: true },
    { id: 32, name: "USP3", enabled: true },
    { id: 33, name: "AL4", enabled: true },
    { id: 34, name: "FA4", enabled: true },
    { id: 35, name: "UBA4", enabled: true },
    { id: 36, name: "UAL4", enabled: true },
    { id: 37, name: "UFA4", enabled: true },
    { id: 38, name: "USP4", enabled: true },
    { id: 39, name: "FA5", enabled: true },
    { id: 40, name: "UAL5", enabled: true },
    { id: 41, name: "UFA5", enabled: true },
    { id: 42, name: "UAL6", enabled: true },
    { id: 43, name: "UFA6", enabled: true },
    { id: 44, name: "UAL7", enabled: true },
    { id: 45, name: "UAL8", enabled: true },
    { id: 46, name: "UAL9", enabled: true },
    { id: 47, name: "UAL10", enabled: true }
  ]
};

// ─── 1. Init Lobby ────────────────────────────────────────────────────────────
function initLobby() {
  const grid = document.getElementById("team-grid");
  if (!grid) return;

  grid.innerHTML = IPL_TEAMS.map(team => `
    <div class="team-card"
         id="card-${team.id}"
         onclick="selectTeam('${team.id}')"
         style="--team-color: ${team.primaryColor}">
      <div class="card-emoji">${team.emoji}</div>
      <div class="card-abbr">${team.abbr}</div>
      <div class="card-name">${team.name}</div>
      <div class="card-strategy">${team.strategy}</div>
    </div>
  `).join("");

  renderSetConfigurator();
}

function renderSetConfigurator() {
  const container = document.getElementById("set-config-list");
  if (!container) return;

  container.innerHTML = gameState.auctionSets.map((set, index) => {
    return `
      <div class="set-config-item ${set.enabled ? 'enabled' : 'disabled'}">
        <span class="set-drag-handle">☰</span>
        <span class="set-name-label">${set.name}</span>
        <div class="set-actions">
          <button class="set-order-btn" onclick="moveSet(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="set-order-btn" onclick="moveSet(${index}, 1)" ${index === gameState.auctionSets.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="set-toggle-btn ${set.enabled ? 'active' : ''}" onclick="toggleSet(${index})">
            ${set.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function moveSet(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= gameState.auctionSets.length) return;

  // Swap
  const temp = gameState.auctionSets[index];
  gameState.auctionSets[index] = gameState.auctionSets[targetIndex];
  gameState.auctionSets[targetIndex] = temp;

  renderSetConfigurator();
  saveGameToLocalStorage();
}

function toggleSet(index) {
  gameState.auctionSets[index].enabled = !gameState.auctionSets[index].enabled;
  renderSetConfigurator();
  saveGameToLocalStorage();
}

// ─── 2. Select Team ───────────────────────────────────────────────────────────
function selectTeam(teamId) {
  gameState.myTeam = IPL_TEAMS.find(t => t.id === teamId) || null;
  if (!gameState.myTeam) return;

  document.querySelectorAll(".team-card").forEach(c => c.classList.remove("selected"));
  const card = document.getElementById(`card-${teamId}`);
  if (card) card.classList.add("selected");

  const btn = document.getElementById("btn-start-game");
  if (btn) { btn.disabled = false; btn.classList.add("ready"); }

  const info = document.getElementById("selected-team-info");
  if (info) {
    info.textContent = `${gameState.myTeam.emoji} ${gameState.myTeam.name} selected`;
    info.style.display = "block";
  }
}

// ─── 3. Select Auction Type ───────────────────────────────────────────────────
function selectAuctionType(type) {
  gameState.auctionType = type;
  document.querySelectorAll(".auction-type-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.type === type);
  });
}

// ─── 4. Start Game ────────────────────────────────────────────────────────────
function startGame() {
  if (!gameState.myTeam) {
    alert("Please select a team first!"); return;
  }

  // *** ALL TEAMS START WITH ZERO PLAYERS — this is the core mechanic ***
  gameState.allTeams = IPL_TEAMS.map(team => ({
    ...team,
    squad: [],       // ← EMPTY — auction fills this
    purse: AUCTION_RULES.startingPurse,
    rtmCards: 2,
    targets: { ...team.targets }
  }));

  // Set my team reference to the allTeams copy
  gameState.myTeam    = gameState.allTeams.find(t => t.id === gameState.myTeam.id);
  gameState.myPurse   = AUCTION_RULES.startingPurse;
  gameState.mySquad   = [];
  gameState.myRTMCards = 2;
  gameState.auctionComplete = false;

  showScreen("screen-hq");
  updateHQHeader();
  renderSquad();
  showTab("tab-squad");
  saveGameToLocalStorage();
}

// ─── 5. Show Screen ───────────────────────────────────────────────────────────
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");
}

// ─── 6. Show Tab ──────────────────────────────────────────────────────────────
function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add("active");

  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");

  if (tabId === "tab-season") {
    if (!gameState.allTeams.length) return;
    if (Object.keys(seasonState.points).length === 0) initSeason();
    renderSeasonTab();
  }
  if (tabId === "tab-leaderboard") {
    renderLeaderboard();
  }
  if (tabId === "tab-squad") {
    renderSquad();
  }
}

// ─── 7. Render Squad ──────────────────────────────────────────────────────────
function renderSquad(filterRole = "all") {
  const tbody    = document.getElementById("squad-table-body");
  const emptyMsg = document.getElementById("squad-empty");
  const countEl  = document.getElementById("squad-count");

  let squad = [...gameState.mySquad];
  if (filterRole !== "all") squad = squad.filter(p => p.role === filterRole);

  if (countEl) countEl.textContent = `${gameState.mySquad.length} / ${AUCTION_RULES.maxSquad}`;

  if (!tbody) return;

  if (squad.length === 0) {
    tbody.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  const roleLabel = { BAT: "Batsman", BOWL: "Bowler", AR: "All-Rounder", WK: "WK-Bat" };

  tbody.innerHTML = squad.map(p => `
    <tr>
      <td>
        <div class="player-name-cell">
          <span class="p-flag">${p.flag || "🏳️"}</span>
          <div>
            <span class="p-name">${p.name}</span>
            <span class="p-country">${p.country}</span>
          </div>
        </div>
      </td>
      <td><span class="role-badge role-${p.role.toLowerCase()}">${roleLabel[p.role] || p.role}</span></td>
      <td><strong class="ovr-num">${p.overall}</strong></td>
      <td>${p.batting}</td>
      <td>${p.bowling}</td>
      <td class="price-cell">${p.soldPrice ? `₹${formatCr(p.soldPrice)}` : "—"}</td>
    </tr>
  `).join("");
}

// ─── 8. Filter Squad ─────────────────────────────────────────────────────────
function filterSquad(role, btn) {
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderSquad(role);
}

// ─── 9. Enter Auction Hall ───────────────────────────────────────────────────
function enterAuctionHall() {
  if (!gameState.myTeam || !gameState.allTeams.length) {
    alert("Please start the game first!"); return;
  }

  showScreen("screen-auction");

  // Update broadcast ticker with team name
  const ticker = document.getElementById('broadcast-ticker');
  if (ticker && gameState.myTeam) {
    const t = gameState.myTeam;
    ticker.innerHTML = `
      <span class="ticker-item">🏏 <span>AUCTIONVERSE 3.0</span> — LIVE IPL MEGA AUCTION</span>
      <span class="ticker-item">${t.emoji} <span>${t.name}</span> has entered the arena with ₹${t.purse || 120} Crore</span>
      <span class="ticker-item">🔨 Place your bids before the gavel falls!</span>
      <span class="ticker-item">📋 <span>10 Franchises</span> competing for the finest players</span>
      <span class="ticker-item">💰 Starting purse: <span>₹120 Crore</span> per franchise</span>
      <span class="ticker-item">⚡ Marquee players up first — don't miss your chance!</span>
      <span class="ticker-item">🌍 Overseas player limit: <span>8 per squad</span></span>
    `;
  }

  // Brief delay for DOM to render before starting timers
  setTimeout(() => {
    initAuction(gameState.myTeam.id);
  }, 200);
}

// ─── 10. Exit Auction ─────────────────────────────────────────────────────────
function exitAuction() {
  clearAllTimers();
  auctionRunning = false;

  showScreen("screen-hq");
  updateHQHeader();
  renderSquad();
  showTab("tab-squad");
  saveGameToLocalStorage();
}

// ─── 11. On Player Sold to Me ─────────────────────────────────────────────────
function onPlayerSoldToMe(player, amount) {
  // Add to mySquad (not the allTeams copy — auction.js handles that)
  const already = gameState.mySquad.find(p => p.id === player.id);
  if (!already) {
    gameState.mySquad.push({ ...player, soldPrice: amount, currentTeam: gameState.myTeam.id });
  }

  gameState.myPurse = parseFloat((gameState.myPurse - amount).toFixed(2));
  updatePurseDisplay();
  saveGameToLocalStorage();
}

// ─── 12. Update Purse Display ────────────────────────────────────────────────
function updatePurseDisplay() {
  const purseStr = `₹${gameState.myPurse.toFixed(1)} Cr`;
  document.querySelectorAll(".purse-display").forEach(el => {
    el.textContent = purseStr;
  });
}

// ─── HQ Header ───────────────────────────────────────────────────────────────
function updateHQHeader() {
  const team = gameState.myTeam;
  if (!team) return;

  const teamInfoEl = document.getElementById("hq-team-info");
  if (teamInfoEl) {
    teamInfoEl.innerHTML = `
      <span class="hq-emoji">${team.emoji}</span>
      <span class="hq-name">${team.name}</span>
    `;
  }

  updatePurseDisplay();
  renderSquadRoleSummary();
}

// Shows a small role summary in HQ header area
function renderSquadRoleSummary() {
  const el = document.getElementById("squad-role-summary");
  if (!el) return;
  const sq = gameState.mySquad;
  const roles = { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
  sq.forEach(p => { roles[p.role] = (roles[p.role] || 0) + 1; });
  el.innerHTML = `
    <span class="rs-item rs-bat">🏏 ${roles.BAT} BAT</span>
    <span class="rs-item rs-bowl">🎳 ${roles.BOWL} BOWL</span>
    <span class="rs-item rs-ar">⭐ ${roles.AR} AR</span>
    <span class="rs-item rs-wk">🧤 ${roles.WK} WK</span>
    <span class="rs-item">👥 ${sq.length}/${AUCTION_RULES.maxSquad}</span>
  `;
}

// ─── 13. Save Game ────────────────────────────────────────────────────────────
function saveGameToLocalStorage() {
  try {
    const save = {
      version: 2,
      myTeamId: gameState.myTeam ? gameState.myTeam.id : null,
      auctionType: gameState.auctionType,
      season: gameState.season,
      myPurse: gameState.myPurse,
      mySquad: gameState.mySquad,
      myRTMCards: gameState.myRTMCards,
      auctionComplete: gameState.auctionComplete,
      allTeams: gameState.allTeams.map(t => ({
        id: t.id,
        purse: t.purse,
        squad: t.squad,
        rtmCards: t.rtmCards
      })),
      auctionSets: gameState.auctionSets,
      seasonState: {
        fixtures: seasonState.fixtures,
        results:  seasonState.results,
        points:   seasonState.points
      }
    };
    localStorage.setItem("iplGameSave_v2", JSON.stringify(save));
  } catch (e) {
    console.warn("Could not save game:", e);
  }
}

// ─── 14. Load Game ────────────────────────────────────────────────────────────
function loadGameFromLocalStorage() {
  try {
    const raw = localStorage.getItem("iplGameSave_v2");
    if (!raw) return false;

    const save = JSON.parse(raw);
    if (!save || save.version !== 2 || !save.myTeamId) return false;

    gameState.auctionType     = save.auctionType || "mega";
    gameState.season          = save.season || 1;
    gameState.myPurse         = save.myPurse ?? 120;
    gameState.mySquad         = save.mySquad || [];
    gameState.myRTMCards      = save.myRTMCards ?? 2;
    gameState.auctionComplete = save.auctionComplete || false;
    if (save.auctionSets) {
      gameState.auctionSets = save.auctionSets;
    }

    gameState.allTeams = IPL_TEAMS.map(baseTeam => {
      const saved = save.allTeams?.find(t => t.id === baseTeam.id);
      return {
        ...baseTeam,
        squad:    saved?.squad    || [],
        purse:    saved?.purse    ?? AUCTION_RULES.startingPurse,
        rtmCards: saved?.rtmCards ?? 2,
        targets: { ...baseTeam.targets }
      };
    });

    gameState.myTeam = gameState.allTeams.find(t => t.id === save.myTeamId);

    if (save.seasonState) {
      Object.assign(seasonState, save.seasonState);
    }

    if (gameState.myTeam) {
      showScreen("screen-hq");
      updateHQHeader();
      renderSquad();
      showToast("Game loaded! Welcome back 🏏", "success");
      return true;
    }
  } catch (e) {
    console.warn("Could not load saved game:", e);
  }
  return false;
}

// ─── Page Load ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initLobby();
  selectAuctionType("mega");

  // Try to restore saved game; if not, stay on lobby
  const loaded = loadGameFromLocalStorage();
  if (!loaded) {
    showScreen("screen-lobby");
  }

  // Auction type toggle buttons
  document.querySelectorAll(".auction-type-btn").forEach(btn => {
    btn.addEventListener("click", () => selectAuctionType(btn.dataset.type));
  });
});
