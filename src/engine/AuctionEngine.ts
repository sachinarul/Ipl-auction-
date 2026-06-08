// ============================================================
// AuctionVerse — Core Auction State Machine
// Authoritative server-side/client-side auction logic
// ============================================================
import { Team, Player, AuctionState, AuctionPhase, BidEntry, TeamId, AuctionResult } from '@/types';
import { getNextBid, getNextIncrement, formatCr } from './BidIncrement';
import { getAIDecision } from './AIBidder';
import { shufflePlayers } from '@/lib/players-db';

export type AuctionEngineEvent =
  | { type: 'PLAYER_LOADED'; player: Player; startingBid: number }
  | { type: 'BID_PLACED'; teamId: TeamId; amount: number; teamName: string }
  | { type: 'COUNTDOWN_TICK'; countdown: number }
  | { type: 'PLAYER_SOLD'; player: Player; teamId: TeamId; price: number }
  | { type: 'PLAYER_UNSOLD'; player: Player }
  | { type: 'AUCTION_COMPLETE'; results: AuctionResult[] };

export type EventHandler = (event: AuctionEngineEvent) => void;

export class AuctionEngine {
  private state: AuctionState;
  private teams: Team[];
  private myTeamId: TeamId;
  private eventHandlers: EventHandler[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private aiTimeout: ReturnType<typeof setTimeout> | null = null;
  private results: AuctionResult[] = [];
  private bidCount = 0;

  constructor(teams: Team[], myTeamId: TeamId) {
    this.teams = teams;
    this.myTeamId = myTeamId;
    this.state = {
      phase: 'WAITING',
      pool: shufflePlayers(),
      currentIndex: 0,
      currentPlayer: null,
      currentBid: 0,
      currentBidderId: null,
      countdown: 12,
      bidHistory: [],
      soldCount: 0,
      unsoldCount: 0,
      totalValueSold: 0,
    };
  }

  on(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  private emit(event: AuctionEngineEvent) {
    this.eventHandlers.forEach(h => h(event));
  }

  getState(): AuctionState { return { ...this.state }; }
  getTeams(): Team[] { return this.teams.map(t => ({ ...t, squad: [...t.squad] })); }

  start() {
    this.loadNextPlayer();
  }

  private loadNextPlayer() {
    this.clearTimers();

    if (this.state.currentIndex >= this.state.pool.length) {
      this.state.phase = 'COMPLETE';
      this.emit({ type: 'AUCTION_COMPLETE', results: this.results });
      return;
    }

    const player = this.state.pool[this.state.currentIndex];
    this.state.currentPlayer = player;
    this.state.currentBid = player.basePrice;
    this.state.currentBidderId = null;
    this.state.countdown = 12;
    this.state.phase = 'BIDDING';
    this.bidCount = 0;
    this.state.bidHistory = [];

    this.emit({ type: 'PLAYER_LOADED', player, startingBid: player.basePrice });
    this.startCountdown();
    this.scheduleAI();
  }

  private startCountdown() {
    this.tickInterval = setInterval(() => {
      this.state.countdown--;
      this.emit({ type: 'COUNTDOWN_TICK', countdown: this.state.countdown });

      if (this.state.countdown <= 0) {
        this.resolvePlayer();
      }
    }, 1000);
  }

  private clearTimers() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
  }

  private scheduleAI() {
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    const delay = 1200 + Math.random() * 1500;
    this.aiTimeout = setTimeout(() => this.runAIRound(), delay);
  }

  private runAIRound() {
    if (this.state.phase !== 'BIDDING' || !this.state.currentPlayer) return;

    // Filter out user team and only bid if we're not already the highest bidder
    const aiTeams = this.teams
      .filter(t => t.id !== this.myTeamId && t.id !== this.state.currentBidderId)
      .sort(() => Math.random() - 0.5);

    for (const team of aiTeams) {
      const decision = getAIDecision(team, this.state.currentPlayer, this.state.currentBid);
      if (decision.shouldBid) {
        const newBid = getNextBid(this.state.currentBid);
        this.applyBid(team.id, newBid, team.name, team.abbr, team.emoji, false);
        this.scheduleAI();
        return;
      }
    }
    // If no AI bid and countdown is ticking, keep scheduling checks
    this.scheduleAI();
  }

  placeBid(teamId: TeamId): { success: boolean; reason?: string } {
    if (this.state.phase !== 'BIDDING') return { success: false, reason: 'not_in_bidding_phase' };
    if (teamId === this.state.currentBidderId) return { success: false, reason: 'already_highest_bidder' };

    const team = this.teams.find(t => t.id === teamId);
    if (!team) return { success: false, reason: 'team_not_found' };

    const nextBid = getNextBid(this.state.currentBid);
    if (team.purse < nextBid) return { success: false, reason: 'insufficient_purse' };
    if (team.squad.length >= 25) return { success: false, reason: 'squad_full' };
    if (this.state.currentPlayer?.overseas && this.getOverseasCount(team) >= 8)
      return { success: false, reason: 'overseas_limit' };

    this.applyBid(teamId, nextBid, team.name, team.abbr, team.emoji, teamId === this.myTeamId);
    
    this.clearTimers();
    this.startCountdown();
    this.scheduleAI();
    return { success: true };
  }

  pass(): void {
    if (this.state.phase !== 'BIDDING') return;
    this.clearTimers();
    this.state.countdown = Math.min(2, this.state.countdown);
    this.startCountdown();
  }

  private applyBid(teamId: TeamId, amount: number, teamName: string, abbr: string, emoji: string, isUser: boolean) {
    this.state.currentBid = amount;
    this.state.currentBidderId = teamId;
    this.state.countdown = 12; // Reset timer on bid
    this.bidCount++;

    const entry: BidEntry = {
      id: `${Date.now()}-${Math.random()}`,
      teamId, teamName, teamAbbr: abbr, teamEmoji: emoji,
      amount, timestamp: Date.now(), isUser,
    };
    this.state.bidHistory = [entry, ...this.state.bidHistory.slice(0, 49)];

    this.emit({ type: 'BID_PLACED', teamId, amount, teamName });
  }

  private resolvePlayer() {
    this.clearTimers();
    this.state.phase = 'RESOLVING';
    const player = this.state.currentPlayer!;

    if (!this.state.currentBidderId) {
      this.state.unsoldCount++;
      this.state.phase = 'UNSOLD';
      this.emit({ type: 'PLAYER_UNSOLD', player });
      this.results.push({ player, soldTo: null, soldPrice: 0, wasContested: false, bidCount: this.bidCount });

      setTimeout(() => {
        this.state.currentIndex++;
        this.loadNextPlayer();
      }, 3000);
    } else {
      const winnerId = this.state.currentBidderId;
      const finalPrice = this.state.currentBid;
      const team = this.teams.find(t => t.id === winnerId)!;
      team.purse = parseFloat((team.purse - finalPrice).toFixed(2));
      
      const updatedPlayer = { ...player, soldPrice: finalPrice, currentTeam: winnerId };
      team.squad.push(updatedPlayer);
      
      this.state.soldCount++;
      this.state.totalValueSold = parseFloat((this.state.totalValueSold + finalPrice).toFixed(2));
      this.state.phase = 'SOLD';
      this.emit({ type: 'PLAYER_SOLD', player: updatedPlayer, teamId: winnerId, price: finalPrice });
      this.results.push({ player: updatedPlayer, soldTo: winnerId, soldPrice: finalPrice, wasContested: this.bidCount > 1, bidCount: this.bidCount });

      setTimeout(() => {
        this.state.currentIndex++;
        this.loadNextPlayer();
      }, 3000);
    }
  }

  private getOverseasCount(team: Team): number {
    return team.squad.filter(p => p.overseas).length;
  }

  destroy() {
    this.clearTimers();
    this.eventHandlers = [];
  }
}
