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
  p(1, "Aiden Markram", "South Africa", true, "BAT", 30, 2, "MARQUEE", "BATSMAN", 83, 17, 79, 69, 83, 87),
  p(2, "Rinku Singh", "India", false, "BAT", 27, 2, "MARQUEE", "BATSMAN", 85, 14, 82, 57, 88, 90),
  p(3, "Rohit Sharma", "India", false, "BAT", 37, 2, "MARQUEE", "BATSMAN", 91, 21, 90, 96, 93, 43),
  p(4, "Ruturaj Gaikwad", "India", false, "BAT", 28, 2, "MARQUEE", "BATSMAN", 87, 13, 84, 51, 89, 87),
  p(5, "Shimron Hetmyer", "West Indies", true, "BAT", 28, 2, "MARQUEE", "BATSMAN", 82, 10, 80, 62, 83, 84),
  p(6, "Shreyas Iyer", "India", false, "BAT", 30, 2, "MARQUEE", "BATSMAN", 89, 16, 90, 72, 84, 89),
  p(7, "Shubman Gill", "India", false, "BAT", 25, 2, "MARQUEE", "BATSMAN", 90, 18, 90, 46, 90, 93),
  p(8, "Suryakumar Yadav", "India", false, "BAT", 34, 2, "MARQUEE", "BATSMAN", 92, 13, 91, 78, 93, 92),
  p(9, "Tim David", "Australia", true, "BAT", 28, 2, "MARQUEE", "BATSMAN", 84, 17, 81, 60, 80, 88),
  p(10, "Travis Head", "Australia", true, "BAT", 31, 2, "MARQUEE", "BATSMAN", 92, 15, 87, 47, 91, 97),
  p(11, "Virat Kohli", "India", false, "BAT", 36, 2, "MARQUEE", "BATSMAN", 96, 24, 98, 80, 97, 88),
  p(12, "Yashasvi Jaiswal", "India", false, "BAT", 23, 2, "MARQUEE", "BATSMAN", 87, 10, 89, 35, 90, 82),
  p(13, "Heinrich Klaasen", "South Africa", true, "WK", 33, 2, "MARQUEE", "WICKET_KEEPER", 91, 8, 93, 79, 92, 89),
  p(14, "Jos Buttler", "England", true, "WK", 34, 2, "MARQUEE", "WICKET_KEEPER", 90, 7, 97, 88, 95, 85),
  p(15, "KL Rahul", "India", false, "WK", 32, 2, "MARQUEE", "WICKET_KEEPER", 88, 9, 94, 83, 89, 81),
  p(16, "MS Dhoni", "India", false, "WK", 44, 2, "MARQUEE", "WICKET_KEEPER", 82, 7, 84, 88, 82, 48),
  p(17, "Nicholas Pooran", "West Indies", true, "WK", 29, 2, "MARQUEE", "WICKET_KEEPER", 85, 9, 91, 60, 87, 90),
  p(18, "Phil Salt", "England", true, "WK", 28, 2, "MARQUEE", "WICKET_KEEPER", 85, 5, 86, 61, 80, 89),
  p(19, "Rishabh Pant", "India", false, "WK", 27, 2, "MARQUEE", "WICKET_KEEPER", 93, 6, 98, 48, 97, 99),
  p(20, "Sanju Samson", "India", false, "WK", 30, 2, "MARQUEE", "WICKET_KEEPER", 88, 9, 92, 74, 82, 92),
  p(21, "Axar Patel", "India", false, "AR", 31, 2, "MARQUEE", "ALL_ROUNDER", 77, 77, 76, 58, 73, 77),
  p(22, "Hardik Pandya", "India", false, "AR", 31, 2, "MARQUEE", "ALL_ROUNDER", 83, 83, 89, 53, 90, 90),
  p(23, "Marco Jansen", "South Africa", true, "AR", 24, 2, "MARQUEE", "ALL_ROUNDER", 74, 72, 73, 32, 73, 89),
  p(24, "Marcus Stoinis", "Australia", true, "AR", 35, 2, "MARQUEE", "ALL_ROUNDER", 79, 77, 84, 89, 81, 74),
  p(25, "Mitchell Marsh", "Australia", true, "AR", 33, 2, "MARQUEE", "ALL_ROUNDER", 83, 82, 86, 82, 81, 78),
  p(26, "Ravindra Jadeja", "India", false, "AR", 36, 2, "MARQUEE", "ALL_ROUNDER", 85, 82, 87, 83, 83, 75),
  p(27, "Sam Curran", "England", true, "AR", 26, 2, "MARQUEE", "ALL_ROUNDER", 77, 78, 80, 63, 75, 84),
  p(28, "Shivam Dube", "India", false, "AR", 31, 2, "MARQUEE", "ALL_ROUNDER", 77, 76, 82, 65, 75, 80),
  p(29, "Sunil Narine", "West Indies", true, "AR", 36, 2, "MARQUEE", "ALL_ROUNDER", 84, 81, 83, 83, 86, 82),
  p(30, "Will Jacks", "England", true, "AR", 26, 2, "MARQUEE", "ALL_ROUNDER", 78, 80, 78, 69, 82, 81),
  p(31, "Arshdeep Singh", "India", false, "BOWL", 26, 2, "MARQUEE", "FAST_BOWLER", 15, 86, 87, 73, 81, 87),
  p(32, "Bhuvneshwar Kumar", "India", false, "BOWL", 35, 2, "MARQUEE", "FAST_BOWLER", 10, 79, 79, 84, 80, 78),
  p(33, "Jasprit Bumrah", "India", false, "BOWL", 31, 2, "MARQUEE", "FAST_BOWLER", 23, 99, 96, 57, 94, 97),
  p(34, "Jofra Archer", "England", true, "BOWL", 31, 2, "MARQUEE", "FAST_BOWLER", 12, 81, 76, 52, 82, 84),
  p(35, "Josh Hazlewood", "Australia", true, "BOWL", 34, 2, "MARQUEE", "FAST_BOWLER", 13, 92, 91, 81, 91, 88),
  p(36, "Kagiso Rabada", "South Africa", true, "BOWL", 29, 2, "MARQUEE", "FAST_BOWLER", 21, 95, 92, 50, 94, 95),
  p(37, "Lockie Ferguson", "New Zealand", true, "BOWL", 33, 2, "MARQUEE", "FAST_BOWLER", 13, 82, 80, 85, 77, 77),
  p(38, "Mitchell Starc", "Australia", true, "BOWL", 35, 2, "MARQUEE", "FAST_BOWLER", 23, 91, 88, 87, 86, 82),
  p(39, "Mohammad Shami", "India", false, "BOWL", 34, 2, "MARQUEE", "FAST_BOWLER", 11, 91, 90, 87, 95, 92),
  p(40, "Mohammad Siraj", "India", false, "BOWL", 30, 2, "MARQUEE", "FAST_BOWLER", 23, 86, 84, 46, 91, 88),
  p(41, "Pat Cummins", "Australia", true, "BOWL", 31, 2, "MARQUEE", "FAST_BOWLER", 13, 93, 92, 58, 96, 99),
  p(42, "Trent Boult", "New Zealand", true, "BOWL", 35, 2, "MARQUEE", "FAST_BOWLER", 14, 90, 93, 82, 85, 87),
  p(43, "Kuldeep Yadav", "India", false, "BOWL", 30, 2, "MARQUEE", "SPINNER", 20, 86, 84, 70, 84, 92),
  p(44, "Noor Ahmad", "Afghanistan", true, "BOWL", 19, 2, "MARQUEE", "SPINNER", 10, 82, 83, 39, 77, 88),
  p(45, "Rashid Khan", "Afghanistan", true, "BOWL", 26, 2, "MARQUEE", "SPINNER", 23, 96, 99, 53, 99, 99),
  p(46, "Varun Chakravarthy", "India", false, "BOWL", 33, 2, "MARQUEE", "SPINNER", 17, 90, 89, 78, 89, 85),
  p(47, "Yuzvendra Chahal", "India", false, "BOWL", 34, 2, "MARQUEE", "SPINNER", 15, 88, 89, 88, 91, 81),
  p(48, "Abhishek Sharma", "India", false, "AR", 24, 1, "SET 1", "ALL_ROUNDER", 79, 79, 80, 26, 78, 88),
  p(49, "Azmatullah Omarzai", "Afghanistan", true, "AR", 23, 1, "SET 1", "ALL_ROUNDER", 76, 76, 77, 31, 76, 96),
  p(50, "Krunal Pandya", "India", false, "AR", 34, 1, "SET 1", "ALL_ROUNDER", 78, 79, 83, 83, 83, 80),
  p(51, "Mitchell Santner", "New Zealand", true, "AR", 33, 1, "SET 1", "ALL_ROUNDER", 77, 81, 84, 88, 79, 80),
  p(52, "Riyan Parag", "India", false, "AR", 22, 1, "SET 1", "ALL_ROUNDER", 79, 77, 84, 31, 78, 84),
  p(53, "Romario Shepherd", "West Indies", true, "AR", 30, 1, "SET 1", "ALL_ROUNDER", 77, 78, 75, 50, 81, 79),
  p(54, "Shardul Thakur", "India", false, "AR", 33, 1, "SET 1", "ALL_ROUNDER", 76, 80, 80, 84, 76, 75),
  p(55, "Washington Sundar", "India", false, "AR", 25, 1, "SET 1", "ALL_ROUNDER", 78, 78, 84, 66, 83, 85),
  p(56, "Glenn Phillips", "New Zealand", true, "BAT", 29, 1, "SET 1", "BATSMAN", 82, 14, 84, 74, 78, 82),
  p(57, "Rajat Patidar", "India", false, "BAT", 31, 1, "SET 1", "BATSMAN", 81, 21, 84, 59, 76, 84),
  p(58, "Rovman Powell", "West Indies", true, "BAT", 32, 1, "SET 1", "BATSMAN", 82, 19, 82, 79, 75, 77),
  p(59, "Sai Sudharsan", "India", false, "BAT", 23, 1, "SET 1", "BATSMAN", 81, 10, 83, 37, 78, 89),
  p(60, "Sherfane Rutherford", "West Indies", true, "BAT", 27, 1, "SET 1", "BATSMAN", 78, 24, 81, 64, 81, 85),
  p(61, "Tilak Varma", "India", false, "BAT", 22, 1, "SET 1", "BATSMAN", 84, 10, 85, 30, 87, 86),
  p(62, "Tristan Stubbs", "South Africa", true, "BAT", 25, 1, "SET 1", "BATSMAN", 84, 22, 78, 64, 81, 89),
  p(63, "Dhruv Jurel", "India", false, "WK", 23, 1, "SET 1", "WICKET_KEEPER", 78, 6, 82, 27, 83, 96),
  p(64, "Avesh Khan", "India", false, "BOWL", 27, 1, "SET 1", "FAST_BOWLER", 12, 80, 76, 61, 78, 78),
  p(65, "Deepak Chahar", "India", false, "BOWL", 32, 1, "SET 1", "FAST_BOWLER", 22, 82, 83, 88, 81, 78),
  p(66, "Harshal Patel", "India", false, "BOWL", 34, 1, "SET 1", "FAST_BOWLER", 22, 81, 77, 85, 81, 76),
  p(67, "Khaleel Ahmed", "India", false, "BOWL", 28, 1, "SET 1", "FAST_BOWLER", 13, 82, 81, 53, 82, 83),
  p(68, "Mayank Yadav", "India", false, "BOWL", 22, 1, "SET 1", "FAST_BOWLER", 12, 80, 78, 33, 81, 93),
  p(69, "Prasidh Krishna", "India", false, "BOWL", 29, 1, "SET 1", "FAST_BOWLER", 21, 81, 79, 60, 76, 79),
  p(70, "T Natarajan", "India", false, "BOWL", 33, 1, "SET 1", "FAST_BOWLER", 14, 80, 82, 81, 79, 79),
  p(71, "Shaik Rasheed", "India", false, "BAT", 22, 0.75, "SET 2", "BATSMAN", 74, 15, 73, 27, 71, 92),
  p(72, "Yash Dubey", "India", false, "BAT", 25, 0.75, "SET 2", "BATSMAN", 74, 20, 75, 66, 76, 78),
  p(73, "Nehal Wadhera", "India", false, "BAT", 25, 0.75, "SET 2", "BATSMAN", 72, 21, 68, 66, 68, 72),
  p(74, "Towhid Hridoy", "Bangladesh", true, "BAT", 24, 0.75, "SET 2", "BATSMAN", 72, 16, 73, 23, 73, 90),
  p(75, "Abhinav Manohar", "India", false, "BAT", 27, 0.75, "SET 2", "BATSMAN", 72, 20, 70, 67, 73, 75),
  p(76, "Piyush Chawla", "India", false, "AR", 37, 0.75, "SET 2", "ALL_ROUNDER", 76, 80, 82, 90, 82, 50),
  p(77, "Jayant Yadav", "India", false, "AR", 35, 0.75, "SET 2", "ALL_ROUNDER", 72, 74, 75, 84, 76, 71),
  p(78, "Sean Williams", "Zimbabwe", true, "AR", 36, 0.75, "SET 2", "ALL_ROUNDER", 64, 67, 70, 87, 68, 64),
  p(79, "Bas de Leede", "Netherlands", true, "AR", 24, 0.75, "SET 2", "ALL_ROUNDER", 67, 65, 71, 32, 66, 84),
  p(80, "Ryan Rickelton", "South Africa", true, "WK", 26, 0.75, "SET 2", "WICKET_KEEPER", 73, 5, 76, 72, 71, 75),
  p(81, "Jordan Cox", "England", true, "WK", 24, 0.75, "SET 2", "WICKET_KEEPER", 66, 9, 70, 38, 71, 88),
  p(82, "Lorcan Tucker", "Ireland", true, "WK", 28, 0.75, "SET 2", "WICKET_KEEPER", 64, 8, 71, 53, 63, 67),
  p(83, "Mohit Sharma", "India", false, "BOWL", 37, 0.75, "SET 2", "FAST_BOWLER", 13, 81, 78, 97, 84, 51),
  p(84, "Sandeep Sharma", "India", false, "BOWL", 32, 0.75, "SET 2", "FAST_BOWLER", 18, 81, 80, 86, 81, 74),
  p(85, "Chetan Sakariya", "India", false, "BOWL", 25, 0.75, "SET 2", "FAST_BOWLER", 24, 76, 72, 70, 77, 75),
  p(86, "Yash Thakur", "India", false, "BOWL", 27, 0.75, "SET 2", "FAST_BOWLER", 12, 75, 76, 51, 73, 82),
  p(87, "Akash Madhwal", "India", false, "BOWL", 30, 0.75, "SET 2", "FAST_BOWLER", 12, 73, 73, 54, 77, 80),
  p(88, "Luke Wood", "England", true, "BOWL", 28, 0.75, "SET 2", "FAST_BOWLER", 20, 74, 75, 55, 74, 76),
  p(89, "Matthew Forde", "West Indies", true, "BOWL", 24, 0.75, "SET 2", "FAST_BOWLER", 22, 72, 74, 31, 70, 86),
  p(90, "Ambati Rayudu", "India", false, "BAT", 39, 0.5, "SET 3", "BATSMAN", 80, 21, 77, 89, 83, 42),
  p(91, "Anmolpreet Singh", "India", false, "BAT", 26, 0.5, "SET 3", "BATSMAN", 71, 21, 75, 60, 70, 75),
  p(92, "Yash Dhull", "India", false, "BAT", 23, 0.5, "SET 3", "BATSMAN", 74, 17, 73, 33, 76, 88),
  p(93, "Chris Gayle", "West Indies", true, "BAT", 45, 0.5, "SET 3", "BATSMAN", 81, 22, 83, 92, 77, 47),
  p(94, "Samarth Vyas", "India", false, "BAT", 25, 0.5, "SET 3", "BATSMAN", 66, 20, 64, 61, 64, 72),
  p(95, "Arpit Vasavada", "India", false, "BAT", 31, 0.5, "SET 3", "BATSMAN", 69, 23, 70, 74, 66, 74),
  p(96, "Jacques Kallis", "South Africa", true, "AR", 49, 0.5, "SET 3", "ALL_ROUNDER", 81, 82, 80, 93, 80, 53),
  p(97, "Abhinav Sadarangani", "India", false, "AR", 27, 0.5, "SET 3", "ALL_ROUNDER", 62, 64, 67, 74, 70, 68),
  p(98, "Wriddhiman Saha", "India", false, "WK", 40, 0.5, "SET 3", "WICKET_KEEPER", 71, 5, 72, 91, 72, 48),
  p(99, "B R Sharath", "India", false, "WK", 28, 0.5, "SET 3", "WICKET_KEEPER", 69, 9, 70, 57, 63, 70),
  p(100, "Upendra Yadav", "India", false, "WK", 22, 0.5, "SET 3", "WICKET_KEEPER", 63, 8, 64, 25, 65, 83),
  p(101, "Mayank Markande", "India", false, "BOWL", 28, 0.5, "SET 3", "FAST_BOWLER", 11, 73, 75, 61, 76, 74),
  p(102, "Karn Sharma", "India", false, "BOWL", 36, 0.5, "SET 3", "FAST_BOWLER", 14, 71, 74, 80, 72, 72),
  p(103, "Akash Singh", "India", false, "BOWL", 22, 0.5, "SET 3", "FAST_BOWLER", 11, 72, 66, 37, 66, 94),
  p(104, "Mitch McClenaghan", "New Zealand", true, "BOWL", 38, 0.5, "SET 3", "FAST_BOWLER", 17, 74, 74, 97, 67, 49),
  p(105, "Brett Lee", "Australia", true, "BOWL", 49, 0.5, "SET 3", "FAST_BOWLER", 20, 85, 87, 96, 83, 52),
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
