/**
 * app.js – Dashboard / game logic entry point.
 * Runs on dashboard.html after AUTH.requireAuth() passes.
 */

document.addEventListener("DOMContentLoaded", () => {
  AUTH.requireAuth();

  const user = AUTH.getCurrentUser();

  // Display the logged-in username
  const usernameEl = document.getElementById("current-username");
  if (usernameEl) usernameEl.textContent = user.username;

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => AUTH.logout());
  }

  // TODO: load race calendar, predictions, leaderboard here
});
