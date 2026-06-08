import * as fs from 'fs';
import * as path from 'path';

// Core Types matching types/index.ts
type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';

interface SeedPlayer {
  id: number;
  name: string;
  country: string;
  age: number;
  role: PlayerRole;
  subRole: string;
  category: string;
  basePrice: number;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  potentialRating: number;
  experienceRating: number;
  formRating: number;
  overallRating: number;
  marketValueScore: number;
  matches: number;
  runs: number;
  wickets: number;
  strikeRate: number;
  economy: number;
  popularity: number;
  auctionStatus: string;
  currentTeam: string | null;
  soldPrice: number | null;
}

// -------------------------------------------------------------
// Real Seed Lists (Realistic Target OVR & Base Prices)
// -------------------------------------------------------------

const REAL_MARQUEES = [
  { name: 'Virat Kohli', country: 'India', age: 36, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 97 },
  { name: 'Rohit Sharma', country: 'India', age: 37, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 94 },
  { name: 'Jasprit Bumrah', country: 'India', age: 31, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 98 },
  { name: 'Rishabh Pant', country: 'India', age: 27, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 95 },
  { name: 'KL Rahul', country: 'India', age: 32, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 91 },
  { name: 'Shubman Gill', country: 'India', age: 25, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 92 },
  { name: 'Yashasvi Jaiswal', country: 'India', age: 23, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 93 },
  { name: 'Hardik Pandya', country: 'India', age: 31, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 93 },
  { name: 'Ravindra Jadeja', country: 'India', age: 36, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 2.0, targetOvr: 94 },
  { name: 'Pat Cummins', country: 'Australia', age: 31, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 95 },
  { name: 'Mitchell Starc', country: 'Australia', age: 35, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 94 },
  { name: 'Travis Head', country: 'Australia', age: 31, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 96 },
  { name: 'Jos Buttler', country: 'England', age: 34, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 95 },
  { name: 'Heinrich Klaasen', country: 'South Africa', age: 33, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 96 },
  { name: 'Rashid Khan', country: 'Afghanistan', age: 26, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 2.0, targetOvr: 97 },
  { name: 'Nicholas Pooran', country: 'West Indies', age: 29, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 94 },
];

const REAL_INDIAN_CAPPED = [
  { name: 'Suryakumar Yadav', age: 34, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 2.0, targetOvr: 89 },
  { name: 'Shreyas Iyer', age: 30, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 2.0, targetOvr: 84 },
  { name: 'Ruturaj Gaikwad', age: 28, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 85 },
  { name: 'Rinku Singh', age: 27, role: 'BAT', subRole: 'Finisher', basePrice: 2.0, targetOvr: 84 },
  { name: 'Tilak Varma', age: 22, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 1.5, targetOvr: 83 },
  { name: 'Sanju Samson', age: 30, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 87 },
  { name: 'Ishan Kishan', age: 26, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 82 },
  { name: 'Mohammed Shami', age: 34, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 87 },
  { name: 'Mohammed Siraj', age: 30, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 85 },
  { name: 'Arshdeep Singh', age: 26, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 85 },
  { name: 'Yuzvendra Chahal', age: 34, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 2.0, targetOvr: 85 },
  { name: 'Kuldeep Yadav', age: 30, role: 'BOWL', subRole: 'Wrist Spinner', basePrice: 2.0, targetOvr: 86 },
  { name: 'Axar Patel', age: 31, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 2.0, targetOvr: 86 },
  { name: 'Shivam Dube', age: 31, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 83 },
  { name: 'Ravi Bishnoi', age: 24, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 1.5, targetOvr: 82 },
  { name: 'Ashwin Ravichandran', age: 38, role: 'BOWL', subRole: 'Off Spinner', basePrice: 1.5, targetOvr: 82 },
  { name: 'Washington Sundar', age: 25, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.5, targetOvr: 81 },
  { name: 'Harshit Rana', age: 23, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 80 },
  { name: 'Nitish Kumar Reddy', age: 22, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 80 },
  { name: 'Dhruv Jurel', age: 23, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.0, targetOvr: 80 },
];

