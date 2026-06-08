'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { TEAMS_DB } from '@/lib/teams-db';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Award } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

// Mock data to display if no live auction data is available yet (Wow factor preview)
const MOCK_SPENDING = [
  { name: 'PBKS', spent: 45.5, purse: 74.5 },
  { name: 'MI', spent: 38.0, purse: 82.0 },
  { name: 'RCB', spent: 54.0, purse: 66.0 },
  { name: 'CSK', spent: 28.5, purse: 91.5 },
  { name: 'KKR', spent: 34.0, purse: 86.0 },
  { name: 'SRH', spent: 48.0, purse: 72.0 },
  { name: 'DC', spent: 22.0, purse: 98.0 },
  { name: 'RR', spent: 31.5, purse: 88.5 },
  { name: 'GT', spent: 18.0, purse: 102.0 },
  { name: 'LSG', spent: 29.0, purse: 91.0 },
];

const MOCK_ROLES = [
  { name: 'Batsmen (BAT)', value: 18, color: '#00d4ff' },
  { name: 'Bowlers (BOWL)', value: 24, color: '#ff3366' },
  { name: 'All-rounders (AR)', value: 15, color: '#b44fff' },
  { name: 'Wicketkeepers (WK)', value: 8, color: '#f5c518' },
];

const MOCK_BUYS = [
  { name: 'Rishabh Pant', role: 'WK', team: 'RCB', price: 21.00, ovr: 92 },
  { name: 'Jasprit Bumrah', role: 'BOWL', team: 'MI', price: 18.00, ovr: 96 },
  { name: 'Shubman Gill', role: 'BAT', team: 'GT', price: 16.50, ovr: 90 },
  { name: 'Travis Head', role: 'BAT', team: 'SRH', price: 15.00, ovr: 94 },
  { name: 'Ravindra Jadeja', role: 'AR', team: 'CSK', price: 14.50, ovr: 92 },
];

export default function AnalyticsDashboard() {
  const { teams } = useAuctionStore();
  const results = teams.flatMap((t) =>
    t.squad.map((p) => ({
      player: p,
      soldTo: t.id,
      soldPrice: p.soldPrice || 0,
    }))
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Extract live metrics if available
  const hasLiveResults = results.length > 0;
  
  const spendingData = hasLiveResults
    ? teams.map((team) => ({
        name: team.abbr,
        spent: parseFloat((120 - team.purse).toFixed(1)),
        purse: parseFloat(team.purse.toFixed(1)),
      }))
    : MOCK_SPENDING;

  const liveRolesMap: Record<string, number> = { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
  if (hasLiveResults) {
    results.forEach((res) => {
      if (res.soldTo) {
        liveRolesMap[res.player.role] = (liveRolesMap[res.player.role] || 0) + 1;
      }
    });
  }

  const rolesData = hasLiveResults
    ? [
        { name: 'Batsmen (BAT)', value: liveRolesMap.BAT, color: '#00d4ff' },
        { name: 'Bowlers (BOWL)', value: liveRolesMap.BOWL, color: '#ff3366' },
        { name: 'All-rounders (AR)', value: liveRolesMap.AR, color: '#b44fff' },
        { name: 'Wicketkeepers (WK)', value: liveRolesMap.WK, color: '#f5c518' },
      ].filter(r => r.value > 0)
    : MOCK_ROLES;

  const topBuys = hasLiveResults
    ? [...results]
        .filter((r) => r.soldTo)
        .sort((a, b) => b.soldPrice - a.soldPrice)
        .slice(0, 5)
        .map((r) => {
          const team = teams.find((t) => t.id === r.soldTo);
          return {
            name: r.player.name,
            role: r.player.role,
            team: team ? team.abbr : 'Unknown',
            price: r.soldPrice,
            ovr: r.player.overall,
          };
        })
    : MOCK_BUYS;

  // Key stats
  const totalSpend = spendingData.reduce((sum, t) => sum + t.spent, 0);
  const avgPlayerPrice = hasLiveResults
    ? parseFloat((totalSpend / results.filter(r => r.soldTo).length).toFixed(2))
    : 16.5;

  const maxBuy = topBuys.length > 0 ? topBuys[0] : null;

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 space-y-8">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
              Auction Analytics
            </h1>
            <p className="text-xs sm:text-sm text-av-muted font-semibold mt-1">
              Visualize franchise spending distributions, acquisition types, and financial summaries.
            </p>
          </div>
          
          {!hasLiveResults && (
            <span className="text-[10px] font-extrabold px-3 py-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/40 rounded-full uppercase tracking-wider animate-pulse">
              Preview Mode (Mock Data)
            </span>
          )}
        </div>

        {/* High-level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-neon-gold shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Total Capital Injected</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                ₹{totalSpend.toFixed(1)} Crore
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-neon-cyan shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Average Acquisition Cost</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                ₹{avgPlayerPrice.toFixed(2)} Crore
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <Award className="h-6 w-6 text-neon-green shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Marquee Acquisition</span>
              <span className="text-lg font-black text-white mt-0.5 block line-clamp-1">
                {maxBuy ? `${maxBuy.name} (${maxBuy.team})` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-neon-purple shrink-0" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold block">Acquisition Value</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {maxBuy ? `₹${maxBuy.price.toFixed(2)} Cr` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Charting Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Franchise Capital Allocation (col-span-8) */}
          <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col justify-between h-[360px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Franchise Budget Allocation (Spent vs Purse)
            </h3>
            
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b6b8a" />
                  <YAxis stroke="#6b6b8a" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--av-void)',
                      border: '1px solid var(--av-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="spent" name="Spent (Cr)" fill="#ff3366" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="purse" name="Remaining (Cr)" fill="#00ff88" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Role Distribution (col-span-4) */}
          <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between h-[360px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Player Role Classification
            </h3>

            <div className="flex-1 w-full flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolesData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--av-void)',
                      border: '1px solid var(--av-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center top-[36%]">
                <span className="text-2xl font-black text-white">
                  {rolesData.reduce((a, b) => a + b.value, 0)}
                </span>
                <span className="text-[9px] text-av-muted uppercase tracking-wider">Sold</span>
              </div>
            </div>

            {/* Custom Legend to fit space */}
            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border-custom pt-3">
              {rolesData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-av-muted truncate font-semibold">
                    {item.name}: <span className="text-white font-bold">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Most Expensive Leaderboard */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
            Marquee Leaderboard — Top 5 Signings
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-custom text-xs uppercase text-av-muted font-bold tracking-wider">
                  <th className="pb-3 font-semibold">Rank</th>
                  <th className="pb-3 font-semibold">Player</th>
                  <th className="pb-3 font-semibold text-center">OVR</th>
                  <th className="pb-3 font-semibold text-center">Role</th>
                  <th className="pb-3 font-semibold text-center">Acquiring Team</th>
                  <th className="pb-3 font-semibold text-right">Fee (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50">
                {topBuys.map((buy, idx) => (
                  <tr key={idx} className="hover:bg-white/2 transition-colors duration-200">
                    <td className="py-3 font-extrabold text-neon-gold">#{idx + 1}</td>
                    <td className="py-3 font-bold text-white uppercase tracking-wide">{buy.name}</td>
                    <td className="py-3 text-center font-bold text-neon-cyan">{buy.ovr}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 font-bold uppercase text-av-muted">
                        {buy.role}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-white">{buy.team}</td>
                    <td className="py-3 text-right font-black text-neon-green">₹{buy.price.toFixed(2)} Cr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
