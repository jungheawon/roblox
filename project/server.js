// 좀비 서바이벌 - 멀티플레이 서버
// Express로 정적 파일(게임 클라이언트)을 서빙하고, Socket.IO로 최대 40명의
// 플레이어 위치/회전/스킬(검) 상태를 실시간 중계합니다.
// 서버는 "권위 있는 물리 서버"가 아니라 가벼운 릴레이(relay) 역할만 합니다:
// 각 클라이언트가 자신의 위치를 계산하고, 서버는 그 상태를 다른 클라이언트에게
// 전달만 해줍니다. 플레이어 간 충돌(겹치지 않기)과 넉백은 이 상태를 받은
// 클라이언트 쪽에서 처리합니다 (public/index.html 참고).

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 40;
const ROUND_END_COOLDOWN_MS = 15000; // ignore extra finishes for a bit after the first one

// socket.id -> { nickname, pos: {x,y,z}, rotY, coins }
const players = {};
let lastRoundEndAt = 0;

app.use(express.static(path.join(__dirname, 'public')));

// 헬스체크 (Render 등에서 사용 가능)
app.get('/healthz', (req, res) => {
    res.json({ ok: true, players: Object.keys(players).length, max: MAX_PLAYERS });
});

function randomSpawn() {
    // 스폰 지점을 살짝 흩어서 여러 명이 동시에 접속해도 겹쳐서 시작하지 않도록 함
    return {
        x: (Math.random() - 0.5) * 8,
        y: 5,
        z: (Math.random() - 0.5) * 8
    };
}

function sanitizeNickname(raw) {
    const name = (typeof raw === 'string' ? raw : '').trim().slice(0, 10);
    return name.length > 0 ? name : `플레이어${Math.floor(Math.random() * 1000)}`;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (Object.keys(players).length >= MAX_PLAYERS) {
            socket.emit('room-full');
            return;
        }

        const nickname = sanitizeNickname(data && data.nickname);
        const pos = randomSpawn();

        players[socket.id] = { id: socket.id, nickname, pos, rotY: 0, coins: 0 };

        // 새로 들어온 사람에게 기존 플레이어 목록 전달
        const others = {};
        for (const id in players) {
            if (id !== socket.id) others[id] = players[id];
        }
        socket.emit('init', { id: socket.id, players: others });

        // 다른 사람들에게는 새 플레이어 입장 알림
        socket.broadcast.emit('player-joined', players[socket.id]);
    });

    socket.on('state', (data) => {
        const p = players[socket.id];
        if (!p || !data || !data.pos) return;
        p.pos = { x: data.pos.x, y: data.pos.y, z: data.pos.z };
        p.rotY = typeof data.rotY === 'number' ? data.rotY : p.rotY;
        if (typeof data.coins === 'number') p.coins = data.coins;

        socket.broadcast.emit('player-update', {
            id: socket.id,
            pos: p.pos,
            rotY: p.rotY
        });
    });

    socket.on('swing', () => {
        if (!players[socket.id]) return;
        socket.broadcast.emit('player-swing', { id: socket.id });
    });

    socket.on('chat', (data) => {
        const p = players[socket.id];
        if (!p || !data) return;
        const text = (typeof data.text === 'string' ? data.text : '').trim().slice(0, 60);
        if (!text) return;
        socket.broadcast.emit('player-chat', { id: socket.id, nickname: p.nickname, text });
    });

    socket.on('sword-hit', (data) => {
        if (!players[socket.id] || !data || !data.targetId) return;
        const target = players[data.targetId];
        if (!target) {
            console.log(`[sword-hit] ${socket.id} tried to hit unknown target ${data.targetId}`);
            return;
        }
        console.log(`[sword-hit] ${players[socket.id].nickname}(${socket.id}) -> ${target.nickname}(${data.targetId})`);
        io.to(data.targetId).emit('hit', {
            from: socket.id,
            dir: data.dir || { x: 0, z: 1 }
        });
    });

    socket.on('game-finished', (data) => {
        const p = players[socket.id];
        if (!p) return;

        const now = Date.now();
        if (now - lastRoundEndAt < ROUND_END_COOLDOWN_MS) return; // someone already triggered this round's ranking
        lastRoundEndAt = now;

        if (typeof data?.coins === 'number') p.coins = data.coins;

        const ranking = Object.values(players)
            .map(pl => ({ nickname: pl.nickname, coins: pl.coins || 0 }))
            .sort((a, b) => b.coins - a.coins);

        console.log(`[game-finished] ${p.nickname} reached Stage 5 first - broadcasting ranking to ${Object.keys(players).length} players`);
        io.emit('game-over', { ranking, winnerNickname: p.nickname });
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('player-left', { id: socket.id });
        }
    });
});

server.listen(PORT, () => {
    console.log(`좀비 서바이벌 멀티플레이 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
