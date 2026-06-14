'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Shield, Award, Landmark, UserCheck } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

interface Legend {
  id: number;
  name: string;
  country: string;
  flag: string;
  role: string;
  overall: number;
  description: string;
  stats: Record<string, string>;
  imageEmoji: string;
}

const HISTORIC_BUYS = [
  { player: 'Mitchell Starc', year: 2024, team: 'KKR', price: 24.75, status: 'Record Buy' },
  { player: 'Pat Cummins', year: 2024, team: 'SRH', price: 20.50, status: 'World Cup Winner' },
  { player: 'Sam Curran', year: 2023, team: 'PBKS', price: 18.50, status: 'MVP Sign' },
  { player: 'Cameron Green', year: 2023, team: 'MI', price: 17.50, status: 'Young Star' },
  { player: 'Chris Morris', year: 2021, team: 'RR', price: 16.25, status: 'Death Bowler' },
];

const LEGENDS: Legend[] = [
  {
    id: 1,
    name: 'MS Dhoni',
    country: 'India',
    flag: '🇮🇳',
    role: 'WK-Batsman',
    overall: 96,
    description: 'Thala. 5-time IPL winning Captain and the greatest finisher in limited-overs cricket history. Famous for his lightning-fast stumpings and cool temperament.',
    stats: { Trophies: '5', Matches: '264', Runs: '5,243', 'Strike Rate': '137.5' },
    imageEmoji: '🧤',
  },
  {
    id: 2,
    name: 'Sachin Tendulkar',
    country: 'India',
    flag: '🇮🇳',
    role: 'Batsman',
    overall: 95,
    description: 'The God of Cricket. Led Mumbai Indians in the early seasons and won the Orange Cap in 2010. Masterful technique, icon of the tournament.',
    stats: { 'Orange Caps': '1', Matches: '78', Runs: '2,334', Average: '34.8' },
    imageEmoji: '🏏',
  },
  {
    id: 3,
    name: 'AB de Villiers',
    country: 'South Africa',
    flag: '🇿🇦',
    role: 'Batsman',
    overall: 97,
    description: 'Mr. 360. Redefined batting with his ability to hit any ball to any part of the stadium. Formed a legendary batting partnership with Virat Kohli at RCB.',
    stats: { Centuries: '3', Matches: '184', Runs: '5,162', 'Strike Rate': '151.7' },
    imageEmoji: '👽',
  },
  {
    id: 4,
    name: 'Lasith Malinga',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    role: 'Bowler',
    overall: 98,
    description: 'The King of Sling. Noted for his round-arm action, pinpoint toe-crushing yorkers, and slower balls. One of the highest wicket-takers in IPL history.',
    stats: { Wickets: '170', Matches: '122', Average: '19.8', Economy: '7.14' },
    imageEmoji: '🦁',
  },
];

