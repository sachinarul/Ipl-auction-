import { create } from 'zustand';
import { Player, Team, BidEntry, TeamId, AuctionPhase } from '@/types';
import { socket } from '@/lib/socket';

interface ChatMessage {
  id: string;
  sender: string;
  emoji: string;
  text: string;
  timestamp: number;
}

interface AuctionStore {
  // Multiplayer room state
  roomCode: string | null;
  userTeamId: TeamId | null;
  userName: string;
  isAdmin: boolean;
  isReady: boolean;
  locked: boolean;
  paused: boolean;
  phase: AuctionPhase;
  countdown: number;
  countdownText: string | null;
  timerDuration: number;
  enableAITeams: boolean;
  minPlayersToStart: number;
  
  // Game data sync
  teams: Team[];
  currentPlayer: Player | null;
  currentBid: number;
  currentBidderId: TeamId | null;
  bidHistory: BidEntry[];
  chatMessages: ChatMessage[];
  participants: Array<{
    socketId: string;
    token: string;
    name: string;
    teamId: string;
    isReady: boolean;
    isAdmin: boolean;
  }>;
  playerQueue: Player[];
  currentIndex: number;
  
  // Connection states
  isConnected: boolean;
  errorMsg: string | null;
  playerToken: string | null;
  
  // Local interface actions
  selectUserTeam: (teamId: TeamId) => void;
  setUserName: (name: string) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
  
