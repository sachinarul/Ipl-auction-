'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { PlayerRole } from '@/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, User, Users, Landmark, Coins, Award, Sparkles, CheckCircle } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function FranchiseHQ() {
  const router = useRouter();
  const { userTeamId, teams } = useAuctionStore();
  const [roleFilter, setRoleFilter] = useState<'ALL' | PlayerRole>('ALL');

  // Redirect if no team selected
  useEffect(() => {
    if (!userTeamId) {
      router.push('/');
    }
  }, [userTeamId, router]);

  if (!userTeamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight text-av-text">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-sm">
          <ShieldAlert className="h-12 w-12 text-neon-gold mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">Lobby Team Required</h2>
          <p className="text-sm text-av-muted mb-6">Select your franchise team in the lobby before viewing headquarters.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-neon-gold text-midnight py-2.5 rounded-lg font-bold flex items-center justify-center space-x-2"
          >
            <span>Go to Lobby</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const userTeam = teams.find((t) => t.id === userTeamId);
  const squad = userTeam ? userTeam.squad : [];

  const filteredSquad = squad.filter((player) => {
    if (roleFilter === 'ALL') return true;
    return player.role === roleFilter;
  });

  const purse = userTeam ? userTeam.purse : 120.0;
  const totalSpent = 120.0 - purse;
  const overseasCount = squad.filter((p) => p.overseas).length;
  const battingOVR = squad.length > 0 ? Math.round(squad.reduce((sum, p) => sum + p.batting, 0) / squad.length) : 0;
  const bowlingOVR = squad.length > 0 ? Math.round(squad.reduce((sum, p) => sum + p.bowling, 0) / squad.length) : 0;

  // Squad Requirements Calculations (BCCI Mega Auction rules)
  const wkCount = squad.filter(p => p.role === 'WK').length;
  const batCount = squad.filter(p => p.role === 'BAT').length;
  const bowlCount = squad.filter(p => p.role === 'BOWL').length;
  const arCount = squad.filter(p => p.role === 'AR').length;

  const requirements = [
    { label: 'Wicketkeeper (WK)', current: wkCount, target: 1, color: 'text-neon-gold' },
    { label: 'Batsmen (BAT)', current: batCount, target: 5, color: 'text-neon-cyan' },
    { label: 'Bowlers (BOWL)', current: bowlCount, target: 5, color: 'text-neon-red' },
    { label: 'All Rounders (AR)', current: arCount, target: 2, color: 'text-neon-purple' },
  ];

  // Dynamic recommendations builder
  const getAIRecommendations = () => {
    const list = [];
    if (wkCount < 1) {
      list.push("Priority: Acquire a high-OVR Wicketkeeper (WK). Your squad currently has no gloves.");
    }
    if (batCount < 5) {
      list.push(`Need ${5 - batCount} more Batsmen to build top-order batting depth.`);
    }
    if (bowlCount < 5) {
      list.push(`Need ${5 - bowlCount} more Bowlers to satisfy bowling quotas.`);
    }
    if (arCount < 2) {
      list.push(`Need ${2 - arCount} All-Rounders to balance team chemistry.`);
    }
    if (overseasCount >= 8) {
      list.push("Overseas limit reached (8 max). Target capped Indian domestic players.");
    } else if (overseasCount < 4 && squad.length > 10) {
      list.push("Tip: Bidding on overseas fast bowlers or finishers will expand your overseas stars.");
    }

    if (list.length === 0) {
      list.push("Squad meets all minimum BCCI draft quotas! Focus on strategic upgrades with remaining capital.");
    }
    return list;
  };

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 space-y-8">
        
        {/* HQ Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderColor: `${userTeam?.primaryColor || '#ffffff'}30`,
            background: `linear-gradient(135deg, ${userTeam?.primaryColor || '#ffffff'}10 0%, #080714 100%)`,
          }}
          className="glass-panel border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <div className="flex items-center space-x-4">
            <span className="text-5xl sm:text-6xl">{userTeam?.emoji || '💛'}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                {userTeam?.name || 'Franchise Headquarters'}
              </h1>
              <p className="text-sm text-av-muted font-semibold mt-1">
                Franchise Strategy:{' '}
                <span className="text-neon-gold uppercase font-bold">{userTeam?.strategy || 'balanced'} AI core</span>
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-center">
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold tracking-wider block">Remaining Purse</span>
              <span className="text-xl sm:text-2xl font-black text-neon-green mt-0.5 block">
                ₹{purse.toFixed(2)} Cr
              </span>
            </div>
            <div className="w-px bg-border-custom self-stretch" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold tracking-wider block">Squad Strength</span>
              <span className="text-xl sm:text-2xl font-black text-neon-cyan mt-0.5 block">
                {squad.length} / 25
              </span>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Engine alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Squad Requirement tracker (col-span-6) */}
          <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Users className="h-5 w-5 text-neon-cyan" />
              <span>BCCI Squad Requirements Check</span>
            </h3>

            <div className="space-y-3">
              {requirements.map((req) => {
                const percent = Math.min(100, (req.current / req.target) * 100);
                const isMet = req.current >= req.target;
                return (
                  <div key={req.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-av-text">{req.label}</span>
                      <span className="text-av-muted">
                        <span className={req.color}>{req.current}</span> / {req.target} {isMet && '✅'}
                      </span>
                    </div>
                    <div className="w-full bg-void h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isMet ? 'bg-neon-green' : 'bg-neon-gold'}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Advisor alerts (col-span-6) */}
          <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-neon-gold" />
              <span>Franchise AI Advisor</span>
            </h3>

            <div className="space-y-2">
              {getAIRecommendations().map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-av-muted bg-void/30 p-2.5 rounded-xl border border-white/5">
                  <CheckCircle className="h-4 w-4 text-neon-gold shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Squad Performance KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <Coins className="h-5 w-5 text-neon-gold shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Total Spent</span>
              <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                ₹{totalSpent.toFixed(2)} Cr
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <Users className="h-5 w-5 text-neon-cyan shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Overseas Slots</span>
              <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                {overseasCount} / 8 Limit
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <Award className="h-5 w-5 text-neon-green shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Squad Batting Rating</span>
              <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                {battingOVR} / 99
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <Award className="h-5 w-5 text-neon-red shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Squad Bowling Rating</span>
              <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                {bowlingOVR} / 99
              </span>
            </div>
          </div>
        </div>

        {/* Roster & Squad details table */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              Franchise Squad Roster
            </h2>
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                    roleFilter === role
                      ? 'bg-neon-gold text-midnight neon-glow-gold'
                      : 'border border-border-custom bg-glass text-av-muted hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {filteredSquad.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border-custom text-xs uppercase text-av-muted font-bold tracking-wider">
                    <th className="pb-3 font-semibold">Player</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold text-center">OVR</th>
                    <th className="pb-3 font-semibold text-center">Batting</th>
                    <th className="pb-3 font-semibold text-center">Bowling</th>
                    <th className="pb-3 font-semibold text-right">Sold Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50">
                  {filteredSquad.map((player) => (
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
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          player.role === 'BAT' ? 'bg-neon-cyan/10 text-neon-cyan' :
                          player.role === 'BOWL' ? 'bg-neon-red/10 text-neon-red' :
                          player.role === 'WK' ? 'bg-neon-gold/10 text-neon-gold' :
                          'bg-neon-purple/10 text-neon-purple'
                        }`}>
                          {player.role}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-neon-gold">{player.overall}</td>
                      <td className="py-3 text-center">{player.batting}</td>
                      <td className="py-3 text-center">{player.bowling}</td>
                      <td className="py-3 text-right font-extrabold text-neon-green">
                        ₹{player.soldPrice?.toFixed(2)} Cr
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
                  {roleFilter === 'ALL'
                    ? 'Your squad is currently empty. Go to the Auction Arena to purchase players.'
                    : `No players match the ${roleFilter} role filter.`}
                </p>
              </div>
              {roleFilter === 'ALL' && (
                <button
                  onClick={() => router.push('/auction')}
                  className="bg-neon-gold text-midnight px-4 py-2 rounded-lg font-bold text-xs"
                >
                  Enter Arena
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
