'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuctionStore } from '@/store/auctionStore';
import { Trophy, Home, BarChart3, Database, ShieldAlert, Zap, Menu, X, Users } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { userTeamId, teams } = useAuctionStore();
  const [isOpen, setIsOpen] = useState(false);

  const userTeam = teams.find((t) => t.id === userTeamId);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Auction Arena', href: '/auction', icon: Zap },
    { label: 'Lineup Builder', href: '/lineup', icon: Users },
    { label: 'Franchise HQ', href: '/hq', icon: ShieldAlert },
    { label: 'Player Database', href: '/players', icon: Database },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Hall of Fame', href: '/hall-of-fame', icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/8 bg-midnight/90 backdrop-blur-xl">
      {/* Top scan line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-gold/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Zap className="h-7 w-7 text-neon-gold fill-neon-gold/30 transition-all duration-300 group-hover:fill-neon-gold/60 group-hover:drop-shadow-[0_0_8px_rgba(245,197,24,0.8)]" />
                <div className="absolute inset-0 bg-neon-gold/20 rounded-full blur-md group-hover:bg-neon-gold/40 transition-all duration-300" />
              </div>
              <span className="text-xl font-extrabold tracking-widest text-white font-barlow group-hover:text-neon-gold transition-colors duration-300" style={{ textShadow: '0 0 20px rgba(245,197,24,0.2)' }}>
                AUCTION<span className="text-neon-gold" style={{ textShadow: '0 0 15px rgba(245,197,24,0.6)' }}>VERSE</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:block ml-10">
              <div className="flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 group ${
                        isActive
                          ? 'text-neon-gold bg-neon-gold/8 border border-neon-gold/20'
                          : 'text-av-muted hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 transition-all duration-300 ${isActive ? 'text-neon-gold' : 'group-hover:text-neon-gold'}`} />
                      <span>{item.label}</span>
                      {/* Active animated underline */}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-neon-gold/0 via-neon-gold to-neon-gold/0 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Team badge + Mobile menu */}
          <div className="flex items-center space-x-3">
            {userTeam ? (
              <div
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 cursor-default"
                style={{
                  borderColor: `${userTeam.primaryColor}60`,
                  background: `${userTeam.primaryColor}12`,
                  color: userTeam.primaryColor,
                  boxShadow: `0 0 14px ${userTeam.primaryColor}20`,
                }}
              >
                <span className="text-base">{userTeam.emoji}</span>
                <span className="tracking-wider uppercase font-barlow">{userTeam.abbr} Owner</span>
                <span className="h-2 w-2 rounded-full bg-neon-green animate-ping" style={{ boxShadow: '0 0 6px rgba(0,255,136,0.8)' }} />
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/3 text-[10px] text-av-muted font-bold uppercase tracking-widest">
                <span>Select Team</span>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-av-muted hover:text-neon-gold p-2 rounded-lg focus:outline-none transition-colors cursor-pointer border border-white/8 hover:border-neon-gold/30"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-white/8 bg-void/98 backdrop-blur-xl py-4 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  isActive
                    ? 'bg-neon-gold/10 border border-neon-gold/25 text-neon-gold'
                    : 'text-av-muted hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-neon-gold' : ''}`} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-gold animate-pulse" />}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
