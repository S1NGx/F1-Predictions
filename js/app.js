/**
 * app.js – Dashboard / game logic entry point.
 * Runs on dashboard.html after AUTH.requireAuth() passes.
 */

/* ── 2026 F1 Season Calendar ──────────────────────────────────────────────
   raceDate: Sunday (race day) in YYYY-MM-DD – used for past/next detection
   start: Friday of the race weekend
   end:   Sunday of the race weekend
   ─────────────────────────────────────────────────────────────────────── */
const RACES_2026 = [
  { round: 1,  flag: "🇦🇺", name: "Australian Grand Prix",        location: "Melbourne",         start: "2026-03-06", end: "2026-03-08"  },
  { round: 2,  flag: "🇨🇳", name: "Chinese Grand Prix",           location: "Shanghai",          start: "2026-03-13", end: "2026-03-15"  },
  { round: 3,  flag: "🇯🇵", name: "Japanese Grand Prix",          location: "Suzuka",            start: "2026-03-27", end: "2026-03-29"  },
  { round: 4,  flag: "🇧🇭", name: "Bahrain Grand Prix",           location: "Sakhir",            start: "2026-04-10", end: "2026-04-12"  },
  { round: 5,  flag: "🇸🇦", name: "Saudi Arabian Grand Prix",     location: "Jeddah",            start: "2026-04-17", end: "2026-04-19"  },
  { round: 6,  flag: "🇺🇸", name: "Miami Grand Prix",             location: "Miami",             start: "2026-05-01", end: "2026-05-03"  },
  { round: 7,  flag: "🇨🇦", name: "Canadian Grand Prix",          location: "Montréal",          start: "2026-05-22", end: "2026-05-24"  },
  { round: 8,  flag: "🇲🇨", name: "Monaco Grand Prix",            location: "Monte Carlo",       start: "2026-06-05", end: "2026-06-07"  },
  { round: 9,  flag: "🇪🇸", name: "Spanish Grand Prix",           location: "Barcelona",         start: "2026-06-12", end: "2026-06-14"  },
  { round: 10, flag: "🇦🇹", name: "Austrian Grand Prix",          location: "Spielberg",         start: "2026-06-26", end: "2026-06-28"  },
  { round: 11, flag: "🇬🇧", name: "British Grand Prix",           location: "Silverstone",       start: "2026-07-03", end: "2026-07-05"  },
  { round: 12, flag: "🇧🇪", name: "Belgian Grand Prix",           location: "Spa-Francorchamps", start: "2026-07-17", end: "2026-07-19"  },
  { round: 13, flag: "🇭🇺", name: "Hungarian Grand Prix",         location: "Budapest",          start: "2026-07-24", end: "2026-07-26"  },
  { round: 14, flag: "🇳🇱", name: "Dutch Grand Prix",             location: "Zandvoort",         start: "2026-08-21", end: "2026-08-23"  },
  { round: 15, flag: "🇮🇹", name: "Italian Grand Prix",           location: "Monza",             start: "2026-09-04", end: "2026-09-06"  },
  { round: 16, flag: "🇪🇸", name: "Spanish Grand Prix",           location: "Madrid",            start: "2026-09-11", end: "2026-09-13"  },
  { round: 17, flag: "🇦🇿", name: "Azerbaijan Grand Prix",        location: "Baku",              start: "2026-09-24", end: "2026-09-26"  },
  { round: 18, flag: "🇸🇬", name: "Singapore Grand Prix",         location: "Marina Bay",        start: "2026-10-09", end: "2026-10-11"  },
  { round: 19, flag: "🇺🇸", name: "United States Grand Prix",     location: "Austin",            start: "2026-10-23", end: "2026-10-25"  },
  { round: 20, flag: "🇲🇽", name: "Mexico City Grand Prix",       location: "Mexico City",       start: "2026-10-30", end: "2026-11-01"  },
  { round: 21, flag: "🇧🇷", name: "São Paulo Grand Prix",         location: "São Paulo",         start: "2026-11-06", end: "2026-11-08"  },
  { round: 22, flag: "🇺🇸", name: "Las Vegas Grand Prix",         location: "Las Vegas",         start: "2026-11-19", end: "2026-11-21"  },
  { round: 23, flag: "🇶🇦", name: "Qatar Grand Prix",             location: "Lusail",            start: "2026-11-27", end: "2026-11-29"  },
  { round: 24, flag: "🇦🇪", name: "Abu Dhabi Grand Prix",         location: "Yas Marina",        start: "2026-12-04", end: "2026-12-06"  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Format "2026-03-06" → "6 Mar" and "2026-03-08" → "8 Mar 2026" */
function fmtDateRange(start, end) {
  const s   = new Date(start + "T00:00:00");
  const e   = new Date(end   + "T00:00:00");
  const mon = e.toLocaleString("en-GB", { month: "short" });
  const yr  = e.getFullYear();
  return `${s.getDate()}–${e.getDate()} ${mon} ${yr}`;
}

/** Returns {days, hours, minutes, seconds} until targetDate (YYYY-MM-DD race day midnight UTC) */
function countdownTo(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const diff   = target - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600)  / 60),
    seconds: s % 60,
  };
}

