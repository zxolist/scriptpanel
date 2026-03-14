-- ============================================================
--  ScriptPanel Monitor — Blox Fruits
--  Version: 1.0
--
--  HOW TO USE (tell your customers this):
--
--    _G.key = "YOUR-LICENSE-KEY"
--    loadstring(game:HttpGet("YOUR_PASTEBIN_RAW_URL"))()
--
--  Requirements:
--    - HTTP Requests must be ON in Game Settings → Security
--    - Run inside a Roblox executor (e.g. Synapse, KRNL)
-- ============================================================

-- ── CONFIG ─────────────────────────────────────────────────
local API_URL  = "https://YOUR-SITE.netlify.app/.netlify/functions/log"
local INTERVAL = 10  -- seconds between each data ping
-- ───────────────────────────────────────────────────────────

-- Read the license key
local key = _G.key
if not key or key == "" then
    error("[ScriptPanel] ERROR: Set _G.key before running this script!\nExample: _G.key = 'ABCD-1234-EFGH-5678'")
    return
end

-- Services
local Players     = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local RunService  = game:GetService("RunService")

-- Get local player
local player = Players.LocalPlayer
if not player then
    error("[ScriptPanel] Could not find LocalPlayer.")
    return
end

print("[ScriptPanel] Starting up for player: " .. player.Name)
print("[ScriptPanel] Key: " .. key)

-- ── Wait for game to load ───────────────────────────────────
repeat task.wait(0.5) until game:IsLoaded()
print("[ScriptPanel] Game loaded.")

-- ── Wait for player Data folder (Blox Fruits specific) ─────
local Data
local timeout = 60  -- seconds to wait before giving up
local elapsed = 0

repeat
    Data = player:FindFirstChild("Data")
    task.wait(1)
    elapsed = elapsed + 1
    if elapsed >= timeout then
        error("[ScriptPanel] Timed out waiting for player Data. Are you in Blox Fruits?")
        return
    end
until Data ~= nil

print("[ScriptPanel] Player data found! Starting monitor...")

-- ── Helper: safely read a value ────────────────────────────
local function safeGet(parent, childName)
    local child = parent:FindFirstChild(childName)
    if child and child.Value ~= nil then
        return child.Value
    end
    return 0
end

-- ── Helper: format number for display ──────────────────────
local function fmt(n)
    if n >= 1000000 then
        return string.format("%.1fM", n / 1000000)
    elseif n >= 1000 then
        return string.format("%.0fK", n / 1000)
    end
    return tostring(n)
end

-- ── Main loop ───────────────────────────────────────────────
local failCount = 0
local maxFails  = 5  -- stop after 5 consecutive failures

while true do

    local ok, err = pcall(function()

        -- Collect stats from Blox Fruits Data folder
        local level = safeGet(Data, "Level")
        local beli  = safeGet(Data, "Beli")
        local gems  = safeGet(Data, "Gems")

        -- Build JSON payload
        local payload = HttpService:JSONEncode({
            key      = key,
            username = player.Name,
            level    = level,
            money    = beli,
            gems     = gems,
        })

        -- Send POST request to your API
        local response = HttpService:RequestAsync({
            Url     = API_URL,
            Method  = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
            },
            Body = payload,
        })

        -- Handle response
        if response.Success then
            local body = HttpService:JSONDecode(response.Body)
            if body.success then
                print(string.format(
                    "[ScriptPanel] ✓ Sent — Level: %d | Beli: %s | Gems: %d",
                    level, fmt(beli), gems
                ))
                failCount = 0  -- reset fail counter on success
            else
                warn("[ScriptPanel] API rejected: " .. (body.error or "unknown error"))
                if body.error == "Invalid key" or body.error == "Key is disabled" or body.error == "Key has expired" then
                    error("[ScriptPanel] Your license key is invalid or expired. Contact support.")
                end
            end
        else
            warn("[ScriptPanel] HTTP error: " .. tostring(response.StatusCode))
            failCount = failCount + 1
        end

    end)

    if not ok then
        warn("[ScriptPanel] Error: " .. tostring(err))
        failCount = failCount + 1
    end

    -- Stop if too many consecutive failures
    if failCount >= maxFails then
        warn("[ScriptPanel] Too many failures. Stopping monitor.")
        break
    end

    task.wait(INTERVAL)
end