  // Room action dispatchers
  createRoom: (roomName: string, adminName: string, teamId: TeamId, type: 'public' | 'private', password?: string, enableAITeams?: boolean, minPlayersToStart?: number, timerDuration?: number) => void;
  joinRoom: (roomCode: string, name: string, teamId: TeamId | null, password?: string, callback?: (res: { success: boolean; reason?: string }) => void, isInviteLink?: boolean) => void;
  getRoomInfo: (roomCode: string) => void;
  rejoinRoom: (roomCode: string, token: string, callback?: (res: { success: boolean; reason?: string }) => void) => void;
  toggleReady: () => void;
  changeTeam: (newTeamId: TeamId, callback?: (res: { success: boolean; reason?: string }) => void) => void;
  placeBid: (callback?: (res: { success: boolean; reason?: string }) => void) => void;
  sendChatMessage: (text: string) => void;
  triggerAdminAction: (action: string, extra?: any) => void;
  clearError: () => void;
}

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  roomCode: null,
  userTeamId: null,
  userName: '',
  isAdmin: false,
  isReady: false,
  locked: false,
  paused: false,
  phase: 'WAITING',
  countdown: 10,
  countdownText: null,
  timerDuration: 10,
  enableAITeams: false,
  minPlayersToStart: 1,
  
  teams: [],
  currentPlayer: null,
  currentBid: 0,
  currentBidderId: null,
  bidHistory: [],
  chatMessages: [],
  participants: [],
  playerQueue: [],
  currentIndex: 0,
  
  isConnected: false,
  errorMsg: null,
  playerToken: typeof window !== 'undefined' ? localStorage.getItem('av_player_token') : null,

  selectUserTeam: (teamId: TeamId) => {
    set({ userTeamId: teamId });
  },

  setUserName: (name: string) => {
    set({ userName: name });
  },

  connectSocket: () => {
    if (socket.connected) return;
    
    socket.connect();
    
    socket.on('connect', () => {
      set({ isConnected: true, errorMsg: null });
      
      // Auto-rejoin if tokens exist
      const token = get().playerToken;
      const code = get().roomCode || (typeof window !== 'undefined' ? localStorage.getItem('av_room_code') : null);
      if (token && code) {
        get().rejoinRoom(code, token);
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('room-state', (state: any) => {
      const currentSocketId = socket.id;
      const token = get().playerToken;
      const me = state.participants.find((p: any) => p.token === token || p.socketId === currentSocketId);
      
      set({
        roomCode: state.code,
        locked: state.locked,
        paused: state.paused,
        phase: state.phase,
        countdown: state.countdown,
        countdownText: state.countdownText || null,
        timerDuration: state.timerDuration || 10,
        currentPlayer: state.currentPlayer,
        currentBid: state.currentBid,
        currentBidderId: state.currentBidderId,
        bidHistory: state.bidHistory,
        participants: state.participants,
        teams: state.teams,
        playerQueue: state.playerQueue || [],
        currentIndex: state.currentIndex || 0,
        enableAITeams: state.enableAITeams || false,
        minPlayersToStart: state.minPlayersToStart || 1,
        isAdmin: me ? me.isAdmin : false,
        isReady: me ? me.isReady : false,
        userTeamId: me ? me.teamId : null
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('av_room_code', state.code);
      }
    });

    socket.on('bid-placed', ({ teamId, amount, roomState }: any) => {
      set({
        currentBid: amount,
        currentBidderId: teamId,
        countdown: roomState.countdown,
        countdownText: roomState.countdownText || null,
        timerDuration: roomState.timerDuration || 10,
        bidHistory: roomState.bidHistory,
        teams: roomState.teams
      });
    });

    socket.on('countdown-tick', ({ countdown }: any) => {
      set({ countdown });
    });

    socket.on('chat-message', (msg: any) => {
      set((prev) => ({ chatMessages: [...prev.chatMessages, msg].slice(-100) }));
    });

    socket.on('player-sold', ({ player, teamId, price }: any) => {
      set({ phase: 'SOLD' });
    });

    socket.on('player-unsold', ({ player }: any) => {
      set({ phase: 'UNSOLD' });
    });

    socket.on('kicked', () => {
      get().disconnectSocket();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('av_player_token');
        localStorage.removeItem('av_room_code');
      }
      set({
        roomCode: null,
        userTeamId: null,
        playerToken: null,
        isAdmin: false,
        isReady: false,
        phase: 'WAITING',
        errorMsg: 'You were kicked from the room by the admin'
      });
    });
  },

  disconnectSocket: () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('room-state');
    socket.off('bid-placed');
    socket.off('countdown-tick');
    socket.off('chat-message');
    socket.off('player-sold');
    socket.off('player-unsold');
    socket.off('kicked');
    socket.disconnect();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('av_player_token');
      localStorage.removeItem('av_room_code');
    }

    set({
      isConnected: false,
      roomCode: null,
      playerToken: null,
      chatMessages: [],
      errorMsg: null
    });
  },

  createRoom: (roomName, adminName, teamId, type, password, enableAITeams, minPlayersToStart, timerDuration) => {
    get().disconnectSocket();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('av_player_token');
      localStorage.removeItem('av_room_code');
    }
    set({ roomCode: null, playerToken: null });

    get().connectSocket();
    
    const emitCreate = () => {
      if (socket.connected) {
        socket.emit('create-room', { roomName, adminName, teamId, type, password, enableAITeams, minPlayersToStart, timerDuration });
        
        socket.once('room-created', ({ roomCode, playerToken }) => {
          set({ roomCode, playerToken });
          if (typeof window !== 'undefined') {
            localStorage.setItem('av_player_token', playerToken);
            localStorage.setItem('av_room_code', roomCode);
          }
        });
      } else {
        setTimeout(emitCreate, 200);
      }
    };
    
    emitCreate();
  },

  joinRoom: (roomCode, name, teamId, password, callback, isInviteLink) => {
    get().disconnectSocket();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('av_player_token');
      localStorage.removeItem('av_room_code');
    }
    set({ roomCode: null, playerToken: null });

    get().connectSocket();
    
    const emitJoin = () => {
      if (socket.connected) {
        socket.emit('join-room', { roomCode, name, teamId, password, isInviteLink }, (res: { success: boolean; reason?: string; playerToken?: string }) => {
          if (res.success && res.playerToken) {
            set({ roomCode, userName: name, playerToken: res.playerToken });
            if (typeof window !== 'undefined') {
              localStorage.setItem('av_player_token', res.playerToken);
              localStorage.setItem('av_room_code', roomCode);
            }
            if (callback) callback({ success: true });
          } else {
            set({ errorMsg: res.reason || 'Failed to join' });
            if (callback) callback({ success: false, reason: res.reason });
          }
        });
      } else {
        setTimeout(emitJoin, 200);
      }
    };
    
    emitJoin();
  },

  getRoomInfo: (roomCode) => {
    get().connectSocket();
    
    const emitGetInfo = () => {
      if (socket.connected) {
        socket.emit('get-room-info', { roomCode }, (res: { success: boolean; reason?: string; room?: any }) => {
          if (res.success && res.room) {
            set({
              locked: res.room.locked,
              paused: res.room.paused,
              phase: res.room.phase,
              countdown: res.room.countdown,
              currentPlayer: res.room.currentPlayer,
              currentBid: res.room.currentBid,
              currentBidderId: res.room.currentBidderId,
              bidHistory: res.room.bidHistory,
              participants: res.room.participants,
              teams: res.room.teams,
              playerQueue: res.room.playerQueue || [],
              currentIndex: res.room.currentIndex || 0,
              enableAITeams: res.room.enableAITeams || false,
              minPlayersToStart: res.room.minPlayersToStart || 1,
            });
          } else {
            set({ errorMsg: res.reason || 'Failed to fetch room info' });
          }
        });
      } else {
        setTimeout(emitGetInfo, 200);
      }
    };
    
    emitGetInfo();
  },

  rejoinRoom: (roomCode, token, callback) => {
    get().connectSocket();

    const emitRejoin = () => {
      if (socket.connected) {
        socket.emit('rejoin-room', { roomCode, playerToken: token }, (res: { success: boolean; reason?: string }) => {
          if (res.success) {
            set({ roomCode, playerToken: token });
            if (callback) callback({ success: true });
          } else {
            // Token expired or invalid, clear cache
            if (typeof window !== 'undefined') {
              localStorage.removeItem('av_player_token');
              localStorage.removeItem('av_room_code');
            }
            set({ playerToken: null, roomCode: null });
            if (callback) callback({ success: false, reason: res.reason });
          }
        });
      } else {
        setTimeout(emitRejoin, 200);
      }
    };

    emitRejoin();
  },

  toggleReady: () => {
    const { roomCode } = get();
    if (roomCode) {
      socket.emit('toggle-ready', { roomCode });
    }
  },

  changeTeam: (newTeamId, callback) => {
    const { roomCode } = get();
    if (roomCode) {
      socket.emit('change-team', { roomCode, teamId: newTeamId }, (res: { success: boolean; reason?: string }) => {
        if (res.success) {
          set({ userTeamId: newTeamId });
          if (callback) callback({ success: true });
        } else {
          set({ errorMsg: res.reason || 'Failed to change team' });
          if (callback) callback({ success: false, reason: res.reason });
        }
      });
    }
  },

  placeBid: (callback) => {
    const { roomCode } = get();
    if (roomCode) {
      socket.emit('place-bid', { roomCode }, (res: { success: boolean; reason?: string }) => {
        if (res.success) {
          if (callback) callback({ success: true });
        } else {
          set({ errorMsg: res.reason || 'Failed to place bid' });
          if (callback) callback({ success: false, reason: res.reason });
        }
      });
    }
  },

  sendChatMessage: (text) => {
    const { roomCode } = get();
    if (roomCode && text.trim()) {
      socket.emit('send-message', { roomCode, text });
    }
  },

  triggerAdminAction: (action, extra) => {
    const { roomCode } = get();
    if (roomCode) {
      socket.emit('admin-action', { roomCode, action, extra }, (res: { success: boolean; reason?: string }) => {
        if (!res.success) {
          set({ errorMsg: res.reason || 'Admin action failed' });
        }
      });
    }
  },

  clearError: () => {
    set({ errorMsg: null });
  }
}));
