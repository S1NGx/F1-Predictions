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
  let existing;
  try {
    existing = await env.DB
      .prepare("SELECT username FROM users WHERE username = ?")
      .bind(username)
      .first();
  } catch (err) {
    console.error("DB lookup error:", err);
    return json({ ok: false, error: "Database error (lookup): " + err.message }, 500);
  }

  if (existing) {
    return json({ ok: false, error: "Username already taken." });
  }

  // Store the user
  let result;
  try {
    result = await env.DB
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .bind(username, passwordHash)
      .run();
    console.log("Insert result:", JSON.stringify(result));
  } catch (err) {
    console.error("DB insert error:", err);
    return json({ ok: false, error: "Database error (insert): " + err.message }, 500);
  }

  if (!result.success) {
    return json({ ok: false, error: "Insert did not succeed." }, 500);
  }

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

  let user;
  try {
    user = await env.DB
      .prepare("SELECT password FROM users WHERE username = ?")
      .bind(username)
      .first();
  } catch (err) {
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }

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

    // GET / – health check
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(JSON.stringify({ ok: true, status: "F1 Predictor Worker running" }), {
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    // GET /debug – verify DB binding and read current user count
    if (request.method === "GET" && url.pathname === "/debug") {
      try {
        const { results } = await env.DB.prepare("SELECT id, username FROM users").all();
        return new Response(JSON.stringify({ ok: true, users: results }), {
          headers: { "Content-Type": "application/json", ...headers },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...headers },
        });
      }
    }

    // GET /debug-insert – do a real test insert then delete it, to verify writes work
    if (request.method === "GET" && url.pathname === "/debug-insert") {
      const testUser = "__test__" + Date.now();
      const steps = {};
      try {
        const insertResult = await env.DB
          .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
          .bind(testUser, "testhash")
          .run();
        steps.insert = { success: insertResult.success, meta: insertResult.meta };
      } catch (err) {
        steps.insert = { error: err.message };
      }
      try {
        await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(testUser).run();
        steps.cleanup = "ok";
      } catch (err) {
        steps.cleanup = { error: err.message };
      }
      return new Response(JSON.stringify({ ok: true, steps }), {
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed." }, 405, headers);
    }

    // POST /debug-echo – reflects the raw body back so you can verify what the worker receives
    if (url.pathname === "/debug-echo") {
      const raw = await request.text();
      return new Response(JSON.stringify({ ok: true, received: raw }), {
        headers: { "Content-Type": "application/json", ...headers },
      });
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
