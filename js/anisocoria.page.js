// js/anisocoria.page.js
import { sessionStore } from "./common.js";
import { initSidebar } from "./sidebar.js";

const $ = (id) => document.getElementById(id);

function toNumOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function formatMm(x) {
  if (x === null) return "—";
  return `${x.toFixed(1)} mm`;
}

function syncFromSession(session) {
  // triage
  $("acuteOnset").checked = !!session.triage.acuteOnset;
  $("painful").checked = !!session.triage.painful;
  $("neuroSx").checked = !!session.triage.neuroSx;
  $("trauma").checked = !!session.triage.trauma;

  // pupils
  $("odLight").value = session.pupils.odLight ?? "";
  $("osLight").value = session.pupils.osLight ?? "";
  $("odDark").value  = session.pupils.odDark ?? "";
  $("osDark").value  = session.pupils.osDark ?? "";

  $("odLightRxn").value = session.pupils.odLightRxn || "";
  $("osLightRxn").value = session.pupils.osLightRxn || "";

  $("dilationLag").checked = !!session.pupils.dilationLag;
  $("anhidrosis").checked = !!session.pupils.anhidrosis;
  $("lightNearDissociation").checked = !!session.pupils.lightNearDissociation;
  $("vermiform").checked = !!session.pupils.vermiform;
  $("anticholinergicExposure").checked = !!session.pupils.anticholinergicExposure;
  $("sympathomimeticExposure").checked = !!session.pupils.sympathomimeticExposure;

  // local metrics display
  const odL = toNumOrNull(session.pupils.odLight);
  const osL = toNumOrNull(session.pupils.osLight);
  const odD = toNumOrNull(session.pupils.odDark);
  const osD = toNumOrNull(session.pupils.osDark);

  const anisL = (odL !== null && osL !== null) ? Math.abs(odL - osL) : null;
  const anisD = (odD !== null && osD !== null) ? Math.abs(odD - osD) : null;

  $("anisLight").textContent = formatMm(anisL);
  $("anisDark").textContent  = formatMm(anisD);
}

function bind() {
  // triage checkboxes
  $("acuteOnset").addEventListener("change", e => sessionStore.set("triage.acuteOnset", e.target.checked));
  $("painful").addEventListener("change", e => sessionStore.set("triage.painful", e.target.checked));
  $("neuroSx").addEventListener("change", e => sessionStore.set("triage.neuroSx", e.target.checked));
  $("trauma").addEventListener("change", e => sessionStore.set("triage.trauma", e.target.checked));

  // pupil numbers
  $("odLight").addEventListener("input", e => sessionStore.set("pupils.odLight", toNumOrNull(e.target.value)));
  $("osLight").addEventListener("input", e => sessionStore.set("pupils.osLight", toNumOrNull(e.target.value)));
  $("odDark").addEventListener("input",  e => sessionStore.set("pupils.odDark",  toNumOrNull(e.target.value)));
  $("osDark").addEventListener("input",  e => sessionStore.set("pupils.osDark",  toNumOrNull(e.target.value)));

  // reactivity
  $("odLightRxn").addEventListener("change", e => sessionStore.set("pupils.odLightRxn", e.target.value));
  $("osLightRxn").addEventListener("change", e => sessionStore.set("pupils.osLightRxn", e.target.value));

  // signs/exposure
  $("dilationLag").addEventListener("change", e => sessionStore.set("pupils.dilationLag", e.target.checked));
  $("anhidrosis").addEventListener("change", e => sessionStore.set("pupils.anhidrosis", e.target.checked));
  $("lightNearDissociation").addEventListener("change", e => sessionStore.set("pupils.lightNearDissociation", e.target.checked));
  $("vermiform").addEventListener("change", e => sessionStore.set("pupils.vermiform", e.target.checked));
  $("anticholinergicExposure").addEventListener("change", e => sessionStore.set("pupils.anticholinergicExposure", e.target.checked));
  $("sympathomimeticExposure").addEventListener("change", e => sessionStore.set("pupils.sympathomimeticExposure", e.target.checked));
}

function init() {
  initSidebar("./anisocoria.html");
  bind();

  // initial sync + keep page inputs in sync if another tab changes session
  syncFromSession(sessionStore.getSession());
  sessionStore.subscribe((s) => syncFromSession(s));
}

init();
