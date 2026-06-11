'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { PLAYER_DB } from '@/lib/players-db';
import { PlayerRole } from '@/types';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Trophy, Star, Zap, Shield, Users } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

type FilterType = 'ALL' | PlayerRole;

// Set metadata for icons and accent colors
const SET_META: Record<string, { icon: string; label: string; accent: string; glowColor: string }> = {
  'MARQUEE': { icon: '🏆', label: 'MARQUEE SET',    accent: '#F5C518', glowColor: 'rgba(245,197,24,0.25)' },
  'SET 1':   { icon: '⭐', label: 'SET 1',           accent: '#00D4FF', glowColor: 'rgba(0,212,255,0.20)' },
  'SET 2':   { icon: '💎', label: 'SET 2',           accent: '#B44FFF', glowColor: 'rgba(180,79,255,0.20)' },
  'SET 3':   { icon: '🌟', label: 'SET 3',           accent: '#00FF88', glowColor: 'rgba(0,255,136,0.20)' },
  'SET 4':   { icon: '🔥', label: 'SET 4',           accent: '#FF6B35', glowColor: 'rgba(255,107,53,0.20)' },
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'BAT':  { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'BATSMAN'  },
  'BOWL': { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', label: 'BOWLER'   },
  'AR':   { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', label: 'ALL-ROUNDER' },
  'WK':   { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'WICKET-KEEPER' },
};

const SET_ORDER = ['MARQUEE', 'SET 1', 'SET 2', 'SET 3', 'SET 4'];

export default function PlayerDatabase() {
  const { teams, currentPlayer } = useAuctionStore();

  const [searchTerm, setSearchTerm]       = useState('');
  const [roleFilter, setRoleFilter]       = useState<FilterType>('ALL');
  const [overseasFilter, setOverseasFilter] = useState<'ALL' | 'DOMESTIC' | 'OVERSEAS'>('ALL');
  const [setFilter, setSetFilter]         = useState<string>('ALL');
  const [collapsedSets, setCollapsedSets] = useState<Set<string>>(new Set());

  // Merge live sold info
  const soldPlayersMap = new Map<number, { soldPrice: number; currentTeam: string }>();
  teams.forEach((t) => {
    t.squad.forEach((p) => {
      soldPlayersMap.set(p.id, { soldPrice: p.soldPrice || 0, currentTeam: t.id });
    });
  });

  const activePool = PLAYER_DB.map((p) => {
    const soldInfo = soldPlayersMap.get(p.id);
    return soldInfo ? { ...p, soldPrice: soldInfo.soldPrice, currentTeam: soldInfo.currentTeam as any } : p;
  });

  // Derive unique sets from data (ordered)
  const availableSets = useMemo(() => {
    const inData = new Set(activePool.map((p: any) => p.set || 'MARQUEE'));
    return SET_ORDER.filter((s) => inData.has(s));
  }, [activePool]);

  // Global filter
  const filteredPool = useMemo(() =>
    activePool.filter((player) => {
      const matchesSearch   = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              player.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole     = roleFilter === 'ALL' || player.role === roleFilter;
      const matchesOverseas = overseasFilter === 'ALL' ||
                              (overseasFilter === 'OVERSEAS' && player.overseas) ||
                              (overseasFilter === 'DOMESTIC' && !player.overseas);
      const playerSet       = (player as any).set || 'MARQUEE';
      const matchesSet      = setFilter === 'ALL' || playerSet === setFilter;
      return matchesSearch && matchesRole && matchesOverseas && matchesSet;
    }), [activePool, searchTerm, roleFilter, overseasFilter, setFilter]);

  // Group by set
  const playersBySet = useMemo(() => {
    const grouped: Record<string, typeof filteredPool> = {};
    filteredPool.forEach((p) => {
      const setName = (p as any).set || 'MARQUEE';
      if (!grouped[setName]) grouped[setName] = [];
      grouped[setName].push(p);
    });
    return grouped;
  }, [filteredPool]);

  const toggleSet = (setName: string) => {
    setCollapsedSets((prev) => {
      const next = new Set(prev);
      next.has(setName) ? next.delete(setName) : next.add(setName);
      return next;
    });
  };

  const getTeamBadge = (teamId: string | null) => {
    if (!teamId) return null;
    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;
    return (
      <span style={{ color: team.primaryColor, background: `${team.primaryColor}18`, border: `1px solid ${team.primaryColor}40` }}
        className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ml-1 tracking-wider">
        {team.emoji} {team.abbr}
      </span>
    );
  };

  const setsToShow = setFilter === 'ALL'
    ? availableSets.filter((s) => playersBySet[s]?.length > 0)
    : availableSets.filter((s) => s === setFilter && playersBySet[s]?.length > 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0B12' }}>
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">

        {/* ── PAGE HEADER ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-8"
          style={{ background: 'linear-gradient(135deg, #13111f 0%, #1a1232 50%, #0f1a2e 100%)', border: '1px solid rgba(245,197,24,0.15)' }}>
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', transform: 'translateY(-50%)' }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', transform: 'translateY(40%)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.3)' }}>
                  🏏
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  IPL 2025 Player Database
                </h1>
              </div>
              <p className="text-sm font-medium" style={{ color: '#8B8BA8' }}>
                {activePool.length} players across {availableSets.length} sets — Premium Mega Auction Pool
              </p>
            </div>

            {/* Live stat pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'MARQUEE', val: playersBySet['MARQUEE']?.length || 0, color: '#F5C518' },
                { label: 'TOTAL', val: activePool.length, color: '#00D4FF' },
                { label: 'OVERSEAS', val: activePool.filter(p => p.overseas).length, color: '#B44FFF' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center px-4 py-2 rounded-2xl"
                  style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}25` }}>
                  <span className="text-xl font-black" style={{ color: stat.color }}>{stat.val}</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#8B8BA8' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#6B6B8A' }} />
            <input
              type="text"
              placeholder="Search player or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm text-white pl-10 pr-4 py-3 rounded-xl transition-all duration-200 focus:outline-none placeholder-[#6B6B8A]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#6B6B8A' }}>Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as FilterType)}
              className="text-sm text-white px-3 py-3 rounded-xl focus:outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="ALL">All Roles</option>
              <option value="BAT">Batsmen</option>
              <option value="BOWL">Bowlers</option>
              <option value="AR">All-Rounders</option>
              <option value="WK">Wicketkeepers</option>
            </select>
          </div>

          {/* Origin Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#6B6B8A' }}>Origin</label>
            <select value={overseasFilter} onChange={(e) => setOverseasFilter(e.target.value as any)}
              className="text-sm text-white px-3 py-3 rounded-xl focus:outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="ALL">All Origins</option>
              <option value="DOMESTIC">🇮🇳 Indian</option>
              <option value="OVERSEAS">🌍 Overseas</option>
            </select>
          </div>

          {/* Set Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#6B6B8A' }}>Set</label>
            <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)}
              className="text-sm text-white px-3 py-3 rounded-xl focus:outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="ALL">All Sets</option>
              {availableSets.map((s) => (
                <option key={s} value={s}>{SET_META[s]?.icon || '📦'} {SET_META[s]?.label || s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── SETS + CARDS ────────────────────────────────────────── */}
        {setsToShow.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              🔍
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">No Players Found</h3>
              <p className="text-sm mt-1" style={{ color: '#6B6B8A' }}>Try clearing filters or changing search term.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {setsToShow.map((setName) => {
              const meta      = SET_META[setName] || { icon: '📦', label: setName, accent: '#888', glowColor: 'rgba(136,136,136,0.15)' };
              const players   = playersBySet[setName] || [];
              const collapsed = collapsedSets.has(setName);

              return (
                <section key={setName}>
                  {/* Set Header */}
                  <button
                    onClick={() => toggleSet(setName)}
                    className="w-full flex items-center justify-between px-6 py-4 rounded-2xl mb-5 transition-all duration-200 group"
                    style={{
                      background: `linear-gradient(135deg, ${meta.glowColor}, rgba(255,255,255,0.02))`,
                      border: `1px solid ${meta.accent}30`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Set icon badge */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${meta.accent}18`, border: `1px solid ${meta.accent}35` }}>
                        {meta.icon}
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-black tracking-widest uppercase" style={{ color: meta.accent }}>
                          {meta.label}
                        </h2>
                        <p className="text-xs font-semibold" style={{ color: '#8B8BA8' }}>
                          {players.length} Player{players.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Role breakdown pills */}
                      <div className="hidden sm:flex gap-2">
                        {(['BAT','BOWL','AR','WK'] as const).map((r) => {
                          const cnt = players.filter((p) => p.role === r).length;
                          if (!cnt) return null;
                          const rc = ROLE_COLORS[r];
                          return (
                            <span key={r} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                              style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                              {r} {cnt}
                            </span>
                          );
                        })}
                      </div>
                      {/* Chevron */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={{ background: `${meta.accent}18`, color: meta.accent }}>
                        {collapsed
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronUp className="h-4 w-4" />
                        }
                      </div>
                    </div>
                  </button>

                  {/* Separator line */}
                  <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, ${meta.accent}40, transparent)` }} />

                  {/* Player Cards Grid */}
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.div
                        key={setName + '-grid'}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
                        >
                          {players.map((player, idx) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              idx={idx}
                              setAccent={meta.accent}
                              teamBadge={getTeamBadge(player.currentTeam)}
                              currentPlayer={currentPlayer}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ── PLAYER CARD COMPONENT ────────────────────────────────────────
function PlayerCard({ player, idx, setAccent, teamBadge, currentPlayer }: {
  player: any;
  idx: number;
  setAccent: string;
  teamBadge: React.ReactNode;
  currentPlayer: any;
}) {
  const rc = ROLE_COLORS[player.role] || ROLE_COLORS['BAT'];

  const status = player.soldPrice
    ? 'SOLD'
    : (player.currentTeam === null && currentPlayer && player.id < currentPlayer.id)
    ? 'UNSOLD'
    : 'AVAILABLE';

  const statusStyle = {
    SOLD:      { color: '#00FF88', bg: 'rgba(0,255,136,0.1)',  border: 'rgba(0,255,136,0.25)' },
    UNSOLD:    { color: '#FF3366', bg: 'rgba(255,51,102,0.1)', border: 'rgba(255,51,102,0.25)' },
    AVAILABLE: { color: '#8B8BA8', bg: 'rgba(139,139,168,0.1)', border: 'rgba(139,139,168,0.2)' },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.5) }}
      whileHover={{ scale: 1.03, y: -3 }}
      className="relative flex flex-col rounded-[18px] p-5 cursor-default select-none"
      style={{
        background: '#151515',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        minHeight: '170px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
        (e.currentTarget as HTMLElement).style.borderColor = '#F5C518'; // subtle IPL gold highlight
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = '#151515';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Top row: flag + status + optional globe */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl leading-none">{player.flag}</span>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{ color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
          {status}
        </span>
        {player.overseas && (
          <span className="absolute top-4 right-4 text-xl select-none" title="Overseas Player">🌍</span>
        )}
      </div>

      {/* Player Name */}
      <div className="font-black text-white text-sm leading-snug tracking-wide uppercase mb-3 flex-1">
        {player.name}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {/* Role badge */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg tracking-wider"
          style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
          {rc.label}
        </span>
      </div>

      {/* Bottom row: price + OVR */}
      <div className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#6B6B8A' }}>Base Price</span>
          <span className="text-sm font-black" style={{ color: '#F5C518' }}>
            ₹{player.basePrice >= 1 ? `${player.basePrice.toFixed(2)} Cr` : `${(player.basePrice * 100).toFixed(0)} L`}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#6B6B8A' }}>OVR</span>
          <span className="text-sm font-black" style={{ color: setAccent }}>{player.overall}</span>
        </div>
      </div>

      {/* Sold info */}
      {player.soldPrice > 0 && (
        <div className="flex items-center justify-between mt-2 pt-2"
          style={{ borderTop: '1px solid rgba(0,255,136,0.15)' }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#6B6B8A' }}>Sold For</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black" style={{ color: '#00FF88' }}>
              ₹{player.soldPrice.toFixed(2)} Cr
            </span>
            {teamBadge}
          </div>
        </div>
      )}
    </motion.div>
  );
}
