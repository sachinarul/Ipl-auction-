import * as fs from 'fs';
import * as path from 'path';

// Core Types matching types/index.ts
type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';

interface SeedPlayer {
  id: number;
  name: string;
  set: string;
  category: string;
  role: string;          // "Batsman" | "WK" | "AR" | "Bowler"
  overseas: boolean;
  basePrice: number;     // in Cr
  country: string;
  age: number;
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
  subRole: string;
}

interface PlayerDef {
  name: string;
  set: string;
  category: string;
  role: string;
  overseas: boolean;
  basePrice: number;
  country: string;
  age: number;
  targetOvr: number;
}

const PLAYERS_TO_SEED: PlayerDef[] = [];

function generateStats(role: PlayerRole, overall: number): { matches: number; runs: number; wickets: number; strikeRate: number; economy: number } {
  const matches = Math.floor(25 + Math.random() * 120);
  let runs = 0;
  let wickets = 0;
  let strikeRate = 0.0;
  let economy = 0.0;

  if (role === 'BAT') {
    runs = Math.floor(matches * (overall * 0.35 + Math.random() * 8));
    strikeRate = parseFloat((122 + Math.random() * 25 + overall * 0.15).toFixed(1));
  } else if (role === 'BOWL') {
    wickets = Math.floor(matches * (0.9 + Math.random() * 0.5));
    economy = parseFloat((6.9 + Math.random() * 1.8 - overall * 0.015).toFixed(2));
  } else if (role === 'AR') {
    runs = Math.floor(matches * (overall * 0.18 + Math.random() * 6));
    strikeRate = parseFloat((118 + Math.random() * 22 + overall * 0.1).toFixed(1));
    wickets = Math.floor(matches * (0.6 + Math.random() * 0.4));
    economy = parseFloat((7.3 + Math.random() * 1.6 - overall * 0.01).toFixed(2));
  } else if (role === 'WK') {
    runs = Math.floor(matches * (overall * 0.32 + Math.random() * 7));
    strikeRate = parseFloat((120 + Math.random() * 22 + overall * 0.12).toFixed(1));
  }

  return { matches, runs, wickets, strikeRate, economy };
}

function buildPlayer(
  id: number,
  def: PlayerDef
): SeedPlayer {
  let T = def.targetOvr || 80;
  T = Math.min(99, Math.max(50, T));

  const roleCode: PlayerRole = def.role === 'Batsman' ? 'BAT' :
                           def.role === 'Bowler' ? 'BOWL' :
                           def.role === 'WK' ? 'WK' : 'AR';

  let battingRating = 10;
  let bowlingRating = 10;
  let fieldingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 8) - 4));
  let formRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 10) - 5));

  if (roleCode === 'BAT') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 1));
    bowlingRating = Math.floor(10 + Math.random() * 15);
  } else if (roleCode === 'BOWL') {
    bowlingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 1));
    battingRating = Math.floor(10 + Math.random() * 15);
  } else if (roleCode === 'AR') {
    battingRating = Math.min(99, Math.max(40, T - 4 + Math.floor(Math.random() * 5)));
    bowlingRating = Math.min(99, Math.max(40, T - 4 + Math.floor(Math.random() * 5)));
  } else if (roleCode === 'WK') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 2));
    fieldingRating = Math.min(99, Math.max(40, T + 4 + Math.floor(Math.random() * 4) - 2));
    bowlingRating = Math.floor(5 + Math.random() * 5);
  }

  const overallRating = Math.round(
    roleCode === 'BAT' ? battingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    roleCode === 'BOWL' ? bowlingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    roleCode === 'AR' ? (battingRating + bowlingRating) * 0.3 + fieldingRating * 0.2 + formRating * 0.2 :
    battingRating * 0.45 + fieldingRating * 0.35 + formRating * 0.2
  );

  let potentialRating = 75;
  let experienceRating = 40;

  if (def.age >= 18 && def.age <= 24) {
    experienceRating = Math.floor(20 + Math.random() * 20);
    potentialRating = Math.floor(82 + Math.random() * 15);
  } else if (def.age >= 25 && def.age <= 31) {
    experienceRating = Math.floor(45 + Math.random() * 30);
    potentialRating = Math.min(99, overallRating + Math.floor(Math.random() * 8));
  } else if (def.age >= 32 && def.age <= 36) {
    experienceRating = Math.floor(78 + Math.random() * 12);
    potentialRating = Math.max(40, overallRating - Math.floor(Math.random() * 10));
  } else {
    experienceRating = Math.floor(88 + Math.random() * 10);
    potentialRating = Math.floor(40 + Math.random() * 15);
  }

  const popularity = Math.min(99, Math.max(20, Math.floor(overallRating * 0.85 + Math.random() * 12)));
  const mvsRaw = (overallRating * 0.45) + (formRating * 0.20) + (popularity * 0.15) + (experienceRating * 0.10) + (potentialRating * 0.10);
  let marketValueScore = Math.round(mvsRaw);
  if (def.set === 'MARQUEE') {
    marketValueScore = Math.min(99, marketValueScore + 8);
  }
  marketValueScore = Math.min(99, Math.max(40, marketValueScore));

  const stats = generateStats(roleCode, overallRating);

  return {
    id,
    name: def.name,
    set: def.set,
    category: def.category,
    role: def.role,
    overseas: def.overseas,
    basePrice: def.basePrice,
    country: def.country,
    age: def.age,
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
    subRole: roleCode === 'BAT' ? 'Batsman' :
             roleCode === 'BOWL' ? (def.category === 'SPINNER' ? 'Spin Bowler' : 'Fast Bowler') :
             roleCode === 'AR' ? 'All-Rounder' : 'WK-Batsman'
  };
}

export function generateFullAuctionPool(): SeedPlayer[] {
  const pool: SeedPlayer[] = [];
  let nextId = 1;

  PLAYERS_TO_SEED.forEach(def => {
    pool.push(buildPlayer(nextId++, def));
  });

  return pool;
}

// Execute and save to JSON
const pool = generateFullAuctionPool();
const targetPath = path.join(process.cwd(), './src/lib/players-data.json');

fs.writeFileSync(targetPath, JSON.stringify(pool, null, 2), 'utf-8');
console.log(`Successfully generated and seeded ${pool.length} players to: ${targetPath}`);