const REAL_OVERSEAS_CAPPED = [
  { name: 'David Warner', country: 'Australia', age: 38, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 85 },
  { name: 'Faf du Plessis', country: 'South Africa', age: 40, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 84 },
  { name: 'Devon Conway', country: 'New Zealand', age: 33, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 85 },
  { name: 'Glenn Maxwell', country: 'Australia', age: 36, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 2.0, targetOvr: 86 },
  { name: 'Andre Russell', country: 'West Indies', age: 36, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 87 },
  { name: 'Sunil Narine', country: 'West Indies', age: 36, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 2.0, targetOvr: 88 },
  { name: 'Marcus Stoinis', country: 'Australia', age: 35, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 84 },
  { name: 'Mitchell Marsh', country: 'Australia', age: 33, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 83 },
  { name: 'Sam Curran', country: 'England', age: 26, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 83 },
  { name: 'Cameron Green', country: 'Australia', age: 25, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 84 },
  { name: 'Liam Livingstone', country: 'England', age: 31, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 2.0, targetOvr: 84 },
  { name: 'Trent Boult', country: 'New Zealand', age: 35, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 86 },
  { name: 'Kagiso Rabada', country: 'South Africa', age: 29, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 87 },
  { name: 'Josh Hazlewood', country: 'Australia', age: 34, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 85 },
  { name: 'Quinton de Kock', country: 'South Africa', age: 32, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 85 },
  { name: 'Phil Salt', country: 'England', age: 28, role: 'WK', subRole: 'WK-Batsman', basePrice: 2.0, targetOvr: 85 },
  { name: 'Harry Brook', country: 'England', age: 26, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 2.0, targetOvr: 84 },
  { name: 'Wanindu Hasaranga', country: 'Sri Lanka', age: 27, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 2.0, targetOvr: 85 },
  { name: 'Marco Jansen', country: 'South Africa', age: 24, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 83 },
  { name: 'Noor Ahmad', country: 'Afghanistan', age: 19, role: 'BOWL', subRole: 'Wrist Spinner', basePrice: 1.5, targetOvr: 83 },
];

// -------------------------------------------------------------
// Procedural Name Helpers
// -------------------------------------------------------------

const IND_FIRST_NAMES = [
  'Aditya', 'Amit', 'Ankit', 'Abhishek', 'Ayush', 'Deepak', 'Dinesh', 'Gaurav', 'Ishaan', 'Jatin',
  'Kartik', 'Kunal', 'Manish', 'Mayank', 'Naman', 'Nikhil', 'Piyush', 'Pranav', 'Rahul', 'Rajat',
  'Rohan', 'Sandeep', 'Saurabh', 'Shivam', 'Shreyas', 'Siddharth', 'Tanmay', 'Tushar', 'Varun', 'Yash',
  'Vivek', 'Harsh', 'Mohit', 'Sanjay', 'Arjun', 'Vijay', 'Rajesh', 'Suresh', 'Karan', 'Ravi'
];

const IND_LAST_NAMES = [
  'Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Yadav', 'Joshi', 'Mishra', 'Pandey', 'Gupta',
  'Reddy', 'Choudhary', 'Rao', 'Nair', 'Iyer', 'Sen', 'Das', 'Roy', 'Prasad', 'Dubey',
  'Mehta', 'Khatri', 'Gill', 'Bhat', 'Dhar', 'Trivedi', 'Solanki', 'Deshmukh', 'Jadhav', 'Gaikwad'
];

const OS_FIRST_NAMES = [
  'David', 'James', 'Steve', 'Matthew', 'Mitchell', 'Glenn', 'Chris', 'Ben', 'Tom', 'Sam',
  'Harry', 'Jos', 'Luke', 'Jake', 'Kane', 'Devon', 'Trent', 'Tim', 'Kagiso', 'Anrich',
  'Quinton', 'Aiden', 'Marco', 'Ryan', 'Heinrich', 'Nicholas', 'Andre', 'Sunil', 'Jason',
  'Alex', 'Mark', 'Joe', 'Pat', 'Marcus', 'Adam', 'Liam', 'Will', 'Phil', 'Jonny'
];

const OS_LAST_NAMES = [
  'Smith', 'Warner', 'Marsh', 'Starc', 'Maxwell', 'Cummins', 'Stokes', 'Curran', 'Brook', 'Buttler',
  'Conway', 'Williamson', 'Boult', 'Southee', 'Rabada', 'Nortje', 'de Kock', 'Markram', 'Jansen', 'Miller',
  'Rickelton', 'Klaasen', 'Pooran', 'Russell', 'Narine', 'Holder', 'Roy', 'Wood', 'Root', 'Hazlewood',
  'Zampa', 'Livingstone', 'Jacks', 'Salt', 'Bairstow', 'Head', 'Stoinis', 'Green', 'Phillips'
];

