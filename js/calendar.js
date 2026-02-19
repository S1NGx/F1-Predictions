/**
 * calendar.js – Full 2026 season calendar page.
 * Renders all 24 rounds in a responsive grid, highlighting past / next / future.
 */

/* ── Race data (single source of truth, shared with app.js) ───────────── */
const RACES_2026 = [
  { round: 1,  flag: "🇦🇺", name: "Australian Grand Prix",    location: "Melbourne",         circuit: "Albert Park",         track: "2026trackmelbourneblackoutline.svg",        start: "2026-03-06", end: "2026-03-08"  },
  { round: 2,  flag: "🇨🇳", name: "Chinese Grand Prix",       location: "Shanghai",          circuit: "Shanghai Int'l",      track: "2026trackshanghaiblackoutline.svg",         start: "2026-03-13", end: "2026-03-15"  },
  { round: 3,  flag: "🇯🇵", name: "Japanese Grand Prix",      location: "Suzuka",            circuit: "Suzuka Circuit",      track: "2026tracksuzukablackoutline.svg",           start: "2026-03-27", end: "2026-03-29"  },
  { round: 4,  flag: "🇧🇭", name: "Bahrain Grand Prix",       location: "Sakhir",            circuit: "Bahrain Int'l",       track: "2026tracksakhirblackoutline.svg",           start: "2026-04-10", end: "2026-04-12"  },
  { round: 5,  flag: "🇸🇦", name: "Saudi Arabian Grand Prix", location: "Jeddah",            circuit: "Jeddah Corniche",     track: "2026trackjeddahblackoutline.svg",           start: "2026-04-17", end: "2026-04-19"  },
  { round: 6,  flag: "🇺🇸", name: "Miami Grand Prix",         location: "Miami",             circuit: "Miami Int'l",         track: "2026trackmiamiblackoutline.svg",            start: "2026-05-01", end: "2026-05-03"  },
  { round: 7,  flag: "🇨🇦", name: "Canadian Grand Prix",      location: "Montréal",          circuit: "Circuit Gilles V.",   track: "2026trackmontrealblackoutline.svg",         start: "2026-05-22", end: "2026-05-24"  },
  { round: 8,  flag: "🇲🇨", name: "Monaco Grand Prix",        location: "Monte Carlo",       circuit: "Circuit de Monaco",   track: "2026trackmontecarloblackoutline.svg",       start: "2026-06-05", end: "2026-06-07"  },
  { round: 9,  flag: "🇪🇸", name: "Spanish Grand Prix",       location: "Barcelona",         circuit: "Circuit de Catalunya",track: "2026trackcatalunyablackoutline.svg",        start: "2026-06-12", end: "2026-06-14"  },
  { round: 10, flag: "🇦🇹", name: "Austrian Grand Prix",      location: "Spielberg",         circuit: "Red Bull Ring",       track: "2026trackspielbergblackoutline.svg",        start: "2026-06-26", end: "2026-06-28"  },
  { round: 11, flag: "🇬🇧", name: "British Grand Prix",       location: "Silverstone",       circuit: "Silverstone Circuit", track: "2026tracksilverstoneblackoutline.svg",      start: "2026-07-03", end: "2026-07-05"  },
  { round: 12, flag: "🇧🇪", name: "Belgian Grand Prix",       location: "Spa-Francorchamps", circuit: "Circuit de Spa",      track: "2026trackspafrancorchampsblackoutline.svg", start: "2026-07-17", end: "2026-07-19"  },
  { round: 13, flag: "🇭🇺", name: "Hungarian Grand Prix",     location: "Budapest",          circuit: "Hungaroring",         track: "2026trackhungaroringblackoutline.svg",      start: "2026-07-24", end: "2026-07-26"  },
  { round: 14, flag: "🇳🇱", name: "Dutch Grand Prix",         location: "Zandvoort",         circuit: "Circuit Zandvoort",   track: "2026trackzandvoortblackoutline.svg",        start: "2026-08-21", end: "2026-08-23"  },
  { round: 15, flag: "🇮🇹", name: "Italian Grand Prix",       location: "Monza",             circuit: "Autodromo Monza",     track: "2026trackmonzablackoutline.svg",            start: "2026-09-04", end: "2026-09-06"  },
  { round: 16, flag: "🇪🇸", name: "Spanish Grand Prix",       location: "Madrid",            circuit: "Madrid Street Circuit",track: "2026trackmadringblackoutline.svg",          start: "2026-09-11", end: "2026-09-13"  },
  { round: 17, flag: "🇦🇿", name: "Azerbaijan Grand Prix",    location: "Baku",              circuit: "Baku City Circuit",   track: "2026trackbakublackoutline.svg",             start: "2026-09-24", end: "2026-09-26"  },
  { round: 18, flag: "🇸🇬", name: "Singapore Grand Prix",     location: "Marina Bay",        circuit: "Marina Bay Street",   track: "2026tracksingaporeblackoutline.svg",        start: "2026-10-09", end: "2026-10-11"  },
  { round: 19, flag: "🇺🇸", name: "United States Grand Prix", location: "Austin",            circuit: "Circuit of Americas",  track: "2026trackaustinblackoutline.svg",           start: "2026-10-23", end: "2026-10-25"  },
  { round: 20, flag: "🇲🇽", name: "Mexico City Grand Prix",   location: "Mexico City",       circuit: "Autodromo Hermanos",  track: "2026trackmexicocityblackoutline.svg",       start: "2026-10-30", end: "2026-11-01"  },
  { round: 21, flag: "🇧🇷", name: "São Paulo Grand Prix",     location: "São Paulo",         circuit: "Autodromo Interlagos",track: "2026trackinterlagosblackoutline.svg",       start: "2026-11-06", end: "2026-11-08"  },
  { round: 22, flag: "🇺🇸", name: "Las Vegas Grand Prix",     location: "Las Vegas",         circuit: "Las Vegas Strip",     track: "2026tracklasvegasblackoutline.svg",         start: "2026-11-19", end: "2026-11-21"  },
  { round: 23, flag: "🇶🇦", name: "Qatar Grand Prix",         location: "Lusail",            circuit: "Lusail Int'l",        track: "2026tracklusailblackoutline.svg",           start: "2026-11-27", end: "2026-11-29"  },
  { round: 24, flag: "🇦🇪", name: "Abu Dhabi Grand Prix",     location: "Yas Marina",        circuit: "Yas Marina Circuit",  track: "2026trackyasmarinacircuitblackoutline.svg", start: "2026-12-04", end: "2026-12-06"  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmtDateRange(start, end) {
  const s   = new Date(start + "T00:00:00");
  const e   = new Date(end   + "T00:00:00");
  const mon = e.toLocaleString("en-GB", { month: "short" });
  return `${s.getDate()}–${e.getDate()} ${mon} ${e.getFullYear()}`;
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const diff   = target - Date.now();
  return Math.ceil(diff / 86400000);
}

/* ── Render ──────────────────────────────────────────────────────────── */
function renderRaceGrid() {
  const grid     = document.getElementById("race-grid");
  const subtitle = document.getElementById("cal-subtitle");
  if (!grid) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find next race index
  let nextIdx = -1;
  for (let i = 0; i < RACES_2026.length; i++) {
    if (new Date(RACES_2026[i].end + "T00:00:00") >= today) { nextIdx = i; break; }
  }

  const nextRace     = nextIdx >= 0 ? RACES_2026[nextIdx] : null;
  const racesLeft    = RACES_2026.length - nextIdx;
  const racesDone    = nextIdx;

  if (subtitle) {
    if (nextRace) {
      const d = daysUntil(nextRace.start);
      subtitle.textContent = d > 0
        ? `${racesDone} races completed · ${racesLeft} remaining · Next race in ${d} day${d !== 1 ? "s" : ""}`
        : `${racesDone} races completed · Race weekend underway!`;
    } else {
      subtitle.textContent = "2026 season complete. 24 races.";
    }
  }

  grid.innerHTML = RACES_2026.map((r, i) => {
    const raceEnd = new Date(r.end + "T00:00:00");
    const isPast  = raceEnd < today;
    const isNext  = i === nextIdx;

    let stateClass = "race-card--future";
    if (isPast)      stateClass = "race-card--past";
    else if (isNext) stateClass = "race-card--next";

    let badge = "";
    if (isNext) badge = `<span class="rc-badge">Next Race</span>`;
    else if (isPast) badge = `<span class="rc-badge rc-badge--done">Done</span>`;

    const d = !isPast && !isNext ? daysUntil(r.start) : null;
    const daysTag = d !== null ? `<div class="rc-days">${d}d away</div>` : "";

    return `
      <div class="race-card ${stateClass}">
        <div class="rc-header">
          <span class="rc-round">R${r.round}</span>
          ${badge}
          ${daysTag}
        </div>
        <div class="rc-body">
          <div class="rc-left">
            <div class="rc-flag">${r.flag}</div>
            <div class="rc-name">${r.name}</div>
            <div class="rc-circuit">${r.circuit}</div>
            <div class="rc-location">${r.location}</div>
            <div class="rc-dates">${fmtDateRange(r.start, r.end)}</div>
          </div>
          <div class="rc-track-wrap">
            <img class="rc-track-img" src="images/tracks/${r.track}" alt="${r.circuit} track layout" />
          </div>
        </div>
      </div>`;
  }).join("");

  // Scroll next race card into view
  if (nextIdx >= 0) {
    setTimeout(() => {
      const cards = grid.querySelectorAll(".race-card");
      cards[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }
}

/* ── Boot ────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  AUTH.requireAuth();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => AUTH.logout());

  renderRaceGrid();
});
