// ============================================================
// AuctionVerse Cricket — Core TypeScript Types V3
// ============================================================

export type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';
export type AuctionPhase = 'WAITING' | 'COUNTDOWN' | 'BIDDING' | 'RESOLVING' | 'SOLD' | 'UNSOLD' | 'COMPLETE' | 'SET_ANNOUNCEMENT';
export type AIPersonality = 'aggressive' | 'conservative' | 'balanced' | 'youth-focused' | 'star-hunter';
export type TeamId = 'mi' | 'csk' | 'rcb' | 'kkr' | 'dc' | 'srh' | 'rr' | 'pbks' | 'gt' | 'lsg';

export interface Player {
  id: number;
  name: string;
  country: string;
  flag: string;
  overseas: boolean;
  capped: boolean;
  role: PlayerRole;
  subRole?: string;
  age: number;
  basePrice: number;      // in Cr
  soldPrice: number | null;
  currentTeam: TeamId | null;
  batting: number;        // 0-99
  bowling: number;        // 0-99
  fielding: number;       // 0-99
  potential: number;      // 0-99
  form: number;           // 0-99
  experience: number;     // 0-99
  overall: number;        // computed
  fitness: number;        // 0-99
  popularity: number;     // 0-99
  marketValueScore: number;
  category?: string;
  // Expanded V3 profile fields
  battingStyle?: string;
  bowlingStyle?: string;
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  iplExperience?: string;
  photo?: string;
}

export interface Team {
  id: TeamId;
  name: string;
  abbr: string;
  emoji: string;
  primaryColor: string;
  secondaryColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  purse: number;          // remaining in Cr
  squad: Player[];
  rtmCards?: number;
  strategy: AIPersonality;
  targets?: Record<PlayerRole, number>;
  isUserControlled?: boolean;
  isHuman?: boolean;
  controllerName?: string | null;
}

export interface BidEntry {
  id: string;
  teamId: TeamId;
  teamName: string;
  teamAbbr: string;
  teamEmoji: string;
  amount: number;
  timestamp: number;
  isUser?: boolean;
}

export interface AuctionState {
  phase: AuctionPhase;
  pool: Player[];
  currentIndex: number;
  currentPlayer: Player | null;
  currentBid: number;
  currentBidderId: TeamId | null;
  countdown: number;
  bidHistory: BidEntry[];
  soldCount: number;
  unsoldCount: number;
  totalValueSold: number;
}

export interface AuctionResult {
  player: Player;
  soldTo: TeamId | null;
  soldPrice: number;
  wasContested: boolean;
  bidCount: number;
}

export interface SocketRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'lobby' | 'auction' | 'complete';
}

export interface BidResult {
  success: boolean;
  reason?: string;
  newBid?: number;
}
