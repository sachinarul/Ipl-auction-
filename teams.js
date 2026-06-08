// ============================================================
// teams.js — IPL 2025 Teams + AI Strategy
// ALL TEAMS START WITH 0 PLAYERS — auction fills squads
// ============================================================

// Auction rules (matching official IPL 2025 settings)
const AUCTION_RULES = {
  startingPurse: 120,      // ₹120 Cr per team
  maxSquad: 25,
  minSquad: 18,
  maxOverseas: 8,
  maxOverseasXI: 4,
  maxForeignInSet: 2       // max overseas per set in auction
};

// ─── IPL Teams ─────────────────────────────────────────────────────────────
const IPL_TEAMS = [
  {
    id: "mi",
    name: "Mumbai Indians",
    abbr: "MI",
    emoji: "💙",
    primaryColor: "#004BA0",
    secondaryColor: "#D4AF37",
    purse: 120,
    squad: [],          // ← always starts EMPTY
    rtmCards: 2,
    strategy: "aggressive",
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 }
  },
  {
    id: "csk",
    name: "Chennai Super Kings",
    abbr: "CSK",
    emoji: "💛",
    primaryColor: "#FFC107",
    secondaryColor: "#0A2D5E",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "balanced",
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 }
  },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    abbr: "RCB",
    emoji: "❤️",
    primaryColor: "#CC2200",
    secondaryColor: "#D4AF37",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "aggressive",
    targets: { BAT: 6, BOWL: 5, AR: 3, WK: 2 }
  },
  {
    id: "kkr",
    name: "Kolkata Knight Riders",
    abbr: "KKR",
    emoji: "💜",
    primaryColor: "#3A225D",
    secondaryColor: "#D4AF37",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "balanced",
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 }
  },
  {
    id: "dc",
    name: "Delhi Capitals",
    abbr: "DC",
    emoji: "🔵",
    primaryColor: "#17449B",
    secondaryColor: "#EF2B2D",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "conservative",
    targets: { BAT: 5, BOWL: 7, AR: 2, WK: 2 }
  },
  {
    id: "srh",
    name: "Sunrisers Hyderabad",
    abbr: "SRH",
    emoji: "🟠",
    primaryColor: "#F7612D",
    secondaryColor: "#000000",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "aggressive",
    targets: { BAT: 6, BOWL: 5, AR: 3, WK: 2 }
  },
  {
    id: "rr",
    name: "Rajasthan Royals",
    abbr: "RR",
    emoji: "💗",
    primaryColor: "#EA1B8B",
    secondaryColor: "#254AA5",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "balanced",
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 }
  },
  {
    id: "pbks",
    name: "Punjab Kings",
    abbr: "PBKS",
    emoji: "🔴",
    primaryColor: "#AA4545",
    secondaryColor: "#DCDDDE",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "aggressive",
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 }
  },
  {
    id: "gt",
    name: "Gujarat Titans",
    abbr: "GT",
    emoji: "🔷",
    primaryColor: "#1C4A6B",
    secondaryColor: "#C8A951",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "conservative",
    targets: { BAT: 5, BOWL: 6, AR: 2, WK: 2 }
  },
  {
    id: "lsg",
    name: "Lucknow Super Giants",
    abbr: "LSG",
    emoji: "🩵",
    primaryColor: "#00ADEF",
    secondaryColor: "#1B1B3A",
    purse: 120,
    squad: [],
    rtmCards: 2,
    strategy: "balanced",
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 }
  }
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

function getTeamById(id) {
  return IPL_TEAMS.find(t => t.id === id) || null;
}

/**
 * Count overseas players in a squad.
 */
function getOverseasCount(squad) {
  return squad.filter(p => p.overseas === true).length;
}

/**
 * Count players of a specific role in a squad.
 */
function getRoleCount(squad, role) {
  return squad.filter(p => p.role === role).length;
}

/**
 * Check if a team can afford the next bid.
 */
function canAfford(team, amount) {
  return team.purse >= amount;
}

/**
 * Check if adding this player would violate overseas cap.
 */
function wouldViolateOverseas(team, player) {
  return player.overseas && getOverseasCount(team.squad) >= AUCTION_RULES.maxOverseas;
}

/**
 * Check if team squad is full.
 */
function isSquadFull(team) {
  return team.squad.length >= AUCTION_RULES.maxSquad;
}

// ─── AI Bidding Decision ─────────────────────────────────────────────────────

