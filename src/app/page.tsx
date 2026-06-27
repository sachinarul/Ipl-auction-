'use client';

import { useRouter } from 'next/navigation';
import { TEAMS_DB } from '@/lib/teams-db';
import { useAuctionStore } from '@/store/auctionStore';
import { TeamId } from '@/types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Key, Users, Trophy, ArrowRight, ShieldAlert, Cpu, Star, Activity } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function LandingPage() {
  const router = useRouter();
  const {
    roomCode,
    userTeamId,
    userName,
    errorMsg,
    createRoom,
    joinRoom,
    rejoinRoom,
    selectUserTeam,
    setUserName,
    clearError,
    disconnectSocket,
  } = useAuctionStore();

  const [mode, setMode] = useState<'lobby' | 'create' | 'join'>('lobby');
  const [managerName, setManagerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');
  const [enableAITeams, setEnableAITeams] = useState(false);
  const [minPlayersToStart, setMinPlayersToStart] = useState(1);
  const [timerDuration, setTimerDuration] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [justActioned, setJustActioned] = useState(false);
  const [cachedRoomCode, setCachedRoomCode] = useState<string | null>(null);
  const [cachedPlayerToken, setCachedPlayerToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = localStorage.getItem('av_room_code');
      const token = localStorage.getItem('av_player_token');
      if (code && token) {
        setCachedRoomCode(code);
        setCachedPlayerToken(token);
      }
    }
  }, []);

  useEffect(() => {
    if (roomCode && justActioned) {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, justActioned, router]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName.trim() || !roomName.trim() || !userTeamId) return;
    setJustActioned(true);
    createRoom(roomName, managerName, userTeamId, roomType, password, enableAITeams, minPlayersToStart, timerDuration);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    router.push(`/room/${joinCode}`);
  };

  const stats = [
    { label: 'Players', value: '200+', icon: '🏏' },
    { label: 'IPL Teams', value: '10', icon: '🏆' },
    { label: 'Live Bidding', value: 'Real-Time', icon: '⚡' },
    { label: 'AI Rivals', value: '5 Modes', icon: '🤖' },
  ];

  const features = [
    {
      icon: Trophy,
      color: 'var(--av-neon-gold)',
      glow: 'rgba(245,197,24,0.2)',
      title: 'Dynamic Budget Pressure',
      desc: 'Incremental bid scales from ₹5 Lakh up to ₹2 Crore per click as players heat up.',
    },
    {
      icon: Users,
      color: 'var(--av-neon-cyan)',
      glow: 'rgba(0,212,255,0.2)',
      title: 'Realistic AI Managers',
      desc: 'Aggressive, Conservative, Youth-focused, Star-hunters, and Balanced AI personalities.',
    },
    {
      icon: Cpu,
      color: 'var(--av-neon-green)',
      glow: 'rgba(0,255,136,0.2)',
      title: 'Live Squad HQ & Analytics',
      desc: 'Track chemistry, role distribution, and spending curves live as you build your 25-player squad.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-midnight text-av-text overflow-hidden">
      {/* Stadium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        {/* Ambient glows */}
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(180, 79, 255, 0.10) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(0, 212, 255, 0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] animate-float"
          style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.05) 0%, transparent 75%)', willChange: 'transform' }} />
        {/* Spotlight beams */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden">
          <div className="hero-beam" />
          <div className="hero-beam" />
          <div className="hero-beam" />
          <div className="hero-beam" />
        </div>
        {/* Floor reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%]"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(245,197,24,0.015) 100%)' }} />
      </div>

      <Navbar />

      <div className="flex-1 flex flex-col items-center max-w-7xl mx-auto px-4 py-8 w-full z-10">

        {/* ── Hero Section ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-3xl w-full"
        >
          {/* Founder badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-neon-gold/30 bg-neon-gold/8 text-neon-gold font-bold text-[10px] uppercase tracking-widest mb-5"
            style={{ boxShadow: '0 0 20px rgba(245,197,24,0.1)' }}
          >
            <Star className="h-3 w-3 fill-neon-gold" />
            <span>IPL Mega Auction Simulator · Founder: Sachin Arul</span>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight mb-5 font-barlow leading-none">
            <span className="block text-white" style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
              AUCTION
            </span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #f5c518 0%, #ffd700 40%, #e6b800 70%, #f5c518 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 20px rgba(245,197,24,0.4))',
              }}
            >
              VERSE 3.0
            </span>
          </h1>

          {/* Sub label */}
          <p className="text-sm sm:text-base text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            The most premium IPL auction experience. Outbid rivals in real-time, manage a{' '}
            <span className="text-neon-gold font-bold">₹120 Crore</span> budget, and assemble your dream XI.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8 flex-wrap">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex flex-col items-center"
              >
                <span className="text-xl mb-0.5">{s.icon}</span>
                <span className="text-lg font-black text-white font-barlow">{s.value}</span>
                <span className="text-[9px] uppercase tracking-widest text-av-muted font-bold">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* IPL Teams Scrolling Ticker */}
        <div className="w-full mb-10 overflow-hidden">
          <div className="flex gap-3 animate-[tickerScroll_25s_linear_infinite]" style={{ width: 'max-content' }}>
            {[...TEAMS_DB, ...TEAMS_DB].map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider shrink-0"
                style={{
                  borderColor: `${t.primaryColor}30`,
                  background: `${t.primaryColor}08`,
                  color: t.primaryColor,
                }}
              >
                <span className="text-base">{t.emoji}</span>
                <span className="font-barlow">{t.abbr}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="w-full max-w-md p-4 bg-neon-red/10 border border-neon-red/30 text-neon-red text-xs rounded-2xl flex items-center space-x-2 mb-6">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Rejoin Banner ── */}
        {cachedRoomCode && cachedPlayerToken && !roomCode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg p-4 mb-6 border border-neon-gold/30 rounded-2xl flex items-center justify-between gap-4"
            style={{ background: 'rgba(245,197,24,0.04)', boxShadow: '0 0 20px rgba(245,197,24,0.06)' }}
          >
            <div className="flex items-center space-x-3 text-xs">
              <Activity className="h-5 w-5 text-neon-gold shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="font-bold text-white uppercase block text-xs tracking-wider">Unfinished Session</span>
                <span className="text-av-muted">Room: <span className="text-neon-gold font-bold tracking-widest">{cachedRoomCode}</span></span>
              </div>
            </div>
            <button
              onClick={() => {
                setJustActioned(true);
                rejoinRoom(cachedRoomCode, cachedPlayerToken, (res) => {
                  if (!res.success) {
                    localStorage.removeItem('av_room_code');
                    localStorage.removeItem('av_player_token');
                    setCachedRoomCode(null);
                    setCachedPlayerToken(null);
                    alert(`Failed to rejoin: ${res.reason || 'Room not found'}`);
                  }
                });
              }}
              className="bid-button px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0"
            >
              Rejoin
            </button>
          </motion.div>
        )}

        {/* ── Main Action Area ── */}
        <AnimatePresence mode="wait">
          {roomCode && !justActioned ? (
            <motion.div
              key="active-session"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-8 premium-card rounded-3xl text-center space-y-6 my-4"
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center border border-neon-gold/30 mx-auto"
                style={{ background: 'rgba(245,197,24,0.08)', boxShadow: '0 0 20px rgba(245,197,24,0.15)' }}>
                <Shield className="h-7 w-7 text-neon-gold" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider font-barlow">Active Session</h3>
                <p className="text-xs text-av-muted mt-2">
                  You're joined to room <span className="text-neon-gold font-bold tracking-widest">{roomCode}</span>. Rejoin or start fresh.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { disconnectSocket(); clearError(); }}
                  className="flex-1 border border-neon-red/30 hover:border-neon-red/50 bg-neon-red/8 text-neon-red py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                >
                  Leave Room
                </button>
                <button
                  type="button"
                  onClick={() => setJustActioned(true)}
                  className="bid-button flex-1 py-3 rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer"
                >
                  Rejoin Room
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {mode === 'lobby' && (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl justify-center items-center my-4"
                >
                  {/* Create Room Card */}
                  <button
                    onClick={() => { setMode('create'); clearError(); }}
                    className="w-full max-w-xs p-8 premium-card rounded-3xl text-center flex flex-col items-center gap-5 cursor-pointer group"
                  >
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: 'rgba(245,197,24,0.08)',
                        borderColor: 'rgba(245,197,24,0.25)',
                        boxShadow: '0 0 0 rgba(245,197,24,0)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(245,197,24,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <Shield className="h-8 w-8 text-neon-gold" style={{ filter: 'drop-shadow(0 0 6px rgba(245,197,24,0.4))' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider font-barlow group-hover:text-neon-gold transition-colors duration-200">Create Room</h3>
                      <p className="text-xs text-av-muted mt-2 leading-relaxed">Host your own auction room and manage bid settings as Admin.</p>
                    </div>
                    <div className="flex items-center text-xs font-extrabold text-neon-gold space-x-2 uppercase tracking-widest">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                    </div>
                  </button>

                  {/* Join Room Card */}
                  <button
                    onClick={() => { setMode('join'); clearError(); }}
                    className="w-full max-w-xs p-8 premium-card rounded-3xl text-center flex flex-col items-center gap-5 cursor-pointer group"
                    style={{ borderColor: 'rgba(0,212,255,0.12)' }}
                  >
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
                      style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.25)' }}
                    >
                      <Users className="h-8 w-8 text-neon-cyan" style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.4))' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider font-barlow group-hover:text-neon-cyan transition-colors duration-200">Join Room</h3>
                      <p className="text-xs text-av-muted mt-2 leading-relaxed">Enter a lobby code to connect to a friend's active auction room.</p>
                    </div>
                    <div className="flex items-center text-xs font-extrabold text-neon-cyan space-x-2 uppercase tracking-widest">
                      <span>Enter Code</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                    </div>
                  </button>
                </motion.div>
              )}

              {mode === 'create' && (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleCreate}
                  className="w-full max-w-lg premium-card rounded-3xl p-6 sm:p-8 space-y-5"
                >
                  <div className="text-center pb-4 border-b border-white/8">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider font-barlow">Configure Room</h3>
                    <p className="text-xs text-av-muted mt-1">Set up your auction house settings</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Admin / Manager Name</label>
                    <input
                      type="text" required
                      placeholder="Enter your name..."
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-void/80 border border-white/10 focus:border-neon-gold/60 text-xs text-white px-4 py-3 rounded-xl focus:outline-none transition-colors duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Auction Room Name</label>
                    <input
                      type="text" required
                      placeholder="e.g. BCCI Mega Auction 2025"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-void/80 border border-white/10 focus:border-neon-gold/60 text-xs text-white px-4 py-3 rounded-xl focus:outline-none transition-colors duration-200"
                    />
                  </div>

                  {/* Room Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Access Setting</label>
                    <div className="flex rounded-xl bg-void/80 border border-white/10 p-1 gap-1">
                      {(['public', 'private'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setRoomType(type)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-250 ${
                            roomType === type
                              ? 'bg-neon-gold text-midnight font-black'
                              : 'text-av-muted hover:text-white'
                          }`}
                        >
                          {type === 'public' ? 'Public Table' : 'Private (Passcode)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {roomType === 'private' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Room Password</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-av-muted" />
                        <input
                          type="password" required
                          placeholder="Create room passcode..."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-void/80 border border-white/10 text-xs text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Teams Toggle */}
                  <div className="flex items-center justify-between p-4 bg-void/60 border border-white/8 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">Enable AI Teams</span>
                      <span className="text-[10px] text-av-muted">Unclaimed franchises will bid using AI personalities</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableAITeams} onChange={(e) => setEnableAITeams(e.target.checked)} className="sr-only peer" />
                      <div className="w-10 h-5 bg-void rounded-full border border-white/20 peer-checked:border-neon-gold/50 peer-checked:bg-neon-gold/20 transition-all duration-200 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-av-muted after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 peer-checked:after:translate-x-5 peer-checked:after:bg-neon-gold" />
                    </label>
                  </div>

                  {/* Min Players & Timer */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Min Players</label>
                      <select
                        value={minPlayersToStart}
                        onChange={(e) => setMinPlayersToStart(parseInt(e.target.value))}
                        className="w-full bg-void/80 border border-white/10 text-xs text-white px-3 py-3 rounded-xl focus:outline-none cursor-pointer font-bold"
                      >
                        {[1, 2, 4, 6].map(n => <option key={n} value={n}>{n} Player{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Auction Timer</label>
                      <select
                        value={timerDuration}
                        onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                        className="w-full bg-void/80 border border-white/10 text-xs text-white px-3 py-3 rounded-xl focus:outline-none cursor-pointer font-bold"
                      >
                        {[10, 15, 20].map(s => <option key={s} value={s}>{s} Seconds</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Team Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Select Your Franchise</label>
                    <div className="grid grid-cols-5 gap-2">
                      {TEAMS_DB.map((t) => {
                        const isSelected = userTeamId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => selectUserTeam(t.id as TeamId)}
                            className="py-3 rounded-xl border text-xs font-bold transition-all duration-250 flex flex-col items-center justify-center gap-1 cursor-pointer"
                            style={{
                              borderColor: isSelected ? t.primaryColor : 'rgba(255,255,255,0.08)',
                              background: isSelected ? `linear-gradient(135deg, ${t.primaryColor}20, ${t.secondaryColor}10)` : 'rgba(255,255,255,0.02)',
                              boxShadow: isSelected ? `0 0 14px ${t.primaryColor}35, inset 0 0 8px ${t.primaryColor}08` : 'none',
                              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            }}
                          >
                            <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{t.emoji}</span>
                            <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: isSelected ? t.primaryColor : 'rgba(255,255,255,0.5)' }}>{t.abbr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setMode('lobby')}
                      className="flex-1 border border-white/10 hover:border-white/20 bg-white/3 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                      Back
                    </button>
                    <button type="submit" disabled={!userTeamId}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                        userTeamId ? 'bid-button cursor-pointer' : 'bg-white/3 border border-white/8 text-av-muted cursor-not-allowed'
                      }`}>
                      Create Auction
                    </button>
                  </div>
                </motion.form>
              )}

              {mode === 'join' && (
                <motion.form
                  key="join"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleJoin}
                  className="w-full max-w-md premium-card rounded-3xl p-6 sm:p-8 space-y-6"
                >
                  <div className="text-center pb-4 border-b border-white/8">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider font-barlow">Join Room</h3>
                    <p className="text-xs text-av-muted mt-1">Enter a lobby code to connect to an active auction</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-av-muted uppercase font-black tracking-widest">Room Code</label>
                    <input
                      type="text" required
                      placeholder="ENTER 6-CHARACTER CODE"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-void/80 border border-white/10 focus:border-neon-cyan/60 text-sm text-white px-4 py-4 rounded-xl focus:outline-none tracking-[0.4em] uppercase font-black text-center transition-colors duration-200"
                      style={{ letterSpacing: '0.3em' }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setMode('lobby')}
                      className="flex-1 border border-white/10 hover:border-white/20 bg-white/3 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                      Back
                    </button>
                    <button type="submit"
                      className="flex-1 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase cursor-pointer transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #00d4ff, #0080ff)',
                        color: '#03010a',
                        boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
                      }}>
                      Enter Arena
                    </button>
                  </div>
                </motion.form>
              )}
            </>
          )}
        </AnimatePresence>

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 pt-8 border-t border-white/6 w-full">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="premium-card p-6 rounded-2xl flex flex-col gap-3"
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center border"
                  style={{ background: `${f.glow.replace('0.2', '0.08')}`, borderColor: `${f.color}30` }}>
                  <Icon className="h-5 w-5" style={{ color: f.color, filter: `drop-shadow(0 0 6px ${f.color})` }} />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wide">{f.title}</h4>
                <p className="text-xs text-av-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