/* ── Calendar renderer ───────────────────────────────────────────────── */
function renderCalendar() {
  const calList = document.getElementById("cal-list");
  if (!calList) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find index of the next race (first whose end date >= today)
  let nextIdx = -1;
  for (let i = 0; i < RACES_2026.length; i++) {
    const raceEnd = new Date(RACES_2026[i].end + "T00:00:00");
    if (raceEnd >= today) { nextIdx = i; break; }
  }

  calList.innerHTML = RACES_2026.map((r, i) => {
    const raceEnd   = new Date(r.end + "T00:00:00");
    const isPast    = raceEnd < today;
    const isNext    = i === nextIdx;
    const stateClass = isPast ? "cal-item--past" : isNext ? "cal-item--next" : "cal-item--future";

    return `
      <div class="cal-item ${stateClass}">
        <div class="cal-round">R${r.round}</div>
        <div class="cal-flag">${r.flag}</div>
        <div class="cal-info">
          ${isNext ? '<span class="cal-badge">Next</span>' : ""}
          <span class="cal-name">${r.name}</span>
          <span class="cal-location">${r.location}</span>
        </div>
        <div class="cal-dates">${fmtDateRange(r.start, r.end)}</div>
      </div>`;
  }).join("");

  // Auto-scroll so the next race is visible
  if (nextIdx > 0) {
    const items = calList.querySelectorAll(".cal-item");
    if (items[nextIdx]) {
      // Scroll with a small delay so layout is settled
      setTimeout(() => {
        items[nextIdx].scrollIntoView({ block: "center", behavior: "smooth" });
      }, 120);
    }
  }
}

/* ── Next Race card renderer ─────────────────────────────────────────── */
function renderNextRace() {
  const card = document.getElementById("next-race-card");
  if (!card) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next = RACES_2026.find(r => new Date(r.end + "T00:00:00") >= today);

  const placeholder = document.getElementById("next-race-placeholder");

  if (!next) {
    if (placeholder) placeholder.textContent = "Season complete. See you in 2027! 🏆";
    return;
  }

  // Remove placeholder
  if (placeholder) placeholder.remove();

  // Build countdown
  const cd = countdownTo(next.start);
  let countdownHtml = "";
  if (cd) {
    countdownHtml = `
      <div class="next-race-countdown">
        <div class="countdown-unit"><span class="countdown-num">${cd.days}</span><span class="countdown-label">Days</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(cd.hours).padStart(2,"0")}</span><span class="countdown-label">Hrs</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(cd.minutes).padStart(2,"0")}</span><span class="countdown-label">Min</span></div>
        <div class="countdown-unit"><span class="countdown-num" id="cd-sec">${String(cd.seconds).padStart(2,"0")}</span><span class="countdown-label">Sec</span></div>
      </div>`;
  } else {
    countdownHtml = `<p style="color:var(--red);font-weight:700;margin-top:0.5rem;">Race weekend underway! 🔴</p>`;
  }

  card.insertAdjacentHTML("beforeend", `
    <span class="next-race-flag">${next.flag}</span>
    <div class="next-race-name">${next.name}</div>
    <div class="next-race-dates">${next.location} &bull; ${fmtDateRange(next.start, next.end)}</div>
    ${countdownHtml}
  `);

  // Live-update the seconds counter
  if (cd) {
    setInterval(() => {
      const secEl = document.getElementById("cd-sec");
      if (!secEl) return;
      const c = countdownTo(next.start);
      if (!c) { secEl.closest(".next-race-countdown")?.remove(); return; }
      secEl.textContent = String(c.seconds).padStart(2, "0");
      // update minutes (less frequently but still live)
      const minEl = secEl.closest(".next-race-countdown")?.querySelector(".countdown-unit:nth-child(3) .countdown-num");
      if (minEl) minEl.textContent = String(c.minutes).padStart(2, "0");
    }, 1000);
  }
}

/* ── Boot ────────────────────────────────────────────────────────────── */
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

  // Render calendar & next race
  renderCalendar();
  renderNextRace();
});
