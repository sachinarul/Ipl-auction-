import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, ShieldAlert, Award, Calendar, DollarSign } from 'lucide-react';
import { Player, Team, TeamId } from '@/types';
import { formatCr } from '@/engine/BidIncrement';

interface AuctionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Player[];
  currentIndex: number;
  teams: Team[];
  isAdmin?: boolean;
  onReintroduce?: (playerId: number) => void;
}

type TabType = 'UPCOMING' | 'SOLD' | 'UNSOLD' | 'FRANCHISES' | 'ANALYTICS';

export default function AuctionStatsModal({
  isOpen,
  onClose,
  pool,
  currentIndex,
  teams,
  isAdmin = false,
  onReintroduce,
}: AuctionStatsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('UPCOMING');

  if (!isOpen) return null;

  // Filter lists
  const upcomingPlayers = pool.slice(currentIndex).filter(p => !p.soldPrice && !p.currentTeam);
  
  // Sold players from actual teams squads
  const soldPlayers = teams.flatMap(t => 
    t.squad.map(p => ({
      ...p,
      acquiringTeam: t
    }))
  ).sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));

  // Unsold players (players before currentIndex that did not get sold)
  const unsoldPlayers = pool.slice(0, currentIndex).filter(p => p.soldPrice === null && p.currentTeam === null);

  // Group upcoming players into Sets / Slots
  const getPlayerSets = () => {
    const sets: { name: string; players: Player[]; priceLabel: string }[] = [
      { name: 'Marquee Set 1', players: [], priceLabel: '₹2.00 Cr' },
      { name: 'Set 1 (₹2 Crore Capped)', players: [], priceLabel: '₹2.00 Cr' },
      { name: 'Set 2 (₹1.50 Crore Capped)', players: [], priceLabel: '₹1.50 Cr' },
      { name: 'Set 3 (₹1.25 Cr / ₹1.00 Cr)', players: [], priceLabel: '₹1.00 Cr - ₹1.25 Cr' },
      { name: 'Set 4 (₹75 Lakh Capped)', players: [], priceLabel: '₹75 L' },
      { name: 'Set 5 (₹50 Lakh Uncapped)', players: [], priceLabel: '₹50 L' },
      { name: 'Set 6 (₹40 Lakh Uncapped)', players: [], priceLabel: '₹40 L' },
      { name: 'Set 7 (₹30 Lakh Uncapped)', players: [], priceLabel: '₹30 L' },
    ];

    upcomingPlayers.forEach(p => {
      if (p.category === 'Marquee Players') {
        sets[0].players.push(p);
      } else if (p.basePrice === 2.00) {
        sets[1].players.push(p);
      } else if (p.basePrice === 1.50) {
        sets[2].players.push(p);
      } else if (p.basePrice === 1.25 || p.basePrice === 1.00) {
        sets[3].players.push(p);
      } else if (p.basePrice === 0.75) {
        sets[4].players.push(p);
      } else if (p.basePrice === 0.50) {
        sets[5].players.push(p);
      } else if (p.basePrice === 0.40) {
        sets[6].players.push(p);
      } else if (p.basePrice === 0.30) {
        sets[7].players.push(p);
      }
    });

    return sets.filter(s => s.players.length > 0);
  };

  const setsList = getPlayerSets();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'BAT': return 'Batsman';
      case 'BOWL': return 'Bowler';
      case 'AR': return 'All Rounder';
      case 'WK': return 'Wicket Keeper';
      default: return role;
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'BAT': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20';
      case 'BOWL': return 'bg-neon-red/10 text-neon-red border-neon-red/20';
      case 'AR': return 'bg-neon-purple/10 text-neon-purple border-neon-purple/20';
      case 'WK': return 'bg-neon-gold/10 text-neon-gold border-neon-gold/20';
      default: return 'bg-white/5 text-av-muted';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl h-[85vh] glass-panel border border-white/10 rounded-2xl flex flex-col overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-custom flex justify-between items-center bg-void/50 shrink-0">
          <div className="flex items-center space-x-3">
            <Trophy className="h-5 w-5 text-neon-gold" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">IPL Auction Command Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-glass border border-border-custom hover:bg-glass-hover text-av-muted hover:text-white transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border-custom bg-void/20 text-xs font-bold uppercase tracking-wider shrink-0 select-none overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            { id: 'UPCOMING', label: `Upcoming (${upcomingPlayers.length})` },
            { id: 'SOLD', label: `Sold (${soldPlayers.length})` },
            { id: 'UNSOLD', label: `Unsold (${unsoldPlayers.length})` },
            { id: 'FRANCHISES', label: 'Leaderboard' },
            { id: 'ANALYTICS', label: 'Analytics 📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-3.5 px-4 text-center border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-neon-gold text-neon-gold bg-white/2'
                  : 'border-transparent text-av-muted hover:text-white hover:bg-white/1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* 1. UPCOMING TAB */}
            {activeTab === 'UPCOMING' && (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-8"
              >
                {setsList.length > 0 ? (
                  setsList.map((set, setIdx) => (
                    <div key={setIdx} className="space-y-4">
                      {/* Set Title */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-black uppercase text-neon-gold tracking-widest bg-neon-gold/5 px-3 py-1 rounded border border-neon-gold/15">
                          {set.name}
                        </span>
                        <span className="text-[10px] text-av-muted font-bold uppercase">
                          {set.players.length} players • Base {set.priceLabel}
                        </span>
                      </div>

                      {/* Player List Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {set.players.map(player => (
                          <div
                            key={player.id}
                            className="bg-void/40 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors duration-200"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-base leading-none">{player.flag}</span>
                                <span className="text-xs font-black text-white uppercase truncate max-w-[140px]">
                                  {player.name}
                                </span>
                                {player.overseas && (
                                  <span className="text-[8px] px-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded font-black">
                                    OS
                                  </span>
                                )}
                              </div>
                              <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleClass(player.role)}`}>
                                {getRoleLabel(player.role)}
                              </span>
                            </div>

                            <span className="text-xs font-extrabold text-neon-green bg-neon-green/5 px-2.5 py-1 rounded border border-neon-green/15">
                              {formatCr(player.basePrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-av-muted">
                    <ShieldAlert className="h-10 w-10 text-av-muted mx-auto mb-3" />
                    <p className="text-sm font-semibold">No upcoming players left in the pool.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. SOLD TAB */}
            {activeTab === 'SOLD' && (
              <motion.div
                key="sold"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {soldPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {soldPlayers.map(player => (
                      <div
                        key={player.id}
                        className="bg-void/40 border border-white/5 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-base leading-none">{player.flag}</span>
                            <span className="text-xs font-black text-white uppercase truncate max-w-[140px]">
                              {player.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${getRoleClass(player.role)}`}>
                              {getRoleLabel(player.role)}
                            </span>
                            <span className="text-[9px] text-av-muted">Base: {formatCr(player.basePrice)}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-neon-green bg-neon-green/5 px-2 py-0.5 rounded border border-neon-green/15 block text-center">
                            {formatCr(player.soldPrice || 0)}
                          </span>
                          <span 
                            style={{ color: player.acquiringTeam.primaryColor }}
                            className="text-[9px] font-black uppercase mt-1 block"
                          >
                            {player.acquiringTeam.emoji} {player.acquiringTeam.abbr}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-av-muted">
                    <ShieldAlert className="h-10 w-10 text-av-muted mx-auto mb-3" />
                    <p className="text-sm font-semibold">No players sold yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. UNSOLD TAB */}
            {activeTab === 'UNSOLD' && (
              <motion.div
                key="unsold"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {unsoldPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unsoldPlayers.map(player => {
                      const isAlreadyQueued = pool.slice(currentIndex).some(p => p.id === player.id);
                      return (
                        <div
                          key={player.id}
                          className="bg-void/40 border border-white/5 p-3 rounded-xl flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-base leading-none">{player.flag}</span>
                              <span className="text-xs font-black text-white uppercase truncate max-w-[140px]">
                                {player.name}
                              </span>
                              {player.overseas && (
                                <span className="text-[8px] px-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded font-black">
                                  OS
                                </span>
                              )}
                            </div>
                            <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleClass(player.role)}`}>
                              {getRoleLabel(player.role)}
                            </span>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            {isAdmin ? (
                              isAlreadyQueued ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-neon-gold/15 text-neon-gold border border-neon-gold/20">
                                  Reintroduced
                                </span>
                              ) : (
                                <button
                                  onClick={() => onReintroduce && onReintroduce(player.id)}
                                  className="text-[10px] font-bold bg-neon-gold text-midnight hover:bg-neon-gold/80 px-2 py-1 rounded transition-colors duration-200"
                                >
                                  Reintroduce
                                </button>
                              )
                            ) : (
                              <span className="text-xs font-bold text-neon-red bg-neon-red/5 px-2.5 py-1 rounded border border-neon-red/15">
                                UNSOLD
                              </span>
                            )}
                            <span className="text-[9px] text-av-muted block">Base: {formatCr(player.basePrice)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-av-muted">
                    <ShieldAlert className="h-10 w-10 text-av-muted mx-auto mb-3" />
                    <p className="text-sm font-semibold">No players passed unsold yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. LEADERBOARD TAB */}
            {activeTab === 'FRANCHISES' && (
              <motion.div
                key="franchises"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map(team => {
                    // Find most expensive buy
                    const sortedSquad = [...team.squad].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
                    const topBuy = sortedSquad.length > 0 ? sortedSquad[0] : null;

                    return (
                      <div
                        key={team.id}
                        style={{ borderColor: `${team.primaryColor}20` }}
                        className="bg-void/40 border p-4 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl leading-none shrink-0">{team.emoji}</span>
                            <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">
                              {team.name}
                            </h4>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs font-semibold text-av-muted">
                            <div>
                              <span>Purses: </span>
                              <span className="text-neon-green">₹{team.purse.toFixed(2)} Cr</span>
                            </div>
                            <div>
                              <span>Squad: </span>
                              <span className="text-neon-cyan">{team.squad.length}/25</span>
                            </div>
                          </div>

                          {topBuy && (
                            <p className="text-[10px] text-av-muted truncate">
                              Top Buy: <span className="text-white font-bold">{topBuy.name}</span> (₹{topBuy.soldPrice?.toFixed(2)} Cr)
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span 
                            style={{ backgroundColor: `${team.primaryColor}15`, color: team.primaryColor, borderColor: `${team.primaryColor}25` }}
                            className="text-xs font-black uppercase px-3 py-1.5 rounded-lg border"
                          >
                            {team.abbr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 5. ANALYTICS TAB */}
            {activeTab === 'ANALYTICS' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-6">
                {/* Progress Bar */}
                <div className="bg-void/40 border border-white/5 p-5 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-black text-white uppercase tracking-wider">Auction Progress</span>
                    <span className="text-sm text-neon-gold font-bold">{Math.round((currentIndex / Math.max(1, pool.length)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-void h-3 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-neon-gold to-neon-green transition-all duration-500" style={{ width: `${(currentIndex / Math.max(1, pool.length)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-av-muted mt-2 font-bold">
                    <span>{soldPlayers.length} Sold</span>
                    <span>{pool.length - currentIndex} Remaining</span>
                    <span>{unsoldPlayers.length} Unsold</span>
                  </div>
                </div>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(() => {
                    const maxBid = soldPlayers.length > 0 ? Math.max(...soldPlayers.map(p => p.soldPrice || 0)) : 0;
                    return (
                      <div className="bg-void/40 border border-neon-gold/20 p-4 rounded-xl text-center">
                        <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider mb-1">Highest Bid</div>
                        <div className="text-xl font-black text-neon-gold">{formatCr(maxBid)}</div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const totalVal = parseFloat(soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0).toFixed(2));
                    return (
                      <div className="bg-void/40 border border-neon-green/20 p-4 rounded-xl text-center">
                        <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider mb-1">Total Spent</div>
                        <div className="text-xl font-black text-neon-green">{formatCr(totalVal)}</div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const topPlayer = [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];
                    return (
                      <div className="bg-void/40 border border-neon-cyan/20 p-4 rounded-xl text-center">
                        <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider mb-1">Most Expensive</div>
                        <div className="text-sm font-black text-neon-cyan truncate">{topPlayer ? topPlayer.name : '—'}</div>
                        {topPlayer && <div className="text-xs text-av-muted mt-0.5">{formatCr(topPlayer.soldPrice || 0)}</div>}
                      </div>
                    );
                  })()}
                </div>
                {/* Purse Rankings */}
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Purse Rankings</h3>
                  <div className="space-y-3">
                    {[...teams].sort((a, b) => b.purse - a.purse).map((team, idx) => (
                      <div key={team.id} className="flex items-center gap-3">
                        <span className="text-xs text-av-muted font-bold w-5 text-right">#{idx + 1}</span>
                        <span className="text-xl shrink-0">{team.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white uppercase">{team.abbr}</span>
                            <span className="text-xs font-black" style={{ color: team.primaryColor }}>{formatCr(team.purse)}</span>
                          </div>
                          <div className="w-full bg-void h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(team.purse / 120) * 100}%`, backgroundColor: team.primaryColor }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-av-muted w-12 text-right">{team.squad.length}/25</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Biggest Spender & Richest */}
                {(() => {
                  const biggestSpender = [...teams].sort((a, b) => (120 - b.purse) - (120 - a.purse))[0];
                  const richest = [...teams].sort((a, b) => b.purse - a.purse)[0];
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-void/40 border border-neon-red/20 p-4 rounded-xl">
                        <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider mb-2">Biggest Spender</div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{biggestSpender?.emoji}</span>
                          <div>
                            <div className="text-sm font-black text-white uppercase">{biggestSpender?.name}</div>
                            <div className="text-xs text-neon-red font-bold">Spent {formatCr(parseFloat((120 - (biggestSpender?.purse || 120)).toFixed(2)))}</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-void/40 border border-neon-green/20 p-4 rounded-xl">
                        <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider mb-2">Richest Team</div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{richest?.emoji}</span>
                          <div>
                            <div className="text-sm font-black text-white uppercase">{richest?.name}</div>
                            <div className="text-xs text-neon-green font-bold">{formatCr(richest?.purse || 0)} remaining</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
