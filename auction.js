// ============================================================
// auction.js — Live Auction Engine (v2)
// Handles bidding, countdown timer, AI buying, RTM
// Works with the new 200+ player database
// ============================================================

// ─── Global Auction State ────────────────────────────────────────────────────
let auctionPool    = [];     // shuffled player array for this auction
let auctionIndex   = 0;      // current player being auctioned
let currentBid     = 0;      // current highest bid in Cr
let currentBidder  = null;   // team id string or null
let countdown      = 12;     // seconds remaining
let countdownInterval = null;
let aiBidTimeout   = null;
let myTeamId       = null;   // player's chosen team id
let currentPlayer  = null;   // player object on the block
let auctionRunning = false;
let currentSetName = null;   // track transitions between sets

// Stats tracking
let soldCount   = 0;
let unsoldCount = 0;

// ─── 1. Init Auction ──────────────────────────────────────────────────────────
function initAuction(teamId) {
  myTeamId = teamId;
  currentSetName = null;

  // Build the auctionPool based on configured sets
  const groupedPlayers = {};
  
  // Initialize group arrays for each configured set
  gameState.auctionSets.forEach(set => {
    groupedPlayers[set.name] = [];
  });
  
  // Categorize every player from a fresh copy of the pool
  const freshPool = FINAL_PLAYER_POOL.map(p => ({ ...p, soldPrice: null, currentTeam: null }));
  freshPool.forEach(player => {
    const setName = getPlayerSet(player);
    // Find the matching set in our configured sets
    const matchedSet = gameState.auctionSets.find(s => s.name === setName);
    if (matchedSet) {
      groupedPlayers[setName].push(player);
    } else {
      // Fallback to the last set if name didn't match (e.g. Uncapped)
      const lastSet = gameState.auctionSets[gameState.auctionSets.length - 1];
      groupedPlayers[lastSet.name].push(player);
    }
  });

  // Fisher-Yates shuffle helper for a single group
  function shuffleGroup(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Assemble the pool based on active sets order
  let builtPool = [];
  gameState.auctionSets.forEach(set => {
    if (set.enabled) {
      const shuffledGroup = shuffleGroup(groupedPlayers[set.name]);
      builtPool = builtPool.concat(shuffledGroup);
    }
  });

  auctionPool = builtPool;
  auctionIndex = 0;
  soldCount = 0;
  unsoldCount = 0;
  auctionRunning = true;

  // Reset bid log
  const logEl = document.getElementById("bid-log");
  if (logEl) logEl.innerHTML = "";

  // Reset bid panel visibility
  const bidPanel = document.getElementById("bid-panel");
  if (bidPanel) bidPanel.style.display = "";

  updateProgressBar();
  updateTeamsStatusRow();
  loadNextPlayer();
}

// ─── 2. Bid Increment Table ───────────────────────────────────────────────────
// Official IPL-style increment table
function getNextIncrement(bid) {
  if (bid <  1.00) return 0.05;   // 5 Lakh jumps at base level
  if (bid <  2.00) return 0.10;   // 10 Lakh
  if (bid <  5.00) return 0.25;   // 25 Lakh
  if (bid < 10.00) return 0.50;   // 50 Lakh
  if (bid < 20.00) return 1.00;   // 1 Cr
  return 2.00;                     // 2 Cr at 20 Cr+
}

// ─── 3. Load Next Player ─────────────────────────────────────────────────────
function loadNextPlayer() {
  clearAllTimers();
  hideBanners();

  if (auctionIndex >= auctionPool.length) {
    showAuctionComplete();
    return;
  }

  const nextPlayer = auctionPool[auctionIndex];
  let nextSetName = getPlayerSet(nextPlayer);

  if (nextPlayer.isAccelerated) {
    nextSetName = "SET 14 - ACCELERATED AUCTION";
  } else if (nextPlayer.isUnsoldReintro) {
    nextSetName = "SET 15 - UNSOLD ROUND REINTRODUCTION";
  }

  if (currentSetName !== nextSetName) {
    currentSetName = nextSetName;
    showSetAnnouncement(nextSetName, () => {
      actuallyLoadPlayer(nextPlayer);
    });
  } else {
    actuallyLoadPlayer(nextPlayer);
  }
}

function actuallyLoadPlayer(player) {
  currentPlayer = player;
  currentBid    = player.basePrice;
  currentBidder = null;
  
  // Set 14/Accelerated uses a 5s countdown
  countdown = player.isAccelerated ? 5 : 12;

  updateProgressBar();
  renderPlayerSpotlight(currentPlayer);
  updateBidUI();
  updateTeamsStatusRow();

  // Reset log for this player
  const logEl = document.getElementById("bid-log");
  if (logEl) {
    logEl.innerHTML = `<div class="bid-log-header">
      Base price: ₹${formatCr(currentPlayer.basePrice)}
    </div>`;
  }

  startCountdown();
  scheduleAIBid();

  // Auto-refresh stats modal if open
  const modal = document.getElementById("stats-modal");
  if (modal && modal.classList.contains("active")) {
    renderStatsModal();
  }
}

function showSetAnnouncement(setName, callback) {
  const overlay = document.getElementById("set-announcement-overlay");
  const nameEl = document.getElementById("announcement-set-name");
  if (!overlay || !nameEl) {
    if (callback) callback();
    return;
  }

  // Clean name
  const displayName = setName.replace(/^SET\s+\d+\s+-\s+/, "");
  nameEl.textContent = displayName;

  overlay.classList.add("visible");
  playSetTTS(displayName);

  setTimeout(() => {
    overlay.classList.remove("visible");
    setTimeout(() => {
      if (callback) callback();
    }, 400);
  }, 4000);
}

function playSetTTS(setName) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const text = `Now entering: ${setName.toLowerCase()}`;
  const utterance = new SpeechSynthesisUtterance(text);
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.name.includes("Google US English") || 
    voice.name.includes("Microsoft David") || 
    voice.lang.startsWith("en")
  );
  if (preferredVoice) utterance.voice = preferredVoice;
  
  utterance.pitch = 0.95;
  utterance.rate = 0.9;
  utterance.volume = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

