/**
 * predict.js – Prediction form for a single race weekend.
 * URL:  predict.html?round=N
 */

const API = "https://f1predictions.stiliyan1703.workers.dev";

/* ── 2026 driver list (acronym must match OpenF1 name_acronym) ────────── */
const DRIVERS_2026 = [
  { acronym: "VER", name: "Max Verstappen",        team: "Oracle Red Bull Racing" },
  { acronym: "HAD", name: "Isack Hadjar",           team: "Oracle Red Bull Racing" },
  { acronym: "LEC", name: "Charles Leclerc",        team: "Ferrari" },
  { acronym: "HAM", name: "Lewis Hamilton",          team: "Ferrari" },
  { acronym: "NOR", name: "Lando Norris",            team: "McLaren" },
  { acronym: "PIA", name: "Oscar Piastri",           team: "McLaren" },
  { acronym: "RUS", name: "George Russell",          team: "Mercedes" },
  { acronym: "ANT", name: "Kimi Antonelli",          team: "Mercedes" },
  { acronym: "ALO", name: "Fernando Alonso",         team: "Aston Martin" },
  { acronym: "STR", name: "Lance Stroll",            team: "Aston Martin" },
  { acronym: "GAS", name: "Pierre Gasly",            team: "Alpine" },
  { acronym: "COL", name: "Franco Colapinto",        team: "Alpine" },
  { acronym: "SAI", name: "Carlos Sainz Jr.",        team: "Williams" },
  { acronym: "ALB", name: "Alexander Albon",         team: "Williams" },
  { acronym: "LAW", name: "Liam Lawson",             team: "Racing Bulls" },
  { acronym: "LIN", name: "Arvid Lindblad",          team: "Racing Bulls" },
  { acronym: "HUL", name: "Nico Hülkenberg",        team: "Audi" },
  { acronym: "BOR", name: "Gabriel Bortoleto",       team: "Audi" },
  { acronym: "OCO", name: "Esteban Ocon",            team: "Haas F1 Team" },
  { acronym: "BEA", name: "Oliver Bearman",          team: "Haas F1 Team" },
  { acronym: "PER", name: "Sergio Pérez",            team: "Cadillac" },
  { acronym: "BOT", name: "Valtteri Bottas",         team: "Cadillac" },
];

