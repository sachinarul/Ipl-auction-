'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { PlayerRole, Player } from '@/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ArrowRight, User, Users, Landmark, Coins, Award, Sparkles, CheckCircle, Trophy,
  Crown, Play, Lock, Unlock, RefreshCw, AlertCircle, Trash2, Eye, Download, Info, BarChart2, Check, X,
  ChevronRight, ArrowUpDown, HelpCircle, Star, Sparkle, Sliders
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function FranchiseHQ() {
  const router = useRouter();
  const { 
    userTeamId, 
    teams, 
    phase,
    submittedTeams,
    aiRankings,
    rankingsPublished,
    lockedRankings,
    submitTeam,
    triggerAdminAction,
    isAdmin
  } = useAuctionStore();

  const [activeTab, setActiveTab] = useState<'roster' | 'lineup' | 'rankings'>('roster');
  const [roleFilter, setRoleFilter] = useState<'ALL' | PlayerRole>('ALL');

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

  // Rankings States
  const [selectedRankedTeam, setSelectedRankedTeam] = useState<string>('');
  const [compareTeamA, setCompareTeamA] = useState<string>('');
  const [compareTeamB, setCompareTeamB] = useState<string>('');

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

  // Set tab based on URL search params safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'lineup') {
        setActiveTab('lineup');
      } else if (tab === 'rankings') {
        setActiveTab('rankings');
      } else if (tab === 'roster') {
        setActiveTab('roster');
      }
    }
  }, []);

  // Sync submitted team state
  useEffect(() => {
    const targetTeamId = viewedTeamId || userTeamId;
    if (targetTeamId && submittedTeams[targetTeamId]) {
      const submission = submittedTeams[targetTeamId];
      if (submission.submitted) {
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
        setSubmittedLocal(true);
      } else {
        if (!isOwnTeam) {
          setPlayingXI(Array(11).fill(null));
          setImpactPlayer(null);
          setCaptainId(null);
          setViceCaptainId(null);
        }
        setSubmittedLocal(false);
      }
    } else {
      if (!isOwnTeam) {
        setPlayingXI(Array(11).fill(null));
        setImpactPlayer(null);
        setCaptainId(null);
        setViceCaptainId(null);
      }
      setSubmittedLocal(false);
    }
  }, [submittedTeams, viewedTeamId, userTeamId, isOwnTeam]);

  // Select initial ranked team and compare teams
  useEffect(() => {
    if (aiRankings && aiRankings.length > 0) {
      if (!selectedRankedTeam) {
        const hasUserTeam = aiRankings.some(r => r.teamId === userTeamId);
        setSelectedRankedTeam(hasUserTeam ? userTeamId! : aiRankings[0].teamId);
      }
      if (aiRankings.length >= 2) {
        if (!compareTeamA) setCompareTeamA(aiRankings[0].teamId);
        if (!compareTeamB) setCompareTeamB(aiRankings[1].teamId);
      }
    }
  }, [aiRankings, userTeamId, selectedRankedTeam, compareTeamA, compareTeamB]);

  if (!userTeamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight text-av-text">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-sm">
          <ShieldAlert className="h-12 w-12 text-neon-gold mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">Lobby Team Required</h2>
          <p className="text-sm text-av-muted mb-6">Select your franchise team in the lobby before viewing headquarters.</p>
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

  const userTeam = teams.find((t) => t.id === (viewedTeamId || userTeamId));
  const squad = userTeam ? userTeam.squad : [];

  const filteredSquad = squad.filter((player) => {
    if (roleFilter === 'ALL') return true;
    return player.role === roleFilter;
  });

  const purse = userTeam ? userTeam.purse : 120.0;
  const totalSpent = 120.0 - purse;
  const overseasCount = squad.filter((p) => p.overseas).length;
  const battingOVR = squad.length > 0 ? Math.round(squad.reduce((sum, p) => sum + p.batting, 0) / squad.length) : 0;
  const bowlingOVR = squad.length > 0 ? Math.round(squad.reduce((sum, p) => sum + p.bowling, 0) / squad.length) : 0;

  // BCCI Mega Auction squad requirements
  const wkCount = squad.filter(p => p.role === 'WK').length;
  const batCount = squad.filter(p => p.role === 'BAT').length;
  const bowlCount = squad.filter(p => p.role === 'BOWL').length;
  const arCount = squad.filter(p => p.role === 'AR').length;

  const requirements = [
    { label: 'Wicketkeeper (WK)', current: wkCount, target: 1, color: 'text-neon-gold' },
    { label: 'Batsmen (BAT)', current: batCount, target: 5, color: 'text-neon-cyan' },
    { label: 'Bowlers (BOWL)', current: bowlCount, target: 5, color: 'text-neon-red' },
    { label: 'All Rounders (AR)', current: arCount, target: 2, color: 'text-neon-purple' },
  ];

  // Dynamic recommendations builder
  const getAIRecommendations = () => {
    const list = [];
    if (wkCount < 1) {
      list.push("Priority: Acquire a high-OVR Wicketkeeper (WK). Your squad currently has no gloves.");
    }
    if (batCount < 5) {
      list.push(`Need ${5 - batCount} more Batsmen to build top-order batting depth.`);
    }
    if (bowlCount < 5) {
      list.push(`Need ${5 - bowlCount} more Bowlers to satisfy bowling quotas.`);
    }
    if (arCount < 2) {
      list.push(`Need ${2 - arCount} All-Rounders to balance team chemistry.`);
    }
    if (overseasCount >= 8) {
      list.push("Overseas limit reached (8 max). Target capped Indian domestic players.");
    } else if (overseasCount < 4 && squad.length > 10) {
      list.push("Tip: Bidding on overseas fast bowlers or finishers will expand your overseas stars.");
    }

    if (list.length === 0) {
      list.push("Squad meets all minimum BCCI draft quotas! Focus on strategic upgrades with remaining capital.");
    }
    return list;
  };

  // Lineup Builder Actions
  const handleAutofill = () => {
    if (!squad || squad.length === 0) return;
    const sorted = [...squad].sort((a, b) => b.overall - a.overall);
    const xi = Array(11).fill(null);
    const wks = sorted.filter(p => p.role === 'WK');
    let osCount = 0;
    let xiIdx = 0;

    // Pick best WK first
    const bestWK = wks[0];
    if (bestWK) {
      xi[xiIdx++] = bestWK;
      if (bestWK.overseas) osCount++;
    }

    // Pick remaining players up to 4 overseas
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

    // Backfill if not full
    if (xiIdx < 11) {
      for (const p of sorted) {
        if (xiIdx >= 11) break;
        if (xi.some(x => x && x.id === p.id)) continue;
        xi[xiIdx++] = p;
      }
    }

    setPlayingXI(xi);

    // Pick best remaining as Impact Player
    const bench = sorted.filter(p => !xi.some(x => x && x.id === p.id));
    setImpactPlayer(bench[0] || null);

    // Assign Captain and Vice Captain
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

  // Click-to-Swap & Bench Assignment
  const handleSlotClick = (index: number | 'impact') => {
    if (submittedLocal || !isOwnTeam) return;

    const playerInSlot = index === 'impact' ? impactPlayer : playingXI[index];

    if (selectedForSwap !== null) {
      // Execute Swap
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

  // Drag and Drop
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
    submitTeam(xiPlayers, impactPlayer!, captainId!, viceCaptainId!, (res) => {
      if (res.success) {
        setSubmittedLocal(true);
      } else {
        alert(`Failed to submit lineup: ${res.reason}`);
      }
    });
  };

  // Bench players filter list
  const availableBench = squad.filter(p => {
    const inXI = playingXI.some(x => x && x.id === p.id);
    const inImpact = impactPlayer && impactPlayer.id === p.id;
    return !inXI && !inImpact;
  });

  const modalAvailableBench = availableBench.filter(p => {
    if (modalRoleFilter === 'ALL') return true;
    return p.role === modalRoleFilter;
  });

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Selected Rankings stats
  const activeRankedStats = aiRankings?.find(r => r.teamId === selectedRankedTeam);
  
  // Team comparison targets
  const statsA = aiRankings?.find(r => r.teamId === compareTeamA);
  const statsB = aiRankings?.find(r => r.teamId === compareTeamB);

  // Department scores mapper for charts
  const departments = [
    { label: 'Overall Rating', key: 'overallScore', max: 100 },
    { label: 'Batting Strength', key: 'battingScore', max: 10 },
    { label: 'Bowling Strength', key: 'bowlingScore', max: 10 },
    { label: 'All-Rounder Quality', key: 'arScore', max: 10 },
    { label: 'Wicketkeeping Quality', key: 'wkScore', max: 10 },
    { label: 'Impact Player Value', key: 'impactScore', max: 10 },
  ];

  // Tournament predictions
  const winnerTeam = aiRankings && aiRankings[0];
  const runnerUpTeam = aiRankings && aiRankings[1];
  const woodenSpoonTeam = aiRankings && aiRankings[aiRankings.length - 1];
  const playoffsTeams = aiRankings && aiRankings.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-av-text">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 space-y-6 print:py-0">
        
        {/* HQ Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderColor: `${userTeam?.primaryColor || '#ffffff'}30`,
            background: `linear-gradient(135deg, ${userTeam?.primaryColor || '#ffffff'}10 0%, #080714 100%)`,
          }}
          className="glass-panel border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 print:border-none print:bg-none print:p-0"
        >
          <div className="flex items-center space-x-4">
            <span className="text-5xl sm:text-6xl print:text-4xl">{userTeam?.emoji || '💛'}</span>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase print:text-xl print:text-black">
                  {userTeam?.name || 'Franchise Headquarters'}
                </h1>
                
                {/* Team Selector Dropdown */}
                {teams && teams.length > 0 && (
                  <select
                    value={viewedTeamId}
                    onChange={(e) => setViewedTeamId(e.target.value)}
                    className="bg-void border border-border-custom px-3 py-1 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-neon-gold print:hidden max-w-[220px] cursor-pointer"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.emoji} {t.name} {t.id === userTeamId ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs sm:text-sm text-av-muted font-semibold mt-1 print:hidden">
                Franchise Strategy:{' '}
                <span className="text-neon-gold uppercase font-bold">{userTeam?.strategy || 'balanced'} AI core</span>
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-center print:text-black">
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold tracking-wider block print:text-[8px]">Remaining Purse</span>
              <span className="text-xl sm:text-2xl font-black text-neon-green mt-0.5 block print:text-base print:text-black">
                ₹{purse.toFixed(2)} Cr
              </span>
            </div>
            <div className="w-px bg-border-custom self-stretch print:bg-black/10" />
            <div>
              <span className="text-[10px] text-av-muted uppercase font-bold tracking-wider block print:text-[8px]">Squad Strength</span>
              <span className="text-xl sm:text-2xl font-black text-neon-cyan mt-0.5 block print:text-base print:text-black">
                {squad.length} / 25
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tab Selection Bar */}
        <div className="grid grid-cols-3 border-b border-border-custom text-center print:hidden">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 font-bold text-xs sm:text-sm uppercase tracking-wider relative transition-colors ${
              activeTab === 'roster' ? 'text-white' : 'text-av-muted hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Squad Roster</span>
            <span className="sm:hidden">Roster</span>
            {activeTab === 'roster' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-gold" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('lineup')}
            className={`py-3 font-bold text-xs sm:text-sm uppercase tracking-wider relative transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === 'lineup' ? 'text-white' : 'text-av-muted hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Submit Playing XI</span>
            <span className="sm:hidden">Playing XI</span>
            {squad.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                submittedLocal 
                  ? 'bg-neon-green/20 text-neon-green' 
                  : 'bg-neon-gold/20 text-neon-gold'
              }`}>
                {submittedLocal ? '✓' : '!'}
              </span>
            )}
            {activeTab === 'lineup' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-gold" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`py-3 font-bold text-xs sm:text-sm uppercase tracking-wider relative transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === 'rankings' ? 'text-white' : 'text-av-muted hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">AI Power Rankings</span>
            <span className="sm:hidden">Rankings</span>
            {aiRankings && (
              <span className="bg-neon-green/20 text-neon-green text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                ✓
              </span>
            )}
            {activeTab === 'rankings' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-gold" />
            )}
          </button>
        </div>

        {/* ==================== TAB 1: ROSTER ==================== */}
        {activeTab === 'roster' && (
          <div className="space-y-6 print:hidden">
            {/* Call-to-action to build Playing XI */}
            {squad.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center space-x-2.5 text-xs text-left">
                  <Sparkle className="h-5 w-5 text-neon-cyan animate-pulse shrink-0" />
                  <div>
                    <span className="font-bold text-white uppercase block">Playing XI Lineup Builder</span>
                    <span className="text-av-muted">
                      {submittedLocal 
                        ? `${isOwnTeam ? "Your team" : "This team"} has submitted their matchday Playing XI. View projections in the AI Power Rankings tab!`
                        : `Draft and submit ${isOwnTeam ? "your" : "this team's"} Playing XI & Impact Player to enable power rankings standings simulation.`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('lineup')}
                  className="bg-neon-cyan text-midnight px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <span>{submittedLocal ? "View Lineup" : "Build Playing XI"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {/* Post-Auction Franchise Report */}
            {squad.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 bg-gradient-to-r from-neon-gold/5 to-transparent border border-neon-gold/20">
                <h3 className="text-sm font-black uppercase tracking-wider text-neon-gold flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4" />
                  FRANCHISE REPORT
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {(() => {
                    const topBuy = [...squad].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];
                    return (
                      <div className="bg-void/30 p-3 rounded-xl border border-white/5">
                        <div className="text-av-muted uppercase font-bold tracking-wider text-[9px] mb-1">Top Buy</div>
                        <div className="font-black text-white truncate text-xs">{topBuy?.name || 'N/A'}</div>
                        <div className="text-neon-gold font-bold mt-0.5">{topBuy ? `₹${topBuy.soldPrice?.toFixed(2)} Cr` : ''}</div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const bestValue = [...squad].filter(p => p.soldPrice && p.soldPrice > 0).sort((a, b) => (b.overall / (b.soldPrice || 1)) - (a.overall / (a.soldPrice || 1)))[0];
                    return bestValue ? (
                      <div className="bg-void/30 p-3 rounded-xl border border-white/5">
                        <div className="text-av-muted uppercase font-bold tracking-wider text-[9px] mb-1">Best Value</div>
                        <div className="font-black text-white truncate text-xs">{bestValue.name}</div>
                        <div className="text-neon-green font-bold mt-0.5">OVR {bestValue.overall}</div>
                      </div>
                    ) : null;
                  })()}
                  <div className="bg-void/30 p-3 rounded-xl border border-white/5">
                    <div className="text-av-muted uppercase font-bold tracking-wider text-[9px] mb-1">Squad OVR</div>
                    <div className="font-black text-2xl text-neon-gold">
                      {Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length)}
                    </div>
                    <div className="text-av-muted text-[9px]">Avg Rating</div>
                  </div>
                  <div className="bg-void/30 p-3 rounded-xl border border-white/5">
                    <div className="text-av-muted uppercase font-bold tracking-wider text-[9px] mb-1">Total Spent</div>
                    <div className="font-black text-neon-red text-sm">₹{totalSpent.toFixed(2)} Cr</div>
                    <div className="text-av-muted text-[9px]">{squad.length} players</div>
                  </div>
                </div>
              </div>
            )}

            {/* BCCI requirements & AI advisor alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Squad Requirement tracker */}
              <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-neon-cyan" />
                  <span>BCCI Squad Requirements Check</span>
                </h3>

                <div className="space-y-3">
                  {requirements.map((req) => {
                    const percent = Math.min(100, (req.current / req.target) * 100);
                    const isMet = req.current >= req.target;
                    return (
                      <div key={req.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-av-text">{req.label}</span>
                          <span className="text-av-muted">
                            <span className={req.color}>{req.current}</span> / {req.target} {isMet && '✅'}
                          </span>
                        </div>
                        <div className="w-full bg-void h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isMet ? 'bg-neon-green' : 'bg-neon-gold'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Advisor alerts */}
              <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-neon-gold" />
                  <span>Franchise AI Advisor</span>
                </h3>

                <div className="space-y-2">
                  {getAIRecommendations().map((rec, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs text-av-muted bg-void/30 p-2.5 rounded-xl border border-white/5">
                      <CheckCircle className="h-4 w-4 text-neon-gold shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Squad Performance KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
                <Coins className="h-5 w-5 text-neon-gold shrink-0" />
                <div>
                  <span className="text-[10px] text-av-muted uppercase font-bold block">Total Spent</span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                    ₹{totalSpent.toFixed(2)} Cr
                  </span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
                <Users className="h-5 w-5 text-neon-cyan shrink-0" />
                <div>
                  <span className="text-[10px] text-av-muted uppercase font-bold block">Overseas Slots</span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                    {overseasCount} / 8 Limit
                  </span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
                <Award className="h-5 w-5 text-neon-green shrink-0" />
                <div>
                  <span className="text-[10px] text-av-muted uppercase font-bold block">Squad Batting Rating</span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                    {battingOVR} / 99
                  </span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl flex items-center space-x-3">
                <Award className="h-5 w-5 text-neon-red shrink-0" />
                <div>
                  <span className="text-[10px] text-av-muted uppercase font-bold block">Squad Bowling Rating</span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block">
                    {bowlingOVR} / 99
                  </span>
                </div>
              </div>
            </div>

            {/* Roster Table */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  Franchise Squad Roster
                </h2>
                
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                        roleFilter === role
                          ? 'bg-neon-gold text-midnight neon-glow-gold'
                          : 'border border-border-custom bg-glass text-av-muted hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {filteredSquad.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom text-xs uppercase text-av-muted font-bold tracking-wider">
                        <th className="pb-3 font-semibold">Player</th>
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold text-center">OVR</th>
                        <th className="pb-3 font-semibold text-center hidden md:table-cell">Matches</th>
                        <th className="pb-3 font-semibold text-center hidden md:table-cell">Career Stats</th>
                        <th className="pb-3 font-semibold hidden lg:table-cell">Style</th>
                        <th className="pb-3 font-semibold text-right">Sold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom/50">
                      {filteredSquad.map((player) => (
                        <tr key={player.id} className="hover:bg-white/2 transition-colors duration-200">
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{player.flag}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white uppercase tracking-wide text-xs">{player.name}</span>
                                  {player.overseas && (
                                    <span className="text-[8px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase">OS</span>
                                  )}
                                </div>
                                {(player as any).iplExperience && (
                                  <div className="text-[9px] text-av-muted">{(player as any).iplExperience}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                player.role === 'BAT' ? 'bg-neon-cyan/10 text-neon-cyan' :
                                player.role === 'BOWL' ? 'bg-neon-red/10 text-neon-red' :
                                player.role === 'WK' ? 'bg-neon-gold/10 text-neon-gold' :
                                'bg-neon-purple/10 text-neon-purple'
                              }`}>
                                {player.role}
                              </span>
                              {(player as any).subRole && (
                                <div className="text-[9px] text-av-muted mt-0.5">{(player as any).subRole}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-neon-gold text-sm">{player.overall}</td>
                          <td className="py-3 text-center hidden md:table-cell text-av-text text-xs">
                            {(player as any).matches || '-'}
                          </td>
                          <td className="py-3 text-center hidden md:table-cell">
                            {player.role === 'BOWL' ? (
                              <div>
                                <div className="text-xs font-bold text-neon-red">{(player as any).wickets || 0} wkts</div>
                                <div className="text-[9px] text-av-muted">Eco: {((player as any).economy)?.toFixed(2) || 'N/A'}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs font-bold text-neon-cyan">{(player as any).runs || 0} runs</div>
                                <div className="text-[9px] text-av-muted">SR: {((player as any).strikeRate)?.toFixed(1) || 'N/A'}</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 hidden lg:table-cell">
                            <div className="text-[9px] text-av-muted space-y-0.5">
                              {(player as any).battingStyle && <div>🪦 {(player as any).battingStyle}</div>}
                              {(player as any).bowlingStyle && (player as any).bowlingStyle !== 'N/A' && <div>🏏 {(player as any).bowlingStyle}</div>}
                            </div>
                          </td>
                          <td className="py-3 text-right font-extrabold text-neon-green text-xs">
                            ₹{player.soldPrice?.toFixed(2)} Cr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-glass flex items-center justify-center border border-border-custom">
                    <User className="h-6 w-6 text-av-muted" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">No Players Found</h3>
                    <p className="text-xs text-av-muted mt-1 max-w-xs">
                      {roleFilter === 'ALL'
                        ? 'Your squad is currently empty. Go to the Auction Arena to purchase players.'
                        : `No players match the ${roleFilter} role filter.`}
                    </p>
                  </div>
                  {roleFilter === 'ALL' && (
                    <button
                      onClick={() => router.push('/auction')}
                      className="bg-neon-gold text-midnight px-4 py-2 rounded-lg font-bold text-xs"
                    >
                      Enter Arena
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: LINEUP BUILDER ==================== */}
        {activeTab === 'lineup' && (
          <div className="space-y-6 print:hidden">
            {squad.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 bg-neon-gold/10 border border-neon-gold/20 rounded-full flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-neon-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wide">Squad is Empty</h2>
                  <p className="text-sm text-av-muted mt-1 max-w-sm mx-auto">
                    You have not purchased any players in the auction yet. Go to the Auction Arena to buy players before submitting your matchday Playing XI.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/auction')}
                  className="bg-neon-gold text-midnight px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center space-x-2"
                >
                  <span>Go to Auction Arena</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Playing XI Grid (Left Column) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center bg-void/30 p-4 rounded-xl border border-white/5">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-neon-cyan" />
                        <span>Matchday Playing XI Squad</span>
                      </h2>
                      <p className="text-[10px] text-av-muted mt-0.5">Drag & drop or tap to swap players and set batting order</p>
                    </div>

                    {!submittedLocal && isOwnTeam && (
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

                  {/* Playing XI Slot list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className={`glass-panel p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? 'border-neon-gold bg-neon-gold/5 shadow-[0_0_15px_rgba(245,197,24,0.1)]' 
                              : player 
                                ? 'border-border-custom hover:border-border-custom-hover' 
                                : 'border-dashed border-border-custom/50 bg-void/10 hover:border-neon-cyan/40 hover:bg-neon-cyan/2'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="text-xs font-black text-av-muted w-5 text-right shrink-0">#{idx + 1}</span>
                            {player ? (
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{player.flag}</span>
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
                                  }`}>
                                    {player.role}
                                  </span>
                                  <span className="text-[9px] text-av-muted">OVR {player.overall}</span>
                                  {isCaptain && <span className="bg-neon-gold text-midnight text-[8px] px-1.5 py-0.2 rounded font-black shrink-0">CAPT</span>}
                                  {isVC && <span className="bg-neon-cyan text-midnight text-[8px] px-1.5 py-0.2 rounded font-black shrink-0">VC</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-av-muted italic">Empty Slot</div>
                            )}
                          </div>

                          {player && !submittedLocal && isOwnTeam && (
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleSetCaptain(player.id)}
                                title="Set Captain"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isCaptain ? 'bg-neon-gold/20 text-neon-gold' : 'text-av-muted hover:text-white'
                                }`}
                              >
                                <Crown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleSetViceCaptain(player.id)}
                                title="Set Vice Captain"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isVC ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-av-muted hover:text-white'
                                }`}
                              >
                                <Star className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemovePlayer(idx)}
                                title="Remove Player"
                                className="p-1.5 text-av-muted hover:text-neon-red transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
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
                      className={`glass-panel p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 col-span-1 sm:col-span-2 ${
                        selectedForSwap === 'impact' 
                          ? 'border-neon-purple bg-neon-purple/5 shadow-[0_0_15px_rgba(180,79,255,0.1)]' 
                          : impactPlayer 
                            ? 'border-neon-purple/30 hover:border-neon-purple/60' 
                            : 'border-dashed border-neon-purple/30 bg-void/10 hover:border-neon-purple/60 hover:bg-neon-purple/2'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-xs font-black text-neon-purple shrink-0">IMPACT</span>
                        {impactPlayer ? (
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{impactPlayer.flag}</span>
                              <span className="font-bold text-white uppercase tracking-wide truncate text-xs">{impactPlayer.name}</span>
                              {impactPlayer.overseas && (
                                <span className="text-[7px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-bold ${
                                impactPlayer.role === 'BAT' ? 'text-neon-cyan' :
                                impactPlayer.role === 'BOWL' ? 'text-neon-red' :
                                impactPlayer.role === 'WK' ? 'text-neon-gold' :
                                'text-neon-purple'
                              }`}>
                                {impactPlayer.role}
                              </span>
                              <span className="text-[9px] text-av-muted">OVR {impactPlayer.overall}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-neon-purple/50 italic">Assign Impact Player (Sub)</div>
                        )}
                      </div>

                      {impactPlayer && !submittedLocal && isOwnTeam && (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRemovePlayer('impact')}
                            title="Remove Impact Player"
                            className="p-1.5 text-av-muted hover:text-neon-red transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Validation & Submit Panel (Right Column) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Validation Box */}
                  <div className="glass-panel p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-neon-green" />
                      <span>Lineup Submission Rules</span>
                    </h3>

                    <div className="space-y-3">
                      {/* 11 Players Check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-av-muted">Playing XI Size</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{xiCountVal} / 11 Players</span>
                          <span>{xiCountVal === 11 ? '✅' : '❌'}</span>
                        </div>
                      </div>

                      {/* 1 WK Check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-av-muted">Specialist Wicketkeeper</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{wkCountVal} selected</span>
                          <span>{wkCountVal >= 1 ? '✅' : '❌'}</span>
                        </div>
                      </div>

                      {/* 4 Overseas Check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-av-muted">Overseas Players in XI</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{osCountVal} / 4 Limit</span>
                          <span>{osCountVal <= 4 ? '✅' : '❌'}</span>
                        </div>
                      </div>

                      {/* Impact Player Check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-av-muted">Impact Player assigned</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{impactPlayer ? 'Yes' : 'No'}</span>
                          <span>{impactPlayer ? '✅' : '❌'}</span>
                        </div>
                      </div>

                      {/* Captain Check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-av-muted">Captain (C) Selected</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{captainId && xiPlayers.some(p => p.id === captainId) ? 'Yes' : 'No'}</span>
                          <span>{captainId && xiPlayers.some(p => p.id === captainId) ? '✅' : '❌'}</span>
                        </div>
                      </div>

                      {/* Vice Captain Check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-av-muted">Vice-Captain (VC) Selected</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{viceCaptainId && xiPlayers.some(p => p.id === viceCaptainId) ? 'Yes' : 'No'}</span>
                          <span>{viceCaptainId && xiPlayers.some(p => p.id === viceCaptainId) ? '✅' : '❌'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-border-custom/50" />

                    {submittedLocal ? (
                      <div className="space-y-3">
                        <div className="bg-neon-green/10 border border-neon-green/30 p-3 rounded-xl flex items-start space-x-2 text-xs text-neon-green">
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold uppercase tracking-wide">Squad Submitted</div>
                            <div className="text-av-muted text-[10px] mt-0.5">This squad is official. Waiting for other managers to submit or final rankings generation.</div>
                          </div>
                        </div>

                        {!lockedRankings && !rankingsPublished && isOwnTeam && (
                          <button
                            onClick={() => setSubmittedLocal(false)}
                            className="w-full bg-glass hover:bg-glass-hover text-white text-xs py-2 rounded-lg font-bold border border-border-custom cursor-pointer"
                          >
                            Modify Lineup
                          </button>
                        )}
                      </div>
                    ) : (
                      isOwnTeam ? (
                        <button
                          onClick={handleSubmitSquad}
                          disabled={!isValidLineup}
                          className={`w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            isValidLineup 
                              ? 'bg-neon-green text-midnight neon-glow-green hover:scale-[1.02] cursor-pointer' 
                              : 'bg-glass border border-border-custom text-av-muted cursor-not-allowed'
                          }`}
                        >
                          Submit Squad Submission
                        </button>
                      ) : (
                        <div className="bg-glass border border-border-custom p-3 rounded-xl text-center text-xs text-av-muted font-bold">
                          Not Submitted by Franchise Owner
                        </div>
                      )
                    )}
                  </div>

                  {/* Available Bench list */}
                  <div className="glass-panel p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-neon-gold" />
                      <span>Available Squad Bench</span>
                    </h3>

                    {availableBench.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {availableBench.map(player => (
                          <div
                            key={player.id}
                            draggable
                            onDragStart={(e) => {
                              // Find if this player can be assigned
                              // By default, dragging from bench doesn't carry a slot index, but we can set custom metadata
                              e.dataTransfer.setData('sourceIndex', 'bench');
                              e.dataTransfer.setData('playerJson', JSON.stringify(player));
                            }}
                            className="bg-void/40 hover:bg-void/75 border border-white/5 hover:border-border-custom p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px]">{player.flag}</span>
                                <span className="font-bold text-white truncate max-w-[120px]">{player.name}</span>
                                {player.overseas && (
                                  <span className="text-[6px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-av-muted">OVR {player.overall}</span>
                                <span className="text-[9px] text-av-muted">{player.role}</span>
                              </div>
                            </div>

                            {!submittedLocal && isOwnTeam && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    // Assign to first empty Playing XI slot, or Impact slot
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
                                      alert("Your match squad is full! Swap players or remove one first.");
                                    }
                                  }}
                                  className="bg-neon-cyan/10 hover:bg-neon-cyan text-neon-cyan hover:text-midnight text-[9px] font-bold px-2 py-1 rounded transition-colors"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setImpactPlayer(player);
                                  }}
                                  className="bg-neon-purple/10 hover:bg-neon-purple text-neon-purple hover:text-white text-[9px] font-bold px-2 py-1 rounded transition-colors"
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
                        All squad players are in the matchday squad
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: POWER RANKINGS ==================== */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            
            {/* Rankings Not Generated View */}
            {!aiRankings ? (
              <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-4 print:hidden">
                <div className="h-16 w-16 bg-neon-gold/10 border border-neon-gold/20 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-neon-gold animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wide">AI Power Rankings Pending</h2>
                  <p className="text-sm text-av-muted mt-1 max-w-sm mx-auto">
                    Waiting for franchises to finalize and submit their Playing XIs. The BCCI AI engine will run statistical projections once teams submit.
                  </p>
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t border-border-custom/50 w-full max-w-sm flex flex-col space-y-2">
                    <span className="text-[10px] font-black uppercase text-neon-gold tracking-widest">Admin Control Override</span>
                    <button
                      onClick={() => triggerAdminAction('force-start-analysis')}
                      className="bg-neon-gold text-midnight py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1"
                    >
                      <Play className="h-3.5 w-3.5 fill-midnight" />
                      <span>Force Auto-Submit & Analyze</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Print Only Header */}
                <div className="hidden print:block text-center border-b border-black/15 pb-4 mb-6">
                  <h2 className="text-3xl font-extrabold text-black">AUCTIONVERSE OFFICIAL POWER RANKINGS</h2>
                  <p className="text-xs text-black/60 mt-1">AI-Engine Projections & Squad Analysis Report</p>
                </div>

                {/* Main Rankings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Leaderboard Table (Left Column) */}
                  <div className="lg:col-span-7 space-y-4 print:col-span-12">
                    <div className="flex justify-between items-center bg-void/30 p-4 rounded-xl border border-white/5 print:border-none print:p-0">
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 print:text-black">
                          <Trophy className="h-4 w-4 text-neon-gold" />
                          <span>AI Power Rankings Projections</span>
                        </h2>
                        <p className="text-[10px] text-av-muted mt-0.5 print:hidden">Projections calculated out of 100 based on squad strength parameters</p>
                      </div>

                      <button
                        onClick={handlePrintReport}
                        className="bg-glass border border-border-custom hover:bg-glass-hover text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 print:hidden"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export PDF</span>
                      </button>
                    </div>

                    <div className="glass-panel rounded-2xl overflow-hidden border border-border-custom print:border-black/15">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border-custom bg-void/50 text-xs uppercase text-av-muted font-bold tracking-wider print:bg-black/5 print:text-black">
                            <th className="py-3 px-4 text-center w-12 font-semibold">Pos</th>
                            <th className="py-3 px-4 font-semibold">Franchise Team</th>
                            <th className="py-3 px-4 text-center font-semibold">OVR Rating</th>
                            <th className="py-3 px-4 text-right font-semibold print:hidden">Submission</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom/50 print:divide-black/10 print:text-black">
                          {aiRankings.map((ranked, idx) => {
                            const isUser = ranked.teamId === userTeamId;
                            const isSelected = selectedRankedTeam === ranked.teamId;
                            const isSubmitted = submittedTeams[ranked.teamId]?.submitted;

                            return (
                              <tr 
                                key={ranked.teamId} 
                                onClick={() => setSelectedRankedTeam(ranked.teamId)}
                                className={`cursor-pointer transition-colors duration-200 ${
                                  isSelected 
                                    ? 'bg-neon-gold/5 border-l-4 border-l-neon-gold' 
                                    : 'hover:bg-white/2'
                                } print:hover:bg-transparent`}
                              >
                                <td className="py-3 px-4 text-center font-black">
                                  {idx + 1 === 1 ? '🥇' : idx + 1 === 2 ? '🥈' : idx + 1 === 3 ? '🥉' : idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xl shrink-0">{ranked.teamEmoji}</span>
                                    <div>
                                      <span className="font-bold text-white uppercase tracking-wide text-xs print:text-black">
                                        {ranked.teamName}
                                      </span>
                                      {isUser && (
                                        <span className="ml-2 bg-neon-cyan/20 text-neon-cyan text-[8px] font-black uppercase px-1 py-0.2 rounded shrink-0">YOU</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center font-extrabold text-neon-gold text-sm print:text-black">
                                  {ranked.overallScore}
                                </td>
                                <td className="py-3 px-4 text-right print:hidden">
                                  <span className={`text-[10px] font-bold ${
                                    isSubmitted ? 'text-neon-green' : 'text-neon-gold'
                                  }`}>
                                    {isSubmitted ? 'SUBMITTED' : 'AUTO-COMPLETED'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI insights of selected team (Right Column) */}
                  <div className="lg:col-span-5 space-y-4 print:col-span-12">
                    <div className="bg-void/30 p-4 rounded-xl border border-white/5 print:border-none print:p-0">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 print:text-black">
                        <BarChart2 className="h-4 w-4 text-neon-cyan" />
                        <span>Squad Performance Breakdown</span>
                      </h2>
                      <p className="text-[10px] text-av-muted mt-0.5 print:hidden">AI metrics evaluation for selected team</p>
                    </div>

                    {activeRankedStats ? (
                      <motion.div 
                        key={activeRankedStats.teamId}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          borderColor: `${activeRankedStats.primaryColor}40`,
                          background: `linear-gradient(135deg, ${activeRankedStats.primaryColor}08 0%, #080714 100%)`
                        }}
                        className="glass-panel border rounded-2xl p-5 space-y-5 print:border-black/15 print:bg-none print:text-black"
                      >
                        {/* Heading summary */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{activeRankedStats.teamEmoji}</span>
                            <div>
                              <h3 className="font-extrabold text-sm text-white uppercase print:text-black">{activeRankedStats.teamName}</h3>
                              <span className="text-[10px] text-av-muted font-bold block mt-0.5">
                                Predicted Finish: <span className="text-neon-gold">#{activeRankedStats.predictedPosition} Place</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-av-muted font-bold block uppercase">Power Rating</span>
                            <span className="text-2xl font-black text-neon-gold print:text-black">{activeRankedStats.overallScore}</span>
                          </div>
                        </div>

                        <div className="w-full h-px bg-border-custom/50 print:bg-black/10" />

                        {/* Projections breakdown */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-white print:text-black">Department Metrics (out of 10)</h4>
                          {[
                            { label: 'Batting Rating (25%)', score: activeRankedStats.battingScore, color: 'bg-neon-cyan' },
                            { label: 'Bowling Rating (25%)', score: activeRankedStats.bowlingScore, color: 'bg-neon-red' },
                            { label: 'All-Rounders Rating (15%)', score: activeRankedStats.arScore, color: 'bg-neon-purple' },
                            { label: 'Wicketkeeper Rating (5%)', score: activeRankedStats.wkScore, color: 'bg-neon-gold' },
                            { label: 'Impact Player Value (5%)', score: activeRankedStats.impactScore, color: 'bg-neon-green' }
                          ].map(metric => (
                            <div key={metric.label} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-av-muted print:text-black/70">{metric.label}</span>
                                <span className="text-white font-bold print:text-black">{metric.score} / 10</span>
                              </div>
                              <div className="w-full bg-void h-1.5 rounded-full overflow-hidden border border-white/5 print:border-black/5">
                                <div 
                                  className={`h-full rounded-full ${metric.color}`} 
                                  style={{ width: `${metric.score * 10}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="w-full h-px bg-border-custom/50 print:bg-black/10" />

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-neon-green tracking-wider block">Strengths</span>
                            <div className="space-y-1">
                              {activeRankedStats.strengths?.map((str, idx) => (
                                <span key={idx} className="inline-flex items-center text-[10px] font-bold text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full border border-neon-green/20 mr-1.5 mb-1.5">
                                  {str}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-neon-red tracking-wider block">Weaknesses</span>
                            <div className="space-y-1">
                              {activeRankedStats.weaknesses?.map((weak, idx) => (
                                <span key={idx} className="inline-flex items-center text-[10px] font-bold text-neon-red bg-neon-red/10 px-2 py-0.5 rounded-full border border-neon-red/20 mr-1.5 mb-1.5">
                                  {weak}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    ) : (
                      <div className="glass-panel p-6 text-center text-xs text-av-muted italic rounded-2xl">
                        Select a team on the leaderboard to display diagnostics
                      </div>
                    )}
                  </div>

                </div>

                {/* Tournament Projections */}
                <div className="space-y-4">
                  <div className="bg-void/30 p-4 rounded-xl border border-white/5 print:border-none print:p-0">
                    <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 print:text-black">
                      <Trophy className="h-4 w-4 text-neon-gold" />
                      <span>AI Championship Predictions</span>
                    </h2>
                    <p className="text-[10px] text-av-muted mt-0.5 print:hidden">Projections for simulated IPL season match outcomes</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    {/* Champion */}
                    <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center space-y-2 border-neon-gold/30 print:border-black/15 print:text-black">
                      <Crown className="h-8 w-8 text-neon-gold animate-bounce" />
                      <span className="text-[10px] text-av-muted uppercase font-black tracking-widest">Predicted Champion</span>
                      <span className="text-xl font-black">{winnerTeam?.teamEmoji} {winnerTeam?.teamAbbr}</span>
                      <span className="text-[11px] text-av-muted truncate max-w-full">{winnerTeam?.teamName}</span>
                    </div>

                    {/* Runner-up */}
                    <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center space-y-2 print:border-black/15 print:text-black">
                      <Trophy className="h-8 w-8 text-neon-cyan" />
                      <span className="text-[10px] text-av-muted uppercase font-black tracking-widest">Predicted Runner-Up</span>
                      <span className="text-xl font-black">{runnerUpTeam?.teamEmoji} {runnerUpTeam?.teamAbbr}</span>
                      <span className="text-[11px] text-av-muted truncate max-w-full">{runnerUpTeam?.teamName}</span>
                    </div>

                    {/* Playoffs */}
                    <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center space-y-2 print:border-black/15 print:text-black">
                      <Sparkles className="h-8 w-8 text-neon-green" />
                      <span className="text-[10px] text-av-muted uppercase font-black tracking-widest">Playoffs Contenders</span>
                      <div className="flex gap-2">
                        {playoffsTeams?.map(t => (
                          <span key={t.teamId} className="text-xs font-extrabold bg-void px-2 py-0.5 rounded border border-white/5 print:border-black/15 print:bg-none print:text-black" title={t.teamName}>
                            {t.teamEmoji} {t.teamAbbr}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-av-muted">Predicted Top 4 Bracket</span>
                    </div>

                    {/* Wooden Spoon */}
                    <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center space-y-2 print:border-black/15 print:text-black">
                      <AlertCircle className="h-8 w-8 text-neon-red" />
                      <span className="text-[10px] text-av-muted uppercase font-black tracking-widest">Wooden Spoon</span>
                      <span className="text-xl font-black">{woodenSpoonTeam?.teamEmoji} {woodenSpoonTeam?.teamAbbr}</span>
                      <span className="text-[11px] text-av-muted truncate max-w-full">{woodenSpoonTeam?.teamName}</span>
                    </div>
                  </div>
                </div>

                {/* Team Comparison Engine */}
                <div className="space-y-4 print:hidden">
                  <div className="bg-void/30 p-4 rounded-xl border border-white/5">
                    <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <BarChart2 className="h-4 w-4 text-neon-gold" />
                      <span>AI Team Comparison & Match Simulator</span>
                    </h2>
                    <p className="text-[10px] text-av-muted mt-0.5">Simulate match prediction between two franchises</p>
                  </div>

                  <div className="glass-panel rounded-2xl p-6 space-y-6">
                    {/* Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-av-muted tracking-wider">Select Team A</label>
                        <select
                          value={compareTeamA}
                          onChange={(e) => setCompareTeamA(e.target.value)}
                          className="w-full bg-void border border-border-custom px-4 py-2.5 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-neon-gold"
                        >
                          {aiRankings.map(r => (
                            <option key={r.teamId} value={r.teamId} disabled={r.teamId === compareTeamB}>
                              {r.teamEmoji} {r.teamName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-av-muted tracking-wider">Select Team B</label>
                        <select
                          value={compareTeamB}
                          onChange={(e) => setCompareTeamB(e.target.value)}
                          className="w-full bg-void border border-border-custom px-4 py-2.5 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-neon-gold"
                        >
                          {aiRankings.map(r => (
                            <option key={r.teamId} value={r.teamId} disabled={r.teamId === compareTeamA}>
                              {r.teamEmoji} {r.teamName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {statsA && statsB && (
                      <div className="space-y-6">
                        
                        {/* Simulation Result */}
                        <div className="bg-void/40 border border-white/5 p-4 rounded-xl text-center space-y-2">
                          <span className="text-[9px] font-black uppercase text-neon-gold tracking-widest block">AI Match Simulator Projections</span>
                          <div className="text-sm font-black text-white flex items-center justify-center gap-1.5">
                            {(() => {
                              const diff = statsA.overallScore - statsB.overallScore;
                              if (diff > 0) {
                                return (
                                  <>
                                    <span>🏆 {statsA.teamEmoji} {statsA.teamAbbr} is predicted to WIN by a margin of {diff.toFixed(1)} OVR</span>
                                  </>
                                );
                              } else if (diff < 0) {
                                return (
                                  <>
                                    <span>🏆 {statsB.teamEmoji} {statsB.teamAbbr} is predicted to WIN by a margin of {Math.abs(diff).toFixed(1)} OVR</span>
                                  </>
                                );
                              } else {
                                return <span>⚖️ Teams are perfectly matched! Super Over predicted.</span>;
                              }
                            })()}
                          </div>
                        </div>

                        {/* Comparison Bars */}
                        <div className="space-y-4">
                          {departments.map(dept => {
                            const valA = statsA[dept.key as keyof typeof statsA] as number;
                            const valB = statsB[dept.key as keyof typeof statsB] as number;

                            return (
                              <div key={dept.label} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                  <span style={{ color: statsA.primaryColor }}>{valA}</span>
                                  <span className="text-av-text uppercase tracking-wider text-[10px]">{dept.label}</span>
                                  <span style={{ color: statsB.primaryColor }}>{valB}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 h-2">
                                  {/* Team A bar (aligned right) */}
                                  <div className="w-full bg-void rounded-full overflow-hidden flex justify-end">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${(valA / dept.max) * 100}%`,
                                        backgroundColor: statsA.primaryColor || '#ffffff'
                                      }}
                                    />
                                  </div>
                                  {/* Team B bar (aligned left) */}
                                  <div className="w-full bg-void rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${(valB / dept.max) * 100}%`,
                                        backgroundColor: statsB.primaryColor || '#ffffff'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Strengths & Weaknesses Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3 bg-void/25 border border-white/5 p-4 rounded-xl">
                            <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: statsA.primaryColor }}>
                              {statsA.teamEmoji} {statsA.teamName} Diagnostics
                            </span>
                            <div className="space-y-2">
                              <div>
                                <span className="text-[8px] font-black text-neon-green uppercase block mb-1">Key Strengths</span>
                                {statsA.strengths?.map((s, i) => (
                                  <span key={i} className="inline-block text-[9px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full mr-1 mb-1">
                                    {s}
                                  </span>
                                ))}
                              </div>
                              <div>
                                <span className="text-[8px] font-black text-neon-red uppercase block mb-1">Weaknesses</span>
                                {statsA.weaknesses?.map((w, i) => (
                                  <span key={i} className="inline-block text-[9px] font-bold bg-neon-red/10 text-neon-red border border-neon-red/20 px-2 py-0.5 rounded-full mr-1 mb-1">
                                    {w}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 bg-void/25 border border-white/5 p-4 rounded-xl">
                            <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: statsB.primaryColor }}>
                              {statsB.teamEmoji} {statsB.teamName} Diagnostics
                            </span>
                            <div className="space-y-2">
                              <div>
                                <span className="text-[8px] font-black text-neon-green uppercase block mb-1">Key Strengths</span>
                                {statsB.strengths?.map((s, i) => (
                                  <span key={i} className="inline-block text-[9px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full mr-1 mb-1">
                                    {s}
                                  </span>
                                ))}
                              </div>
                              <div>
                                <span className="text-[8px] font-black text-neon-red uppercase block mb-1">Weaknesses</span>
                                {statsB.weaknesses?.map((w, i) => (
                                  <span key={i} className="inline-block text-[9px] font-bold bg-neon-red/10 text-neon-red border border-neon-red/20 px-2 py-0.5 rounded-full mr-1 mb-1">
                                    {w}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Dashboard Override Controls */}
                {isAdmin && (
                  <div className="space-y-4 print:hidden">
                    <div className="bg-void/30 p-4 rounded-xl border border-white/5">
                      <h2 className="text-sm font-black uppercase tracking-wider text-neon-gold flex items-center gap-1.5">
                        <Sliders className="h-4 w-4" />
                        <span>BCCI Tournament Director Dashboard</span>
                      </h2>
                      <p className="text-[10px] text-av-muted mt-0.5">Admin controls to lock rosters, force analysis, and publish standings</p>
                    </div>

                    <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => triggerAdminAction('generate-rankings')}
                        className="bg-glass border border-border-custom hover:bg-glass-hover text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-neon-cyan" />
                        <span>Generate Standing</span>
                      </button>

                      <button
                        onClick={() => triggerAdminAction('publish-rankings')}
                        className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 ${
                          rankingsPublished 
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 cursor-not-allowed' 
                            : 'bg-glass border border-border-custom hover:bg-glass-hover text-white'
                        }`}
                        disabled={rankingsPublished}
                      >
                        <Eye className="h-3.5 w-3.5 text-neon-green" />
                        <span>{rankingsPublished ? 'Published to Users' : 'Publish Result'}</span>
                      </button>

                      <button
                        onClick={() => triggerAdminAction('lock-rankings')}
                        className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 ${
                          lockedRankings 
                            ? 'bg-neon-red/20 text-neon-red border border-neon-red/30 cursor-not-allowed' 
                            : 'bg-glass border border-border-custom hover:bg-glass-hover text-white'
                        }`}
                        disabled={lockedRankings}
                      >
                        <Lock className="h-3.5 w-3.5 text-neon-red" />
                        <span>{lockedRankings ? 'Lineups Locked' : 'Lock Submission'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to reset all Playing XI submissions and AI Power Rankings?")) {
                            triggerAdminAction('reset-rankings');
                          }
                        }}
                        className="bg-glass border border-border-custom hover:bg-glass-hover text-neon-red py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Reset Standings</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

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
              {/* Modal Header */}
              <div className="p-4 border-b border-border-custom flex justify-between items-center bg-void/50">
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">
                    {assigningSlot === 'impact' ? 'Assign Impact Player' : `Assign Player to Slot #${assigningSlot as number + 1}`}
                  </h3>
                  <p className="text-[10px] text-av-muted mt-0.5">Select a player from your purchased roster bench</p>
                </div>
                <button
                  onClick={() => setAssigningSlot(null)}
                  className="p-1 text-av-muted hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Filter */}
              <div className="p-3 border-b border-border-custom flex justify-between items-center gap-2">
                <span className="text-[10px] font-black uppercase text-av-muted shrink-0">Filter:</span>
                <div className="flex gap-1 overflow-x-auto">
                  {['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map(role => (
                    <button
                      key={role}
                      onClick={() => setModalRoleFilter(role as any)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all shrink-0 ${
                        modalRoleFilter === role
                          ? 'bg-neon-gold text-midnight'
                          : 'bg-void text-av-muted border border-white/5 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal List */}
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
                            }`}>
                              {player.role}
                            </span>
                            <span className="text-[9px] text-av-muted">OVR {player.overall}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-neon-green block">₹{player.soldPrice?.toFixed(2)} Cr</span>
                        <span className="text-[8px] text-av-muted block uppercase mt-0.5">Auction Buy</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-av-muted italic">
                    No available bench players match this filter
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border-custom bg-void/50 flex justify-end gap-2">
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

      {/* Slot Actions Modal for Mobile / Quick Editing */}
      <AnimatePresence>
        {activeSlotAction !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
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
                          <span className="font-extrabold text-sm text-white uppercase tracking-wide truncate max-w-[180px]">
                            {player.name}
                          </span>
                          {player.overseas && (
                            <span className="text-[7px] px-1 bg-neon-cyan/20 text-neon-cyan rounded font-bold uppercase shrink-0">OS</span>
                          )}
                        </div>
                        <p className="text-[10px] text-av-muted mt-1 font-bold uppercase tracking-wider">
                          {isImpact ? 'Impact Player' : `Playing XI Slot #${(activeSlotAction as number) + 1}`} • OVR {player.overall}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveSlotAction(null)}
                        className="p-1 text-av-muted hover:text-white transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Actions List */}
                    <div className="p-4 space-y-2 bg-void/20">
                      {/* Replace Player */}
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

                      {/* Swap with another slot */}
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

                      {/* Set Captain (only for Playing XI) */}
                      {!isImpact && (
                        <button
                          onClick={() => {
                            handleSetCaptain(player.id);
                            setActiveSlotAction(null);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                            isCaptain 
                              ? 'bg-neon-gold/10 border-neon-gold/30 text-neon-gold' 
                              : 'bg-glass border-border-custom text-white hover:bg-glass-hover'
                          }`}
                        >
                          <span>👑 {isCaptain ? 'Captain (C) Assigned' : 'Make Captain (C)'}</span>
                          {isCaptain && <Check className="h-4 w-4 text-neon-gold" />}
                        </button>
                      )}

                      {/* Set Vice Captain (only for Playing XI) */}
                      {!isImpact && (
                        <button
                          onClick={() => {
                            handleSetViceCaptain(player.id);
                            setActiveSlotAction(null);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                            isVC 
                              ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' 
                              : 'bg-glass border-border-custom text-white hover:bg-glass-hover'
                          }`}
                        >
                          <span>⭐ {isVC ? 'Vice-Captain (VC) Assigned' : 'Make Vice-Captain (VC)'}</span>
                          {isVC && <Check className="h-4 w-4 text-neon-cyan" />}
                        </button>
                      )}

                      {/* Remove player */}
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

                    {/* Footer */}
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
