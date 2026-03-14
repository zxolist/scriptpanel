// netlify/functions/toggleKey.js
// Enable or disable (ban) a license key.
// POST body: { secret, key, active: true/false }

const fs   = require('fs');
const path = require('path');

const KEYS_PATH        = path.join(__dirname, '../../data/keys.json');
const DASHBOARD_SECRET = 'changeme123'; // must match players.js

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { success: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { success: false, error: 'Invalid JSON' });
  }

  const { secret, key, active } = body;

  if (secret !== DASHBOARD_SECRET) {
    return respond(401, { success: false, error: 'Unauthorized' });
  }

  if (!key) {
    return respond(400, { success: false, error: 'Missing key' });
  }

  let keys;
  try {
    keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch {
    return respond(500, { success: false, error: 'Key database not found' });
  }

  if (!keys[key]) {
    return respond(404, { success: false, error: 'Key not found' });
  }

  keys[key].active = active !== false; // default true
  fs.writeFileSync(KEYS_PATH, JSON.stringify(keys, null, 2));

  return respond(200, { success: true, key, active: keys[key].active });
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json'
  };
}

function respond(statusCode, body) {
  return { statusCode, headers: corsHeaders(), body: JSON.stringify(body) };
}