// ─── 4. Countdown ────────────────────────────────────────────────────────────
function startCountdown() {
  clearInterval(countdownInterval);
  updateCountdownUI();

  countdownInterval = setInterval(() => {
    countdown--;
    updateCountdownUI();

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      resolveCurrentPlayer();
    }
  }, 1000);
}

function updateCountdownUI() {
  const el = document.getElementById("countdown");
  if (!el) return;
  el.textContent = countdown;
  const isUrgent = (currentPlayer && currentPlayer.isAccelerated) ? countdown <= 2 : countdown <= 3;
  el.classList.toggle("urgent", isUrgent);
}

function resetCountdown(extra = 0) {
  const maxTime = (currentPlayer && currentPlayer.isAccelerated) ? 5 : 12;
  countdown = Math.min(maxTime, countdown + 4 + extra);
  clearInterval(countdownInterval);
  startCountdown();
}

// ─── 5. Schedule AI Bid ──────────────────────────────────────────────────────
function scheduleAIBid() {
  clearTimeout(aiBidTimeout);
  const isAccel = currentPlayer && currentPlayer.isAccelerated;
  const delay = isAccel 
    ? (300 + Math.random() * 600)  // faster reaction (300ms - 900ms)
    : (1000 + Math.random() * 1500);
  aiBidTimeout = setTimeout(runAIBidRound, delay);
}

// ─── 6. AI Bid Round ─────────────────────────────────────────────────────────
function runAIBidRound() {
  if (!auctionRunning || !currentPlayer) return;

  // Filter AI teams (not the player's team)
  const aiTeams = gameState.allTeams.filter(t => t.id !== myTeamId);

  // Randomize order so same team doesn't always win
  const shuffled = [...aiTeams].sort(() => Math.random() - 0.5);

  for (const team of shuffled) {
    if (getAIBidDecision(team, currentPlayer, currentBid)) {
      const increment = getNextIncrement(currentBid);
      currentBid     = parseFloat((currentBid + increment).toFixed(2));
      currentBidder  = team.id;

      updateBidUI();
      updateTeamsStatusRow();
      addBidLog(team.abbr, currentBid, false);
      resetCountdown();

      // Schedule next AI bid
      scheduleAIBid();
      return;
    }
  }
  // No AI bid — let countdown run naturally
}

