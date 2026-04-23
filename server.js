// server.js — 실시간 숏폼 투표 서버 (자동 초기화 안전장치 포함)
// v3 완전 재배포 (2026-04-23) - 인트로 영상 라우팅 포함
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// ===== 고정 투표 항목 (4개) =====
const OPTIONS = [
  { id: 'youtube',   label: 'YouTube Shorts',   emoji: '📺' },
  { id: 'instagram', label: 'Instagram Reels',  emoji: '📸' },
  { id: 'tiktok',    label: 'TikTok',           emoji: '🎵' },
  { id: 'facebook',  label: 'Facebook Reels',   emoji: '👍' }
];

// ===== 자동 초기화 설정 =====
const IDLE_RESET_MS = 5 * 60 * 1000;       // 5분 동안 아무도 없으면 리셋
const DAILY_RESET_MS = 24 * 60 * 60 * 1000; // 24시간마다 강제 리셋
let idleTimer = null;
let lastDailyReset = Date.now();

// ===== 세션 상태 =====
const state = {
  votes: Object.fromEntries(OPTIONS.map(o => [o.id, 0])),
  reactions: { heart: 0, fire: 0, clap: 0, laugh: 0 },
  connected: 0,
  votedSockets: new Set(),
  closed: false
};

// 서버 시작 시 항상 깨끗한 상태 (서버 재시작 = 자동 초기화)
function resetState() {
  state.votes = Object.fromEntries(OPTIONS.map(o => [o.id, 0]));
  state.reactions = { heart: 0, fire: 0, clap: 0, laugh: 0 };
  state.votedSockets.clear();
  state.closed = false;
  lastDailyReset = Date.now();
}

function snapshot() {
  return {
    options: OPTIONS,
    votes: state.votes,
    reactions: state.reactions,
    closed: state.closed
  };
}

// 무인 타이머 시작 (모두 떠났을 때 호출)
function startIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    console.log('⏱️ 5분 동안 접속자 없음 — 자동 초기화');
    resetState();
    // 다음 접속자에게는 자동으로 깨끗한 init 보내짐
  }, IDLE_RESET_MS);
}

// 무인 타이머 취소 (누군가 들어왔을 때)
function cancelIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

// 24시간 주기 강제 초기화 (1시간마다 체크)
setInterval(() => {
  if (Date.now() - lastDailyReset >= DAILY_RESET_MS) {
    console.log('🌙 24시간 경과 — 강제 초기화');
    resetState();
    if (state.connected > 0) {
      io.emit('resetAll', snapshot());
    }
  }
}, 60 * 60 * 1000); // 1시간마다 체크

app.use(express.static(path.join(__dirname, 'public')));
// 루트 "/" → 인트로 페이지 (영상 자동재생)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'intro.html')));
// "/vote" → 투표 화면
app.get('/vote', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// 헬스 체크용 (Railway 등에서 활용)
app.get('/health', (req, res) => res.json({ ok: true, connected: state.connected }));

io.on('connection', (socket) => {
  state.connected++;
  cancelIdleTimer();   // 접속자 생겼으니 타이머 취소
  io.emit('userCount', state.connected);

  socket.emit('init', snapshot());

  socket.on('vote', (optionId) => {
    if (state.closed) return;
    if (state.votedSockets.has(socket.id)) return;
    if (!state.votes.hasOwnProperty(optionId)) return;
    state.votes[optionId]++;
    state.votedSockets.add(socket.id);
    io.emit('voteUpdate', state.votes);
  });

  socket.on('reaction', (type) => {
    if (!state.reactions.hasOwnProperty(type)) return;
    state.reactions[type]++;
    io.emit('reactionBurst', { type, total: state.reactions[type], all: state.reactions });
  });

  socket.on('toggleClose', () => {
    state.closed = !state.closed;
    io.emit('closedState', state.closed);
  });

  socket.on('reset', () => {
    resetState();
    io.emit('resetAll', snapshot());
  });

  socket.on('disconnect', () => {
    state.connected = Math.max(0, state.connected - 1);
    state.votedSockets.delete(socket.id);
    io.emit('userCount', state.connected);

    // 마지막 사람이 떠났으면 무인 타이머 시작
    if (state.connected === 0) {
      startIdleTimer();
    }
  });
});

// 서버 시작 시 깨끗한 상태로 시작
resetState();

server.listen(PORT, () => {
  console.log(`🚀 서버 실행: http://localhost:${PORT}`);
  console.log(`🛡️ 자동 초기화: 5분 무인 / 24시간 주기 / 서버 재시작`);
});
