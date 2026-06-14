'use client';

import { useRouter } from 'next/navigation';
import { TEAMS_DB } from '@/lib/teams-db';
import { useAuctionStore } from '@/store/auctionStore';
import { TeamId } from '@/types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Key, Users, Trophy, Play, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
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

  // Landing view state: 'lobby' (room action selector) | 'create' | 'join'
  const [mode, setMode] = useState<'lobby' | 'create' | 'join'>('lobby');

  // Input states
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

  // Redirect to Lobby when roomCode is populated AND justActioned is true
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

  return (
    <div className="min-h-screen flex flex-col relative bg-midnight text-av-text bg-grid-pattern overflow-hidden">
      {/* Ambient glowing background elements using performant CSS radial gradients */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] pointer-events-none z-0 opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(180, 79, 255, 0.12) 0%, rgba(180, 79, 255, 0) 70%)'
        }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] pointer-events-none z-0 opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, rgba(0, 212, 255, 0) 70%)'
        }}
      />
      <div 
        className="absolute top-[25%] right-[10%] w-[350px] h-[350px] pointer-events-none animate-float z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245, 197, 24, 0.05) 0%, rgba(245, 197, 24, 0) 75%)',
          willChange: 'transform'
        }}
      />

      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-4 py-8 w-full z-10">
        
        {/* Title Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 max-w-2xl"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-neon-gold/30 bg-neon-gold/10 text-neon-gold font-bold text-xs uppercase tracking-wider mb-4 animate-pulse">
            <Zap className="h-3 w-3 fill-neon-gold" />
            <span>Founder: Sachin Arul</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neon-gold to-neon-cyan mb-4">
            AUCTIONVERSE CRICKET
          </h1>
          <p className="text-sm sm:text-base text-av-muted font-medium">
            Assemble a custom room, invite friends or challenge rival managers, outbid strategies in real-time, and manage your ₹120 Crore budget.
          </p>
        </motion.div>

        {errorMsg && (
          <div className="w-full max-w-md p-4 bg-neon-red/10 border border-neon-red/30 text-neon-red text-xs rounded-xl flex items-center space-x-2 mb-6">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {cachedRoomCode && cachedPlayerToken && !roomCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-4 mb-6 bg-neon-gold/5 border border-neon-gold/30 rounded-xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-2.5 text-xs">
              <Shield className="h-5 w-5 text-neon-gold shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="font-bold text-white uppercase block">Unfinished Session Detected</span>
                <span className="text-av-muted">Room Code: <span className="text-neon-gold font-bold">{cachedRoomCode}</span></span>
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
                    alert(`Failed to rejoin session: ${res.reason || 'Room not found'}`);
                  }
                });
              }}
              className="bg-neon-gold text-midnight px-3.5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer"
            >
              Rejoin
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {roomCode && !justActioned ? (
            <motion.div
              key="active-session"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 glass-panel rounded-2xl text-center space-y-6 my-6 border border-neon-gold/30"
            >
              <div className="h-12 w-12 rounded-full bg-neon-gold/10 flex items-center justify-center border border-neon-gold/20 mx-auto">
                <Shield className="h-6 w-6 text-neon-gold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Active Session Found</h3>
                <p className="text-xs text-av-muted mt-2">
                  You are currently joined to room <span className="text-neon-gold font-bold">{roomCode}</span>. Would you like to rejoin it or leave to create/join a new room?
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    disconnectSocket();
                    clearError();
                  }}
                  className="flex-1 border border-neon-red/30 hover:border-neon-red/50 bg-neon-red/10 text-neon-red py-3 rounded-xl text-xs font-bold uppercase transition-all duration-200"
                >
                  Leave Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJustActioned(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight py-3 rounded-xl text-xs font-black tracking-wider uppercase font-extrabold cursor-pointer hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] transition-all duration-200"
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center items-center my-6"
                >
                  {/* Card CTA: Create Room */}
                  <button
                    onClick={() => {
                      setMode('create');
                      clearError();
                    }}
                    className="w-full max-w-xs p-8 glass-panel rounded-3xl text-center flex flex-col items-center gap-5 hover:border-neon-gold/60 cursor-pointer transform hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(245,197,24,0.2)] transition-all duration-300 group"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-neon-gold/10 flex items-center justify-center border border-neon-gold/25 group-hover:bg-neon-gold/20 group-hover:scale-110 transition-all duration-300">
                      <Shield className="h-7 w-7 text-neon-gold filter drop-shadow-[0_0_5px_rgba(245,197,24,0.3)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider group-hover:text-neon-gold transition-colors duration-200">Create Room</h3>
                      <p className="text-xs text-av-muted mt-2 leading-relaxed">Host your own auction room and manage bid settings as Admin.</p>
                    </div>
                    <div className="flex items-center text-xs font-extrabold text-neon-gold space-x-2 uppercase mt-3 tracking-widest">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Card CTA: Join Room */}
                  <button
                    onClick={() => {
                      setMode('join');
                      clearError();
                    }}
                    className="w-full max-w-xs p-8 glass-panel rounded-3xl text-center flex flex-col items-center gap-5 hover:border-neon-cyan/60 cursor-pointer transform hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(0,212,255,0.2)] transition-all duration-300 group"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/25 group-hover:bg-neon-cyan/20 group-hover:scale-110 transition-all duration-300">
                      <Users className="h-7 w-7 text-neon-cyan filter drop-shadow-[0_0_5px_rgba(0,212,255,0.3)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider group-hover:text-neon-cyan transition-colors duration-200">Join Room</h3>
                      <p className="text-xs text-av-muted mt-2 leading-relaxed">Enter a lobby code to connect to a friend's active auction room.</p>
                    </div>
                    <div className="flex items-center text-xs font-extrabold text-neon-cyan space-x-2 uppercase mt-3 tracking-widest">
                      <span>Enter Code</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              )}

              {mode === 'create' && (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleCreate}
                  className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 space-y-5"
                >
                  <div className="text-center pb-2 border-b border-border-custom">
                    <h3 className="text-xl font-black text-white uppercase tracking-wide">Configure Room</h3>
                    <p className="text-xs text-av-muted mt-1">Host details & franchise branding</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Admin/Manager Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name..."
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-void border border-border-custom focus:border-neon-gold text-xs text-white px-4 py-3 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Auction Room Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BCCI Mega Auction 2025"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-void border border-border-custom focus:border-neon-gold text-xs text-white px-4 py-3 rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Room Type Switch */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Access Setting</label>
                    <div className="flex rounded-lg bg-void border border-border-custom p-1">
                      <button
                        type="button"
                        onClick={() => setRoomType('public')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-all duration-300 ${
                          roomType === 'public' ? 'bg-neon-gold text-midnight' : 'text-av-muted'
                        }`}
                      >
                        Public Table
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomType('private')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-all duration-300 ${
                          roomType === 'private' ? 'bg-neon-gold text-midnight' : 'text-av-muted'
                        }`}
                      >
                        Private (Passcode)
                      </button>
                    </div>
                  </div>

                  {roomType === 'private' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Room Password</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-av-muted" />
                        <input
                          type="password"
                          required
                          placeholder="Create room passcode..."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-void border border-border-custom text-xs text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Enable AI Teams Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-void border border-border-custom rounded-xl">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white uppercase">Enable AI Teams</span>
                      <span className="text-[10px] text-av-muted">Unclaimed franchises will be bid on by AI bots</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAITeams}
                      onChange={(e) => setEnableAITeams(e.target.checked)}
                      className="w-4 h-4 accent-neon-gold bg-void border-border-custom rounded cursor-pointer"
                    />
                  </div>

                  {/* Min Players To Start Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Minimum Players to Start</label>
                    <select
                      value={minPlayersToStart}
                      onChange={(e) => setMinPlayersToStart(parseInt(e.target.value))}
                      className="w-full bg-void border border-border-custom focus:border-neon-gold text-xs text-white px-4 py-3.5 rounded-xl focus:outline-none cursor-pointer font-bold"
                    >
                      <option value="1">1 Player</option>
                      <option value="2">2 Players</option>
                      <option value="4">4 Players</option>
                      <option value="6">6 Players</option>
                    </select>
                  </div>

                  {/* Auction Timer Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Auction Timer</label>
                    <select
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                      className="w-full bg-void border border-border-custom focus:border-neon-gold text-xs text-white px-4 py-3.5 rounded-xl focus:outline-none cursor-pointer font-bold"
                    >
                      <option value="10">10 Seconds</option>
                      <option value="15">15 Seconds</option>
                      <option value="20">20 Seconds</option>
                    </select>
                  </div>

                  {/* IPL Team Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Select Your Team</label>
                    <div className="grid grid-cols-5 gap-2">
                      {TEAMS_DB.map((t) => {
                        const isSelected = userTeamId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => selectUserTeam(t.id as TeamId)}
                            className="py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer transform hover:scale-105 active:scale-95"
                            style={{
                              borderColor: isSelected ? t.primaryColor : 'var(--av-border)',
                              background: isSelected 
                                ? `linear-gradient(135deg, ${t.primaryColor}25, ${t.secondaryColor}12)` 
                                : 'var(--av-glass)',
                              boxShadow: isSelected ? `0 0 15px ${t.primaryColor}40` : 'none',
                              color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = `${t.primaryColor}80`;
                                e.currentTarget.style.background = `${t.primaryColor}0c`;
                                e.currentTarget.style.boxShadow = `0 0 12px ${t.primaryColor}20`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--av-border)';
                                e.currentTarget.style.background = 'var(--av-glass)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">{t.emoji}</span>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold">{t.abbr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('lobby')}
                      className="flex-1 border border-border-custom hover:border-white/20 bg-glass text-white py-3 rounded-xl text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!userTeamId}
                      className={`flex-1 py-3 rounded-xl text-xs font-black tracking-wider uppercase ${
                        userTeamId
                          ? 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] font-extrabold cursor-pointer'
                          : 'bg-glass border border-border-custom text-av-muted cursor-not-allowed'
                      }`}
                    >
                      Create
                    </button>
                  </div>
                </motion.form>
              )}

              {mode === 'join' && (
                <motion.form
                  key="join"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleJoin}
                  className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 space-y-5"
                >
                  <div className="text-center pb-2 border-b border-border-custom">
                    <h3 className="text-xl font-black text-white uppercase tracking-wide">Join Room</h3>
                    <p className="text-xs text-av-muted mt-1">Enter a lobby code to connect to an active auction room</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Room Code</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-character code..."
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-void border border-border-custom focus:border-neon-cyan text-xs text-white px-4 py-3 rounded-xl focus:outline-none tracking-widest uppercase font-black text-center"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('lobby')}
                      className="flex-1 border border-border-custom hover:border-white/20 bg-glass text-white py-3 rounded-xl text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-neon-cyan to-blue-500 text-midnight hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] text-xs font-black tracking-wider uppercase font-extrabold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </motion.form>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-8 border-t border-border-custom w-full">
          <div className="flex items-start space-x-3">
            <Trophy className="h-6 w-6 text-neon-gold shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold tracking-wide">Dynamic Budget Pressure</h4>
              <p className="text-xs text-av-muted mt-0.5">Incremental bid scales from ₹5 Lakh up to ₹2 Crore per click as players heat up.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-6 w-6 text-neon-cyan shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold tracking-wide">Realistic AI Personalities</h4>
              <p className="text-xs text-av-muted mt-0.5">Aggressive, Conservative, Youth-focused, Star-hunters, and Balanced AI managers bid against you.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Cpu className="h-6 w-6 text-neon-green shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold tracking-wide">Live Squad HQ & Analytics</h4>
              <p className="text-xs text-av-muted mt-0.5">Track your chemistry, role distribution, and spending curves live as you assemble your 25-player squad.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