// ─── 7. Player Bid ───────────────────────────────────────────────────────────
function playerBid() {
  if (!auctionRunning) return;

  const myTeam = gameState.allTeams.find(t => t.id === myTeamId);
  if (!myTeam) return;

  const increment = getNextIncrement(currentBid);
  const nextBid   = parseFloat((currentBid + increment).toFixed(2));

  // Validation checks
  if (myTeam.purse < nextBid) {
    showToast("Not enough purse! 💸", "error"); return;
  }
  if (myTeam.squad.length >= AUCTION_RULES.maxSquad) {
    showToast(`Squad full (max ${AUCTION_RULES.maxSquad})! 🚫`, "error"); return;
  }
  if (currentPlayer.overseas && getOverseasCount(myTeam.squad) >= AUCTION_RULES.maxOverseas) {
    showToast(`Overseas limit reached (max ${AUCTION_RULES.maxOverseas})! 🌍`, "error"); return;
  }

  currentBid    = nextBid;
  currentBidder = myTeamId;

  clearTimeout(aiBidTimeout);
  updateBidUI();
  updateTeamsStatusRow();
  addBidLog("YOU", currentBid, true);
  resetCountdown();

  // AI counter-bids after player bids
  scheduleAIBid();
}

// ─── 8. Player Pass ──────────────────────────────────────────────────────────
function playerPass() {
  if (!auctionRunning) return;
  clearTimeout(aiBidTimeout);
  countdown = 2;
  updateCountdownUI();
}

// ─── 9. RTM Card ─────────────────────────────────────────────────────────────
function playerRTM() {
  if (!auctionRunning) return;

  const myTeam = gameState.allTeams.find(t => t.id === myTeamId);
  if (!myTeam) return;

  if (myTeam.rtmCards <= 0) {
    showToast("No RTM cards left! 🃏", "error"); return;
  }
  if (myTeam.purse < currentBid) {
    showToast("Can't afford RTM! 💸", "error"); return;
  }
  if (myTeam.squad.length >= AUCTION_RULES.maxSquad) {
    showToast("Squad is full! 🚫", "error"); return;
  }

  myTeam.rtmCards--;
  currentBidder = myTeamId;

  clearTimeout(aiBidTimeout);
  updateBidUI();
  updateTeamsStatusRow();
  addBidLog("YOU (RTM)", currentBid, true);

  showToast(`RTM used! ${myTeam.rtmCards} cards remaining. 🃏`, "success");
  resetCountdown(4);
  scheduleAIBid();
}

// ─── 10. Resolve Player ──────────────────────────────────────────────────────
function resolveCurrentPlayer() {
  clearAllTimers();
  auctionRunning = false;

  if (!currentBidder) {
    // UNSOLD
    unsoldCount++;
    showBanner("unsold", `${currentPlayer.name} goes UNSOLD`);
    setTimeout(() => {
      auctionIndex++;
      auctionRunning = true;
      loadNextPlayer();
    }, 2000);

  } else if (currentBidder === myTeamId) {
    // Player wins the bid
    const myTeam = gameState.allTeams.find(t => t.id === myTeamId);
    if (myTeam) {
      const bought = { ...currentPlayer, soldPrice: currentBid, currentTeam: myTeamId };
      myTeam.squad.push(bought);
      myTeam.purse = parseFloat((myTeam.purse - currentBid).toFixed(2));
    }

    soldCount++;
    showBanner("sold", `🔨 ${currentPlayer.name} → YOU  ₹${formatCr(currentBid)}`);

    // Notify game.js controller
    if (typeof onPlayerSoldToMe === "function") {
      onPlayerSoldToMe({ ...currentPlayer, soldPrice: currentBid, currentTeam: myTeamId }, currentBid);
    }

    setTimeout(() => {
      auctionIndex++;
      auctionRunning = true;
      loadNextPlayer();
    }, 2200);

  } else {
    // AI team wins
    const aiTeam = gameState.allTeams.find(t => t.id === currentBidder);
    if (aiTeam) {
      const bought = { ...currentPlayer, soldPrice: currentBid, currentTeam: currentBidder };
      aiTeam.squad.push(bought);
      aiTeam.purse = parseFloat((aiTeam.purse - currentBid).toFixed(2));
    }

    soldCount++;
    const tName = aiTeam ? aiTeam.abbr : currentBidder.toUpperCase();
    showBanner("sold", `🔨 ${currentPlayer.name} → ${tName}  ₹${formatCr(currentBid)}`);

    setTimeout(() => {
      auctionIndex++;
      auctionRunning = true;
      loadNextPlayer();
    }, 2200);
  }
}

