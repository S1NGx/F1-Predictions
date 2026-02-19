/**
 * auth.js – Authentication backed by a Cloudflare Worker.
 * Registration and login are performed via fetch() to the Worker API.
 * The active session is kept in sessionStorage so it clears on tab close.
 */

const AUTH = (() => {
  const API = "https://f1predictions.stiliyan1703.workers.dev";
  const SESSION_KEY = "f1p_session";

  // Remove stale localStorage data from the old client-side auth
  localStorage.removeItem("f1p_users");

  // Very basic hash (djb2) – raw password never leaves the browser
  function hashPassword(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }

  async function register(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { ok: false, error: "All fields are required." };
    if (username.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

    const payload = { username, passwordHash: hashPassword(password) };
    console.log("[AUTH] Registering:", username, "→", API + "/register");

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[AUTH] Register response:", data);
      return data;
    } catch (err) {
      console.error("[AUTH] Register fetch error:", err);
      return { ok: false, error: "Network error: " + err.message };
    }
  }

  async function login(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { ok: false, error: "All fields are required." };

    const payload = { username, passwordHash: hashPassword(password) };
    console.log("[AUTH] Logging in:", username, "→", API + "/login");

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[AUTH] Login response:", data);
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
      }
      return data;
    } catch (err) {
      console.error("[AUTH] Login fetch error:", err);
      return { ok: false, error: "Network error: " + err.message };
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  }

  function isLoggedIn() {
    return !!sessionStorage.getItem(SESSION_KEY);
  }

  function getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Call this at the top of any protected page to redirect if not logged in. */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = "index.html";
    }
  }

  return { register, login, logout, isLoggedIn, getCurrentUser, requireAuth };
})();

