// ============================================================
// season.js — Season Simulation: Fixtures, Results, Points
// ============================================================

const seasonState = {
  fixtures: [],
  results: [],
  points: {}
};

// ─── 1. Init Season ───────────────────────────────────────────────────────────
function initSeason() {
  seasonState.fixtures = generateFixtures();
  seasonState.results = [];
  seasonState.points = {};

  // Initialize points table for all teams
  gameState.allTeams.forEach(team => {
    seasonState.points[team.id] = {
      teamId: team.id,
      played: 0,
      won: 0,
      lost: 0,
      pts: 0,
      nrr: 0.0
    };
  });
}

// ─── 2. Generate Fixtures ─────────────────────────────────────────────────────
function generateFixtures() {
  const fixtures = [];
  const teamIds = gameState.allTeams.map(t => t.id);

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      fixtures.push({
        home: teamIds[i],
        away: teamIds[j],
        played: false
      });
    }
  }

  // Shuffle fixtures
  for (let i = fixtures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
  }

  return fixtures;
}

// ─── 3. Calculate Team Strength ───────────────────────────────────────────────
function calculateTeamStrength(teamId) {
  let squad;

  if (teamId === gameState.myTeam.id) {
    squad = gameState.mySquad;
  } else {
    const team = gameState.allTeams.find(t => t.id === teamId);
    squad = team ? team.squad : [];
  }

  if (!squad || squad.length === 0) {
    return 55 + Math.random() * 20;
  }

  // Top 6 batting performers
  const batters = [...squad].sort((a, b) => (b.batting||b.bat||60) - (a.batting||a.bat||60)).slice(0, 6);
  const battingStrength = batters.reduce((s, p) => s + (p.batting||p.bat||60), 0) / batters.length;

  // Top 5 bowling performers from BOWL/AR roles
  const bowlers = [...squad]
    .filter(p => p.role === "BOWL" || p.role === "AR")
    .sort((a, b) => (b.bowling||b.bowl||60) - (a.bowling||a.bowl||60))
    .slice(0, 5);
  const bowlingStrength = bowlers.length > 0
    ? bowlers.reduce((s, p) => s + (p.bowling||p.bowl||60), 0) / bowlers.length
    : 60;

  return (battingStrength * 0.55) + (bowlingStrength * 0.45);
}

// ─── 4. Simulate Match ────────────────────────────────────────────────────────
function simulateMatch(fixture) {
  let homeStr = calculateTeamStrength(fixture.home);
  let awayStr = calculateTeamStrength(fixture.away);

  // Home advantage
  homeStr += 4;

  const winProb = homeStr / (homeStr + awayStr);
  const homeWin = Math.random() < winProb;

  const homeScore = 130 + Math.floor(Math.random() * 60);
  let awayScore;

  if (homeWin) {
    awayScore = homeScore - Math.floor(Math.random() * 35) - 5;
  } else {
    awayScore = homeScore + Math.floor(Math.random() * 25) + 5;
  }

  const homeWkts = 3 + Math.floor(Math.random() * 7);
  const awayWkts = 3 + Math.floor(Math.random() * 7);

  return {
    home: fixture.home,
    away: fixture.away,
    homeScore,
    homeWkts,
    awayScore,
    awayWkts,
    winner: homeWin ? fixture.home : fixture.away,
    loser: homeWin ? fixture.away : fixture.home
  };
}

// ─── 5. Simulate Round (5 matches) ───────────────────────────────────────────
function simulateRound() {
  if (Object.keys(seasonState.points).length === 0) {
    initSeason();
  }

  const unplayed = seasonState.fixtures.filter(f => !f.played);
  if (unplayed.length === 0) {
    showToast("All matches have been played!", "info");
    return;
  }

  const batch = unplayed.slice(0, 5);

  batch.forEach(fixture => {
    const result = simulateMatch(fixture);
    fixture.played = true;
    seasonState.results.push(result);
    updatePoints(result);
  });

  renderSeasonTab();
  showToast(`${batch.length} matches simulated! 🏏`, "success");
}

