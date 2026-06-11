// ============================================================
// players.js — IPL 2025 Mega Auction Player Database
// Synced with the official AuctionVerse 105-player database
// ============================================================

// Base price constants (in Cr)
const BP = {
  CR2:  2.00,
  CR15: 1.50,
  CR1:  1.00,
  L75:  0.75,
  L50:  0.50,
  L30:  0.30
};

// Helper: compute overall from stats
function calcOVR(bat, bowl, field, exp, form, role) {
  const w = {
    BAT:  [0.45, 0.10, 0.15, 0.20, 0.10],
    BOWL: [0.10, 0.45, 0.15, 0.20, 0.10],
    AR:   [0.30, 0.30, 0.15, 0.15, 0.10],
    WK:   [0.40, 0.08, 0.22, 0.20, 0.10],
  };
  const wts = w[role] || w.BAT;
  const raw = bat*wts[0] + bowl*wts[1] + field*wts[2] + exp*wts[3] + form*wts[4];
  return Math.round(Math.min(99, Math.max(40, raw)));
}

// Build player with auto-computed OVR
function p(id, name, country, overseas, role, age, basePrice, set, category, bat, bowl, field, exp, form, potential) {
  const ovr = calcOVR(bat, bowl, field, exp, form, role);
  return {
    id, name, country,
    flag: FLAG_MAP[country] || "🏳️",
    overseas,
    role,        // "BAT" | "BOWL" | "AR" | "WK"
    age,
    basePrice,   // in Cr
    set,         // "MARQUEE" | "SET 1" | "SET 2" | "SET 3"
    category,    // "BATSMAN" | "WICKET_KEEPER" | "ALL_ROUNDER" | "FAST_BOWLER" | "SPINNER"
    soldPrice: null,
    currentTeam: null,
    batting:  bat,
    bowling:  bowl,
    fielding: field,
    experience: exp,
    form,
    fitness: Math.min(99, 60 + Math.floor((100 - age) * 0.8) + Math.floor(Math.random() * 10)),
    potential,
    overall:  ovr
  };
}

const FLAG_MAP = {
  "India":        "🇮🇳",
  "Australia":    "🇦🇺",
  "England":      "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "South Africa": "🇿🇦",
  "West Indies":  "🇹🇹",
  "New Zealand":  "🇳🇿",
  "Pakistan":     "🇵🇰",
  "Sri Lanka":    "🇱🇰",
  "Bangladesh":   "🇧🇩",
  "Afghanistan":  "🇦🇫",
  "Zimbabwe":     "🇿🇼",
  "Ireland":      "🇮🇪",
  "Scotland":     "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA":          "🇺🇸",
  "Netherlands":  "🇳🇱",
  "Namibia":      "🇳🇦",
  "Nepal":        "🇳🇵",
};

// ============================================================
// PLAYER_POOL — 105 real IPL 2025 auction players
// ============================================================
const PLAYER_POOL = [
];


const seenIds = new Set();
const PLAYER_POOL_UNIQUE = PLAYER_POOL.filter(p => {
  if (seenIds.has(p.id)) return false;
  seenIds.add(p.id);
  return true;
});

const FINAL_PLAYER_POOL = PLAYER_POOL_UNIQUE;

// Classified Sets Mapping Helper
function getPlayerSet(player) {
  return player.set;
}

function getPlayersByRole(role) {
  return FINAL_PLAYER_POOL.filter(p => p.role === role);
}

function shufflePlayers() {
  const arr = FINAL_PLAYER_POOL.map(p => ({ ...p, soldPrice: null, currentTeam: null }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getTopPlayers(n = 20) {
  return [...FINAL_PLAYER_POOL].sort((a, b) => b.overall - a.overall).slice(0, n);
}

function findPlayer(name) {
  const q = name.toLowerCase();
  return FINAL_PLAYER_POOL.find(p => p.name.toLowerCase().includes(q));
}
