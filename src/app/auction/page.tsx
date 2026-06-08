'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { TEAMS_DB } from '@/lib/teams-db';
import { formatCr, getNextBid } from '@/engine/BidIncrement';
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio synthesis generators (Web Audio API)
  const playSound = (type: 'bid' | 'sold' | 'gavel') => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'bid') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'gavel') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("AudioContext blocked by browser autoplay rules", e);
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
    if (phase === 'SOLD' && lastPhase.current !== 'SOLD' && currentPlayer && currentBidderId) {
      playSound('gavel');
      const bidderTeam = TEAMS_DB.find(t => t.id === currentBidderId);
      speak(`Sold! ${currentPlayer.name} sold to ${bidderTeam ? bidderTeam.name : currentBidderId} for ${formatCr(currentBid)}!`);
    } else if (phase === 'UNSOLD' && lastPhase.current !== 'UNSOLD' && currentPlayer) {
      speak(`${currentPlayer.name} goes unsold.`);
    }
    lastPhase.current = phase;
  }, [phase, currentPlayer, currentBidderId, currentBid]);

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

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text">
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

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left spotlight card (col-span-8) */}
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

                {/* Gauge Circle */}
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
                      <div className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Base Price</div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        ₹{currentPlayer.basePrice.toFixed(2)} Crore
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

                {/* Substats */}
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

          {/* Overlays */}
          <AnimatePresence>
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

            {phase === 'SOLD' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm"
              >
                <div className="text-5xl font-black text-neon-green tracking-widest uppercase mb-2 neon-glow-green">
                  SOLD
                </div>
                {activeBidder && (
                  <p className="text-lg text-white">
                    {currentPlayer?.name} sold to{' '}
                    <span style={{ color: activeBidder.primaryColor }} className="font-extrabold">
                      {activeBidder.name} {activeBidder.emoji}
                    </span>{' '}
                    for <span className="font-black text-neon-green">{formatCr(currentBid)}</span>
                  </p>
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
                className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-20"
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
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right bidding & chat boards (col-span-4) */}
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
              <span className="text-[9px] uppercase font-bold tracking-widest text-av-muted block mb-1">Current Bid</span>
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
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerAdminAction(paused ? 'resume' : 'pause')}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1.5"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>{paused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={() => triggerAdminAction('skip')}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1.5"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  <span>Skip</span>
                </button>
                <button
                  onClick={() => triggerAdminAction('unsold')}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1.5"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Force Unsold</span>
                </button>
                <button
                  onClick={() => triggerAdminAction('force-sell')}
                  disabled={!currentBidderId}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Force Sell</span>
                </button>
              </div>

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
          )}

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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
