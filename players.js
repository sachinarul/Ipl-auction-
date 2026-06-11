// ============================================================
// players.js — IPL 2025 Mega Auction Player Database
// 200+ real IPL auction players with sets and categories
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
  "Singapore":    "🇸🇬",
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
// p(id, name, country, overseas, role, age, basePrice, set, category, bat, bowl, field, exp, form, potential)
function p(id, name, country, overseas, role, age, basePrice, set, category, bat, bowl, field, exp, form, potential) {
  const ovr = calcOVR(bat, bowl, field, exp, form, role);
  return {
    id, name, country,
    flag: FLAG_MAP[country] || "🏳️",
    overseas,
    role,        // "BAT" | "BOWL" | "AR" | "WK"
    age,
    basePrice,   // in Cr
    set,         // e.g. "MARQUEE" | "SET 1" | "SET 2" etc.
    category,    // e.g. "BATSMAN" | "WICKET_KEEPER" | "ALL_ROUNDER" | "FAST_BOWLER" | "SPINNER"
    soldPrice: null,
    currentTeam: null,
    batting:  bat,
    bowling:  bowl,
    fielding: field,
    experience: exp,
    form,
    fitness: Math.min(99, 60 + Math.floor((100 - age) * 0.8)),
    potential,
    overall:  ovr
  };
}

