# ScriptPanel — Roblox Script Monitoring System

A complete script distribution and monitoring platform for Roblox games (Blox Fruits and others).

---

## What's included

```
scriptpanel/
├── index.html                        ← Admin dashboard (your private webpage)
├── netlify.toml                      ← Netlify config
├── .gitignore
├── data/
│   ├── keys.json                     ← License key database (edit this to add customers)
│   └── players.json                  ← Auto-updated player records (do not edit manually)
├── netlify/
│   └── functions/
│       ├── log.js                    ← POST /api/log  (Roblox sends data here)
│       ├── players.js                ← GET  /api/players (dashboard fetches from here)
│       ├── addKey.js                 ← POST /api/addKey (add key from dashboard)
│       └── toggleKey.js              ← POST /api/toggleKey (ban/unban a key)
└── lua/
    └── BloxFruitsMonitor.lua         ← The Lua script your customers run
```

---

## Setup Instructions

### Step 1 — Change the dashboard password

Open **netlify/functions/players.js** and change:
```js
const DASHBOARD_SECRET = 'changeme123';
```
to something strong like `myS3cr3tP4ss!`

Do the same in **netlify/functions/addKey.js** and **netlify/functions/toggleKey.js**.

---

### Step 2 — Deploy to Netlify

1. Create a free account at https://github.com and https://netlify.com
2. Create a new **private** GitHub repo named `scriptpanel`
3. Push this entire folder to that repo:
   ```bash
   git init
   git add .
   git commit -m "initial setup"
   git remote add origin https://github.com/YOUR_USERNAME/scriptpanel.git
   git push -u origin main
   ```
4. In Netlify: **Add new site → Import from Git → GitHub** → select your repo → Deploy
5. Copy your Netlify URL (e.g. `https://scriptpanel-abc123.netlify.app`)

---

### Step 3 — Update your URL in index.html

Open **index.html** and change:
```js
const SITE = 'https://YOUR-SITE.netlify.app';
```
to your actual Netlify URL.

Commit and push again to redeploy.

---

### Step 4 — Upload the Lua script

1. Open **lua/BloxFruitsMonitor.lua**
2. Change the `API_URL` on line 24 to your Netlify URL:
   ```lua
   local API_URL = "https://YOUR-SITE.netlify.app/.netlify/functions/log"
   ```
3. Upload the file to **Pastebin** (create account → New Paste → set to Public)
4. Copy the **raw** URL (e.g. `https://pastebin.com/raw/XXXXXXXX`)

---

### Step 5 — Add license keys for customers

Open **data/keys.json** and add entries:
```json
{
  "ABCD-1234-EFGH-5678": {
    "user": "customer_name",
    "expires": "2026-12-31",
    "active": true
  }
}
```

- `expires`: use a date like `"2026-12-31"` for monthly/yearly, or `"permanent"` for lifetime
- `active`: set to `false` to instantly ban the key

After editing, push to GitHub — Netlify redeploys in ~20 seconds.

---

### Step 6 — Give customers this code

```lua
_G.key = "ABCD-1234-EFGH-5678"
loadstring(game:HttpGet("https://pastebin.com/raw/XXXXXXXX"))()
```

---

## Accessing your dashboard

Open your Netlify URL in a browser:
```
https://YOUR-SITE.netlify.app
```

Enter the password you set in Step 1. You will see:
- Live player list (Level, Beli, Gems, Online status)
- Stats (online count, total accounts, active keys)
- License key management

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/.netlify/functions/log` | POST | Receives data from Lua script |
| `/.netlify/functions/players?secret=PASS` | GET | Returns player list to dashboard |
| `/.netlify/functions/addKey` | POST | Adds a new license key |
| `/.netlify/functions/toggleKey` | POST | Bans or unbans a key |

---

## Lua script requirements

- The customer must be playing **Blox Fruits**
- HTTP Requests must be **enabled** in Game Settings → Security
- Requires a Roblox executor (Synapse X, KRNL, etc.)

---

## Security notes

- Keep `data/` out of public repos (already in `.gitignore` for public repos)
- Use a strong `DASHBOARD_SECRET` password — anyone with it can see all player data
- The dashboard URL is not secret by itself, only the password protects it
- Keys are validated server-side — customers cannot bypass the key check

---

## Troubleshooting

**Dashboard shows no players**
→ Make sure the Lua script is running and the API URL is correct

**API returns 403 Invalid key**
→ Check that the key in `keys.json` matches exactly what the customer is using

**Netlify function errors**
→ Go to Netlify dashboard → Functions tab → click a function → view logs

**Lua script errors "Data not found"**
→ Make sure the player is actually in a Blox Fruits game, not the lobby

---

## Future upgrades

- WebSocket for instant real-time updates
- Fruit inventory tracking
- Auto-ban detection
- Multi-game support
- Email notifications when a player goes offline
