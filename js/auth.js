/**
 * auth.js – Authentication backed by a Cloudflare Worker.
 * Registration and login are performed via fetch() to the Worker API.
 * The active session is kept in sessionStorage so it clears on tab close.
 *
 * NOTE: This is intentionally simple auth for a friend-group game.
 */

const AUTH = (() => {
  const API = "https://f1predictions.stiliyan1703.workers.dev";
  const SESSION_KEY = "f1p_session";

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

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passwordHash: hashPassword(password) }),
      });
      return await res.json();
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }

  async function login(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { ok: false, error: "All fields are required." };

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passwordHash: hashPassword(password) }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
      }
      return data;
    } catch {
      return { ok: false, error: "Network error. Please try again." };
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
