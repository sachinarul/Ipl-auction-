'use client';

import { useAuctionStore } from '@/store/auctionStore';
import { socket } from '@/lib/socket';
import { TEAMS_DB } from '@/lib/teams-db';
import { formatCr, formatCrShort, getNextBid } from '@/engine/BidIncrement';
import { PlayerRole, Player, TeamId } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Circle, User, ShieldAlert, Trophy, ArrowRight, Play, Volume2, Send, Pause, SkipForward, Ban, Power,
  Crown, Star, X, CheckCircle, Landmark, Users, AlertCircle, ChevronRight, Check, Trash2,
  Mic, MicOff, Headphones, VolumeX, Settings, PhoneOff
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import AuctionStatsModal from '@/components/shared/AuctionStatsModal';

export default function AuctionArena() {
  const router = useRouter();
  const {
    roomCode,
    roomType,
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
    currentIndex,
    submittedTeams,
    submitTeam,
    lockedRankings
  } = useAuctionStore();

  const [chatInput, setChatInput] = useState('');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'spotlight' | 'standings' | 'chat' | 'lineup'>('spotlight');
  const [selectedUnsoldIds, setSelectedUnsoldIds] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // View mode state: 'classic' | 'premium'
  const [viewMode, setViewMode] = useState<'classic' | 'premium'>('classic');

  // Camera angle view in premium mode: 'broadcast' | 'stage' | 'auctioneer' | 'spotlight' | 'teams'
  const [cameraView, setCameraView] = useState<'broadcast' | 'stage' | 'auctioneer' | 'spotlight' | 'teams'>('broadcast');

  // Confetti Canvas Ref
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger confetti canvas drawing
  const triggerConfetti = (teamColor: string | null) => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pieces: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      rot: number;
      vx: number;
      vy: number;
      vr: number;
      alpha: number;
    }> = [];

    const colors = teamColor
      ? [teamColor, '#D4AF37', '#ffffff', teamColor]
      : ['#D4AF37', '#FFD700', '#FF6B35', '#1a6fff', '#00c66b', '#ff3d5a', '#8b5cf6', '#ffffff'];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: 6 + Math.random() * 10,
        h: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vx: -3 + Math.random() * 6,
        vy: 3 + Math.random() * 5,
        vr: -4 + Math.random() * 8,
        alpha: 1,
      });
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      pieces.forEach((p) => {
        if (p.alpha <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vy += 0.12; // gravity
        if (p.y > canvas.height + 20) {
          p.alpha = 0;
          return;
        }
        if (frame > 80) p.alpha -= 0.012;
        alive = true;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frame++;
      if (alive) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    draw();
  };

  // Sound settings state
  const [settings, setSettings] = useState({
    auctionSound: true,
    voiceChat: false,
    countdownSound: true,
    hammerSound: true,
    notificationSound: true,
  });

  // Settings panel open/close
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // WebRTC voice chat states
  const [isVoiceJoined, setIsVoiceJoined] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState<Record<string, {
    socketId: string;
    name: string;
    teamId: string;
    isAdmin: boolean;
    muted: boolean;
    speaking: boolean;
  }>>({});
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [speakerVolume, setSpeakerVolume] = useState(0.8);

  // Refs for WebRTC connections and video elements (video forces loudspeaker routing on mobile)
  const pcs = useRef<Record<string, RTCPeerConnection>>({});
  const localStream = useRef<MediaStream | null>(null);
  const remoteVideos = useRef<Record<string, HTMLVideoElement>>({});
  const iceCandidatesQueue = useRef<Record<string, RTCIceCandidateInit[]>>({});

  // Speaking state detection refs
  const localAudioContext = useRef<AudioContext | null>(null);
  const localAnalyser = useRef<AnalyserNode | null>(null);
  const localSpeakingInterval = useRef<any>(null);

  // Unsold players for accelerated round
  const unsoldPlayers = playerQueue.filter(
    (p) => p.soldPrice === null && p.currentTeam === null && playerQueue.indexOf(p) < currentIndex
  );

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
  const [viewedTeamId, setViewedTeamId] = useState<string>('');

  const isOwnTeam = viewedTeamId === userTeamId || !viewedTeamId;

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  const updateRemoteVideosVolume = (muted: boolean, vol: number) => {
    Object.values(remoteVideos.current).forEach(video => {
      video.muted = muted;
      video.volume = vol;
    });
  };

  const toggleMic = () => {
    const nextVal = !micMuted;
    setMicMuted(nextVal);
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !nextVal;
      });
    }
    socket.emit('voice-mute-status', { roomCode, muted: nextVal });
  };

  const toggleSpeaker = () => {
    const nextVal = !speakerMuted;
    setSpeakerMuted(nextVal);
    updateRemoteVideosVolume(nextVal, speakerVolume);
  };

  const handleSpeakerVolumeChange = (vol: number) => {
    setSpeakerVolume(vol);
    updateRemoteVideosVolume(speakerMuted, vol);
  };

  const startSpeakingDetection = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      localAudioContext.current = ctx;
      localAnalyser.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeakingState = false;

      localSpeakingInterval.current = setInterval(() => {
        if (micMuted) {
          if (lastSpeakingState) {
            lastSpeakingState = false;
            socket.emit('voice-speaking-status', { roomCode, speaking: false });
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speaking = average > 12; // Speak threshold

        if (speaking !== lastSpeakingState) {
          lastSpeakingState = speaking;
          socket.emit('voice-speaking-status', { roomCode, speaking });
        }
      }, 150);
    } catch (err) {
      console.warn("Could not start volume detection:", err);
    }
  };

  const stopSpeakingDetection = () => {
    if (localSpeakingInterval.current) {
      clearInterval(localSpeakingInterval.current);
      localSpeakingInterval.current = null;
    }
    if (localAudioContext.current) {
      localAudioContext.current.close().catch(() => {});
      localAudioContext.current = null;
    }
    localAnalyser.current = null;
  };

  const cleanupPeer = (socketId: string) => {
    if (pcs.current[socketId]) {
      pcs.current[socketId].close();
      delete pcs.current[socketId];
    }
    if (remoteVideos.current[socketId]) {
      const video = remoteVideos.current[socketId];
      video.srcObject = null;
      video.remove();
      delete remoteVideos.current[socketId];
    }
    if (iceCandidatesQueue.current[socketId]) {
      delete iceCandidatesQueue.current[socketId];
    }
  };

  const createPeerConnection = (targetSocketId: string) => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcs.current[targetSocketId] = pc;

    // Add local tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    // Ice candidate callback
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice-signal', {
          targetSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    // Track event
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received track from ${targetSocketId}`);
      const stream = event.streams[0] || new MediaStream([event.track]);
      
      let video = remoteVideos.current[targetSocketId];
      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        // @ts-ignore
        video.setAttribute('playsinline', 'true');
        
        // Hide visually, but keep layout active to prevent Safari suspending playback
        video.style.position = 'fixed';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        video.style.left = '-100px';
        video.style.top = '-100px';
        
        document.body.appendChild(video);
        remoteVideos.current[targetSocketId] = video;
      }
      video.srcObject = stream;
      video.muted = speakerMuted;
      video.volume = speakerVolume;
      video.play().catch(err => console.warn("Video play failed:", err));
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === 'failed' ||
        pc.iceConnectionState === 'closed'
      ) {
        cleanupPeer(targetSocketId);
      }
    };

    return pc;
  };

  const joinVoiceChannel = async () => {
    if (isVoiceJoined || !roomCode) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStream.current = stream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !micMuted;
      });

      socket.emit('join-voice', { roomCode }, (res: any) => {
        if (res && res.success) {
          setIsVoiceJoined(true);
          
          const participantsMap: Record<string, any> = {};
          res.participants.forEach((p: any) => {
            participantsMap[p.socketId] = p;
          });
          setVoiceParticipants(participantsMap);

          res.others.forEach(async (otherSocketId: string) => {
            const pc = createPeerConnection(otherSocketId);
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('voice-signal', {
                targetSocketId: otherSocketId,
                signal: { sdp: offer }
              });
            } catch (err) {
              console.error("Error creating WebRTC offer:", err);
            }
          });

          startSpeakingDetection(stream);
          socket.emit('voice-mute-status', { roomCode, muted: micMuted });
        } else {
          console.warn("Failed to join voice channel:", res?.reason);
        }
      });
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  const leaveVoiceChannel = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    stopSpeakingDetection();
    
    Object.keys(pcs.current).forEach(socketId => {
      cleanupPeer(socketId);
    });
    pcs.current = {};
    iceCandidatesQueue.current = {};

    socket.emit('leave-voice', { roomCode });
    setIsVoiceJoined(false);
    setVoiceParticipants({});
  };

  // Listen to WebRTC voice events
  useEffect(() => {
    if (!roomCode) return;

    const handleUserJoinedVoice = ({ socketId, participant }: any) => {
      setVoiceParticipants(prev => ({
        ...prev,
        [socketId]: participant
      }));
    };

    const handleUserLeftVoice = ({ socketId }: any) => {
      cleanupPeer(socketId);
      setVoiceParticipants(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    const queueIceCandidate = (socketId: string, candidate: any) => {
      if (!iceCandidatesQueue.current[socketId]) {
        iceCandidatesQueue.current[socketId] = [];
      }
      iceCandidatesQueue.current[socketId].push(candidate);
    };

    const processQueuedIceCandidates = async (socketId: string, peerConn: RTCPeerConnection) => {
      const queue = iceCandidatesQueue.current[socketId];
      if (!queue || queue.length === 0) return;
      console.log(`[WebRTC] Processing ${queue.length} queued ICE candidates for ${socketId}`);
      for (const candidate of queue) {
        try {
          await peerConn.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ICE candidate:", e);
        }
      }
      iceCandidatesQueue.current[socketId] = [];
    };

    const handleVoiceSignal = async ({ senderSocketId, signal }: any) => {
      let pc = pcs.current[senderSocketId];

      if (signal.sdp) {
        if (signal.sdp.type === 'offer') {
          if (!pc) {
            pc = createPeerConnection(senderSocketId);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await processQueuedIceCandidates(senderSocketId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice-signal', { targetSocketId: senderSocketId, signal: { sdp: answer } });
        } else if (signal.sdp.type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await processQueuedIceCandidates(senderSocketId, pc);
          }
        }
      } else if (signal.candidate) {
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error("Error adding ICE candidate:", e);
          }
        } else {
          queueIceCandidate(senderSocketId, signal.candidate);
        }
      }
    };

    const handleUserVoiceMute = ({ socketId, muted }: any) => {
      setVoiceParticipants(prev => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: { ...prev[socketId], muted }
        };
      });
    };

    const handleUserVoiceSpeaking = ({ socketId, speaking }: any) => {
      setVoiceParticipants(prev => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: { ...prev[socketId], speaking }
        };
      });
    };

    const handleVoiceControlAction = ({ action }: any) => {
      if (action === 'mute-all') {
        setMicMuted(true);
        if (localStream.current) {
          localStream.current.getAudioTracks().forEach(track => {
            track.enabled = false;
          });
        }
        socket.emit('voice-mute-status', { roomCode, muted: true });
      } else if (action === 'disable-voice') {
        leaveVoiceChannel();
        setSettings(prev => ({ ...prev, voiceChat: false }));
      } else if (action === 'enable-voice') {
        setSettings(prev => ({ ...prev, voiceChat: true }));
      } else if (action === 'end-voice') {
        leaveVoiceChannel();
        setSettings(prev => ({ ...prev, voiceChat: false }));
      } else if (action === 'kick') {
        leaveVoiceChannel();
        alert("You have been removed from the voice channel by the admin.");
      }
    };

    socket.on('user-joined-voice', handleUserJoinedVoice);
    socket.on('user-left-voice', handleUserLeftVoice);
    socket.on('voice-signal', handleVoiceSignal);
    socket.on('user-voice-mute', handleUserVoiceMute);
    socket.on('user-voice-speaking', handleUserVoiceSpeaking);
    socket.on('voice-control-action', handleVoiceControlAction);

    return () => {
      socket.off('user-joined-voice', handleUserJoinedVoice);
      socket.off('user-left-voice', handleUserLeftVoice);
      socket.off('voice-signal', handleVoiceSignal);
      socket.off('user-voice-mute', handleUserVoiceMute);
      socket.off('user-voice-speaking', handleUserVoiceSpeaking);
      socket.off('voice-control-action', handleVoiceControlAction);
    };
  }, [roomCode, micMuted, speakerMuted, speakerVolume]);

  // Gesture listener to unlock audio/video playback on iOS/Safari
  useEffect(() => {
    const unlockAudio = () => {
      if (typeof window === 'undefined') return;
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA';
      audio.play().catch(err => console.warn("[WebRTC] Audio unlock failed:", err));
    };

    const handleGesture = () => {
      unlockAudio();
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchstart', handleGesture);
    };

    document.addEventListener('click', handleGesture);
    document.addEventListener('touchstart', handleGesture);

    return () => {
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Sync voiceChat setting from roomType (ON for private, OFF for public by default)
  useEffect(() => {
    if (roomType) {
      setSettings(prev => ({
        ...prev,
        voiceChat: roomType === 'private'
      }));
    }
  }, [roomType]);

  // Auto join / leave voice channel based on settings and room type
  useEffect(() => {
    if (roomCode && roomType === 'private' && settings.voiceChat) {
      joinVoiceChannel();
    } else {
      leaveVoiceChannel();
    }
    return () => {
      leaveVoiceChannel();
    };
  }, [roomCode, roomType, settings.voiceChat]);

  // Sync viewed team on load
  useEffect(() => {
    if (userTeamId && !viewedTeamId) {
      setViewedTeamId(userTeamId);
    }
  }, [userTeamId, viewedTeamId]);

  // Sync submitted team state and drafts
  useEffect(() => {
    const targetTeamId = viewedTeamId || userTeamId;
    if (!targetTeamId) return;

    const submission = submittedTeams[targetTeamId];
    if (submission) {
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

    if (!isOwnTeam) {
      setPlayingXI(Array(11).fill(null));
      setImpactPlayer(null);
      setCaptainId(null);
      setViceCaptainId(null);
    }
    setSubmittedLocal(false);
  }, [submittedTeams, viewedTeamId, userTeamId, roomCode]);

  const boardTeam = teams.find((t) => t.id === (viewedTeamId || userTeamId));
  const boardSquad = boardTeam ? boardTeam.squad : [];

  const handleAutofill = () => {
    if (!boardSquad || boardSquad.length === 0) return;
    const sorted = [...boardSquad].sort((a, b) => b.overall - a.overall);
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

  const availableBench = boardSquad.filter(p => {
    const inXI = playingXI.some(x => x && x.id === p.id);
    const inImpact = impactPlayer && impactPlayer.id === p.id;
    return !inXI && !inImpact;
  });

  const modalAvailableBench = availableBench.filter(p => {
    if (modalRoleFilter === 'ALL') return true;
    return p.role === modalRoleFilter;
  });

  // ── V3 Upgraded Web Audio Sounds ──────────────────────────────────────────
  const playSound = (type: 'bid' | 'countdown' | 'sold' | 'unsold') => {
    if (typeof window === 'undefined') return;
    if (type === 'bid' && !settings.auctionSound) return;
    if (type === 'countdown' && !settings.countdownSound) return;
    if (type === 'sold' && !settings.hammerSound) return;
    if (type === 'unsold' && !settings.hammerSound) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (type === 'bid') {
        // Soft click/tick sound for bid placed
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'countdown') {
        // Soft beep for final 5 seconds countdown (moderate volume, not loud or annoying)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'sold') {
        // Gavel hammer sound (triangle thud)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'unsold') {
        // Low soft double buzzer
        [0, 0.12].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        });
      }
    } catch (e) {
      console.warn('AudioContext blocked', e);
    }
  };

  const speak = (text: string) => {
    // Automatic commentary removed
  };

  // Audio effects triggers
  const lastBidAmount = useRef(0);
  const lastBidderId = useRef<string | null>(null);
  const lastPhase = useRef<string | null>(null);
  const lastWarningTick = useRef<number | null>(null);

  // Soft countdown warning ticks for final 5 seconds
  useEffect(() => {
    if (phase === 'BIDDING' && countdown <= 5 && countdown > 0 && !paused) {
      if (lastWarningTick.current !== countdown) {
        playSound('countdown');
        lastWarningTick.current = countdown;
      }
    } else {
      lastWarningTick.current = null;
    }
  }, [countdown, phase, paused]);

  // Bid placed sound trigger
  useEffect(() => {
    if (phase === 'BIDDING' && currentBidderId && (currentBid > lastBidAmount.current || currentBidderId !== lastBidderId.current)) {
      playSound('bid');
      lastBidAmount.current = currentBid;
      lastBidderId.current = currentBidderId;
    }
  }, [currentBid, currentBidderId, phase]);

  // Sold and Unsold sound triggers
  useEffect(() => {
    if (phase === 'SOLD' && lastPhase.current !== 'SOLD' && currentPlayer && currentBidderId) {
      playSound('sold');
      const winningTeam = teams.find((t) => t.id === currentBidderId);
      triggerConfetti(winningTeam?.primaryColor || '#D4AF37');
    } else if (phase === 'UNSOLD' && lastPhase.current !== 'UNSOLD' && currentPlayer) {
      playSound('unsold');
    }
    lastPhase.current = phase;
  }, [phase, currentPlayer, currentBidderId, teams]);

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

  // ── Premium V3 Helper Render Functions ─────────────────────────────────────
  const formatCrShort = (amt: number) => {
    if (amt >= 1) return `₹${amt.toFixed(2)} Cr`;
    return `₹${(amt * 100).toFixed(0)} L`;
  };

  const renderBroadcastHeader = () => (
    <div className="broadcast-header flex items-center justify-between border-b border-border-custom bg-void/90 py-2.5 px-4 relative z-20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 bg-neon-red text-white text-[9px] font-black px-2.5 py-0.5 rounded font-barlow tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
        <h2 className="text-xs sm:text-sm font-black text-neon-gold tracking-widest font-barlow uppercase">
          IPL MEGA AUCTION 2025
        </h2>
      </div>

      <div className="broadcast-ticker-wrap hidden md:block">
        <div className="broadcast-ticker font-barlow text-white/70">
          <span className="ticker-item">🏟️ <span>WELCOME TO THE ARENA</span> — 10 FRANCHISES BATTLE FOR GLORY</span>
          {currentPlayer && (
            <span className="ticker-item">🏏 NOW ON THE BLOCK: <span>{currentPlayer.name}</span> ({currentPlayer.role}) — BASE PRICE: <span>₹{currentPlayer.basePrice.toFixed(2)} Cr</span></span>
          )}
          {activeBidder && (
            <span className="ticker-item">⚡ CURRENT HIGHEST BID: <span>₹{currentBid.toFixed(2)} Cr</span> BY <span>{activeBidder.name}</span></span>
          )}
          <span className="ticker-item">💰 TOTAL FRANCHISE BUDGET: <span>₹120.00 Cr</span></span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-av-muted font-rajdhani tracking-wider mr-2">
          {countdownText || 'ACTIVE ROUND'}
        </span>
      </div>
    </div>
  );

  const renderClassicPurseTicker = () => (
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatsOpen(true)}
            className="shrink-0 bg-neon-gold/15 text-neon-gold border border-neon-gold/30 hover:bg-neon-gold/25 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all duration-200"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Stats board</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCameraSwitcher = () => (
    <div className="flex flex-wrap items-center gap-1 bg-void/65 border border-white/5 p-1 rounded-xl backdrop-blur-md">
      {(
        [
          { key: 'broadcast', label: 'Broadcast 📺' },
          { key: 'stage',     label: 'Stage View 🏟️' },
          { key: 'spotlight',  label: 'Spotlight 💡' },
          { key: 'teams',      label: 'Franchises 👥' },
        ] as const
      ).map((cam) => (
        <button
          key={cam.key}
          onClick={() => setCameraView(cam.key)}
          className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all ${
            cameraView === cam.key
              ? 'bg-neon-gold/20 text-neon-gold border border-neon-gold/30 shadow-[0_0_10px_rgba(245,197,24,0.15)]'
              : 'bg-transparent border border-transparent text-av-muted hover:text-white'
          }`}
        >
          {cam.label}
        </button>
      ))}
    </div>
  );

  const renderAuctioneer = (size: 'sm' | 'md' | 'lg' = 'md') => {
    let speechText = "Welcome to the IPL Mega Auction 2025. We will begin shortly.";
    let gesture = "👋";
    let isSpeaking = false;

    if (phase === 'WAITING') {
      speechText = "Welcome to the IPL Mega Auction! Waiting for host to start...";
      gesture = "👋";
    } else if (phase === 'SET_ANNOUNCEMENT') {
      speechText = `Now moving to: ${countdownText || 'Next Set'}!`;
      gesture = "📢";
      isSpeaking = true;
    } else if (phase === 'BIDDING') {
      isSpeaking = true;
      if (!currentBidderId) {
        speechText = `Who will open the bid at ${formatCr(currentBid)}?`;
        gesture = "❓";
      } else {
        const bidderTeam = teams.find((t) => t.id === currentBidderId);
        speechText = `Bid is with ${bidderTeam?.abbr || 'Manager'} at ${formatCr(currentBid)}! Any higher bids?`;
        gesture = "🙋‍♂️";
      }
    } else if (phase === 'RESOLVING') {
      isSpeaking = true;
      const bidderTeam = teams.find((t) => t.id === currentBidderId);
      if (countdown === 3) {
        speechText = `Going ONCE at ${formatCr(currentBid)} to ${bidderTeam?.abbr}!`;
        gesture = "☝️";
      } else if (countdown === 2) {
        speechText = `Going TWICE at ${formatCr(currentBid)} to ${bidderTeam?.abbr}!`;
        gesture = "✌️";
      } else {
        speechText = `Fair warning... Last chance at ${formatCr(currentBid)}!`;
        gesture = "👀";
      }
    } else if (phase === 'SOLD') {
      const bidderTeam = teams.find((t) => t.id === currentBidderId);
      speechText = `SOLD! To ${bidderTeam?.name || 'Manager'} for ${formatCr(currentBid)}! 🔨`;
      gesture = "🔨";
    } else if (phase === 'UNSOLD') {
      speechText = `${currentPlayer?.name || 'Player'} is UNSOLD.`;
      gesture = "❌";
    } else if (phase === 'COMPLETE') {
      speechText = "The Mega Auction is complete! Thank you, everyone!";
      gesture = "🏆";
    }

    const scale = size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-125' : 'scale-100';

    return (
      <div className={`flex flex-col items-center justify-center transition-all duration-300 ${scale} relative`}>
        <AnimatePresence mode="wait">
          {speechText && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute -top-16 bg-void/95 border border-neon-gold/30 text-white px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase text-center min-w-[150px] max-w-[200px] shadow-lg backdrop-blur-md z-10 font-barlow"
            >
              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0.5 h-0.5 border-t-[6px] border-t-void border-x-[6px] border-x-transparent" />
              <span>{speechText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-neon-gold/40 flex items-center justify-center overflow-hidden shadow-inner mt-6">
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          <div className="text-5xl sm:text-6xl select-none transition-all duration-200">
            {gesture === '🔨' ? (
              <motion.div
                animate={{ rotate: [0, -35, 10, -25, 0] }}
                transition={{ duration: 0.6 }}
              >
                👨‍💼
              </motion.div>
            ) : isSpeaking ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >
                👨‍💼
              </motion.div>
            ) : (
              '👨‍💼'
            )}
          </div>

          {gesture === '🔨' && (
            <motion.div
              animate={{ rotate: [0, -45, 10, -30, 0], y: [0, -5, 5, -2, 0] }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-1 right-2 text-2xl"
            >
              🔨
            </motion.div>
          )}
          {gesture !== '🔨' && (
            <div className="absolute bottom-1 right-2 text-2xl animate-bounce">
              {gesture}
            </div>
          )}
        </div>

        <div className="w-20 h-10 bg-gradient-to-b from-amber-800 to-amber-955 border border-amber-900 rounded-t-lg shadow-md flex flex-col items-center justify-center relative -mt-1 z-0">
          <div className="w-16 h-1 bg-amber-700 rounded-full mb-1" />
          <span className="text-[7px] text-amber-100 font-extrabold uppercase tracking-widest font-barlow">AUCTIONEER</span>
        </div>
      </div>
    );
  };

  const renderTeamOwnerTables = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full my-4">
        {TEAMS_DB.map((t) => {
          const teamState = teams.find((tm) => tm.id === t.id);
          const purse = teamState ? teamState.purse : t.purse;
          const squadLength = teamState ? teamState.squad.length : 0;
          const overseasCount = teamState ? teamState.squad.filter(p => p.overseas).length : 0;
          const isCurrentBidder = currentBidderId === t.id;
          const isUser = t.id === userTeamId;
          
          let bidStatusText = "IDLE";
          let statusColorClass = "text-av-muted border-white/5 bg-void/35";
          
          if (phase === 'BIDDING' || phase === 'RESOLVING') {
            if (isCurrentBidder) {
              bidStatusText = "LEADING";
              statusColorClass = "border-neon-green/40 bg-neon-green/10 text-neon-green animate-pulse";
            } else if (currentBidderId && !isCurrentBidder) {
              bidStatusText = "WAITING";
              statusColorClass = "border-white/5 bg-void/45 text-av-muted";
            }
          } else if (phase === 'SOLD') {
            if (isCurrentBidder) {
              bidStatusText = "WON!";
              statusColorClass = "border-neon-gold/50 bg-neon-gold/15 text-neon-gold";
            }
          }
          
          return (
            <motion.div
              key={t.id}
              style={{
                borderColor: isCurrentBidder ? t.primaryColor : 'rgba(255, 255, 255, 0.05)',
                boxShadow: isCurrentBidder ? `0 0 15px ${t.primaryColor}40` : 'none',
              }}
              animate={isCurrentBidder ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`rounded-xl p-3 border bg-glass flex flex-col justify-between transition-all duration-300 ${
                isUser ? 'ring-1 ring-neon-gold/30' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                <div className="flex items-center space-x-1">
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-xs uppercase font-black font-barlow tracking-wider" style={{ color: t.primaryColor }}>
                    {t.abbr}
                  </span>
                </div>
                {isUser && (
                  <span className="text-[7px] font-black bg-neon-gold text-midnight px-1 py-0.5 rounded uppercase font-barlow">
                    OWNER
                  </span>
                )}
              </div>
              
              <div className="space-y-1 text-[10px] font-rajdhani">
                <div className="flex justify-between font-bold">
                  <span className="text-av-muted font-bold">Purse:</span>
                  <span className="text-neon-green font-black">₹{purse.toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-av-muted font-bold">Squad:</span>
                  <span className="text-white font-black">{squadLength}/25 <span className="text-[8px] text-av-muted">(OS:{overseasCount})</span></span>
                </div>
              </div>
              
              <div className={`mt-2 text-center text-[8px] font-black uppercase py-0.5 rounded border ${statusColorClass}`}>
                {bidStatusText}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderPremiumPlayerPresenterCard = (isSpotlight = false) => {
    if (!currentPlayer) {
      return (
        <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center grow border border-dashed border-white/5">
          <User className="h-12 w-12 text-av-muted mb-3 animate-pulse" />
          <h4 className="font-extrabold text-sm uppercase text-white">No Player Nominated</h4>
          <p className="text-xs text-av-muted mt-1 max-w-xs">Waiting for the auctioneer to launch the next draft card.</p>
        </div>
      );
    }

    const ovrColor = currentPlayer.overall >= 90 ? 'var(--av-neon-gold)' :
                     currentPlayer.overall >= 80 ? 'var(--av-neon-cyan)' :
                     currentPlayer.overall >= 70 ? 'var(--av-neon-green)' :
                     'var(--av-neon-purple)';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between grow border ${
          isSpotlight 
            ? 'border-t border-neon-gold/50 shadow-[0_0_30px_rgba(245,197,24,0.15)] bg-gradient-to-b from-void/60 to-transparent' 
            : 'border-white/5'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-neon-gold bg-neon-gold/10 border border-neon-gold/25 px-3 py-1 rounded-full">
              {currentPlayer.category || 'MEGA DRAFT POOL'}
            </span>
            <span className="text-[8px] font-black text-av-muted uppercase block mt-1 tracking-widest">
              Set: {currentPlayer.category || 'IPL Set'}
            </span>
          </div>

          <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
            currentPlayer.role === 'BAT' ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/35' :
            currentPlayer.role === 'BOWL' ? 'bg-neon-red/10 text-neon-red border border-neon-red/35' :
            currentPlayer.role === 'WK' ? 'bg-neon-gold/10 text-neon-gold border border-neon-gold/35' :
            'bg-neon-purple/10 text-neon-purple border border-neon-purple/35'
          }`}>
            {currentPlayer.role === 'BAT' ? '🏏 BAT' :
             currentPlayer.role === 'BOWL' ? '🎳 BOWL' :
             currentPlayer.role === 'WK' ? '🧤 WK' : '⭐ AR'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center overflow-hidden border-2"
            style={{ borderColor: ovrColor, boxShadow: `0 0 20px ${ovrColor}20` }}>
            <span className="text-6xl select-none">{currentPlayer.flag}</span>
            {currentPlayer.overseas && (
              <span className="absolute bottom-1 right-1 text-xl" title="Overseas Player">🌍</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-extrabold text-av-muted uppercase tracking-wider">
              {currentPlayer.country} • Age {currentPlayer.age}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide font-barlow mt-1 leading-none">
              {currentPlayer.name}
            </h2>
            
            <div className="flex gap-4 mt-3 justify-center sm:justify-start">
              <div>
                <span className="text-[8px] text-av-muted block font-extrabold uppercase">Base Price</span>
                <span className="font-extrabold text-neon-gold text-xs">₹{currentPlayer.basePrice.toFixed(2)} Cr</span>
              </div>
              <div className="w-px bg-white/5" />
              <div>
                <span className="text-[8px] text-av-muted block font-extrabold uppercase">Capped status</span>
                <span className="font-extrabold text-white text-xs">{currentPlayer.capped ? 'Capped 🇮🇳' : 'Uncapped ⭐'}</span>
              </div>
              <div className="w-px bg-white/5" />
              <div>
                <span className="text-[8px] text-av-muted block font-extrabold uppercase">Hype Index</span>
                <span className="font-extrabold text-neon-cyan text-xs">{currentPlayer.popularity}% Hype</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" className="stroke-white/5 fill-transparent" strokeWidth="6" />
              <circle
                cx="48"
                cy="48"
                r="40"
                style={{ stroke: ovrColor }}
                className="fill-transparent transition-all duration-1000"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - currentPlayer.overall / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black font-bebas" style={{ color: ovrColor }}>
                {currentPlayer.overall}
              </span>
              <span className="text-[7px] text-av-muted font-extrabold uppercase tracking-wider font-barlow">OVR RATING</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-4 mt-4 text-center">
          <div className="bg-void/40 p-2 rounded-xl border border-white/5">
            <span className="text-base font-black text-white font-barlow">
              {currentPlayer.batting || '—'}
            </span>
            <span className="text-[7px] text-av-muted uppercase block font-bold font-barlow mt-0.5">Batting</span>
          </div>
          <div className="bg-void/40 p-2 rounded-xl border border-white/5">
            <span className="text-base font-black text-white font-barlow">
              {currentPlayer.bowling || '—'}
            </span>
            <span className="text-[7px] text-av-muted uppercase block font-bold font-barlow mt-0.5">Bowling</span>
          </div>
          <div className="bg-void/40 p-2 rounded-xl border border-white/5">
            <span className="text-base font-black text-white font-barlow">
              {currentPlayer.fielding || '—'}
            </span>
            <span className="text-[7px] text-av-muted uppercase block font-bold font-barlow mt-0.5">Fielding</span>
          </div>
          <div className="bg-void/40 p-2 rounded-xl border border-white/5">
            <span className="text-base font-black text-white font-barlow">
              {currentPlayer.experience || '—'}
            </span>
            <span className="text-[7px] text-av-muted uppercase block font-bold font-barlow mt-0.5">Matches</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPremiumBiddingPanel = () => {
    const userTeam = teams.find((t) => t.id === userTeamId);
    return (
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border border-white/5 relative overflow-hidden bg-gradient-to-b from-void/45 to-transparent w-full h-full min-h-[280px]">
        <div className="absolute top-0 inset-x-0 h-full bg-[radial-gradient(circle_at_top,_rgba(214,175,55,0.06)_0%,_transparent_65%)] pointer-events-none" />
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
                className={`fill-transparent transition-[stroke-dashoffset] duration-200 ease-out ${
                  countdown <= 3 && phase === 'BIDDING' ? 'stroke-neon-red animate-pulse' : 'stroke-neon-cyan'
                }`}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - (phase === 'RESOLVING' ? 1.5 : countdown) / (phase === 'RESOLVING' ? 1.5 : timerDuration))}
              />
            </svg>
            <span className={`absolute text-sm font-black ${countdown <= 3 && phase === 'BIDDING' ? 'text-neon-red animate-pulse' : 'text-white'}`}>
              {phase === 'RESOLVING' ? '!' : countdown}
            </span>
          </div>
        </div>

        {/* Current Price */}
        <div className="text-center my-4">
          <span className="text-[9px] uppercase font-bold tracking-widest text-av-muted block mb-1">
            {currentBidderId ? 'Current Bid' : 'Base Price'}
          </span>
          <h2 className="text-4xl font-black text-white font-bebas tracking-wide neon-glow-gold">
            {currentBidderId ? formatCr(currentBid) : `₹${currentPlayer?.basePrice.toFixed(2) || '0.00'} Cr`}
          </h2>
          {activeBidder ? (
            <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-xs font-bold mt-2 bg-white/5 border border-white/10 text-white">
              <span>{activeBidder.emoji}</span>
              <span>{activeBidder.name}</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-xs font-bold mt-2 bg-white/5 border border-white/10 text-av-muted">
              <span>No active bid</span>
            </div>
          )}
        </div>

        {(phase === 'BIDDING' || phase === 'RESOLVING') && !paused && userTeamId && currentPlayer ? (
          <div>
            {(() => {
              const nextBidAmount = currentBidderId ? getNextBid(currentBid) : currentBid;
              const isHighestBidder = currentBidderId === userTeamId;
              const hasPurse = userTeam ? userTeam.purse >= nextBidAmount : false;
              const isRosterFull = userTeam ? userTeam.squad.length >= 25 : false;
              const isOverseasQuotaFull = userTeam && currentPlayer.overseas
                ? userTeam.squad.filter(p => p.overseas).length >= 8
                : false;

              let btnText = `BID ${formatCrShort(nextBidAmount)}`;
              let isDisabled = false;

              if (isHighestBidder) {
                btnText = `YOU LEAD`;
                isDisabled = true;
              } else if (isRosterFull) {
                btnText = `ROSTER FULL`;
                isDisabled = true;
              } else if (isOverseasQuotaFull) {
                btnText = `OVERSEAS FULL`;
                isDisabled = true;
              } else if (!hasPurse) {
                btnText = `NO BUDGET`;
                isDisabled = true;
              }

              return (
                <button
                  onClick={() => placeBid()}
                  disabled={isDisabled}
                  className={`w-full py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition-all duration-300 shadow-lg ${
                    isDisabled
                      ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {btnText}
                </button>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-4 bg-void/50 border border-border-custom rounded-2xl text-xs text-av-muted font-bold">
            {paused ? 'Paused' : 'Bidding Closed'}
          </div>
        )}
      </div>
    );
  };

  /** Left: Player spotlight card */
  const renderSpotlightPanel = () => (
    <div 
      className="lg:col-span-8 flex flex-col justify-between glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-500 bg-gradient-to-br from-slate-900/90 via-void/95 to-midnight/90 border border-white/10"
      style={{
        borderColor: currentBidderId 
          ? `${teams.find((t) => t.id === currentBidderId)?.primaryColor}aa` 
          : 'var(--av-border)',
        boxShadow: currentBidderId 
          ? `0 0 35px ${teams.find((t) => t.id === currentBidderId)?.primaryColor}20, inset 0 0 20px ${teams.find((t) => t.id === currentBidderId)?.primaryColor}10` 
          : '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
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
                <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full w-fit backdrop-blur-md">
                  <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{currentPlayer.flag}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-barlow">
                    {currentPlayer.country} • Age {currentPlayer.age}
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-wide mt-3.5 text-white uppercase font-barlow">
                  {currentPlayer.name}
                </h2>
                {/* V3: Set / Category badge */}
                {currentPlayer.category && (
                  <span className="text-[9px] uppercase font-black tracking-widest text-neon-gold bg-neon-gold/10 border border-neon-gold/20 px-3 py-1 rounded-full block mt-2.5 w-fit">
                    {currentPlayer.category.replace(/_/g, ' ')}
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

            {/* Desktop Only: Original Overall Gauge + Price Box */}
            <div className="hidden lg:flex flex-col sm:flex-row items-center justify-around my-6 gap-6 w-full">
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="64" className="stroke-void fill-transparent" strokeWidth="10" />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    style={{
                      stroke: currentPlayer.overall >= 90 ? 'var(--av-neon-gold)' :
                              currentPlayer.overall >= 80 ? 'var(--av-neon-cyan)' :
                              currentPlayer.overall >= 70 ? 'var(--av-neon-green)' :
                              'var(--av-neon-purple)'
                    }}
                    className="fill-transparent transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 64}
                    strokeDashoffset={2 * Math.PI * 64 * (1 - currentPlayer.overall / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span 
                    className="text-4xl font-black transition-all duration-300"
                    style={{
                      color: currentPlayer.overall >= 90 ? 'var(--av-neon-gold)' :
                             currentPlayer.overall >= 80 ? 'var(--av-neon-cyan)' :
                             currentPlayer.overall >= 70 ? 'var(--av-neon-green)' :
                             'var(--av-neon-purple)',
                      textShadow: `0 0 12px ${
                        currentPlayer.overall >= 90 ? 'var(--av-neon-gold)' :
                        currentPlayer.overall >= 80 ? 'var(--av-neon-cyan)' :
                        currentPlayer.overall >= 70 ? 'var(--av-neon-green)' :
                        'var(--av-neon-purple)'
                      }40`
                    }}
                  >
                    {currentPlayer.overall}
                  </span>
                  <span className="text-[10px] text-av-muted uppercase tracking-widest font-bold">OVR Rating</span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-4 text-center sm:text-left">
                <div className="glass-panel px-6 py-2.5 rounded-xl border border-white/5 bg-void/30">
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
                      {currentPlayer.capped ? 'Capped' : 'Uncapped'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Only: Interactive Bidding Panel inside Card (Replacing OVR Circle and Popularity) */}
            <div className="flex lg:hidden flex-col items-stretch w-full gap-4 my-4 p-5 rounded-2xl bg-gradient-to-b from-void/80 to-midnight/90 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Inner ambient glow */}
              <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-20 bg-[radial-gradient(circle,_var(--av-neon-gold)_0%,_transparent_70%)]" />

              {/* Live countdown & Timer */}
              <div className="flex justify-between items-center pb-3.5 border-b border-white/10 relative z-10">
                <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase text-av-muted tracking-wider">
                  <span className={`h-2.5 w-2.5 rounded-full ${paused ? 'bg-neon-red' : 'bg-neon-green'} animate-pulse`} />
                  <span className={paused ? 'text-neon-red' : 'text-neon-green'}>{paused ? 'PAUSED' : 'LIVE COUNTDOWN'}</span>
                </div>
                
                <div className="bg-void/85 border border-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="text-[8px] font-black text-av-muted uppercase tracking-widest">Timer</span>
                  <span className={`text-sm font-black font-bebas ${countdown <= 3 ? 'text-neon-red animate-pulse' : 'text-white'}`}>
                    {countdown}s
                  </span>
                </div>
              </div>

              {/* Price Display: Luxurious glass box */}
              <div className="glass-panel py-4 px-6 rounded-2xl border border-white/10 bg-void/50 shadow-[inset_0_0_20px_rgba(255,255,255,0.01),0_4px_20px_rgba(0,0,0,0.4)] my-2 text-center relative z-10">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-av-muted block mb-1">
                  {currentBidderId ? 'Current Bid' : 'Base Price'}
                </span>
                <h3 className="text-4xl font-extrabold text-white tracking-wide font-bebas neon-glow-gold">
                  {currentBidderId ? formatCr(currentBid) : `₹${currentPlayer.basePrice.toFixed(2)} Cr`}
                </h3>

                {/* Who is bidding */}
                <div className="mt-2.5 text-xs font-black flex items-center justify-center gap-2">
                  <span className="text-av-muted text-[10px] uppercase tracking-wider font-rajdhani">Leader:</span>
                  {activeBidder ? (
                    <span 
                      style={{ color: activeBidder.primaryColor }}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center space-x-1.5 shadow-sm"
                    >
                      <span className="text-sm shrink-0">{activeBidder.emoji}</span>
                      <span className="uppercase font-barlow tracking-wider text-[11px] font-black">{activeBidder.name}</span>
                      {currentBidderId === userTeamId && (
                        <span className="ml-1 text-[8px] px-1 bg-neon-gold text-midnight rounded font-black">YOU</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-av-muted italic text-[11px] font-rajdhani">No active bids</span>
                  )}
                </div>
              </div>

              {/* Bid buttons */}
              {(phase === 'BIDDING' || phase === 'RESOLVING') && !paused && userTeamId ? (
                <div className="relative z-10">
                  {(() => {
                    const userTeam = teams.find((t) => t.id === userTeamId);
                    const nextBidAmount = currentBidderId ? getNextBid(currentBid) : currentBid;
                    const isHighestBidder = currentBidderId === userTeamId;
                    const hasPurse = userTeam ? userTeam.purse >= nextBidAmount : false;
                    const isRosterFull = userTeam ? userTeam.squad.length >= 25 : false;
                    const isOverseasQuotaFull = userTeam && currentPlayer.overseas
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
                      btnText = `NO BUDGET`;
                      isDisabled = true;
                    }

                    return (
                      <button
                        onClick={() => placeBid()}
                        disabled={isDisabled}
                        className={`w-full py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-lg ${
                          isDisabled
                            ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-neon-gold via-yellow-500 to-amber-500 text-midnight hover:shadow-[0_0_20px_rgba(245,197,24,0.35)] hover:brightness-110 active:scale-[0.98] cursor-pointer'
                        }`}
                      >
                        {btnText}
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-4 bg-void/60 border border-border-custom rounded-xl text-xs text-av-muted font-bold relative z-10">
                  {paused ? 'Paused' : 'Bidding Closed'}
                </div>
              )}

              {/* Stats Footer inside Bidding Box */}
              <div className="flex justify-center border-t border-white/10 pt-3.5 mt-1 relative z-10">
                <div className="text-xs text-center">
                  <span className="text-av-muted block font-extrabold uppercase tracking-wider text-[9px] mb-0.5">Capped Status</span>
                  <span className="font-extrabold text-white text-xs block">
                    {currentPlayer.capped ? 'Capped' : 'Uncapped'}
                  </span>
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
              onClick={() => router.push('/lineup')}
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

  const renderLineupBuilderPanel = () => {
    return (
      <div className="flex-1 w-full flex flex-col gap-6">
        {/* Header row */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-neon-cyan/5 to-transparent border border-neon-cyan/20">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="text-4xl">{userTeam?.emoji || '🏏'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
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

          {isOwnTeam && !submittedLocal && boardSquad.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleAutofill}
                className="bg-neon-gold/10 hover:bg-neon-gold border border-neon-gold/30 text-neon-gold hover:text-midnight text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>✨ Auto-fill</span>
              </button>
              <button
                onClick={handleResetLineup}
                className="bg-neon-red/10 hover:bg-neon-red border border-neon-red/30 text-neon-red hover:text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>🗑️ Reset</span>
              </button>
            </div>
          )}
        </div>

        {boardSquad.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-dashed border-border-custom text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-glass flex items-center justify-center border border-border-custom">
                <Users className="h-6 w-6 text-av-muted" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm uppercase">No Players Signed</h4>
                <p className="text-xs text-av-muted mt-1 max-w-sm mx-auto">
                  You have not purchased any players in the auction yet. Wait for a player to be sold to your franchise, or bid on players!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Playing XI list */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-neon-cyan tracking-wider px-1">Playing XI Squad</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
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
                  <span>Submission Checks</span>
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
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
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
    );
  };

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
                className={`fill-transparent transition-[stroke-dashoffset] duration-200 ease-out ${
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

      {/* Voice Chat Widget */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-border-custom pb-2">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${isVoiceJoined ? 'bg-neon-green animate-pulse' : 'bg-av-muted'}`} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Voice Chat
            </h3>
            {isVoiceJoined && (
              <span className="text-[9px] bg-void/50 border border-white/5 px-2 py-0.5 rounded-full text-av-muted font-bold flex items-center space-x-1 shrink-0">
                <Users className="h-3 w-3 inline mr-0.5" />
                <span>{Object.keys(voiceParticipants).length}</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setIsVoiceSettingsOpen(!isVoiceSettingsOpen)}
            className="p-1 text-av-muted hover:text-white transition-colors rounded hover:bg-glass"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {isVoiceSettingsOpen ? (
          <div className="bg-void/40 border border-white/5 rounded-xl p-3 space-y-3.5 text-xs">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-extrabold text-neon-gold uppercase text-[10px]">Audio Settings</span>
              <button onClick={() => setIsVoiceSettingsOpen(false)} className="text-[10px] text-av-muted hover:text-white font-bold">Done</button>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-av-muted">Auction Sound</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, auctionSound: !prev.auctionSound }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.auctionSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                >
                  {settings.auctionSound ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-av-muted">Voice Chat</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, voiceChat: !prev.voiceChat }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.voiceChat ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                >
                  {settings.voiceChat ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-av-muted">Countdown Sound</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, countdownSound: !prev.countdownSound }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.countdownSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                >
                  {settings.countdownSound ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-av-muted">Hammer Sound</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, hammerSound: !prev.hammerSound }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.hammerSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                >
                  {settings.hammerSound ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-av-muted">Notification Sound</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, notificationSound: !prev.notificationSound }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.notificationSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                >
                  {settings.notificationSound ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-white/5">
                <div className="flex justify-between text-[10px] text-av-muted">
                  <span>Speaker Volume</span>
                  <span>{Math.round(speakerVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={speakerVolume}
                  onChange={(e) => handleSpeakerVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-void rounded-lg appearance-none cursor-pointer accent-neon-gold"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {Object.values(voiceParticipants).length === 0 ? (
                <div className="text-center py-4 text-[11px] text-av-muted italic">
                  No participants connected to voice
                </div>
              ) : (
                Object.values(voiceParticipants).map((p) => {
                  const team = TEAMS_DB.find((t) => t.id === p.teamId);
                  return (
                    <div
                      key={p.socketId}
                      className={`flex items-center justify-between p-2 rounded-lg bg-void/30 border transition-all duration-200 ${
                        p.speaking
                          ? 'border-neon-green/40 shadow-[0_0_10px_rgba(57,255,20,0.05)] bg-neon-green/5'
                          : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-sm shrink-0">{p.speaking ? '🎤' : p.muted ? '🔇' : '🎤'}</span>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate uppercase ${
                            p.speaking ? 'text-neon-green' : 'text-white'
                          }`}>
                            {p.name}
                          </span>
                          <span className="text-[9px] text-av-muted block leading-none mt-0.5">
                            {team ? `${team.emoji} ${team.abbr}` : '👀 Spectator'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {p.muted && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-neon-red/10 text-neon-red rounded border border-neon-red/25 font-bold">
                            MUTED
                          </span>
                        )}
                        {p.speaking && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green rounded border border-neon-green/25 font-bold animate-pulse">
                            SPEAKING
                          </span>
                        )}
                        
                        {isAdmin && p.socketId !== socket.id && (
                          <button
                            onClick={() => socket.emit('admin-voice-control', { roomCode, action: 'remove-user', targetSocketId: p.socketId })}
                            title="Kick from Voice Channel"
                            className="p-1 rounded bg-neon-red/10 border border-neon-red/25 hover:bg-neon-red text-neon-red hover:text-white transition-colors duration-150"
                          >
                            <PhoneOff className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {isVoiceJoined ? (
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={toggleMic}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 border flex items-center justify-center space-x-1.5 cursor-pointer ${
                    micMuted
                      ? 'bg-neon-red/10 border-neon-red/30 text-neon-red hover:bg-neon-red/25'
                      : 'bg-glass border-border-custom text-white hover:bg-glass-hover'
                  }`}
                >
                  {micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  <span>{micMuted ? 'Muted' : 'Mic On'}</span>
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 border flex items-center justify-center space-x-1.5 cursor-pointer ${
                    speakerMuted
                      ? 'bg-neon-red/10 border-neon-red/30 text-neon-red hover:bg-neon-red/25'
                      : 'bg-glass border-border-custom text-white hover:bg-glass-hover'
                  }`}
                >
                  {speakerMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                  <span>{speakerMuted ? 'Muted' : 'Sound On'}</span>
                </button>

                <button
                  onClick={leaveVoiceChannel}
                  className="p-2 rounded-xl bg-neon-red/15 hover:bg-neon-red border border-neon-red/30 text-neon-red hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0"
                  title="Leave Voice Channel"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={joinVoiceChannel}
                className="w-full py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-neon-cyan to-blue-500 text-midnight font-extrabold cursor-pointer border-t border-white/20 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:scale-[1.02]"
              >
                📞 Join Voice Channel
              </button>
            )}

            {isAdmin && (
              <div className="bg-void/30 border border-white/5 rounded-xl p-2.5 space-y-2 mt-2">
                <span className="text-[9px] uppercase font-black text-neon-gold block leading-none">
                  Voice Admin Controls
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase">
                  <button
                    onClick={() => socket.emit('admin-voice-control', { roomCode, action: 'mute-all' })}
                    className="bg-glass border border-border-custom hover:bg-glass-hover hover:border-neon-gold/50 p-1.5 rounded-lg text-center cursor-pointer text-white"
                  >
                    Mute All
                  </button>
                  <button
                    onClick={() => socket.emit('admin-voice-control', { roomCode, action: 'end-voice' })}
                    className="bg-glass border border-border-custom hover:bg-glass-hover hover:border-neon-red/50 p-1.5 rounded-lg text-center cursor-pointer text-neon-red"
                  >
                    End Session
                  </button>
                </div>
              </div>
            )}
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
    <div className="min-h-screen flex flex-col bg-midnight text-av-text bg-grid-pattern relative overflow-hidden font-rajdhani">
      {/* Ambient background glows using performant CSS radial gradients */}
      <div 
        className="absolute top-[-10%] left-[-15%] w-[45vw] h-[45vw] pointer-events-none z-0 opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(180, 79, 255, 0.08) 0%, rgba(180, 79, 255, 0) 70%)'
        }}
      />
      <div 
        className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] pointer-events-none z-0 opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, rgba(0, 212, 255, 0) 70%)'
        }}
      />
      
      {/* Confetti canvas */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* Screen Highlight on final 3 seconds */}
      {phase === 'BIDDING' && countdown <= 3 && countdown > 0 && !paused && (
        <div className="pointer-events-none fixed inset-0 z-50 ring-[16px] ring-neon-red/15 animate-pulse shadow-[inset_0_0_80px_rgba(255,51,102,0.2)]" />
      )}
      
      <Navbar />

      {/* ── 1. Header Ticker Toggles ── */}
      {viewMode === 'premium' ? renderBroadcastHeader() : renderClassicPurseTicker()}

      {/* ── 2. View Mode Grid Layouts ── */}
      {viewMode === 'classic' ? (
        /* Classic Mode — Original Layout */
        <>
          <div className="hidden lg:flex flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid-cols-12 gap-6 relative z-10 lg:grid">
            {renderSpotlightPanel()}
            {renderBiddingAndChatPanel()}
          </div>

          <div className="lg:hidden flex-1 max-w-7xl w-full mx-auto px-4 py-4 relative z-10 pb-[170px]">
            {mobileTab === 'spotlight' && (
              <div className="flex flex-col gap-6">
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

                {isAdmin && (
                  <div className="glass-panel rounded-2xl p-4 space-y-3.5 mt-4">
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
                        Set Timer
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
            {mobileTab === 'lineup' && (
              <div className="flex flex-col gap-6">
                {renderSpotlightPanel()}
                {renderLineupBuilderPanel()}
              </div>
            )}
          </div>

          {/* Mobile Bottom Fixed Bidding Panel */}
          {currentPlayer && mobileTab !== 'spotlight' && (phase === 'BIDDING' || phase === 'RESOLVING' || phase === 'SOLD' || phase === 'UNSOLD') && (
            <div className="lg:hidden fixed bottom-[56px] left-0 right-0 z-40 bg-void/95 border-t border-border-custom p-3 flex flex-col gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{currentPlayer.flag}</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-white truncate uppercase max-w-[130px]">{currentPlayer.name}</div>
                    <span className="text-[9px] text-av-muted uppercase font-bold block">{currentPlayer.role} • OVR {currentPlayer.overall}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="16" cy="16" r="13" className="stroke-white/5 fill-transparent" strokeWidth="2" />
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        className={`fill-transparent transition-[stroke-dashoffset] duration-200 ease-out ${countdown <= 3 && phase === 'BIDDING' ? 'stroke-neon-red animate-pulse' : 'stroke-neon-cyan'}`}
                        strokeWidth="2"
                        strokeDasharray={2 * Math.PI * 13}
                        strokeDashoffset={2 * Math.PI * 13 * (1 - (phase === 'RESOLVING' ? 1.5 : countdown) / (phase === 'RESOLVING' ? 1.5 : timerDuration))}
                      />
                    </svg>
                    <span className={`absolute text-[9px] font-black ${countdown <= 3 && phase === 'BIDDING' ? 'text-neon-red animate-pulse' : 'text-white'}`}>
                      {phase === 'RESOLVING' ? '!' : countdown}
                    </span>
                  </div>

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

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 border border-border-custom rounded-xl p-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-av-muted font-bold uppercase truncate">Leader:</span>
                  {activeBidder ? (
                    <span className="font-extrabold truncate ml-1" style={{ color: activeBidder.primaryColor }}>
                      {activeBidder.emoji} {activeBidder.abbr}
                    </span>
                  ) : (
                    <span className="text-av-muted italic truncate ml-1">None</span>
                  )}
                </div>

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
                            : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] hover:scale-[1.02]'
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

          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-void/95 backdrop-blur-md border-t border-border-custom">
            <div className="flex items-stretch">
              {[
                { key: 'spotlight', label: 'Spotlight', icon: '🏏' },
                { key: 'standings', label: 'Standings', icon: '🏆' },
                { key: 'chat',      label: 'Chat',      icon: '💬' },
                { key: 'lineup',    label: 'HQ Lineup',   icon: '📋' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMobileTab(tab.key as any)}
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
        </>
      ) : (
        /* Premium Immersive Mode Layout */
        <div className={`flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-4 gap-4 relative z-10 ${
          cameraView === 'spotlight' ? 'bg-black/50 transition-colors duration-500 rounded-3xl' : ''
        }`}>
          {/* Camera switcher panel */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <span className="text-xs uppercase font-extrabold text-neon-gold tracking-widest block font-barlow">
                🏟️ VIRTUAL CAMERA TRANSMISSION
              </span>
              <span className="text-[10px] text-av-muted font-bold uppercase tracking-wider font-rajdhani">
                Select stadium angle feed
              </span>
            </div>
            {renderCameraSwitcher()}
          </div>

          {/* Central Area: Dynamic based on cameraView */}
          <div className="flex-1 min-h-[420px] grid grid-cols-12 gap-4 items-stretch">
            {cameraView === 'broadcast' && (
              <>
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
                  {renderPremiumBiddingPanel()}
                </div>

                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
                  {renderPremiumPlayerPresenterCard()}
                </div>
              </>
            )}

            {cameraView === 'stage' && (
              <div className="col-span-12 glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(214,175,55,0.07)_0%,_transparent_75%)] bg-void/50 border border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-around gap-8 my-auto w-full">
                  <div className="w-full md:w-6/12 glass-panel p-6 rounded-2xl border border-white/5 bg-void/40">
                    <span className="text-[8px] font-black uppercase text-neon-cyan tracking-wider block font-barlow mb-2">Stage LED Screen Left</span>
                    {currentPlayer ? (
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{currentPlayer.flag}</span>
                        <div>
                          <h4 className="font-black text-white text-base uppercase font-barlow">{currentPlayer.name}</h4>
                          <span className="text-xs text-av-muted font-bold block">{currentPlayer.role} • OVR {currentPlayer.overall}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-av-muted italic">No player nominated</span>
                    )}
                  </div>

                  <div className="w-full md:w-6/12 glass-panel p-6 rounded-2xl border border-white/5 bg-void/40 text-center">
                    <span className="text-[8px] font-black uppercase text-neon-gold tracking-wider block font-barlow mb-2">Stage LED Screen Right</span>
                    <span className="text-xs uppercase text-av-muted font-bold block leading-none mb-1">Current Price</span>
                    <span className="text-3xl font-black text-neon-green font-bebas tracking-wide">
                      {currentBidderId ? formatCr(currentBid) : `₹${currentPlayer?.basePrice.toFixed(2) || '0.00'} Cr`}
                    </span>
                    {activeBidder && (
                      <span className="text-xs text-white block mt-1 font-bold">by {activeBidder.name}</span>
                    )}
                  </div>
                </div>

                <div className="text-center text-[10px] text-av-muted font-bold uppercase tracking-widest border-t border-white/5 pt-3 mt-6">
                  🏟️ Stadium Auditorium Center Stage Feed
                </div>
              </div>
            )}

            {cameraView === 'spotlight' && (
              <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative">
                <div className="lg:col-span-8 flex flex-col">
                  {renderPremiumPlayerPresenterCard(true)}
                </div>
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="glass-panel rounded-3xl p-6 flex flex-col justify-center border-t border-white/20 border-neon-gold/50 shadow-[0_0_30px_rgba(245,197,24,0.1)] h-full justify-around">
                    <span className="text-[10px] font-black text-neon-gold uppercase tracking-wider block font-barlow text-center mb-4">Spotlight Bid Panel</span>
                    
                    <div className="text-center mb-6">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-av-muted block mb-1">
                        {currentBidderId ? 'Spotlight Price' : 'Opening Price'}
                      </span>
                      <h2 className="text-5xl font-black text-white font-bebas tracking-wide neon-glow-gold">{formatCr(currentBid)}</h2>
                      {activeBidder && (
                        <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-xs font-bold mt-2 bg-white/5 border border-white/10 text-white">
                          <span>{activeBidder.emoji}</span>
                          <span>{activeBidder.name}</span>
                        </div>
                      )}
                    </div>

                    {(phase === 'BIDDING' || phase === 'RESOLVING') && !paused && userTeamId ? (
                      <div>
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
                            btnText = `YOU LEAD`;
                            isDisabled = true;
                          } else if (isRosterFull) {
                            btnText = `ROSTER FULL`;
                            isDisabled = true;
                          } else if (isOverseasQuotaFull) {
                            btnText = `OVERSEAS FULL`;
                            isDisabled = true;
                          } else if (!hasPurse) {
                            btnText = `NO BUDGET`;
                            isDisabled = true;
                          }

                          return (
                            <button
                              onClick={() => placeBid()}
                              disabled={isDisabled}
                              className={`w-full py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-lg ${
                                isDisabled
                                  ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                                  : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:scale-[1.02] cursor-pointer'
                              }`}
                            >
                              {btnText}
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-void/50 border border-border-custom rounded-xl text-xs text-av-muted font-bold">
                        Bidding Closed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {cameraView === 'teams' && (
              <div className="col-span-12 glass-panel rounded-3xl p-6 flex flex-col justify-between border border-white/5 bg-void/30">
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-neon-gold tracking-widest block font-barlow mb-3">
                    👥 Franchise Tables Dashboard
                  </h3>
                  {renderTeamOwnerTables()}
                </div>
                <div className="text-center text-[10px] text-av-muted font-bold uppercase tracking-widest border-t border-white/5 pt-3 mt-4">
                  🎥 Wide Angle View of all 10 Team Owners
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row: Bid Battle tables & Bidding controls (except spotlight/teams) */}
          {cameraView !== 'teams' && cameraView !== 'spotlight' && (
            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] font-black text-av-muted uppercase tracking-wider block font-barlow mb-2">
                👥 Franchise Tables Feed
              </span>
              {renderTeamOwnerTables()}
            </div>
          )}

          {/* Bid controllers panel + Chat (for non-spotlight views) */}
          {cameraView !== 'spotlight' && (
            <div className="grid grid-cols-12 gap-4 mt-2">
              {cameraView !== 'broadcast' ? (
                <>
                  <div className="col-span-12 lg:col-span-6 glass-panel rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase text-av-muted font-barlow">
                        <span className={`h-2 w-2 rounded-full ${paused ? 'bg-neon-red' : 'bg-neon-green'} animate-pulse`} />
                        <span>{paused ? 'PAUSED' : 'LIVE COUNTDOWN'}</span>
                      </div>
                      
                      <div className="bg-void/85 border border-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-av-muted uppercase font-barlow">Timer</span>
                        <span className={`text-sm font-black font-bebas ${countdown <= 3 ? 'text-neon-red animate-pulse' : 'text-white'}`}>
                          {countdown}s
                        </span>
                      </div>
                    </div>

                    <div className="text-center my-3">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-av-muted block mb-0.5">
                        {currentBidderId ? 'Current Bid' : 'Base Price'}
                      </span>
                      <h3 className="text-3xl font-black text-white font-bebas tracking-wide">
                        {currentBidderId ? formatCr(currentBid) : `₹${currentPlayer?.basePrice.toFixed(2) || '0.00'} Cr`}
                      </h3>
                    </div>

                    {(phase === 'BIDDING' || phase === 'RESOLVING') && !paused && userTeamId ? (
                      <div className="flex gap-2">
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
                            btnText = `NO BUDGET`;
                            isDisabled = true;
                          }

                          return (
                            <button
                              onClick={() => placeBid()}
                              disabled={isDisabled}
                              className={`w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-200 shadow-md ${
                                isDisabled
                                  ? 'bg-glass border border-border-custom text-av-muted cursor-not-allowed opacity-60'
                                  : 'bg-gradient-to-r from-neon-gold to-yellow-500 text-midnight hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] hover:scale-[1.02] cursor-pointer'
                              }`}
                            >
                              {btnText}
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-2 bg-void/50 border border-border-custom rounded-xl text-xs text-av-muted font-bold">
                        {paused ? 'Paused' : 'Bidding Closed'}
                      </div>
                    )}
                  </div>

                  <div className="col-span-12 lg:col-span-6 glass-panel rounded-2xl p-5 flex flex-col justify-between max-h-[180px]">
                    <span className="text-[10px] font-black text-av-muted uppercase tracking-wider block font-barlow border-b border-white/5 pb-1 mb-2">
                      🎙️ Live Commentary Feed
                    </span>
                    
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-rajdhani">
                      {chatMessages.map((msg: any) => (
                        <div key={msg.id} className="flex items-center gap-1.5 leading-tight">
                          <span className="text-xs shrink-0">{msg.emoji}</span>
                          {msg.isSystem ? (
                            <span className="text-neon-cyan font-bold uppercase text-[9px]">{msg.text}</span>
                          ) : (
                            <span>
                              <span className="font-black text-white uppercase">{msg.sender}: </span>
                              <span className="text-av-muted">{msg.text}</span>
                            </span>
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-12 glass-panel rounded-2xl p-5 flex flex-col justify-between min-h-[120px] max-h-[180px]">
                  <span className="text-[10px] font-black text-av-muted uppercase tracking-wider block font-barlow border-b border-white/5 pb-1 mb-2">
                    🎙️ Live Commentary Feed
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-rajdhani">
                    {chatMessages.map((msg: any) => (
                      <div key={msg.id} className="flex items-center gap-1.5 leading-tight">
                        <span className="text-xs shrink-0">{msg.emoji}</span>
                        {msg.isSystem ? (
                          <span className="text-neon-cyan font-bold uppercase text-[9px]">{msg.text}</span>
                        ) : (
                          <span>
                            <span className="font-black text-white uppercase">{msg.sender}: </span>
                            <span className="text-av-muted">{msg.text}</span>
                          </span>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 3. Page Level SOLD & UNSOLD Banners (Broadcast overlays) ── */}
      <AnimatePresence>
        {viewMode === 'premium' && phase === 'SOLD' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-md overflow-hidden"
          >
            {/* Confetti drop */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded"
                  style={{
                    backgroundColor: activeBidder?.primaryColor || '#FFD700',
                    left: `${4 + (i * 4)}%`,
                    top: '-15px',
                  }}
                  animate={{
                    y: ['0px', '125vh'],
                    opacity: [1, 0],
                    rotate: [0, 720],
                  }}
                  transition={{
                    duration: 1.5 + (i % 4) * 0.4,
                    repeat: Infinity,
                    delay: i * 0.08,
                  }}
                />
              ))}
            </div>

            <motion.div
              animate={{ rotate: [0, -35, 10, -25, 0] }}
              transition={{ duration: 0.6 }}
              className="text-7xl mb-4"
            >🔨</motion.div>
            <motion.h1
              animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1] }}
              className="text-8xl font-black text-neon-green tracking-widest uppercase mb-4 font-bebas neon-glow-green"
            >
              SOLD!
            </motion.h1>
            {activeBidder && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  style={{
                    boxShadow: `0 0 40px ${activeBidder.primaryColor}`,
                    border: `3px solid ${activeBidder.primaryColor}`,
                  }}
                  className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-6xl"
                >
                  {activeBidder.emoji}
                </div>
                <h3 className="text-2xl font-black text-white uppercase font-barlow mt-2">
                  {currentPlayer?.name}
                </h3>
                <p className="text-lg text-av-muted">
                  Sold to{' '}
                  <span style={{ color: activeBidder.primaryColor }} className="font-extrabold">
                    {activeBidder.name}
                  </span>
                </p>
                <p className="text-4xl font-black text-neon-green font-bebas tracking-wide mt-2">
                  {formatCr(currentBid)}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {viewMode === 'premium' && phase === 'UNSOLD' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-center z-50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 3, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="text-8xl font-black text-neon-red tracking-widest uppercase mb-4 font-bebas stamp-unsold border-4 border-neon-red px-8 py-2 rounded-2xl"
            >
              UNSOLD
            </motion.div>
            <p className="text-lg text-av-muted font-barlow uppercase mt-4">
              No bid matched the base price for {currentPlayer?.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Voice settings overlay */}
      <AnimatePresence>
        {isVoiceSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-border-custom flex justify-between items-center bg-void/50">
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">
                    Voice & Sound Settings
                  </h3>
                  <p className="text-[10px] text-av-muted mt-0.5 font-bold">Configure auction audio and voice channel</p>
                </div>
                <button onClick={() => setIsVoiceSettingsOpen(false)} className="p-1 text-av-muted hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 max-h-[70vh]">
                <div className="space-y-2.5 text-xs">
                  <h4 className="font-bold text-neon-gold uppercase text-[10px] tracking-wider mb-2">Sound Toggles</h4>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-av-muted">Auction Sound</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, auctionSound: !prev.auctionSound }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.auctionSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                    >
                      {settings.auctionSound ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-av-muted">Voice Chat</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, voiceChat: !prev.voiceChat }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.voiceChat ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                    >
                      {settings.voiceChat ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-av-muted">Countdown Sound</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, countdownSound: !prev.countdownSound }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.countdownSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                    >
                      {settings.countdownSound ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-av-muted">Hammer Sound</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, hammerSound: !prev.hammerSound }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.hammerSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                    >
                      {settings.hammerSound ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-av-muted">Notification Sound</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, notificationSound: !prev.notificationSound }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${settings.notificationSound ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-void text-av-muted border border-white/5'}`}
                    >
                      {settings.notificationSound ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-av-muted">
                      <span>Speaker Volume</span>
                      <span>{Math.round(speakerVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={speakerVolume}
                      onChange={(e) => handleSpeakerVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-void rounded-lg appearance-none cursor-pointer accent-neon-gold"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <h4 className="font-bold text-neon-gold uppercase text-[10px] tracking-wider mb-2 flex justify-between items-center">
                    <span>Voice Participants ({Object.keys(voiceParticipants).length})</span>
                    {isVoiceJoined && <span className="text-[8px] bg-neon-green/15 text-neon-green border border-neon-green/30 px-1.5 py-0.5 rounded font-black animate-pulse">Connected</span>}
                  </h4>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {Object.values(voiceParticipants).length === 0 ? (
                      <div className="text-center py-4 text-[10px] text-av-muted italic">
                        No participants connected to voice
                      </div>
                    ) : (
                      Object.values(voiceParticipants).map((p) => {
                        const team = TEAMS_DB.find((t) => t.id === p.teamId);
                        return (
                          <div
                            key={p.socketId}
                            className={`flex items-center justify-between p-2 rounded-lg bg-void/30 border transition-all duration-200 ${
                              p.speaking
                                ? 'border-neon-green/40 shadow-[0_0_10px_rgba(57,255,20,0.05)] bg-neon-green/5'
                                : 'border-white/5'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="text-xs shrink-0">{p.speaking ? '🎤' : p.muted ? '🔇' : '🎤'}</span>
                              <div className="min-w-0">
                                <span className={`text-[11px] font-bold block truncate uppercase ${
                                  p.speaking ? 'text-neon-green' : 'text-white'
                                }`}>
                                  {p.name}
                                </span>
                                <span className="text-[9px] text-av-muted block leading-none mt-0.5">
                                  {team ? `${team.emoji} ${team.abbr}` : '👀 Spectator'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  {isVoiceJoined ? (
                    <button
                      onClick={() => {
                        leaveVoiceChannel();
                        setIsVoiceSettingsOpen(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-neon-red hover:bg-red-600 text-white font-extrabold text-xs uppercase cursor-pointer text-center"
                    >
                      Disconnect Voice Channel
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        joinVoiceChannel();
                        setIsVoiceSettingsOpen(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-neon-cyan hover:bg-cyan-600 text-midnight font-extrabold text-xs uppercase cursor-pointer text-center"
                    >
                      Connect Voice Channel
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <div className="bg-void/40 border border-white/5 rounded-xl p-3 space-y-2 mt-2">
                    <span className="text-[9px] uppercase font-black text-neon-gold block leading-none">
                      Voice Admin Controls
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase">
                      <button
                        onClick={() => {
                          socket.emit('admin-voice-control', { roomCode, action: 'mute-all' });
                          setIsVoiceSettingsOpen(false);
                        }}
                        className="bg-glass border border-border-custom hover:bg-glass-hover hover:border-neon-gold/50 p-2 rounded-lg text-center cursor-pointer text-white"
                      >
                        Mute All
                      </button>
                      <button
                        onClick={() => {
                          socket.emit('admin-voice-control', { roomCode, action: 'end-voice' });
                          setIsVoiceSettingsOpen(false);
                        }}
                        className="bg-glass border border-border-custom hover:bg-glass-hover hover:border-neon-red/50 p-2 rounded-lg text-center cursor-pointer text-neon-red"
                      >
                        End Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
