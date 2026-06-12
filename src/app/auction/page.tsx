'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { TEAMS_DB } from '@/lib/teams-db';
import { formatCr, formatCrShort, getNextBid } from '@/engine/BidIncrement';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Circle, User, ShieldAlert, Trophy, ArrowRight, Play, Volume2, Send, Pause, SkipForward, Ban, Power } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import AuctionStatsModal from '@/components/shared/AuctionStatsModal';

export default function AuctionArena() {
  const router = useRouter();
  const {
    roomCode,
    userTeamId,
    userName,
    isAdmin,
    paused,
    phase,
    currentPlayer,
    currentBid,
    currentBidderId,
    countdown,
    countdownText,
    timerDuration,
    bidHistory,
    chatMessages,
    teams,
    errorMsg,
    placeBid,
    sendChatMessage,
    triggerAdminAction,
    clearError,
    playerQueue,
    currentIndex
  } = useAuctionStore();

  const [chatInput, setChatInput] = useState('');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'spotlight' | 'standings' | 'chat'>('spotlight');
  const [selectedUnsoldIds, setSelectedUnsoldIds] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Unsold players for accelerated round
  const unsoldPlayers = playerQueue.filter(
    (p) => p.soldPrice === null && p.currentTeam === null && playerQueue.indexOf(p) < currentIndex
  );

  // ── V3 Upgraded Web Audio Sounds ──────────────────────────────────────────
  const playSound = (type: 'bid' | 'sold' | 'going-once' | 'going-twice' | 'warning-3' | 'warning-2' | 'warning-1') => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (type === 'bid') {
        // Short crisp auction bell/chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'going-once' || type === 'going-twice') {
        // Warning drum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'warning-3' || type === 'warning-2' || type === 'warning-1') {
        // Final 3 seconds warning sequence - becoming more urgent
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        
        let freq = 500;
        let vol = 0.15;
        let duration = 0.15;
        
        if (type === 'warning-3') {
          freq = 500;
        } else if (type === 'warning-2') {
          freq = 650;
          vol = 0.22;
        } else if (type === 'warning-1') {
          freq = 800;
          vol = 0.30;
          duration = 0.25;
        }
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } else if (type === 'sold') {
        // Celebratory triple chime + gavel
        [0, 0.15, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          osc.frequency.setValueAtTime(notes[i], ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.4);
        });
        // Gavel thud
        const noise = ctx.createOscillator();
        const nGain = ctx.createGain();
        noise.connect(nGain);
        nGain.connect(ctx.destination);
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(80, ctx.currentTime + 0.45);
        noise.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.75);
        nGain.gain.setValueAtTime(0.5, ctx.currentTime + 0.45);
        nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
        noise.start(ctx.currentTime + 0.45);
        noise.stop(ctx.currentTime + 0.75);
      }
    } catch (e) {
      console.warn('AudioContext blocked', e);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Audio effects triggers
  const lastBidAmount = useRef(0);
  const lastBidderId = useRef<string | null>(null);
  const lastPhase = useRef<string | null>(null);
  const lastWarningTick = useRef<number | null>(null);

  // Warning ticks for final 3 seconds
  useEffect(() => {
    if (phase === 'BIDDING' && countdown <= 3 && countdown > 0) {
      if (lastWarningTick.current !== countdown) {
        playSound(`warning-${countdown}` as any);
        lastWarningTick.current = countdown;
      }
    } else {
      lastWarningTick.current = null;
    }
  }, [countdown, phase]);

  useEffect(() => {
    if (phase === 'BIDDING' && currentBidderId && (currentBid > lastBidAmount.current || currentBidderId !== lastBidderId.current)) {
      playSound('bid');
      const bidderTeam = TEAMS_DB.find(t => t.id === currentBidderId);
      if (bidderTeam) {
        speak(`${bidderTeam.abbr} bids ${formatCr(currentBid)}`);
      }
      lastBidAmount.current = currentBid;
      lastBidderId.current = currentBidderId;
    }
  }, [currentBid, currentBidderId, phase]);

  useEffect(() => {
    // RESOLVING phase sounds
    if (phase === 'RESOLVING') {
      if (countdownText === 'GOING ONCE') playSound('going-once');
      if (countdownText === 'GOING TWICE') playSound('going-twice');
    }

    if (phase === 'SOLD' && lastPhase.current !== 'SOLD' && currentPlayer && currentBidderId) {
      playSound('sold');
      const bidderTeam = TEAMS_DB.find(t => t.id === currentBidderId);
      speak(`Sold! ${currentPlayer.name} sold to ${bidderTeam ? bidderTeam.name : currentBidderId} for ${formatCr(currentBid)}!`);
    } else if (phase === 'UNSOLD' && lastPhase.current !== 'UNSOLD' && currentPlayer) {
      speak(`${currentPlayer.name} goes unsold.`);
    }
    lastPhase.current = phase;
  }, [phase, countdownText, currentPlayer, currentBidderId, currentBid]);

  const lastAnnouncementText = useRef<string | null>(null);
  useEffect(() => {
    if (phase === 'SET_ANNOUNCEMENT' && countdownText && countdownText !== lastAnnouncementText.current) {
      lastAnnouncementText.current = countdownText;
      const displayName = countdownText.replace(/^SET\s+\d+:\s+/, "");
      speak(`Now entering: ${displayName.toLowerCase()}`);
    }
    if (phase !== 'SET_ANNOUNCEMENT') {
      lastAnnouncementText.current = null;
    }
  }, [phase, countdownText]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Redirect if no room active
  useEffect(() => {
    if (!roomCode) {
      router.push('/');
    }
  }, [roomCode, router]);

  if (!roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight text-av-text">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-sm">
          <ShieldAlert className="h-12 w-12 text-neon-gold mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">Lobby Code Required</h2>
          <p className="text-sm text-av-muted mb-6">Join or create a live room before entering the arena.</p>
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

  const activeBidder = teams.find((t) => t.id === currentBidderId);
  const userTeam = teams.find((t) => t.id === userTeamId);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
      setChatInput('');
    }
  };

  // ── Shared sub-components (rendered inside appropriate tab panels) ──────────

  /** Left: Player spotlight card */
  const renderSpotlightPanel = () => (
    <div className="lg:col-span-8 flex flex-col justify-between glass-panel rounded-2xl p-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {currentPlayer ? (
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col h-full justify-between"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{currentPlayer.flag}</span>
                  <span className="text-xs font-semibold text-av-muted uppercase tracking-wider">
                    {currentPlayer.country} • Age {currentPlayer.age}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-wide mt-1 text-white uppercase">
                  {currentPlayer.name}
                </h2>
                {/* V3: Set / Category badge */}
                {currentPlayer.category && (
                  <span className="text-[9px] uppercase font-bold tracking-widest text-neon-gold bg-neon-gold/10 border border-neon-gold/20 px-2 py-0.5 rounded-full block mt-1">
                    {currentPlayer.category}
                  </span>
                )}
              </div>

              <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                currentPlayer.role === 'BAT' ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' :
                currentPlayer.role === 'BOWL' ? 'bg-neon-red/10 text-neon-red border border-neon-red/30' :
                currentPlayer.role === 'WK' ? 'bg-neon-gold/10 text-neon-gold border border-neon-gold/30' :
                'bg-neon-purple/10 text-neon-purple border border-neon-purple/30'
              }`}>
                {currentPlayer.role}
              </span>
            </div>

            {/* Gauge Circle + Price */}
            <div className="flex flex-col sm:flex-row items-center justify-around my-6 gap-6">
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="64" className="stroke-void fill-transparent" strokeWidth="10" />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-neon-gold fill-transparent transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 64}
                    strokeDashoffset={2 * Math.PI * 64 * (1 - currentPlayer.overall / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-neon-gold">{currentPlayer.overall}</span>
                  <span className="text-[10px] text-av-muted uppercase tracking-widest font-bold">OVR Rating</span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-4 text-center sm:text-left">
                <div className="glass-panel px-6 py-2.5 rounded-xl border border-white/5 bg-void/30">
                  {/* V3: show 'Base Price' label when no one has bid yet */}
                  <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider">
                    {currentBidderId ? 'Current Bid' : 'Base Price'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {currentBidderId ? formatCr(currentBid) : `₹${currentPlayer.basePrice.toFixed(2)} Crore`}
                  </div>
                </div>

                <div className="flex gap-4 justify-center sm:justify-start">
                  <div className="text-xs">
                    <span className="text-av-muted block font-semibold">Capped Status</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {currentPlayer.capped ? ' Capped 🇮🇳' : ' Uncapped ⭐️'}
                    </span>
                  </div>
                  <div className="w-px bg-border-custom" />
                  <div className="text-xs">
                    <span className="text-av-muted block font-semibold">Popularity</span>
                    <span className="font-bold text-neon-cyan mt-0.5 block">
                      {currentPlayer.popularity}% Hype
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Bars */}
            <div className="grid grid-cols-2 gap-4 border-t border-border-custom pt-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-av-muted">Batting</span>
                  <span className="text-white font-bold">{currentPlayer.batting}</span>
                </div>
                <div className="w-full bg-void h-1.5 rounded-full overflow-hidden">
                  <div className="bg-neon-cyan h-full rounded-full" style={{ width: `${currentPlayer.batting}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-av-muted">Bowling</span>
                  <span className="text-white font-bold">{currentPlayer.bowling}</span>
                </div>
                <div className="w-full bg-void h-1.5 rounded-full overflow-hidden">
                  <div className="bg-neon-red h-full rounded-full" style={{ width: `${currentPlayer.bowling}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-av-muted">Fielding</span>
                  <span className="text-white font-bold">{currentPlayer.fielding}</span>
                </div>
                <div className="w-full bg-void h-1.5 rounded-full overflow-hidden">
                  <div className="bg-neon-green h-full rounded-full" style={{ width: `${currentPlayer.fielding}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-av-muted">Potential</span>
                  <span className="text-white font-bold">{currentPlayer.potential}</span>
                </div>
                <div className="w-full bg-void h-1.5 rounded-full overflow-hidden">
                  <div className="bg-neon-purple h-full rounded-full" style={{ width: `${currentPlayer.potential}%` }} />
                </div>
              </div>
            </div>

            {/* V3: Expanded stats row */}
            <div className="grid grid-cols-3 gap-3 border-t border-border-custom pt-4 mt-4 text-center">
              <div>
                <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Matches</div>
                <div className="text-sm font-black text-white mt-0.5">{currentPlayer.matches || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider">
                  {currentPlayer.role === 'BOWL' ? 'Wickets' : 'Runs'}
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  {currentPlayer.role === 'BOWL' ? (currentPlayer.wickets || 0) : (currentPlayer.runs || 0)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider">
                  {currentPlayer.role === 'BOWL' ? 'Economy' : 'SR'}
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  {currentPlayer.role === 'BOWL'
                    ? (currentPlayer.economy?.toFixed(2) || 'N/A')
                    : (currentPlayer.strikeRate?.toFixed(1) || 'N/A')}
                </div>
              </div>
            </div>

            {/* V3: Batting/Bowling style + IPL Experience badges */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {currentPlayer.battingStyle && (
                <span className="text-[9px] px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-full font-bold">
                  🪦 {currentPlayer.battingStyle}
                </span>
              )}
              {currentPlayer.bowlingStyle && currentPlayer.bowlingStyle !== 'N/A' && (
                <span className="text-[9px] px-2 py-0.5 bg-neon-red/10 text-neon-red border border-neon-red/20 rounded-full font-bold">
                  🏏 {currentPlayer.bowlingStyle}
                </span>
              )}
              {currentPlayer.iplExperience && (
                <span className="text-[9px] px-2 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-full font-bold">
                  {currentPlayer.iplExperience}
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
            <div className="h-16 w-16 rounded-full bg-glass flex items-center justify-center border border-border-custom">
              <User className="h-8 w-8 text-av-muted" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Waiting for Admin to Start</h3>
              <p className="text-xs text-av-muted max-w-xs mt-1">The live draft will begin as soon as the room owner clicks start.</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* V3: Big warning countdown overlay */}
        {phase === 'BIDDING' && countdown <= 3 && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10"
          >
            <span className="text-[14rem] font-black text-neon-red tracking-tight leading-none filter drop-shadow-[0_0_40px_rgba(255,51,102,0.4)]">
              {countdown}
            </span>
          </motion.div>
        )}

        {phase === 'RESOLVING' && countdownText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-5xl font-black text-neon-gold tracking-widest uppercase mb-2 neon-glow-gold"
            >
              {countdownText}
            </motion.div>
            {activeBidder && (
              <p className="text-lg text-white">
                Highest Bid:{' '}
                <span className="font-extrabold text-neon-green">{formatCr(currentBid)}</span> by{' '}
                <span style={{ color: activeBidder.primaryColor }} className="font-extrabold">
                  {activeBidder.name} {activeBidder.emoji}
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* V3: Enhanced SOLD overlay */}
        {phase === 'SOLD' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm overflow-hidden"
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: activeBidder?.primaryColor || '#FFD700',
                    left: `${10 + (i * 7.5)}%`,
                    top: '-10px',
                  }}
                  animate={{
                    y: ['0px', '120%'],
                    opacity: [1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 1.5 + (i % 3) * 0.3,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>

            {/* Gavel animation */}
            <motion.div
              animate={{ rotate: [0, -30, 5, -20, 0] }}
              transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.7, 1] }}
              className="text-5xl mb-2"
            >🔨</motion.div>

            <motion.div
              animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.5 }}
              className="text-6xl font-black text-neon-green tracking-widest uppercase mb-3 neon-glow-green"
            >
              SOLD!
            </motion.div>

            {activeBidder && (
              <>
                <motion.div
                  animate={{ scale: [0, 1], opacity: [0, 1] }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  style={{
                    boxShadow: `0 0 30px ${activeBidder.primaryColor}`,
                    border: `3px solid ${activeBidder.primaryColor}`,
                  }}
                  className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-5xl mb-4"
                >
                  {activeBidder.emoji}
                </motion.div>
                <p className="text-xl text-white font-bold">
                  {currentPlayer?.name}
                </p>
                <p className="text-base text-av-muted mt-1">
                  Sold to{' '}
                  <span style={{ color: activeBidder.primaryColor }} className="font-extrabold">
                    {activeBidder.name}
                  </span>
                </p>
                <p className="text-2xl font-black text-neon-green mt-2">
                  {formatCr(currentBid)}
                </p>
              </>
            )}
          </motion.div>
        )}

        {phase === 'UNSOLD' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm"
          >
            <div className="text-5xl font-black text-neon-red tracking-widest uppercase mb-2 neon-glow-red">
              UNSOLD
            </div>
            <p className="text-base text-av-muted">
              No franchise matched the base price for {currentPlayer?.name}
            </p>
          </motion.div>
        )}

        {phase === 'COMPLETE' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-20 overflow-y-auto py-8"
          >
            <Trophy className="h-16 w-16 text-neon-gold mb-4 animate-bounce" />
            <h3 className="text-2xl font-black tracking-tight text-white mb-2">MEGA AUCTION COMPLETE</h3>
            <p className="text-sm text-av-muted max-w-sm mb-6">All players have been drafted. Review your final squad in HQ.</p>
            <button
              onClick={() => router.push('/hq')}
              className="bg-neon-gold text-midnight px-6 py-2.5 rounded-lg font-bold flex items-center space-x-2"
            >
              <span>Go to HQ</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* V3: Admin — Accelerated Unsold Round */}
            {isAdmin && unsoldPlayers.length > 0 && (
              <div className="mt-6 w-full max-w-lg px-4">
                <h4 className="text-sm font-bold text-neon-gold uppercase tracking-wider mb-3">
                  Accelerated Round — Unsold Players ({unsoldPlayers.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                  {unsoldPlayers.map(p => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer text-sm text-white bg-void/40 p-2 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedUnsoldIds.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedUnsoldIds(prev => [...prev, p.id]);
                          else setSelectedUnsoldIds(prev => prev.filter(id => id !== p.id));
                        }}
                        className="accent-neon-gold"
                      />
                      <span>{p.flag} {p.name}</span>
                      <span className="text-av-muted text-xs">{formatCr(p.basePrice)}</span>
                    </label>
                  ))}
                </div>
                {selectedUnsoldIds.length > 0 && (
                  <button
                    onClick={() => {
                      triggerAdminAction('reintroduce', selectedUnsoldIds);
                      setSelectedUnsoldIds([]);
                    }}
                    className="w-full bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight py-3 rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer"
                  >
                    Launch Accelerated Round ({selectedUnsoldIds.length} players)
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /** Right: Standings (teams ticker in card form) */
  const renderStandingsPanel = () => (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-av-muted border-b border-border-custom pb-2 mb-3">
        Team Standings
      </h3>
      <div className="space-y-3">
        {teams.map((team) => {
          const isHighest = currentBidderId === team.id;
          const isUser = team.id === userTeamId;
          return (
            <div
              key={team.id}
              style={{
                borderColor: isHighest ? team.primaryColor : 'var(--av-border)',
                boxShadow: isHighest ? `0 0 10px ${team.primaryColor}30` : 'none',
              }}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg border bg-glass transition-all duration-300 ${
                isHighest ? 'bg-white/5 font-bold scale-[1.02]' : 'opacity-80'
              } ${isUser ? 'ring-1 ring-neon-gold/40' : ''}`}
            >
              <span className="text-xl">{team.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-xs uppercase font-extrabold" style={{ color: team.primaryColor }}>
                    {team.abbr}
                  </span>
                  {isUser && <span className="text-[9px] px-1 bg-neon-gold text-midnight rounded font-black">YOU</span>}
                  {isHighest && <span className="text-[9px] px-1 bg-neon-green/20 text-neon-green rounded font-black">LEADING</span>}
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-av-muted mt-0.5">
                  <span className="text-neon-green font-semibold">₹{team.purse.toFixed(2)}Cr</span>
                  <span>•</span>
                  <span>{team.squad.length}/25 players</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /** Right: Bidding box + chat + admin */
  const renderBiddingAndChatPanel = () => (
    <div className="lg:col-span-4 flex flex-col gap-6">

      {/* Bidding box */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[280px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-extrabold tracking-wider text-av-muted flex items-center space-x-1">
              <Circle className={`h-2.5 w-2.5 ${paused ? 'bg-neon-red' : 'bg-neon-gold'} rounded-full animate-pulse`} />
              <span>{paused ? 'PAUSED' : 'LIVE'}</span>
            </span>
            <span className="text-[9px] text-av-muted font-bold mt-1 uppercase tracking-wider">
              Auction Timer: {timerDuration}s
            </span>
          </div>

          {/* Countdown Gauge */}
          <div className="relative flex items-center justify-center w-12 h-12">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="20" className="stroke-white/5 fill-transparent" strokeWidth="2.5" />
              <circle
                cx="24"
                cy="24"
                r="20"
                className={`fill-transparent transition-all duration-1000 ${
                  countdown <= 3 ? 'stroke-neon-red animate-pulse' : 'stroke-neon-cyan'
                }`}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - countdown / timerDuration)}
              />
            </svg>
            <span className={`absolute text-sm font-black ${countdown <= 3 ? 'text-neon-red animate-pulse' : 'text-white'}`}>
              {countdown}
            </span>
          </div>
        </div>

        {/* Current Price */}
        <div className="text-center my-4">
          <span className="text-[9px] uppercase font-bold tracking-widest text-av-muted block mb-1">
            {activeBidder ? 'Current Bid' : 'Base Price'}
          </span>
          <h2 className="text-4xl font-black text-white">{formatCr(currentBid)}</h2>
          {activeBidder ? (
            <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-xs font-bold mt-1 bg-white/5 border border-white/10 text-white">
              <span>{activeBidder.emoji}</span>
              <span>{activeBidder.name}</span>
            </div>
          ) : (
            <span className="text-[10px] text-av-muted mt-1 block">Opening Bid (Pending)</span>
          )}
        </div>

        {/* Bidding buttons */}
        {(phase === 'BIDDING' || phase === 'RESOLVING') && !paused && userTeamId ? (
          <div className="space-y-3">
            {(() => {
              const nextBidAmount = currentBidderId ? getNextBid(currentBid) : currentBid;
              const isHighestBidder = currentBidderId === userTeamId;
              const hasPurse = userTeam ? userTeam.purse >= nextBidAmount : false;
              const isRosterFull = userTeam ? userTeam.squad.length >= 25 : false;
              const isOverseasQuotaFull = userTeam && currentPlayer?.overseas
                ? userTeam.squad.filter(p => p.overseas).length >= 8
                : false;

              let btnText = `BID ${formatCr(nextBidAmount)}`;
              let isDisabled = false;

              if (isHighestBidder) {
                btnText = `YOU HOLD HIGHEST BID (${formatCr(currentBid)})`;
                isDisabled = true;
              } else if (isRosterFull) {
                btnText = `ROSTER FULL (25/25)`;
                isDisabled = true;
              } else if (isOverseasQuotaFull) {
                btnText = `OVERSEAS QUOTA FULL (8/8)`;
                isDisabled = true;
              } else if (!hasPurse) {
                btnText = `INSUFFICIENT PURSE (₹${userTeam?.purse.toFixed(2)} Cr)`;
                isDisabled = true;
              }

              return (
                <button
                  onClick={() => placeBid()}
                  disabled={isDisabled}
                  className={`w-full py-4 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-lg ${
                    isDisabled
                      ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_25px_rgba(245,197,24,0.4)] hover:scale-[1.02] active:scale-[0.98] font-extrabold cursor-pointer border-t border-white/20'
                  }`}
                >
                  {btnText}
                </button>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-4 bg-void/50 border border-border-custom rounded-xl text-xs text-av-muted font-bold">
            {paused ? 'Auction is Paused' : !userTeamId ? 'Spectating Mode Only' : 'Bidding is Closed'}
          </div>
        )}

        {errorMsg && (
          <div className="text-[10px] text-neon-red font-bold text-center mt-2 animate-shake">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Spectator Chat Box */}
      <div className="glass-panel rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[300px] max-h-[350px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-av-muted border-b border-border-custom pb-2">
          Auction Chat Feed
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1 text-xs">
          {chatMessages.map((msg: any) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl border text-[10px] font-black tracking-wide ${
                    msg.isWinner ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' :
                    msg.isUnsold ? 'bg-neon-red/10 border-neon-red/30 text-neon-red' :
                    'bg-neon-cyan/5 border-neon-cyan/20 text-neon-cyan'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">{msg.emoji}</span>
                    <span className="uppercase">{msg.text}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="bg-void/20 border border-white/5 p-2 rounded-lg">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <span>{msg.emoji}</span>
                  <span className="font-extrabold text-white uppercase text-[10px]">{msg.sender}</span>
                </div>
                <p className="text-av-text leading-tight">{msg.text}</p>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-border-custom pt-2">
          <input
            type="text"
            placeholder="Send message to room..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-void border border-border-custom text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
          />
          <button type="submit" className="text-neon-gold hover:text-white transition-colors duration-200">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Admin Panel sidebar controls */}
      {isAdmin && (
        <div className="glass-panel rounded-2xl p-4 space-y-3.5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-neon-gold">
            Admin Console
          </h3>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => triggerAdminAction(paused ? 'resume' : 'pause')}
              className="w-full bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1.5"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>{paused ? 'Resume' : 'Pause'}</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerAdminAction('restart-timer')}
                className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2 py-1.5 rounded-lg text-center"
              >
                Reset Timer
              </button>
              <button
                onClick={() => triggerAdminAction('reset')}
                className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2 py-1.5 rounded-lg text-center text-neon-red"
              >
                Reset Room
              </button>
            </div>
          </div>

          <div className="border-t border-border-custom/50 pt-3 mt-1.5">
            <label className="text-[9px] uppercase font-black text-av-muted block mb-2">
              Set Timer (Applies Next Player)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((sec) => (
                <button
                  key={sec}
                  onClick={() => triggerAdminAction('change-timer', sec.toString())}
                  className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                    timerDuration === sec
                      ? 'bg-neon-gold/25 border-neon-gold text-neon-gold shadow-[0_0_10px_rgba(245,197,24,0.2)]'
                      : 'bg-glass border-border-custom text-av-muted hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text relative">
      {/* Screen Highlight on final 3 seconds */}
      {phase === 'BIDDING' && countdown <= 3 && countdown > 0 && !paused && (
        <div className="pointer-events-none fixed inset-0 z-50 ring-[16px] ring-neon-red/15 animate-pulse shadow-[inset_0_0_80px_rgba(255,51,102,0.2)]" />
      )}
      <Navbar />

      {/* Purse & Squad Ticker */}
      <div className="border-b border-border-custom bg-void/50 py-3 relative">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center gap-4">
          <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-4 pr-16">
            {teams.map((team) => {
              const isHighest = currentBidderId === team.id;
              const isUser = team.id === userTeamId;
              return (
                <div
                  key={team.id}
                  style={{
                    borderColor: isHighest ? team.primaryColor : 'var(--av-border)',
                    boxShadow: isHighest ? `0 0 10px ${team.primaryColor}30` : 'none',
                  }}
                  className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border bg-glass transition-all duration-300 ${
                    isHighest ? 'bg-white/5 font-bold scale-[1.02]' : 'opacity-80'
                  } ${isUser ? 'ring-1 ring-neon-gold/40' : ''}`}
                >
                  <span className="text-lg">{team.emoji}</span>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs uppercase font-extrabold" style={{ color: team.primaryColor }}>
                        {team.abbr}
                      </span>
                      {isUser && <span className="text-[9px] px-1 bg-neon-gold text-midnight rounded font-black">YOU</span>}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-av-muted mt-0.5">
                      <span className="text-neon-green font-semibold">₹{team.purse.toFixed(2)}Cr</span>
                      <span>•</span>
                      <span>{team.squad.length}/25</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsStatsOpen(true)}
            className="shrink-0 bg-neon-gold/15 text-neon-gold border border-neon-gold/30 hover:bg-neon-gold/25 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all duration-200"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Stats board</span>
          </button>
        </div>
      </div>

      {/* ── Desktop Grid (lg+) ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid-cols-12 gap-6 relative z-10 lg:grid">
        {renderSpotlightPanel()}
        {renderBiddingAndChatPanel()}
      </div>

      {/* ── Mobile Tab Layout (< lg) ───────────────────────────────────────── */}
      <div className="lg:hidden flex-1 max-w-7xl w-full mx-auto px-4 py-4 relative z-10 pb-[170px]">
        {mobileTab === 'spotlight' && (
          <div className="flex flex-col gap-6">
            {/* Render spotlight as a standalone card on mobile */}
            {renderSpotlightPanel()}
          </div>
        )}
        {mobileTab === 'standings' && (
          <div className="flex flex-col gap-6">
            {renderStandingsPanel()}
          </div>
        )}
        {mobileTab === 'chat' && (
          <div className="flex flex-col gap-6">
            {/* Chat */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between min-h-[300px] max-h-[400px]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-av-muted border-b border-border-custom pb-2">
                Auction Chat Feed
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1 text-xs">
                {chatMessages.map((msg: any) => {
                  if (msg.isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl border text-[10px] font-black tracking-wide ${
                          msg.isWinner ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' :
                          msg.isUnsold ? 'bg-neon-red/10 border-neon-red/30 text-neon-red' :
                          'bg-neon-cyan/5 border-neon-cyan/20 text-neon-cyan'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">{msg.emoji}</span>
                          <span className="uppercase">{msg.text}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className="bg-void/20 border border-white/5 p-2 rounded-lg">
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span>{msg.emoji}</span>
                        <span className="font-extrabold text-white uppercase text-[10px]">{msg.sender}</span>
                      </div>
                      <p className="text-av-text leading-tight">{msg.text}</p>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-border-custom pt-2">
                <input
                  type="text"
                  placeholder="Send message to room..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-void border border-border-custom text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
                />
                <button type="submit" className="text-neon-gold hover:text-white transition-colors duration-200">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Mobile Admin Panel */}
            {isAdmin && (
              <div className="glass-panel rounded-2xl p-4 space-y-3.5">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-neon-gold">Admin Console</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => triggerAdminAction(paused ? 'resume' : 'pause')} className="w-full bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1.5">
                    <Pause className="h-3.5 w-3.5" />
                    <span>{paused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => triggerAdminAction('restart-timer')} className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2 py-1.5 rounded-lg text-center">Reset Timer</button>
                    <button onClick={() => triggerAdminAction('reset')} className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2 py-1.5 rounded-lg text-center text-neon-red">Reset Room</button>
                  </div>
                </div>

                <div className="border-t border-border-custom/50 pt-3 mt-1.5">
                  <label className="text-[9px] uppercase font-black text-av-muted block mb-2">
                    Set Timer (Applies Next Player)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => triggerAdminAction('change-timer', sec.toString())}
                        className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                          timerDuration === sec
                            ? 'bg-neon-gold/25 border-neon-gold text-neon-gold shadow-[0_0_10px_rgba(245,197,24,0.2)]'
                            : 'bg-glass border-border-custom text-av-muted hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile Fixed Bottom Bidding Panel (lg hidden) ───────────────── */}
      {currentPlayer && (phase === 'BIDDING' || phase === 'RESOLVING' || phase === 'SOLD' || phase === 'UNSOLD') && (
        <div className="lg:hidden fixed bottom-[56px] left-0 right-0 z-40 bg-void/95 border-t border-border-custom p-3 flex flex-col gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {/* Player & Bid details */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-base">{currentPlayer.flag}</span>
              <div className="min-w-0">
                <div className="font-extrabold text-white truncate uppercase max-w-[130px]">{currentPlayer.name}</div>
                <span className="text-[9px] text-av-muted uppercase font-bold block">{currentPlayer.role} • OVR {currentPlayer.overall}</span>
              </div>
            </div>
            
            {/* Timer & Price */}
            <div className="flex items-center space-x-2.5">
              {/* Compact Timer circle */}
              <div className="relative flex items-center justify-center w-8 h-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="16" cy="16" r="13" className="stroke-white/5 fill-transparent" strokeWidth="2" />
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    className={`fill-transparent transition-all duration-1000 ${countdown <= 3 && phase === 'BIDDING' ? 'stroke-neon-red animate-pulse' : 'stroke-neon-cyan'}`}
                    strokeWidth="2"
                    strokeDasharray={2 * Math.PI * 13}
                    strokeDashoffset={2 * Math.PI * 13 * (1 - (phase === 'RESOLVING' ? 1.5 : countdown) / (phase === 'RESOLVING' ? 1.5 : timerDuration))}
                  />
                </svg>
                <span className={`absolute text-[9px] font-black ${countdown <= 3 && phase === 'BIDDING' ? 'text-neon-red animate-pulse' : 'text-white'}`}>
                  {phase === 'RESOLVING' ? '!' : countdown}
                </span>
              </div>

              {/* Price Details */}
              <div className="text-right">
                <span className="text-[8px] uppercase text-av-muted font-bold block leading-none mb-0.5">
                  {currentBidderId ? 'Current Bid' : 'Base Price'}
                </span>
                <span className="text-xs font-black text-neon-green">
                  {currentBidderId ? formatCr(currentBid) : `₹${currentPlayer.basePrice.toFixed(2)} Cr`}
                </span>
              </div>
            </div>
          </div>

          {/* Bid Button and Leader row */}
          <div className="flex items-center gap-2">
            {/* Leader team info */}
            <div className="flex-1 bg-white/5 border border-border-custom rounded-xl p-1.5 py-1.5 flex items-center justify-between text-[10px]">
              <span className="text-av-muted font-bold uppercase truncate">Leader:</span>
              {activeBidder ? (
                <span className="font-extrabold truncate ml-1" style={{ color: activeBidder.primaryColor }}>
                  {activeBidder.emoji} {activeBidder.abbr}
                </span>
              ) : (
                <span className="text-av-muted italic truncate ml-1">None</span>
              )}
            </div>

            {/* Bidding trigger */}
            <div className="flex-[1.5]">
              {(() => {
                const nextBidAmount = currentBidderId ? getNextBid(currentBid) : currentBid;
                const isHighestBidder = currentBidderId === userTeamId;
                const hasPurse = userTeam ? userTeam.purse >= nextBidAmount : false;
                const isRosterFull = userTeam ? userTeam.squad.length >= 25 : false;
                const isOverseasQuotaFull = userTeam && currentPlayer?.overseas
                  ? userTeam.squad.filter(p => p.overseas).length >= 8
                  : false;

                let btnText = `BID ${formatCrShort(nextBidAmount)}`;
                let isDisabled = false;

                if (isHighestBidder) {
                  btnText = `YOU LEAD`;
                  isDisabled = true;
                } else if (isRosterFull) {
                  btnText = `FULL`;
                  isDisabled = true;
                } else if (isOverseasQuotaFull) {
                  btnText = `OVERSEAS`;
                  isDisabled = true;
                } else if (!hasPurse) {
                  btnText = `NO PURSE`;
                  isDisabled = true;
                } else if (paused) {
                  btnText = `PAUSED`;
                  isDisabled = true;
                }

                return (
                  <button
                    onClick={() => placeBid()}
                    disabled={isDisabled}
                    className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 shadow-md ${
                      isDisabled
                        ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {btnText}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Tab Bar ──────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-void/95 backdrop-blur-md border-t border-border-custom">
        <div className="flex items-stretch">
          {(
            [
              { key: 'spotlight', label: 'Spotlight', icon: '🏏' },
              { key: 'standings', label: 'Standings', icon: '🏆' },
              { key: 'chat',      label: 'Chat',      icon: '💬' },
              { key: 'lineup',    label: 'HQ Lineup',   icon: '📋' },
            ]
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'lineup') {
                  router.push('/hq');
                } else {
                  setMobileTab(tab.key as any);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                mobileTab === tab.key
                  ? 'text-neon-gold border-t-2 border-neon-gold bg-neon-gold/5'
                  : 'text-av-muted border-t-2 border-transparent'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isStatsOpen && (
          <AuctionStatsModal
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            pool={playerQueue}
            currentIndex={currentIndex}
            teams={teams}
            isAdmin={isAdmin}
            onReintroduce={(playerId) => triggerAdminAction('reintroduce', [playerId])}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'SET_ANNOUNCEMENT' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-4 flex flex-col items-center"
            >
              <span className="text-xs uppercase font-extrabold tracking-widest text-neon-gold bg-neon-gold/10 border border-neon-gold/20 px-4 py-1.5 rounded-full">
                Now Entering
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-wide uppercase mt-4 max-w-2xl px-6 neon-glow-gold">
                {countdownText ? countdownText.replace(/^SET\s+\d+:\s+/, "") : ""}
              </h1>
              <div className="w-24 h-1 bg-neon-gold mx-auto mt-6 rounded-full opacity-60 animate-pulse" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
