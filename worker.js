/**
 * Cloudflare Worker – F1 Predictor backend
 *
 * D1 database binding required:
 *   Name: DB  (Worker dashboard → Settings → Variables → D1 Database Bindings)
 *
 * ── Run these SQL migrations in your D1 console before deploying ──────────
 *
 *  CREATE TABLE IF NOT EXISTS users (
 *    id       INTEGER PRIMARY KEY AUTOINCREMENT,
 *    username TEXT UNIQUE NOT NULL,
 *    password TEXT NOT NULL
 *  );
 *
 *  CREATE TABLE IF NOT EXISTS predictions (
 *    id           INTEGER PRIMARY KEY AUTOINCREMENT,
 *    username     TEXT NOT NULL,
 *    round        INTEGER NOT NULL,
 *    pole         TEXT NOT NULL DEFAULT '',
 *    podium_p1    TEXT NOT NULL DEFAULT '',
 *    podium_p2    TEXT NOT NULL DEFAULT '',
 *    podium_p3    TEXT NOT NULL DEFAULT '',
 *    sprint_win   TEXT DEFAULT NULL,
 *    best_tr      TEXT NOT NULL DEFAULT '',
 *    sc_count     TEXT NOT NULL DEFAULT '',
 *    retirements  INTEGER NOT NULL DEFAULT 0,
 *    submitted_at TEXT NOT NULL,
 *    UNIQUE(username, round)
 *  );
 *
 *  CREATE TABLE IF NOT EXISTS results (
 *    round       INTEGER PRIMARY KEY,
 *    pole        TEXT,
 *    podium_p1   TEXT,
 *    podium_p2   TEXT,
 *    podium_p3   TEXT,
 *    sprint_win  TEXT,
 *    best_tr     TEXT,
 *    sc_count    TEXT,
 *    retirements INTEGER,
 *    fetched_at  TEXT
 *  );
 *
 * ── Routes ────────────────────────────────────────────────────────────────
 *  POST /register        { username, passwordHash }
 *  POST /login           { username, passwordHash }
 *  POST /predict         { username, round, pole, podium_p1-3, sprint_win, best_tr, sc_count, retirements }
 *  GET  /predict         ?username=X&round=N
 *  GET  /results         ?round=N
 *  GET  /leaderboard
 *  GET  /fetch-results   ?round=N  ← triggers OpenF1 fetch & stores in DB
 */

const ALLOWED_ORIGINS = [
  "https://f1-predictions-7a8.pages.dev",
];

/* ── Top-4 teams excluded from "Best of the Rest" ── */
const TOP4_TEAMS = ["ferrari", "red bull racing", "mercedes", "mclaren"];

/* ── Scoring ─────────────────────────────────────────────────────────────── */
function computeScore(pred, result) {
  let total = 0;
  const breakdown = {
    pole: 0, podium_p1: 0, podium_p2: 0, podium_p3: 0,
    sprint: 0, best_tr: 0, sc_count: 0, retirements: 0,
  };

  // Pole – 10 pts
  if (pred.pole && result.pole && pred.pole === result.pole) {
    total += 10; breakdown.pole = 10;
  }

  // Podium – correct position: 25/18/15 pts; on podium but wrong spot: 10 pts
  const rPodium = [result.podium_p1, result.podium_p2, result.podium_p3];
  const pPodium = [pred.podium_p1,   pred.podium_p2,   pred.podium_p3];
  const fullPts = [25, 18, 15];
  for (let i = 0; i < 3; i++) {
    const key = `podium_p${i + 1}`;
    if (!pPodium[i] || !rPodium[i]) continue;
    if (pPodium[i] === rPodium[i]) {
      total += fullPts[i]; breakdown[key] = fullPts[i];
    } else if (rPodium.includes(pPodium[i])) {
      total += 10; breakdown[key] = 10; // on podium, wrong position
    }
  }

  // Sprint – 8 pts
  if (pred.sprint_win && result.sprint_win && pred.sprint_win === result.sprint_win) {
    total += 8; breakdown.sprint = 8;
  }

  // Best of the rest – 10 pts
  if (pred.best_tr && result.best_tr && pred.best_tr === result.best_tr) {
    total += 10; breakdown.best_tr = 10;
  }

  // Safety car / red flag bucket – 10 pts
  if (pred.sc_count && result.sc_count && pred.sc_count === result.sc_count) {
    total += 10; breakdown.sc_count = 10;
  }

  // Retirements – 10 pts exact, 5 pts ±1
  if (pred.retirements != null && result.retirements != null) {
    const diff = Math.abs(parseInt(pred.retirements) - parseInt(result.retirements));
    if (diff === 0)      { total += 10; breakdown.retirements = 10; }
    else if (diff === 1) { total += 5;  breakdown.retirements = 5;  }
  }

  return { total, breakdown };
}

