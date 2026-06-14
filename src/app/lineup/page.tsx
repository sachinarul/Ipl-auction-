'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { PlayerRole, Player, TeamId } from '@/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ArrowRight, User, Users, Landmark, Coins, Award, Sparkles, CheckCircle, Trophy,
  Crown, Play, Lock, Unlock, RefreshCw, AlertCircle, Trash2, Eye, Download, Info, BarChart2, Check, X,
  ChevronRight, Star, Sparkle, Sliders, Zap, Circle, Volume2
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { formatCr, formatCrShort, getNextBid } from '@/engine/BidIncrement';

export default function LineupPage() {
  const router = useRouter();
  const { 
    roomCode,
    userTeamId, 
    teams, 
    phase,
    paused,
    currentPlayer,
    currentBid,
    currentBidderId,
    countdown,
    timerDuration,
    submittedTeams,
    submitTeam,
    placeBid,
    triggerAdminAction,
    isAdmin,
    lockedRankings
  } = useAuctionStore();

  // Lineup Builder States
  const [playingXI, setPlayingXI] = useState<Array<Player | null>>(Array(11).fill(null));
  const [impactPlayer, setImpactPlayer] = useState<Player | null>(null);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<number | null>(null);
  const [submittedLocal, setSubmittedLocal] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<number | 'impact' | null>(null);
  const [assigningSlot, setAssigningSlot] = useState<number | 'impact' | null>(null);
  const [activeSlotAction, setActiveSlotAction] = useState<number | 'impact' | null>(null);
  const [modalRoleFilter, setModalRoleFilter] = useState<'ALL' | PlayerRole>('ALL');

  // viewedTeamId State for inspecting teammate teams
  const [viewedTeamId, setViewedTeamId] = useState<string>('');
  const isOwnTeam = viewedTeamId === userTeamId || !viewedTeamId;

  // Redirect if no team selected
  useEffect(() => {
    if (!userTeamId) {
      router.push('/');
    } else if (!viewedTeamId) {
      setViewedTeamId(userTeamId);
    }
  }, [userTeamId, viewedTeamId, router]);

  // Sync submitted team state and drafts
  useEffect(() => {
    const targetTeamId = viewedTeamId || userTeamId;
    if (!targetTeamId) return;

    const submission = submittedTeams[targetTeamId];
    if (submission) {
      // If we have data on the server (either official submission or draft)
      const xi = Array(11).fill(null);
      if (submission.playingXI) {
        submission.playingXI.forEach((p, idx) => {
          if (idx < 11) xi[idx] = p;
        });
      }
      setPlayingXI(xi);
      setImpactPlayer(submission.impactPlayer || null);
      setCaptainId(submission.captainId || null);
      setViceCaptainId(submission.viceCaptainId || null);
      setSubmittedLocal(!!submission.submitted);
      return;
    }

    // Fallback: check localStorage for cached draft
    if (typeof window !== 'undefined') {
      const draftKey = `av_lineup_draft_${roomCode || ''}_${targetTeamId}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setPlayingXI(parsed.playingXI || Array(11).fill(null));
            setImpactPlayer(parsed.impactPlayer || null);
            setCaptainId(parsed.captainId || null);
            setViceCaptainId(parsed.viceCaptainId || null);
            setSubmittedLocal(false);
            return;
          }
        } catch (e) {
          console.warn("Error loading draft from localStorage:", e);
        }
      }
    }

    // If no draft exists anywhere, reset to empty
    if (!isOwnTeam) {
      setPlayingXI(Array(11).fill(null));
      setImpactPlayer(null);
      setCaptainId(null);
      setViceCaptainId(null);
    }
    setSubmittedLocal(false);
  }, [submittedTeams, viewedTeamId, userTeamId, roomCode, isOwnTeam]);

  const userTeam = teams.find((t) => t.id === (viewedTeamId || userTeamId));
  const squad = userTeam ? userTeam.squad : [];

  // Lineup Builder Actions
  const handleAutofill = () => {
    if (!squad || squad.length === 0) return;
    const sorted = [...squad].sort((a, b) => b.overall - a.overall);
    const xi = Array(11).fill(null);
    const wks = sorted.filter(p => p.role === 'WK');
    let osCount = 0;
    let xiIdx = 0;

    const bestWK = wks[0];
    if (bestWK) {
      xi[xiIdx++] = bestWK;
      if (bestWK.overseas) osCount++;
    }

    for (const p of sorted) {
      if (xiIdx >= 11) break;
      if (bestWK && p.id === bestWK.id) continue;

      if (p.overseas) {
        if (osCount < 4) {
          xi[xiIdx++] = p;
          osCount++;
        }
      } else {
        xi[xiIdx++] = p;
      }
    }

    if (xiIdx < 11) {
      for (const p of sorted) {
        if (xiIdx >= 11) break;
        if (xi.some(x => x && x.id === p.id)) continue;
        xi[xiIdx++] = p;
      }
    }

    setPlayingXI(xi);

    const bench = sorted.filter(p => !xi.some(x => x && x.id === p.id));
    setImpactPlayer(bench[0] || null);

    const validXi = xi.filter((x): x is Player => x !== null);
    const sortedXi = [...validXi].sort((a, b) => b.overall - a.overall);
    if (sortedXi[0]) setCaptainId(sortedXi[0].id);
    if (sortedXi[1]) setViceCaptainId(sortedXi[1].id);
    setSelectedForSwap(null);
  };

  const handleResetLineup = () => {
    setPlayingXI(Array(11).fill(null));
    setImpactPlayer(null);
    setCaptainId(null);
    setViceCaptainId(null);
    setSelectedForSwap(null);
  };

  const handleRemovePlayer = (index: number | 'impact') => {
    if (index === 'impact') {
      setImpactPlayer(null);
    } else {
      setPlayingXI(prev => {
        const newXI = [...prev];
        const removed = newXI[index];
        newXI[index] = null;
        if (removed) {
          if (captainId === removed.id) setCaptainId(null);
          if (viceCaptainId === removed.id) setViceCaptainId(null);
        }
        return newXI;
      });
    }
    setSelectedForSwap(null);
  };

  const handleSetCaptain = (id: number) => {
    setCaptainId(id);
    if (viceCaptainId === id) setViceCaptainId(null);
  };

  const handleSetViceCaptain = (id: number) => {
    setViceCaptainId(id);
    if (captainId === id) setCaptainId(null);
  };

  const handleSlotClick = (index: number | 'impact') => {
    if (submittedLocal || !isOwnTeam) return;

    const playerInSlot = index === 'impact' ? impactPlayer : playingXI[index];

    if (selectedForSwap !== null) {
      const sourceIndex = selectedForSwap;
      const targetIndex = index;
      
      if (sourceIndex === targetIndex) {
        setSelectedForSwap(null);
        return;
      }

      setPlayingXI(prev => {
        const newXI = [...prev];
        let sourceVal = sourceIndex === 'impact' ? impactPlayer : newXI[sourceIndex];
        let targetVal = targetIndex === 'impact' ? impactPlayer : newXI[targetIndex];

        if (sourceIndex === 'impact') {
          setImpactPlayer(targetVal);
        } else {
          newXI[sourceIndex] = targetVal;
        }

        if (targetIndex === 'impact') {
          setImpactPlayer(sourceVal);
        } else {
          newXI[targetIndex] = sourceVal;
        }

        return newXI;
      });

      setSelectedForSwap(null);
    } else {
      if (playerInSlot) {
        setActiveSlotAction(index);
      } else {
        setAssigningSlot(index);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number | 'impact') => {
    if (submittedLocal) return;
    e.dataTransfer.setData('sourceIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number | 'impact') => {
    e.preventDefault();
    if (submittedLocal) return;
    const sourceStr = e.dataTransfer.getData('sourceIndex');
    if (!sourceStr) return;

    const sourceIndex = sourceStr === 'impact' ? 'impact' : parseInt(sourceStr);
    if (sourceIndex === targetIndex) return;

    setPlayingXI(prev => {
      const newXI = [...prev];
      let sourceVal = sourceIndex === 'impact' ? impactPlayer : newXI[sourceIndex];
      let targetVal = targetIndex === 'impact' ? impactPlayer : newXI[targetIndex];

      if (sourceIndex === 'impact') {
        setImpactPlayer(targetVal);
      } else {
        newXI[sourceIndex] = targetVal;
      }

      if (targetIndex === 'impact') {
        setImpactPlayer(sourceVal);
      } else {
        newXI[targetIndex] = sourceVal;
      }

      return newXI;
    });
    setSelectedForSwap(null);
  };

  const handleAssignFromBench = (player: Player) => {
    if (assigningSlot === null) return;

    if (assigningSlot === 'impact') {
      setImpactPlayer(player);
    } else {
      setPlayingXI(prev => {
        const newXI = [...prev];
        newXI[assigningSlot as number] = player;
        return newXI;
      });
    }

    setAssigningSlot(null);
    setSelectedForSwap(null);
  };

  // Lineup Validations
  const xiPlayers = playingXI.filter((p): p is Player => p !== null);
  const xiCountVal = xiPlayers.length;
  const wkCountVal = xiPlayers.filter(p => p.role === 'WK').length;
  const osCountVal = xiPlayers.filter(p => p.overseas).length;
  const hasImpactVal = impactPlayer !== null;
  const hasCaptainVal = captainId !== null && xiPlayers.some(p => p.id === captainId);
  const hasVCVal = viceCaptainId !== null && xiPlayers.some(p => p.id === viceCaptainId);

  const isValidLineup = 
    xiCountVal === 11 && 
    wkCountVal >= 1 && 
    osCountVal <= 4 && 
    hasImpactVal && 
    hasCaptainVal && 
    hasVCVal;

  const handleSubmitSquad = () => {
    if (!isValidLineup) return;
    submitTeam(playingXI, impactPlayer, captainId, viceCaptainId, true, (res) => {
      if (res.success) {
        setSubmittedLocal(true);
      } else {
        alert(`Failed to submit lineup: ${res.reason}`);
      }
    });
  };

  const handleSaveDraft = () => {
    if (typeof window !== 'undefined') {
      const targetTeamId = viewedTeamId || userTeamId;
      const draftKey = `av_lineup_draft_${roomCode || ''}_${targetTeamId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        playingXI,
        impactPlayer,
        captainId,
        viceCaptainId
      }));
    }

    submitTeam(playingXI, impactPlayer, captainId, viceCaptainId, false, (res) => {
      if (res.success) {
        alert("Draft saved successfully!");
      } else {
        alert(`Failed to save draft: ${res.reason}`);
      }
    });
  };

  const availableBench = squad.filter(p => {
    const inXI = playingXI.some(x => x && x.id === p.id);
    const inImpact = impactPlayer && impactPlayer.id === p.id;
    return !inXI && !inImpact;
  });

  const modalAvailableBench = availableBench.filter(p => {
    if (modalRoleFilter === 'ALL') return true;
    return p.role === modalRoleFilter;
  });

  const activeBidder = teams.find((t) => t.id === currentBidderId);
  const sessionUserTeam = teams.find((t) => t.id === userTeamId);

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

      {/* Main split screen layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Lineup Builder Board */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Header row */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-neon-cyan/5 to-transparent border border-neon-cyan/20">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{userTeam?.emoji || '🏏'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black uppercase tracking-wider text-white">
                    {userTeam?.name} Lineup Board
                  </h2>
                  {teams && teams.length > 0 && (
                    <select
                      value={viewedTeamId}
                      onChange={(e) => setViewedTeamId(e.target.value)}
                      className="bg-void border border-border-custom px-2 py-0.5 rounded text-[10px] font-bold text-white focus:outline-none focus:border-neon-gold cursor-pointer"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.name} {t.id === userTeamId ? '(You)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-[10px] text-av-muted mt-0.5">Build Playing XI & select Impact Player live during the auction</p>
              </div>
            </div>

            {!submittedLocal && isOwnTeam && squad.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleAutofill}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-neon-gold" />
                  <span>Auto-fill</span>
                </button>
                <button
                  onClick={handleResetLineup}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-neon-red text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          {squad.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-neon-gold/10 border border-neon-gold/20 rounded-full flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-neon-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Squad is Empty</h2>
                <p className="text-xs text-av-muted mt-1 max-w-sm mx-auto">
                  You have not purchased any players in the auction yet. Wait for a player to be sold to your franchise, or bid on players in the right panel!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              
              {/* Playing XI list */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-neon-cyan tracking-wider px-1">Playing XI Squad</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {playingXI.map((player, idx) => {
                    const isCaptain = player && captainId === player.id;
                    const isVC = player && viceCaptainId === player.id;
                    const isSelected = selectedForSwap === idx;

                    return (
                      <div
                        key={idx}
                        draggable={!submittedLocal && isOwnTeam && player !== null}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => handleSlotClick(idx)}
                        className={`glass-panel p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-neon-gold bg-neon-gold/5 shadow-[0_0_10px_rgba(245,197,24,0.1)]' 
                            : player 
                              ? 'border-border-custom hover:border-border-custom-hover' 
                              : 'border-dashed border-border-custom/50 bg-void/10 hover:border-neon-cyan/40 hover:bg-neon-cyan/2'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-[10px] font-black text-av-muted w-4 text-right shrink-0">#{idx + 1}</span>
                          {player ? (
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{player.flag}</span>
                                <span className="font-bold text-white uppercase tracking-wide truncate text-xs">{player.name}</span>
                                {player.overseas && (
                                  <span className="text-[6px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] font-bold ${
                                  player.role === 'BAT' ? 'text-neon-cyan' :
                                  player.role === 'BOWL' ? 'text-neon-red' :
                                  player.role === 'WK' ? 'text-neon-gold' :
                                  'text-neon-purple'
                                }`}>
                                  {player.role}
                                </span>
                                <span className="text-[8px] text-av-muted">OVR {player.overall}</span>
                                <span className="text-[8px] text-neon-green font-bold">₹{player.soldPrice?.toFixed(2)} Cr</span>
                                {isCaptain && <span className="bg-neon-gold text-midnight text-[7px] px-1 rounded font-black shrink-0">CAPT</span>}
                                {isVC && <span className="bg-neon-cyan text-midnight text-[7px] px-1 rounded font-black shrink-0">VC</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-av-muted italic">Empty Slot</div>
                          )}
                        </div>

                        {player && !submittedLocal && isOwnTeam && (
                          <div className="flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSetCaptain(player.id)}
                              className={`p-1 rounded transition-colors ${
                                isCaptain ? 'bg-neon-gold/20 text-neon-gold' : 'text-av-muted hover:text-white'
                              }`}
                            >
                              <Crown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleSetViceCaptain(player.id)}
                              className={`p-1 rounded transition-colors ${
                                isVC ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-av-muted hover:text-white'
                              }`}
                            >
                              <Star className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRemovePlayer(idx)}
                              className="p-1 text-av-muted hover:text-neon-red transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Impact Player Slot */}
                  <div
                    draggable={!submittedLocal && isOwnTeam && impactPlayer !== null}
                    onDragStart={(e) => handleDragStart(e, 'impact')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'impact')}
                    onClick={() => handleSlotClick('impact')}
                    className={`glass-panel p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                      selectedForSwap === 'impact' 
                        ? 'border-neon-purple bg-neon-purple/5 shadow-[0_0_10px_rgba(180,79,255,0.1)]' 
                        : impactPlayer 
                          ? 'border-neon-purple/30 hover:border-neon-purple/60' 
                          : 'border-dashed border-neon-purple/30 bg-void/10 hover:border-neon-purple/60 hover:bg-neon-purple/2'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-[9px] font-black text-neon-purple shrink-0">IMPACT</span>
                      {impactPlayer ? (
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{impactPlayer.flag}</span>
                            <span className="font-bold text-white uppercase tracking-wide truncate text-xs">{impactPlayer.name}</span>
                            {impactPlayer.overseas && (
                              <span className="text-[6px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[8px] font-bold ${
                              impactPlayer.role === 'BAT' ? 'text-neon-cyan' :
                              impactPlayer.role === 'BOWL' ? 'text-neon-red' :
                              impactPlayer.role === 'WK' ? 'text-neon-gold' :
                              'text-neon-purple'
                            }`}>
                              {impactPlayer.role}
                            </span>
                            <span className="text-[8px] text-av-muted">OVR {impactPlayer.overall}</span>
                            <span className="text-[8px] text-neon-green font-bold">₹{impactPlayer.soldPrice?.toFixed(2)} Cr</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-neon-purple/50 italic">Assign Impact Player (Sub)</div>
                      )}
                    </div>

                    {impactPlayer && !submittedLocal && isOwnTeam && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer('impact');
                        }}
                        className="p-1 text-av-muted hover:text-neon-red transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status / Submit panel & Available Bench */}
              <div className="space-y-4">
                {/* Submission checks */}
                <div className="glass-panel p-4 rounded-xl space-y-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-neon-green" />
                    <span>Submission Status Checks</span>
                  </h3>
                  
                  <div className="space-y-2.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-av-muted">Playing XI Size:</span>
                      <span className="font-bold text-white">{xiCountVal} / 11 Players {xiCountVal === 11 ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-av-muted">Wicketkeeper WK:</span>
                      <span className="font-bold text-white">{wkCountVal} selected {wkCountVal >= 1 ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-av-muted">Overseas Limit (Max 4):</span>
                      <span className="font-bold text-white">{osCountVal} / 4 Limit {osCountVal <= 4 ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-av-muted">Impact Player:</span>
                      <span className="font-bold text-white">{impactPlayer ? 'Selected ✅' : 'Pending ❌'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-av-muted">Captain (C):</span>
                      <span className="font-bold text-white">{captainId && xiPlayers.some(p => p.id === captainId) ? 'Selected ✅' : 'Pending ❌'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-av-muted">Vice-Captain (VC):</span>
                      <span className="font-bold text-white">{viceCaptainId && xiPlayers.some(p => p.id === viceCaptainId) ? 'Selected ✅' : 'Pending ❌'}</span>
                    </div>
                  </div>

                  <div className="h-px bg-border-custom/50 my-3" />

                  {/* Submit state */}
                  {submittedLocal ? (
                    <div className="space-y-2.5">
                      <div className="bg-neon-green/10 border border-neon-green/30 p-2.5 rounded-lg flex items-start space-x-2 text-[11px] text-neon-green">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold uppercase tracking-wide">🔒 Team Submitted</div>
                          <div className="text-neon-green font-bold mt-0.5">Lineup Locked</div>
                        </div>
                      </div>
                      {!lockedRankings && isOwnTeam && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to unlock and edit your lineup?")) {
                              setSubmittedLocal(false);
                              submitTeam(playingXI, impactPlayer, captainId, viceCaptainId, false);
                            }
                          }}
                          className="w-full bg-glass hover:bg-glass-hover text-white text-xs py-2 rounded-lg font-bold border border-border-custom cursor-pointer"
                        >
                          Unlock & Edit
                        </button>
                      )}
                    </div>
                  ) : (
                    isOwnTeam ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleSaveDraft}
                          className="w-full bg-glass border border-neon-gold/50 text-neon-gold hover:bg-neon-gold/10 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer"
                        >
                          💾 Save Draft
                        </button>
                        <button
                          onClick={handleSubmitSquad}
                          disabled={!isValidLineup}
                          className={`w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            isValidLineup 
                              ? 'bg-neon-green text-midnight neon-glow-green hover:scale-[1.02] cursor-pointer' 
                              : 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                          }`}
                        >
                          🚀 Submit Team
                        </button>
                      </div>
                    ) : (
                      <div className="bg-glass border border-border-custom p-2.5 rounded-lg text-center text-xs text-av-muted font-bold">
                        Not Submitted by Franchise Owner
                      </div>
                    )
                  )}
                </div>

                {/* Available Bench */}
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-neon-gold" />
                    <span>Available Bench ({availableBench.length})</span>
                  </h3>
                  
                  {availableBench.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                      {availableBench.map(player => (
                        <div
                          key={player.id}
                          className="bg-void/40 hover:bg-void/75 border border-white/5 p-2 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px]">{player.flag}</span>
                              <span className="font-bold text-white truncate max-w-[110px]">{player.name}</span>
                              {player.overseas && (
                                <span className="text-[6px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-av-muted">
                              <span>OVR {player.overall}</span>
                              <span>•</span>
                              <span>{player.role}</span>
                            </div>
                          </div>

                          {!submittedLocal && isOwnTeam && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  const firstEmpty = playingXI.findIndex(p => p === null);
                                  if (firstEmpty !== -1) {
                                    setPlayingXI(prev => {
                                      const newXI = [...prev];
                                      newXI[firstEmpty] = player;
                                      return newXI;
                                    });
                                  } else if (!impactPlayer) {
                                    setImpactPlayer(player);
                                  } else {
                                    alert("Your squad is full! Swap players or remove one first.");
                                  }
                                }}
                                className="bg-neon-cyan/10 hover:bg-neon-cyan text-neon-cyan hover:text-midnight text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Add XI
                              </button>
                              <button
                                onClick={() => setImpactPlayer(player)}
                                className="bg-neon-purple/10 hover:bg-neon-purple text-neon-purple hover:text-white text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Impact
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-av-muted italic">
                      All purchased squad players are assigned
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Live Auction Arena HUD */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-neon-gold/20 bg-gradient-to-b from-neon-gold/5 to-transparent space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-neon-gold flex items-center gap-1.5">
                <Zap className="h-4 w-4 animate-pulse" />
                <span>Live Auction status</span>
              </h3>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-neon-gold/15 text-neon-gold rounded border border-neon-gold/20">
                {paused ? 'PAUSED' : 'LIVE'}
              </span>
            </div>

            {currentPlayer ? (
              <div className="space-y-4">
                {/* Player details */}
                <div className="bg-void/40 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-lg">{currentPlayer.flag}</span>
                      <span className="text-[9px] uppercase font-bold text-av-muted">{currentPlayer.country}</span>
                    </div>
                    <h4 className="text-sm font-black text-white uppercase truncate mt-0.5">
                      {currentPlayer.name}
                    </h4>
                    <span className="text-[8px] uppercase font-bold tracking-widest text-neon-cyan px-1.5 py-0.2 bg-neon-cyan/10 rounded border border-neon-cyan/20 inline-block mt-1">
                      {currentPlayer.role} • OVR {currentPlayer.overall}
                    </span>
                  </div>

                  {/* Circular Timer */}
                  <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
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
                    <span className={`absolute text-xs font-black ${countdown <= 3 ? 'text-neon-red animate-pulse' : 'text-white'}`}>
                      {countdown}s
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-center bg-void/50 border border-border-custom rounded-xl p-3">
                  <span className="text-[8px] uppercase tracking-widest text-av-muted block mb-0.5">
                    {currentBidderId ? 'Current Bid' : 'Base Price'}
                  </span>
                  <div className="text-2xl font-black text-white">{formatCr(currentBid)}</div>
                  {activeBidder ? (
                    <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: activeBidder.primaryColor }}>
                      {activeBidder.emoji} {activeBidder.name} Leading
                    </span>
                  ) : (
                    <span className="text-[9px] text-av-muted mt-0.5 block">Waiting for opening bid</span>
                  )}
                </div>

                {/* Bid Trigger Button */}
                {(phase === 'BIDDING' || phase === 'RESOLVING') && !paused && userTeamId ? (
                  (() => {
                    const nextBidAmount = currentBidderId ? getNextBid(currentBid) : currentBid;
                    const isHighestBidder = currentBidderId === userTeamId;
                    const hasPurse = sessionUserTeam ? sessionUserTeam.purse >= nextBidAmount : false;
                    const isRosterFull = sessionUserTeam ? sessionUserTeam.squad.length >= 25 : false;

                    let btnText = `BID ${formatCr(nextBidAmount)}`;
                    let isDisabled = false;

                    if (isHighestBidder) {
                      btnText = `YOU LEAD`;
                      isDisabled = true;
                    } else if (isRosterFull) {
                      btnText = `ROSTER FULL`;
                      isDisabled = true;
                    } else if (!hasPurse) {
                      btnText = `NO PURSE`;
                      isDisabled = true;
                    }

                    return (
                      <button
                        onClick={() => placeBid()}
                        disabled={isDisabled}
                        className={`w-full py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-md ${
                          isDisabled
                            ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] hover:scale-[1.02] cursor-pointer'
                        }`}
                      >
                        {btnText}
                      </button>
                    );
                  })()
                ) : (
                  <div className="text-center py-3 bg-void/30 border border-border-custom rounded-lg text-xs text-av-muted font-bold">
                    Bidding is Closed
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-av-muted italic">
                No active player is up for auction right now.
              </div>
            )}
          </div>

          {/* Franchise Lineup Submission Status Monitor (Admin & Everyone) */}
          <div className="glass-panel p-5 rounded-2xl border border-border-custom space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-neon-gold" />
              <span>Franchise Lineup Status Monitor</span>
            </h3>

            <div className="space-y-2.5">
              {teams.map(t => {
                const sub = submittedTeams[t.id];
                const isSubmitted = sub?.submitted;
                const isDraft = sub && !sub.submitted && (sub.playingXI?.length > 0 || sub.impactPlayer);
                
                let badgeColor = 'bg-neon-red/10 text-neon-red border-neon-red/20';
                let badgeText = 'PENDING';
                if (isSubmitted) {
                  badgeColor = 'bg-neon-green/10 text-neon-green border-neon-green/20';
                  badgeText = 'SUBMITTED';
                } else if (isDraft) {
                  badgeColor = 'bg-neon-gold/10 text-neon-gold border-neon-gold/20';
                  badgeText = 'DRAFT SAVED';
                }

                return (
                  <div key={t.id} className="flex justify-between items-center text-xs py-1.5 border-b border-white/2 last:border-none">
                    <span className="font-bold text-white">{t.emoji} {t.abbr}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 border rounded-full ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Available Bench Selection Modal */}
      <AnimatePresence>
        {assigningSlot !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-border-custom flex justify-between items-center bg-void/50">
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">
                    {assigningSlot === 'impact' ? 'Assign Impact Player' : `Assign Player to Slot #${assigningSlot as number + 1}`}
                  </h3>
                  <p className="text-[10px] text-av-muted mt-0.5">Select a player from your purchased roster bench</p>
                </div>
                <button onClick={() => setAssigningSlot(null)} className="p-1 text-av-muted hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 border-b border-border-custom flex justify-between items-center gap-2">
                <span className="text-[10px] font-black uppercase text-av-muted shrink-0">Filter:</span>
                <div className="flex gap-1 overflow-x-auto">
                  {['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map(role => (
                    <button
                      key={role}
                      onClick={() => setModalRoleFilter(role as any)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all shrink-0 ${
                        modalRoleFilter === role ? 'bg-neon-gold text-midnight' : 'bg-void text-av-muted border border-white/5 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                {modalAvailableBench.length > 0 ? (
                  modalAvailableBench.map(player => (
                    <div
                      key={player.id}
                      onClick={() => handleAssignFromBench(player)}
                      className="bg-void/40 hover:bg-void/80 border border-white/5 hover:border-border-custom-hover p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-xl shrink-0">{player.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white uppercase tracking-wide truncate text-xs">{player.name}</span>
                            {player.overseas && (
                              <span className="text-[7px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold ${
                              player.role === 'BAT' ? 'text-neon-cyan' :
                              player.role === 'BOWL' ? 'text-neon-red' :
                              player.role === 'WK' ? 'text-neon-gold' :
                              'text-neon-purple'
                            }`}>{player.role}</span>
                            <span className="text-[9px] text-av-muted">OVR {player.overall}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-neon-green block">₹{player.soldPrice?.toFixed(2)} Cr</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-av-muted italic">
                    No available bench players match this filter
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border-custom bg-void/50 flex justify-end">
                <button
                  onClick={() => setAssigningSlot(null)}
                  className="bg-glass border border-border-custom hover:bg-glass-hover text-white text-xs px-4 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slot Actions Modal */}
      <AnimatePresence>
        {activeSlotAction !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {(() => {
                const isImpact = activeSlotAction === 'impact';
                const player = isImpact ? impactPlayer : playingXI[activeSlotAction as number];
                if (!player) return null;
                const isCaptain = captainId === player.id;
                const isVC = viceCaptainId === player.id;

                return (
                  <>
                    <div className="p-5 border-b border-border-custom bg-void/50 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{player.flag}</span>
                          <span className="font-extrabold text-sm text-white uppercase tracking-wide truncate max-w-[180px]">{player.name}</span>
                          {player.overseas && (
                            <span className="text-[7px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                          )}
                        </div>
                        <p className="text-[10px] text-av-muted mt-1 font-bold uppercase tracking-wider font-mono">
                          {isImpact ? 'Impact Player' : `Slot #${(activeSlotAction as number) + 1}`} • OVR {player.overall}
                        </p>
                      </div>
                      <button onClick={() => setActiveSlotAction(null)} className="p-1 text-av-muted hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-2 bg-void/20">
                      <button
                        onClick={() => {
                          setAssigningSlot(activeSlotAction);
                          setActiveSlotAction(null);
                        }}
                        className="w-full bg-glass hover:bg-glass-hover text-white py-3 px-4 rounded-xl text-xs font-bold transition-all border border-border-custom text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>🔄 Replace / Select from Bench</span>
                        <ChevronRight className="h-4 w-4 text-av-muted" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedForSwap(activeSlotAction);
                          setActiveSlotAction(null);
                        }}
                        className="w-full bg-glass hover:bg-glass-hover text-white py-3 px-4 rounded-xl text-xs font-bold transition-all border border-border-custom text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>⇆ Swap with another Slot</span>
                        <ChevronRight className="h-4 w-4 text-av-muted" />
                      </button>

                      {!isImpact && (
                        <button
                          onClick={() => {
                            handleSetCaptain(player.id);
                            setActiveSlotAction(null);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                            isCaptain ? 'bg-neon-gold/10 border-neon-gold/30 text-neon-gold' : 'bg-glass border-border-custom text-white hover:bg-glass-hover'
                          }`}
                        >
                          <span>👑 {isCaptain ? 'Captain (C) Assigned' : 'Make Captain (C)'}</span>
                          {isCaptain && <Check className="h-4 w-4 text-neon-gold" />}
                        </button>
                      )}

                      {!isImpact && (
                        <button
                          onClick={() => {
                            handleSetViceCaptain(player.id);
                            setActiveSlotAction(null);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                            isVC ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : 'bg-glass border-border-custom text-white hover:bg-glass-hover'
                          }`}
                        >
                          <span>⭐ {isVC ? 'Vice-Captain (VC) Assigned' : 'Make Vice-Captain (VC)'}</span>
                          {isVC && <Check className="h-4 w-4 text-neon-cyan" />}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          handleRemovePlayer(activeSlotAction);
                          setActiveSlotAction(null);
                        }}
                        className="w-full bg-void hover:bg-neon-red/10 hover:text-neon-red py-3 px-4 rounded-xl text-xs font-bold transition-all border border-neon-red/25 text-neon-red text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>❌ Remove from Lineup</span>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-4 border-t border-border-custom bg-void/50 flex justify-end">
                      <button
                        onClick={() => setActiveSlotAction(null)}
                        className="bg-glass border border-border-custom hover:bg-glass-hover text-white text-xs px-4 py-2 rounded-lg font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
