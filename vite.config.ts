import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function createRacketSlot(role: string) {
  return {
    role,
    seq: 0,
    lastSeenTs: 0,
    connected: false,
    orientation: { pitch: 0, roll: 0, yaw: 0, accelMag: 0, buttonB: false, connected: false },
    lastSwing: null,
    swingHistory: [] as any[],
    feedbackSeq: 0,
    lastFeedback: null
  };
}

function createRoomState(roomId: string, hostName = 'Player 1', guestName = 'Player 2', gamesToWin = 2) {
  return {
    roomId,
    hostName,
    guestName,
    gamesToWin,
    rackets: { p1: createRacketSlot('p1'), p2: createRacketSlot('p2') },
    stateSeq: 0,
    matchSnapshot: null,
    p1DesktopSeenTs: 0,
    p2DesktopSeenTs: 0
  };
}

function serializeRacket(slot: any) {
  const now = Date.now();
  const lastSeenMs = slot.lastSeenTs > 0 ? Math.max(0, now - slot.lastSeenTs) : -1;
  const connected = Boolean(slot.connected && lastSeenMs >= 0 && lastSeenMs < 12000);
  return {
    role: slot.role,
    connected,
    lastSeenMs,
    orientation: { ...slot.orientation, connected },
    lastSwing: slot.lastSwing ? { ...slot.lastSwing } : null,
    lastFeedback: slot.lastFeedback ? { ...slot.lastFeedback } : null,
    swingHistory: slot.swingHistory.slice(-15)
  };
}

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    const chunks: string[] = [];
    req.on('data', (c: any) => chunks.push(String(c)));
    req.on('end', () => {
      try {
        const raw = chunks.join('');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: any, status: number, payload: any) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(body);
}

function getRequestOrigin(req: any): string {
  const protoHeader = req.headers?.['x-forwarded-proto'];
  const hostHeader = req.headers?.['x-forwarded-host'] || req.headers?.host;
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'https').split(',')[0].trim();
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || '').split(',')[0].trim();
  if (!host || host.startsWith('localhost:')) return '';
  return `${proto}://${host}`;
}

const assetCache = new Map<string, { contentType: string; body: Buffer }>();
const assetInFlight = new Map<string, Promise<{ contentType: string; body: Buffer }>>();

const mimeForPath = (p: string) =>
  p.endsWith('.glb')
    ? 'model/gltf-binary'
    : p.endsWith('.mp3')
    ? 'audio/mpeg'
    : p.endsWith('.png')
    ? 'image/png'
    : p.endsWith('.wasm')
    ? 'application/wasm'
    : p.endsWith('.json')
    ? 'application/json; charset=utf-8'
    : 'application/octet-stream';