/* ── CORS helpers ─────────────────────────────────────────────────────── */
function corsHeaders(request) {
  const origin  = request.headers.get("Origin") || "*";
  const allowed = ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

/* ── Auth ─────────────────────────────────────────────────────────────── */
async function handleRegister(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON." }, 400); }

  const { username, passwordHash } = body;
  if (!username || !passwordHash) return json({ ok: false, error: "All fields are required." });
  if (username.length < 3)        return json({ ok: false, error: "Username must be at least 3 characters." });

  try {
    const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(username).first();
    if (existing) return json({ ok: false, error: "Username already taken." });

    const result = await env.DB.prepare("INSERT INTO users (username, password) VALUES (?, ?)").bind(username, passwordHash).run();
    if (!result.success) return json({ ok: false, error: "Insert did not succeed." }, 500);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON." }, 400); }

  const { username, passwordHash } = body;
  if (!username || !passwordHash) return json({ ok: false, error: "All fields are required." });

  try {
    const user = await env.DB.prepare("SELECT password FROM users WHERE username = ?").bind(username).first();
    if (!user || user.password !== passwordHash) return json({ ok: false, error: "Invalid username or password." });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

/* ── Predictions ──────────────────────────────────────────────────────── */
async function handleSavePrediction(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON." }, 400); }

  const { username, round, pole, podium_p1, podium_p2, podium_p3, sprint_win, best_tr, sc_count, retirements } = body;
  if (!username || !round || !podium_p1 || !podium_p2 || !podium_p3 || !best_tr || !sc_count) {
    return json({ ok: false, error: "Missing required fields." });
  }

  try {
    await env.DB.prepare(`
      INSERT INTO predictions
        (username, round, pole, podium_p1, podium_p2, podium_p3, sprint_win, best_tr, sc_count, retirements, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, round) DO UPDATE SET
        pole=excluded.pole, podium_p1=excluded.podium_p1, podium_p2=excluded.podium_p2,
        podium_p3=excluded.podium_p3, sprint_win=excluded.sprint_win, best_tr=excluded.best_tr,
        sc_count=excluded.sc_count, retirements=excluded.retirements, submitted_at=excluded.submitted_at
    `).bind(
      username, parseInt(round), pole || "",
      podium_p1, podium_p2, podium_p3,
      sprint_win || null, best_tr, sc_count,
      parseInt(retirements) || 0, new Date().toISOString()
    ).run();

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

async function handleGetPrediction(url, env) {
  const username = url.searchParams.get("username");
  const round    = url.searchParams.get("round");
  if (!username || !round) return json({ ok: false, error: "Missing username or round." });

  try {
    const row = await env.DB.prepare("SELECT * FROM predictions WHERE username = ? AND round = ?")
      .bind(username, parseInt(round)).first();
    return json({ ok: true, prediction: row || null });
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

/* ── Results ──────────────────────────────────────────────────────────── */
async function handleGetResults(url, env) {
  const round = url.searchParams.get("round");
  if (!round) return json({ ok: false, error: "Missing round." });

  try {
    const row = await env.DB.prepare("SELECT * FROM results WHERE round = ?").bind(parseInt(round)).first();
    return json({ ok: true, results: row || null });
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

/* ── Leaderboard ──────────────────────────────────────────────────────── */
async function handleLeaderboard(env) {
  try {
    const { results: preds }   = await env.DB.prepare("SELECT * FROM predictions").all();
    const { results: resList } = await env.DB.prepare("SELECT * FROM results").all();

    const resultMap = {};
    for (const r of resList) resultMap[r.round] = r;

    const scoreMap = {};
    for (const pred of preds) {
      const result = resultMap[pred.round];
      if (!result) continue;

      if (!scoreMap[pred.username]) {
        scoreMap[pred.username] = { username: pred.username, total: 0, rounds: 0 };
      }
      const { total } = computeScore(pred, result);
      scoreMap[pred.username].total  += total;
      scoreMap[pred.username].rounds += 1;
    }

    const board = Object.values(scoreMap).sort((a, b) => b.total - a.total);
    return json({ ok: true, leaderboard: board });
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

/* ── OpenF1 auto-fetch ────────────────────────────────────────────────── */
async function handleFetchResults(url, env) {
  const round = parseInt(url.searchParams.get("round"));
  if (!round) return json({ ok: false, error: "Missing round param." });

  const openf1 = "https://api.openf1.org/v1";

  try {
    /* 1 – Get all 2026 race meetings (exclude testing) */
    const meetingsRes = await fetch(`${openf1}/meetings?year=2026`);
    const meetings    = await meetingsRes.json();
    if (!Array.isArray(meetings) || !meetings.length) return json({ ok: false, error: "No meetings from OpenF1." });

    meetings.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
    const raceMeetings = meetings.filter(m =>
      !m.meeting_official_name?.toLowerCase().includes("test") &&
      !m.meeting_official_name?.toLowerCase().includes("pre-season")
    );

    const meeting = raceMeetings[round - 1];
    if (!meeting) return json({ ok: false, error: `No OpenF1 meeting for round ${round}.` });

    const mk = meeting.meeting_key;

    /* 2 – Get sessions */
    const sessRes    = await fetch(`${openf1}/sessions?meeting_key=${mk}`);
    const sessions   = await sessRes.json();
    const raceS      = sessions.find(s => s.session_name === "Race");
    const qualS      = sessions.find(s => s.session_name === "Qualifying");
    const sprintS    = sessions.find(s => s.session_name === "Sprint");
    if (!raceS) return json({ ok: false, error: "Race session not in OpenF1 yet – race may not have happened." });

    const raceSK = raceS.session_key;
    const qualSK = qualS?.session_key;

    /* 3 – Drivers map: driver_number → { acronym, team } */
    const drRes    = await fetch(`${openf1}/drivers?session_key=${raceSK}`);
    const drivers  = await drRes.json();
    const driverMap = {};
    for (const d of drivers) {
      driverMap[d.driver_number] = { acronym: d.name_acronym, team: d.team_name || "" };
    }

    /* helper: last recorded position data for each driver in a session */
    async function finalPositions(sessionKey) {
      const r    = await fetch(`${openf1}/position?session_key=${sessionKey}`);
      const data = await r.json();
      const last = {};
      for (const p of data) {
        if (!last[p.driver_number] || new Date(p.date) > new Date(last[p.driver_number].date)) {
          last[p.driver_number] = p;
        }
      }
      return Object.values(last).filter(p => p.position > 0).sort((a, b) => a.position - b.position);
    }

    /* 4 – Race podium + retirements */
    const classified = await finalPositions(raceSK);
    const podium_p1  = driverMap[classified[0]?.driver_number]?.acronym || "";
    const podium_p2  = driverMap[classified[1]?.driver_number]?.acronym || "";
    const podium_p3  = driverMap[classified[2]?.driver_number]?.acronym || "";
    const retirements = Math.max(0, 20 - classified.length);

    /* 5 – Pole from qualifying */
    let pole = "";
    if (qualSK) {
      const qFinal = await finalPositions(qualSK);
      pole = driverMap[qFinal[0]?.driver_number]?.acronym || "";
    }

    /* 6 – Sprint winner */
    let sprint_win = null;
    if (sprintS) {
      const spFinal = await finalPositions(sprintS.session_key);
      sprint_win    = driverMap[spFinal[0]?.driver_number]?.acronym || null;
    }

    /* 7 – Safety car / red flag count */
    const rcRes  = await fetch(`${openf1}/race_control?session_key=${raceSK}`);
    const rcData = await rcRes.json();
    let scCount  = 0;
    for (const msg of rcData) {
      const cat  = (msg.category || "").toLowerCase();
      const flag = (msg.flag     || "").toLowerCase();
      const txt  = (msg.message  || "").toLowerCase();
      if (cat === "safetycar" || txt.includes("safety car") || txt.includes("virtual safety car")) scCount++;
      if ((cat === "flag" && flag === "red") || txt.includes("red flag")) scCount++;
    }
    const sc_count = scCount === 0 ? "0" : scCount <= 2 ? "1-2" : "3+";

    /* 8 – Best of the rest (highest-placed non-top-4 team) */
    let best_tr = "";
    for (const p of classified) {
      const dInfo    = driverMap[p.driver_number];
      if (!dInfo) continue;
      const teamLow  = dInfo.team.toLowerCase();
      if (!TOP4_TEAMS.some(t => teamLow.includes(t))) { best_tr = dInfo.team; break; }
    }

    /* 9 – Persist to D1 */
    await env.DB.prepare(`
      INSERT INTO results (round, pole, podium_p1, podium_p2, podium_p3, sprint_win, best_tr, sc_count, retirements, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(round) DO UPDATE SET
        pole=excluded.pole, podium_p1=excluded.podium_p1, podium_p2=excluded.podium_p2,
        podium_p3=excluded.podium_p3, sprint_win=excluded.sprint_win, best_tr=excluded.best_tr,
        sc_count=excluded.sc_count, retirements=excluded.retirements, fetched_at=excluded.fetched_at
    `).bind(round, pole, podium_p1, podium_p2, podium_p3,
             sprint_win, best_tr, sc_count, retirements, new Date().toISOString()).run();

    return json({ ok: true, result: { round, pole, podium_p1, podium_p2, podium_p3, sprint_win, best_tr, sc_count, retirements } });
  } catch (err) {
    console.error("fetch-results error:", err);
    return json({ ok: false, error: err.message }, 500);
  }
}

/* ── Main router ──────────────────────────────────────────────────────── */
export default {
  async fetch(request, env) {
    const url     = new URL(request.url);
    const headers = corsHeaders(request);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    let response;

    if      (request.method === "GET"  && url.pathname === "/")               response = json({ ok: true, status: "F1 Predictor Worker running" });
    else if (request.method === "GET"  && url.pathname === "/debug") {
      try {
        const { results } = await env.DB.prepare("SELECT id, username FROM users").all();
        response = json({ ok: true, users: results });
      } catch (err) { response = json({ ok: false, error: err.message }, 500); }
    }
    else if (request.method === "POST" && url.pathname === "/register")        response = await handleRegister(request, env);
    else if (request.method === "POST" && url.pathname === "/login")           response = await handleLogin(request, env);
    else if (request.method === "POST" && url.pathname === "/predict")         response = await handleSavePrediction(request, env);
    else if (request.method === "GET"  && url.pathname === "/predict")         response = await handleGetPrediction(url, env);
    else if (request.method === "GET"  && url.pathname === "/results")         response = await handleGetResults(url, env);
    else if (request.method === "GET"  && url.pathname === "/leaderboard")     response = await handleLeaderboard(env);
    else if (request.method === "GET"  && url.pathname === "/fetch-results")   response = await handleFetchResults(url, env);
    else                                                                        response = json({ ok: false, error: "Not found." }, 404);

    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(headers)) newHeaders.set(k, v);
    return new Response(response.body, { status: response.status, headers: newHeaders });
  },
};
