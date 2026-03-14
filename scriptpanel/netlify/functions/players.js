// netlify/functions/players.js
// Returns all player records to the dashboard.
// Marks players offline if they haven't sent data in 30 seconds.
// Protected by a secret query param: ?secret=YOUR_SECRET

const fs   = require('fs');
const path = require('path');

const PLAYERS_PATH = path.join(__dirname, '../../data/players.json');
const KEYS_PATH    = path.join(__dirname, '../../data/keys.json');

// ── CHANGE THIS to a strong password ────────────────────────────────────────
const DASHBOARD_SECRET = 'changeme123';
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ''
    };
  }

  // ── Secret check (protects your dashboard) ───────────────────────────────
  const params = event.queryStringParameters || {};
  if (params.secret !== DASHBOARD_SECRET) {
    return respond(401, { success: false, error: 'Unauthorized' });
  }

  // ── Load player data ──────────────────────────────────────────────────────
  let players;
  try {
    players = JSON.parse(fs.readFileSync(PLAYERS_PATH, 'utf8'));
  } catch {
    players = {};
  }

  // ── Load key data (to get owner names) ───────────────────────────────────
  let keys;
  try {
    keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch {
    keys = {};
  }

  const now = Date.now();

  // ── Mark players offline if no ping in 30 seconds ────────────────────────
  Object.values(players).forEach(p => {
    const diff = now - new Date(p.lastSeen).getTime();
    p.online = diff < 30000; // 30 seconds
  });

  // Save updated online status
  try {
    fs.writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2));
  } catch (_) {}

  const list         = Object.values(players);
  const onlineCount  = list.filter(p => p.online).length;
  const activeKeys   = Object.values(keys).filter(k => k.active).length;
  const totalKeys    = Object.values(keys).length;

  return respond(200, {
    success:      true,
    players:      list,
    onlineCount,
    totalCount:   list.length,
    activeKeys,
    totalKeys
  });
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type':                 'application/json'
  };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body)
  };
}
