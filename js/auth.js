/**
 * auth.js – Client-side authentication using localStorage.
 * Users are stored as an array of { username, passwordHash } objects.
 * The active session is kept in sessionStorage so it clears on tab close.
 *
 * NOTE: This is intentionally simple client-side auth for a friend-group game.
 * Do not use this pattern for anything requiring real security.
 */

const AUTH = (() => {
  const USERS_KEY = "f1p_users";
  const SESSION_KEY = "f1p_session";

  // Very basic hash (djb2) – good enough for a private friend game
  function hashPassword(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function register(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { ok: false, error: "All fields are required." };
    if (username.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

    const users = getUsers();
    if (users.find((u) => u.username === username)) {
      return { ok: false, error: "Username already taken." };
    }

    users.push({ username, passwordHash: hashPassword(password) });
    saveUsers(users);
    return { ok: true };
  }

  function login(username, password) {
    username = username.trim().toLowerCase();
    const users = getUsers();
    const user = users.find((u) => u.username === username);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, error: "Invalid username or password." };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    return { ok: true };
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
