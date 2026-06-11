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

const PLAYERS_TO_SEED: PlayerDef[] = [
  // ==================================================
  // SET: MARQUEE (47 Players, Base: 2.00 Cr)
  // ==================================================
  // CATEGORY: BATSMAN
  { name: 'Aiden Markram', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 2.0, country: 'South Africa', age: 30, targetOvr: 82 },
  { name: 'Rinku Singh', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 27, targetOvr: 84 },
  { name: 'Rohit Sharma', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 37, targetOvr: 92 },
  { name: 'Ruturaj Gaikwad', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 28, targetOvr: 87 },
  { name: 'Shimron Hetmyer', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 2.0, country: 'West Indies', age: 28, targetOvr: 80 },
  { name: 'Shreyas Iyer', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 30, targetOvr: 89 },
  { name: 'Shubman Gill', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 25, targetOvr: 88 },
  { name: 'Suryakumar Yadav', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 34, targetOvr: 93 },
  { name: 'Tim David', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 2.0, country: 'Australia', age: 28, targetOvr: 84 },
  { name: 'Travis Head', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 2.0, country: 'Australia', age: 31, targetOvr: 91 },
  { name: 'Virat Kohli', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 36, targetOvr: 97 },
  { name: 'Yashasvi Jaiswal', set: 'MARQUEE', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 2.0, country: 'India', age: 23, targetOvr: 87 },

  // CATEGORY: WICKET_KEEPER
  { name: 'Heinrich Klaasen', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 2.0, country: 'South Africa', age: 33, targetOvr: 90 },
  { name: 'Jos Buttler', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 2.0, country: 'England', age: 34, targetOvr: 92 },
  { name: 'KL Rahul', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 2.0, country: 'India', age: 32, targetOvr: 90 },
  { name: 'MS Dhoni', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 2.0, country: 'India', age: 44, targetOvr: 82 },
  { name: 'Nicholas Pooran', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 2.0, country: 'West Indies', age: 29, targetOvr: 86 },
  { name: 'Phil Salt', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 2.0, country: 'England', age: 28, targetOvr: 84 },
  { name: 'Rishabh Pant', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 2.0, country: 'India', age: 27, targetOvr: 94 },
  { name: 'Sanju Samson', set: 'MARQUEE', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 2.0, country: 'India', age: 30, targetOvr: 87 },

  // CATEGORY: ALL_ROUNDER
  { name: 'Axar Patel', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 2.0, country: 'India', age: 31, targetOvr: 78 },
  { name: 'Hardik Pandya', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 2.0, country: 'India', age: 31, targetOvr: 86 },
  { name: 'Marco Jansen', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 2.0, country: 'South Africa', age: 24, targetOvr: 76 },
  { name: 'Marcus Stoinis', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 2.0, country: 'Australia', age: 35, targetOvr: 81 },
  { name: 'Mitchell Marsh', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 2.0, country: 'Australia', age: 33, targetOvr: 83 },
  { name: 'Ravindra Jadeja', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 2.0, country: 'India', age: 36, targetOvr: 85 },
  { name: 'Sam Curran', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 2.0, country: 'England', age: 26, targetOvr: 78 },
  { name: 'Shivam Dube', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 2.0, country: 'India', age: 31, targetOvr: 80 },
  { name: 'Sunil Narine', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 2.0, country: 'West Indies', age: 36, targetOvr: 84 },
  { name: 'Will Jacks', set: 'MARQUEE', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 2.0, country: 'England', age: 26, targetOvr: 82 },

  // CATEGORY: FAST_BOWLER
  { name: 'Arshdeep Singh', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 26, targetOvr: 84 },
  { name: 'Bhuvneshwar Kumar', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 35, targetOvr: 80 },
  { name: 'Jasprit Bumrah', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 31, targetOvr: 98 },
  { name: 'Jofra Archer', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'England', age: 31, targetOvr: 80 },
  { name: 'Josh Hazlewood', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'Australia', age: 34, targetOvr: 92 },
  { name: 'Kagiso Rabada', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'South Africa', age: 29, targetOvr: 93 },
  { name: 'Lockie Ferguson', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'New Zealand', age: 33, targetOvr: 80 },
  { name: 'Mitchell Starc', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'Australia', age: 35, targetOvr: 90 },
  { name: 'Mohammad Shami', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 34, targetOvr: 91 },
  { name: 'Mohammad Siraj', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 30, targetOvr: 87 },
  { name: 'Pat Cummins', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'Australia', age: 31, targetOvr: 94 },
  { name: 'Trent Boult', set: 'MARQUEE', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'New Zealand', age: 35, targetOvr: 90 },

  // CATEGORY: SPINNER
  { name: 'Kuldeep Yadav', set: 'MARQUEE', category: 'SPINNER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 30, targetOvr: 86 },
  { name: 'Noor Ahmad', set: 'MARQUEE', category: 'SPINNER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'Afghanistan', age: 19, targetOvr: 80 },
  { name: 'Rashid Khan', set: 'MARQUEE', category: 'SPINNER', role: 'Bowler', overseas: true, basePrice: 2.0, country: 'Afghanistan', age: 26, targetOvr: 96 },
  { name: 'Varun Chakravarthy', set: 'MARQUEE', category: 'SPINNER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 33, targetOvr: 88 },
  { name: 'Yuzvendra Chahal', set: 'MARQUEE', category: 'SPINNER', role: 'Bowler', overseas: false, basePrice: 2.0, country: 'India', age: 34, targetOvr: 88 },

  // ==================================================
  // SET 1 (23 Players, Base: 1.00 Cr)
  // ==================================================
  // CATEGORY: ALL_ROUNDER
  { name: 'Abhishek Sharma', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 1.0, country: 'India', age: 24, targetOvr: 83 },
  { name: 'Azmatullah Omarzai', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 1.0, country: 'Afghanistan', age: 23, targetOvr: 80 },
  { name: 'Krunal Pandya', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 1.0, country: 'India', age: 34, targetOvr: 80 },
  { name: 'Mitchell Santner', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 1.0, country: 'New Zealand', age: 33, targetOvr: 81 },
  { name: 'Riyan Parag', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 1.0, country: 'India', age: 22, targetOvr: 81 },
  { name: 'Romario Shepherd', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 1.0, country: 'West Indies', age: 30, targetOvr: 79 },
  { name: 'Shardul Thakur', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 1.0, country: 'India', age: 33, targetOvr: 80 },
  { name: 'Washington Sundar', set: 'SET 1', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 1.0, country: 'India', age: 25, targetOvr: 81 },

  // CATEGORY: BATSMAN
  { name: 'Glenn Phillips', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 1.0, country: 'New Zealand', age: 29, targetOvr: 81 },
  { name: 'Rajat Patidar', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 1.0, country: 'India', age: 31, targetOvr: 81 },
  { name: 'Rovman Powell', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 1.0, country: 'West Indies', age: 32, targetOvr: 80 },
  { name: 'Sai Sudharsan', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 1.0, country: 'India', age: 23, targetOvr: 81 },
  { name: 'Sherfane Rutherford', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 1.0, country: 'West Indies', age: 27, targetOvr: 78 },
  { name: 'Tilak Varma', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 1.0, country: 'India', age: 22, targetOvr: 83 },
  { name: 'Tristan Stubbs', set: 'SET 1', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 1.0, country: 'South Africa', age: 25, targetOvr: 82 },

  // CATEGORY: WICKET_KEEPER
  { name: 'Dhruv Jurel', set: 'SET 1', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 1.0, country: 'India', age: 23, targetOvr: 80 },

  // CATEGORY: FAST_BOWLER
  { name: 'Avesh Khan', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 27, targetOvr: 80 },
  { name: 'Deepak Chahar', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 32, targetOvr: 81 },
  { name: 'Harshal Patel', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 34, targetOvr: 81 },
  { name: 'Khaleel Ahmed', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 28, targetOvr: 80 },
  { name: 'Mayank Yadav', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 22, targetOvr: 80 },
  { name: 'Prasidh Krishna', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 29, targetOvr: 79 },
  { name: 'T Natarajan', set: 'SET 1', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 1.0, country: 'India', age: 33, targetOvr: 81 },

  // ==================================================
  // SET 2 (19 Players, Base: 75 Lakh = 0.75 Cr)
  // ==================================================
  // CATEGORY: BATSMAN
  { name: 'Shaik Rasheed', set: 'SET 2', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.75, country: 'India', age: 22, targetOvr: 74 },
  { name: 'Yash Dubey', set: 'SET 2', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.75, country: 'India', age: 25, targetOvr: 72 },
  { name: 'Nehal Wadhera', set: 'SET 2', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.75, country: 'India', age: 25, targetOvr: 72 },
  { name: 'Towhid Hridoy', set: 'SET 2', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 0.75, country: 'Bangladesh', age: 24, targetOvr: 72 },
  { name: 'Abhinav Manohar', set: 'SET 2', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.75, country: 'India', age: 27, targetOvr: 72 },

  // CATEGORY: ALL_ROUNDER
  { name: 'Piyush Chawla', set: 'SET 2', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 0.75, country: 'India', age: 37, targetOvr: 80 },
  { name: 'Jayant Yadav', set: 'SET 2', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 0.75, country: 'India', age: 35, targetOvr: 74 },
  { name: 'Sean Williams', set: 'SET 2', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 0.75, country: 'Zimbabwe', age: 36, targetOvr: 68 },
  { name: 'Bas de Leede', set: 'SET 2', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 0.75, country: 'Netherlands', age: 24, targetOvr: 68 },

  // CATEGORY: WICKET_KEEPER
  { name: 'Ryan Rickelton', set: 'SET 2', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 0.75, country: 'South Africa', age: 26, targetOvr: 74 },
  { name: 'Jordan Cox', set: 'SET 2', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 0.75, country: 'England', age: 24, targetOvr: 68 },
  { name: 'Lorcan Tucker', set: 'SET 2', category: 'WICKET_KEEPER', role: 'WK', overseas: true, basePrice: 0.75, country: 'Ireland', age: 28, targetOvr: 66 },

  // CATEGORY: FAST_BOWLER
  { name: 'Mohit Sharma', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.75, country: 'India', age: 37, targetOvr: 80 },
  { name: 'Sandeep Sharma', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.75, country: 'India', age: 32, targetOvr: 81 },
  { name: 'Chetan Sakariya', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.75, country: 'India', age: 25, targetOvr: 74 },
  { name: 'Yash Thakur', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.75, country: 'India', age: 27, targetOvr: 74 },
  { name: 'Akash Madhwal', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.75, country: 'India', age: 30, targetOvr: 74 },
  { name: 'Luke Wood', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 0.75, country: 'England', age: 28, targetOvr: 74 },
  { name: 'Matthew Forde', set: 'SET 2', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 0.75, country: 'West Indies', age: 24, targetOvr: 72 },

  // ==================================================
  // SET 3 (16 Players, Base: 50 Lakh = 0.50 Cr)
  // ==================================================
  // CATEGORY: BATSMAN
  { name: 'Ambati Rayudu', set: 'SET 3', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.50, country: 'India', age: 39, targetOvr: 79 },
  { name: 'Anmolpreet Singh', set: 'SET 3', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.50, country: 'India', age: 26, targetOvr: 72 },
  { name: 'Yash Dhull', set: 'SET 3', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.50, country: 'India', age: 23, targetOvr: 72 },
  { name: 'Chris Gayle', set: 'SET 3', category: 'BATSMAN', role: 'Batsman', overseas: true, basePrice: 0.50, country: 'West Indies', age: 45, targetOvr: 80 },
  { name: 'Samarth Vyas', set: 'SET 3', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.50, country: 'India', age: 25, targetOvr: 66 },
  { name: 'Arpit Vasavada', set: 'SET 3', category: 'BATSMAN', role: 'Batsman', overseas: false, basePrice: 0.50, country: 'India', age: 31, targetOvr: 70 },

  // CATEGORY: ALL_ROUNDER
  { name: 'Jacques Kallis', set: 'SET 3', category: 'ALL_ROUNDER', role: 'AR', overseas: true, basePrice: 0.50, country: 'South Africa', age: 49, targetOvr: 82 },
  { name: 'Abhinav Sadarangani', set: 'SET 3', category: 'ALL_ROUNDER', role: 'AR', overseas: false, basePrice: 0.50, country: 'India', age: 27, targetOvr: 66 },

  // CATEGORY: WICKET_KEEPER
  { name: 'Wriddhiman Saha', set: 'SET 3', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 0.50, country: 'India', age: 40, targetOvr: 70 },
  { name: 'B R Sharath', set: 'SET 3', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 0.50, country: 'India', age: 28, targetOvr: 68 },
  { name: 'Upendra Yadav', set: 'SET 3', category: 'WICKET_KEEPER', role: 'WK', overseas: false, basePrice: 0.50, country: 'India', age: 22, targetOvr: 62 },

  // CATEGORY: FAST_BOWLER
  { name: 'Mayank Markande', set: 'SET 3', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.50, country: 'India', age: 28, targetOvr: 72 },
  { name: 'Karn Sharma', set: 'SET 3', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.50, country: 'India', age: 36, targetOvr: 72 },
  { name: 'Akash Singh', set: 'SET 3', category: 'FAST_BOWLER', role: 'Bowler', overseas: false, basePrice: 0.50, country: 'India', age: 22, targetOvr: 70 },
  { name: 'Mitch McClenaghan', set: 'SET 3', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 0.50, country: 'New Zealand', age: 38, targetOvr: 72 },
  { name: 'Brett Lee', set: 'SET 3', category: 'FAST_BOWLER', role: 'Bowler', overseas: true, basePrice: 0.50, country: 'Australia', age: 49, targetOvr: 84 },
];

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
