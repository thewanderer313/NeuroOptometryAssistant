// js/sidebar.js
import { sessionStore } from "./common.js";
import { compute, CONFIG } from "./engine.js";

const $ = (id) => document.getElementById(id);

function fmtMm(x) {
  if (x === null || x === undefined) return "—";
  return `${Number(x).toFixed(1)} mm`;
}

function setCallout(level, text) {
  const el = $("sbUrgency");
  el.dataset.level = level;
  el.textContent = text;
}

function renderDx(differential) {
  const wrap = $("sbDx");
  wrap.innerHTML = "";

  if (!differential.length) {
    wrap.innerHTML = `<div class="small">No scored differentials yet. Enter findings in any module.</div>`;
    return;
  }

  differential.slice(0, 5).forEach((d, idx) => {
    const why = (d.why && d.why.length)
      ? `<div class="dxWhy"><ul>${d.why.map(x => `<li>${x}</li>`).join("")}</ul></div>`
      : `<div class="dxWhy">No matched features listed.</div>`;

    const el = document.createElement("div");
    el.className = "dxItem";
    el.innerHTML = `
      <div class="dxTop">
        <div class="dxName">${idx + 1}. ${d.name}</div>
        <div class="dxScore">Score ${d.score}</div>
      </div>
      ${why}
    `;
    wrap.appendChild(el);
  });
}

function renderMeta(session, features) {
  $("sbPatient").textContent = session.meta.activePatientLabel || "Untitled";
  $("sbUpdated").textContent = `Updated: ${new Date(session.meta.updatedAt).toLocaleString()}`;

  $("sbAnisL").textContent = fmtMm(features.anisL);
  $("sbAnisD").textContent = fmtMm(features.anisD);

  const dom =
    features.dominance === "light" ? `Light-dominant (≥${CONFIG.ANISO_THRESHOLD_MM} mm)` :
      features.dominance === "dark" ? `Dark-dominant (≥${CONFIG.ANISO_THRESHOLD_MM} mm)` :
        features.dominance === "equal" ? `Equal in light/dark (≥${CONFIG.ANISO_THRESHOLD_MM} mm)` :
          `Not called (<${CONFIG.ANISO_THRESHOLD_MM} mm or missing)`;

  $("sbPattern").textContent = dom;
}

export function initSidebar(activePageHref) {
  // Mark active nav link
  document.querySelectorAll(".tabbarInner a").forEach(a => {
    if (a.getAttribute("href") === activePageHref) a.classList.add("active");
  });


  // Reset button
  $("sbReset").addEventListener("click", () => sessionStore.reset());

  // Initial render
  const session = sessionStore.getSession();
  const { features, differential, urgency } = compute(session);
  renderMeta(session, features);
  setCallout(urgency.level, urgency.text);
  renderDx(differential);

  // Subscribe to updates from any module
  sessionStore.subscribe((s) => {
    const out = compute(s);
    renderMeta(s, out.features);
    setCallout(out.urgency.level, out.urgency.text);
    renderDx(out.differential);
  });
}
