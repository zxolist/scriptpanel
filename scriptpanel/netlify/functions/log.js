// netlify/functions/log.js
// Receives player data from the Roblox Lua script every 10 seconds.
// Validates the license key then saves the player record.

const fs   = require('fs');
const path = require('path');

const KEYS_PATH    = path.join(__dirname, '../../data/keys.json');
const PLAYERS_PATH = path.join(__dirname, '../../data/players.json');

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { success: false, error: 'Method not allowed' });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { success: false, error: 'Invalid JSON body' });
  }

  const { key, username, level, money, gems } = body;

  if (!key || !username) {
    return respond(400, { success: false, error: 'Missing key or username' });
  }

  // ── Key validation ───────────────────────────────────────────────────────────
  let keys;
  try {
    keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch {
    return respond(500, { success: false, error: 'Key database not found' });
  }

  const keyData = keys[key];

  if (!keyData) {
    return respond(403, { success: false, error: 'Invalid key' });
  }

  if (!keyData.active) {
    return respond(403, { success: false, error: 'Key is disabled' });
  }

  if (keyData.expires !== 'permanent') {
    const expiry = new Date(keyData.expires);
    if (new Date() > expiry) {
      return respond(403, { success: false, error: 'Key has expired' });
    }
  }

  // ── Save player record ───────────────────────────────────────────────────────
  let players;
  try {
    players = JSON.parse(fs.readFileSync(PLAYERS_PATH, 'utf8'));
  } catch {
    players = {};
  }

  players[username] = {
    username:  username,
    level:     Number(level)  || 0,
    money:     Number(money)  || 0,
    gems:      Number(gems)   || 0,
    key:       key,
    owner:     keyData.user,
    lastSeen:  new Date().toISOString(),
    online:    true
  };

  try {
    fs.writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2));
  } catch (e) {
    return respond(500, { success: false, error: 'Failed to save player data' });
  }

  return respond(200, { success: true });
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
