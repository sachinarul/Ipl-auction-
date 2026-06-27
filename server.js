const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

// Initialize Prisma
const prisma = new PrismaClient();
let dbConnected = false;

prisma.$connect()
  .then(() => {
    dbConnected = true;
    console.log('[Prisma] Connected to PostgreSQL database successfully.');
  })
  .catch((err) => {
    console.warn('[Prisma] Warning: Could not connect to database. Running in memory-only mode. Details:', err.message);
  });

// Dynamic Teams list
const TEAMS = [
  { id: 'mi', name: 'Mumbai Indians', abbr: 'MI', emoji: '💙', primaryColor: '#004BA0', strategy: 'aggressive' },
  { id: 'csk', name: 'Chennai Super Kings', abbr: 'CSK', emoji: '💛', primaryColor: '#FFC107', strategy: 'balanced' },
  { id: 'rcb', name: 'Royal Challengers Bengaluru', abbr: 'RCB', emoji: '❤️', primaryColor: '#CC2200', strategy: 'star-hunter' },
  { id: 'kkr', name: 'Kolkata Knight Riders', abbr: 'KKR', emoji: '💜', primaryColor: '#3A225D', strategy: 'balanced' },
  { id: 'dc', name: 'Delhi Capitals', abbr: 'DC', emoji: '🔵', primaryColor: '#17449B', strategy: 'conservative' },
  { id: 'srh', name: 'Sunrisers Hyderabad', abbr: 'SRH', emoji: '🟠', primaryColor: '#F7612D', strategy: 'aggressive' },
  { id: 'rr', name: 'Rajasthan Royals', abbr: 'RR', emoji: '💗', primaryColor: '#EA1B8B', strategy: 'youth-focused' },
  { id: 'pbks', name: 'Punjab Kings', abbr: 'PBKS', emoji: '🔴', primaryColor: '#AA4545', strategy: 'aggressive' },
  { id: 'gt', name: 'Gujarat Titans', abbr: 'GT', emoji: '🔷', primaryColor: '#1C4A6B', strategy: 'conservative' },
  { id: 'lsg', name: 'Lucknow Super Giants', abbr: 'LSG', emoji: '🩵', primaryColor: '#00ADEF', strategy: 'balanced' }
];