// ─── 6. Update Points ─────────────────────────────────────────────────────────
function updatePoints(result) {
  const { winner, loser } = result;

  // Ensure entries exist
  if (!seasonState.points[winner]) {
    seasonState.points[winner] = { teamId: winner, played: 0, won: 0, lost: 0, pts: 0, nrr: 0.0 };
  }
  if (!seasonState.points[loser]) {
    seasonState.points[loser] = { teamId: loser, played: 0, won: 0, lost: 0, pts: 0, nrr: 0.0 };
  }

  // Winner
  seasonState.points[winner].played++;
  seasonState.points[winner].won++;
  seasonState.points[winner].pts += 2;
  seasonState.points[winner].nrr = parseFloat((seasonState.points[winner].nrr + 0.1).toFixed(3));

  // Loser
  seasonState.points[loser].played++;
  seasonState.points[loser].lost++;
  seasonState.points[loser].nrr = parseFloat((seasonState.points[loser].nrr - 0.1).toFixed(3));
}

// ─── 7. Render Season Tab ─────────────────────────────────────────────────────
function renderSeasonTab() {
  const container = document.getElementById("tab-season");
  if (!container) return;

  if (Object.keys(seasonState.points).length === 0) {
    initSeason();
  }

  const myTeamId = gameState.myTeam ? gameState.myTeam.id : null;

  // Upcoming fixtures (next 3 unplayed)
  const upcoming = seasonState.fixtures.filter(f => !f.played).slice(0, 3);
  const upcomingHTML = upcoming.length > 0 ? upcoming.map(f => {
    const homeTeam = gameState.allTeams.find(t => t.id === f.home);
    const awayTeam = gameState.allTeams.find(t => t.id === f.away);
    const isMyMatch = f.home === myTeamId || f.away === myTeamId;
    return `
      <div class="fixture-card ${isMyMatch ? "my-fixture" : ""}">
        <div class="fixture-team home-team">
          <span class="fix-emoji">${homeTeam ? homeTeam.emoji : "🏏"}</span>
          <span class="fix-name">${homeTeam ? homeTeam.abbr : f.home.toUpperCase()}</span>
        </div>
        <div class="fixture-vs">VS</div>
        <div class="fixture-team away-team">
          <span class="fix-emoji">${awayTeam ? awayTeam.emoji : "🏏"}</span>
          <span class="fix-name">${awayTeam ? awayTeam.abbr : f.away.toUpperCase()}</span>
        </div>
        ${isMyMatch ? '<span class="my-match-badge">YOUR MATCH</span>' : ""}
      </div>
    `;
  }).join("") : `<p class="empty-msg">All fixtures completed! 🏆</p>`;

  // My recent results (last 3 involving my team)
  const myResults = seasonState.results
    .filter(r => r.home === myTeamId || r.away === myTeamId)
    .slice(-3)
    .reverse();

  const myResultsHTML = myResults.length > 0 ? myResults.map(r => {
    const won = r.winner === myTeamId;
    const oppId = r.home === myTeamId ? r.away : r.home;
    const opp = gameState.allTeams.find(t => t.id === oppId);
    const myScore = r.home === myTeamId ? r.homeScore : r.awayScore;
    const myWkts = r.home === myTeamId ? r.homeWkts : r.awayWkts;
    const oppScore = r.home === myTeamId ? r.awayScore : r.homeScore;
    const oppWkts = r.home === myTeamId ? r.awayWkts : r.homeWkts;
    return `
      <div class="result-card ${won ? "result-win" : "result-loss"}">
        <span class="result-badge ${won ? "win-badge" : "loss-badge"}">${won ? "WIN" : "LOSS"}</span>
        <span class="result-vs">vs ${opp ? opp.abbr : oppId.toUpperCase()}</span>
        <span class="result-score">${myScore}/${myWkts} vs ${oppScore}/${oppWkts}</span>
      </div>
    `;
  }).join("") : `<p class="empty-msg">No matches played yet.</p>`;

  // Points table sorted by pts, then nrr
  const sortedPoints = Object.values(seasonState.points)
    .sort((a, b) => b.pts - a.pts || b.nrr - a.nrr);

  const pointsTableHTML = sortedPoints.map((row, idx) => {
    const team = gameState.allTeams.find(t => t.id === row.teamId);
    const isMe = row.teamId === myTeamId;
    return `
      <tr class="${isMe ? "my-team-row" : ""}">
        <td>${idx + 1}</td>
        <td>
          <span class="table-team-emoji">${team ? team.emoji : ""}</span>
          ${team ? team.abbr : row.teamId.toUpperCase()}
          ${isMe ? '<span class="you-badge">YOU</span>' : ""}
        </td>
        <td>${row.played}</td>
        <td>${row.won}</td>
        <td>${row.lost}</td>
        <td class="pts-cell">${row.pts}</td>
        <td class="${row.nrr >= 0 ? "nrr-pos" : "nrr-neg"}">${row.nrr >= 0 ? "+" : ""}${row.nrr.toFixed(3)}</td>
      </tr>
    `;
  }).join("");

  const unplayedCount = seasonState.fixtures.filter(f => !f.played).length;

  container.innerHTML = `
    <div class="season-section">
      <h3 class="section-title">📅 Upcoming Fixtures</h3>
      <div class="fixtures-list">${upcomingHTML}</div>
    </div>

    <div class="season-section">
      <button class="btn-primary simulate-btn" onclick="simulateRound()" ${unplayedCount === 0 ? "disabled" : ""}>
        ${unplayedCount > 0 ? `⚡ Simulate Next Round (${unplayedCount} left)` : "✅ Season Complete"}
      </button>
    </div>

    ${myResults.length > 0 ? `
    <div class="season-section">
      <h3 class="section-title">🏏 My Recent Results</h3>
      <div class="results-list">${myResultsHTML}</div>
    </div>` : ""}

    <div class="season-section">
      <h3 class="section-title">📊 Points Table</h3>
      <div class="table-wrapper">
        <table class="points-table">
          <thead>
            <tr>
              <th>Pos</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th><th>NRR</th>
            </tr>
          </thead>
          <tbody>${pointsTableHTML}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── 8. Leaderboard ──────────────────────────────────────────────────────────
function renderLeaderboard() {
  const container = document.getElementById("tab-leaderboard");
  if (!container) return;

  if (Object.keys(seasonState.points).length === 0) {
    container.innerHTML = `<p class="empty-msg">Start the season to see the leaderboard!</p>`;
    return;
  }

  const myTeamId = gameState.myTeam ? gameState.myTeam.id : null;
  const medals = ["🥇", "🥈", "🥉"];

  const sortedPoints = Object.values(seasonState.points)
    .sort((a, b) => b.pts - a.pts || b.nrr - a.nrr);

  const rows = sortedPoints.map((row, idx) => {
    const team = gameState.allTeams.find(t => t.id === row.teamId);
    const isMe = row.teamId === myTeamId;
    // For my team, use gameState.mySquad (source of truth); for others, use allTeams
    const squadSize = isMe ? gameState.mySquad.length : (team ? team.squad.length : 0);
    const startPurse = (typeof AUCTION_RULES !== "undefined") ? AUCTION_RULES.startingPurse : 120;
    const teamPurse  = isMe ? gameState.myPurse : (team ? team.purse : startPurse);
    const spent      = (startPurse - teamPurse).toFixed(1);

    return `
      <div class="leaderboard-row ${isMe ? "lb-my-team" : ""} ${idx < 4 ? "playoff-zone" : ""}">
        <div class="lb-rank">${medals[idx] || `#${idx + 1}`}</div>
        <div class="lb-team">
          <span class="lb-emoji">${team ? team.emoji : ""}</span>
          <div class="lb-info">
            <span class="lb-name">${team ? team.name : row.teamId}</span>
            ${isMe ? '<span class="you-badge">YOU</span>' : ""}
          </div>
        </div>
        <div class="lb-pts">${row.pts} <span class="lb-label">pts</span></div>
        <div class="lb-stats">
          <span>${row.won}W ${row.lost}L</span>
          <span class="${row.nrr >= 0 ? "nrr-pos" : "nrr-neg"}">${row.nrr >= 0 ? "+" : ""}${row.nrr.toFixed(3)} NRR</span>
        </div>
        <div class="lb-extra">
          <span>👥 ${squadSize} players</span>
          <span>💰 ₹${spent}Cr spent</span>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="leaderboard-header">
      <h3>🏆 IPL Season Leaderboard</h3>
      <p class="lb-subtitle">Top 4 qualify for playoffs</p>
    </div>
    <div class="leaderboard-list">${rows}</div>
  `;
}