// ============================================================
// PLAYER_POOL — 200+ real IPL 2025 Mega Auction players
// SET: MARQUEE (47 players)
// ============================================================
const PLAYER_POOL = [

  // ── MARQUEE | BATSMEN ───────────────────────────────────
  p(  1, "Aiden Markram",      "South Africa", true,  "BAT",  30, BP.CR2, "MARQUEE", "BATSMAN",        83,42,80,72,82,78),
  p(  2, "Rinku Singh",        "India",        false, "BAT",  27, BP.CR2, "MARQUEE", "BATSMAN",        84,15,80,60,88,88),
  p(  3, "Rohit Sharma",       "India",        false, "BAT",  37, BP.CR2, "MARQUEE", "BATSMAN",        92,12,80,98,85,68),
  p(  4, "Ruturaj Gaikwad",    "India",        false, "BAT",  28, BP.CR2, "MARQUEE", "BATSMAN",        87,12,82,72,86,88),
  p(  5, "Shimron Hetmyer",    "West Indies",  true,  "BAT",  28, BP.CR2, "MARQUEE", "BATSMAN",        80,12,76,62,80,78),
  p(  6, "Shreyas Iyer",       "India",        false, "BAT",  30, BP.CR2, "MARQUEE", "BATSMAN",        89,18,84,82,88,82),
  p(  7, "Shubman Gill",       "India",        false, "BAT",  25, BP.CR2, "MARQUEE", "BATSMAN",        88,18,84,72,90,96),
  p(  8, "Suryakumar Yadav",   "India",        false, "BAT",  34, BP.CR2, "MARQUEE", "BATSMAN",        93, 8,86,82,95,86),
  p(  9, "Tim David",          "Singapore",    true,  "BAT",  28, BP.CR2, "MARQUEE", "BATSMAN",        84,12,76,64,84,82),
  p( 10, "Travis Head",        "Australia",    true,  "BAT",  31, BP.CR2, "MARQUEE", "BATSMAN",        91,32,82,78,94,84),

  // ── MARQUEE | WICKET-KEEPERS ────────────────────────────
  p( 11, "Heinrich Klaasen",   "South Africa", true,  "WK",   33, BP.CR2, "MARQUEE", "WICKET_KEEPER",  90, 8,85,76,91,79),
  p( 12, "Jos Buttler",        "England",      true,  "WK",   34, BP.CR2, "MARQUEE", "WICKET_KEEPER",  92, 8,88,88,85,78),
  p( 13, "KL Rahul",           "India",        false, "WK",   32, BP.CR2, "MARQUEE", "WICKET_KEEPER",  90,10,83,88,87,80),
  p( 14, "MS Dhoni",           "India",        false, "WK",   43, BP.CR2, "MARQUEE", "WICKET_KEEPER",  82, 6,88,99,74,52),
  p( 15, "Nicholas Pooran",    "West Indies",  true,  "WK",   29, BP.CR2, "MARQUEE", "WICKET_KEEPER",  86, 8,83,74,87,84),
  p( 16, "Phil Salt",          "England",      true,  "WK",   28, BP.CR2, "MARQUEE", "WICKET_KEEPER",  84, 5,80,66,88,87),
  p( 17, "Quinton de Kock",    "South Africa", true,  "WK",   32, BP.CR2, "MARQUEE", "WICKET_KEEPER",  89, 6,86,86,83,76),
  p( 18, "Rishabh Pant",       "India",        false, "WK",   27, BP.CR2, "MARQUEE", "WICKET_KEEPER",  94,15,87,82,95,95),
  p( 19, "Sanju Samson",       "India",        false, "WK",   30, BP.CR2, "MARQUEE", "WICKET_KEEPER",  87, 5,84,80,84,83),

  // ── MARQUEE | ALL-ROUNDERS ──────────────────────────────
  p( 20, "Andre Russell",      "West Indies",  true,  "AR",   36, BP.CR2, "MARQUEE", "ALL_ROUNDER",    88,82,82,90,83,66),
  p( 21, "Axar Patel",         "India",        false, "AR",   31, BP.CR2, "MARQUEE", "ALL_ROUNDER",    76,83,82,76,82,78),
  p( 22, "Hardik Pandya",      "India",        false, "AR",   31, BP.CR2, "MARQUEE", "ALL_ROUNDER",    86,84,85,86,84,82),
  p( 23, "Marco Jansen",       "South Africa", true,  "AR",   24, BP.CR2, "MARQUEE", "ALL_ROUNDER",    70,84,78,58,82,90),
  p( 24, "Marcus Stoinis",     "Australia",    true,  "AR",   35, BP.CR2, "MARQUEE", "ALL_ROUNDER",    81,72,78,78,80,70),
  p( 25, "Mitchell Marsh",     "Australia",    true,  "AR",   33, BP.CR2, "MARQUEE", "ALL_ROUNDER",    83,74,80,78,82,74),
  p( 26, "Sunil Narine",       "West Indies",  true,  "AR",   36, BP.CR2, "MARQUEE", "ALL_ROUNDER",    82,90,80,90,84,68),
  p( 27, "Washington Sundar",  "India",        false, "AR",   25, BP.CR2, "MARQUEE", "ALL_ROUNDER",    70,82,76,64,76,86),

  // ── MARQUEE | FAST BOWLERS ──────────────────────────────
  p( 28, "Arshdeep Singh",     "India",        false, "BOWL", 26, BP.CR2, "MARQUEE", "FAST_BOWLER",    18,85,72,68,84,88),
  p( 29, "Bhuvneshwar Kumar",  "India",        false, "BOWL", 35, BP.CR2, "MARQUEE", "FAST_BOWLER",    32,83,70,88,80,66),
  p( 30, "Jasprit Bumrah",     "India",        false, "BOWL", 31, BP.CR2, "MARQUEE", "FAST_BOWLER",    18,97,76,90,96,95),
  p( 31, "Jofra Archer",       "England",      true,  "BOWL", 29, BP.CR2, "MARQUEE", "FAST_BOWLER",    28,92,74,74,86,88),
  p( 32, "Josh Hazlewood",     "Australia",    true,  "BOWL", 34, BP.CR2, "MARQUEE", "FAST_BOWLER",    18,92,72,82,86,78),
  p( 33, "Kagiso Rabada",      "South Africa", true,  "BOWL", 30, BP.CR2, "MARQUEE", "FAST_BOWLER",    22,93,74,82,89,86),
  p( 34, "Lockie Ferguson",    "New Zealand",  true,  "BOWL", 33, BP.CR2, "MARQUEE", "FAST_BOWLER",    16,85,70,70,80,76),
  p( 35, "Mitchell Starc",     "Australia",    true,  "BOWL", 35, BP.CR2, "MARQUEE", "FAST_BOWLER",    32,90,72,82,84,74),
  p( 36, "Mohammad Shami",     "India",        false, "BOWL", 34, BP.CR2, "MARQUEE", "FAST_BOWLER",    20,91,72,86,88,80),
  p( 37, "Mohammad Siraj",     "India",        false, "BOWL", 31, BP.CR2, "MARQUEE", "FAST_BOWLER",    18,86,72,70,82,80),
  p( 38, "Pat Cummins",        "Australia",    true,  "BOWL", 31, BP.CR2, "MARQUEE", "FAST_BOWLER",    46,94,76,88,91,84),

  // ── MARQUEE | SPINNERS ──────────────────────────────────
  p( 39, "Kuldeep Yadav",      "India",        false, "BOWL", 30, BP.CR2, "MARQUEE", "SPINNER",        32,88,72,72,86,84),
  p( 40, "Noor Ahmad",         "Afghanistan",  true,  "BOWL", 21, BP.CR2, "MARQUEE", "SPINNER",        28,86,68,50,82,92),
  p( 41, "Rashid Khan",        "Afghanistan",  true,  "AR",   26, BP.CR2, "MARQUEE", "SPINNER",        62,92,80,76,90,90),
  p( 42, "Ravindra Jadeja",    "India",        false, "AR",   36, BP.CR2, "MARQUEE", "SPINNER",        82,88,95,92,85,72),
  p( 43, "Varun Chakaravarthy","India",        false, "BOWL", 33, BP.CR2, "MARQUEE", "SPINNER",        30,86,68,66,84,76),
  p( 44, "Wanindu Hasaranga",  "Sri Lanka",    true,  "AR",   27, BP.CR2, "MARQUEE", "SPINNER",        66,88,76,64,84,86),
  p( 45, "Yuzvendra Chahal",   "India",        false, "BOWL", 34, BP.CR2, "MARQUEE", "SPINNER",        28,88,68,84,84,72),

  // ── MARQUEE | UNCAPPED/EMERGING ─────────────────────────
  p( 46, "Nitish Kumar Reddy", "India",        false, "AR",   22, BP.CR2, "MARQUEE", "ALL_ROUNDER",    80,60,78,48,84,94),
  p( 47, "Yashasvi Jaiswal",   "India",        false, "BAT",  23, BP.CR2, "MARQUEE", "BATSMAN",        87,10,82,60,88,96),

  // ============================================================
  // SET 1 — Indian Batsmen (BA1)
  // ============================================================
  p( 51, "Abhishek Sharma",    "India",        false, "BAT",  24, BP.CR2,  "SET 1", "BATSMAN",         83,52,80,56,85,93),
  p( 52, "Devdutt Padikkal",   "India",        false, "BAT",  24, BP.CR1,  "SET 1", "BATSMAN",         80,12,78,52,78,88),
  p( 53, "Prithvi Shaw",       "India",        false, "BAT",  25, BP.CR2,  "SET 1", "BATSMAN",         82,10,76,62,76,80),
  p( 54, "Rajat Patidar",      "India",        false, "BAT",  31, BP.CR2,  "SET 1", "BATSMAN",         83,10,78,64,84,82),
  p( 55, "Riyan Parag",        "India",        false, "BAT",  22, BP.CR1,  "SET 1", "BATSMAN",         75,26,74,48,74,86),
  p( 56, "Sai Sudharsan",      "India",        false, "BAT",  23, BP.CR15, "SET 1", "BATSMAN",         82,12,80,48,82,93),
  p( 57, "Sarfaraz Khan",      "India",        false, "BAT",  27, BP.CR1,  "SET 1", "BATSMAN",         80,10,74,56,78,82),
  p( 58, "Shaik Rasheed",      "India",        false, "BAT",  22, BP.L75,  "SET 1", "BATSMAN",         74,10,72,36,74,86),
  p( 59, "Tilak Varma",        "India",        false, "BAT",  22, BP.CR2,  "SET 1", "BATSMAN",         84,20,80,56,88,95),
  p( 60, "Virat Kohli",        "India",        false, "BAT",  36, BP.CR2,  "SET 1", "BATSMAN",         97,12,88,99,90,82),

  // ── SET 1 — Overseas Batsmen ────────────────────────────
  p( 61, "Babar Azam",         "Pakistan",     true,  "BAT",  30, BP.CR2,  "SET 1", "BATSMAN",         93,14,82,80,88,84),
  p( 62, "David Warner",       "Australia",    true,  "BAT",  38, BP.CR2,  "SET 1", "BATSMAN",         88,10,80,94,78,58),
  p( 63, "Dewald Brevis",      "South Africa", true,  "BAT",  22, BP.CR15, "SET 1", "BATSMAN",         80,22,76,44,78,90),
  p( 64, "Devon Conway",       "New Zealand",  true,  "BAT",  33, BP.CR15, "SET 1", "BATSMAN",         85, 8,80,70,82,74),
  p( 65, "Faf du Plessis",     "South Africa", true,  "BAT",  40, BP.CR15, "SET 1", "BATSMAN",         85,14,82,92,74,56),
  p( 66, "Glenn Maxwell",      "Australia",    true,  "BAT",  36, BP.CR2,  "SET 1", "BATSMAN",         88,78,86,86,88,74),
  p( 67, "Glenn Phillips",     "New Zealand",  true,  "BAT",  27, BP.CR15, "SET 1", "BATSMAN",         80,44,82,58,78,80),
  p( 68, "Harry Brook",        "England",      true,  "BAT",  26, BP.CR2,  "SET 1", "BATSMAN",         88,18,82,64,88,91),
  p( 69, "Joe Root",           "England",      true,  "BAT",  34, BP.CR2,  "SET 1", "BATSMAN",         90,42,84,88,82,72),
  p( 70, "Kane Williamson",    "New Zealand",  true,  "BAT",  34, BP.CR2,  "SET 1", "BATSMAN",         87,18,80,86,74,68),
  p( 71, "Rovman Powell",      "West Indies",  true,  "BAT",  30, BP.CR15, "SET 1", "BATSMAN",         78,22,76,60,78,74),
  p( 72, "Steven Smith",       "Australia",    true,  "BAT",  36, BP.CR2,  "SET 1", "BATSMAN",         89,34,82,90,78,66),
  p( 73, "Will Jacks",         "England",      true,  "BAT",  26, BP.CR2,  "SET 1", "BATSMAN",         82,60,82,58,82,86),

  // ── SET 1 — Indian Wicket-Keepers ──────────────────────
  p( 74, "Dhruv Jurel",        "India",        false, "WK",   23, BP.L75,  "SET 1", "WICKET_KEEPER",   76, 5,78,50,78,90),
  p( 75, "Ishan Kishan",       "India",        false, "WK",   26, BP.CR2,  "SET 1", "WICKET_KEEPER",   84, 5,82,70,82,88),
  p( 76, "Jitesh Sharma",      "India",        false, "WK",   30, BP.CR1,  "SET 1", "WICKET_KEEPER",   78, 8,76,58,80,78),

  // ── SET 1 — Overseas Wicket-Keepers ────────────────────
  p( 77, "Jonny Bairstow",     "England",      true,  "WK",   35, BP.CR15, "SET 1", "WICKET_KEEPER",   83, 6,82,84,74,65),
  p( 78, "Kusal Mendis",       "Sri Lanka",    true,  "WK",   30, BP.CR15, "SET 1", "WICKET_KEEPER",   80, 8,80,62,76,70),
  p( 79, "Rahmanullah Gurbaz", "Afghanistan",  true,  "WK",   23, BP.CR2,  "SET 1", "WICKET_KEEPER",   80, 5,76,44,80,88),
  p( 80, "Ryan Rickelton",     "South Africa", true,  "WK",   26, BP.L75,  "SET 1", "WICKET_KEEPER",   74, 5,72,44,74,83),

  // ── SET 1 — Indian All-Rounders ────────────────────────
  p( 81, "Liam Livingstone",   "England",      true,  "AR",   31, BP.CR2,  "SET 1", "ALL_ROUNDER",     84,76,83,72,82,80),
  p( 82, "Ravichandran Ashwin","India",        false, "AR",   38, BP.CR2,  "SET 1", "ALL_ROUNDER",     60,90,72,94,78,60),
  p( 83, "Venkatesh Iyer",     "India",        false, "AR",   29, BP.CR2,  "SET 1", "ALL_ROUNDER",     82,76,80,66,82,82),

  // ── SET 1 — Overseas All-Rounders ──────────────────────
  p( 84, "Ben Stokes",         "England",      true,  "AR",   33, BP.CR2,  "SET 1", "ALL_ROUNDER",     88,86,88,88,86,78),
  p( 85, "Cameron Green",      "Australia",    true,  "AR",   25, BP.CR2,  "SET 1", "ALL_ROUNDER",     82,80,82,66,82,91),
  p( 86, "Sam Curran",         "England",      true,  "AR",   26, BP.CR2,  "SET 1", "ALL_ROUNDER",     75,78,80,72,78,82),

  // ── SET 1 — Fast Bowlers ───────────────────────────────
  p( 87, "Akash Deep",         "India",        false, "BOWL", 28, BP.CR1,  "SET 1", "FAST_BOWLER",     16,80,70,58,74,80),
  p( 88, "Alzarri Joseph",     "West Indies",  true,  "BOWL", 28, BP.CR2,  "SET 1", "FAST_BOWLER",     18,86,70,62,76,80),
  p( 89, "Anrich Nortje",      "South Africa", true,  "BOWL", 31, BP.CR2,  "SET 1", "FAST_BOWLER",     14,88,70,68,80,80),
  p( 90, "Avesh Khan",         "India",        false, "BOWL", 27, BP.CR2,  "SET 1", "FAST_BOWLER",     16,80,68,64,74,76),
  p( 91, "Chris Woakes",       "England",      true,  "BOWL", 36, BP.CR15, "SET 1", "FAST_BOWLER",     56,84,72,80,78,64),
  p( 92, "Deepak Chahar",      "India",        false, "BOWL", 32, BP.CR2,  "SET 1", "FAST_BOWLER",     44,82,70,74,78,72),
  p( 93, "Fazalhaq Farooqi",   "Afghanistan",  true,  "BOWL", 24, BP.CR15, "SET 1", "FAST_BOWLER",     16,84,68,54,72,84),
  p( 94, "Gerald Coetzee",     "South Africa", true,  "BOWL", 24, BP.CR15, "SET 1", "FAST_BOWLER",     18,82,68,58,76,88),
  p( 95, "Harshal Patel",      "India",        false, "BOWL", 34, BP.CR2,  "SET 1", "FAST_BOWLER",     30,83,70,72,80,74),
  p( 96, "Mark Wood",          "England",      true,  "BOWL", 35, BP.CR2,  "SET 1", "FAST_BOWLER",     18,90,70,72,80,74),
  p( 97, "Mukesh Kumar",       "India",        false, "BOWL", 31, BP.CR1,  "SET 1", "FAST_BOWLER",     14,78,68,58,72,72),
  p( 98, "Navdeep Saini",      "India",        false, "BOWL", 31, BP.CR1,  "SET 1", "FAST_BOWLER",     16,78,68,64,76,72),
  p( 99, "Prasidh Krishna",    "India",        false, "BOWL", 29, BP.CR2,  "SET 1", "FAST_BOWLER",     18,82,70,64,76,76),
  p(100, "T Natarajan",        "India",        false, "BOWL", 33, BP.CR1,  "SET 1", "FAST_BOWLER",     16,80,68,64,78,68),
  p(101, "Umesh Yadav",        "India",        false, "BOWL", 37, BP.CR1,  "SET 1", "FAST_BOWLER",     16,80,68,84,74,56),
  p(102, "Yash Dayal",         "India",        false, "BOWL", 26, BP.CR2,  "SET 1", "FAST_BOWLER",     16,80,68,54,74,78),

  // ── SET 1 — Spinners ───────────────────────────────────
  p(103, "Adam Zampa",         "Australia",    true,  "BOWL", 33, BP.CR2,  "SET 1", "SPINNER",         24,86,70,72,83,74),
  p(104, "Matheesha Pathirana","Sri Lanka",    true,  "BOWL", 22, BP.CR2,  "SET 1", "SPINNER",         18,86,68,48,82,92),
  p(105, "Ravi Bishnoi",       "India",        false, "AR",   24, BP.CR2,  "SET 1", "SPINNER",         46,84,68,56,80,86),
  p(106, "Shadab Khan",        "Pakistan",     true,  "AR",   26, BP.CR15, "SET 1", "SPINNER",         66,84,74,64,80,82),

  // ============================================================
  // SET 2 — Indian Batsmen (BA2)
  // ============================================================
  p(111, "Anmolpreet Singh",   "India",        false, "BAT",  26, BP.L50,  "SET 2", "BATSMAN",         72, 8,72,44,70,74),
  p(112, "Mayank Agarwal",     "India",        false, "BAT",  34, BP.CR1,  "SET 2", "BATSMAN",         82,10,74,76,72,62),
  p(113, "Musheer Khan",       "India",        false, "BAT",  20, BP.L75,  "SET 2", "BATSMAN",         74,10,70,30,72,90),
  p(114, "Priyansh Arya",      "India",        false, "BAT",  26, BP.L75,  "SET 2", "BATSMAN",         76, 8,72,44,76,82),
  p(115, "Vaibhav Suryavanshi","India",        false, "BAT",  14, BP.L30,  "SET 2", "BATSMAN",         72, 5,70,10,76,99),

  // ── SET 2 — Overseas Batsmen ────────────────────────────
  p(116, "Lhuan-dre Pretorius","South Africa", true,  "BAT",  21, BP.L75,  "SET 2", "BATSMAN",         76,12,72,34,74,88),
  p(117, "Matthew Breetzke",   "South Africa", true,  "BAT",  23, BP.L75,  "SET 2", "BATSMAN",         74,14,74,36,74,80),
  p(118, "Max O'Dowd",         "Netherlands",  true,  "BAT",  31, BP.L50,  "SET 2", "BATSMAN",         66,10,64,44,58,54),
  p(119, "Paul Stirling",      "Ireland",      true,  "BAT",  34, BP.L75,  "SET 2", "BATSMAN",         72,34,70,62,64,54),
  p(120, "Tom Kohler-Cadmore", "England",      true,  "BAT",  30, BP.L75,  "SET 2", "BATSMAN",         74, 8,72,52,70,68),

  // ── SET 2 — Indian Wicket-Keepers ──────────────────────
  p(121, "Upendra Yadav",      "India",        false, "WK",   22, BP.L50,  "SET 2", "WICKET_KEEPER",   62, 5,66,28,60,76),

  // ── SET 2 — Overseas Wicket-Keepers ────────────────────
  p(122, "Lorcan Tucker",      "Ireland",      true,  "WK",   28, BP.L75,  "SET 2", "WICKET_KEEPER",   66, 5,66,44,62,62),

  // ── SET 2 — Indian All-Rounders ────────────────────────
  p(123, "Piyush Chawla",      "India",        false, "AR",   36, BP.L75,  "SET 2", "ALL_ROUNDER",     44,74,66,78,62,54),
  p(124, "Shahbaz Ahmed",      "India",        false, "AR",   27, BP.CR1,  "SET 2", "ALL_ROUNDER",     68,76,72,58,74,78),
  p(125, "Shivam Dube",        "India",        false, "AR",   31, BP.CR2,  "SET 2", "ALL_ROUNDER",     80,68,74,66,78,74),

  // ── SET 2 — Overseas All-Rounders ──────────────────────
  p(126, "Bas de Leede",       "Netherlands",  true,  "AR",   24, BP.L75,  "SET 2", "ALL_ROUNDER",     64,68,66,40,62,70),
  p(127, "Colin Munro",        "New Zealand",  true,  "BAT",  37, BP.CR1,  "SET 2", "ALL_ROUNDER",     78, 8,74,74,64,50),
  p(128, "Sean Williams",      "Zimbabwe",     true,  "AR",   36, BP.L75,  "SET 2", "ALL_ROUNDER",     66,68,66,66,58,50),

  // ── SET 2 — Fast Bowlers ───────────────────────────────
  p(129, "Akeal Hosein",       "West Indies",  true,  "BOWL", 29, BP.CR1,  "SET 2", "FAST_BOWLER",     42,76,70,54,68,68),
  p(130, "Chetan Sakariya",    "India",        false, "BOWL", 25, BP.L75,  "SET 2", "FAST_BOWLER",     16,74,66,52,68,72),
  p(131, "Dilshan Madushanka", "Sri Lanka",    true,  "BOWL", 24, BP.CR1,  "SET 2", "FAST_BOWLER",     16,80,68,50,66,80),
  p(132, "Jaydev Unadkat",     "India",        false, "BOWL", 33, BP.CR1,  "SET 2", "FAST_BOWLER",     26,78,68,70,74,62),
  p(133, "Khaleel Ahmed",      "India",        false, "BOWL", 27, BP.CR1,  "SET 2", "FAST_BOWLER",     16,78,68,62,72,72),
  p(134, "Matthew Potts",      "England",      true,  "BOWL", 26, BP.L75,  "SET 2", "FAST_BOWLER",     24,72,66,44,58,66),
  p(135, "Mohit Sharma",       "India",        false, "BOWL", 36, BP.L75,  "SET 2", "FAST_BOWLER",     16,76,66,76,70,54),
  p(136, "Nandre Burger",      "South Africa", true,  "BOWL", 26, BP.CR1,  "SET 2", "FAST_BOWLER",     14,78,68,46,68,76),
  p(137, "Richard Ngarava",    "Zimbabwe",     true,  "BOWL", 27, BP.L75,  "SET 2", "FAST_BOWLER",     14,72,64,42,58,64),
  p(138, "Sandeep Sharma",     "India",        false, "BOWL", 32, BP.L75,  "SET 2", "FAST_BOWLER",     22,74,66,64,68,60),
  p(139, "Shivam Mavi",        "India",        false, "BOWL", 26, BP.CR1,  "SET 2", "FAST_BOWLER",     16,78,68,56,70,74),
  p(140, "Tushar Deshpande",   "India",        false, "BOWL", 30, BP.CR1,  "SET 2", "FAST_BOWLER",     18,76,68,54,68,70),
  p(141, "Umran Malik",        "India",        false, "BOWL", 26, BP.CR1,  "SET 2", "FAST_BOWLER",     14,78,66,50,66,76),

  // ── SET 2 — Spinners ───────────────────────────────────
  p(142, "Akash Madhwal",      "India",        false, "BOWL", 30, BP.CR1,  "SET 2", "SPINNER",         18,76,66,50,70,72),
  p(143, "Harpreet Brar",      "India",        false, "AR",   27, BP.L75,  "SET 2", "SPINNER",         54,74,68,50,66,70),
  p(144, "Jayant Yadav",       "India",        false, "BOWL", 35, BP.L75,  "SET 2", "SPINNER",         44,74,66,72,64,54),
  p(145, "Krunal Pandya",      "India",        false, "AR",   33, BP.CR15, "SET 2", "SPINNER",         74,74,76,72,72,62),
  p(146, "Luke Wood",          "England",      true,  "BOWL", 28, BP.L75,  "SET 2", "SPINNER",         18,74,66,48,66,68),
  p(147, "Mayank Markande",    "India",        false, "BOWL", 28, BP.L50,  "SET 2", "SPINNER",         30,72,66,48,64,66),
  p(148, "Mujeeb Ur Rahman",   "Afghanistan",  true,  "BOWL", 23, BP.CR2,  "SET 2", "SPINNER",         24,86,68,62,80,86),
  p(149, "Nabi Mohammad",      "Afghanistan",  true,  "AR",   39, BP.CR1,  "SET 2", "SPINNER",         66,82,70,82,74,54),
  p(150, "Rahul Chahar",       "India",        false, "BOWL", 25, BP.CR1,  "SET 2", "SPINNER",         28,80,66,54,72,76),
  p(151, "R Sai Kishore",      "India",        false, "BOWL", 27, BP.CR1,  "SET 2", "SPINNER",         42,76,66,50,68,70),

  // ============================================================
  // SET 3 — Indian Batsmen (BA3)
  // ============================================================
  p(161, "Abhinav Sadarangani","India",        false, "BAT",  27, BP.L50,  "SET 3", "BATSMAN",         66,10,64,42,62,62),
  p(162, "Vishnu Vinod",       "India",        false, "WK",   30, BP.L50,  "SET 3", "WICKET_KEEPER",   66, 5,64,46,62,62),

  // ── SET 3 — Overseas Batsmen ────────────────────────────
  p(163, "Chris Gayle",        "West Indies",  true,  "BAT",  45, BP.L50,  "SET 3", "BATSMAN",         80,22,66,96,48,36),
  p(164, "Dinesh Karthik",     "India",        false, "WK",   39, BP.L75,  "SET 3", "WICKET_KEEPER",   74, 8,72,92,62,44),

  // ── SET 3 — All-Rounders ────────────────────────────────
  p(165, "Dwayne Bravo",       "West Indies",  true,  "AR",   41, BP.L75,  "SET 3", "ALL_ROUNDER",     68,78,74,92,56,44),

  // ── SET 3 — Fast Bowlers ───────────────────────────────
  p(166, "Brett Lee",          "Australia",    true,  "BOWL", 49, BP.L50,  "SET 3", "FAST_BOWLER",     18,84,64,92,44,32),
  p(167, "Lasith Malinga",     "Sri Lanka",    true,  "BOWL", 41, BP.L75,  "SET 3", "FAST_BOWLER",     14,88,64,84,60,38),
  p(168, "Mitch McClenaghan",  "New Zealand",  true,  "BOWL", 38, BP.L50,  "SET 3", "FAST_BOWLER",     14,72,64,64,60,44),

  // ── SET 3 — Spinners ───────────────────────────────────
  p(169, "Jacques Kallis",     "South Africa", true,  "AR",   49, BP.L50,  "SET 3", "ALL_ROUNDER",     82,80,82,99,46,34),

  // ── SET 3 — Uncapped Indian Batsmen ────────────────────
  p(170, "Arafat Khan",        "India",        false, "BAT",  21, BP.L30,  "SET 3", "BATSMAN",         62, 5,60,18,58,78),
  p(171, "Ashutosh Sharma",    "India",        false, "BAT",  24, BP.L50,  "SET 3", "BATSMAN",         68, 8,64,34,66,78),
  p(172, "Ayush Badoni",       "India",        false, "BAT",  24, BP.L50,  "SET 3", "BATSMAN",         68,12,66,38,68,80),
  p(173, "Nehal Wadhera",      "India",        false, "BAT",  24, BP.L50,  "SET 3", "BATSMAN",         68, 8,64,36,66,76),
  p(174, "Nishant Sindhu",     "India",        false, "AR",   22, BP.L30,  "SET 3", "ALL_ROUNDER",     60,60,60,22,58,80),
  p(175, "Ramandeep Singh",    "India",        false, "AR",   27, BP.L50,  "SET 3", "ALL_ROUNDER",     68,60,68,46,64,74),
  p(176, "Tristan Stubbs",     "South Africa", true,  "BAT",  24, BP.CR1,  "SET 3", "BATSMAN",         74, 8,72,40,74,84),

  // ── SET 3 — Uncapped Indian WK ──────────────────────────
  p(177, "Anuj Rawat",         "India",        false, "WK",   24, BP.L50,  "SET 3", "WICKET_KEEPER",   62, 5,62,32,60,76),
  p(178, "Prabhsimran Singh",  "India",        false, "WK",   23, BP.L75,  "SET 3", "WICKET_KEEPER",   72, 5,68,36,72,84),

  // ── SET 3 — Indian Fast Bowlers ────────────────────────
  p(179, "Arzan Nagwaswalla",  "India",        false, "BOWL", 26, BP.L50,  "SET 3", "FAST_BOWLER",     14,68,64,36,56,66),
  p(180, "Kartik Tyagi",       "India",        false, "BOWL", 24, BP.L50,  "SET 3", "FAST_BOWLER",     14,68,64,36,56,66),
  p(181, "Kuldeep Sen",        "India",        false, "BOWL", 27, BP.L75,  "SET 3", "FAST_BOWLER",     14,72,64,44,62,68),
  p(182, "Lungi Ngidi",        "South Africa", true,  "BOWL", 29, BP.CR15, "SET 3", "FAST_BOWLER",     16,82,68,60,74,76),
  p(183, "Mukesh Choudhary",   "India",        false, "BOWL", 28, BP.L50,  "SET 3", "FAST_BOWLER",     14,68,64,36,56,66),
  p(184, "Shams Mulani",       "India",        false, "BOWL", 28, BP.L50,  "SET 3", "SPINNER",         42,68,64,36,58,64),
  p(185, "Suyash Sharma",      "India",        false, "BOWL", 21, BP.L50,  "SET 3", "SPINNER",         28,68,62,22,60,78),

  // ── SET 3 — Overseas Fast Bowlers ──────────────────────
  p(186, "Obed McCoy",         "West Indies",  true,  "BOWL", 28, BP.CR1,  "SET 3", "FAST_BOWLER",     16,78,68,50,68,74),
  p(187, "Andrew Tye",         "Australia",    true,  "BOWL", 39, BP.L50,  "SET 3", "FAST_BOWLER",     16,72,64,74,62,44),

  // ── SET 3 — Overseas Spinners ───────────────────────────
  p(188, "Imran Tahir",        "South Africa", true,  "BOWL", 46, BP.L75,  "SET 3", "SPINNER",         22,80,64,88,60,36),
  p(189, "Chris Jordan",       "England",      true,  "BOWL", 36, BP.CR1,  "SET 3", "FAST_BOWLER",     22,78,68,66,68,62),

  // ============================================================
  // SET 4 — Additional Players
  // ============================================================

  // ── SET 4 — Indian Batsmen ─────────────────────────────
  p(201, "Arpit Vasavada",     "India",        false, "BAT",  30, BP.L50,  "SET 4", "BATSMAN",         66, 8,62,42,62,62),
  p(202, "B Sai Sudharsan",    "India",        false, "BAT",  23, BP.CR1,  "SET 4", "BATSMAN",         80, 8,74,44,78,90),
  p(203, "Dipak Hooda",        "India",        false, "AR",   29, BP.CR1,  "SET 4", "ALL_ROUNDER",     72,60,70,56,68,72),
  p(204, "Manav Suthar",       "India",        false, "BOWL", 22, BP.L30,  "SET 4", "SPINNER",         24,68,60,20,56,78),
  p(205, "Pukhraj Mann",       "India",        false, "BOWL", 23, BP.L30,  "SET 4", "SPINNER",         22,66,60,18,54,74),
  p(206, "Shreyas Gopal",      "India",        false, "BOWL", 31, BP.L75,  "SET 4", "SPINNER",         36,74,66,56,66,62),
  p(207, "Tanvir Sangha",      "Australia",    true,  "BOWL", 23, BP.L75,  "SET 4", "SPINNER",         22,74,64,36,64,76),
  p(208, "Yudhvir Charak",     "India",        false, "BOWL", 22, BP.L30,  "SET 4", "FAST_BOWLER",     14,66,62,18,54,76),

  // ── SET 4 — Overseas ───────────────────────────────────
  p(209, "Brendon McCullum",   "New Zealand",  true,  "BAT",  43, BP.L50,  "SET 4", "BATSMAN",         78,12,72,96,50,34),
  p(210, "Corey Anderson",     "New Zealand",  true,  "AR",   34, BP.L50,  "SET 4", "ALL_ROUNDER",     68,66,66,60,58,50),
  p(211, "Keemo Paul",         "West Indies",  true,  "AR",   27, BP.L75,  "SET 4", "ALL_ROUNDER",     62,74,68,48,64,72),
  p(212, "Kyle Mayers",        "West Indies",  true,  "AR",   32, BP.CR1,  "SET 4", "ALL_ROUNDER",     76,70,72,58,72,72),
  p(213, "Naveen Ul Haq",      "Afghanistan",  true,  "BOWL", 26, BP.CR1,  "SET 4", "FAST_BOWLER",     22,78,66,50,68,76),
  p(214, "Nuwan Thushara",     "Sri Lanka",    true,  "BOWL", 30, BP.CR1,  "SET 4", "FAST_BOWLER",     16,78,66,48,68,72),
  p(215, "Tom Banton",         "England",      true,  "WK",   26, BP.L75,  "SET 4", "WICKET_KEEPER",   72, 5,68,44,68,74),
  p(216, "Trent Boult",        "New Zealand",  true,  "BOWL", 35, BP.CR15, "SET 4", "FAST_BOWLER",     18,88,70,82,80,66),

  // ── SET 4 — Uncapped / Emerging ────────────────────────
  p(217, "Harsh Dubey",        "India",        false, "BOWL", 22, BP.L30,  "SET 4", "SPINNER",         22,66,60,18,54,78),
  p(218, "Rajvardhan Hangargekar","India",     false, "AR",   22, BP.L50,  "SET 4", "ALL_ROUNDER",     62,64,60,26,58,76),
  p(219, "Richa Ghosh",        "India",        false, "WK",   21, BP.L50,  "SET 4", "WICKET_KEEPER",   60, 5,60,22,58,80),
  p(220, "Shashank Singh",     "India",        false, "BAT",  33, BP.CR1,  "SET 4", "BATSMAN",         74, 8,70,52,72,68),
  p(221, "Tilak Varma Jr",     "India",        false, "BAT",  22, BP.CR1,  "SET 4", "BATSMAN",         76,14,72,38,76,88),
  p(222, "Vyshak Vijaykumar",  "India",        false, "BOWL", 26, BP.L75,  "SET 4", "FAST_BOWLER",     16,74,66,44,66,74),

];

// ============================================================
// Deduplication (safety net)
// ============================================================
const seenIds = new Set();
const PLAYER_POOL_UNIQUE = PLAYER_POOL.filter(pl => {
  if (seenIds.has(pl.id)) return false;
  seenIds.add(pl.id);
  return true;
});

const FINAL_PLAYER_POOL = PLAYER_POOL_UNIQUE;

// ============================================================
// Helper Functions
// ============================================================
function getPlayerSet(player) {
  return player.set;
}

function getPlayersByRole(role) {
  return FINAL_PLAYER_POOL.filter(pl => pl.role === role);
}

function getPlayersBySet(setName) {
  return FINAL_PLAYER_POOL.filter(pl => pl.set === setName);
}

function shufflePlayers(pool) {
  const arr = (pool || FINAL_PLAYER_POOL).map(pl => ({ ...pl, soldPrice: null, currentTeam: null }));
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
  return FINAL_PLAYER_POOL.find(pl => pl.name.toLowerCase().includes(q));
}