const COUNTRIES = ['Australia', 'England', 'South Africa', 'West Indies', 'New Zealand', 'Afghanistan', 'Sri Lanka', 'Bangladesh', 'Ireland', 'Netherlands'];

// -------------------------------------------------------------
// Generator Functions
// -------------------------------------------------------------

function getUniqueName(isIndian: boolean, usedNames: Set<string>): string {
  let name = '';
  while (true) {
    if (isIndian) {
      const first = IND_FIRST_NAMES[Math.floor(Math.random() * IND_FIRST_NAMES.length)];
      const last = IND_LAST_NAMES[Math.floor(Math.random() * IND_LAST_NAMES.length)];
      name = `${first} ${last}`;
    } else {
      const first = OS_FIRST_NAMES[Math.floor(Math.random() * OS_FIRST_NAMES.length)];
      const last = OS_LAST_NAMES[Math.floor(Math.random() * OS_LAST_NAMES.length)];
      name = `${first} ${last}`;
    }
    if (!usedNames.has(name)) {
      usedNames.add(name);
      break;
    }
  }
  return name;
}

function generateStats(role: PlayerRole, overall: number): { matches: number; runs: number; wickets: number; strikeRate: number; economy: number } {
  const matches = Math.floor(10 + Math.random() * 150);
  let runs = 0;
  let wickets = 0;
  let strikeRate = 0.0;
  let economy = 0.0;

  if (role === 'BAT') {
    runs = Math.floor(matches * (overall * 0.4 + Math.random() * 10));
    strikeRate = parseFloat((120 + Math.random() * 35 + overall * 0.2).toFixed(1));
  } else if (role === 'BOWL') {
    wickets = Math.floor(matches * (0.8 + Math.random() * 0.7));
    economy = parseFloat((6.8 + Math.random() * 2.5 - overall * 0.02).toFixed(2));
  } else if (role === 'AR') {
    runs = Math.floor(matches * (overall * 0.2 + Math.random() * 8));
    strikeRate = parseFloat((115 + Math.random() * 30 + overall * 0.1).toFixed(1));
    wickets = Math.floor(matches * (0.5 + Math.random() * 0.5));
    economy = parseFloat((7.2 + Math.random() * 2.2 - overall * 0.015).toFixed(2));
  } else if (role === 'WK') {
    runs = Math.floor(matches * (overall * 0.35 + Math.random() * 9));
    strikeRate = parseFloat((118 + Math.random() * 30 + overall * 0.15).toFixed(1));
  }

  return { matches, runs, wickets, strikeRate, economy };
}

