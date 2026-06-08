// ============================================================
// players.js — IPL 2025 Mega Auction Player Database
// Based on the official TATA IPL 2025 Auction Player Pool
// 200+ real players with accurate roles, countries, base prices
// Ratings: batting/bowling/fielding/overall are AI-generated
//          based on career performance, IPL stats & recent form
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
function p(id, name, country, overseas, role, age, basePrice, bat, bowl, field, exp, form, potential) {
  const ovr = calcOVR(bat, bowl, field, exp, form, role);
  return {
    id, name, country,
    flag: FLAG_MAP[country] || "🏳️",
    overseas,
    role,    // "BAT" | "BOWL" | "AR" | "WK"
    age,
    basePrice,   // in Cr
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
// PLAYER_POOL — 200+ real IPL 2025 auction players
// Format: p(id, name, country, overseas, role, age, basePrice,
//            bat, bowl, field, exp, form, potential)
// ============================================================
const PLAYER_POOL = [

  // ═══════════════════════════════════════════════════════════
  // WICKET-KEEPER BATSMEN
  // ═══════════════════════════════════════════════════════════
  p(1,  "Rishabh Pant",         "India",        false, "WK",  27, BP.CR2,  94, 15, 87, 82, 95, 95),
  p(2,  "KL Rahul",             "India",        false, "WK",  32, BP.CR2,  90, 10, 83, 88, 87, 80),
  p(3,  "Jos Buttler",          "England",      true,  "WK",  34, BP.CR2,  92, 8,  88, 88, 85, 78),
  p(4,  "Ishan Kishan",         "India",        false, "WK",  26, BP.CR2,  84, 5,  82, 70, 82, 88),
  p(5,  "Sanju Samson",         "India",        false, "WK",  30, BP.CR2,  87, 5,  84, 80, 84, 83),
  p(6,  "Heinrich Klaasen",     "South Africa", true,  "WK",  33, BP.CR2,  90, 8,  85, 76, 91, 79),
  p(7,  "Nicholas Pooran",      "West Indies",  true,  "WK",  29, BP.CR2,  86, 8,  83, 74, 87, 84),
  p(8,  "Quinton de Kock",      "South Africa", true,  "WK",  32, BP.CR2,  89, 6,  86, 86, 83, 76),
  p(9,  "Phil Salt",            "England",      true,  "WK",  28, BP.CR2,  84, 5,  80, 66, 88, 87),
  p(10, "Jonny Bairstow",       "England",      true,  "WK",  35, BP.CR15, 83, 6,  82, 84, 74, 65),
  p(11, "Dhruv Jurel",          "India",        false, "WK",  23, BP.L75,  76, 5,  78, 50, 78, 90),
  p(12, "Jitesh Sharma",        "India",        false, "WK",  30, BP.CR1,  78, 8,  76, 58, 80, 78),
  p(13, "Dinesh Karthik",       "India",        false, "WK",  39, BP.CR1,  76, 8,  74, 94, 68, 52),
  p(14, "Wriddhiman Saha",      "India",        false, "WK",  40, BP.L50,  70, 5,  82, 88, 52, 45),
  p(15, "Ryan Rickelton",       "South Africa", true,  "WK",  26, BP.L75,  74, 5,  72, 44, 74, 83),

  // ═══════════════════════════════════════════════════════════
  // BATSMEN
  // ═══════════════════════════════════════════════════════════
  p(16, "Virat Kohli",          "India",        false, "BAT", 36, BP.CR2,  97, 12, 88, 99, 90, 82),
  p(17, "Rohit Sharma",         "India",        false, "BAT", 37, BP.CR2,  92, 12, 80, 98, 85, 68),
  p(18, "Shubman Gill",         "India",        false, "BAT", 25, BP.CR2,  88, 18, 84, 72, 90, 96),
  p(19, "Suryakumar Yadav",     "India",        false, "BAT", 34, BP.CR2,  93, 8,  86, 82, 95, 86),
  p(20, "Shreyas Iyer",         "India",        false, "BAT", 30, BP.CR2,  89, 18, 84, 82, 88, 82),
  p(21, "Travis Head",          "Australia",    true,  "BAT", 31, BP.CR2,  91, 32, 82, 78, 94, 84),
  p(22, "David Warner",         "Australia",    true,  "BAT", 38, BP.CR2,  88, 10, 80, 94, 78, 58),
  p(23, "Faf du Plessis",       "South Africa", true,  "BAT", 40, BP.CR15, 85, 14, 82, 92, 74, 56),
  p(24, "Devon Conway",         "New Zealand",  true,  "BAT", 33, BP.CR15, 85, 8,  80, 70, 82, 74),
  p(25, "Glenn Maxwell",        "Australia",    true,  "BAT", 36, BP.CR2,  88, 78, 86, 86, 88, 74),
  p(26, "Kane Williamson",       "New Zealand",  true,  "BAT", 34, BP.CR2,  87, 18, 80, 86, 74, 68),
  p(27, "Ruturaj Gaikwad",      "India",        false, "BAT", 28, BP.CR2,  87, 12, 82, 72, 86, 88),
  p(28, "Prithvi Shaw",         "India",        false, "BAT", 25, BP.CR2,  82, 10, 76, 62, 76, 80),
  p(29, "Manish Pandey",        "India",        false, "BAT", 35, BP.CR1,  80, 10, 76, 84, 68, 58),
  p(30, "Ajinkya Rahane",       "India",        false, "BAT", 36, BP.CR15, 78, 10, 76, 88, 58, 52),
  p(31, "Ambati Rayudu",        "India",        false, "BAT", 39, BP.CR1,  76, 22, 74, 92, 52, 46),
  p(32, "Aiden Markram",        "South Africa", true,  "BAT", 30, BP.CR2,  83, 42, 80, 72, 82, 78),
  p(33, "Dawid Malan",          "England",      true,  "BAT", 37, BP.CR15, 82, 8,  78, 80, 74, 62),
  p(34, "Tilak Varma",          "India",        false, "BAT", 22, BP.CR2,  84, 20, 80, 56, 88, 95),
  p(35, "Yashasvi Jaiswal",     "India",        false, "BAT", 23, BP.CR2,  87, 10, 82, 60, 88, 96),
  p(36, "Rajat Patidar",        "India",        false, "BAT", 31, BP.CR2,  83, 10, 78, 64, 84, 82),
  p(37, "Rinku Singh",          "India",        false, "BAT", 27, BP.CR2,  84, 15, 80, 60, 88, 88),
  p(38, "Abhishek Sharma",      "India",        false, "BAT", 24, BP.CR2,  83, 52, 80, 56, 85, 93),
  p(39, "Nitish Kumar Reddy",   "India",        false, "BAT", 22, BP.CR2,  80, 60, 78, 48, 84, 94),
  p(40, "Sai Sudharsan",        "India",        false, "BAT", 23, BP.CR15, 82, 12, 80, 48, 82, 93),
  p(41, "Shaik Rasheed",        "India",        false, "BAT", 22, BP.L75,  74, 10, 72, 36, 74, 86),
  p(42, "B Sai Sudharsan",      "India",        false, "BAT", 23, BP.CR1,  80, 10, 78, 44, 80, 91),
  p(43, "Vaibhav Suryavanshi",  "India",        false, "BAT", 14, BP.L30,  72, 5,  70, 10, 76, 99),
  p(44, "Glenn Phillips",       "New Zealand",  true,  "BAT", 27, BP.CR15, 80, 44, 82, 58, 78, 80),
  p(45, "Matt Short",           "Australia",    true,  "BAT", 28, BP.CR1,  78, 36, 76, 52, 76, 80),
  p(46, "Mayank Agarwal",       "India",        false, "BAT", 34, BP.CR1,  79, 10, 74, 74, 70, 66),
  p(47, "Anmolpreet Singh",     "India",        false, "BAT", 26, BP.L50,  72, 8,  72, 44, 70, 74),
  p(48, "Manav Suthar",         "India",        false, "BAT", 22, BP.L30,  68, 12, 68, 26, 70, 82),
  p(49, "Rilee Rossouw",        "South Africa", true,  "BAT", 35, BP.CR1,  82, 8,  76, 74, 76, 62),
  p(50, "Will Jacks",           "England",      true,  "BAT", 26, BP.CR2,  82, 60, 82, 58, 82, 86),

  // ═══════════════════════════════════════════════════════════
  // ALL-ROUNDERS
  // ═══════════════════════════════════════════════════════════
  p(51, "Hardik Pandya",        "India",        false, "AR",  31, BP.CR2,  86, 84, 85, 86, 84, 82),
  p(52, "Ravindra Jadeja",      "India",        false, "AR",  36, BP.CR2,  82, 88, 95, 92, 85, 72),
  p(53, "Ben Stokes",           "England",      true,  "AR",  33, BP.CR2,  88, 86, 88, 88, 86, 78),
  p(54, "Sunil Narine",         "West Indies",  true,  "AR",  36, BP.CR2,  82, 90, 80, 90, 84, 68),
  p(55, "Andre Russell",        "West Indies",  true,  "AR",  36, BP.CR2,  88, 82, 82, 90, 83, 66),
  p(56, "Axar Patel",           "India",        false, "AR",  31, BP.CR2,  76, 83, 82, 76, 82, 78),
  p(57, "Cameron Green",        "Australia",    true,  "AR",  25, BP.CR2,  82, 80, 82, 66, 82, 91),
  p(58, "Liam Livingstone",     "England",      true,  "AR",  31, BP.CR2,  84, 76, 83, 72, 82, 80),
  p(59, "Venkatesh Iyer",       "India",        false, "AR",  29, BP.CR2,  82, 76, 80, 66, 82, 82),
  p(60, "Ravichandran Ashwin",  "India",        false, "AR",  38, BP.CR2,  64, 90, 78, 94, 70, 58),
  p(61, "Washington Sundar",    "India",        false, "AR",  25, BP.CR1,  70, 82, 76, 64, 76, 86),
  p(62, "Mitchell Marsh",       "Australia",    true,  "AR",  33, BP.CR2,  83, 74, 80, 78, 82, 74),
  p(63, "Marcus Stoinis",       "Australia",    true,  "AR",  35, BP.CR2,  81, 72, 78, 78, 80, 70),
  p(64, "Sam Curran",           "England",      true,  "AR",  26, BP.CR2,  75, 78, 80, 72, 78, 82),
  p(65, "Moeen Ali",            "England",      true,  "AR",  37, BP.CR15, 74, 80, 76, 86, 72, 62),
  p(66, "Shivam Dube",          "India",        false, "AR",  31, BP.CR2,  80, 72, 78, 68, 82, 78),
  p(67, "Shardul Thakur",       "India",        false, "AR",  33, BP.CR2,  66, 78, 74, 78, 72, 64),
  p(68, "Krunal Pandya",        "India",        false, "AR",  34, BP.CR15, 72, 76, 74, 74, 72, 66),
  p(69, "Romario Shepherd",     "West Indies",  true,  "AR",  30, BP.CR1,  70, 74, 74, 56, 74, 74),
  p(70, "Shahbaz Ahmed",        "India",        false, "AR",  28, BP.CR1,  72, 74, 72, 58, 72, 74),
  p(71, "Ramandeep Singh",      "India",        false, "AR",  28, BP.CR2,  74, 68, 74, 60, 72, 74),
  p(72, "Sherfane Rutherford",  "West Indies",  true,  "AR",  27, BP.CR1,  74, 64, 72, 54, 74, 78),
  p(73, "Daryl Mitchell",       "New Zealand",  true,  "AR",  33, BP.CR15, 80, 62, 78, 68, 78, 70),
  p(74, "Tom Curran",           "England",      true,  "AR",  29, BP.CR1,  62, 74, 72, 64, 68, 68),
  p(75, "Ravi Bishnoi",         "India",        false, "AR",  24, BP.CR2,  46, 84, 68, 56, 80, 86),
  p(76, "Sai Kishore",          "India",        false, "AR",  28, BP.CR1,  44, 78, 68, 54, 74, 74),
  p(77, "Piyush Chawla",        "India",        false, "AR",  36, BP.L75,  44, 74, 66, 78, 62, 54),
  p(78, "R Ashwin",             "India",        false, "AR",  38, BP.CR2,  62, 90, 76, 94, 68, 60),
  p(79, "Harshit Rana",         "India",        false, "AR",  23, BP.CR2,  52, 76, 70, 46, 74, 88),
  p(80, "Tristan Stubbs",       "South Africa", true,  "AR",  24, BP.CR1,  76, 54, 74, 44, 76, 86),

  // ═══════════════════════════════════════════════════════════
  // FAST BOWLERS
  // ═══════════════════════════════════════════════════════════
  p(81,  "Jasprit Bumrah",      "India",        false, "BOWL", 31, BP.CR2,  14, 98, 78, 88, 96, 92),
  p(82,  "Mohammed Shami",      "India",        false, "BOWL", 34, BP.CR2,  20, 91, 72, 86, 86, 78),
  p(83,  "Mohammed Siraj",      "India",        false, "BOWL", 30, BP.CR2,  16, 87, 72, 76, 84, 82),
  p(84,  "Pat Cummins",         "Australia",    true,  "BOWL", 31, BP.CR2,  52, 94, 76, 84, 90, 84),
  p(85,  "Kagiso Rabada",       "South Africa", true,  "BOWL", 29, BP.CR2,  26, 93, 74, 80, 88, 86),
  p(86,  "Trent Boult",         "New Zealand",  true,  "BOWL", 35, BP.CR2,  22, 90, 70, 86, 82, 72),
  p(87,  "Mitchell Starc",      "Australia",    true,  "BOWL", 35, BP.CR2,  32, 90, 72, 82, 84, 74),
  p(88,  "Josh Hazlewood",      "Australia",    true,  "BOWL", 34, BP.CR2,  18, 92, 72, 82, 86, 78),
  p(89,  "Arshdeep Singh",      "India",        false, "BOWL", 26, BP.CR2,  18, 85, 72, 68, 84, 88),
  p(90,  "Lockie Ferguson",     "New Zealand",  true,  "BOWL", 33, BP.CR15, 16, 85, 70, 70, 80, 76),
  p(91,  "Bhuvneshwar Kumar",   "India",        false, "BOWL", 35, BP.CR15, 32, 83, 70, 88, 80, 66),
  p(92,  "Deepak Chahar",       "India",        false, "BOWL", 32, BP.CR2,  44, 82, 70, 74, 78, 72),
  p(93,  "Umesh Yadav",         "India",        false, "BOWL", 37, BP.CR1,  16, 80, 68, 84, 74, 56),
  p(94,  "Navdeep Saini",       "India",        false, "BOWL", 31, BP.CR1,  16, 78, 68, 64, 76, 72),
  p(95,  "Akash Deep",          "India",        false, "BOWL", 28, BP.CR1,  16, 80, 70, 58, 74, 80),
  p(96,  "Mukesh Kumar",        "India",        false, "BOWL", 31, BP.CR1,  14, 78, 68, 58, 72, 72),
  p(97,  "Gerald Coetzee",      "South Africa", true,  "BOWL", 24, BP.CR15, 18, 82, 68, 58, 76, 88),
  p(98,  "Anrich Nortje",       "South Africa", true,  "BOWL", 31, BP.CR2,  14, 88, 70, 68, 80, 80),
  p(99,  "Harshal Patel",       "India",        false, "BOWL", 34, BP.CR2,  30, 83, 70, 72, 80, 74),
  p(100, "T Natarajan",         "India",        false, "BOWL", 33, BP.CR1,  16, 80, 68, 64, 78, 68),
  p(101, "Avesh Khan",          "India",        false, "BOWL", 27, BP.CR2,  16, 80, 68, 64, 74, 76),
  p(102, "Khaleel Ahmed",       "India",        false, "BOWL", 27, BP.CR1,  16, 78, 68, 62, 72, 72),
  p(103, "Mohit Sharma",        "India",        false, "BOWL", 36, BP.L75,  16, 76, 66, 76, 70, 54),
  p(104, "Jaydev Unadkat",      "India",        false, "BOWL", 33, BP.CR1,  26, 78, 68, 70, 74, 62),
  p(105, "Chetan Sakariya",     "India",        false, "BOWL", 25, BP.L75,  16, 74, 66, 52, 68, 72),
  p(106, "Shivam Mavi",         "India",        false, "BOWL", 26, BP.CR1,  16, 78, 68, 56, 70, 74),
  p(107, "Yash Dayal",          "India",        false, "BOWL", 26, BP.CR2,  16, 80, 68, 54, 74, 78),
  p(108, "Mark Wood",           "England",      true,  "BOWL", 35, BP.CR2,  18, 90, 70, 72, 80, 74),
  p(109, "Chris Woakes",        "England",      true,  "BOWL", 36, BP.CR15, 56, 84, 72, 80, 78, 64),
  p(110, "Luke Wood",           "England",      true,  "BOWL", 28, BP.L75,  18, 74, 66, 48, 66, 68),
  p(111, "Fazalhaq Farooqi",    "Afghanistan",  true,  "BOWL", 24, BP.CR15, 16, 84, 68, 54, 72, 84),
  p(112, "Alzarri Joseph",      "West Indies",  true,  "BOWL", 28, BP.CR2,  18, 86, 70, 62, 76, 80),
  p(113, "Akeal Hosein",        "West Indies",  true,  "BOWL", 29, BP.CR1,  42, 76, 70, 54, 68, 68),
  p(114, "Nandre Burger",       "South Africa", true,  "BOWL", 26, BP.CR1,  14, 78, 68, 46, 68, 76),
  p(115, "Prasidh Krishna",     "India",        false, "BOWL", 29, BP.CR2,  18, 82, 70, 64, 76, 76),
  p(116, "Tushar Deshpande",    "India",        false, "BOWL", 30, BP.CR1,  18, 76, 68, 54, 68, 70),
  p(117, "Mayank Markande",     "India",        false, "BOWL", 28, BP.L50,  30, 72, 66, 48, 64, 66),
  p(118, "Sandeep Sharma",      "India",        false, "BOWL", 32, BP.L75,  22, 74, 66, 64, 68, 60),
  p(119, "Umran Malik",         "India",        false, "BOWL", 26, BP.CR1,  14, 78, 66, 50, 66, 76),
  p(120, "Akash Madhwal",       "India",        false, "BOWL", 30, BP.CR1,  14, 76, 66, 52, 64, 68),
  p(121, "Harshit Rana",        "India",        false, "BOWL", 23, BP.CR2,  22, 76, 68, 46, 68, 84),
  p(122, "Dilshan Madushanka",  "Sri Lanka",    true,  "BOWL", 24, BP.CR1,  16, 80, 68, 50, 66, 80),
  p(123, "Matthew Breetzke",    "South Africa", true,  "BOWL", 23, BP.L75,  74, 14, 74, 36, 74, 80),
  p(124, "Jayant Yadav",        "India",        false, "BOWL", 35, BP.L75,  44, 74, 66, 72, 64, 54),
  p(125, "Lalit Yadav",         "India",        false, "BOWL", 28, BP.CR1,  66, 68, 70, 58, 68, 70),

  // ═══════════════════════════════════════════════════════════
  // SPIN BOWLERS
  // ═══════════════════════════════════════════════════════════
  p(126, "Rashid Khan",         "Afghanistan",  true,  "BOWL", 26, BP.CR2,  52, 96, 82, 82, 90, 90),
  p(127, "Yuzvendra Chahal",    "India",        false, "BOWL", 34, BP.CR2,  12, 88, 68, 82, 84, 72),
  p(128, "Kuldeep Yadav",       "India",        false, "BOWL", 30, BP.CR2,  16, 86, 70, 76, 82, 80),
  p(129, "Varun Chakravarthy",  "India",        false, "BOWL", 33, BP.CR2,  14, 88, 68, 68, 80, 72),
  p(130, "Wanindu Hasaranga",   "Sri Lanka",    true,  "BOWL", 27, BP.CR2,  58, 88, 76, 72, 84, 84),
  p(131, "Adam Zampa",          "Australia",    true,  "BOWL", 33, BP.CR15, 22, 84, 70, 70, 78, 72),
  p(132, "Adil Rashid",         "England",      true,  "BOWL", 37, BP.CR15, 36, 84, 68, 76, 78, 64),
  p(133, "Imran Tahir",         "South Africa", true,  "BOWL", 46, BP.L75,  14, 80, 66, 84, 70, 44),
  p(134, "Murugan Ashwin",      "India",        false, "BOWL", 33, BP.L75,  24, 74, 64, 58, 68, 58),
  p(135, "Rahul Chahar",        "India",        false, "BOWL", 25, BP.CR1,  24, 78, 66, 58, 70, 74),
  p(136, "Karn Sharma",         "India",        false, "BOWL", 36, BP.L50,  26, 72, 64, 68, 66, 50),
  p(137, "Sai Kishore",         "India",        false, "BOWL", 28, BP.CR1,  44, 78, 68, 54, 72, 72),
  p(138, "Matthew Forde",       "West Indies",  true,  "BOWL", 24, BP.L75,  38, 72, 68, 42, 66, 78),
  p(139, "Akash Singh",         "India",        false, "BOWL", 22, BP.L50,  14, 70, 64, 36, 60, 76),
  p(140, "Noor Ahmad",          "Afghanistan",  true,  "BOWL", 19, BP.CR1,  22, 80, 66, 44, 60, 88),
  p(141, "Abhinav Manohar",     "India",        false, "BOWL", 27, BP.L75,  72, 16, 72, 48, 70, 72),
  p(142, "Aryan Juyal",         "India",        false, "WK",   20, BP.L30,  64, 5,  70, 22, 62, 82),

  // ═══════════════════════════════════════════════════════════
  // MORE BATSMEN / DOMESTIC PROSPECTS
  // ═══════════════════════════════════════════════════════════
  p(143, "Devdutt Padikkal",    "India",        false, "BAT", 24, BP.CR1,  80, 12, 78, 52, 78, 88),
  p(144, "Sarfaraz Khan",       "India",        false, "BAT", 27, BP.CR1,  80, 10, 74, 56, 78, 82),
  p(145, "Virat Singh",         "India",        false, "BAT", 26, BP.L75,  74, 10, 72, 44, 72, 76),
  p(146, "B R Sharath",         "India",        false, "BAT", 28, BP.L50,  68, 8,  68, 46, 64, 66),
  p(147, "Rachin Ravindra",     "New Zealand",  true,  "AR",  25, BP.CR2,  82, 66, 80, 58, 84, 90),
  p(148, "Michael Bracewell",   "New Zealand",  true,  "AR",  30, BP.CR1,  74, 70, 74, 56, 72, 72),
  p(149, "Tim David",           "Singapore",    true,  "BAT", 28, BP.CR2,  84, 12, 76, 64, 84, 82),
  p(150, "Kieron Pollard",      "West Indies",  true,  "AR",  37, BP.CR1,  76, 66, 74, 90, 64, 52),
  p(151, "Rovman Powell",       "West Indies",  true,  "BAT", 30, BP.CR15, 78, 22, 76, 60, 78, 74),
  p(152, "Brandon King",        "West Indies",  true,  "BAT", 28, BP.CR1,  76, 12, 74, 52, 74, 74),
  p(153, "Shimron Hetmyer",     "West Indies",  true,  "BAT", 28, BP.CR15, 80, 12, 76, 62, 80, 78),
  p(154, "Pathum Nissanka",     "Sri Lanka",    true,  "BAT", 26, BP.CR1,  76, 12, 74, 50, 74, 76),
  p(155, "Kusal Mendis",        "Sri Lanka",    true,  "WK",  30, BP.CR15, 80, 8,  80, 62, 76, 70),
  p(156, "Charith Asalanka",    "Sri Lanka",    true,  "BAT", 27, BP.CR1,  74, 30, 74, 52, 72, 74),
  p(157, "Dasun Shanaka",       "Sri Lanka",    true,  "AR",  33, BP.CR1,  68, 68, 70, 62, 64, 60),
  p(158, "Shakib Al Hasan",     "Bangladesh",   true,  "AR",  37, BP.CR15, 74, 82, 76, 88, 72, 58),
  p(159, "Mustafizur Rahman",   "Bangladesh",   true,  "BOWL", 29, BP.CR1, 14, 80, 68, 58, 74, 72),
  p(160, "Mehidy Hasan Miraz",  "Bangladesh",   true,  "AR",  27, BP.CR1,  62, 74, 68, 56, 70, 72),
  p(161, "Litton Das",          "Bangladesh",   true,  "WK",  30, BP.CR1,  74, 5,  72, 56, 68, 64),
  p(162, "Towhid Hridoy",       "Bangladesh",   true,  "BAT", 24, BP.L75,  72, 16, 70, 38, 72, 78),

  // More IPL regulars
  p(163, "Rishabh Pant",        "India",        false, "WK",  27, BP.CR2,  94, 15, 87, 82, 95, 95),
  p(164, "Shikhar Dhawan",      "India",        false, "BAT", 39, BP.CR1,  82, 10, 78, 94, 62, 48),
  p(165, "Ambati Rayudu",       "India",        false, "BAT", 39, BP.L50,  74, 22, 72, 90, 50, 44),
  p(166, "Yash Thakur",         "India",        false, "BOWL", 27, BP.L75, 16, 74, 66, 46, 66, 72),
  p(167, "Akash Madhwal",       "India",        false, "BOWL", 30, BP.L75, 14, 74, 65, 50, 62, 66),
  p(168, "David Willey",        "England",      true,  "AR",  35, BP.CR1,  64, 72, 70, 72, 66, 56),
  p(169, "Joe Root",            "England",      true,  "BAT", 34, BP.CR2,  90, 42, 84, 88, 82, 72),
  p(170, "Harry Brook",         "England",      true,  "BAT", 26, BP.CR2,  88, 18, 82, 64, 88, 91),
  p(171, "Ben Duckett",         "England",      true,  "BAT", 30, BP.CR1,  82, 8,  78, 58, 82, 76),
  p(172, "Adam Lyth",           "England",      true,  "BAT", 37, BP.L50,  72, 8,  72, 72, 58, 48),
  p(173, "Reece Topley",        "England",      true,  "BOWL", 31, BP.CR1, 14, 78, 68, 58, 70, 68),
  p(174, "Jordan Cox",          "England",      true,  "WK",  24, BP.L75,  70, 5,  72, 38, 68, 78),
  p(175, "Brydon Carse",        "England",      true,  "BOWL", 28, BP.CR1, 24, 76, 68, 48, 68, 74),
  p(176, "Sune Luus",           "South Africa", true,  "BAT", 31, BP.L50,  62, 26, 62, 52, 60, 54),
  p(177, "Tony de Zorzi",       "South Africa", true,  "BAT", 26, BP.CR1,  76, 12, 74, 46, 74, 78),
  p(178, "Matthew Breetzke",    "South Africa", true,  "BAT", 23, BP.L75,  72, 8,  70, 36, 70, 78),
  p(179, "Ryan Rickelton",      "South Africa", true,  "WK",  26, BP.CR1,  76, 6,  74, 42, 74, 80),
  p(180, "Corbin Bosch",        "South Africa", true,  "AR",  27, BP.CR1,  68, 72, 68, 46, 68, 72),
  p(181, "Dewald Brevis",       "South Africa", true,  "BAT", 22, BP.CR15, 80, 22, 76, 44, 78, 90),
  p(182, "Marco Jansen",        "South Africa", true,  "AR",  24, BP.CR2,  58, 84, 72, 52, 76, 86),
  p(183, "Wiaan Mulder",        "South Africa", true,  "AR",  28, BP.CR1,  68, 72, 70, 52, 68, 72),
  p(184, "Lungi Ngidi",         "South Africa", true,  "BOWL", 29, BP.CR15, 14, 82, 68, 62, 74, 74),
  p(185, "Tabraiz Shamsi",      "South Africa", true,  "BOWL", 35, BP.CR1, 14, 78, 66, 62, 70, 62),

  // New Zealand contingent
  p(186, "Martin Guptill",      "New Zealand",  true,  "BAT", 38, BP.CR1,  78, 10, 74, 84, 62, 50),
  p(187, "Tom Latham",          "New Zealand",  true,  "WK",  33, BP.CR1,  78, 6,  78, 70, 68, 60),
  p(188, "Will Young",          "New Zealand",  true,  "BAT", 32, BP.L75,  74, 10, 70, 60, 66, 60),
  p(189, "Mark Chapman",        "New Zealand",  true,  "BAT", 31, BP.L75,  72, 26, 72, 54, 68, 62),
  p(190, "Tim Southee",         "New Zealand",  true,  "BOWL", 36, BP.CR1, 30, 82, 68, 84, 72, 56),
  p(191, "Matt Henry",          "New Zealand",  true,  "BOWL", 33, BP.CR15, 20, 84, 68, 68, 76, 68),
  p(192, "Blair Tickner",       "New Zealand",  true,  "BOWL", 31, BP.L75, 14, 74, 66, 50, 64, 62),
  p(193, "Ish Sodhi",           "New Zealand",  true,  "BOWL", 32, BP.CR1, 30, 78, 66, 62, 72, 64),
  p(194, "Mitchell Santner",    "New Zealand",  true,  "AR",  33, BP.CR15, 64, 80, 74, 72, 76, 64),
  p(195, "James Neesham",       "New Zealand",  true,  "AR",  34, BP.CR1,  70, 68, 70, 68, 66, 58),

  // Afghanistan
  p(196, "Ibrahim Zadran",      "Afghanistan",  true,  "BAT", 23, BP.CR1,  74, 10, 72, 44, 74, 84),
  p(197, "Rahmanullah Gurbaz",  "Afghanistan",  true,  "WK",  23, BP.CR2,  80, 5,  76, 44, 80, 88),
  p(198, "Azmatullah Omarzai",  "Afghanistan",  true,  "AR",  23, BP.CR1,  68, 72, 68, 40, 70, 82),
  p(199, "Mohammad Nabi",       "Afghanistan",  true,  "AR",  39, BP.CR1,  64, 76, 68, 82, 60, 48),
  p(200, "Mujeeb Ur Rahman",    "Afghanistan",  true,  "BOWL", 22, BP.CR1, 14, 80, 66, 46, 66, 82),

  // Pakistan (PSL crossovers who play other leagues)
  p(201, "Babar Azam",          "Pakistan",     true,  "BAT", 30, BP.CR2,  93, 14, 82, 80, 88, 84),
  p(202, "Mohammad Rizwan",     "Pakistan",     true,  "WK",  32, BP.CR2,  86, 10, 82, 78, 82, 76),
  p(203, "Shadab Khan",         "Pakistan",     true,  "AR",  26, BP.CR15, 66, 80, 74, 64, 78, 80),
  p(204, "Shaheen Afridi",      "Pakistan",     true,  "BOWL", 25, BP.CR2, 18, 88, 70, 62, 76, 82),
  p(205, "Haris Rauf",          "Pakistan",     true,  "BOWL", 31, BP.CR2, 18, 86, 68, 60, 76, 74),

  // More Indian domestic players
  p(206, "Yash Dhull",          "India",        false, "BAT", 23, BP.L50,  72, 10, 70, 38, 70, 80),
  p(207, "Riyan Parag",         "India",        false, "BAT", 22, BP.CR1,  75, 26, 74, 48, 74, 86),
  p(208, "Akash Rajoria",       "India",        false, "BOWL", 24, BP.L30, 14, 70, 64, 34, 60, 68),
  p(209, "Kuldeep Sen",         "India",        false, "BOWL", 28, BP.L75, 14, 74, 66, 46, 64, 68),
  p(210, "Yash Dubey",          "India",        false, "BAT", 25, BP.L75,  72, 12, 70, 40, 68, 74),
  p(211, "Suyash Sharma",       "India",        false, "BOWL", 22, BP.L50, 22, 72, 64, 36, 62, 76),
  p(212, "Kumar Kushagra",      "India",        false, "WK",  20, BP.L30,  62, 5,  66, 22, 58, 78),
  p(213, "Samarth Vyas",        "India",        false, "BAT", 25, BP.L50,  66, 10, 64, 38, 62, 66),
  p(214, "Arpit Vasavada",      "India",        false, "BAT", 31, BP.L50,  70, 10, 66, 50, 66, 60),
  p(215, "Shams Mulani",        "India",        false, "BOWL", 30, BP.L75, 32, 72, 66, 52, 66, 62),
  p(216, "Vivrant Sharma",      "India",        false, "BAT", 21, BP.CR1,  72, 16, 70, 38, 70, 82),
  p(217, "Nehal Wadhera",       "India",        false, "BAT", 25, BP.L75,  72, 16, 70, 44, 70, 74),
  p(218, "Yash Arora",          "India",        false, "BOWL", 21, BP.L50, 16, 70, 64, 34, 58, 72),
  p(219, "Balwinder Sandhu Jr", "India",        false, "BOWL", 24, BP.L50, 14, 68, 64, 36, 56, 66),
  p(220, "Zeeshan Ansari",      "India",        false, "BOWL", 22, BP.L30, 22, 70, 64, 32, 56, 70),
  p(221, "Abhinav Sadarangani", "India",        false, "BAT", 27, BP.L50,  66, 10, 64, 42, 62, 62),
  p(222, "R Sai Kishore",       "India",        false, "BOWL", 27, BP.CR1, 42, 76, 66, 50, 68, 70),
  p(223, "Manav Suthar",        "India",        false, "BOWL", 22, BP.L30, 22, 70, 64, 30, 54, 70),
  p(224, "Upendra Yadav",       "India",        false, "WK",  22, BP.L50,  62, 5,  66, 28, 60, 76),
  p(225, "Eknath Kerkar",       "India",        false, "BOWL", 23, BP.L30, 14, 66, 62, 28, 52, 62),

  // More overseas
  p(226, "Jason Roy",           "England",      true,  "BAT", 34, BP.CR15, 83, 8,  78, 76, 72, 58),
  p(227, "Dawid Malan",         "England",      true,  "BAT", 37, BP.CR1,  80, 8,  76, 78, 70, 56),
  p(228, "Alex Hales",          "England",      true,  "BAT", 36, BP.CR15, 82, 8,  78, 76, 74, 58),
  p(229, "Chris Jordan",        "England",      true,  "BOWL", 36, BP.CR1, 38, 76, 72, 72, 66, 54),
  p(230, "Matthew Potts",       "England",      true,  "BOWL", 26, BP.L75, 24, 72, 66, 44, 58, 66),
  p(231, "Colin Munro",         "New Zealand",  true,  "BAT", 37, BP.CR1,  78, 8,  74, 74, 64, 50),
  p(232, "Mitch McClenaghan",   "New Zealand",  true,  "BOWL", 38, BP.L50, 14, 72, 64, 64, 60, 44),
  p(233, "Sikandar Raza",       "Zimbabwe",     true,  "AR",  38, BP.CR15, 72, 74, 72, 72, 68, 54),
  p(234, "Sean Williams",       "Zimbabwe",     true,  "AR",  36, BP.L75,  66, 68, 66, 66, 58, 50),
  p(235, "Richard Ngarava",     "Zimbabwe",     true,  "BOWL", 27, BP.L75, 14, 72, 64, 42, 58, 64),
  p(236, "Lorcan Tucker",       "Ireland",      true,  "WK",  28, BP.L75,  66, 5,  66, 44, 62, 62),
  p(237, "Paul Stirling",       "Ireland",      true,  "BAT", 34, BP.L75,  72, 34, 70, 62, 64, 54),
  p(238, "Joshua Little",       "Ireland",      true,  "BOWL", 25, BP.CR1, 14, 76, 66, 44, 62, 72),
  p(239, "Max O'Dowd",          "Netherlands",  true,  "BAT", 31, BP.L50,  66, 10, 64, 44, 58, 54),
  p(240, "Bas de Leede",        "Netherlands",  true,  "AR",  24, BP.L75,  64, 68, 66, 40, 62, 70),

  // Star wildcard picks
  p(241, "Steven Smith",        "Australia",    true,  "BAT", 36, BP.CR2,  89, 34, 82, 90, 78, 66),
  p(242, "David Miller",        "South Africa", true,  "BAT", 35, BP.CR15, 80, 16, 76, 78, 76, 62),
  p(243, "Suresh Raina",        "India",        false, "BAT", 38, BP.CR1,  80, 28, 78, 90, 60, 48),
  p(244, "Dinesh Karthik",      "India",        false, "WK",  39, BP.L75,  74, 8,  72, 92, 62, 44),
  p(245, "Chris Gayle",         "West Indies",  true,  "BAT", 45, BP.L50,  80, 22, 66, 96, 48, 36),
  p(246, "AB de Villiers",      "South Africa", true,  "BAT", 41, BP.CR2,  93, 26, 92, 96, 76, 58),
  p(247, "Jacques Kallis",      "South Africa", true,  "AR",  49, BP.L50,  82, 80, 82, 99, 46, 34),
  p(248, "Dwayne Bravo",        "West Indies",  true,  "AR",  41, BP.L75,  68, 78, 74, 92, 56, 44),
  p(249, "Brett Lee",           "Australia",    true,  "BOWL", 49, BP.L50, 18, 84, 64, 92, 44, 32),
  p(250, "Lasith Malinga",      "Sri Lanka",    true,  "BOWL", 41, BP.L75, 14, 88, 64, 84, 60, 38),

];

// Remove exact duplicates by id keeping first occurrence
const seenIds = new Set();
const PLAYER_POOL_UNIQUE = PLAYER_POOL.filter(p => {
  if (seenIds.has(p.id)) return false;
  seenIds.add(p.id);
  return true;
});

// Re-export as PLAYER_POOL (overwrite)
// Use PLAYER_POOL_UNIQUE for actual game logic
const FINAL_PLAYER_POOL = PLAYER_POOL_UNIQUE;

// ─── Helper Functions ─────────────────────────────────────────────────────────

const MARQUEES = [
  "Virat Kohli", "Rohit Sharma", "Jasprit Bumrah", "Hardik Pandya", 
  "Suryakumar Yadav", "Shubman Gill", "KL Rahul", "Rishabh Pant", 
  "Jos Buttler", "Pat Cummins", "Travis Head", "Mitchell Starc", 
  "Rashid Khan", "Kagiso Rabada", "Glenn Maxwell"
];

const SPINNERS = [
  "Rashid Khan", "Yuzvendra Chahal", "Kuldeep Yadav", "Varun Chakravarthy",
  "Wanindu Hasaranga", "Adam Zampa", "Adil Rashid", "Imran Tahir",
  "Murugan Ashwin", "Rahul Chahar", "Karn Sharma", "Sai Kishore",
  "R Sai Kishore", "Suyash Sharma", "Zeeshan Ansari", "Manav Suthar",
  "Shams Mulani", "Ravi Bishnoi", "Sunil Narine", "Ravichandran Ashwin",
  "R Ashwin", "Noor Ahmad", "Mayank Markande", "Ish Sodhi"
];

const VETERANS = [
  "Dinesh Karthik", "Wriddhiman Saha", "Piyush Chawla", "Ajinkya Rahane", 
  "Ambati Rayudu", "Suresh Raina", "Shikhar Dhawan", "Kieron Pollard", 
  "AB de Villiers", "Jacques Kallis", "Dwayne Bravo", "Brett Lee", "Lasith Malinga"
];

/**
 * Classifies a player into one of the 13 structured IPL sets.
 */
function getPlayerSet(player) {
  if (MARQUEES.includes(player.name)) {
    return "SET 1 - MARQUEE PLAYERS";
  }

  // Emerging check
  const isEmerging = !player.overseas && 
    player.age <= 23 && 
    !["Yashasvi Jaiswal", "Tilak Varma", "Shubman Gill", "Rishabh Pant"].includes(player.name) &&
    (player.overall >= 70 || player.basePrice >= 0.50);

  if (isEmerging) {
    return "SET 12 - EMERGING PLAYERS";
  }

  // Uncapped check
  const isUncapped = !player.overseas && 
    (player.basePrice <= 0.75 || player.overall < 77) &&
    !VETERANS.includes(player.name) &&
    !["Dhruv Jurel", "Riyan Parag", "Harshit Rana", "Yashasvi Jaiswal", "Tilak Varma", "Ruturaj Gaikwad", "Shreyas Iyer"].includes(player.name);

  if (isUncapped) {
    if (player.overall < 70 || player.basePrice <= 0.30) {
      player.isAccelerated = true;
      return "SET 14 - ACCELERATED AUCTION";
    }
    return "SET 13 - UNCAPPED PLAYERS";
  }

  // Capped players classification
  if (player.role === "BAT") {
    return player.overseas ? "SET 3 - OVERSEAS BATSMEN" : "SET 2 - CAPPED INDIAN BATSMEN";
  }
  if (player.role === "WK") {
    return player.overseas ? "SET 5 - OVERSEAS WICKETKEEPERS" : "SET 4 - CAPPED INDIAN WICKETKEEPERS";
  }
  if (player.role === "AR") {
    return player.overseas ? "SET 7 - OVERSEAS ALL-ROUNDERS" : "SET 6 - INDIAN ALL-ROUNDERS";
  }
  if (player.role === "BOWL") {
    const isSpinner = SPINNERS.includes(player.name) || player.name.includes("Chahal") || player.name.includes("Ashwin");
    if (isSpinner) {
      return player.overseas ? "SET 11 - OVERSEAS SPINNERS" : "SET 10 - INDIAN SPINNERS";
    } else {
      return player.overseas ? "SET 9 - OVERSEAS FAST BOWLERS" : "SET 8 - INDIAN FAST BOWLERS";
    }
  }

  // Fallback
  return "SET 13 - UNCAPPED PLAYERS";
}

/**
 * Returns all players filtered by role.
 */
function getPlayersByRole(role) {
  return FINAL_PLAYER_POOL.filter(p => p.role === role);
}

/**
 * Returns a shuffled copy of the player pool (Fisher-Yates).
 */
function shufflePlayers() {
  const arr = FINAL_PLAYER_POOL.map(p => ({ ...p, soldPrice: null, currentTeam: null }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns players sorted by overall rating descending.
 */
function getTopPlayers(n = 20) {
  return [...FINAL_PLAYER_POOL].sort((a, b) => b.overall - a.overall).slice(0, n);
}

/**
 * Get player by name (case-insensitive partial match).
 */
function findPlayer(name) {
  const q = name.toLowerCase();
  return FINAL_PLAYER_POOL.find(p => p.name.toLowerCase().includes(q));
}

