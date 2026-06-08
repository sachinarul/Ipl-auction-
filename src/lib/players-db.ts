// ============================================================
// AuctionVerse Cricket — Dynamic Player Database
// Loads pre-compiled 580+ player data pool
// ============================================================
import { Player, PlayerRole } from '@/types';
import rawPlayers from './players-data.json';

const FLAG_MAP: Record<string, string> = {
  'India': '🇮🇳', 'Australia': '🇦🇺', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'South Africa': '🇿🇦', 'West Indies': '🇹🇹', 'New Zealand': '🇳🇿',
  'Afghanistan': '🇦🇫', 'Sri Lanka': '🇱🇰', 'Bangladesh': '🇧🇩',
  'Pakistan': '🇵🇰', 'Zimbabwe': '🇿🇼', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Nepal': '🇳🇵',
};

function getFlagEmoji(country: string): string {
  return FLAG_MAP[country] || '🌍';
}

export const PLAYER_DB: Player[] = rawPlayers.map((p: any) => ({
  id: p.id,
  name: p.name,
  country: p.country,
  flag: getFlagEmoji(p.country),
  overseas: p.country !== 'India',
  capped: p.category !== 'Indian Uncapped Batsmen' && 
          p.category !== 'Indian Uncapped Wicket Keepers' && 
          p.category !== 'Emerging Players',
  role: p.role as PlayerRole,
  age: p.age,
  basePrice: p.basePrice,
  soldPrice: p.soldPrice,
  currentTeam: p.currentTeam,
  batting: p.battingRating,
  bowling: p.bowlingRating,
  fielding: p.fieldingRating,
  potential: p.potentialRating,
  form: p.formRating,
  experience: p.experienceRating,
  overall: p.overallRating,
  fitness: Math.min(99, 55 + Math.floor((100 - p.age) * 0.8)),
  popularity: p.popularity,
  marketValueScore: p.marketValueScore || p.overallRating,
})) as any;

export function getPlayersByRole(role: PlayerRole): Player[] {
  return PLAYER_DB.filter(p => p.role === role);
}

export function shufflePlayers(): Player[] {
  const arr = PLAYER_DB.map(p => ({ ...p, soldPrice: null, currentTeam: null }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getTopPlayersByOVR(n = 10): Player[] {
  return [...PLAYER_DB].sort((a, b) => b.overall - a.overall).slice(0, n);
}
