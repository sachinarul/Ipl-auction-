import * as fs from 'fs';
import * as path from 'path';

type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';

interface SeedPlayer {
  id: number; name: string; set: string; category: string; role: string;
  overseas: boolean; basePrice: number; country: string; age: number;
  battingRating: number; bowlingRating: number; fieldingRating: number;
  potentialRating: number; experienceRating: number; formRating: number;
  overallRating: number; marketValueScore: number;
  matches: number; runs: number; wickets: number; strikeRate: number; economy: number;
  popularity: number; auctionStatus: string; currentTeam: string | null;
  soldPrice: number | null; subRole: string;
}
interface PlayerDef {
  name: string; set: string; category: string; role: string;
  overseas: boolean; basePrice: number; country: string; age: number;
}

// Country aliases
const IND='India',AUS='Australia',ENG='England',SA='South Africa',WI='West Indies',
      NZ='New Zealand',AFG='Afghanistan',SL='Sri Lanka',BAN='Bangladesh',
      PAK='Pakistan',NAM='Namibia',SIN='Singapore',IRE='Ireland';

const PLAYERS_TO_SEED: PlayerDef[] = [
  // ── MARQUEE SET 1 — 47 players ─────────────────────────────────────────────
  {name:"Aiden Markram",       set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:SA, age:30},
  {name:"Arshdeep Singh",      set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:26},
  {name:"Axar Patel",          set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:2.00,country:IND,age:31},
  {name:"Bhuvneshwar Kumar",   set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:35},
  {name:"Hardik Pandya",       set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:2.00,country:IND,age:31},
  {name:"Heinrich Klaasen",    set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:SA, age:33},
  {name:"Jasprit Bumrah",      set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:31},
  {name:"Jofra Archer",        set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:ENG,age:29},
  {name:"Jos Buttler",         set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:ENG,age:34},
  {name:"Josh Hazlewood",      set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:AUS,age:34},
  {name:"Kagiso Rabada",       set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:SA, age:30},
  {name:"KL Rahul",            set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:2.00,country:IND,age:32},
  {name:"Kuldeep Yadav",       set:"MARQUEE",category:"SPINNER",       role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:30},
  {name:"Lockie Ferguson",     set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:33},
  {name:"Marco Jansen",        set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:SA, age:24},
  {name:"Marcus Stoinis",      set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:AUS,age:35},
  {name:"Mitchell Marsh",      set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:AUS,age:33},
  {name:"Mitchell Starc",      set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:AUS,age:35},
  {name:"Mohammad Shami",      set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:34},
  {name:"Mohammad Siraj",      set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:31},
  {name:"MS Dhoni",            set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:2.00,country:IND,age:43},
  {name:"Nicholas Pooran",     set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:WI, age:29},
  {name:"Noor Ahmad",          set:"MARQUEE",category:"SPINNER",       role:"Bowler", overseas:true, basePrice:2.00,country:AFG,age:21},
  {name:"Pat Cummins",         set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:AUS,age:31},
  {name:"Phil Salt",           set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:ENG,age:28},
  {name:"Rashid Khan",         set:"MARQUEE",category:"SPINNER",       role:"Bowler", overseas:true, basePrice:2.00,country:AFG,age:26},
  {name:"Ravindra Jadeja",     set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:2.00,country:IND,age:36},
  {name:"Rinku Singh",         set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:27},
  {name:"Rishabh Pant",        set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:2.00,country:IND,age:27},
  {name:"Rohit Sharma",        set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:37},
  {name:"Ruturaj Gaikwad",     set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:28},
  {name:"Sam Curran",          set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:26},
  {name:"Sanju Samson",        set:"MARQUEE",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:2.00,country:IND,age:30},
  {name:"Shimron Hetmyer",     set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:WI, age:28},
  {name:"Shivam Dube",         set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:2.00,country:IND,age:31},
  {name:"Shreyas Iyer",        set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:30},
  {name:"Shubman Gill",        set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:25},
  {name:"Sunil Narine",        set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:WI, age:36},
  {name:"Suryakumar Yadav",    set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:34},
  {name:"Tim David",           set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:SIN,age:28},
  {name:"Travis Head",         set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:AUS,age:31},
  {name:"Trent Boult",         set:"MARQUEE",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:35},
  {name:"Varun Chakravarthy",  set:"MARQUEE",category:"SPINNER",       role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:33},
  {name:"Virat Kohli",         set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:36},
  {name:"Will Jacks",          set:"MARQUEE",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:26},
  {name:"Yashasvi Jaiswal",    set:"MARQUEE",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:2.00,country:IND,age:23},
  {name:"Yuzvendra Chahal",    set:"MARQUEE",category:"SPINNER",       role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:34},

  // ── SET 1 — 23 players ─────────────────────────────────────────────────────
  {name:"Abhishek Sharma",     set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:1.00,country:IND,age:24},
  {name:"Avesh Khan",          set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:27},
  {name:"Azmatullah Omarzai",  set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:AFG,age:23},
  {name:"Deepak Chahar",       set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:32},
  {name:"Dhruv Jurel",         set:"SET 1",  category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:1.00,country:IND,age:23},
  {name:"Ishan Kishan",        set:"SET 1",  category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:2.00,country:IND,age:27},
  {name:"Glenn Phillips",      set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:1.00,country:NZ, age:27},
  {name:"Harshal Patel",       set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:34},
  {name:"Khaleel Ahmed",       set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:27},
  {name:"Krunal Pandya",       set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:1.00,country:IND,age:33},
  {name:"Mayank Yadav",        set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:22},
  {name:"Mitchell Santner",    set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:NZ, age:32},
  {name:"Prasidh Krishna",     set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:29},
  {name:"Rajat Patidar",       set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:1.00,country:IND,age:31},
  {name:"Riyan Parag",         set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:1.00,country:IND,age:22},
  {name:"Romario Shepherd",    set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:WI, age:27},
  {name:"Rovman Powell",       set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:1.00,country:WI, age:30},
  {name:"Sai Sudharsan",       set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:1.00,country:IND,age:23},
  {name:"Shardul Thakur",      set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:1.00,country:IND,age:33},
  {name:"Sherfane Rutherford", set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:1.00,country:WI, age:25},
  {name:"T. Natarajan",        set:"SET 1",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:33},
  {name:"Tilak Varma",         set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:1.00,country:IND,age:22},
  {name:"Tristan Stubbs",      set:"SET 1",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:1.00,country:SA, age:24},
  {name:"Washington Sundar",   set:"SET 1",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:1.00,country:IND,age:25},

  // ── SET 2 — 19 players ─────────────────────────────────────────────────────
  {name:"Allah Ghazanfar",     set:"SET 2",  category:"SPINNER",       role:"Bowler", overseas:true, basePrice:0.75,country:AFG,age:18},
  {name:"Brydon Carse",        set:"SET 2",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:ENG,age:28},
  {name:"Corbin Bosch",        set:"SET 2",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:SA, age:26},
  {name:"Dewald Brevis",       set:"SET 2",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:SA, age:22},
  {name:"Dushmantha Chameera", set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:SL, age:33},
  {name:"Jacob Bethell",       set:"SET 2",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:ENG,age:21},
  {name:"Jamie Overton",       set:"SET 2",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:ENG,age:30},
  {name:"Jaydev Unadkat",      set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:33},
  {name:"Kamindu Mendis",      set:"SET 2",  category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:SL, age:25},
  {name:"Matthew Breetzke",    set:"SET 2",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:SA, age:23},
  {name:"Mitchell Owen",       set:"SET 2",  category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:AUS,age:23},
  {name:"Mukesh Kumar",        set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:31},
  {name:"Nandre Burger",       set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:SA, age:26},
  {name:"Nathan Ellis",        set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:AUS,age:30},
  {name:"Nitish Rana",         set:"SET 2",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.75,country:IND,age:30},
  {name:"Nuwan Thushara",      set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:SL, age:30},
  {name:"Rahul Tewatia",       set:"SET 2",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.75,country:IND,age:31},
  {name:"Ryan Rickelton",      set:"SET 2",  category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:0.75,country:SA, age:26},
  {name:"Xavier Bartlett",     set:"SET 2",  category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:AUS,age:25},

  // ── SET 3 — 16 players ─────────────────────────────────────────────────────
  {name:"Ajinkya Rahane",      set:"SET 3",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.50,country:IND,age:36},
  {name:"Devdutt Padikkal",    set:"SET 3",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.50,country:IND,age:24},
  {name:"Harshit Rana",        set:"SET 3",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:22},
  {name:"Ishant Sharma",       set:"SET 3",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:36},
  {name:"Jayant Yadav",        set:"SET 3",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.50,country:IND,age:35},
  {name:"Jitesh Sharma",       set:"SET 3",  category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.50,country:IND,age:30},
  {name:"Karun Nair",          set:"SET 3",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.50,country:IND,age:32},
  {name:"Manish Pandey",       set:"SET 3",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.50,country:IND,age:35},
  {name:"Nitish Kumar Reddy",  set:"SET 3",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.50,country:IND,age:22},
  {name:"R. Sai Kishore",      set:"SET 3",  category:"SPINNER",       role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:27},
  {name:"Sandeep Sharma",      set:"SET 3",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:32},
  {name:"Shahbaz Ahmed",       set:"SET 3",  category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.50,country:IND,age:27},
  {name:"Shahrukh Khan",       set:"SET 3",  category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.50,country:IND,age:30},
  {name:"Tushar Deshpande",    set:"SET 3",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:30},
  {name:"Umran Malik",         set:"SET 3",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:26},
  {name:"Yash Dayal",          set:"SET 3",  category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.50,country:IND,age:26},

  // ── SET 4 — 67 players ─────────────────────────────────────────────────────
  {name:"Abdul Samad",            set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Abhinandan Singh",       set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Abhishek Porel",         set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ajay Mandal",            set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Akash Singh",            set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Angkrish Raghuvanshi",   set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:19},
  {name:"Aniket Verma",           set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Anshul Kamboj",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Anuj Rawat",             set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Anukul Roy",             set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Arjun Tendulkar",        set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Arshin Kulkarni",        set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:18},
  {name:"Ashutosh Sharma",        set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Ashwani Kumar",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Ayush Badoni",           set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Ayush Mhatre",           set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:18},
  {name:"Digvesh Rathi",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Donovan Ferreira",       set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.30,country:SA, age:26},
  {name:"Eshan Malinga",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.30,country:SL, age:25},
  {name:"Gurjapneet Singh",       set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Gurnoor Brar",           set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Harnoor Pannu",          set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Harpreet Brar",          set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Harsh Dubey",            set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Himmat Singh",           set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Kumar Kushagra",         set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:20},
  {name:"Kwena Maphaka",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.30,country:SA, age:20},
  {name:"Lhuan-Dre Pretorious",   set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.30,country:SA, age:21},
  {name:"M. Siddharth",           set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Madhav Tiwari",          set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Manav Suthar",           set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Mayank Markande",        set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Mohd. Arshad Khan",      set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Mohsin Khan",            set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Mukesh Choudhary",       set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Musheer Khan",           set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:20},
  {name:"Naman Dhir",             set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Nehal Wadhera",          set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Nishant Sindhu",         set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Prabhsimran Singh",      set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Prince Yadav",           set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Priyansh Arya",          set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Pyla Avinash",           set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Raghu Sharma",           set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Raj Angad Bawa",         set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ramakrishna Ghosh",      set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Ramandeep Singh",        set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Rasikh Salam",           set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Robin Minz",             set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Sameer Rizvi",           set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:20},
  {name:"Shashank Singh",         set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:33},
  {name:"Shreyas Gopal",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:31},
  {name:"Shubham Dubey",          set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Smaran Ravichandaran",   set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Suryansh Shedge",        set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Suyash Sharma",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:21},
  {name:"Swapnil Singh",          set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:29},
  {name:"Tripurana Vijay",        set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Urvil Patel",            set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Vaibhav Arora",          set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Vaibhav Suryavanshi",    set:"SET 4",category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:14},
  {name:"Vipraj Nigam",           set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:21},
  {name:"Vishnu Vinod",           set:"SET 4",category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.30,country:IND,age:30},
  {name:"Vyshak Vijaykumar",      set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Yash Thakur",            set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Yudhvir Charak",         set:"SET 4",category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Zeeshan Ansari",         set:"SET 4",category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.30,country:IND,age:24},

  // ── BA1 — 6 players ───────────────────────────────────────────────────────
  {name:"Cameron Green",       set:"BA1",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:AUS,age:25},
  {name:"David Miller",        set:"BA1",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:SA, age:35},
  {name:"Devon Conway",        set:"BA1",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:NZ, age:33},
  {name:"Jake Fraser-McGurk",  set:"BA1",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:AUS,age:22},
  {name:"Prithvi Shaw",        set:"BA1",    category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.75,country:IND,age:25},
  {name:"Sarfaraz Khan",       set:"BA1",    category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.75,country:IND,age:27},

  // ── AL1 — 7 players ───────────────────────────────────────────────────────
  {name:"Deepak Hooda",        set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:0.75,country:IND,age:29},
  {name:"Gus Atkinson",        set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:26},
  {name:"Liam Livingstone",    set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:31},
  {name:"Rachin Ravindra",     set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:NZ, age:25},
  {name:"Venkatesh Iyer",      set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:false,basePrice:2.00,country:IND,age:29},
  {name:"Wanindu Hasaranga",   set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:SL, age:27},
  {name:"Wiaan Mulder",        set:"AL1",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:SA, age:27},

  // ── WK1 — 7 players ───────────────────────────────────────────────────────
  {name:"Ben Duckett",         set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:ENG,age:30},
  {name:"Finn Allen",          set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:NZ, age:26},
  {name:"Jamie Smith",         set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:ENG,age:24},
  {name:"Jonny Bairstow",      set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:1.00,country:ENG,age:35},
  {name:"K.S. Bharat",         set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:false,basePrice:0.75,country:IND,age:31},
  {name:"Quinton De Kock",     set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:1.00,country:SA, age:32},
  {name:"Rahmanullah Gurbaz",  set:"WK1",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:1.50,country:AFG,age:23},

  // ── FA1 — 9 players ───────────────────────────────────────────────────────
  {name:"Akash Deep",          set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:28},
  {name:"Anrich Nortje",       set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:SA, age:31},
  {name:"Fazalhaq Farooqi",    set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.00,country:AFG,age:24},
  {name:"Gerald Coetzee",      set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:SA, age:24},
  {name:"Jacob Duffy",         set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:29},
  {name:"Matheesha Pathirana", set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:SL, age:22},
  {name:"Matt Henry",          set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:33},
  {name:"Shivam Mavi",         set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:26},
  {name:"Spencer Johnson",     set:"FA1",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.50,country:AUS,age:27},

  // ── SP1 — 5 players ───────────────────────────────────────────────────────
  {name:"Akeal Hosein",        set:"SP1",    category:"SPINNER",       role:"Bowler", overseas:true, basePrice:2.00,country:WI, age:29},
  {name:"Maheesh Theekshana",  set:"SP1",    category:"SPINNER",       role:"Bowler", overseas:true, basePrice:2.00,country:SL, age:24},
  {name:"Mujeeb Rahman",       set:"SP1",    category:"SPINNER",       role:"Bowler", overseas:true, basePrice:2.00,country:AFG,age:23},
  {name:"Rahul Chahar",        set:"SP1",    category:"SPINNER",       role:"Bowler", overseas:false,basePrice:1.00,country:IND,age:25},
  {name:"Ravi Bishnoi",        set:"SP1",    category:"SPINNER",       role:"Bowler", overseas:false,basePrice:2.00,country:IND,age:24},

  // ── UBA1 — 6 players ──────────────────────────────────────────────────────
  {name:"Aarya Desai",         set:"UBA1",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:20},
  {name:"Abhinav Manohar",     set:"UBA1",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Abhinav Tejrana",     set:"UBA1",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Anmolpreet Singh",    set:"UBA1",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Atharva Taide",       set:"UBA1",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Yash Dhull",          set:"UBA1",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── UAL1 — 10 players ─────────────────────────────────────────────────────
  {name:"Auqib Dar",               set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Edhen Tom",               set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Kamlesh Nagarkoti",       set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Mahipal Lomror",          set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.50,country:IND,age:26},
  {name:"Prashant Veer",           set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Rajvardhan Hangargekar",  set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.40,country:IND,age:22},
  {name:"Sanvir Singh",            set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Shivang Kumar",           set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Tanush Kotian",           set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Vijay Shankar",           set:"UAL1",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:34},

  // ── UWK1 — 6 players ──────────────────────────────────────────────────────
  {name:"Kartik Sharma",       set:"UWK1",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Mukul Choudhary",     set:"UWK1",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ruchit Ahir",         set:"UWK1",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Tejasvi Singh",       set:"UWK1",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Tushar Raheja",       set:"UWK1",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Vansh Bedi",          set:"UWK1",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:20},

  // ── UFA1 — 7 players ──────────────────────────────────────────────────────
  {name:"Akash Madhwal",       set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:30},
  {name:"Ashok Sharma",        set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:29},
  {name:"Kartik Tyagi",        set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Naman Tiwari",        set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Raj Limbani",         set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Simarjeet Singh",     set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Sushant Mishra",      set:"UFA1",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},

  // ── USP1 — 7 players ──────────────────────────────────────────────────────
  {name:"Karn Sharma",              set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:false,basePrice:0.50,country:IND,age:36},
  {name:"Kumar Kartikeya Singh",    set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Prashant Solanki",         set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Shivam Shukla",            set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Vignesh Puthur",           set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Wahidullah Zadran",        set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:true, basePrice:0.30,country:AFG,age:22},
  {name:"Yash Raj Punja",           set:"USP1",  category:"SPINNER",  role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── BA2 — 8 players ───────────────────────────────────────────────────────
  {name:"Ackeem Auguste",      set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:WI, age:23},
  {name:"Mayank Agarawal",     set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.75,country:IND,age:34},
  {name:"Pathum Nissanka",     set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:SL, age:26},
  {name:"Rahul Tripathi",      set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.75,country:IND,age:34},
  {name:"Reeza Hendricks",     set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:1.00,country:SA, age:35},
  {name:"Sediqullah Atal",     set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:AFG,age:23},
  {name:"Steve Smith",         set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:2.00,country:AUS,age:36},
  {name:"Tim Robinson",        set:"BA2",    category:"BATSMAN",       role:"Batsman",overseas:true, basePrice:0.75,country:ENG,age:25},

  // ── AL2 — 9 players ───────────────────────────────────────────────────────
  {name:"Ben Dwarshuis",       set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:AUS,age:32},
  {name:"Daniel Sams",         set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:AUS,age:32},
  {name:"Daryl Mitchell",      set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:NZ, age:33},
  {name:"Dasun Shanaka",       set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:SL, age:33},
  {name:"Jason Holder",        set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:WI, age:33},
  {name:"Matthew Short",       set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.50,country:AUS,age:28},
  {name:"Michael Bracewell",   set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:NZ, age:30},
  {name:"Sean Abbott",         set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:AUS,age:32},
  {name:"Zak Foulkes",         set:"AL2",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:AUS,age:24},

  // ── WK2 — 8 players ───────────────────────────────────────────────────────
  {name:"Benjamin McDermott",  set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:0.75,country:AUS,age:30},
  {name:"Jordan Cox",          set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:0.75,country:ENG,age:24},
  {name:"Josh Inglis",         set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:AUS,age:29},
  {name:"Kusal Mendis",        set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:0.75,country:SL, age:30},
  {name:"Kusal Perera",        set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:1.00,country:SL, age:34},
  {name:"Shai Hope",           set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:WI, age:30},
  {name:"Tim Seifert",         set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:1.50,country:NZ, age:30},
  {name:"Tom Banton",          set:"WK2",    category:"WICKET_KEEPER", role:"WK",     overseas:true, basePrice:2.00,country:ENG,age:26},

  // ── FA2 — 9 players ───────────────────────────────────────────────────────
  {name:"Adam Milne",          set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:33},
  {name:"Chetan Sakariya",     set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:25},
  {name:"Kuldeep Sen",         set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:27},
  {name:"Kyle Jamieson",       set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:29},
  {name:"Lungisani Ngidi",     set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:SA, age:29},
  {name:"Mustafizur Rahman",   set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:BAN,age:29},
  {name:"Saqib Mahmood",       set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.50,country:ENG,age:27},
  {name:"Umesh Yadav",         set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:1.50,country:IND,age:37},
  {name:"William Orourke",     set:"FA2",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:NZ, age:23},

  // ── SP2 — 4 players ───────────────────────────────────────────────────────
  {name:"Mohammad Waqar Salamkheil",set:"SP2",category:"SPINNER",role:"Bowler",overseas:true, basePrice:1.00,country:AFG,age:22},
  {name:"Qais Ahmad",          set:"SP2",    category:"SPINNER",       role:"Bowler", overseas:true, basePrice:0.75,country:AFG,age:25},
  {name:"Rishad Hossain",      set:"SP2",    category:"SPINNER",       role:"Bowler", overseas:true, basePrice:0.75,country:BAN,age:22},
  {name:"Viyaskanth Vijayakanth",set:"SP2",  category:"SPINNER",       role:"Bowler", overseas:true, basePrice:0.75,country:SL, age:25},

  // ── UBA2 — 8 players ──────────────────────────────────────────────────────
  {name:"Akshat Raghuwanshi",  set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Aman Rao Perala",     set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Ankit Kumar",         set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Danish Malewar",      set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Manan Vohra",         set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:31},
  {name:"Pukhraj Mann",        set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Rohan Kunnummal",     set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Salman Nizar",        set:"UBA2",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:23},

  // ── UAL2 — 10 players ─────────────────────────────────────────────────────
  {name:"Aman Khan",           set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Darshan Nalkande",    set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Harsh Tyagi",         set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Mangesh Yadav",       set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Mayank Rawat",        set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Sairaj Patil",        set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Satvik Deswal",       set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Suyash Prabhudessai", set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Vicky Ostwal",        set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Yuvraj Chaudhary",    set:"UAL2",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── UWK2 — 8 players ──────────────────────────────────────────────────────
  {name:"Abhishek Pathak",     set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Kunal Rathore",       set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Rahul Buddhi",        set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Ravi Singh",          set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Ricky Bhui",          set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:29},
  {name:"Salil Arora",         set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Saurav Chuahan",      set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Yashvardhan Dalal",   set:"UWK2",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── UFA2 — 9 players ──────────────────────────────────────────────────────
  {name:"K.M Asif",                set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.40,country:IND,age:30},
  {name:"Mohammad Izhar",          set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Onkar Tarmale",           set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Prithviraj Yarra",        set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"PV.Satyanarayana Raju",   set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Sakib Hussain",           set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Vidwath Kaverappa",       set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Vidyadhar Patil",         set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Vijay Kumar",             set:"UFA2",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},

  // ── USP2 — 9 players ──────────────────────────────────────────────────────
  {name:"Bailapudi Yeswanth",  set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Himanshu Sharma",     set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"K.C. Cariappa",       set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Kartik Chadha",       set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Mohit Rathee",        set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Murugan Ashwin",      set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:33},
  {name:"Pravin Dubey",        set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Shubham Agrawal",     set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.40,country:IND,age:24},
  {name:"Tejas Baroka",        set:"USP2",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},

  // ── AL3 — 9 players ───────────────────────────────────────────────────────
  {name:"Beau Webster",        set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.25,country:AUS,age:29},
  {name:"Bevon-John Jacobs",   set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:SA, age:25},
  {name:"Cooper Connolly",     set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:AUS,age:22},
  {name:"Daniel Lawrence",     set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:28},
  {name:"George Linde",        set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:SA, age:31},
  {name:"Gulbadin Naib",       set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:AFG,age:33},
  {name:"Rehan Ahmed",         set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:ENG,age:21},
  {name:"Tom Curran",          set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:29},
  {name:"William Sutherland",  set:"AL3",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:AUS,age:26},

  // ── FA3 — 9 players ───────────────────────────────────────────────────────
  {name:"Alzarri Joseph",      set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:WI, age:28},
  {name:"Jhye Richardson",     set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.50,country:AUS,age:28},
  {name:"Luke Wood",           set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:ENG,age:28},
  {name:"Navdeep Saini",       set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:31},
  {name:"Naveen Ul Haq",       set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:2.00,country:AFG,age:26},
  {name:"Richard Gleeson",     set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:ENG,age:36},
  {name:"Riley Meredith",      set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.50,country:AUS,age:28},
  {name:"Shamar Joseph",       set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:WI, age:24},
  {name:"Taskin Ahmed",        set:"FA3",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:BAN,age:29},

  // ── UBA3 — 8 players ──────────────────────────────────────────────────────
  {name:"Adarsh Singh",        set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Arsh Kabir Ranga",    set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:20},
  {name:"Ayush Doseja",        set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Bhanu Pania",         set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Kunal Chandela",      set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:30},
  {name:"M.Dheeraj Kumar",     set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Qamran Iqbal",        set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Sahil Parakh",        set:"UBA3",   category:"BATSMAN",       role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:23},

  // ── UAL3 — 10 players ─────────────────────────────────────────────────────
  {name:"Abid Mushtaq",        set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Atit Sheth",          set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Hritik Shokeen",      set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Jagadeesha Suchith",  set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:33},
  {name:"Jalaj Saxena",        set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.40,country:IND,age:36},
  {name:"Manoj Bhandage",      set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Manvanth Kumar",      set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Mayank Dagar",        set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Raghav Goyal",        set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Tanay Thyagarajann",  set:"UAL3",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── UWK3 — 8 players ──────────────────────────────────────────────────────
  {name:"Ajitesh Guruswamy",   set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Bipin Saurabh",       set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Connor Esterhuizen",  set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:true, basePrice:0.30,country:SA, age:27},
  {name:"Hardik Tamore",       set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Joe Clarke",          set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:true, basePrice:0.50,country:ENG,age:30},
  {name:"Siddharth Joon",      set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Tom Moores",          set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:true, basePrice:0.40,country:ENG,age:27},
  {name:"Vishnu Solanki",      set:"UWK3",   category:"WICKET_KEEPER", role:"WK",overseas:false,basePrice:0.30,country:IND,age:26},

  // ── UFA3 — 9 players ──────────────────────────────────────────────────────
  {name:"Abhilash Shetty",     set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Arpit Guleria",       set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Divesh Sharma",       set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Irfan Umair",         set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Kuldip Yadav",        set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Money Grewal",        set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Sayan Ghosh",         set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Sunil Kumar",         set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Tristan Luus",        set:"UFA3",   category:"FAST_BOWLER",   role:"Bowler",overseas:true, basePrice:0.30,country:SA, age:30},

  // ── USP3 — 9 players ──────────────────────────────────────────────────────
  {name:"Amit Kumar",               set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Chintal Gandhi",           set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Dharmendrasinh Jadeja",    set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Jhathavedh Subramanyan",   set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Manan Bhardwaj",           set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Parikshit Dhanak",         set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Saumy Pandey",             set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Shreyas Chavan",           set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Vishal Nishad",            set:"USP3",  category:"SPINNER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},

  // ── AL4 — 9 players ───────────────────────────────────────────────────────
  {name:"Charith Asalanka",    set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:SL, age:27},
  {name:"Dunith Wellalage",    set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:SL, age:23},
  {name:"Dwaine Pretorius",    set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.00,country:SA, age:35},
  {name:"George Garton",       set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:ENG,age:28},
  {name:"Kyle Mayers",         set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.25,country:WI, age:32},
  {name:"Liam Dawson",         set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:2.00,country:ENG,age:34},
  {name:"Muhammad Abbas",      set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:PAK,age:35},
  {name:"Nathan Smith",        set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:0.75,country:NZ, age:27},
  {name:"Roston Chase",        set:"AL4",    category:"ALL_ROUNDER",   role:"AR",     overseas:true, basePrice:1.25,country:WI, age:32},

  // ── FA4 — 7 players ───────────────────────────────────────────────────────
  {name:"Jason Behrendorff",   set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.50,country:AUS,age:34},
  {name:"Joshua Tongue",       set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.00,country:ENG,age:26},
  {name:"Matthew Potts",       set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:ENG,age:26},
  {name:"Nahid Rana",          set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:BAN,age:23},
  {name:"Olly Stone",          set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:1.25,country:ENG,age:32},
  {name:"Sandeep Warrier",     set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:false,basePrice:0.75,country:IND,age:34},
  {name:"Tanzim Hasan Sakib",  set:"FA4",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:BAN,age:23},

  // ── UBA4 — 8 players ──────────────────────────────────────────────────────
  {name:"Aaron Varghese",         set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ahammed Imran",          set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ayaz Khan",              set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Daniel Lategan",         set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:true, basePrice:0.30,country:SA, age:25},
  {name:"Miles Hammond",          set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Sachin Dhas",            set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Siddhant Rana",          set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Vishvarajsinh Jadeja",   set:"UBA4",  category:"BATSMAN",    role:"Batsman",overseas:false,basePrice:0.30,country:IND,age:25},

  // ── UAL4 — 10 players ─────────────────────────────────────────────────────
  {name:"Abdul Bazith",        set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Atharva Ankolekar",   set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Ayush Vartak",        set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Karan Lal",           set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Prince Rai",          set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ripal Patel",         set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Sanjay Yadav",        set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Shams Mulani",        set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Utkarsh Singh",       set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Vivrant Sharma",      set:"UAL4",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:21},

  // ── UFA4 — 9 players ──────────────────────────────────────────────────────
  {name:"Esakkimuthu Ayyakutti",set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Ishan Porel",          set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Kulwant Khejroliya",   set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:30},
  {name:"Pankaj Jaswal",        set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Praful Hinge",         set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Rajan Kumar",          set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Ravi Kumar",           set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Safvan Patel",         set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Sayed Irfan Aftab",    set:"UFA4",  category:"FAST_BOWLER",role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── USP4 — 9 players ──────────────────────────────────────────────────────
  {name:"Arab Gul",            set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:true, basePrice:0.40,country:AFG,age:22},
  {name:"Izaz Sawariya",       set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Jikku Bright",        set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Naman Pushpak",       set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Purav Agarwal",       set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Rakibul Hasan",       set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:true, basePrice:0.30,country:BAN,age:23},
  {name:"Roshan Wagshare",     set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Traveen Mathew",      set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:true, basePrice:0.30,country:SL, age:25},
  {name:"Yash Dicholkar",      set:"USP4",   category:"SPINNER",       role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},

  // ── FA5 — 6 players ───────────────────────────────────────────────────────
  {name:"Billy Stanlake",      set:"FA5",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:AUS,age:30},
  {name:"Binura Fernando",     set:"FA5",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:SL, age:27},
  {name:"Joshua Little",       set:"FA5",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:IRE,age:26},
  {name:"Md Shoriful Islam",   set:"FA5",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:BAN,age:23},
  {name:"Obed McCoy",          set:"FA5",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:WI, age:28},
  {name:"Wesley Agar",         set:"FA5",    category:"FAST_BOWLER",   role:"Bowler", overseas:true, basePrice:0.75,country:AUS,age:30},

  // ── UAL5 — 10 players ─────────────────────────────────────────────────────
  {name:"Krains Fuletra",      set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Macneil Noronha",     set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Nikhil Chaudhary",    set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.40,country:IND,age:24},
  {name:"Ninad Rathva",        set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"R Rajkumar",          set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"R.S Ambrish",         set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"R.Sonu Yadav",        set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Shivalik Sharma",     set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Siddharth Yadav",     set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Sunny Sandhu",        set:"UAL5",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:27},

  // ── UFA5 — 9 players ──────────────────────────────────────────────────────
  {name:"Atal Rai",            set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Atif Mushtaq",        set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"C.Rakshann Readdi",   set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Deependra Singh",     set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Manish Reddy",        set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Nishanth Saranu",     set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Rajat Verma",         set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Rohit Yadav",         set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Waseem Khanday",      set:"UFA5",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},

  // ── UAL6 — 10 players ─────────────────────────────────────────────────────
  {name:"Bal Krishna",         set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Delano Potgieter",    set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:true, basePrice:0.30,country:SA, age:23},
  {name:"Emanjot Chahal",      set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Hardik Raj",          set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Khilan Patel",        set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Parth Rekhade",       set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Sarthak Ranjan",      set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Shubhang Hegde",      set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Tiaan Van Vuuren",    set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:true, basePrice:0.30,country:NAM,age:30},
  {name:"Vihaan Malhotra",     set:"UAL6",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:20},

  // ── UFA6 — 9 players ──────────────────────────────────────────────────────
  {name:"Aaqib Khan",          set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Aman Shekhawat",      set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Bayanda Majola",      set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:true, basePrice:0.30,country:SA, age:25},
  {name:"Brijesh Sharma",      set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Sabir Khan",          set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Sadek Hussain",       set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Shreevatsha Acharya", set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Shubham Kapse",       set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Srihari Nair",        set:"UFA6",   category:"FAST_BOWLER",   role:"Bowler",overseas:false,basePrice:0.30,country:IND,age:24},

  // ── UAL7 — 10 players ─────────────────────────────────────────────────────
  {name:"Abhimanyusingh Rajput",set:"UAL7",  category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Akash Pugazhanthi",   set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Arpit Rana",          set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:28},
  {name:"Himanshu Bisht",      set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Kanishk Chouhan",     set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Maramreddy Reddy",    set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Mayank Gusain",       set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Sagar Solanki",       set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Shreyan Chakraborty", set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Shubham Rana",        set:"UAL7",   category:"ALL_ROUNDER",   role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},

  // ── UAL8 — 10 players ─────────────────────────────────────────────────────
  {name:"Anuj Thakral",           set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Arfaz Mohammad",         set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Aryaman Singh Dhaliwal", set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Daksh Kamra",            set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Hemang Patel",           set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Lalit Yadav",            set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:27},
  {name:"Mridul Surroch",         set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Nitin Sai Yadav",        set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Parth Vats",             set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Vishal Mandwal",         set:"UAL8", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:25},

  // ── UAL9 — 10 players ─────────────────────────────────────────────────────
  {name:"Akhil Scaria",           set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Ishan Mulchandani",      set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"K.Ajay Singh",           set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Krish Bhagat",           set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Luckyrajsinh Vaghela",   set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Muhammed Sharafuddeen",  set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Nasir Lone",             set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Prerit Dutta",           set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Ritik Tada",             set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Sammar Gajjar",          set:"UAL9", category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},

  // ── UAL10 — 10 players ────────────────────────────────────────────────────
  {name:"Akshu Bajwa",            set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Dhurmil Matkar",         set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:23},
  {name:"Dian Forrester",         set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:true, basePrice:0.30,country:WI, age:25},
  {name:"Jack Edwards",           set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:true, basePrice:0.50,country:AUS,age:26},
  {name:"Madhav Bajaj",           set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Mohamed Ali",            set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
  {name:"Parikshit Valsangkar",   set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:25},
  {name:"Rishabh Chauhan",        set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:22},
  {name:"Shiva Singh",            set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:26},
  {name:"Varun Raj Singh Bisht",  set:"UAL10",category:"ALL_ROUNDER",  role:"AR",overseas:false,basePrice:0.30,country:IND,age:24},
];

function generateStats(role: PlayerRole, overall: number) {
  const matches = Math.floor(25 + Math.random() * 120);
  let runs = 0, wickets = 0, strikeRate = 0.0, economy = 0.0;
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
  } else {
    runs = Math.floor(matches * (overall * 0.32 + Math.random() * 7));
    strikeRate = parseFloat((120 + Math.random() * 22 + overall * 0.12).toFixed(1));
  }
  return { matches, runs, wickets, strikeRate, economy };
}

function buildPlayer(id: number, def: PlayerDef): SeedPlayer {
  // Auto-compute targetOvr from basePrice
  let T = def.basePrice >= 2.00 ? 85 : def.basePrice >= 1.50 ? 80 :
          def.basePrice >= 1.25 ? 78 : def.basePrice >= 1.00 ? 76 :
          def.basePrice >= 0.75 ? 73 : def.basePrice >= 0.50 ? 68 :
          def.basePrice >= 0.40 ? 65 : 62;
  T = Math.min(99, Math.max(50, T));

  const roleCode: PlayerRole = def.role === 'Batsman' ? 'BAT' :
                               def.role === 'Bowler'  ? 'BOWL' :
                               def.role === 'WK'      ? 'WK'   : 'AR';

  let battingRating = 10, bowlingRating = 10;
  let fieldingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 8) - 4));
  let formRating     = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 10) - 5));

  if (roleCode === 'BAT') {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 1));
    bowlingRating = Math.floor(10 + Math.random() * 15);
  } else if (roleCode === 'BOWL') {
    bowlingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 1));
    battingRating = Math.floor(10 + Math.random() * 15);
  } else if (roleCode === 'AR') {
    battingRating = Math.min(99, Math.max(40, T - 4 + Math.floor(Math.random() * 5)));
    bowlingRating = Math.min(99, Math.max(40, T - 4 + Math.floor(Math.random() * 5)));
  } else {
    battingRating = Math.min(99, Math.max(40, T + Math.floor(Math.random() * 4) - 2));
    fieldingRating = Math.min(99, Math.max(40, T + 4 + Math.floor(Math.random() * 4) - 2));
    bowlingRating = Math.floor(5 + Math.random() * 5);
  }

  const overallRating = Math.round(
    roleCode === 'BAT'  ? battingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    roleCode === 'BOWL' ? bowlingRating * 0.5 + fieldingRating * 0.3 + formRating * 0.2 :
    roleCode === 'AR'   ? (battingRating + bowlingRating) * 0.3 + fieldingRating * 0.2 + formRating * 0.2 :
                          battingRating * 0.45 + fieldingRating * 0.35 + formRating * 0.2
  );

  let potentialRating = 75, experienceRating = 40;
  if (def.age <= 24)      { experienceRating = Math.floor(20 + Math.random() * 20); potentialRating = Math.floor(82 + Math.random() * 15); }
  else if (def.age <= 31) { experienceRating = Math.floor(45 + Math.random() * 30); potentialRating = Math.min(99, overallRating + Math.floor(Math.random() * 8)); }
  else if (def.age <= 36) { experienceRating = Math.floor(78 + Math.random() * 12); potentialRating = Math.max(40, overallRating - Math.floor(Math.random() * 10)); }
  else                    { experienceRating = Math.floor(88 + Math.random() * 10); potentialRating = Math.floor(40 + Math.random() * 15); }

  const popularity = Math.min(99, Math.max(20, Math.floor(overallRating * 0.85 + Math.random() * 12)));
  let marketValueScore = Math.round((overallRating * 0.45) + (formRating * 0.20) + (popularity * 0.15) + (experienceRating * 0.10) + (potentialRating * 0.10));
  if (def.set === 'MARQUEE') marketValueScore = Math.min(99, marketValueScore + 8);
  marketValueScore = Math.min(99, Math.max(40, marketValueScore));

  const stats = generateStats(roleCode, overallRating);

  return {
    id, name: def.name, set: def.set, category: def.category,
    role: roleCode,  // ← stored as BAT/BOWL/AR/WK
    overseas: def.overseas, basePrice: def.basePrice, country: def.country, age: def.age,
    battingRating, bowlingRating, fieldingRating, potentialRating, experienceRating,
    formRating, overallRating, marketValueScore, ...stats, popularity,
    auctionStatus: 'AVAILABLE', currentTeam: null, soldPrice: null,
    subRole: roleCode === 'BAT' ? 'Batsman' :
             roleCode === 'BOWL' ? (def.category === 'SPINNER' ? 'Spin Bowler' : 'Fast Bowler') :
             roleCode === 'AR'   ? 'All-Rounder' : 'WK-Batsman',
  };
}

export function generateFullAuctionPool(): SeedPlayer[] {
  const pool: SeedPlayer[] = [];
  let nextId = 1;
  PLAYERS_TO_SEED.forEach(def => { pool.push(buildPlayer(nextId++, def)); });
  return pool;
}

const pool = generateFullAuctionPool();
const targetPath = path.join(process.cwd(), './src/lib/players-data.json');
fs.writeFileSync(targetPath, JSON.stringify(pool, null, 2), 'utf-8');
console.log(`✅ Seeded ${pool.length} players → ${targetPath}`);