// V3: New IPL structured player sets
const SET_ORDER = [
  'MARQUEE', 'SET 1', 'SET 2', 'SET 3', 'SET 4',
  'BA1', 'AL1', 'WK1', 'FA1', 'SP1',
  'UBA1', 'UAL1', 'UWK1', 'UFA1', 'USP1',
  'BA2', 'AL2', 'WK2', 'FA2', 'SP2',
  'UBA2', 'UAL2', 'UWK2', 'UFA2', 'USP2',
  'AL3', 'FA3', 'UBA3', 'UAL3', 'UWK3', 'UFA3', 'USP3',
  'AL4', 'FA4', 'UBA4', 'UAL4', 'UFA4', 'USP4',
  'FA5', 'UAL5', 'UFA5', 'UAL6', 'UFA6', 'UAL7', 'UAL8', 'UAL9', 'UAL10'
];

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // ─── Database Persist Helpers ───────────────────────────────────────────────

  async function dbCreateRoom(roomCode, name, type, adminToken, adminName, teamId) {
    if (!dbConnected) return;
    try {
      await prisma.auctionRoom.create({
        data: {
          code: roomCode,
          name: name,
          type: type,
          adminId: adminToken,
          status: 'lobby',
          phase: 'WAITING',
          countdown: 10,
          currentBid: 0,
          currentIndex: 0,
          participants: {
            create: {
              token: adminToken,
              socketId: 'host',
              name: adminName,
              teamId: teamId,
              isReady: true,
              isAdmin: true,
              role: 'admin'
            }
          },
          teams: {
            create: TEAMS.map(t => ({
              teamKey: t.id,
              name: t.name,
              abbr: t.abbr,
              emoji: t.emoji,
              primaryColor: t.primaryColor,
              purse: 120.0
            }))
          }
        }
      });
      console.log(`[Database] Room ${roomCode} saved to PostgreSQL.`);
    } catch (err) {
      console.error('[Database] Error saving room:', err.message);
    }
  }

  async function dbAddParticipant(roomCode, token, socketId, name, teamId, isAdmin) {
    if (!dbConnected) return;
    try {
      await prisma.participant.create({
        data: {
          token,
          socketId,
          name,
          teamId,
          isReady: isAdmin,
          isAdmin,
          role: isAdmin ? 'admin' : (teamId ? 'owner' : 'spectator'),
          roomCode
        }
      });
      console.log(`[Database] Participant ${name} saved to room ${roomCode}.`);
    } catch (err) {
      console.error('[Database] Error saving participant:', err.message);
    }
  }

  async function dbUpdateParticipantReady(roomCode, token, isReady) {
    if (!dbConnected) return;
    try {
      await prisma.participant.update({
        where: { token },
        data: { isReady }
      });
    } catch (err) {
      console.error('[Database] Error updating participant ready status:', err.message);
    }
  }

  async function dbUpdateRoomStatus(roomCode, status, phase, currentIndex, currentBid, currentBidderId, paused, locked) {
    if (!dbConnected) return;
    try {
      await prisma.auctionRoom.update({
        where: { code: roomCode },
        data: {
          status,
          phase,
          currentIndex,
          currentBid,
          currentBidderId,
          paused,
          locked
        }
      });
    } catch (err) {
      console.error('[Database] Error updating room status:', err.message);
    }
  }

  async function dbAddBid(roomCode, teamId, amount) {
    if (!dbConnected) return;
    try {
      await prisma.bid.create({
        data: {
          amount,
          teamId,
          roomCode
        }
      });
    } catch (err) {
      console.error('[Database] Error saving bid:', err.message);
    }
  }

  async function dbAddChatMessage(roomCode, sender, emoji, text) {
    if (!dbConnected) return;
    try {
      await prisma.chatMessage.create({
        data: {
          sender,
          emoji,
          text,
          roomCode
        }
      });
    } catch (err) {
      console.error('[Database] Error saving chat message:', err.message);
    }
  }

  async function dbAddAuctionLog(roomCode, action, message) {
    if (!dbConnected) return;
    try {
      await prisma.auctionLog.create({
        data: {
          action,
          message,
          roomCode
        }
      });
    } catch (err) {
      console.error('[Database] Error saving auction log:', err.message);
    }
  }

  async function dbAddAuctionResult(roomCode, playerName, soldTo, price, category) {
    if (!dbConnected) return;
    try {
      await prisma.auctionResult.create({
        data: {
          playerName,
          soldTo,
          price,
          category,
          roomCode
        }
      });
    } catch (err) {
      console.error('[Database] Error saving auction result:', err.message);
    }
  }

  // ─── Socket.IO Room State Store ─────────────────────────────────────────────

  const activeRooms = {};

  // Reconnection token registry
  const tokenToParticipant = {};
  const adminDisconnectBuffers = {};

  // ─── Server Tick Loop (1 second) ────────────────────────────────────────────

  setInterval(() => {
    Object.keys(activeRooms).forEach((roomCode) => {
      const room = activeRooms[roomCode];
      if (room.status !== 'auction' || room.paused) return;

      if (room.phase === 'BIDDING') {
        room.tickCount = (room.tickCount || 0) + 1;
        if (room.tickCount >= 2) {
          room.tickCount = 0;
          room.countdown--;
          io.to(roomCode).emit('countdown-tick', { countdown: room.countdown });

          if (room.countdown <= 0) {
            if (room.currentBidderId) {
              room.phase = 'RESOLVING';
              room.countdownText = 'GOING ONCE';
              room.countdown = 3; // 3 ticks of 500ms = 1.5s
              room.tickCount = 0;
              io.to(roomCode).emit('room-state', getSerializableRoomState(room));
            } else {
              // No bidder — immediately unsold
              resolvePlayer(roomCode);
            }
          }
        }
      }
      else if (room.phase === 'RESOLVING') {
        room.countdown--;
        if (room.countdown <= 0) {
          if (room.countdownText === 'GOING ONCE') {
            room.countdownText = 'GOING TWICE';
            room.countdown = 3; // 3 ticks of 500ms = 1.5s
            io.to(roomCode).emit('room-state', getSerializableRoomState(room));
          } else if (room.countdownText === 'GOING TWICE') {
            // Final call — resolve (SOLD)
            resolvePlayer(roomCode);
          }
        }
      }
      else if (room.phase === 'SOLD' || room.phase === 'UNSOLD') {
        room.tickCount = (room.tickCount || 0) + 1;
        if (room.tickCount >= 2) {
          room.tickCount = 0;
          room.countdown--;
          if (room.countdown <= 0) {
            room.currentIndex++;
            loadNextPlayer(roomCode);
          }
        }
      }
    });
  }, 500);

  function getNextIncrement(bid) {
    if (bid < 0.50) return 0.05;   // 5L increments: 20L→25L→30L→35L→40L→45L
    if (bid < 1.00) return 0.10;   // 10L increments: 50L→60L→70L→80L→90L
    if (bid < 2.00) return 0.10;   // 10L increments: 1Cr→1.10Cr→1.20Cr→1.30Cr
    if (bid < 5.00) return 0.20;   // 20L increments: 2Cr→2.20Cr→2.40Cr
    if (bid < 10.00) return 0.25;  // 25L increments: 5Cr→5.25Cr→5.50Cr
    if (bid < 20.00) return 0.50;  // 50L increments: 10Cr→10.50Cr
    return 1.00;                   // 1Cr increments: 20Cr+
  }

  function getNextBid(bid) {
    return parseFloat((bid + getNextIncrement(bid)).toFixed(2));
  }

  // ─── V3: formatCr – full words ───────────────────────────────────────────

  function formatCr(val) {
    if (val < 1.00) return `₹${Math.round(val * 100)} Lakhs`;
    return `₹${val.toFixed(2)} Crore`;
  }

  // ─── Serializable Room State ─────────────────────────────────────────────

  function getSerializableRoomState(room) {
    return {
      code: room.code,
      name: room.name,
      type: room.type,
      status: room.status,
      adminName: room.adminName,
      adminToken: room.adminToken,
      locked: room.locked,
      paused: room.paused,
      phase: room.phase,
      countdown: room.countdown,
      countdownText: room.countdownText || null,
      timerDuration: room.timerDuration || 10,
      currentPlayer: room.currentPlayer,
      currentBid: room.currentBid,
      currentBidderId: room.currentBidderId,
      bidHistory: room.bidHistory,
      participants: room.participants,
      teams: Object.values(room.teams),
      enableAITeams: room.enableAITeams,
      minPlayersToStart: room.minPlayersToStart,
      setOrder: room.setOrder || [],
      disabledSets: room.disabledSets || [],
      playerQueue: room.playerQueue ? room.playerQueue.map(p => ({
        id: p.id,
        name: p.name,
        country: p.country,
        role: p.role,
        basePrice: p.basePrice,
        overseas: p.overseas,
        category: p.category,
        overall: p.overall,
        marketValueScore: p.marketValueScore
      })) : [],
      currentIndex: room.currentIndex || 0,
      submittedTeams: room.submittedTeams || {},
      aiRankings: room.aiRankings || null,
      rankingsPublished: room.rankingsPublished || false,
      lockedRankings: room.lockedRankings || false
    };
  }

  // ─── Load Next Player ────────────────────────────────────────────────────

  function loadNextPlayer(roomCode) {
    const room = activeRooms[roomCode];
    if (!room) return;

    if (room.currentIndex >= room.playerQueue.length) {
      room.status = 'complete';
      room.phase = 'COMPLETE';
      autoSubmitAITeams(roomCode, false);
      io.to(roomCode).emit('room-state', getSerializableRoomState(room));
      return;
    }

    const player = room.playerQueue[room.currentIndex];
    
    // V3: Set transition check
    const prevCategory = room.currentCategory;
    const newCategory = player.set;

    if (prevCategory !== newCategory) {
      room.currentCategory = newCategory;
      room.currentPlayer = player;
      room.phase = 'SET_ANNOUNCEMENT';
      room.countdownText = newCategory;
      room.countdown = 4;

      io.to(roomCode).emit('room-state', getSerializableRoomState(room));

      // Delay actual bidding starts by 4 seconds for screen announcement overlay
      setTimeout(() => {
        const currentRoom = activeRooms[roomCode];
        if (!currentRoom || currentRoom.phase !== 'SET_ANNOUNCEMENT' || currentRoom.currentIndex !== room.currentIndex) return;

        currentRoom.currentBid = player.basePrice;
        currentRoom.currentBidderId = null;
        currentRoom.countdown = player.isAccelerated ? 5 : (currentRoom.timerDuration || 10);
        currentRoom.countdownText = null;
        currentRoom.phase = 'BIDDING';
        currentRoom.tickCount = 0;
        currentRoom.bidHistory = [];

        io.to(roomCode).emit('room-state', getSerializableRoomState(currentRoom));

        // Schedule AI Bidding round checking
        setTimeout(() => runAIRound(roomCode), player.isAccelerated ? 500 : 1500);
      }, 4000);

      return;
    }

    room.currentPlayer = player;
    room.currentBid = player.basePrice;
    room.currentBidderId = null;
    room.countdown = player.isAccelerated ? 5 : (room.timerDuration || 10);
    room.countdownText = null;
    room.phase = 'BIDDING';
    room.tickCount = 0;
    room.bidHistory = [];

    io.to(roomCode).emit('room-state', getSerializableRoomState(room));

    // Schedule AI Bidding round checking
    setTimeout(() => runAIRound(roomCode), player.isAccelerated ? 500 : 1500);
  }

  // ─── Resolve Player (SOLD / UNSOLD) ─────────────────────────────────────

  function resolvePlayer(roomCode, forceUnsold = false) {
    const room = activeRooms[roomCode];
    if (!room) return;
    room.tickCount = 0;

    const player = room.currentPlayer;
    const winnerId = room.currentBidderId;

    if (!winnerId || forceUnsold) {
      room.phase = 'UNSOLD';
      room.countdown = 2;
      room.countdownText = 'UNSOLD';
      io.to(roomCode).emit('player-unsold', { player });

      // V3: Move to 'Unsold Pool' category at the end of queue if first pass
      if (player.category !== 'Unsold Pool') {
        const unsoldPlayer = { ...player, category: 'Unsold Pool' };
        room.playerQueue.push(unsoldPlayer);
      }

      // Emit to chat feed
      io.to(roomCode).emit('chat-message', {
        id: `unsold-${Date.now()}-${Math.random()}`,
        sender: 'System (Auctioneer)',
        emoji: '❌',
        text: `${player.name} went UNSOLD`,
        timestamp: Date.now(),
        isSystem: true,
        isUnsold: true
      });

      // DB Logs
      dbAddAuctionResult(roomCode, player.name, 'UNSOLD', 0, player.category);
      dbAddAuctionLog(roomCode, 'unsold', `${player.name} went unsold`);
      dbUpdateRoomStatus(roomCode, room.status, 'UNSOLD', room.currentIndex, 0, null, room.paused, room.locked);
      io.to(roomCode).emit('room-state', getSerializableRoomState(room));
    } else {
      const finalPrice = room.currentBid;
      const team = room.teams[winnerId];

      team.purse = parseFloat((team.purse - finalPrice).toFixed(2));
      const updatedPlayer = {
        ...player,
        soldPrice: finalPrice,
        currentTeam: winnerId,
        auctionStatus: 'SOLD'
      };
      team.squad.push(updatedPlayer);

      room.phase = 'SOLD';
      room.countdown = 2;
      room.countdownText = 'SOLD';

      io.to(roomCode).emit('player-sold', { player: updatedPlayer, teamId: winnerId, price: finalPrice });

      io.to(roomCode).emit('chat-message', {
        id: `sold-${Date.now()}-${Math.random()}`,
        sender: 'System (Auctioneer)',
        emoji: '🔨',
        text: `SOLD TO ${team.abbr.toUpperCase()} FOR ${formatCr(finalPrice)}`,
        timestamp: Date.now(),
        isSystem: true,
        isWinner: true
      });

      // DB Logs
      dbAddAuctionResult(roomCode, player.name, winnerId, finalPrice, player.category);
      dbAddAuctionLog(roomCode, 'sold', `${player.name} sold to ${winnerId.toUpperCase()} for ₹${finalPrice} Crore`);
      dbUpdateRoomStatus(roomCode, room.status, 'SOLD', room.currentIndex, finalPrice, winnerId, room.paused, room.locked);
      io.to(roomCode).emit('room-state', getSerializableRoomState(room));
    }
  }

  // ─── AI Bidding Loop ─────────────────────────────────────────────────────

  function runAIRound(roomCode) {
    const room = activeRooms[roomCode];
    if (!room || room.status !== 'auction' || room.paused || (room.phase !== 'BIDDING' && room.phase !== 'RESOLVING')) return;
    if (!room.enableAITeams) return;

    // Filter AI unowned teams that aren't the current highest bidder
    const aiTeamIds = Object.keys(room.teams).filter(id => {
      const team = room.teams[id];
      return !team.isHuman && id !== room.currentBidderId;
    });

    if (aiTeamIds.length === 0) return;

    const randomTeamId = aiTeamIds[Math.floor(Math.random() * aiTeamIds.length)];
    const team = room.teams[randomTeamId];
    const player = room.currentPlayer;

    if (!player) return;

    const nextBid = getNextBid(room.currentBid);

    if (team.purse >= nextBid && team.squad.length < 25) {
      // Limit overseas slots
      const osCount = team.squad.filter(p => p.overseas).length;
      if (player.overseas && osCount >= 8) return;

      // Calculate value ceiling based on budget, personality, and player's marketValueScore (MVS)
      const strategy = team.strategy || 'balanced';
      const remainingSlots = Math.max(1, 25 - team.squad.length);
      const budgetPerSlot = team.purse / remainingSlots;
      const personalityMultiplier = strategy === 'aggressive' ? 0.22 :
                                    strategy === 'star-hunter' ? 0.20 :
                                    strategy === 'conservative' ? 0.09 :
                                    strategy === 'youth-focused' ? 0.14 : 0.15;

      const mvs = player.marketValueScore || player.overall;
      const starBonus = mvs >= 90 ? 1.5 : mvs >= 80 ? 1.2 : 0.9;
      const maxWilling = mvs * budgetPerSlot * personalityMultiplier * starBonus;

      if (nextBid > maxWilling) return;

      // Determine probability based on strategy, category, and budget pressure
      let shouldBid = false;
      const isMarquee = player.set === 'MARQUEE';

      let prob = 0.45;
      if (strategy === 'aggressive') prob = 0.65;
      else if (strategy === 'conservative') prob = 0.25;
      else if (strategy === 'star-hunter') prob = (isMarquee || mvs >= 85) ? 0.75 : 0.15;
      else if (strategy === 'youth-focused') prob = player.age <= 24 ? 0.65 : (player.age >= 32 ? 0.20 : 0.45);

      // Reduce probability as nextBid approaches maxWilling
      const margin = (maxWilling - nextBid) / maxWilling;
      if (margin < 0.1) prob -= 0.30;
      else if (margin < 0.25) prob -= 0.15;

      shouldBid = Math.random() < prob;

      if (shouldBid) {
        room.currentBid = nextBid;
        room.currentBidderId = randomTeamId;

        // Reset countdown to configured duration (5s for accelerated)
        room.countdown = room.currentPlayer.isAccelerated ? 5 : (room.timerDuration || 10);
        room.countdownText = null;
        room.phase = 'BIDDING';

        const teamDetails = TEAMS.find(t => t.id === randomTeamId);
        const entry = {
          id: `${Date.now()}-${Math.random()}`,
          teamId: randomTeamId,
          teamName: teamDetails.name,
          teamAbbr: teamDetails.abbr,
          teamEmoji: teamDetails.emoji,
          amount: nextBid,
          timestamp: Date.now()
        };
        room.bidHistory = [entry, ...room.bidHistory];

        // Emit to chat feed
        io.to(roomCode).emit('chat-message', {
          id: `bid-${Date.now()}-${Math.random()}`,
          sender: 'System (Auctioneer)',
          emoji: teamDetails.emoji,
          text: `${teamDetails.abbr} bid ${formatCr(nextBid)}`,
          timestamp: Date.now(),
          isSystem: true
        });

        io.to(roomCode).emit('bid-placed', {
          teamId: randomTeamId,
          teamAbbr: teamDetails.abbr,
          teamEmoji: teamDetails.emoji,
          amount: nextBid,
          roomState: getSerializableRoomState(room)
        });

        // Re-schedule next check (faster for accelerated player rounds)
        const delay = room.currentPlayer.isAccelerated ? (400 + Math.random() * 600) : (1200 + Math.random() * 1500);
        setTimeout(() => runAIRound(roomCode), delay);
      }
    }
  }

  // ─── Post-Auction Team Submissions & AI Power Rankings Helpers ───────────

  function autoSubmitAITeams(roomCode, includeHumans = false) {
    const room = activeRooms[roomCode];
    if (!room) return;

    if (!room.submittedTeams) {
      room.submittedTeams = {};
    }

    Object.keys(room.teams).forEach(teamId => {
      const team = room.teams[teamId];
      if (!team) return;

      const isHuman = room.participants.some(p => p.teamId === teamId);
      
      // Auto-submit for non-human teams OR human teams if includeHumans is forced
      if (!isHuman || includeHumans) {
        if (!room.submittedTeams[teamId]) {
          const squad = team.squad || [];
          if (squad.length === 0) return;

          // Greedy Selection for Playing XI & Impact Player
          const sortedSquad = [...squad].sort((a, b) => b.overall - a.overall);

          const playingXI = [];
          const wicketkeepers = sortedSquad.filter(p => p.role === 'WK');
          
          let bestWK = wicketkeepers[0];
          if (bestWK) {
            playingXI.push(bestWK);
          }

          let osCount = bestWK && bestWK.overseas ? 1 : 0;

          // Add remaining players
          for (const p of sortedSquad) {
            if (playingXI.length >= 11) break;
            if (bestWK && p.id === bestWK.id) continue;

            if (p.overseas) {
              if (osCount < 4) {
                playingXI.push(p);
                osCount++;
              }
            } else {
              playingXI.push(p);
            }
          }

          // Backfill Playing XI if < 11
          if (playingXI.length < 11) {
            for (const p of sortedSquad) {
              if (playingXI.length >= 11) break;
              if (playingXI.some(x => x.id === p.id)) continue;
              playingXI.push(p);
            }
          }

          // Select Impact Player from remaining bench
          const bench = squad.filter(p => !playingXI.some(x => x.id === p.id));
          const sortedBench = [...bench].sort((a, b) => b.overall - a.overall);
          const impactPlayer = sortedBench[0] || null;

          // Select Captain and Vice-Captain from Playing XI
          const xiSorted = [...playingXI].sort((a, b) => b.overall - a.overall);
          const captainId = xiSorted[0] ? xiSorted[0].id : null;
          const viceCaptainId = xiSorted[1] ? xiSorted[1].id : null;

          room.submittedTeams[teamId] = {
            playingXI,
            impactPlayer,
            captainId,
            viceCaptainId,
            submitted: true
          };
        }
      }
    });
  }

  function calculateAIRankings(room) {
    const submittedTeams = room.submittedTeams || {};
    const teamsList = Object.values(room.teams);
    const rankings = [];

    teamsList.forEach(team => {
      const submission = submittedTeams[team.id];
      if (!submission || !submission.submitted) return;

      const xi = submission.playingXI || [];
      const impact = submission.impactPlayer;
      const captainId = submission.captainId;
      const viceCaptainId = submission.viceCaptainId;
      if (xi.length === 0) return;

      const xiPlayers = xi.filter(x => x !== null);

      // --- 1. Batting Score (30%) ---
      const opener1 = xi[0] ? (xi[0].batting || 50) : 50;
      const opener2 = xi[1] ? (xi[1].batting || 50) : 50;
      const openerAvg = (opener1 + opener2) / 2;

      const m3 = xi[2] ? (xi[2].batting || 50) : 50;
      const m4 = xi[3] ? (xi[3].batting || 50) : 50;
      const m5 = xi[4] ? (xi[4].batting || 50) : 50;
      const middleAvg = (m3 + m4 + m5) / 3;

      const f6 = xi[5] ? (xi[5].batting || 50) : 50;
      const f7 = xi[6] ? (xi[6].batting || 50) : 50;
      const finisherAvg = (f6 + f7) / 2;

      const top7 = xiPlayers.slice(0, 7);
      const lhbCount = top7.filter(p => p.battingStyle && p.battingStyle.toUpperCase().includes('LEFT')).length;
      const rhbCount = top7.filter(p => p.battingStyle && p.battingStyle.toUpperCase().includes('RIGHT')).length;
      const lrScore = (lhbCount > 0 && rhbCount > 0) ? 95 : 65;

      const srAvg = top7.reduce((sum, p) => sum + (p.strikeRate || 135), 0) / Math.max(1, top7.length);
      const strikeRateScore = Math.min(100, Math.max(50, (srAvg - 110) * 1.6));

      const battingScore = parseFloat((
        openerAvg * 0.20 +
        middleAvg * 0.30 +
        finisherAvg * 0.20 +
        lrScore * 0.15 +
        strikeRateScore * 0.15
      ).toFixed(1));

      // --- 2. Bowling Score (30%) ---
      const fastBowlers = xiPlayers.filter(p => p.bowlingStyle && (
        p.bowlingStyle.toLowerCase().includes('fast') ||
        p.bowlingStyle.toLowerCase().includes('medium') ||
        p.bowlingStyle.toLowerCase().includes('seam') ||
        p.bowlingStyle.toLowerCase().includes('pace')
      ));
      const fastAvg = fastBowlers.length > 0
        ? fastBowlers.reduce((sum, p) => sum + (p.bowling || 50), 0) / fastBowlers.length
        : 45;

      const sortedPacers = [...fastBowlers].sort((a, b) => b.bowling - a.bowling);
      const deathScore = sortedPacers.length > 0
        ? (sortedPacers.slice(0, 2).reduce((sum, p) => sum + (p.bowling || 50), 0) / Math.min(2, sortedPacers.length))
        : 40;

      const spinBowlers = xiPlayers.filter(p => p.bowlingStyle && (
        p.bowlingStyle.toLowerCase().includes('spin') ||
        p.bowlingStyle.toLowerCase().includes('orthodox') ||
        p.bowlingStyle.toLowerCase().includes('legbreak') ||
        p.bowlingStyle.toLowerCase().includes('offbreak')
      ));
      const spinAvg = spinBowlers.length > 0
        ? spinBowlers.reduce((sum, p) => sum + (p.bowling || 50), 0) / spinBowlers.length
        : 45;

      const styles = new Set(xiPlayers.map(p => p.bowlingStyle || '').filter(s => s !== ''));
      const varietyScore = Math.min(100, 50 + styles.size * 12);

      const topBowlers = [...xiPlayers].sort((a, b) => b.bowling - a.bowling);
      const wicketTakingScore = topBowlers.slice(0, 4).reduce((sum, p) => sum + (p.bowling || 50), 0) / 4;

      const bowlingScore = parseFloat((
        fastAvg * 0.20 +
        deathScore * 0.20 +
        spinAvg * 0.20 +
        varietyScore * 0.20 +
        wicketTakingScore * 0.20
      ).toFixed(1));

      // --- 3. Team Balance (20%) ---
      const batDepthCount = xiPlayers.filter(p => p.batting >= 55).length;
      const battingDepth = Math.min(100, 40 + batDepthCount * 6);

      const bowlDepthCount = xiPlayers.filter(p => p.bowling >= 60).length;
      const bowlingDepth = Math.min(100, 40 + bowlDepthCount * 10);

      const arPlayers = xiPlayers.filter(p => p.role === 'AR');
      const arScore = arPlayers.length > 0
        ? arPlayers.reduce((sum, p) => sum + p.overall, 0) / arPlayers.length
        : 40;
      const arFactor = Math.min(1.0, arPlayers.length / 3);
      const allRounderScore = arScore * arFactor + (1.0 - arFactor) * 45;

      const osCount = xiPlayers.filter(p => p.overseas).length;
      const osScore = osCount === 4 ? 100 : osCount === 3 ? 85 : osCount === 2 ? 70 : 50;

      const balanceScore = parseFloat((
        battingDepth * 0.25 +
        bowlingDepth * 0.25 +
        allRounderScore * 0.25 +
        osScore * 0.25
      ).toFixed(1));

      // --- 4. Impact Player Value (10%) ---
      const impactScore = impact ? parseFloat((impact.overall * 0.85 + (impact.potential || 50) * 0.15).toFixed(1)) : 40;

      // --- 5. Squad Combination (10%) ---
      const captain = xiPlayers.find(p => p.id === captainId);
      const capScore = captain
        ? Math.min(100, (captain.overall * 0.6 + (captain.experience || 50) * 0.4 + (captain.capped ? 8 : 0)))
        : 45;

      const expAvg = xiPlayers.reduce((sum, p) => sum + (p.experience || 50), 0) / 11;

      const matchWinnersCount = xiPlayers.filter(p => p.overall >= 85).length + (impact && impact.overall >= 85 ? 1 : 0);
      const matchWinnersScore = Math.min(100, 50 + matchWinnersCount * 10);

      const flexibilityScore = Math.min(100, 50 + arPlayers.length * 8 + (xiPlayers.filter(p => p.role === 'WK').length > 1 ? 8 : 0));

      const combinationScore = parseFloat((
        capScore * 0.30 +
        expAvg * 0.25 +
        matchWinnersScore * 0.25 +
        flexibilityScore * 0.20
      ).toFixed(1));

      // --- Overall Score (weighted sum out of 100) ---
      const overallScore = parseFloat((
        battingScore * 0.30 +
        bowlingScore * 0.30 +
        balanceScore * 0.20 +
        impactScore * 0.10 +
        combinationScore * 0.10
      ).toFixed(1));

      // Strengths & Weaknesses
      const strengths = [];
      const weaknesses = [];

      if (openerAvg >= 84) strengths.push('Elite Opening Pair');
      if (middleAvg >= 84) strengths.push('Elite Middle Order');
      if (finisherAvg >= 82) strengths.push('Devastating Finishers');
      if (bowlingScore >= 84) strengths.push('Fierce Pace/Spin Attack');
      if (deathScore >= 84) strengths.push('Superb Death Bowling');
      if (spinAvg >= 82) strengths.push('Elite Spin Department');
      if (balanceScore >= 84) strengths.push('Exceptional Squad Balance');
      if (impactScore >= 82) strengths.push('High-Impact Sub Option');
      if (capScore >= 85) strengths.push('World-Class Captaincy');

      if (openerAvg < 74) weaknesses.push('Unstable Opening Partnership');
      if (middleAvg < 74) weaknesses.push('Vulnerable Middle Order');
      if (finisherAvg < 72) weaknesses.push('Weak Lower-Order Finishing');
      if (bowlingScore < 76) weaknesses.push('Leaky Bowling Attack');
      if (deathScore < 74) weaknesses.push('Poor Death Bowling Depth');
      if (spinAvg < 65) weaknesses.push('Weak Spin Department');
      if (balanceScore < 70) weaknesses.push('Lack of All-Round Depth');
      if (osCount < 4) weaknesses.push('Underutilized Overseas Quota');

      if (strengths.length === 0) strengths.push('Balanced Squad Foundation');
      if (weaknesses.length === 0) weaknesses.push('No Major Weaknesses Found');

      let verdict = 'Mid-Table Challenger';
      if (overallScore >= 92) verdict = 'Championship Contender';
      else if (overallScore >= 84) verdict = 'Playoff Contender';
      else if (overallScore < 75) verdict = 'Rebuilding Phase';

      rankings.push({
        teamId: team.id,
        teamName: team.name,
        teamAbbr: team.abbr,
        teamEmoji: team.emoji,
        primaryColor: team.primaryColor,
        overallScore,
        battingScore,
        bowlingScore,
        balanceScore,
        impactScore,
        combinationScore,
        strengths,
        weaknesses,
        verdict
      });
    });

    // Sort by overallScore descending
    rankings.sort((a, b) => b.overallScore - a.overallScore);

    // Assign predicted positions
    rankings.forEach((r, idx) => {
      r.predictedPosition = idx + 1;
    });

    return rankings;
  }

  // ─── Socket.IO Event Handlers ────────────────────────────────────────────

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 0. Get Room Info (Returns basic details before officially joining)
    socket.on('get-room-info', ({ roomCode }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) return callback({ success: false, reason: 'Room not found' });
      socket.join(roomCode);
      callback({ success: true, room: getSerializableRoomState(room) });
    });

    // 1. Create Room (Returns unique player tokens)
    socket.on('create-room', async ({ roomName, adminName, teamId, type, password, enableAITeams, minPlayersToStart, timerDuration }) => {
      let roomCode;
      let isUnique = false;
      let attempts = 0;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      while (!isUnique && attempts < 100) {
        attempts++;
        roomCode = '';
        for (let i = 0; i < 6; i++) {
          roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check in-memory active rooms
        if (activeRooms[roomCode]) {
          continue;
        }

        // Check database if connected
        if (dbConnected) {
          try {
            const dbRoom = await prisma.auctionRoom.findUnique({ where: { code: roomCode } });
            if (dbRoom) {
              continue;
            }
          } catch (err) {
            console.error('[Database] Unique code check error:', err.message);
          }
        }

        isUnique = true;
      }

      // Generate clean token
      const tokenChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let adminToken = 'usr_';
      for (let i = 0; i < 16; i++) {
        adminToken += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
      }

      const roomTeams = {};
      TEAMS.forEach(t => {
        roomTeams[t.id] = {
          id: t.id,
          name: t.name,
          abbr: t.abbr,
          emoji: t.emoji,
          primaryColor: t.primaryColor,
          strategy: t.strategy,
          purse: 120.0,
          squad: [],
          isHuman: t.id === teamId,
          controllerName: t.id === teamId ? adminName : null
        };
      });

      // ── V3: Load and enrich player data ──────────────────────────────────

      let playersData = [];
      try {
        const FLAG_MAP = {
          'India': '🇮🇳', 'Australia': '🇦🇺', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          'South Africa': '🇿🇦', 'West Indies': '🇹🇹', 'New Zealand': '🇳🇿',
          'Afghanistan': '🇦🇫', 'Sri Lanka': '🇱🇰', 'Bangladesh': '🇧🇩',
          'Pakistan': '🇵🇰', 'Zimbabwe': '🇿🇼', 'Ireland': '🇮🇪',
          'Netherlands': '🇳🇱', 'Nepal': '🇳🇵',
        };

        const raw = require('./src/lib/players-data.json');

        // V3: Enrich with all expanded stats fields
        playersData = raw.map(p => ({
          id: p.id,
          name: p.name,
          country: p.country,
          flag: FLAG_MAP[p.country] || '🌍',
          overseas: p.overseas,
          capped: true,
          set: p.set,
          role: p.role,
          subRole: p.subRole || '',
          age: p.age,
          basePrice: p.basePrice,
          soldPrice: p.soldPrice,
          currentTeam: p.currentTeam,
          batting: p.battingRating,
          bowling: p.bowlingRating,
          fielding: p.fieldingRating,
          potential: p.potentialRating,
          form: p.formRating,
          experience: p.experienceRating,
          overall: p.overallRating,
          fitness: Math.min(99, 55 + Math.floor((100 - p.age) * 0.8)),
          popularity: p.popularity,
          category: p.category,
          marketValueScore: p.marketValueScore || p.overallRating,
          // V3 expanded stats
          battingStyle: p.battingStyle || 'Right-hand bat',
          bowlingStyle: p.bowlingStyle || (p.subRole ? p.subRole : 'N/A'),
          matches: p.matches || 0,
          runs: p.runs || 0,
          wickets: p.wickets || 0,
          strikeRate: p.strikeRate || 0,
          economy: p.economy || 0,
          iplExperience: (p.matches || 0) >= 100 ? 'Veteran (100+ games)'
            : (p.matches || 0) >= 50 ? 'Experienced (50+ games)'
            : (p.matches || 0) >= 20 ? 'Moderate (20+ games)'
            : 'Emerging (<20 games)',
        }));

      } catch (err) {
        console.error("Missing players-data.json database catalog", err);
      }

      // V3: Build the player queue in 4-set order (each set shuffled randomly)
      const playerQueue = [];
      SET_ORDER.forEach(set => {
        const setPlayers = playersData.filter(p => p.set === set).sort(() => Math.random() - 0.5);
        playerQueue.push(...setPlayers);
      });

      const newRoom = {
        code: roomCode,
        name: roomName,
        type,
        password: type === 'private' ? password : null,
        status: 'lobby',
        enableAITeams: enableAITeams === true,
        minPlayersToStart: minPlayersToStart || 1,
        timerDuration: timerDuration || 10,
        adminSocketId: socket.id,
        adminName,
        adminToken,
        locked: false,
        paused: false,
        phase: 'WAITING',
        countdown: timerDuration || 10,
        currentPlayer: null,
        currentBid: 0,
        currentBidderId: null,
        bidHistory: [],
        playerQueue,
        playersData,
        setOrder: [...SET_ORDER],
        disabledSets: [],
        currentIndex: 0,
        submittedTeams: {},
        aiRankings: null,
        participants: [{
          socketId: socket.id,
          token: adminToken,
          name: adminName,
          teamId,
          isReady: true,
          isAdmin: true
        }],
        teams: roomTeams
      };

      activeRooms[roomCode] = newRoom;
      tokenToParticipant[adminToken] = { roomCode, teamId, isAdmin: true, name: adminName };

      socket.join(roomCode);
      socket.emit('room-created', { roomCode, playerToken: adminToken, inviteLink: `http://localhost:3000/room/${roomCode}` });
      io.to(roomCode).emit('room-state', getSerializableRoomState(newRoom));
      console.log(`Room ${roomCode} created by ${adminName}`);

      // DB Logs
      dbCreateRoom(roomCode, roomName, type, adminToken, adminName, teamId);
      dbAddAuctionLog(roomCode, 'create-room', `Room created by ${adminName}`);
    });

    // 2. Join Room (Lobby Registration)
    socket.on('join-room', ({ roomCode, name, teamId, password, isInviteLink }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) return callback({ success: false, reason: 'Room not found' });
      if (room.locked) return callback({ success: false, reason: 'Lobby is locked' });

      // Bypass password if isInviteLink is true
      if (!isInviteLink && room.type === 'private' && room.password !== password) {
        return callback({ success: false, reason: 'Incorrect passcode' });
      }

      // 1. Validate: No duplicate user names in room
      const nameExists = room.participants.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (nameExists) {
        return callback({ success: false, reason: 'Name is already taken in this room' });
      }

      // If auction has already started, team ownership is locked; late joiners become spectators
      if (room.status !== 'lobby') {
        teamId = null;
      }

      // 2. Validate: No duplicate team ownership (Check if team is already owned by a human)
      if (teamId) {
        const teamOwned = room.participants.some(p => p.teamId === teamId) || (room.teams[teamId] && room.teams[teamId].isHuman);
        if (teamOwned) {
          return callback({ success: false, reason: 'This team was just selected by another participant.' });
        }
      }

      // Generate clean token
      const tokenChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let playerToken = 'usr_';
      for (let i = 0; i < 16; i++) {
        playerToken += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
      }
      const participant = {
        socketId: socket.id,
        token: playerToken,
        name,
        teamId,
        isReady: false,
        isAdmin: false
      };

      room.participants.push(participant);
      tokenToParticipant[playerToken] = { roomCode, teamId, isAdmin: false, name };

      if (teamId) {
        room.teams[teamId].isHuman = true;
        room.teams[teamId].controllerName = name;
      }

      socket.join(roomCode);
      callback({ success: true, roomCode, playerToken });
      io.to(roomCode).emit('room-state', getSerializableRoomState(room));
      console.log(`${name} joined room ${roomCode} as ${teamId || 'Spectator'}`);

      // DB Logs
      dbAddParticipant(roomCode, playerToken, socket.id, name, teamId, false);
      dbAddAuctionLog(roomCode, 'join-room', `${name} joined room as ${teamId || 'Spectator'}`);
    });

    // 3. Rejoin Room System (Restores purse and dashboard state seamlessly)
    socket.on('rejoin-room', ({ roomCode, playerToken }, callback) => {
      const room = activeRooms[roomCode];
      const cached = tokenToParticipant[playerToken];

      if (!room || !cached) {
        return callback({ success: false, reason: 'Session expired' });
      }

      // Re-map socket ID
      const p = room.participants.find(x => x.token === playerToken);
      if (p) {
        // Clear admin buffer if host rejoining
        if (p.isAdmin && adminDisconnectBuffers[roomCode]) {
          clearTimeout(adminDisconnectBuffers[roomCode]);
          delete adminDisconnectBuffers[roomCode];
          console.log(`Admin ${p.name} reconnected to room ${roomCode}`);
        }

        p.socketId = socket.id;
        socket.join(roomCode);

        callback({ success: true });
        socket.emit('room-state', getSerializableRoomState(room));
      } else {
        callback({ success: false, reason: 'Participant not found' });
      }
    });

    // 4. Toggle Ready
    socket.on('toggle-ready', ({ roomCode }) => {
      const room = activeRooms[roomCode];
      if (!room) return;

      const p = room.participants.find(x => x.socketId === socket.id);
      if (p) {
        p.isReady = !p.isReady;
        io.to(roomCode).emit('room-state', getSerializableRoomState(room));

        // DB Logs
        dbUpdateParticipantReady(roomCode, p.token, p.isReady);
      }
    });

    // 5. Place Bid (Anti-Spam & Auto-Increment rule)
    socket.on('place-bid', ({ roomCode }, callback) => {
      const room = activeRooms[roomCode];
      if (!room || (room.phase !== 'BIDDING' && room.phase !== 'RESOLVING') || room.paused) {
        return callback({ success: false, reason: 'Bidding locked' });
      }

      const p = room.participants.find(x => x.socketId === socket.id);
      if (!p || !p.teamId) {
        return callback({ success: false, reason: 'Unauthorized bid' });
      }

      const bidderId = p.teamId;
      if (bidderId === room.currentBidderId) {
        return callback({ success: false, reason: 'Already highest bidder' });
      }

      const nextBidAmount = room.currentBidderId ? getNextBid(room.currentBid) : room.currentBid;

      const team = room.teams[bidderId];
      if (team.purse < nextBidAmount) return callback({ success: false, reason: 'Negative purse limit' });
      if (team.squad.length >= 25) return callback({ success: false, reason: 'Roster full' });

      // Overseas checks
      if (room.currentPlayer.overseas) {
        const osCount = team.squad.filter(pl => pl.overseas).length;
        if (osCount >= 8) return callback({ success: false, reason: 'Overseas quota full' });
      }

      // Save bid
      room.currentBid = nextBidAmount;
      room.currentBidderId = bidderId;
      room.countdown = room.currentPlayer.isAccelerated ? 5 : (room.timerDuration || 10);
      room.countdownText = null;
      room.phase = 'BIDDING'; // return to active bidding phase
      room.tickCount = 0;

      const teamDetails = TEAMS.find(t => t.id === bidderId);
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        teamId: bidderId,
        teamName: teamDetails.name,
        teamAbbr: teamDetails.abbr,
        teamEmoji: teamDetails.emoji,
        amount: nextBidAmount,
        timestamp: Date.now()
      };
      room.bidHistory = [entry, ...room.bidHistory];

      // Emit to chat feed
      io.to(roomCode).emit('chat-message', {
        id: `bid-${Date.now()}-${Math.random()}`,
        sender: 'System (Auctioneer)',
        emoji: teamDetails.emoji,
        text: `${teamDetails.abbr} bid ${formatCr(nextBidAmount)}`,
        timestamp: Date.now(),
        isSystem: true
      });

      callback({ success: true });
      io.to(roomCode).emit('bid-placed', {
        teamId: bidderId,
        teamAbbr: teamDetails.abbr,
        teamEmoji: teamDetails.emoji,
        amount: nextBidAmount,
        roomState: getSerializableRoomState(room)
      });

      // DB Logs
      dbAddBid(roomCode, bidderId, nextBidAmount);
      dbUpdateRoomStatus(roomCode, room.status, room.phase, room.currentIndex, nextBidAmount, bidderId, room.paused, room.locked);
      dbAddAuctionLog(roomCode, 'bid', `${p.name} (${bidderId.toUpperCase()}) bid ₹${nextBidAmount} Crore`);

      // Schedule next AI check to compete
      setTimeout(() => runAIRound(roomCode), 1200 + Math.random() * 1500);
    });

    // 6. Send chat messages
    socket.on('send-message', ({ roomCode, text }) => {
      const room = activeRooms[roomCode];
      if (!room) return;

      const p = room.participants.find(x => x.socketId === socket.id);
      if (p) {
        const teamEmoji = p.teamId ? (TEAMS.find(t => t.id === p.teamId)?.emoji || '💬') : '👁️';
        io.to(roomCode).emit('chat-message', {
          id: `${Date.now()}-${Math.random()}`,
          sender: p.name,
          emoji: teamEmoji,
          text,
          timestamp: Date.now()
        });

        // DB Logs
        dbAddChatMessage(roomCode, p.name, teamEmoji, text);
      }
    });

    // 6.5. Submit Playing XI & Impact Player
    socket.on('submit-team', ({ roomCode, playingXI, impactPlayer, captainId, viceCaptainId, submitted }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) return callback({ success: false, reason: 'Room not found' });

      const p = room.participants.find(x => x.socketId === socket.id);
      if (!p || !p.teamId) return callback({ success: false, reason: 'Participant not assigned to any team' });

      const teamId = p.teamId;

      // Validation Checks (only enforce strict constraints if submitted is true)
      if (submitted) {
        if (!playingXI || playingXI.length !== 11 || playingXI.includes(null)) {
          return callback({ success: false, reason: 'Playing XI must contain exactly 11 players' });
        }
        if (!impactPlayer) {
          return callback({ success: false, reason: 'Exactly 1 Impact Player is required' });
        }
        const osCount = playingXI.filter(x => x && x.overseas).length;
        if (osCount > 4) {
          return callback({ success: false, reason: 'Maximum of 4 Overseas players allowed in the Playing XI' });
        }
        if (osCount === 4 && impactPlayer.overseas) {
          return callback({ success: false, reason: 'Impact Player cannot be Overseas because Playing XI already contains 4 Overseas players.' });
        }
        if (!captainId || !viceCaptainId) {
          return callback({ success: false, reason: 'Captain and Vice-Captain must be selected' });
        }
      }

      if (!room.submittedTeams) room.submittedTeams = {};

      room.submittedTeams[teamId] = {
        playingXI: playingXI || Array(11).fill(null),
        impactPlayer: impactPlayer || null,
        captainId: captainId || null,
        viceCaptainId: viceCaptainId || null,
        submitted: !!submitted
      };

      callback({ success: true });
      io.to(roomCode).emit('room-state', getSerializableRoomState(room));

      // Auto rankings check: if all teams submitted, generate rankings
      if (submitted) {
        const allSubmitted = Object.keys(room.teams).every(tid => room.submittedTeams[tid] && room.submittedTeams[tid].submitted);
        if (allSubmitted) {
          room.aiRankings = calculateAIRankings(room);
          io.to(roomCode).emit('room-state', getSerializableRoomState(room));
        }
      }
    });

    // 7. Admin Controls Drawer Handler (Kicks, pauses, and backfills)
    socket.on('admin-action', ({ roomCode, action, extra }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) return callback({ success: false, reason: 'Room not found' });

      // Owner verification check
      const isAdmin = room.participants.some(p => p.socketId === socket.id && p.isAdmin);
      if (!isAdmin) {
        return callback({ success: false, reason: 'Unauthorized Admin controls' });
      }

      switch (action) {
        case 'start':
          if (room.status === 'lobby') {
            // Verify minimum player count setting
            const humanManagers = room.participants.filter(p => p.teamId).length;
            if (humanManagers < room.minPlayersToStart) {
              return callback({ success: false, reason: `Minimum ${room.minPlayersToStart} players required to start` });
            }

            room.status = 'auction';

            // AI Backfilling unowned spots
            Object.keys(room.teams).forEach(id => {
              const teamState = room.teams[id];
              const isTakenByHuman = room.participants.some(p => p.teamId === id);
              if (!isTakenByHuman) {
                teamState.isHuman = false;
                teamState.controllerName = room.enableAITeams
                  ? `AI Manager (${teamState.strategy})`
                  : null;
              }
            });

            // Rebuild playerQueue using setOrder and disabledSets config
            const setOrder = room.setOrder || [...SET_ORDER];
            const disabledSets = room.disabledSets || [];
            const playerQueue = [];
            setOrder.forEach(set => {
              if (disabledSets.includes(set)) return;
              const setPlayers = room.playersData.filter(p => p.set === set).sort(() => Math.random() - 0.5);
              playerQueue.push(...setPlayers);
            });
            room.playerQueue = playerQueue;
            room.currentIndex = 0;
            room.currentCategory = null;

            loadNextPlayer(roomCode);
          }
          break;

        case 'pause':
          room.paused = true;
          break;

        case 'resume':
          room.paused = false;
          break;

        case 'skip':
          room.currentBidderId = null;
          resolvePlayer(roomCode);
          break;

        case 'force-sell':
          if (room.currentBidderId) {
            resolvePlayer(roomCode);
          }
          break;

        case 'unsold':
          room.currentBidderId = null;
          resolvePlayer(roomCode);
          break;

        case 'restart-timer':
          room.countdown = room.timerDuration || 10;
          room.countdownText = null;
          room.phase = 'BIDDING'; // ensure it resets resolving state if active
          room.tickCount = 0;
          break;

        case 'change-timer':
          const newDuration = parseInt(extra);
          if ([5, 10, 15, 20].includes(newDuration)) {
            room.timerDuration = newDuration;
            io.to(roomCode).emit('room-state', getSerializableRoomState(room));
          }
          break;

        case 'lock':
          room.locked = true;
          break;

        case 'unlock':
          room.locked = false;
          break;

        case 'kick':
          const targetSocketId = extra;
          const index = room.participants.findIndex(p => p.socketId === targetSocketId);
          if (index !== -1) {
            const depart = room.participants[index];
            if (depart.teamId) {
              room.teams[depart.teamId].isHuman = false;
              room.teams[depart.teamId].controllerName = null;
            }
            room.participants.splice(index, 1);
            io.to(targetSocketId).emit('kicked');
          }
          break;

        case 'reset':
          room.status = 'lobby';
          room.phase = 'WAITING';
          room.currentIndex = 0;
          room.currentPlayer = null;
          room.currentBid = 0;
          room.currentBidderId = null;
          room.bidHistory = [];
          room.currentCategory = null;
          Object.keys(room.teams).forEach(id => {
            room.teams[id].purse = 120.0;
            room.teams[id].squad = [];
          });
          break;

        case 'end':
          room.status = 'complete';
          room.phase = 'COMPLETE';
          autoSubmitAITeams(roomCode, false);
          break;

        case 'generate-rankings':
          room.aiRankings = calculateAIRankings(room);
          break;

        case 'force-start-analysis':
          autoSubmitAITeams(roomCode, true);
          room.aiRankings = calculateAIRankings(room);
          break;

        case 'publish-rankings':
          room.rankingsPublished = true;
          break;

        case 'lock-rankings':
          room.lockedRankings = true;
          break;

        case 'reset-rankings':
          room.submittedTeams = {};
          room.aiRankings = null;
          room.rankingsPublished = false;
          room.lockedRankings = false;
          autoSubmitAITeams(roomCode, false);
          break;

        // V3: Reintroduce unsold players as SET 15: Unsold Round Reintroduction
        case 'reintroduce':
          if (extra) {
            const targetIds = Array.isArray(extra) ? extra : [parseInt(extra)];
            if (targetIds.length > 0) {
              // Collect unsold players from the queue that match the given IDs
              const unsoldFromQueue = room.playerQueue.filter(p =>
                targetIds.includes(p.id) && p.category === 'Unsold Pool'
              ).map(p => ({
                ...p,
                category: 'SET 15: Unsold Round Reintroduction',
                isAccelerated: true,
                isUnsoldReintro: true
              }));

              if (unsoldFromQueue.length > 0) {
                // Remove the old 'Unsold Pool' entries from the queue
                room.playerQueue = room.playerQueue.filter(p =>
                  !(targetIds.includes(p.id) && p.category === 'Unsold Pool')
                );
                // Append them at the end
                room.playerQueue.push(...unsoldFromQueue);
                // Jump currentIndex to the first reintroduced player
                room.currentIndex = room.playerQueue.length - unsoldFromQueue.length;
                room.status = 'auction';
                loadNextPlayer(roomCode);
              }
            }
          }
          break;

        case 'update-sets':
          if (extra) {
            room.setOrder = extra.setOrder || room.setOrder || [...SET_ORDER];
            room.disabledSets = extra.disabledSets || room.disabledSets || [];
          }
          break;
      }

      callback({ success: true });
      io.to(roomCode).emit('room-state', getSerializableRoomState(room));

      // DB Logs
      dbUpdateRoomStatus(roomCode, room.status, room.phase, room.currentIndex, room.currentBid, room.currentBidderId, room.paused, room.locked);
      dbAddAuctionLog(roomCode, `admin-${action}`, `Admin triggered action: ${action}`);
    });

    // ─── WebRTC Voice Chat signaling and controls ────────────────────────────

    // Join voice channel
    socket.on('join-voice', ({ roomCode }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) return callback && callback({ success: false, reason: 'Room not found' });
      
      // Initialize voice participants list if not exists
      if (!room.voiceParticipants) {
        room.voiceParticipants = {};
      }

      // Check if voice chat is enabled for this room
      const isPrivate = room.type === 'private';
      const isVoiceEnabled = room.voiceChatEnabled !== undefined ? room.voiceChatEnabled : isPrivate;
      if (!isVoiceEnabled) {
        return callback && callback({ success: false, reason: 'Voice chat is disabled in this room' });
      }

      // Find participant details
      const participant = room.participants.find(p => p.socketId === socket.id);
      if (!participant) {
        return callback && callback({ success: false, reason: 'Participant not registered in this room' });
      }

      const voiceUser = {
        socketId: socket.id,
        name: participant.name,
        teamId: participant.teamId,
        isAdmin: participant.isAdmin,
        muted: false,
        speaking: false
      };

      room.voiceParticipants[socket.id] = voiceUser;

      // Broadcast to other participants in room that this user joined voice
      socket.to(roomCode).emit('user-joined-voice', {
        socketId: socket.id,
        participant: voiceUser
      });

      // Return list of other voice participants currently in the room
      const others = Object.values(room.voiceParticipants).filter(p => p.socketId !== socket.id);
      
      callback && callback({ 
        success: true, 
        participants: Object.values(room.voiceParticipants),
        others: others.map(o => o.socketId)
      });
      
      console.log(`[Voice] ${participant.name} joined voice channel in room ${roomCode}`);
    });

    // Leave voice channel
    socket.on('leave-voice', ({ roomCode }) => {
      const room = activeRooms[roomCode];
      if (!room || !room.voiceParticipants) return;

      if (room.voiceParticipants[socket.id]) {
        const name = room.voiceParticipants[socket.id].name;
        delete room.voiceParticipants[socket.id];
        
        // Broadcast to other participants
        io.to(roomCode).emit('user-left-voice', { socketId: socket.id });
        console.log(`[Voice] ${name} left voice channel in room ${roomCode}`);
      }
    });

    // Voice signaling candidate / offer / answer exchange
    socket.on('voice-signal', ({ targetSocketId, signal }) => {
      io.to(targetSocketId).emit('voice-signal', {
        senderSocketId: socket.id,
        signal
      });
    });

    // Voice mute status update
    socket.on('voice-mute-status', ({ roomCode, muted }) => {
      const room = activeRooms[roomCode];
      if (!room || !room.voiceParticipants) return;

      if (room.voiceParticipants[socket.id]) {
        room.voiceParticipants[socket.id].muted = muted;
        io.to(roomCode).emit('user-voice-mute', {
          socketId: socket.id,
          muted
        });
      }
    });

    // Voice speaking status update
    socket.on('voice-speaking-status', ({ roomCode, speaking }) => {
      const room = activeRooms[roomCode];
      if (!room || !room.voiceParticipants) return;

      if (room.voiceParticipants[socket.id]) {
        room.voiceParticipants[socket.id].speaking = speaking;
        io.to(roomCode).emit('user-voice-speaking', {
          socketId: socket.id,
          speaking
        });
      }
    });

    // Admin voice control actions
    socket.on('admin-voice-control', ({ roomCode, action, targetSocketId }) => {
      const room = activeRooms[roomCode];
      if (!room) return;

      // Verify if sender is admin
      const sender = room.participants.find(p => p.socketId === socket.id);
      if (!sender || !sender.isAdmin) {
        console.warn(`[Voice Admin] Unauthorized control attempt by ${socket.id}`);
        return;
      }

      if (action === 'mute-all') {
        io.to(roomCode).emit('voice-control-action', { action: 'mute-all' });
        console.log(`[Voice Admin] ${sender.name} muted all participants in room ${roomCode}`);
      } else if (action === 'enable-voice') {
        room.voiceChatEnabled = true;
        io.to(roomCode).emit('voice-control-action', { action: 'enable-voice' });
        console.log(`[Voice Admin] ${sender.name} enabled voice chat in room ${roomCode}`);
      } else if (action === 'disable-voice') {
        room.voiceChatEnabled = false;
        room.voiceParticipants = {};
        io.to(roomCode).emit('voice-control-action', { action: 'disable-voice' });
        console.log(`[Voice Admin] ${sender.name} disabled voice chat in room ${roomCode}`);
      } else if (action === 'end-voice') {
        room.voiceParticipants = {};
        io.to(roomCode).emit('voice-control-action', { action: 'end-voice' });
        console.log(`[Voice Admin] ${sender.name} ended voice session in room ${roomCode}`);
      } else if (action === 'remove-user' && targetSocketId) {
        if (room.voiceParticipants && room.voiceParticipants[targetSocketId]) {
          delete room.voiceParticipants[targetSocketId];
        }
        io.to(targetSocketId).emit('voice-control-action', { action: 'kick' });
        io.to(roomCode).emit('user-left-voice', { socketId: targetSocketId });
        console.log(`[Voice Admin] ${sender.name} removed user ${targetSocketId} from voice channel in room ${roomCode}`);
      }
    });

    // 8. Disconnect buffer (Wait 5s for normal users, 60s for Admin)
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);

      Object.keys(activeRooms).forEach((roomCode) => {
        const room = activeRooms[roomCode];
        
        // Voice participant cleanup on disconnect
        if (room.voiceParticipants && room.voiceParticipants[socket.id]) {
          delete room.voiceParticipants[socket.id];
          io.to(roomCode).emit('user-left-voice', { socketId: socket.id });
        }
        const pIndex = room.participants.findIndex(p => p.socketId === socket.id);

        if (pIndex !== -1) {
          const departing = room.participants[pIndex];

          if (departing.isAdmin) {
            // Admin disconnect buffer (60s)
            console.log(`Admin disconnected. Waiting 60s for reconnect in room ${roomCode}`);
            adminDisconnectBuffers[roomCode] = setTimeout(() => {
              const remainingParticipants = room.participants.filter(x => x.token !== departing.token);

              if (remainingParticipants.length > 0) {
                const oldest = remainingParticipants[0];
                oldest.isAdmin = true;
                oldest.isReady = true;
                oldest.role = 'admin';
                room.adminSocketId = oldest.socketId;
                room.adminName = oldest.name;
                room.adminToken = oldest.token;

                if (departing.teamId) {
                  room.teams[departing.teamId].isHuman = false;
                  room.teams[departing.teamId].controllerName = null;
                }
                room.participants = room.participants.filter(x => x.token !== departing.token);

                io.to(roomCode).emit('room-state', getSerializableRoomState(room));
                console.log(`Room ${roomCode} Admin transferred to oldest manager: ${oldest.name}`);
              } else {
                delete activeRooms[roomCode];
                console.log(`Room ${roomCode} closed (all participants disconnected permanently)`);
              }
            }, 60000);
          } else {
            // Normal participant disconnect
            if (room.status === 'lobby') {
              // Before auction starts: wait 5s, then release ownership and remove participant
              console.log(`Participant ${departing.name} disconnected. Waiting 5s before releasing team ${departing.teamId || 'None'} in room ${roomCode}`);
              setTimeout(() => {
                const currentP = room.participants.find(x => x.token === departing.token);
                // Check if they haven't reconnected (if they did, their socketId would be different)
                if (currentP && currentP.socketId === socket.id) {
                  room.participants = room.participants.filter(x => x.token !== departing.token);
                  if (departing.teamId) {
                    room.teams[departing.teamId].isHuman = false;
                    room.teams[departing.teamId].controllerName = null;
                  }
                  io.to(roomCode).emit('room-state', getSerializableRoomState(room));
                  console.log(`Participant ${departing.name} left room ${roomCode} permanently before start. Team released.`);
                }
              }, 5000);
            }
          }
        }
      });
    });

  });

  server.all('*all', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Custom Server listening on http://localhost:${port}`);
  });
});