function buildPlayer(
  id: number,
  name: string,
  country: string,
  age: number,
  role: PlayerRole,
  subRole: string,
  category: string,
  basePrice: number,
  isCapped: boolean,
  targetOvr?: number
): SeedPlayer {
  // 1. Determine target OVR (T) depending on tier and category
  let T = 72; // default
  if (targetOvr) {
    T = targetOvr;
  } else {
    if (category === 'Marquee Players') {
      T = Math.floor(90 + Math.random() * 9); // 90-98
    } else if (category === 'Emerging Players') {
      T = Math.floor(60 + Math.random() * 10); // 60-69
    } else if (!isCapped) {
      // Uncapped can be Emerging (60-69) or Young Prospects (50-59) or Good Domestic (70-79)
      if (age <= 23) {
        T = Math.random() > 0.5 ? Math.floor(50 + Math.random() * 10) : Math.floor(60 + Math.random() * 10);
      } else {
        T = Math.floor(60 + Math.random() * 16); // 60-75
      }
    } else {
      // Capped
      T = Math.random() > 0.35 ? Math.floor(80 + Math.random() * 10) : Math.floor(70 + Math.random() * 10); // Established or Good Domestic
    }
  }

  // Ensure OVR fits limits
  T = Math.min(99, Math.max(50, T));

  // 2. Generate stats relative to target OVR
  let battingRating = 10;
  let bowlingRating = 10;
  let fieldingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 10) - 5));
  let formRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 12) - 6));

  if (role === 'BAT') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 5) - 2));
    bowlingRating = Math.floor(10 + Math.random() * 20);
  } else if (role === 'BOWL') {
    bowlingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 5) - 2));
    battingRating = Math.floor(10 + Math.random() * 20);
  } else if (role === 'AR') {
    battingRating = Math.min(99, Math.max(40, T - 5 + Math.floor(Math.random() * 6)));
    bowlingRating = Math.min(99, Math.max(40, T - 5 + Math.floor(Math.random() * 6)));
  } else if (role === 'WK') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 6) - 3));
    fieldingRating = Math.min(99, Math.max(40, T + 3 + Math.floor(Math.random() * 6) - 3));
    bowlingRating = Math.floor(5 + Math.random() * 10);
  }

  // 3. Compute overallRating from formula
  const overallRating = Math.round(
    role === 'BAT' ? battingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    role === 'BOWL' ? bowlingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    role === 'AR' ? (battingRating + bowlingRating) * 0.3 + fieldingRating * 0.2 + formRating * 0.2 :
    battingRating * 0.45 + fieldingRating * 0.35 + formRating * 0.2
  );

  // 4. Age Impact on Potential & Experience
  let potentialRating = 70;
  let experienceRating = 30;

  if (age >= 18 && age <= 24) {
    experienceRating = Math.floor(15 + Math.random() * 25);
    // Young prospects under 24 have higher potential (80+)
    potentialRating = Math.floor(80 + Math.random() * 19);
  } else if (age >= 25 && age <= 31) {
    experienceRating = Math.floor(40 + Math.random() * 35);
    potentialRating = Math.min(99, overallRating + Math.floor(Math.random() * 10));
  } else if (age >= 32 && age <= 36) {
    experienceRating = Math.floor(75 + Math.random() * 15);
    potentialRating = Math.max(40, overallRating - Math.floor(Math.random() * 12));
  } else {
    // 37+
    experienceRating = Math.floor(88 + Math.random() * 11);
    potentialRating = Math.floor(40 + Math.random() * 21);
  }

  // 5. Popularity (Hype indicator)
  const popularity = Math.min(99, Math.max(10, Math.floor(overallRating * 0.8 + Math.random() * 15)));

  // 6. Market Value Score (MVS)
  const mvsRaw = (overallRating * 0.45) + (formRating * 0.20) + (popularity * 0.15) + (experienceRating * 0.10) + (potentialRating * 0.10);
  let marketValueScore = Math.round(mvsRaw);
  if (category === 'Marquee Players') {
    marketValueScore += 10;
  }
  marketValueScore = Math.min(99, Math.max(30, marketValueScore));

  const stats = generateStats(role, overallRating);

  return {
    id,
    name,
    country,
    age,
    role,
    subRole,
    category,
    basePrice,
    battingRating,
    bowlingRating,
    fieldingRating,
    potentialRating,
    experienceRating,
    formRating,
    overallRating,
    marketValueScore,
    ...stats,
    popularity,
    auctionStatus: 'AVAILABLE',
    currentTeam: null,
    soldPrice: null,
  };
}

