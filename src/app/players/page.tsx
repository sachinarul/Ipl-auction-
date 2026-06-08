'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { PLAYER_DB } from '@/lib/players-db';
import { PlayerRole } from '@/types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

type FilterType = 'ALL' | PlayerRole;
type SortKey = 'name' | 'overall' | 'basePrice' | 'age';
type SortOrder = 'asc' | 'desc';

export default function PlayerDatabase() {
  const { teams, currentPlayer } = useAuctionStore();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterType>('ALL');
  const [cappedFilter, setCappedFilter] = useState<'ALL' | 'CAPPED' | 'UNCAPPED'>('ALL');
  const [overseasFilter, setOverseasFilter] = useState<'ALL' | 'DOMESTIC' | 'OVERSEAS'>('ALL');
  
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Map database players to their live sold details
  const soldPlayersMap = new Map<number, { soldPrice: number; currentTeam: string }>();
  teams.forEach((t) => {
    t.squad.forEach((p) => {
      soldPlayersMap.set(p.id, { soldPrice: p.soldPrice || 0, currentTeam: t.id });
    });
  });

  const activePool = PLAYER_DB.map((p) => {
    const soldInfo = soldPlayersMap.get(p.id);
    if (soldInfo) {
      return { ...p, soldPrice: soldInfo.soldPrice, currentTeam: soldInfo.currentTeam as any };
    }
    return p;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredPlayers = activePool
    .filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            player.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || player.role === roleFilter;
      const matchesCapped = cappedFilter === 'ALL' ||
                           (cappedFilter === 'CAPPED' && player.capped) ||
                           (cappedFilter === 'UNCAPPED' && !player.capped);
      const matchesOverseas = overseasFilter === 'ALL' ||
                             (overseasFilter === 'OVERSEAS' && player.overseas) ||
                             (overseasFilter === 'DOMESTIC' && !player.overseas);
      return matchesSearch && matchesRole && matchesCapped && matchesOverseas;
    })
    .sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const getTeamBadge = (teamId: string | null) => {
    if (!teamId) return null;
    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;
    return (
      <span
        style={{
          borderColor: `${team.primaryColor}50`,
          color: team.primaryColor,
          background: `${team.primaryColor}10`,
        }}
        className="px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ml-2"
      >
        {team.emoji} {team.abbr}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 space-y-6">
        
        {/* Page title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
            IPL 2025 Player Database
          </h1>
          <p className="text-xs sm:text-sm text-av-muted font-semibold mt-1">
            Browse rating matrices, overseas classifications, base values, and real-time simulator status for {activePool.length} players.
          </p>
        </div>

        {/* Filter Toolbar Dashboard */}
        <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-av-muted" />
            <input
              type="text"
              placeholder="Search by name, country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-void border border-border-custom hover:border-white/15 focus:border-neon-gold text-xs text-white pl-9 pr-4 py-3 rounded-xl transition-all duration-300 focus:outline-none"
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as FilterType)}
              className="w-full bg-void border border-border-custom text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-neon-gold cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="BAT">Batsmen (BAT)</option>
              <option value="BOWL">Bowlers (BOWL)</option>
              <option value="AR">All-rounders (AR)</option>
              <option value="WK">Wicketkeepers (WK)</option>
            </select>
          </div>

          {/* Capped Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Capped Class</label>
            <select
              value={cappedFilter}
              onChange={(e) => setCappedFilter(e.target.value as any)}
              className="w-full bg-void border border-border-custom text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-neon-gold cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="CAPPED">Capped (International)</option>
              <option value="UNCAPPED">Uncapped (Domestic)</option>
            </select>
          </div>

          {/* Overseas Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Origin</label>
            <select
              value={overseasFilter}
              onChange={(e) => setOverseasFilter(e.target.value as any)}
              className="w-full bg-void border border-border-custom text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-neon-gold cursor-pointer"
            >
              <option value="ALL">All Origins</option>
              <option value="DOMESTIC">Domestic (Indian)</option>
              <option value="OVERSEAS">Overseas (Foreign)</option>
            </select>
          </div>

        </div>

        {/* Database List / Table */}
        <div className="glass-panel rounded-2xl p-6">
          {filteredPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border-custom text-xs uppercase text-av-muted font-bold tracking-wider select-none">
                    
                    <th className="pb-3 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                      <div className="flex items-center space-x-1">
                        <span>Player</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>

                    <th className="pb-3 font-semibold text-center">Role</th>
                    
                    <th className="pb-3 font-semibold text-center cursor-pointer hover:text-white" onClick={() => handleSort('age')}>
                      <div className="flex items-center justify-center space-x-1">
                        <span>Age</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>

                    <th className="pb-3 font-semibold text-center cursor-pointer hover:text-white" onClick={() => handleSort('overall')}>
                      <div className="flex items-center justify-center space-x-1">
                        <span>OVR</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>

                    <th className="pb-3 font-semibold text-center cursor-pointer hover:text-white" onClick={() => handleSort('basePrice')}>
                      <div className="flex items-center justify-center space-x-1">
                        <span>Base Price</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>

                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-white/2 transition-colors duration-200">
                      <td className="py-3 font-bold text-white flex items-center space-x-2">
                        <span>{player.flag}</span>
                        <span className="uppercase tracking-wide">{player.name}</span>
                        {player.overseas && (
                          <span className="text-[9px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase">
                            OS
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          player.role === 'BAT' ? 'bg-neon-cyan/10 text-neon-cyan' :
                          player.role === 'BOWL' ? 'bg-neon-red/10 text-neon-red' :
                          player.role === 'WK' ? 'bg-neon-gold/10 text-neon-gold' :
                          'bg-neon-purple/10 text-neon-purple'
                        }`}>
                          {player.role}
                        </span>
                      </td>
                      <td className="py-3 text-center font-medium text-white">{player.age}</td>
                      <td className="py-3 text-center font-bold text-neon-gold">{player.overall}</td>
                      <td className="py-3 text-center font-semibold text-white">₹{player.basePrice.toFixed(2)}Cr</td>
                      <td className="py-3 text-right">
                        {player.soldPrice ? (
                          <div className="flex items-center justify-end">
                            <span className="font-extrabold text-neon-green">
                              ₹{player.soldPrice.toFixed(2)}Cr
                            </span>
                            {getTeamBadge(player.currentTeam)}
                          </div>
                        ) : player.currentTeam === null && currentPlayer && player.id < currentPlayer.id ? (
                          <span className="text-xs font-bold text-neon-red">UNSOLD</span>
                        ) : (
                          <span className="text-xs text-av-muted font-bold">AVAILABLE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-glass flex items-center justify-center border border-border-custom">
                <User className="h-6 w-6 text-av-muted" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Players Found</h3>
                <p className="text-xs text-av-muted mt-1 max-w-xs">
                  No players matched the search criteria and filter variables. Try clearing filters.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