// ─── 11. Bid Log ─────────────────────────────────────────────────────────────
function addBidLog(teamName, amount, isUser) {
  const logEl = document.getElementById("bid-log");
  if (!logEl) return;

  const entry = document.createElement("div");
  entry.className = "bid-log-entry";
  entry.innerHTML = `
    <span class="log-team ${isUser ? "log-user" : ""}">${teamName}</span>
    <span class="log-bid">₹${formatCr(amount)}</span>
  `;
  logEl.prepend(entry);

  // Keep log to 30 entries max
  const entries = logEl.querySelectorAll(".bid-log-entry");
  if (entries.length > 30) entries[entries.length - 1].remove();
}

// ─── 12. Progress Bar ────────────────────────────────────────────────────────
function updateProgressBar() {
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  if (!fill || !text) return;

  const total = auctionPool.length;
  const done  = auctionIndex;
  const pct   = total > 0 ? (done / total) * 100 : 0;

  fill.style.width = `${pct}%`;
  text.textContent = `${done} / ${total}  ·  ${soldCount} Sold  ·  ${unsoldCount} Unsold`;
}

// ─── 13. Teams Status Row ────────────────────────────────────────────────────
function updateTeamsStatusRow() {
  const container = document.getElementById("teams-status-row");
  if (!container) return;

  container.innerHTML = gameState.allTeams.map(team => {
    const isActive = team.id === currentBidder;
    const isMe     = team.id === myTeamId;
    const style    = isActive
      ? `border-color: #D4AF37; box-shadow: 0 0 12px rgba(212,175,55,0.5);`
      : `border-color: transparent;`;

    return `
      <div class="team-status-card ${isActive ? "active-bidder" : ""} ${isMe ? "my-team-card" : ""}"
           style="${style}">
        <div class="tsc-emoji">${team.emoji}</div>
        <div class="tsc-abbr">${team.abbr}</div>
        <div class="tsc-purse">₹${team.purse.toFixed(0)}Cr</div>
        <div class="tsc-squad">${team.squad.length}P</div>
        ${isMe ? '<div class="tsc-me">YOU</div>' : ""}
      </div>
    `;
  }).join("");
}

// ─── 14. Bid UI ──────────────────────────────────────────────────────────────
function updateBidUI() {
  const bidAmtEl = document.getElementById("current-bid-amt");
  const bidderEl = document.getElementById("current-bidder");
  const bidBtn   = document.getElementById("btn-bid");
  const rtmBtn   = document.getElementById("btn-rtm");

  if (bidAmtEl) bidAmtEl.textContent = `₹${formatCr(currentBid)}`;

  if (bidderEl) {
    if (!currentBidder) {
      bidderEl.textContent  = "No bids yet — be first!";
      bidderEl.className    = "bidder-name no-bid";
    } else if (currentBidder === myTeamId) {
      bidderEl.textContent  = "🏆 YOU are leading!";
      bidderEl.className    = "bidder-name leading-you";
    } else {
      const t = gameState.allTeams.find(t => t.id === currentBidder);
      bidderEl.textContent  = `${t ? t.emoji : ""} ${t ? t.name : currentBidder} leading`;
      bidderEl.className    = "bidder-name leading-ai";
    }
  }

  if (bidBtn) {
    const next = parseFloat((currentBid + getNextIncrement(currentBid)).toFixed(2));
    bidBtn.textContent = `BID ₹${formatCr(next)}`;
  }

  const myTeam = gameState.allTeams.find(t => t.id === myTeamId);
  if (rtmBtn && myTeam) {
    rtmBtn.textContent = `RTM (${myTeam.rtmCards})`;
    rtmBtn.disabled    = myTeam.rtmCards <= 0;
  }
}

