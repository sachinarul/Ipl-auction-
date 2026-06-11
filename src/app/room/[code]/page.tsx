'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { TEAMS_DB } from '@/lib/teams-db';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, CheckCircle2, Copy, Share2, Play, RefreshCw, Key, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function RoomLobby() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const {
    roomCode,
    userTeamId,
    userName,
    isAdmin,
    isReady,
    participants,
    teams,
    errorMsg,
    phase,
    joinRoom,
    toggleReady,
    changeTeam,
    triggerAdminAction,
    clearError,
    enableAITeams,
    minPlayersToStart,
    getRoomInfo,
    timerDuration,
    setOrder,
    disabledSets
  } = useAuctionStore();

  // Input states for join gate
  const [joinName, setJoinName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch room details on mount
  useEffect(() => {
    if (code) {
      getRoomInfo(code);
    }
  }, [code, getRoomInfo]);

  // Sync route and redirect if auction goes live
  useEffect(() => {
    if (roomCode === code && phase !== 'WAITING') {
      router.push('/auction');
    }
  }, [roomCode, code, phase, router]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    joinRoom(code, joinName, selectedTeam as any, '', (res) => {
      if (res.success) {
        clearError();
      }
    }, true); // isInviteLink = true (bypasses private passcode checks)
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const inviteLink = `${window.location.origin}/room/${code}`;
    const text = `Join my IPL Auction Room in AuctionVerse Cricket!\nRoom Code: ${code}\nLink: ${inviteLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // 1. Render JOIN GATE if not in room
  if (roomCode !== code) {
    return (
      <div className="min-h-screen flex flex-col bg-midnight text-av-text">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="text-center">
              <span className="text-xs uppercase font-extrabold text-neon-gold tracking-widest bg-neon-gold/10 border border-neon-gold/20 px-3 py-1 rounded-full">
                Join Invitation
              </span>
              <h2 className="text-2xl font-black text-white tracking-wide uppercase mt-3">
                Room Gate: {code}
              </h2>
              <p className="text-xs text-av-muted mt-1">Enter your manager profile details to join the auction table.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-neon-red/10 border border-neon-red/30 text-neon-red text-xs rounded-xl flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Manager Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name..."
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="w-full bg-void border border-border-custom hover:border-white/15 focus:border-neon-gold text-xs text-white px-4 py-3 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-av-muted uppercase font-bold tracking-wider">Select IPL Franchise</label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {TEAMS_DB.map((t) => {
                    const owner = participants.find((p) => p.teamId === t.id);
                    const isTaken = !!owner;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isTaken}
                        onClick={() => setSelectedTeam(t.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                          isTaken
                            ? 'bg-void/40 border-void text-av-muted/50 cursor-not-allowed opacity-50'
                            : selectedTeam === t.id
                            ? 'border-neon-gold bg-neon-gold/10 text-white'
                            : 'border-border-custom bg-glass hover:bg-glass-hover text-white/80'
                        }`}
                      >
                        <span className="flex items-center space-x-1.5">
                          <span>{t.emoji}</span>
                          <span className="uppercase tracking-wide">{t.abbr}</span>
                        </span>
                        {isTaken && owner && (
                          <span className="text-[9px] px-2 py-0.5 bg-neon-red/10 text-neon-red rounded border border-neon-red/25 max-w-[90px] truncate" title={`Owned by ${owner.name}`}>
                            {owner.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedTeam('')}
                    className={`text-left p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                      selectedTeam === ''
                        ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                        : 'border-border-custom bg-glass hover:bg-glass-hover text-white/80'
                    }`}
                  >
                    <span>👁️ SPECTATE MODE</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 font-extrabold cursor-pointer"
              >
                Join Auction
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. Render PRE-AUCTION LOBBY if in room
  const activeFranchise = TEAMS_DB.find((t) => t.id === userTeamId);
  const occupiedTeamIds = participants.filter((p) => p.teamId).map((p) => p.teamId);
  const availableTeamsCount = TEAMS_DB.filter((t) => !occupiedTeamIds.includes(t.id)).length;
  const humanBidders = participants.filter((p) => p.teamId).length;
  const isRoomAllReady = humanBidders >= minPlayersToStart && participants.every((p) => p.isReady);
  const roomLiveStatus = isRoomAllReady ? 'ALL READY' : 'WAITING FOR PLAYERS';

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: Room status & participants (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Franchise Banner */}
          {activeFranchise ? (
            <div
              style={{
                background: `linear-gradient(135deg, ${activeFranchise.gradientFrom}cc, ${activeFranchise.gradientTo}cc)`,
                border: `1px solid ${activeFranchise.secondaryColor}33`
              }}
              className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg backdrop-blur-md relative overflow-hidden"
            >
              {/* Decorative background circle */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 blur-xl pointer-events-none" />
              
              <div className="flex items-center space-x-4 z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl border border-white/20 shadow-inner">
                  {activeFranchise.emoji}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-white/60 block">YOUR FRANCHISE</span>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase mt-0.5">
                    {activeFranchise.name}
                  </h1>
                  <span className="text-xs text-white/80 mt-1 inline-flex items-center bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                    Role: Franchise Owner
                  </span>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 text-center sm:text-right z-10 bg-black/20 px-4 py-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block font-extrabold">Starting Purse</span>
                <span className="text-lg font-black text-neon-gold">₹120.00 Cr</span>
              </div>
            </div>
          ) : (
            <div className="bg-void/40 border border-border-custom rounded-2xl p-6 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-glass flex items-center justify-center text-4xl border border-border-custom">
                  👁️
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-av-muted block">SPECTATOR</span>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase mt-0.5">
                    SPECTATING MODE
                  </h1>
                  <span className="text-xs text-av-muted mt-1 block">
                    Watch the live auction table and chat with other managers
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-center border-b border-border-custom pb-4 mb-6">
              <div>
                <span className="text-xs uppercase font-extrabold text-neon-gold tracking-widest block">Lobby Room</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase mt-1">
                  PRE-AUCTION TABLE
                </h2>
              </div>
              
              <div className="text-right">
                <span className="text-[10px] text-av-muted uppercase font-bold tracking-wider block">Connection status</span>
                <span className="inline-flex items-center space-x-1 text-xs text-neon-green font-semibold mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-ping mr-1" />
                  <span>Synchronized</span>
                </span>
              </div>
            </div>

            {/* Participants list */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-av-muted flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Joined Managers ({participants.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {participants.map((p) => {
                  const pTeam = TEAMS_DB.find((t) => t.id === p.teamId);
                  return (
                    <div
                      key={p.socketId}
                      className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-void/50 transition-all duration-200 hover:border-white/10"
                      style={{
                        borderLeft: pTeam ? `3px solid ${pTeam.primaryColor}` : '3px solid transparent'
                      }}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 rounded-full bg-glass flex items-center justify-center text-sm border border-border-custom shadow-inner">
                          {p.isAdmin ? <Shield className="h-4 w-4 text-neon-gold fill-neon-gold/10" /> : '👤'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-white uppercase">
                              {p.name} {pTeam ? ` - ${pTeam.name}` : ' - Spectator'}
                            </span>
                            {p.isAdmin && <span className="text-[8px] px-1.5 py-0.5 bg-neon-gold text-midnight font-black rounded tracking-wider">HOST</span>}
                          </div>
                          <span className="text-[10px] text-av-muted">
                            {pTeam ? `${pTeam.emoji} Team Manager` : 'Spectator'}
                          </span>
                        </div>
                      </div>

                      {p.isReady ? (
                        <div className="flex items-center space-x-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] font-black px-2 py-1 rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>READY</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-neon-red/10 border border-neon-red/30 text-neon-red text-[10px] font-black px-2 py-1 rounded-lg animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-neon-red" />
                          <span>NOT READY</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Host Configuration Summary & Live Status */}
            <div className="bg-void/40 border border-white/5 rounded-xl p-5 space-y-4 mt-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <h4 className="text-xs uppercase font-extrabold text-neon-gold tracking-widest">
                  LOBBY STATUS & SETTINGS
                </h4>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black tracking-wider border ${
                  isRoomAllReady
                    ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                    : 'bg-neon-red/10 border-neon-red/30 text-neon-red animate-pulse'
                }`}>
                  {roomLiveStatus}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-void/20 p-3 rounded-xl border border-white/5">
                  <span className="text-av-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Franchises Drafted</span>
                  <strong className="text-base font-black text-white">{humanBidders}</strong>
                  <span className="text-av-muted text-[9px] block mt-0.5">
                    Target: {minPlayersToStart} {minPlayersToStart === 1 ? 'Player' : 'Players'}
                  </span>
                </div>
                
                <div className="bg-void/20 p-3 rounded-xl border border-white/5">
                  <span className="text-av-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Available Franchises</span>
                  <strong className="text-base font-black text-neon-gold">{availableTeamsCount}</strong>
                  <span className="text-av-muted text-[9px] block mt-0.5">
                    Available for joiners
                  </span>
                </div>

                <div className="bg-void/20 p-3 rounded-xl border border-white/5">
                  <span className="text-av-muted text-[10px] uppercase font-bold tracking-wider block mb-1">AI Teams (Bots)</span>
                  <strong className={`text-base font-black ${enableAITeams ? 'text-neon-green' : 'text-neon-red'}`}>
                    {enableAITeams ? 'ON' : 'OFF'}
                  </strong>
                  <span className="text-av-muted text-[9px] block mt-0.5">
                    {enableAITeams ? 'AI backfills spots' : 'Human players only'}
                  </span>
                </div>

                <div className="bg-void/20 p-3 rounded-xl border border-white/5">
                  <span className="text-av-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Auction Timer</span>
                  <strong className="text-base font-black text-white">{timerDuration}s</strong>
                  <span className="text-av-muted text-[9px] block mt-0.5">
                    Per bidding turn
                  </span>
                </div>
              </div>

              {/* Warning condition: no active bidders (only 1 human, AI teams off) */}
              {!enableAITeams && humanBidders <= 1 && (
                <div className="p-3 bg-neon-red/10 border border-neon-red/20 text-neon-red text-xs rounded-xl flex items-center space-x-2 mt-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span><strong>Warning:</strong> No bidders available. Players will go unsold.</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 border-t border-border-custom pt-6 mt-6">
              <button
                onClick={toggleReady}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 ${
                  isReady
                    ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                    : 'bg-glass border border-border-custom text-white hover:bg-glass-hover'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isReady ? 'READY TO START' : 'MARK AS READY'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => triggerAdminAction('start')}
                  disabled={!isRoomAllReady}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 ${
                    !isRoomAllReady
                      ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed'
                      : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_20px_rgba(245,197,24,0.3)] font-extrabold cursor-pointer'
                  }`}
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>START IPL AUCTION</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Invite credentials & parameters (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-av-muted border-b border-border-custom pb-3">
              Invite Managers
            </h3>

            {/* Room Code block */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-av-muted uppercase font-bold tracking-wider">Room Code</span>
              <div className="flex bg-void p-2.5 rounded-xl border border-border-custom justify-between items-center">
                <span className="text-sm font-black text-white tracking-widest uppercase">{code}</span>
                <button onClick={handleCopyCode} className="text-av-muted hover:text-white transition-colors duration-200">
                  {copiedCode ? <span className="text-[10px] text-neon-green font-bold">COPIED</span> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Invite link block */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-av-muted uppercase font-bold tracking-wider">Invite URL</span>
              <div className="flex bg-void p-2.5 rounded-xl border border-border-custom justify-between items-center">
                <span className="text-[10px] text-av-muted truncate w-4/5">
                  {typeof window !== 'undefined' ? `${window.location.origin}/room/${code}` : ''}
                </span>
                <button onClick={handleCopyLink} className="text-av-muted hover:text-white transition-colors duration-200">
                  {copiedLink ? <span className="text-[10px] text-neon-green font-bold">COPIED</span> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Social Share button */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3 rounded-xl text-xs font-black tracking-wider uppercase flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Configure Auction Sets Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-neon-gold border-b border-border-custom pb-3 flex items-center justify-between">
              <span>⚙️ Auction Sets Configuration</span>
              {isAdmin && <span className="text-[8px] bg-neon-gold/15 text-neon-gold px-1.5 py-0.5 rounded uppercase font-black">Admin Mode</span>}
            </h3>
            
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {(setOrder && setOrder.length > 0 ? setOrder : [
                'MARQUEE',
                'SET 1',
                'SET 2',
                'SET 3'
              ]).map((setName, index) => {
                const isSetDisabled = disabledSets && disabledSets.includes(setName);
                return (
                  <div 
                    key={setName} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all duration-200 ${
                      isSetDisabled 
                        ? 'border-void bg-void/30 opacity-40' 
                        : 'border-white/5 bg-void/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-av-muted">#{index + 1}</span>
                      <span className={`font-bold ${isSetDisabled ? 'line-through text-av-muted' : 'text-white'}`}>
                        {setName}
                      </span>
                    </div>

                    {isAdmin ? (
                      <div className="flex items-center space-x-1">
                        <button 
                          disabled={index === 0} 
                          onClick={() => {
                            const newOrder = [...setOrder];
                            const temp = newOrder[index];
                            newOrder[index] = newOrder[index - 1];
                            newOrder[index - 1] = temp;
                            triggerAdminAction('update-sets', { setOrder: newOrder, disabledSets });
                          }}
                          className="p-1 rounded bg-glass border border-white/5 hover:border-neon-gold hover:text-neon-gold text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <button 
                          disabled={index === setOrder.length - 1} 
                          onClick={() => {
                            const newOrder = [...setOrder];
                            const temp = newOrder[index];
                            newOrder[index] = newOrder[index + 1];
                            newOrder[index + 1] = temp;
                            triggerAdminAction('update-sets', { setOrder: newOrder, disabledSets });
                          }}
                          className="p-1 rounded bg-glass border border-white/5 hover:border-neon-gold hover:text-neon-gold text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                        <button 
                          onClick={() => {
                            const newDisabled = isSetDisabled 
                              ? disabledSets.filter(s => s !== setName) 
                              : [...disabledSets, setName];
                            triggerAdminAction('update-sets', { setOrder, disabledSets: newDisabled });
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            isSetDisabled 
                              ? 'bg-neon-red/10 border border-neon-red/30 text-neon-red' 
                              : 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                          }`}
                        >
                          {isSetDisabled ? 'OFF' : 'ON'}
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        isSetDisabled 
                          ? 'bg-neon-red/10 text-neon-red border border-neon-red/20' 
                          : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                      }`}>
                        {isSetDisabled ? 'Disabled' : 'Enabled'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