/**
 * Decides if an AI team should bid on the current player.
 *
 * Logic:
 * 1. Hard constraints: purse, squad size, overseas limit
 * 2. Role need: how urgently does this team need this role?
 * 3. Value: is the player worth the current price?
 * 4. Strategy modifier: aggressive = spend more, conservative = spend less
 * 5. Random factor: simulates real auction unpredictability
 *
 * @param {object} team       — team object (from gameState.allTeams)
 * @param {object} player     — player object from FINAL_PLAYER_POOL
 * @param {number} currentBid — current highest bid (Cr)
 * @returns {boolean}
 */
function getAIBidDecision(team, player, currentBid) {
  // 1. Hard constraints
  const increment = getNextIncrement(currentBid);
  const nextBid = parseFloat((currentBid + increment).toFixed(2));

  if (!canAfford(team, nextBid)) return false;
  if (isSquadFull(team)) return false;
  if (wouldViolateOverseas(team, player)) return false;

  // 2. Remaining squad slots & purse budget
  const remainingSlots = AUCTION_RULES.maxSquad - team.squad.length;
  const reservePurse = remainingSlots * 0.75;  // keep ~0.75 Cr per remaining slot

  // Don't bid if it would leave them with less than reserve
  if (team.purse - nextBid < reservePurse) return false;

  // 3. Role need
  const currentRoleCount = getRoleCount(team.squad, player.role);
  const roleTarget = team.targets[player.role] || 3;
  const roleNeed = Math.max(0, (roleTarget - currentRoleCount) / roleTarget);

  // If we already have enough of this role, much less likely to bid
  if (roleNeed <= 0 && Math.random() > 0.15) return false;

  // 4. Calculate max willingness to pay
  // OVR-based valuation: star players fetch more
  const multiplierMap = {
    aggressive:   0.20,
    balanced:     0.15,
    conservative: 0.10
  };
  const multiplier = multiplierMap[team.strategy] || 0.15;

  // Stars (OVR 88+) get a premium
  const starBonus = player.overall >= 88 ? 1.4 : player.overall >= 80 ? 1.15 : 1.0;
  const budget = team.purse / Math.max(remainingSlots, 1);
  const maxWilling = player.overall * budget * multiplier * starBonus;

  // 5. Probability modifiers
  let bidProb = 0.55;
  if (roleNeed > 0.5) bidProb += 0.20;   // really need this role
  if (roleNeed <= 0)  bidProb -= 0.25;   // don't need this role
  if (team.strategy === "aggressive") bidProb += 0.10;
  if (team.strategy === "conservative") bidProb -= 0.10;
  if (player.overall >= 90) bidProb += 0.15;  // go for stars
  if (nextBid > team.purse * 0.3) bidProb -= 0.20;  // don't blow half the purse

  // 6. Final decision
  return nextBid < maxWilling && Math.random() < Math.min(0.85, Math.max(0.05, bidProb));
}

// ─── Squad Analytics ─────────────────────────────────────────────────────────

/**
 * Returns a simple strength rating for a squad (for season simulation).
 */
function getSquadStrength(squad) {
  if (!squad || squad.length === 0) return 55 + Math.random() * 20;

  const sorted = [...squad].sort((a, b) => (b.overall || 70) - (a.overall || 70));
  const top11 = sorted.slice(0, 11);

  // Batting: top 6 by batting stat
  const batters = [...squad].sort((a, b) => b.batting - a.batting).slice(0, 6);
  const battingStr = batters.reduce((s, p) => s + (p.batting || 60), 0) / batters.length;

  // Bowling: top 5 by bowling stat
  const bowlers = [...squad]
    .filter(p => p.role === "BOWL" || p.role === "AR")
    .sort((a, b) => b.bowling - a.bowling)
    .slice(0, 5);
  const bowlingStr = bowlers.length > 0
    ? bowlers.reduce((s, p) => s + (p.bowling || 60), 0) / bowlers.length
    : 60;

  return (battingStr * 0.55) + (bowlingStr * 0.45);
}

/**
 * Returns a formatted squad summary string.
 */
function getSquadSummary(squad) {
  const roles = { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
  squad.forEach(p => { roles[p.role] = (roles[p.role] || 0) + 1; });
  return `BAT:${roles.BAT} BOWL:${roles.BOWL} AR:${roles.AR} WK:${roles.WK}`;
}
