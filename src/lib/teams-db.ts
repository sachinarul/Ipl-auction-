// ============================================================
// AuctionVerse Cricket — IPL 2025 Teams Database
// All teams start with ZERO players
// ============================================================
import { Team, AIPersonality, PlayerRole } from '@/types';

export const TEAMS_DB: Team[] = [
  {
    id: 'mi', name: 'Mumbai Indians', abbr: 'MI', emoji: '💙',
    primaryColor: '#004BA0', secondaryColor: '#D4AF37',
    gradientFrom: '#004BA0', gradientTo: '#001E6C',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'aggressive' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'csk', name: 'Chennai Super Kings', abbr: 'CSK', emoji: '💛',
    primaryColor: '#FFC107', secondaryColor: '#0A2D5E',
    gradientFrom: '#FFC107', gradientTo: '#E6A800',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'balanced' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'rcb', name: 'Royal Challengers Bengaluru', abbr: 'RCB', emoji: '❤️',
    primaryColor: '#CC2200', secondaryColor: '#D4AF37',
    gradientFrom: '#CC2200', gradientTo: '#8B1500',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'star-hunter' as AIPersonality,
    targets: { BAT: 6, BOWL: 5, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'kkr', name: 'Kolkata Knight Riders', abbr: 'KKR', emoji: '💜',
    primaryColor: '#3A225D', secondaryColor: '#D4AF37',
    gradientFrom: '#3A225D', gradientTo: '#1E0F35',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'balanced' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'dc', name: 'Delhi Capitals', abbr: 'DC', emoji: '🔵',
    primaryColor: '#17449B', secondaryColor: '#EF2B2D',
    gradientFrom: '#17449B', gradientTo: '#0D2860',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'conservative' as AIPersonality,
    targets: { BAT: 5, BOWL: 7, AR: 2, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'srh', name: 'Sunrisers Hyderabad', abbr: 'SRH', emoji: '🟠',
    primaryColor: '#F7612D', secondaryColor: '#1A1A1A',
    gradientFrom: '#F7612D', gradientTo: '#C04010',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'aggressive' as AIPersonality,
    targets: { BAT: 6, BOWL: 5, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'rr', name: 'Rajasthan Royals', abbr: 'RR', emoji: '💗',
    primaryColor: '#EA1B8B', secondaryColor: '#254AA5',
    gradientFrom: '#EA1B8B', gradientTo: '#A01060',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'youth-focused' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'pbks', name: 'Punjab Kings', abbr: 'PBKS', emoji: '🔴',
    primaryColor: '#AA4545', secondaryColor: '#DCDDDE',
    gradientFrom: '#AA4545', gradientTo: '#6E2B2B',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'aggressive' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'gt', name: 'Gujarat Titans', abbr: 'GT', emoji: '🔷',
    primaryColor: '#1C4A6B', secondaryColor: '#C8A951',
    gradientFrom: '#1C4A6B', gradientTo: '#0D2638',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'conservative' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 2, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
  {
    id: 'lsg', name: 'Lucknow Super Giants', abbr: 'LSG', emoji: '🩵',
    primaryColor: '#00ADEF', secondaryColor: '#1B1B3A',
    gradientFrom: '#00ADEF', gradientTo: '#005F8A',
    purse: 120, squad: [], rtmCards: 2,
    strategy: 'balanced' as AIPersonality,
    targets: { BAT: 5, BOWL: 6, AR: 3, WK: 2 } as Record<PlayerRole, number>,
    isUserControlled: false,
  },
];

export function getTeamById(id: string): Team | undefined {
  return TEAMS_DB.find(t => t.id === id);
}

export function cloneTeams(): Team[] {
  return TEAMS_DB.map(t => ({
    ...t,
    squad: [],
    purse: 120,
    rtmCards: 2,
    targets: { ...t.targets },
  }));
}
