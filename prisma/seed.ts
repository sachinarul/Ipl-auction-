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

const REAL_MARQUEES = [
  { name: 'Virat Kohli', country: 'India', age: 36, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 97 },
  { name: 'Rohit Sharma', country: 'India', age: 37, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 93 },
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
  { name: 'Abhishek Sharma', age: 24, role: 'BAT', subRole: 'Opening Batsman', basePrice: 1.5, targetOvr: 82 },
  { name: 'Rajat Patidar', age: 31, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 1.5, targetOvr: 81 },
  { name: 'Bhuvneshwar Kumar', age: 35, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 82 },
  { name: 'Deepak Chahar', age: 32, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 81 },
  { name: 'Harshal Patel', age: 34, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 81 },
  { name: 'Prasidh Krishna', age: 29, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 79 },
  { name: 'Avesh Khan', age: 27, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'T Natarajan', age: 33, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 81 },
  { name: 'Sandeep Sharma', age: 33, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 81 },
  { name: 'Umesh Yadav', age: 37, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 78 },
  { name: 'Shardul Thakur', age: 33, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 80 },
  { name: 'Krunal Pandya', age: 34, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.5, targetOvr: 81 },
  { name: 'Venkatesh Iyer', age: 29, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 81 },
  { name: 'Jitesh Sharma', age: 30, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.0, targetOvr: 79 },
  { name: 'Devdutt Padikkal', age: 24, role: 'BAT', subRole: 'Opening Batsman', basePrice: 1.0, targetOvr: 78 },
  { name: 'Sai Sudharsan', age: 23, role: 'BAT', subRole: 'Opening Batsman', basePrice: 1.0, targetOvr: 81 },
  { name: 'Riyan Parag', age: 22, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 1.0, targetOvr: 81 },
  { name: 'Varun Chakravarthy', age: 33, role: 'BOWL', subRole: 'Wrist Spinner', basePrice: 1.5, targetOvr: 84 },
  { name: 'Mayank Yadav', age: 22, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 80 },
  { name: 'Ishant Sharma', age: 37, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 0.75, targetOvr: 78 },
  { name: 'Khaleel Ahmed', age: 28, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'Mukesh Kumar', age: 30, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'Rahul Chahar', age: 25, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 1.0, targetOvr: 78 },
  { name: 'Vijay Shankar', age: 35, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 0.75, targetOvr: 77 },
  { name: 'Manish Pandey', age: 36, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 0.75, targetOvr: 78 },
  { name: 'Mayank Agarwal', age: 35, role: 'BAT', subRole: 'Opening Batsman', basePrice: 1.0, targetOvr: 78 },
  { name: 'Ajinkya Rahane', age: 37, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 1.0, targetOvr: 79 },
  { name: 'Prithvi Shaw', age: 25, role: 'BAT', subRole: 'Opening Batsman', basePrice: 1.0, targetOvr: 79 },
  { name: 'Sarfaraz Khan', age: 27, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 1.0, targetOvr: 78 },
  { name: 'Ramandeep Singh', age: 29, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 0.75, targetOvr: 78 },
  { name: 'Piyush Chawla', age: 37, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 1.0, targetOvr: 80 },
  { name: 'Amit Mishra', age: 43, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 0.75, targetOvr: 77 },
  { name: 'Mohit Sharma', age: 37, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 80 },
  { name: 'Jaydev Unadkat', age: 34, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 78 }
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
  { name: 'Jonny Bairstow', country: 'England', age: 35, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.5, targetOvr: 82 },
  { name: 'Moeen Ali', country: 'England', age: 37, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.5, targetOvr: 81 },
  { name: 'Chris Woakes', country: 'England', age: 37, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 80 },
  { name: 'Will Jacks', country: 'England', age: 26, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 1.5, targetOvr: 81 },
  { name: 'Reece Topley', country: 'England', age: 32, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.25, targetOvr: 80 },
  { name: 'Mark Wood', country: 'England', age: 36, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 83 },
  { name: 'Jofra Archer', country: 'England', age: 31, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 82 },
  { name: 'Steve Smith', country: 'Australia', age: 36, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 2.0, targetOvr: 84 },
  { name: 'Tim David', country: 'Australia', age: 30, role: 'BAT', subRole: 'Finisher', basePrice: 1.5, targetOvr: 80 },
  { name: 'Jake Fraser-McGurk', country: 'Australia', age: 24, role: 'BAT', subRole: 'Opening Batsman', basePrice: 2.0, targetOvr: 81 },
  { name: 'Matthew Wade', country: 'Australia', age: 38, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.0, targetOvr: 78 },
  { name: 'Adam Zampa', country: 'Australia', age: 34, role: 'BOWL', subRole: 'Leg Spinner', basePrice: 2.0, targetOvr: 83 },
  { name: 'Nathan Ellis', country: 'Australia', age: 31, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.25, targetOvr: 79 },
  { name: 'Spencer Johnson', country: 'Australia', age: 30, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 80 },
  { name: 'Kane Williamson', country: 'New Zealand', age: 35, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 2.0, targetOvr: 83 },
  { name: 'Daryl Mitchell', country: 'New Zealand', age: 35, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 2.0, targetOvr: 82 },
  { name: 'Mitchell Santner', country: 'New Zealand', age: 34, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.5, targetOvr: 81 },
  { name: 'Glenn Phillips', country: 'New Zealand', age: 29, role: 'BAT', subRole: 'Finisher', basePrice: 1.5, targetOvr: 81 },
  { name: 'Rachin Ravindra', country: 'New Zealand', age: 26, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.5, targetOvr: 82 },
  { name: 'Lockie Ferguson', country: 'New Zealand', age: 34, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 81 },
  { name: 'Matt Henry', country: 'New Zealand', age: 34, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'Tim Southee', country: 'New Zealand', age: 37, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'Gerald Coetzee', country: 'South Africa', age: 25, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.25, targetOvr: 80 },
  { name: 'David Miller', country: 'South Africa', age: 36, role: 'BAT', subRole: 'Finisher', basePrice: 2.0, targetOvr: 83 },
  { name: 'Aiden Markram', country: 'South Africa', age: 29, role: 'BAT', subRole: 'Middle Order Batsman', basePrice: 2.0, targetOvr: 81 },
  { name: 'Tristan Stubbs', country: 'South Africa', age: 25, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.5, targetOvr: 82 },
  { name: 'Lungi Ngidi', country: 'South Africa', age: 30, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.25, targetOvr: 79 },
  { name: 'Anrich Nortje', country: 'South Africa', age: 32, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 82 },
  { name: 'Keshav Maharaj', country: 'South Africa', age: 36, role: 'BOWL', subRole: 'Slow Left-Arm Orthodox', basePrice: 1.0, targetOvr: 80 },
  { name: 'Rovman Powell', country: 'West Indies', age: 32, role: 'BAT', subRole: 'Finisher', basePrice: 1.5, targetOvr: 80 },
  { name: 'Shimron Hetmyer', country: 'West Indies', age: 29, role: 'BAT', subRole: 'Finisher', basePrice: 1.5, targetOvr: 80 },
  { name: 'Sherfane Rutherford', country: 'West Indies', age: 27, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.0, targetOvr: 78 },
  { name: 'Romario Shepherd', country: 'West Indies', age: 31, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.0, targetOvr: 79 },
  { name: 'Jason Holder', country: 'West Indies', age: 34, role: 'AR', subRole: 'Pace All-Rounder', basePrice: 1.5, targetOvr: 80 },
  { name: 'Alzarri Joseph', country: 'West Indies', age: 29, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'Shai Hope', country: 'West Indies', age: 32, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.25, targetOvr: 79 },
  { name: 'Rahmanullah Gurbaz', country: 'Afghanistan', age: 24, role: 'WK', subRole: 'WK-Batsman', basePrice: 1.5, targetOvr: 81 },
  { name: 'Fazalhaq Farooqi', country: 'Afghanistan', age: 25, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 80 },
  { name: 'Matheesha Pathirana', country: 'Sri Lanka', age: 23, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 2.0, targetOvr: 83 },
  { name: 'Maheesh Theekshana', country: 'Sri Lanka', age: 25, role: 'BOWL', subRole: 'Off Spinner', basePrice: 1.5, targetOvr: 81 },
  { name: 'Mustafizur Rahman', country: 'Bangladesh', age: 30, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.5, targetOvr: 81 },
  { name: 'Shakib Al Hasan', country: 'Bangladesh', age: 39, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.5, targetOvr: 82 },
  { name: 'Sikandar Raza', country: 'Zimbabwe', age: 40, role: 'AR', subRole: 'Spin All-Rounder', basePrice: 1.0, targetOvr: 79 },
  { name: 'Josh Little', country: 'Ireland', age: 26, role: 'BOWL', subRole: 'Fast Bowler', basePrice: 1.0, targetOvr: 78 }
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
  let T = targetOvr || 80;
  T = Math.min(99, Math.max(50, T));

  let battingRating = 10;
  let bowlingRating = 10;
  let fieldingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 8) - 4));
  let formRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 10) - 5));

  if (role === 'BAT') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 1));
    bowlingRating = Math.floor(10 + Math.random() * 15);
  } else if (role === 'BOWL') {
    bowlingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 1));
    battingRating = Math.floor(10 + Math.random() * 15);
  } else if (role === 'AR') {
    battingRating = Math.min(99, Math.max(40, T - 4 + Math.floor(Math.random() * 5)));
    bowlingRating = Math.min(99, Math.max(40, T - 4 + Math.floor(Math.random() * 5)));
  } else if (role === 'WK') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 2));
    fieldingRating = Math.min(99, Math.max(40, T + 4 + Math.floor(Math.random() * 4) - 2));
    bowlingRating = Math.floor(5 + Math.random() * 5);
  }

  const overallRating = Math.round(
    role === 'BAT' ? battingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    role === 'BOWL' ? bowlingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    role === 'AR' ? (battingRating + bowlingRating) * 0.3 + fieldingRating * 0.2 + formRating * 0.2 :
    battingRating * 0.45 + fieldingRating * 0.35 + formRating * 0.2
  );

  let potentialRating = 75;
  let experienceRating = 40;

  if (age >= 18 && age <= 24) {
    experienceRating = Math.floor(20 + Math.random() * 20);
    potentialRating = Math.floor(82 + Math.random() * 15);
  } else if (age >= 25 && age <= 31) {
    experienceRating = Math.floor(45 + Math.random() * 30);
    potentialRating = Math.min(99, overallRating + Math.floor(Math.random() * 8));
  } else if (age >= 32 && age <= 36) {
    experienceRating = Math.floor(78 + Math.random() * 12);
    potentialRating = Math.max(40, overallRating - Math.floor(Math.random() * 10));
  } else {
    experienceRating = Math.floor(88 + Math.random() * 10);
    potentialRating = Math.floor(40 + Math.random() * 15);
  }

  const popularity = Math.min(99, Math.max(20, Math.floor(overallRating * 0.85 + Math.random() * 12)));
  const mvsRaw = (overallRating * 0.45) + (formRating * 0.20) + (popularity * 0.15) + (experienceRating * 0.10) + (potentialRating * 0.10);
  let marketValueScore = Math.round(mvsRaw);
  if (category === 'Marquee Players') {
    marketValueScore = Math.min(99, marketValueScore + 8);
  }
  marketValueScore = Math.min(99, Math.max(40, marketValueScore));

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

  // 2. ADD REAL CAPPED INDIANS
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

  // 3. ADD REAL OVERSEAS CAPPED
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

  return pool;
}

// Execute and save to JSON
const pool = generateFullAuctionPool();
const targetPath = path.join(process.cwd(), './src/lib/players-data.json');

fs.writeFileSync(targetPath, JSON.stringify(pool, null, 2), 'utf-8');
console.log(`Successfully generated and seeded ${pool.length} players to: ${targetPath}`);