/* ── 2026 calendar (matches calendar.js) ─────────────────────────────── */
const RACES_2026 = [
  { round: 1,  flag: "images/flags/australia.jpg",   name: "Australian Grand Prix",    location: "Melbourne",         start: "2026-03-06", end: "2026-03-08", hasSprint: false },
  { round: 2,  flag: "images/flags/china.png",        name: "Chinese Grand Prix",       location: "Shanghai",          start: "2026-03-13", end: "2026-03-15", hasSprint: true  },
  { round: 3,  flag: "images/flags/japan.png",        name: "Japanese Grand Prix",      location: "Suzuka",            start: "2026-03-27", end: "2026-03-29", hasSprint: false },
  { round: 4,  flag: "images/flags/bahrain.jpg",      name: "Bahrain Grand Prix",       location: "Sakhir",            start: "2026-04-10", end: "2026-04-12", hasSprint: false },
  { round: 5,  flag: "images/flags/saudi-arabia.png", name: "Saudi Arabian Grand Prix", location: "Jeddah",            start: "2026-04-17", end: "2026-04-19", hasSprint: false },
  { round: 6,  flag: "images/flags/USA.png",          name: "Miami Grand Prix",         location: "Miami",             start: "2026-05-01", end: "2026-05-03", hasSprint: true  },
  { round: 7,  flag: "images/flags/canada.png",       name: "Canadian Grand Prix",      location: "Montréal",          start: "2026-05-22", end: "2026-05-24", hasSprint: true  },
  { round: 8,  flag: "images/flags/monaco.png",       name: "Monaco Grand Prix",        location: "Monte Carlo",       start: "2026-06-05", end: "2026-06-07", hasSprint: false },
  { round: 9,  flag: "images/flags/spain.png",        name: "Spanish Grand Prix",       location: "Barcelona",         start: "2026-06-12", end: "2026-06-14", hasSprint: false },
  { round: 10, flag: "images/flags/austria.jpg",      name: "Austrian Grand Prix",      location: "Spielberg",         start: "2026-06-26", end: "2026-06-28", hasSprint: false },
  { round: 11, flag: "images/flags/UK.png",           name: "British Grand Prix",       location: "Silverstone",       start: "2026-07-03", end: "2026-07-05", hasSprint: true  },
  { round: 12, flag: "images/flags/belgium.jpg",      name: "Belgian Grand Prix",       location: "Spa-Francorchamps", start: "2026-07-17", end: "2026-07-19", hasSprint: false },
  { round: 13, flag: "images/flags/hungary.png",      name: "Hungarian Grand Prix",     location: "Budapest",          start: "2026-07-24", end: "2026-07-26", hasSprint: false },
  { round: 14, flag: "images/flags/netherlands.png",  name: "Dutch Grand Prix",         location: "Zandvoort",         start: "2026-08-21", end: "2026-08-23", hasSprint: true  },
  { round: 15, flag: "images/flags/italy.png",        name: "Italian Grand Prix",       location: "Monza",             start: "2026-09-04", end: "2026-09-06", hasSprint: false },
  { round: 16, flag: "images/flags/spain.png",        name: "Spanish Grand Prix",       location: "Madrid",            start: "2026-09-11", end: "2026-09-13", hasSprint: false },
  { round: 17, flag: "images/flags/azerbaijan.jpg",   name: "Azerbaijan Grand Prix",    location: "Baku",              start: "2026-09-24", end: "2026-09-26", hasSprint: false },
  { round: 18, flag: "images/flags/singapore.png",    name: "Singapore Grand Prix",     location: "Marina Bay",        start: "2026-10-09", end: "2026-10-11", hasSprint: true  },
  { round: 19, flag: "images/flags/USA.png",          name: "United States Grand Prix", location: "Austin",            start: "2026-10-23", end: "2026-10-25", hasSprint: false },
  { round: 20, flag: "images/flags/mexico.png",       name: "Mexico City Grand Prix",   location: "Mexico City",       start: "2026-10-30", end: "2026-11-01", hasSprint: false },
  { round: 21, flag: "images/flags/brazil.png",       name: "São Paulo Grand Prix",     location: "São Paulo",         start: "2026-11-06", end: "2026-11-08", hasSprint: false },
  { round: 22, flag: "images/flags/USA.png",          name: "Las Vegas Grand Prix",     location: "Las Vegas",         start: "2026-11-19", end: "2026-11-21", hasSprint: false },
  { round: 23, flag: "images/flags/qatar.png",        name: "Qatar Grand Prix",         location: "Lusail",            start: "2026-11-27", end: "2026-11-29", hasSprint: false },
  { round: 24, flag: "images/flags/uae.png",          name: "Abu Dhabi Grand Prix",     location: "Yas Marina",        start: "2026-12-04", end: "2026-12-06", hasSprint: false },
];

