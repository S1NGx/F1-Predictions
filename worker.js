/**
 * Cloudflare Worker – F1 Predictor auth backend
 *
 * D1 database binding required:
 *   Name: DB   (bind in the Worker dashboard under Settings → Variables → D1 Database Bindings)
 *
 * D1 table (already created):
 *   CREATE TABLE users (
 *     id       INTEGER PRIMARY KEY AUTOINCREMENT,
 *     username TEXT UNIQUE NOT NULL,
 *     password TEXT NOT NULL
 *   );
 *
 * Routes:
 *   POST /register  { username, passwordHash } → { ok } | { ok, error }
 *   POST /login     { username, passwordHash } → { ok } | { ok, error }
 */

const ALLOWED_ORIGINS = [
  "https://f1-predictions-7a8.pages.dev",
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  const allowed = ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)
    ? origin
    : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

async function handleRegister(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400);
  }

  const { username, passwordHash } = body;

  if (!username || !passwordHash) {
    return json({ ok: false, error: "All fields are required." });
  }
  if (username.length < 3) {
    return json({ ok: false, error: "Username must be at least 3 characters." });
  }

  // Check if username is already taken
  const existing = await env.DB
    .prepare("SELECT username FROM users WHERE username = ?")
    .bind(username)
    .first();
  if (existing) {
    return json({ ok: false, error: "Username already taken." });
  }

  // Store the user
  await env.DB
    .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .bind(username, passwordHash)
    .run();

  return json({ ok: true });
}

async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400);
  }

  const { username, passwordHash } = body;

  if (!username || !passwordHash) {
    return json({ ok: false, error: "All fields are required." });
  }

  const user = await env.DB
    .prepare("SELECT password FROM users WHERE username = ?")
    .bind(username)
    .first();
  if (!user || user.password !== passwordHash) {
    return json({ ok: false, error: "Invalid username or password." });
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = corsHeaders(request);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed." }, 405, headers);
    }

    let response;
    if (url.pathname === "/register") {
      response = await handleRegister(request, env);
    } else if (url.pathname === "/login") {
      response = await handleLogin(request, env);
    } else {
      response = json({ ok: false, error: "Not found." }, 404);
    }

    // Attach CORS headers to every real response
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(headers)) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