export default function HallOfFame() {
  const [activeTab, setActiveTab] = useState<'LEGENDS' | 'RECORDS'>('LEGENDS');

  return (
    <div className="min-h-screen flex flex-col relative bg-midnight text-av-text bg-grid-pattern overflow-hidden">
      {/* Ambient background glows using performant CSS radial gradients */}
      <div 
        className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] pointer-events-none z-0 opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(180, 79, 255, 0.08) 0%, rgba(180, 79, 255, 0) 70%)'
        }}
      />
      <div 
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] pointer-events-none z-0 opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, rgba(0, 212, 255, 0) 70%)'
        }}
      />

      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 space-y-8">
        
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
            Hall Of Fame
          </h1>
          <p className="text-xs sm:text-sm text-av-muted font-semibold mt-1">
            Honoring IPL auction legends, record-breaking marquee signings, and historical tournament stats.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border-custom max-w-md w-full">
          <button
            onClick={() => setActiveTab('LEGENDS')}
            className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider text-center border-b-2 transition-all duration-300 ${
              activeTab === 'LEGENDS'
                ? 'border-neon-gold text-neon-gold'
                : 'border-transparent text-av-muted hover:text-white'
            }`}
          >
            Legends Pool
          </button>
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider text-center border-b-2 transition-all duration-300 ${
              activeTab === 'RECORDS'
                ? 'border-neon-gold text-neon-gold'
                : 'border-transparent text-av-muted hover:text-white'
            }`}
          >
            Historic Bids
          </button>
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'LEGENDS' ? (
            <motion.div
              key="legends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {LEGENDS.map((legend) => (
                <div key={legend.id} className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                  
                  {/* Backdrop glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-neon-gold/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Profile Graphic */}
                  <div className="w-20 h-20 rounded-full bg-void border border-neon-gold/30 flex items-center justify-center text-4xl shrink-0 mx-auto sm:mx-0 neon-glow-gold relative">
                    <span>{legend.imageEmoji}</span>
                    <Star className="h-4 w-4 fill-neon-gold text-neon-gold absolute -bottom-1 -right-1" />
                  </div>

                  {/* Profile info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 justify-center sm:justify-start">
                        <span>{legend.flag}</span>
                        <span className="text-xs uppercase text-av-muted font-bold tracking-wider">
                          {legend.country} • {legend.role}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-wide">
                          {legend.name}
                        </h3>
                        <span className="text-lg font-black text-neon-gold bg-neon-gold/10 px-2.5 py-0.5 rounded border border-neon-gold/20">
                          {legend.overall} OVR
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-av-muted leading-relaxed">
                      {legend.description}
                    </p>

                    {/* Mini ratings table */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-void/50 border border-white/5 p-3 rounded-xl">
                      {Object.entries(legend.stats).map(([label, val]) => (
                        <div key={label} className="text-center">
                          <span className="text-[9px] text-av-muted uppercase block font-bold tracking-wider">{label}</span>
                          <span className="text-xs font-black text-white mt-0.5 block">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Leaderboard panel */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-neon-gold" />
                  <span>All-Time Most Expensive IPL Auction Buys</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom text-xs uppercase text-av-muted font-bold tracking-wider">
                        <th className="pb-3 font-semibold">Rank</th>
                        <th className="pb-3 font-semibold">Player</th>
                        <th className="pb-3 font-semibold text-center">Year</th>
                        <th className="pb-3 font-semibold text-center">Franchise</th>
                        <th className="pb-3 font-semibold text-center">Status</th>
                        <th className="pb-3 font-semibold text-right">Fee (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom/50">
                      {HISTORIC_BUYS.map((buy, idx) => (
                        <tr key={idx} className="hover:bg-white/2 transition-colors duration-200">
                          <td className="py-3.5 font-extrabold text-neon-gold">#{idx + 1}</td>
                          <td className="py-3.5 font-black text-white uppercase tracking-wide">{buy.player}</td>
                          <td className="py-3.5 text-center font-medium text-white">{buy.year}</td>
                          <td className="py-3.5 text-center font-bold text-neon-cyan">{buy.team}</td>
                          <td className="py-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-glass border border-border-custom font-extrabold text-av-muted uppercase tracking-wider">
                              {buy.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-black text-neon-green">₹{buy.price.toFixed(2)} Cr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tournament Record highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
                  <Landmark className="h-6 w-6 text-neon-gold" />
                  <h4 className="text-xs uppercase font-extrabold text-av-muted tracking-wider">Highest Franchise Total</h4>
                  <div className="text-lg font-black text-white uppercase">287/3 — SRH vs RCB</div>
                  <p className="text-[10px] text-av-muted">Set in 2024 at M. Chinnaswamy Stadium, Bengaluru.</p>
                </div>
                
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
                  <Shield className="h-6 w-6 text-neon-cyan" />
                  <h4 className="text-xs uppercase font-extrabold text-av-muted tracking-wider">Most IPL Titles</h4>
                  <div className="text-lg font-black text-white uppercase">5 Trophies — CSK & MI</div>
                  <p className="text-[10px] text-av-muted">Joint-record holders for tournament dominance.</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
                  <UserCheck className="h-6 w-6 text-neon-green" />
                  <h4 className="text-xs uppercase font-extrabold text-av-muted tracking-wider">Fastest IPL Fifty</h4>
                  <div className="text-lg font-black text-white uppercase">13 Balls — Y. Jaiswal</div>
                  <p className="text-[10px] text-av-muted">Set in 2023 playing for Rajasthan Royals vs KKR.</p>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