/* ── Scoring (mirrors worker.js) ─────────────────────────────────────── */
function computeScore(pred, result) {
  let total = 0;
  const breakdown = { pole: 0, podium_p1: 0, podium_p2: 0, podium_p3: 0, sprint: 0, best_tr: 0, sc_count: 0, retirements: 0 };

  if (pred.pole && result.pole && pred.pole === result.pole) { total += 10; breakdown.pole = 10; }

  const rPod = [result.podium_p1, result.podium_p2, result.podium_p3];
  const pPod = [pred.podium_p1,   pred.podium_p2,   pred.podium_p3];
  const fullPts = [25, 18, 15];
  for (let i = 0; i < 3; i++) {
    const k = `podium_p${i + 1}`;
    if (!pPod[i] || !rPod[i]) continue;
    if (pPod[i] === rPod[i])           { total += fullPts[i]; breakdown[k] = fullPts[i]; }
    else if (rPod.includes(pPod[i]))   { total += 10;         breakdown[k] = 10; }
  }

  if (pred.sprint_win && result.sprint_win && pred.sprint_win === result.sprint_win) { total += 8; breakdown.sprint = 8; }
  if (pred.best_tr && result.best_tr && pred.best_tr === result.best_tr)              { total += 10; breakdown.best_tr = 10; }
  if (pred.sc_count && result.sc_count && pred.sc_count === result.sc_count)          { total += 10; breakdown.sc_count = 10; }

  if (pred.retirements != null && result.retirements != null) {
    const diff = Math.abs(parseInt(pred.retirements) - parseInt(result.retirements));
    if (diff === 0)      { total += 10; breakdown.retirements = 10; }
    else if (diff === 1) { total += 5;  breakdown.retirements = 5; }
  }

  return { total, breakdown };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
function fmtDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function driverOptions(selectedAcronym = "") {
  return DRIVERS_2026.map(d =>
    `<option value="${d.acronym}" ${d.acronym === selectedAcronym ? "selected" : ""}>${d.name} (${d.acronym})</option>`
  ).join("");
}

function populateDriverSelects(pred = null) {
  for (const id of ["pole", "podium_p1", "podium_p2", "podium_p3", "sprint_win"]) {
    const el = document.getElementById(id);
    if (!el) continue;
    const current = el.querySelector("option:first-child").outerHTML;
    el.innerHTML = current + driverOptions(pred?.[id === "sprint_win" ? "sprint_win" : id] || "");
  }
}

/* ── Badge coloring after results ────────────────────────────────────── */
function applyBadge(badgeEl, pts, maxPts, label) {
  if (!badgeEl) return;
  badgeEl.style.display = "flex";
  let cls = "badge--wrong";
  let icon = "✗";
  if (pts === maxPts)    { cls = "badge--correct"; icon = "✓"; }
  else if (pts > 0)      { cls = "badge--partial";  icon = "~"; }
  badgeEl.className = `pred-result-badge ${cls}`;
  badgeEl.innerHTML = `<span class="badge-icon">${icon}</span><span class="badge-pts">${pts > 0 ? "+" + pts : "0"} pts</span><span class="badge-label">${label}</span>`;
}

function showResults(pred, result) {
  const { total, breakdown } = computeScore(pred, result);

  // Pole
  applyBadge(document.getElementById("badge-pole"), breakdown.pole, 10, result.pole || "—");

  // Podium
  const rPod = [result.podium_p1, result.podium_p2, result.podium_p3];
  const pPod = [pred.podium_p1,   pred.podium_p2,   pred.podium_p3];
  const fullPts = [25, 18, 15];
  ["badge-p1", "badge-p2", "badge-p3"].forEach((badgeId, i) => {
    const actual = rPod[i] || "TBD";
    applyBadge(document.getElementById(badgeId), breakdown[`podium_p${i + 1}`], fullPts[i], actual);
  });

  // Sprint
  if (result.sprint_win) {
    applyBadge(document.getElementById("badge-sprint"), breakdown.sprint, 8, result.sprint_win);
  }

  // Best of rest
  applyBadge(document.getElementById("badge-best-tr"), breakdown.best_tr, 10, result.best_tr || "—");

  // SC/RF
  applyBadge(document.getElementById("badge-sc"), breakdown.sc_count, 10, `Actual: ${result.sc_count}`);

  // Retirements
  applyBadge(document.getElementById("badge-retired"), breakdown.retirements, 10, `Actual: ${result.retirements}`);

  // Score card
  const scoreCard = document.getElementById("score-card");
  const possibleMax = 10 + 25 + 18 + 15 + (result.sprint_win ? 8 : 0) + 10 + 10 + 10;
  document.getElementById("score-total").textContent = `${total} / ${possibleMax} pts`;
  scoreCard.style.display = "block";

  const bkMap = {
    pole:        { label: "Pole",       pts: breakdown.pole,        max: 10 },
    podium_p1:   { label: "P1",         pts: breakdown.podium_p1,   max: 25 },
    podium_p2:   { label: "P2",         pts: breakdown.podium_p2,   max: 18 },
    podium_p3:   { label: "P3",         pts: breakdown.podium_p3,   max: 15 },
    ...(result.sprint_win ? { sprint: { label: "Sprint", pts: breakdown.sprint, max: 8 } } : {}),
    best_tr:     { label: "Best Team",  pts: breakdown.best_tr,     max: 10 },
    sc_count:    { label: "SC/RF",      pts: breakdown.sc_count,    max: 10 },
    retirements: { label: "Retired",    pts: breakdown.retirements, max: 10 },
  };
  document.getElementById("score-breakdown").innerHTML = Object.values(bkMap).map(b => {
    const cls = b.pts === b.max ? "sb-correct" : b.pts > 0 ? "sb-partial" : "sb-wrong";
    return `<div class="score-row ${cls}"><span>${b.label}</span><span>${b.pts}/${b.max}</span></div>`;
  }).join("");
}

/* ── Main ─────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  AUTH.requireAuth();
  const user = AUTH.getCurrentUser();

  document.getElementById("logout-btn").addEventListener("click", () => AUTH.logout());

  // Parse round from URL
  const params = new URLSearchParams(window.location.search);
  const round  = parseInt(params.get("round"));
  if (!round) { document.body.innerHTML = "<p style='padding:2rem;color:#888;'>No round specified.</p>"; return; }

  const race = RACES_2026.find(r => r.round === round);
  if (!race) { document.body.innerHTML = "<p style='padding:2rem;color:#888;'>Unknown round.</p>"; return; }

  // Update page title
  document.title = `R${round} ${race.name} – F1 Predictor`;

  // Render hero
  document.getElementById("race-hero").innerHTML = `
    <div class="predict-hero-inner">
      <img class="predict-hero-flag" src="${race.flag}" alt="${race.name} flag" />
      <div class="predict-hero-info">
        <div class="predict-hero-round">Round ${round}</div>
        <div class="predict-hero-name">${race.name}</div>
        <div class="predict-hero-loc">${race.location} &bull; ${fmtDate(race.start)} – ${fmtDate(race.end)}</div>
        ${race.hasSprint ? '<span class="sprint-tag">Sprint Weekend</span>' : ""}
      </div>
    </div>
  `;

  // Determine state
  const today       = new Date(); today.setHours(0, 0, 0, 0);
  const raceEnd     = new Date(race.end   + "T00:00:00");
  const raceStart   = new Date(race.start + "T00:00:00");
  const isPast           = raceEnd < today;
  const isWeekendStarted = today > raceStart;  // Saturday or later = locked

  // Find the next upcoming race (first whose end date >= today)
  const nextRace     = RACES_2026.find(r => new Date(r.end + "T00:00:00") >= today);
  const isNotYetOpen = nextRace && race.round > nextRace.round;

  const isLocked = isPast || isWeekendStarted || isNotYetOpen;

  // Show sprint section if applicable
  if (race.hasSprint) document.getElementById("sprint-section").style.display = "block";

  // Populate driver dropdowns
  populateDriverSelects();

  // Lock form
  if (isPast) {
    const banner = document.getElementById("pred-banner");
    banner.style.display = "block";
    banner.className = "pred-banner pred-banner--locked";
    banner.textContent = "This race weekend has ended. Your prediction is locked.";
    document.getElementById("submit-btn").disabled = true;
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("fetch-row").style.display = "flex";
  } else if (isWeekendStarted) {
    const banner = document.getElementById("pred-banner");
    banner.style.display = "block";
    banner.className = "pred-banner pred-banner--locked";
    banner.textContent = `The ${race.name} weekend is underway. Predictions are locked.`;
    document.getElementById("submit-btn").disabled = true;
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("predict-form").querySelectorAll("select, input").forEach(el => el.disabled = true);
  } else if (isNotYetOpen) {
    const banner = document.getElementById("pred-banner");
    banner.style.display = "block";
    banner.className = "pred-banner pred-banner--info";
    banner.textContent = `Predictions for this race open once the ${nextRace.name} weekend is over.`;
    document.getElementById("submit-btn").disabled = true;
    document.getElementById("submit-btn").style.display = "none";
    // Disable all form inputs
    document.getElementById("predict-form").querySelectorAll("select, input").forEach(el => el.disabled = true);
  }

  // Load existing prediction
  let pred = null;
  try {
    const r    = await fetch(`${API}/predict?username=${encodeURIComponent(user.username)}&round=${round}`);
    const data = await r.json();
    if (data.ok && data.prediction) {
      pred = data.prediction;
      populateDriverSelects(pred);
      // Fill radios
      const scRadio = document.querySelector(`input[name="sc_count"][value="${pred.sc_count}"]`);
      if (scRadio) scRadio.checked = true;
      // Fill retirements
      const retEl = document.getElementById("retirements");
      if (retEl && pred.retirements != null) retEl.value = String(pred.retirements);
      // Fill best_tr
      const btrEl = document.getElementById("best_tr");
      if (btrEl && pred.best_tr) btrEl.value = pred.best_tr;
      // Note
      if (!isLocked) {
        document.getElementById("saved-note").textContent = `Last saved ${new Date(pred.submitted_at).toLocaleString("en-GB")}`;
      }
    }
  } catch (err) {
    console.warn("Could not load prediction:", err);
  }

  // Load results
  let result = null;
  try {
    const r    = await fetch(`${API}/results?round=${round}`);
    const data = await r.json();
    if (data.ok && data.results) {
      result = data.results;
    }
  } catch (err) {
    console.warn("Could not load results:", err);
  }

  // Show results overlay if available and prediction exists
  if (result && pred) {
    showResults(pred, result);
  } else if (result && !pred && isLocked) {
    const banner = document.getElementById("pred-banner");
    banner.style.display = "block";
    banner.className = "pred-banner pred-banner--info";
    banner.textContent = "Results are in — you didn't submit a prediction for this race.";
  }

  // If past and results already fetched, don't show the fetch button again
  if (result && isPast) {
    const fetchNote = document.getElementById("fetch-note");
    if (fetchNote) fetchNote.textContent = `Results fetched ${new Date(result.fetched_at).toLocaleString("en-GB")}`;
  }

  /* ── Form submission ── */
  document.getElementById("predict-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const form     = e.target;
    const podium   = [form.podium_p1.value, form.podium_p2.value, form.podium_p3.value];
    const errorBanner = document.getElementById("pred-banner");

    // Validate required fields
    if (!form.podium_p1.value || !form.podium_p2.value || !form.podium_p3.value) {
      errorBanner.style.display = "block";
      errorBanner.className = "pred-banner pred-banner--error";
      errorBanner.textContent = "Please select all three podium drivers.";
      return;
    }
    if (new Set(podium).size !== 3) {
      errorBanner.style.display = "block";
      errorBanner.className = "pred-banner pred-banner--error";
      errorBanner.textContent = "P1, P2 and P3 must be different drivers.";
      return;
    }
    if (!form.best_tr.value) {
      errorBanner.style.display = "block";
      errorBanner.className = "pred-banner pred-banner--error";
      errorBanner.textContent = "Please select a Best-of-the-Rest team.";
      return;
    }
    const scVal = form.sc_count.value;
    if (!scVal) {
      errorBanner.style.display = "block";
      errorBanner.className = "pred-banner pred-banner--error";
      errorBanner.textContent = "Please select a safety car / red flag count.";
      return;
    }
    if (form.retirements.value === "") {
      errorBanner.style.display = "block";
      errorBanner.className = "pred-banner pred-banner--error";
      errorBanner.textContent = "Please select a number of retirements.";
      return;
    }

    errorBanner.style.display = "none";
    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Saving…";

    const payload = {
      username:     user.username,
      round,
      pole:         form.pole.value,
      podium_p1:    form.podium_p1.value,
      podium_p2:    form.podium_p2.value,
      podium_p3:    form.podium_p3.value,
      sprint_win:   race.hasSprint ? (form.sprint_win?.value || null) : null,
      best_tr:      form.best_tr.value,
      sc_count:     scVal,
      retirements:  parseInt(form.retirements.value) || 0,
    };

    try {
      const res  = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        document.getElementById("saved-note").textContent = `Saved at ${new Date().toLocaleTimeString("en-GB")}`;
        btn.textContent = "Save Prediction";
        btn.disabled = false;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      errorBanner.style.display = "block";
      errorBanner.className = "pred-banner pred-banner--error";
      errorBanner.textContent = "Save failed: " + err.message;
      btn.textContent = "Save Prediction";
      btn.disabled = false;
    }
  });

  /* ── Fetch results from OpenF1 ── */
  document.getElementById("fetch-btn")?.addEventListener("click", async () => {
    const btn  = document.getElementById("fetch-btn");
    const note = document.getElementById("fetch-note");
    btn.disabled = true;
    btn.textContent = "Fetching from OpenF1…";
    note.textContent = "";

    try {
      const res  = await fetch(`${API}/fetch-results?round=${round}`);
      const data = await res.json();

      if (data.ok) {
        note.textContent = "✓ Results saved.";
        result = data.result;
        if (pred) showResults(pred, result);
        else {
          note.textContent = "✓ Results fetched — you didn't predict this race.";
        }
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      note.textContent = "Error: " + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "🔄 Fetch Official Results from OpenF1";
    }
  });
});
