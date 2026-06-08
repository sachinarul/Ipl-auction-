// ============================================================
// AuctionVerse — AI Bidding Engine
// 5 distinct AI personalities with realistic decision making
// ============================================================
import { Team, Player, AIPersonality, PlayerRole } from '@/types';
import { getNextBid } from './BidIncrement';

const AUCTION_RULES = {
  maxSquad: 25,
  maxOverseas: 8,
  startingPurse: 120,
};

function getOverseasCount(squad: Player[]): number {
  return squad.filter(p => p.overseas).length;
}

function getRoleCount(squad: Player[], role: PlayerRole): number {
  return squad.filter(p => p.role === role).length;
}

function getPersonalityMultiplier(personality: AIPersonality): number {
  const map: Record<AIPersonality, number> = {
    'aggressive':    0.22,
    'balanced':      0.15,
    'conservative':  0.09,
    'youth-focused': 0.14,
    'star-hunter':   0.20,
  };
  return map[personality] ?? 0.15;
}

function getBidProbability(personality: AIPersonality, roleNeed: number, player: Player, currentBid: number): number {
  let prob = 0.50;

  // Role need adjustment
  if (roleNeed > 0.7) prob += 0.25;
  else if (roleNeed > 0.4) prob += 0.12;
  else if (roleNeed <= 0) prob -= 0.30;

  // Personality adjustments
  switch (personality) {
    case 'aggressive':   prob += 0.15; break;
    case 'conservative': prob -= 0.15; break;
    case 'star-hunter':
      if (player.overall >= 88) prob += 0.25;
      else prob -= 0.25;
      break;
    case 'youth-focused':
      if (player.age <= 24) prob += 0.20;
      else if (player.age >= 32) prob -= 0.20;
      break;
  }

  // Star player premium
  if (player.overall >= 90) prob += 0.15;
  else if (player.overall >= 85) prob += 0.07;

  // Budget pressure
  if (currentBid > 15) prob -= 0.15;
  if (currentBid > 20) prob -= 0.20;

  return Math.min(0.88, Math.max(0.05, prob));
}

export interface AIDecision {
  shouldBid: boolean;
  reason: string;
}

export function getAIDecision(
  team: Team,
  player: Player,
  currentBid: number
): AIDecision {
  const nextBid = getNextBid(currentBid);

  // Hard constraints
  if (team.purse < nextBid)
    return { shouldBid: false, reason: 'insufficient_purse' };
  if (team.squad.length >= AUCTION_RULES.maxSquad)
    return { shouldBid: false, reason: 'squad_full' };
  if (player.overseas && getOverseasCount(team.squad) >= AUCTION_RULES.maxOverseas)
    return { shouldBid: false, reason: 'overseas_limit' };

  // Reserve budget — keep min purse per remaining slot
  const remainingSlots = Math.max(1, AUCTION_RULES.maxSquad - team.squad.length);
  const reservePerSlot = team.strategy === 'aggressive' ? 0.50 : 0.75;
  const reserve = remainingSlots * reservePerSlot;
  if (team.purse - nextBid < reserve)
    return { shouldBid: false, reason: 'protecting_reserve' };

  // Role need (targets is optional in V3 Team type)
  const roleTarget = team.targets?.[player.role] ?? 3;
  const currentRoleCount = getRoleCount(team.squad, player.role);
  const roleNeed = Math.max(0, (roleTarget - currentRoleCount) / roleTarget);

  // Value ceiling incorporating both Overall OVR and Market Value Score
  const multiplier = getPersonalityMultiplier(team.strategy);
  const budget = team.purse / remainingSlots;
  const starBonus = player.overall >= 90 ? 1.5 : player.overall >= 85 ? 1.2 : 1.0;
  const playerStrength = (player.overall * 0.6 + (player.marketValueScore || player.overall) * 0.4);
  const maxWilling = playerStrength * budget * multiplier * starBonus;

  if (nextBid > maxWilling)
    return { shouldBid: false, reason: 'above_value_ceiling' };

  // Probabilistic decision
  const prob = getBidProbability(team.strategy, roleNeed, player, currentBid);
  const shouldBid = Math.random() < prob;

  return {
    shouldBid,
    reason: shouldBid ? 'bid_approved' : 'random_pass',
  };
}