export function generateFullAuctionPool(): SeedPlayer[] {
  const pool: SeedPlayer[] = [];
  const usedNames = new Set<string>();
  let nextId = 1;

  // 1. ADD REAL MARQUEES (16 players)
  REAL_MARQUEES.forEach(m => {
    pool.push(buildPlayer(
      nextId++, m.name, m.country, m.age, m.role as PlayerRole, m.subRole, 'Marquee Players', m.basePrice, true, m.targetOvr
    ));
    usedNames.add(m.name);
  });

  // 2. ADD REAL CAPPED INDIANS (20 players)
  REAL_INDIAN_CAPPED.forEach(m => {
    let cat = 'Indian Capped Batsmen';
    if (m.role === 'BOWL') cat = m.subRole.includes('Spinner') ? 'Indian Spinners' : 'Indian Fast Bowlers';
    else if (m.role === 'AR') cat = 'Indian All Rounders';
    else if (m.role === 'WK') cat = 'Indian Capped Wicket Keepers';

    pool.push(buildPlayer(
      nextId++, m.name, 'India', m.age, m.role as PlayerRole, m.subRole, cat, m.basePrice, true, m.targetOvr
    ));
    usedNames.add(m.name);
  });

  // 3. ADD REAL CAPPED OVERSEAS (20 players)
  REAL_OVERSEAS_CAPPED.forEach(m => {
    let cat = 'Overseas Batsmen';
    if (m.role === 'BOWL') cat = m.subRole.includes('Spinner') ? 'Overseas Spinners' : 'Overseas Fast Bowlers';
    else if (m.role === 'AR') cat = m.subRole.includes('Spin') ? 'Overseas Spin All Rounders' : 'Overseas Pace All Rounders';
    else if (m.role === 'WK') cat = 'Overseas Wicket Keepers';

    pool.push(buildPlayer(
      nextId++, m.name, m.country, m.age, m.role as PlayerRole, m.subRole, cat, m.basePrice, true, m.targetOvr
    ));
    usedNames.add(m.name);
  });

  // 4. GENERATE TO TARGET EXTRAS (Target is exactly 580 players for large catalog seed)
  const categoriesList = [
    { cat: 'Indian Capped Batsmen', isIndian: true, role: 'BAT' as PlayerRole, isCapped: true },
    { cat: 'Indian Uncapped Batsmen', isIndian: true, role: 'BAT' as PlayerRole, isCapped: false },
    { cat: 'Indian Capped Wicket Keepers', isIndian: true, role: 'WK' as PlayerRole, isCapped: true },
    { cat: 'Indian Uncapped Wicket Keepers', isIndian: true, role: 'WK' as PlayerRole, isCapped: false },
    { cat: 'Indian Fast Bowlers', isIndian: true, role: 'BOWL' as PlayerRole, isCapped: true },
    { cat: 'Indian Spinners', isIndian: true, role: 'BOWL' as PlayerRole, isCapped: true },
    { cat: 'Indian All Rounders', isIndian: true, role: 'AR' as PlayerRole, isCapped: true },
    { cat: 'Overseas Batsmen', isIndian: false, role: 'BAT' as PlayerRole, isCapped: true },
    { cat: 'Overseas Wicket Keepers', isIndian: false, role: 'WK' as PlayerRole, isCapped: true },
    { cat: 'Overseas Fast Bowlers', isIndian: false, role: 'BOWL' as PlayerRole, isCapped: true },
    { cat: 'Overseas Spinners', isIndian: false, role: 'BOWL' as PlayerRole, isCapped: true },
    { cat: 'Overseas Pace All Rounders', isIndian: false, role: 'AR' as PlayerRole, isCapped: true },
    { cat: 'Overseas Spin All Rounders', isIndian: false, role: 'AR' as PlayerRole, isCapped: true },
    { cat: 'Emerging Players', isIndian: true, role: 'BAT' as PlayerRole, isCapped: false },
  ];

  const targetTotal = 580;
  
  const uncappedPrices = [0.30, 0.40, 0.50];
  const domesticCappedPrices = [0.75, 1.00, 1.25, 1.50, 2.00];
  const overseasCappedPrices = [1.50, 2.00];

  while (pool.length < targetTotal) {
    const config = categoriesList[Math.floor(Math.random() * categoriesList.length)];
    const country = config.isIndian ? 'India' : COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const age = Math.floor(18 + Math.random() * 20); // 18-37
    
    // Assign base price based on rules
    let basePrice = 0.50;
    if (!config.isCapped || config.cat === 'Emerging Players') {
      basePrice = uncappedPrices[Math.floor(Math.random() * uncappedPrices.length)];
    } else {
      if (config.isIndian) {
        basePrice = domesticCappedPrices[Math.floor(Math.random() * domesticCappedPrices.length)];
      } else {
        basePrice = overseasCappedPrices[Math.floor(Math.random() * overseasCappedPrices.length)];
      }
    }
    
    let subRole = 'Batsman';
    if (config.role === 'BOWL') {
      subRole = Math.random() > 0.4 ? 'Fast Bowler' : 'Spin Bowler';
    } else if (config.role === 'AR') {
      subRole = Math.random() > 0.5 ? 'Pace All-Rounder' : 'Spin All-Rounder';
    } else if (config.role === 'WK') {
      subRole = 'WK-Batsman';
    }

    const name = getUniqueName(config.isIndian, usedNames);
    pool.push(buildPlayer(
      nextId++, name, country, age, config.role, subRole, config.cat, basePrice, config.isCapped
    ));
  }

  return pool;
}

// Execute and save to JSON
const pool = generateFullAuctionPool();
const targetPath = path.join(process.cwd(), './src/lib/players-data.json');

fs.writeFileSync(targetPath, JSON.stringify(pool, null, 2), 'utf-8');
console.log(`Successfully generated and seeded ${pool.length} players to: ${targetPath}`);
