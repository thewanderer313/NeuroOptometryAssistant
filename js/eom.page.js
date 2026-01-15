// js/eom.page.js
import { sessionStore } from "./common.js";
import { initSidebar } from "./sidebar.js";
import { compute } from "./engine.js";

const $ = (id) => document.getElementById(id);

function boolOrNullFromSelect(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

// Track gaze grid deficits (not persisted, just visual)
const gazeDeficits = new Set();

// Clinical guidance hint functions
function eomLocalizationHint(f, e) {
  // Check for CN III pattern
  if (f.dominance === "light" && f.ptosis) {
    if (f.adductionDeficit || f.verticalLimitation) {
      return "Large pupil + ptosis + adduction/vertical deficit: CN III palsy pattern. Rule out compressive lesion (aneurysm).";
    }
    return "Large pupil + ptosis: partial CN III involvement possible. Assess all extraocular movements.";
  }

  // INO pattern
  if (f.adductionDeficit && !f.ptosis && f.dominance !== "light") {
    return "Adduction deficit without ptosis/pupil involvement: consider INO. Test convergence (typically preserved in INO).";
  }

  // CN VI pattern
  if (f.abductionDeficit && f.diplopia) {
    if (f.comitant === false) {
      return "Abduction deficit + diplopia + incomitant: CN VI palsy rises. Consider skull base, cavernous sinus, or microvascular.";
    }
    return "Abduction deficit + diplopia: CN VI palsy pattern. Quantify with prism cover testing.";
  }

  // CN IV pattern
  if (f.verticalLimitation && !f.ptosis && !f.abductionDeficit && !f.adductionDeficit) {
    return "Isolated vertical limitation (especially with head tilt compensation): consider CN IV palsy. Check for hypertropia worse in contralateral gaze.";
  }

  // MG pattern
  if (f.fatigable) {
    return "Fatigable weakness: myasthenia gravis rises. Assess sustained upgaze, ice pack test, check anti-AChR antibodies.";
  }

  // Ptosis without pupil
  if (f.ptosis && f.dominance !== "light") {
    if (f.diplopia) {
      return "Ptosis + diplopia without pupil involvement: consider myasthenia gravis, partial CN III, or levator dehiscence.";
    }
    return "Isolated ptosis: consider MG, Horner (check pupil in dark), levator dehiscence, or mechanical ptosis.";
  }

  // Pain on movement
  if (f.painOnMovement) {
    return "Pain on eye movement: consider orbital inflammation, thyroid eye disease (active), or optic neuritis.";
  }

  // General diplopia
  if (f.diplopia) {
    if (f.comitant === true) {
      return "Comitant deviation + diplopia: less likely cranial nerve palsy. Consider decompensated phoria or thyroid eye disease.";
    }
    return "Diplopia present. Determine which movements are limited to localize the cranial nerve(s) involved.";
  }

  return "Enter EOM findings to generate localization guidance.";
}

function eomQualityHint(e) {
  const hasDeficit = e.abductionDeficit || e.adductionDeficit || e.verticalLimitation;
  const hasComitance = e.comitant !== null && e.comitant !== undefined;

  if (!e.diplopia && !e.ptosis && !hasDeficit && !e.fatigable && !e.painOnMovement) {
    return "No EOM symptoms or signs entered yet.";
  }
  if (e.diplopia && !hasDeficit) {
    return "Diplopia reported but no motility deficits marked. Perform cover testing and ductions in all gazes.";
  }
  if (hasDeficit && !hasComitance) {
    return "Motility deficit marked. Assess comitance (same deviation in all gazes vs worse in certain directions).";
  }
  if (e.fatigable && !e.ptosis && !e.diplopia) {
    return "Fatigable marked but no specific symptoms. Specify what is fatigable (ptosis, diplopia, or both).";
  }
  return "EOM data entered. Consider quantifying deviation with prism and alternating cover test.";
}

function eomNextDiscriminatorHint(f, e) {
  // Urgent CN III
  if (f.dominance === "light" && f.ptosis && (f.acute || f.painful)) {
    return "Acute painful CN III with pupil: aneurysm until proven otherwise. Strongly consider emergent CTA/MRA.";
  }

  // MG screening
  if (f.fatigable) {
    return "Fatigable weakness: perform sustained upgaze test (1-2 min), ice pack test, check anti-AChR/anti-MuSK antibodies.";
  }

  if (f.ptosis && f.diplopia && !f.dominance) {
    return "Ptosis + diplopia without pupil involvement: assess for fatigue, ice pack test, or anti-AChR antibodies for MG.";
  }

  // INO workup
  if (f.adductionDeficit && !f.ptosis) {
    return "Adduction deficit: test convergence. If preserved, suggests INO. MRI brain with attention to MLF.";
  }

  // CN VI workup
  if (f.abductionDeficit && f.diplopia) {
    if (f.acute) {
      return "Acute CN VI: if isolated with vascular risk factors, may observe. Otherwise, MRI brain with attention to skull base.";
    }
    return "CN VI palsy: check for papilledema (IIH), history of head trauma, or recent LP.";
  }

  // Pain on movement
  if (f.painOnMovement) {
    return "Pain on eye movement: examine for proptosis, chemosis. Consider MRI orbits, thyroid function tests.";
  }

  // Incomplete exam
  if (f.diplopia && !e.abductionDeficit && !e.adductionDeficit && !e.verticalLimitation) {
    return "Diplopia without specific deficits: perform full motility exam including versions, ductions, and cover testing.";
  }

  if (f.ptosis && !f.diplopia) {
    return "Isolated ptosis: check levator function (MRD1), fatigue with sustained upgaze, and lid crease height.";
  }

  return "Complete EOM assessment and triage flags to refine guidance.";
}

// Quick preset functions
function applyPreset(presetType) {
  switch (presetType) {
    case "cn6":
      // CN VI pattern: abduction deficit with diplopia
      sessionStore.set("eom.diplopia", true);
      sessionStore.set("eom.abductionDeficit", true);
      sessionStore.set("eom.comitant", false);
      break;

    case "cn4":
      // CN IV pattern: vertical limitation
      sessionStore.set("eom.diplopia", true);
      sessionStore.set("eom.verticalLimitation", true);
      sessionStore.set("eom.comitant", false);
      break;

    case "mg":
      // MG pattern: fatigable ptosis/diplopia, pupil-sparing
      sessionStore.set("eom.diplopia", true);
      sessionStore.set("eom.ptosis", true);
      sessionStore.set("eom.fatigable", true);
      break;

    case "ino":
      // INO pattern: adduction deficit without ptosis/pupil
      sessionStore.set("eom.diplopia", true);
      sessionStore.set("eom.adductionDeficit", true);
      sessionStore.set("eom.comitant", false);
      break;
  }
}

// Update gaze grid visual state
function updateGazeGrid(session) {
  const e = session.eom || {};
  const grid = $("eomGrid");
  if (!grid) return;

  // Update grid cells based on deficit flags
  grid.querySelectorAll(".eom-cell[data-gaze]").forEach(cell => {
    const gaze = cell.dataset.gaze;

    // Determine if this cell should be marked as deficit based on summary flags
    let isDeficit = false;

    // Abduction deficits affect left/right
    if (e.abductionDeficit && (gaze === "left" || gaze === "right")) {
      isDeficit = true;
    }
    // Adduction deficits (medial movements - opposite of abduction context)
    // For simplicity, we mark if adductionDeficit is checked
    if (e.adductionDeficit && (gaze === "left" || gaze === "right")) {
      isDeficit = true;
    }
    // Vertical limitations
    if (e.verticalLimitation && (gaze === "up" || gaze === "down" || gaze === "upleft" || gaze === "upright" || gaze === "downleft" || gaze === "downright")) {
      isDeficit = true;
    }

    // Also check manual gaze deficits
    if (gazeDeficits.has(gaze)) {
      isDeficit = true;
    }

    cell.classList.toggle("deficit", isDeficit);
  });
}

function syncFromSession(session) {
  $("diplopia").checked = !!session.eom.diplopia;
  $("ptosis").checked = !!session.eom.ptosis;
  $("fatigable").checked = !!session.eom.fatigable;
  $("painOnMovement").checked = !!session.eom.painOnMovement;

  $("abductionDeficit").checked = session.eom.abductionDeficit === true;
  $("adductionDeficit").checked = session.eom.adductionDeficit === true;
  $("verticalLimitation").checked = session.eom.verticalLimitation === true;

  $("comitant").value =
    session.eom.comitant === true ? "true" :
    session.eom.comitant === false ? "false" : "";

  $("eomNotes").value = session.eom.notes || "";

  // Update clinical guidance hints
  const out = compute(session);
  const f = out.features;
  const e = session.eom || {};

  const locEl = $("eomLocalize");
  const qualEl = $("eomQuality");
  const nextEl = $("eomNext");

  if (locEl) locEl.textContent = eomLocalizationHint(f, e);
  if (qualEl) qualEl.textContent = eomQualityHint(e);
  if (nextEl) nextEl.textContent = eomNextDiscriminatorHint(f, e);

  // Update gaze grid
  updateGazeGrid(session);
}

function bind() {
  $("diplopia").addEventListener("change", e => sessionStore.set("eom.diplopia", e.target.checked));
  $("ptosis").addEventListener("change", e => sessionStore.set("eom.ptosis", e.target.checked));
  $("fatigable").addEventListener("change", e => sessionStore.set("eom.fatigable", e.target.checked));
  $("painOnMovement").addEventListener("change", e => sessionStore.set("eom.painOnMovement", e.target.checked));

  $("abductionDeficit").addEventListener("change", e => sessionStore.set("eom.abductionDeficit", e.target.checked ? true : null));
  $("adductionDeficit").addEventListener("change", e => sessionStore.set("eom.adductionDeficit", e.target.checked ? true : null));
  $("verticalLimitation").addEventListener("change", e => sessionStore.set("eom.verticalLimitation", e.target.checked ? true : null));

  $("comitant").addEventListener("change", e => sessionStore.set("eom.comitant", boolOrNullFromSelect(e.target.value)));
  $("eomNotes").addEventListener("input", e => sessionStore.set("eom.notes", e.target.value));

  // Quick presets
  $("presetCN6").addEventListener("click", () => applyPreset("cn6"));
  $("presetCN4").addEventListener("click", () => applyPreset("cn4"));
  $("presetMG").addEventListener("click", () => applyPreset("mg"));
  $("presetINO").addEventListener("click", () => applyPreset("ino"));

  // Gaze grid click handling
  const grid = $("eomGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".eom-cell[data-gaze]");
      if (!cell) return;

      const gaze = cell.dataset.gaze;

      // Toggle deficit
      if (gazeDeficits.has(gaze)) {
        gazeDeficits.delete(gaze);
      } else {
        gazeDeficits.add(gaze);
      }

      // Auto-set summary flags based on gaze
      if (gaze === "left" || gaze === "right") {
        // Could be abduction or adduction depending on which eye
        // For simplicity, we'll let user choose from checkboxes
      }
      if (gaze.includes("up") || gaze.includes("down")) {
        if (gazeDeficits.has(gaze)) {
          sessionStore.set("eom.verticalLimitation", true);
        }
      }

      updateGazeGrid(sessionStore.getSession());
    });
  }
}

function init() {
  initSidebar("./eom.html");
  bind();
  syncFromSession(sessionStore.getSession());
  sessionStore.subscribe((s) => syncFromSession(s));
}

init();