// ─── Player Spotlight ────────────────────────────────────────────────────────
function renderPlayerSpotlight(player) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("player-name",    player.name);
  set("player-flag",    player.flag || FLAG_MAP[player.country] || "🌍");
  set("player-country", player.country);
  set("player-ovr",     player.overall);
  set("stat-bat",       player.batting);
  set("stat-bowl",      player.bowling);
  set("stat-field",     player.fielding);
  set("stat-exp",       player.experience);

  const badge = document.getElementById("player-role-badge");
  if (badge) {
    const roleLabel = { BAT: "Batsman", BOWL: "Bowler", AR: "All-Rounder", WK: "Wicket Keeper" };
    badge.textContent = roleLabel[player.role] || player.role;
    badge.className   = `role-badge role-${player.role.toLowerCase()}`;
  }

  // Age & base price info
  set("player-age",       player.age ? `Age ${player.age}` : "");
  set("player-base-price", `Base ₹${formatCr(player.basePrice)}`);

  // OVR circle
  const ovrCircle = document.getElementById("ovr-circle");
  if (ovrCircle) {
    const deg = (player.overall / 100) * 360;
    ovrCircle.style.background =
      `conic-gradient(var(--gold) ${deg}deg, var(--surface2) 0)`;
  }

  // Form & potential bars
  const formEl = document.getElementById("player-form-bar");
  if (formEl) formEl.style.width = `${player.form || 70}%`;

  const potEl = document.getElementById("player-potential-bar");
  if (potEl) potEl.style.width = `${player.potential || 70}%`;
}

// ─── Banners ─────────────────────────────────────────────────────────────────
function showBanner(type, message = "") {
  hideBanners();
  const id = type === "sold" ? "sold-banner" : "unsold-banner";
  const el = document.getElementById(id);
  if (!el) return;

  const msgEl = el.querySelector(".banner-msg");
  if (msgEl && message) msgEl.textContent = message;

  el.classList.add("visible");
}

function hideBanners() {
  ["sold-banner", "unsold-banner"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("visible");
  });
}

// ─── Auction Complete ─────────────────────────────────────────────────────────
function showAuctionComplete() {
  const spotlight = document.getElementById("player-spotlight");
  if (spotlight) {
    // Find top spender
    const topSpender = [...gameState.allTeams]
      .sort((a, b) => (120 - b.purse) - (120 - a.purse))[0];

    spotlight.innerHTML = `
      <div class="auction-complete">
        <div class="ac-icon">🏆</div>
        <h2>Auction Complete!</h2>
        <p>All <strong>${auctionPool.length}</strong> players auctioned.</p>
        <div class="ac-stats">
          <div class="ac-stat"><span class="ac-num">${soldCount}</span><span class="ac-lbl">Sold</span></div>
          <div class="ac-stat"><span class="ac-num">${unsoldCount}</span><span class="ac-lbl">Unsold</span></div>
          <div class="ac-stat"><span class="ac-num">${gameState.mySquad.length}</span><span class="ac-lbl">Your Squad</span></div>
          <div class="ac-stat"><span class="ac-num">₹${gameState.myPurse.toFixed(1)}Cr</span><span class="ac-lbl">Remaining</span></div>
        </div>
        <button class="btn-primary" onclick="exitAuction()" style="margin-top:20px;">
          🏠 Back to HQ
        </button>
      </div>
    `;
  }

  const bidPanel = document.getElementById("bid-panel");
  if (bidPanel) bidPanel.style.display = "none";

  if (typeof gameState !== "undefined") {
    gameState.auctionComplete = true;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function clearAllTimers() {
  clearInterval(countdownInterval);
  clearTimeout(aiBidTimeout);
}

/**
 * Format Crore value nicely:
 * 0.30 → "30L"   0.75 → "75L"   1.50 → "1.5Cr"   27.00 → "27Cr"
 */
function formatCr(val) {
  if (val < 1) return `${Math.round(val * 100)}L`;
  if (val % 1 === 0) return `${val}Cr`;
  return `${val.toFixed(2)}Cr`;
}

function showToast(msg, type = "info") {
  let toast = document.getElementById("toast-msg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-msg";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = `toast toast-${type} toast-visible`;
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("toast-visible"), 3000);
}

// ─── Stats Board Modal Controller & Renderer ─────────────────────────────────
let activeStatsTab = "stats-upcoming";

function openStatsModal() {
  const modal = document.getElementById("stats-modal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
    renderStatsModal();
  }
}

function closeStatsModal() {
  const modal = document.getElementById("stats-modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      if (!modal.classList.contains("active")) {
        modal.style.display = "none";
      }
    }, 300);
  }
}

function switchStatsTab(tabId) {
  activeStatsTab = tabId;
  
  // Toggle active class on tab buttons
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
  
  // Toggle active class on tab contents
  document.querySelectorAll(".stats-tab-content").forEach(content => {
    content.classList.toggle("active", content.id === tabId);
  });
  
  renderStatsModal();
}