function argonSquashRelayPlugin() {
  const rooms = new Map<string, any>();
  rooms.set('default', createRoomState('default'));

  const getOrCreateRoom = (rawId?: string) => {
    const cleaned = (rawId || 'default').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() || 'default';
    const key = cleaned === 'DEFAULT' ? 'default' : cleaned;
    let room = rooms.get(key);
    if (!room) {
      room = createRoomState(key);
      rooms.set(key, room);
    }
    return room;
  };

  const attachMiddleware = (server: any) => {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const rawUrl = req.url || '/';
      const parsed = new URL(rawUrl, 'http://localhost:3000');
      const pathname = parsed.pathname;

      if (pathname === '/___rPc_sWiTcH___') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('OK');
        return;
      }

      if (
        pathname.startsWith('/assets/models/') ||
        pathname.startsWith('/assets/audio/') ||
        pathname.startsWith('/assets/textures/') ||
        pathname.startsWith('/assets/mediapipe/')
      ) {
        // Check if file exists locally in public/assets first
        const localFile = path.resolve('public', pathname.slice(1));
        if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
          next();
          return;
        }

        const targetUrl = `https://www.gstatic.com/aistudio/starter-apps/tennis/${pathname.slice(8)}${parsed.search}`;
        try {
          let entry = assetCache.get(targetUrl);
          if (!entry) {
            let pending = assetInFlight.get(targetUrl);
            if (!pending) {
              pending = fetch(targetUrl)
                .then(async (resp) => {
                  if (!resp.ok) throw new Error(`Upstream ${resp.status}`);
                  const buf = Buffer.from(await resp.arrayBuffer());
                  const item = { contentType: mimeForPath(pathname), body: buf };
                  assetCache.set(targetUrl, item);
                  return item;
                })
                .finally(() => assetInFlight.delete(targetUrl));
              assetInFlight.set(targetUrl, pending);
            }
            entry = await pending;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', entry.contentType);
          res.setHeader('Content-Length', entry.body.length);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(entry.body);
        } catch {
          res.statusCode = 502;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end('Upstream asset fetch failed');
        }
        return;
      }

      if (!pathname.startsWith('/api/')) {
        next();
        return;
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.end();
        return;
      }

      const tunnelUrl = getRequestOrigin(req);
      const roomParam = parsed.searchParams.get('room') || 'default';
      const roleParam = (parsed.searchParams.get('role') || 'p1').toLowerCase();
      const roleKey = roleParam === 'p2' || roleParam === '2' || roleParam === 'opponent' ? 'p2' : 'p1';

      if (req.method === 'GET' && pathname === '/api/racket/state') {
        const room = getOrCreateRoom(roomParam);
        const slot = room.rackets[roleKey];
        sendJson(res, 200, { ...serializeRacket(slot), roomId: room.roomId, tunnelUrl });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/tunnel/status') {
        const room = getOrCreateRoom(roomParam);
        const qPrefix = room.roomId !== 'default' ? `room=${room.roomId}&` : '';
        sendJson(res, 200, {
          ok: true,
          active: true,
          tunnelUrl,
          companionUrl: `${tunnelUrl}/companion.html?${qPrefix}role=${roleKey}`,
          joinUrl: `${tunnelUrl}/?room=${room.roomId}&role=${roleKey}`
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/match/state') {
        const room = getOrCreateRoom(roomParam);
        const touch = parsed.searchParams.get('touch');
        if (touch === 'p1' || touch === 'p2') {
          if (touch === 'p2') room.p2DesktopSeenTs = Date.now();
          else room.p1DesktopSeenTs = Date.now();
        }
        const now = Date.now();
        const p1 = serializeRacket(room.rackets.p1);
        const p2 = serializeRacket(room.rackets.p2);
        const p1Online = room.p1DesktopSeenTs > 0 && now - room.p1DesktopSeenTs < 8000;
        const p2Online = room.p2DesktopSeenTs > 0 && now - room.p2DesktopSeenTs < 8000;
        sendJson(res, 200, {
          ok: true,
          roomId: room.roomId,
          hostName: room.hostName,
          guestName: room.guestName,
          gamesToWin: room.gamesToWin,
          p1Online,
          p2Online,
          p1DesktopOnline: p1Online,
          p2DesktopOnline: p2Online,
          p1PhoneConnected: p1.connected,
          p2PhoneConnected: p2.connected,
          p1,
          p2,
          rackets: { p1, p2 },
          snapshotSeq: room.stateSeq,
          snapshot: room.matchSnapshot,
          tunnelUrl
        });
        return;
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const targetRoomId = String(body.room || roomParam || 'default');
        const targetRoleRaw = String(body.role || roleKey || 'p1').toLowerCase();
        const targetRole = targetRoleRaw === 'p2' || targetRoleRaw === '2' || targetRoleRaw === 'opponent' ? 'p2' : 'p1';
        const room = getOrCreateRoom(targetRoomId);
        const slot = room.rackets[targetRole];

        if (pathname === '/api/racket/swing') {
          const now = Date.now();
          slot.seq += 1;
          slot.lastSeenTs = now;
          slot.connected = true;
          const rawType = String(body.type || 'swing').toLowerCase();
          const swing = {
            seq: slot.seq,
            role: slot.role,
            type: rawType === 'toss' ? 'toss' : rawType === 'let' ? 'let' : 'swing',
            shotType: String(body.shotType || 'topspin').toLowerCase(),
            speed: Number(body.speed ?? 1),
            angleX: Number(body.angleX ?? body.dirX ?? 0),
            dirX: Number(body.angleX ?? body.dirX ?? 0),
            dirY: Number(body.dirY ?? 0),
            pitch: Number(body.pitch ?? slot.orientation.pitch ?? 0),
            roll: Number(body.roll ?? slot.orientation.roll ?? 0),
            yaw: Number(body.yaw ?? slot.orientation.yaw ?? 0),
            timestamp: Number(body.timestamp ?? now),
            serverTimeMs: now,
            source: String(body.source || 'phone')
          };
          slot.lastSwing = swing;
          slot.swingHistory.push(swing);
          if (slot.swingHistory.length > 50) slot.swingHistory.shift();
          sendJson(res, 200, { ok: true, roomId: room.roomId, role: slot.role, swing });
          return;
        }

        if (pathname === '/api/racket/telemetry') {
          slot.lastSeenTs = Date.now();
          slot.connected = Boolean(body.connected ?? true);
          slot.orientation = {
            pitch: Number(body.pitch ?? slot.orientation.pitch ?? 0),
            roll: Number(body.roll ?? slot.orientation.roll ?? 0),
            yaw: Number(body.yaw ?? slot.orientation.yaw ?? 0),
            accelMag: Number(body.accelMag ?? 0),
            buttonB: Boolean(body.buttonB ?? false),
            connected: slot.connected
          };
          sendJson(res, 200, {
            ok: true,
            roomId: room.roomId,
            role: slot.role,
            orientation: slot.orientation,
            lastFeedback: slot.lastFeedback
          });
          return;
        }

        if (pathname === '/api/racket/feedback') {
          slot.feedbackSeq += 1;
          slot.lastFeedback = {
            seq: slot.feedbackSeq,
            role: slot.role,
            kind: String(body.kind || 'hit'),
            grade: String(body.grade || 'PERFECT'),
            shotType: String(body.shotType || 'TOPSPIN'),
            speedKmh: Number(body.speedKmh ?? 160),
            intensity: Number(body.intensity ?? 1),
            serverTimeMs: Date.now()
          };
          sendJson(res, 200, { ok: true, roomId: room.roomId, feedback: slot.lastFeedback });
          return;
        }

        if (pathname === '/api/match/sync') {
          room.stateSeq += 1;
          room.p1DesktopSeenTs = Date.now();
          const snap = body.snapshot && typeof body.snapshot === 'object' ? body.snapshot : body;
          room.matchSnapshot = { ...snap, seq: room.stateSeq, serverTimeMs: Date.now() };
          sendJson(res, 200, { ok: true, roomId: room.roomId, seq: room.stateSeq, p2Racket: serializeRacket(room.rackets.p2) });
          return;
        }

        if (pathname === '/api/match/create') {
          const newId = 'SQ-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          const created = createRoomState(
            newId,
            String(body.hostName || 'Player 1'),
            String(body.guestName || 'Challenger'),
            Number(body.gamesToWin || 2)
          );
          rooms.set(newId, created);
          sendJson(res, 200, {
            ok: true,
            roomId: newId,
            tunnelUrl,
            hostDesktopUrl: `${tunnelUrl}/?room=${newId}&role=p1`,
            guestDesktopUrl: `${tunnelUrl}/?room=${newId}&role=p2`,
            p1PhoneUrl: `${tunnelUrl}/companion.html?room=${newId}&role=p1`,
            p2PhoneUrl: `${tunnelUrl}/companion.html?room=${newId}&role=p2`,
            guestJoinHubUrl: `${tunnelUrl}/?room=${newId}&role=p2`
          });
          return;
        }
      }

      next();
    });
  };

  return {
    name: 'argon-squash-relay',
    configureServer(server: any) {
      attachMiddleware(server);
    },
    configurePreviewServer(server: any) {
      attachMiddleware(server);
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true'
    },
    plugins: [react(), argonSquashRelayPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '../assets/vendor/GLTFLoader.js': 'three/examples/jsm/loaders/GLTFLoader.js',
        '@': path.resolve('.')
      }
    }
  };
});
