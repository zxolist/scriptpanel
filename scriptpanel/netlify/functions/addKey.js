// netlify/functions/addKey.js
// Lets you add a new license key from the dashboard.
// Protected by the same dashboard secret.

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

  const { secret, key, user, expires } = body;

  if (secret !== DASHBOARD_SECRET) {
    return respond(401, { success: false, error: 'Unauthorized' });
  }

  if (!key || !user) {
    return respond(400, { success: false, error: 'Missing key or user' });
  }

  let keys;
  try {
    keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch {
    keys = {};
  }

  keys[key] = {
    user:    user,
    expires: expires || 'permanent',
    active:  true
  };

  fs.writeFileSync(KEYS_PATH, JSON.stringify(keys, null, 2));

  return respond(200, { success: true, key, user });
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