function renderStatsModal() {
  if (activeStatsTab === "stats-upcoming") {
    renderStatsUpcoming();
  } else if (activeStatsTab === "stats-sold") {
    renderStatsSold();
  } else if (activeStatsTab === "stats-unsold") {
    renderStatsUnsold();
  } else if (activeStatsTab === "stats-franchises") {
    renderStatsFranchises();
  }
}

function renderStatsUpcoming() {
  const container = document.getElementById("stats-upcoming");
  if (!container) return;

  const upcoming = auctionPool.slice(auctionIndex);
  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🏁</span>
        <p>No upcoming players — the player pool is complete!</p>
      </div>
    `;
    return;
  }

  // Define sets/slots matching slabs
  const sets = [
    { name: "Marquee Set 1", players: [], matcher: p => p.basePrice === 2.00 && p.overall >= 90 },
    { name: "Set 1 (₹2 Crore Players)", players: [], matcher: p => p.basePrice === 2.00 && p.overall < 90 },
    { name: "Set 2 (₹1.50 Crore Players)", players: [], matcher: p => p.basePrice === 1.50 },
    { name: "Set 3 (₹1.00 Crore Players)", players: [], matcher: p => p.basePrice === 1.00 },
    { name: "Set 4 (₹75 Lakh Players)", players: [], matcher: p => p.basePrice === 0.75 },
    { name: "Set 5 (₹50 Lakh Players)", players: [], matcher: p => p.basePrice === 0.50 },
    { name: "Set 6 (₹30 Lakh Players)", players: [], matcher: p => p.basePrice <= 0.30 }
  ];

  // Distribute players
  upcoming.forEach(p => {
    const matchedSet = sets.find(s => s.matcher(p));
    if (matchedSet) {
      matchedSet.players.push(p);
    } else {
      // Fallback
      sets[sets.length - 1].players.push(p);
    }
  });

  const roleLabel = { BAT: "BAT", BOWL: "BOWL", AR: "AR", WK: "WK" };

  container.innerHTML = sets
    .filter(s => s.players.length > 0)
    .map(s => {
      const cardsHtml = s.players.map(p => {
        const flagEmoji = p.flag || "🌍";
        return `
          <div class="upcoming-player-card">
            <div class="up-card-top">
              <span class="up-card-name" title="${p.name}">${p.name}</span>
              <span class="up-card-role-badge role-${p.role.toLowerCase()}">${roleLabel[p.role]}</span>
            </div>
            <div class="up-card-bottom">
              <span class="up-card-price">₹${formatCr(p.basePrice)}</span>
              <span class="p-flag" style="font-size:14px; margin-right:4px;">${flagEmoji}${p.overseas ? ' 🌍' : ''}</span>
              <span class="up-card-ovr">${p.overall} OVR</span>
            </div>
          </div>
        `;
      }).join("");

      return `
        <div class="set-section">
          <div class="set-header">
            <h3 class="set-title">${s.name}</h3>
            <span class="set-count">${s.players.length} Players</span>
          </div>
          <div class="upcoming-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join("");
}

