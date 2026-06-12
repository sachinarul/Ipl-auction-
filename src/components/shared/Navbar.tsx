'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuctionStore } from '@/store/auctionStore';
import { Trophy, Home, BarChart3, Database, ShieldAlert, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { userTeamId, teams } = useAuctionStore();
  const [isOpen, setIsOpen] = useState(false);

  const userTeam = teams.find((t) => t.id === userTeamId);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Auction Arena', href: '/auction', icon: Zap },
    { label: 'Franchise HQ', href: '/hq', icon: ShieldAlert },
    { label: 'Player Database', href: '/players', icon: Database },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Hall of Fame', href: '/hall-of-fame', icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border-custom bg-midnight/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-extrabold tracking-wider text-neon-gold">
              <Zap className="h-6 w-6 text-neon-gold fill-neon-gold/20 animate-pulse" />
              <span>AUCTIONVERSE</span>
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-glass border border-white/10 text-neon-gold neon-glow-gold'
                          : 'text-av-muted hover:text-av-text hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userTeam ? (
              <div
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-300"
                style={{
                  borderColor: userTeam.primaryColor,
                  background: `${userTeam.primaryColor}15`,
                  color: userTeam.primaryColor,
                  boxShadow: `0 0 10px ${userTeam.primaryColor}20`,
                }}
              >
                <span>{userTeam.emoji}</span>
                <span className="font-bold">{userTeam.abbr} Owner</span>
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-ping" />
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-border-custom bg-glass text-xs text-av-muted">
                <span>Select Team on Lobby</span>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-av-muted hover:text-white p-2 rounded-lg focus:outline-none transition-colors cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border-custom bg-void py-3 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-glass border border-white/10 text-neon-gold neon-glow-gold'
                    : 'text-av-muted hover:text-av-text hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