function renderStatsSold() {
  const container = document.getElementById("stats-sold");
  if (!container) return;

  const sold = [];
  gameState.allTeams.forEach(t => {
    t.squad.forEach(p => {
      sold.push({ ...p, soldTo: t });
    });
  });

  // Sort by soldPrice descending
  sold.sort((a, b) => b.soldPrice - a.soldPrice);

  if (sold.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🏟️</span>
        <p>No players sold yet. Place some bids to get started!</p>
      </div>
    `;
    return;
  }

  const roleLabel = { BAT: "Batsman", BOWL: "Bowler", AR: "All-Rounder", WK: "WK-Bat" };

  container.innerHTML = `
    <div class="stats-table-wrapper">
      <table class="player-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Role</th>
            <th>OVR</th>
            <th>Base Price</th>
            <th>Sold Price</th>
            <th>Signed By</th>
          </tr>
        </thead>
        <tbody>
          ${sold.map(p => {
            const isMyTeam = p.soldTo.id === myTeamId;
            const highlightBuy = p.soldPrice >= 10.0;
            return `
              <tr style="${highlightBuy ? 'background: rgba(212,175,55,0.04);' : ''}">
                <td>
                  <div class="player-name-cell">
                    <span class="p-flag">${p.flag || "🏳️"}</span>
                    <div>
                      <span class="p-name" style="${highlightBuy ? 'color: var(--gold); font-weight:700;' : ''}">${p.name}</span>
                      <span class="p-country">${p.country}</span>
                    </div>
                  </div>
                </td>
                <td><span class="role-badge role-${p.role.toLowerCase()}">${roleLabel[p.role]}</span></td>
                <td><strong class="ovr-num">${p.overall}</strong></td>
                <td>₹${formatCr(p.basePrice)}</td>
                <td><strong style="color: ${highlightBuy ? 'var(--gold-light)' : 'var(--green)'}; font-size:14px;">₹${formatCr(p.soldPrice)}</strong></td>
                <td>
                  <span class="sold-team-tag" style="border-color: ${p.soldTo.primaryColor}50; ${isMyTeam ? 'box-shadow: 0 0 8px var(--gold-dark); border-color: var(--gold);' : ''}">
                    <span>${p.soldTo.emoji}</span>
                    <span><strong>${p.soldTo.abbr}</strong> ${isMyTeam ? '⭐️' : ''}</span>
                  </span>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStatsUnsold() {
  const container = document.getElementById("stats-unsold");
  if (!container) return;

  const soldIds = new Set();
  gameState.allTeams.forEach(t => t.squad.forEach(p => soldIds.add(p.id)));
  const unsold = auctionPool.slice(0, auctionIndex).filter(p => !soldIds.has(p.id));

  if (unsold.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">✔️</span>
        <p>No unsold players currently. Every player auctioned has been sold!</p>
      </div>
    `;
    return;
  }

  const roleLabel = { BAT: "BAT", BOWL: "BOWL", AR: "AR", WK: "WK" };

  container.innerHTML = `
    <div class="set-section">
      <div class="set-header">
        <h3 class="set-title" style="color: var(--red);">Unsold Pool</h3>
        <span class="set-count" style="border-color: var(--red); color: var(--red);">${unsold.length} Players</span>
      </div>
      <div class="upcoming-grid">
        ${unsold.map(p => {
          const isWaiting = auctionPool.slice(auctionIndex).some(queued => queued.id === p.id);
          return `
            <div class="upcoming-player-card" style="border-color: rgba(233, 69, 96, 0.3); justify-content: space-between; display: flex; flex-direction: column; min-height: 120px;">
              <div>
                <div class="up-card-top">
                  <span class="up-card-name" style="color: var(--text-muted);">${p.name}</span>
                  <span class="up-card-role-badge role-${p.role.toLowerCase()}">${roleLabel[p.role]}</span>
                </div>
                <div class="up-card-bottom" style="margin-top: 6px;">
                  <span class="p-flag">${p.flag || "🌍"}${p.overseas ? ' 🌍' : ''}</span>
                  <span class="up-card-ovr" style="color: var(--text-muted); border-color: var(--border); background: transparent;">${p.overall} OVR</span>
                </div>
              </div>
              <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                ${isWaiting 
                  ? `<span class="unsold-reintroduced-badge">Reintroduced</span>` 
                  : `<button class="unsold-reintro-btn" onclick="reintroducePlayer(${p.id})">Reintroduce</button>`
                }
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderStatsFranchises() {
  const container = document.getElementById("stats-franchises");
  if (!container) return;

  // Clone teams list and find their stats
  const sortedFranchises = gameState.allTeams.map(t => {
    // Find biggest buy
    let biggestBuy = null;
    if (t.squad.length > 0) {
      const sortedSquad = [...t.squad].sort((a, b) => b.soldPrice - a.soldPrice);
      biggestBuy = sortedSquad[0];
    }
    const osCount = t.squad.filter(p => p.overseas).length;
    return {
      ...t,
      biggestBuy,
      osCount
    };
  });

  // Sort: User first, then others by purse desc or squad size desc? Let's keep MI, CSK original order or user first
  sortedFranchises.sort((a, b) => {
    if (a.id === myTeamId) return -1;
    if (b.id === myTeamId) return 1;
    return b.purse - a.purse; // sort others by remaining purse desc
  });

  container.innerHTML = `
    <div class="franchises-grid">
      ${sortedFranchises.map(t => {
        const isUser = t.id === myTeamId;
        return `
          <div class="franchise-stat-card ${isUser ? 'user-team' : ''}" style="--team-color: ${t.primaryColor}">
            <div class="f-card-header">
              <div class="f-card-title">
                <span class="f-card-emoji">${t.emoji}</span>
                <span class="f-card-name">${t.name}</span>
              </div>
              ${isUser ? `<span class="f-card-role">YOU</span>` : `<span class="f-card-role" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border);">${t.strategy}</span>`}
            </div>
            
            <div class="f-card-stats">
              <div class="f-card-stat-box">
                <span class="f-card-stat-val" style="color: var(--green);">₹${t.purse.toFixed(1)} Cr</span>
                <span class="f-card-stat-lbl">Purse Left</span>
              </div>
              <div class="f-card-stat-box">
                <span class="f-card-stat-val">${t.squad.length} / 25</span>
                <span class="f-card-stat-lbl">Squad Size (🌍 ${t.osCount})</span>
              </div>
            </div>

            <div class="f-card-big-buy">
              <span class="f-buy-lbl">Biggest Buy</span>
              ${t.biggestBuy ? `
                <span class="f-buy-val" title="${t.biggestBuy.name}">${t.biggestBuy.name} (₹${formatCr(t.biggestBuy.soldPrice)})</span>
              ` : `
                <span class="f-buy-none">No signings</span>
              `}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function reintroducePlayer(playerId) {
  // Find player in the pool by ID
  const player = auctionPool.find(p => p.id === playerId);
  if (!player) return;

  // Verify that the player is indeed unsold
  const isSold = gameState.allTeams.some(t => t.squad.some(p => p.id === playerId));
  if (isSold) {
    showToast("Player already sold!", "error");
    return;
  }

  // Create a copy of the player, flag them, and append to the end of the pool
  const reintroduced = { 
    ...player, 
    isUnsoldReintro: true, 
    isAccelerated: true,
    soldPrice: null,
    currentTeam: null 
  };

  auctionPool.push(reintroduced);
  
  // Show toast
  showToast(`${player.name} reintroduced to Set 15 (Unsold Round)! 🔨`, "success");

  // If the auction was complete, resume it
  if (auctionIndex >= auctionPool.length - 1) {
    const spotlight = document.getElementById("player-spotlight");
    if (spotlight && spotlight.querySelector(".auction-complete")) {
      spotlight.innerHTML = `
        <div class="player-spotlight-header">
          <div class="player-info-left">
            <h2 class="player-name-big" id="player-name">—</h2>
            <div class="player-meta">
              <span class="role-badge" id="player-role-badge">—</span>
              <div class="player-flag-country">
                <span id="player-flag">🏳️</span>
                <span id="player-country">—</span>
              </div>
              <span class="player-age-badge" id="player-age"></span>
            </div>
            <div class="player-base-price" id="player-base-price">Base —</div>
          </div>
          <div class="ovr-circle" id="ovr-circle" style="--ovr-pct: 85%">
            <div class="ovr-inner">
              <span class="ovr-num-big" id="player-ovr">—</span>
              <span class="ovr-label">OVR</span>
            </div>
          </div>
        </div>
        <div class="stat-boxes">
          <div class="stat-box">
            <span class="stat-value" id="stat-bat">—</span>
            <span class="stat-label">Batting</span>
          </div>
          <div class="stat-box">
            <span class="stat-value" id="stat-bowl">—</span>
            <span class="stat-label">Bowling</span>
          </div>
          <div class="stat-box">
            <span class="stat-value" id="stat-field">—</span>
            <span class="stat-label">Fielding</span>
          </div>
          <div class="stat-box">
            <span class="stat-value" id="stat-exp">—</span>
            <span class="stat-label">Experience</span>
          </div>
        </div>
        <div class="mini-stat-bars">
          <div class="mini-bar-row">
            <span class="mini-bar-label">Form</span>
            <div class="mini-bar-track">
              <div class="mini-bar-fill form-fill" id="player-form-bar" style="width:70%"></div>
            </div>
          </div>
          <div class="mini-bar-row">
            <span class="mini-bar-label">Potential</span>
            <div class="mini-bar-track">
              <div class="mini-bar-fill pot-fill" id="player-potential-bar" style="width:70%"></div>
            </div>
          </div>
        </div>
      `;
    }
    
    const bidPanel = document.getElementById("bid-panel");
    if (bidPanel) bidPanel.style.display = "";

    gameState.auctionComplete = false;
    auctionRunning = true;
    
    // Resume by loading next player
    loadNextPlayer();
  } else {
    // Just refresh the unsold tab view
    renderStatsUnsold();
  }
}
