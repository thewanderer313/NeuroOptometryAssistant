// js/nystagmus.page.js
import { sessionStore } from "./common.js";
import { initSidebar } from "./sidebar.js";
import { compute } from "./engine.js";

const $ = (id) => document.getElementById(id);

// Clinical guidance hint functions
function nystagmusLocalizationHint(f, n) {
  // Downbeat nystagmus
  if (f.nystagmus_downbeat) {
    return "Downbeat nystagmus in primary gaze: localizes to craniocervical junction. Consider Chiari malformation, MS, spinocerebellar degeneration, or drug toxicity.";
  }

  // Upbeat nystagmus
  if (f.nystagmus_upbeat) {
    return "Upbeat nystagmus in primary gaze: localizes to pontomedullary junction or anterior vermis. Consider stroke, MS, Wernicke encephalopathy.";
  }

  // Convergence-retraction
  if (f.nystagmus_convergenceRetraction) {
    return "Convergence-retraction nystagmus: pathognomonic for dorsal midbrain (Parinaud syndrome). Look for upgaze palsy, light-near dissociation.";
  }

  // Seesaw
  if (f.nystagmus_seesaw) {
    return "Seesaw nystagmus: one eye rises/intorts while other falls/extorts. Classic for parasellar lesions compressing chiasm.";
  }

  // Periodic alternating
  if (f.nystagmus_periodicAlternating) {
    return "Periodic alternating nystagmus (PAN): direction reverses every 2-4 minutes. Cerebellar nodulus/uvula lesion. Consider baclofen treatment.";
  }

  // Dissociated/INO pattern
  if (f.nystagmus_dissociated && f.adductionDeficit === true) {
    return "Dissociated nystagmus with adduction deficit: INO pattern. Lesion in MLF. Young = MS, Older = stroke.";
  }

  // Vestibular patterns
  if (f.nystagmus_positional && f.nystagmus_vertigo) {
    return "Positional nystagmus with vertigo: BPPV pattern. Perform Dix-Hallpike maneuver to confirm and identify affected canal.";
  }

  if (f.nystagmus_directionChanging && f.nystagmus_gazeEvoked) {
    return "Direction-changing gaze-evoked nystagmus: suggests central pathology (cerebellar) or drug effect. Check medication levels.";
  }

  // Pure gaze-evoked
  if (f.nystagmus_gazeEvoked && !f.nystagmus_primaryPosition) {
    return "Gaze-evoked nystagmus only: common with sedatives, anticonvulsants, alcohol. If medication-free, consider cerebellar pathology.";
  }

  // Vertical without specific pattern
  if (f.nystagmus_waveform === "vertical") {
    return "Vertical nystagmus: central localization (brainstem/cerebellum). Peripheral vestibular rarely produces pure vertical.";
  }

  // Pendular pattern
  if (f.nystagmus_type === "pendular") {
    return "Pendular nystagmus: equal velocity in both directions. Consider congenital/infantile nystagmus or acquired (MS, stroke).";
  }

  // General nystagmus present
  if (f.nystagmus_present) {
    return "Nystagmus documented. Characterize type, direction, and gaze dependency for localization.";
  }

  return "Enter nystagmus findings to generate localization guidance.";
}

function nystagmusNextStepHint(f, n) {
  // Critical urgency patterns
  if (f.nystagmus_downbeat && f.acute) {
    return "URGENT: Acute downbeat nystagmus - MRI craniocervical junction stat. Consider stroke, demyelination.";
  }

  if (f.nystagmus_upbeat && f.acute) {
    return "URGENT: Acute upbeat nystagmus - MRI brainstem stat. Give thiamine empirically if Wernicke suspected.";
  }

  if (f.nystagmus_convergenceRetraction) {
    return "MRI midbrain/pineal region to evaluate for dorsal midbrain lesion (pinealoma, tectal glioma, hydrocephalus).";
  }

  if (f.nystagmus_seesaw) {
    return "MRI sella/parasellar region with contrast. Check visual fields and pituitary function.";
  }

  // Vestibular workup
  if (f.nystagmus_positional) {
    return "Perform Dix-Hallpike maneuver (posterior canal) and supine roll test (horizontal canal) to confirm BPPV.";
  }

  if (f.nystagmus_vertigo && f.nystagmus_present) {
    return "HINTS exam: Head Impulse Test, Nystagmus pattern, Test of Skew. Differentiates peripheral vs central.";
  }

  // INO workup
  if (f.nystagmus_dissociated) {
    return "Test convergence (preserved in INO). MRI brain with attention to MLF in brainstem.";
  }

  // Drug-induced
  if (f.nystagmus_gazeEvoked && !f.nystagmus_primaryPosition) {
    return "Check medication levels (phenytoin, carbamazepine, lithium). Review recent medication changes.";
  }

  // General acquired nystagmus
  if (f.nystagmus_present && !f.nystagmus_latent) {
    return "Frenzel goggles exam to characterize nystagmus and assess fixation suppression.";
  }

  return "Complete nystagmus assessment to refine diagnostic guidance.";
}

function gazePatternInterpretation(n) {
  const patterns = [];

  if (n.primaryPosition && n.gazeEvoked) {
    patterns.push("Primary + gaze-evoked: suggests central pathology or significant peripheral lesion");
  } else if (n.primaryPosition) {
    patterns.push("Primary position only: often central (brainstem/cerebellum) or acute peripheral vestibular");
  } else if (n.gazeEvoked) {
    patterns.push("Gaze-evoked only: common with medications, cerebellar disease, or fatigue");
  }

  if (n.downbeatPrimary) {
    patterns.push("Downbeat in primary: craniocervical junction lesion (Chiari, MS, drugs)");
  }

  if (n.upbeatPrimary) {
    patterns.push("Upbeat in primary: pontomedullary junction, anterior vermis, or drugs");
  }

  if (n.convergenceRetraction) {
    patterns.push("Convergence-retraction: dorsal midbrain (Parinaud syndrome)");
  }

  if (n.seesaw) {
    patterns.push("Seesaw: parasellar lesion affecting chiasm");
  }

  if (n.periodicAlternating) {
    patterns.push("PAN: cerebellar nodulus/uvula, may respond to baclofen");
  }

  if (n.dissociated) {
    patterns.push("Dissociated: asymmetric between eyes, consider INO or MG");
  }

  if (n.latent) {
    patterns.push("Latent: appears with monocular viewing, suggests congenital/infantile pattern");
  }

  if (n.directionChanging) {
    patterns.push("Direction-changing: central pattern if in primary; expected if gaze-evoked");
  }

  return patterns.length > 0 ? patterns.join(". ") : "Select gaze patterns to see clinical significance";
}

function associatedSignsInterpretation(n) {
  const findings = [];

  if (n.oscillopsia && n.present) {
    findings.push("Oscillopsia: acquired nystagmus (congenital patients adapt and don't experience oscillopsia)");
  }

  if (n.vertigo) {
    findings.push("Vertigo present: suggests vestibular involvement (peripheral or central)");
  }

  if (n.headShaking || n.headTilt) {
    findings.push("Compensatory head movement: suggests null point, often congenital or long-standing");
  }

  if (n.positional) {
    findings.push("Position-dependent: BPPV pattern, perform Dix-Hallpike");
  }

  if (n.spontaneous && !n.positional) {
    findings.push("Spontaneous without position change: acute vestibular syndrome or central lesion");
  }

  return findings.length > 0 ? findings.join(". ") : "Enter associated signs for clinical interpretation";
}

// Preset functions
function applyPreset(presetType) {
  switch (presetType) {
    case "downbeat":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "vertical");
      sessionStore.set("nystagmus.fastPhase", "down");
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.downbeatPrimary", true);
      sessionStore.set("nystagmus.oscillopsia", true);
      break;

    case "upbeat":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "vertical");
      sessionStore.set("nystagmus.fastPhase", "up");
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.upbeatPrimary", true);
      sessionStore.set("nystagmus.oscillopsia", true);
      sessionStore.set("triage.acuteOnset", true);
      break;

    case "parinaud":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "mixed");
      sessionStore.set("nystagmus.convergenceRetraction", true);
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("eom.verticalLimitation", true);
      sessionStore.set("pupils.lightNearDissociation", true);
      sessionStore.set("triage.neuroSx", true);
      break;

    case "seesaw":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "pendular");
      sessionStore.set("nystagmus.waveform", "mixed");
      sessionStore.set("nystagmus.seesaw", true);
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("visualFields.bitemporal", true);
      break;

    case "bppv":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "mixed"); // torsional-vertical
      sessionStore.set("nystagmus.positional", true);
      sessionStore.set("nystagmus.vertigo", true);
      sessionStore.set("nystagmus.amplitude", "medium");
      break;

    case "vestibularNeuritis":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "horizontal");
      sessionStore.set("nystagmus.fastPhase", "right"); // away from lesion
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.spontaneous", true);
      sessionStore.set("nystagmus.vertigo", true);
      sessionStore.set("nystagmus.oscillopsia", true);
      sessionStore.set("triage.acuteOnset", true);
      break;

    case "centralVestibular":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "vertical");
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.directionChanging", true);
      sessionStore.set("nystagmus.gazeEvoked", true);
      sessionStore.set("triage.neuroSx", true);
      sessionStore.set("triage.acuteOnset", true);
      break;

    case "pan":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "horizontal");
      sessionStore.set("nystagmus.periodicAlternating", true);
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.directionChanging", true);
      break;

    case "ino":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "horizontal");
      sessionStore.set("nystagmus.dissociated", true);
      sessionStore.set("eom.adductionDeficit", true);
      sessionStore.set("eom.diplopia", true);
      sessionStore.set("triage.neuroSx", true);
      break;

    case "gazeEvoked":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "jerk");
      sessionStore.set("nystagmus.waveform", "horizontal");
      sessionStore.set("nystagmus.gazeEvoked", true);
      sessionStore.set("nystagmus.gazeEvokedDirection", "all");
      sessionStore.set("nystagmus.directionChanging", true);
      sessionStore.set("nystagmus.amplitude", "fine");
      break;

    case "congenital":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "pendular");
      sessionStore.set("nystagmus.waveform", "horizontal");
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.latent", true);
      sessionStore.set("nystagmus.headTilt", true);
      // No oscillopsia in congenital
      sessionStore.set("nystagmus.oscillopsia", false);
      break;

    case "opsoclonus":
      sessionStore.set("nystagmus.present", true);
      sessionStore.set("nystagmus.type", "mixed");
      sessionStore.set("nystagmus.waveform", "mixed");
      sessionStore.set("nystagmus.primaryPosition", true);
      sessionStore.set("nystagmus.oscillopsia", true);
      sessionStore.set("triage.acuteOnset", true);
      sessionStore.set("triage.neuroSx", true);
      break;
  }
}

// Update visual diagram based on nystagmus characteristics
function updateNystagmusDiagram(session) {
  const n = session.nystagmus || {};
  const leftEye = $("nystagmusEyeLeft");
  const rightEye = $("nystagmusEyeRight");
  const directionArrow = $("directionArrow");
  const directionLabel = $("directionLabel");

  // Safety check - exit if elements don't exist
  if (!leftEye || !rightEye || !directionArrow || !directionLabel) {
    return;
  }

  // Get iris elements (children of the eye elements)
  const leftIris = leftEye.querySelector(".nystagmus-iris");
  const rightIris = rightEye.querySelector(".nystagmus-iris");

  if (!leftIris || !rightIris) {
    return;
  }

  // Reset animations - remove all nys-* and amp-*/freq-* classes
  leftIris.className = "nystagmus-iris";
  rightIris.className = "nystagmus-iris";

  // Apply amplitude class if set
  if (n.amplitude) {
    leftIris.classList.add(`amp-${n.amplitude}`);
    rightIris.classList.add(`amp-${n.amplitude}`);
  }

  // Apply frequency class if set
  if (n.frequency) {
    leftIris.classList.add(`freq-${n.frequency}`);
    rightIris.classList.add(`freq-${n.frequency}`);
  }

  if (!n.present) {
    directionArrow.textContent = "—";
    directionLabel.textContent = "No nystagmus";
    return;
  }

  // Determine animation class
  let animClass = "";
  let arrowChar = "→";
  let labelText = "";

  if (n.type === "jerk") {
    // For jerk nystagmus, prioritize fast phase direction to determine animation
    // Fast phase direction determines the axis of movement
    if (n.fastPhase === "right") {
      animClass = "nys-jerk-right";
      arrowChar = "→";
      labelText = "Jerk right-beating";
    } else if (n.fastPhase === "left") {
      animClass = "nys-jerk-left";
      arrowChar = "←";
      labelText = "Jerk left-beating";
    } else if (n.fastPhase === "up" || n.upbeatPrimary) {
      animClass = "nys-jerk-up";
      arrowChar = "↑";
      labelText = "Upbeat nystagmus";
    } else if (n.fastPhase === "down" || n.downbeatPrimary) {
      animClass = "nys-jerk-down";
      arrowChar = "↓";
      labelText = "Downbeat nystagmus";
    } else if (n.fastPhase === "clockwise" || n.fastPhase === "counterclockwise" || n.waveform === "torsional") {
      animClass = "nys-torsional";
      arrowChar = n.fastPhase === "counterclockwise" ? "↺" : "↻";
      labelText = "Torsional nystagmus";
    } else if (n.waveform === "horizontal") {
      // Fallback: waveform specified but no direction - default horizontal jerk
      animClass = "nys-jerk-right";
      arrowChar = "↔";
      labelText = "Horizontal jerk";
    } else if (n.waveform === "vertical") {
      // Fallback: waveform specified but no direction - default vertical jerk
      animClass = "nys-jerk-down";
      arrowChar = "↕";
      labelText = "Vertical jerk";
    } else if (n.waveform === "mixed") {
      animClass = "nys-mixed";
      arrowChar = "✦";
      labelText = "Mixed jerk";
    } else {
      // Just "jerk" selected with nothing else - show generic horizontal
      animClass = "nys-jerk-right";
      arrowChar = "~";
      labelText = "Jerk (select direction)";
    }
  } else if (n.type === "pendular") {
    if (n.waveform === "horizontal") {
      animClass = "nys-pendular-h";
      arrowChar = "↔";
      labelText = "Pendular horizontal";
    } else if (n.waveform === "vertical") {
      animClass = "nys-pendular-v";
      arrowChar = "↕";
      labelText = "Pendular vertical";
    } else if (n.waveform === "torsional") {
      animClass = "nys-torsional";
      arrowChar = "↻";
      labelText = "Pendular torsional";
    } else {
      // Default pendular
      animClass = "nys-pendular-h";
      arrowChar = "◇";
      labelText = "Pendular";
    }
  } else if (n.type === "mixed") {
    animClass = "nys-mixed";
    arrowChar = "✦";
    labelText = "Mixed/Chaotic";
  } else if (!n.type) {
    // Default animation when nystagmus is present but type not yet selected
    animClass = "nys-pendular-h";
    arrowChar = "~";
    labelText = "Select type & direction";
  }

  // Special patterns override
  if (n.seesaw) {
    animClass = "nys-seesaw";
    arrowChar = "⤮";
    labelText = "Seesaw nystagmus";
  }
  if (n.convergenceRetraction) {
    animClass = "nys-convergence";
    arrowChar = "⟷";
    labelText = "Convergence-retraction";
  }
  if (n.dissociated) {
    leftIris.classList.add("nys-dissociated-left");
    rightIris.classList.add("nys-dissociated-right");
    arrowChar = "≠";
    labelText = "Dissociated (INO)";
  } else if (animClass) {
    leftIris.classList.add(animClass);
    rightIris.classList.add(animClass);
  }

  directionArrow.textContent = arrowChar;
  directionLabel.textContent = labelText;
}

// Helper to safely set checked property
function setChecked(id, value) {
  const el = $(id);
  if (el) el.checked = !!value;
}

// Helper to safely set value property
function setValue(id, value) {
  const el = $(id);
  if (el) el.value = value || "";
}

function syncFromSession(session) {
  const n = session.nystagmus || {};
  const t = session.triage || {};

  // Triage
  setChecked("acuteOnset", t.acuteOnset);
  setChecked("painful", t.painful);
  setChecked("neuroSx", t.neuroSx);
  setChecked("trauma", t.trauma);

  // Nystagmus characteristics
  setChecked("nystagmusPresent", n.present);
  setValue("nystagmusType", n.type);
  setValue("nystagmusWaveform", n.waveform);
  setValue("fastPhase", n.fastPhase);

  // Amplitude
  document.querySelectorAll('input[name="amplitude"]').forEach(el => {
    el.checked = el.value === n.amplitude;
  });

  // Frequency
  document.querySelectorAll('input[name="frequency"]').forEach(el => {
    el.checked = el.value === n.frequency;
  });

  // Gaze patterns
  setChecked("primaryPosition", n.primaryPosition);
  setChecked("gazeEvoked", n.gazeEvoked);
  setValue("gazeEvokedDirection", n.gazeEvokedDirection);
  setChecked("downbeatPrimary", n.downbeatPrimary);
  setChecked("upbeatPrimary", n.upbeatPrimary);

  // Special patterns
  setChecked("convergenceRetraction", n.convergenceRetraction);
  setChecked("seesaw", n.seesaw);
  setChecked("periodicAlternating", n.periodicAlternating);
  setChecked("dissociated", n.dissociated);
  setChecked("latent", n.latent);
  setChecked("directionChanging", n.directionChanging);

  // Associated signs
  setChecked("oscillopsia", n.oscillopsia);
  setChecked("vertigo", n.vertigo);
  setChecked("headShaking", n.headShaking);
  setChecked("headTilt", n.headTilt);
  setChecked("positional", n.positional);
  setChecked("spontaneous", n.spontaneous);

  // Notes
  setValue("nystagmusNotes", n.notes);

  // Show/hide gaze evoked direction based on checkbox
  const gazeEvokedGroup = $("gazeEvokedDirectionGroup");
  if (gazeEvokedGroup) {
    gazeEvokedGroup.style.display = n.gazeEvoked ? "block" : "none";
  }

  // Update visual diagram
  updateNystagmusDiagram(session);

  // Update clinical guidance hints
  const out = compute(session);
  const f = out.features;

  const locEl = $("nysLocalize");
  const nextEl = $("nysNext");
  const gazeEl = $("gazeInterpretation");
  const assocEl = $("associatedInterpretation");

  if (locEl) locEl.textContent = nystagmusLocalizationHint(f, n);
  if (nextEl) nextEl.textContent = nystagmusNextStepHint(f, n);
  if (gazeEl) gazeEl.textContent = gazePatternInterpretation(n);
  if (assocEl) assocEl.textContent = associatedSignsInterpretation(n);

  // Update sidebar summary
  const sbType = $("sbNysType");
  const sbWaveform = $("sbNysWaveform");
  const sbDirection = $("sbNysDirection");

  if (sbType) sbType.textContent = n.present ? (n.type || "Present") : "—";
  if (sbWaveform) sbWaveform.textContent = n.waveform || "—";
  if (sbDirection) sbDirection.textContent = n.fastPhase || "—";
}

// Tab switching
function initTabs() {
  const tabs = document.querySelectorAll(".page-tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = `tab-${tab.dataset.tab}`;

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      contents.forEach(c => {
        c.classList.toggle("active", c.id === targetId);
      });
    });
  });
}

// Helper to safely add event listener
function on(id, event, handler) {
  const el = $(id);
  if (el) el.addEventListener(event, handler);
}

function bind() {
  initTabs();

  // Triage
  on("acuteOnset", "change", e => sessionStore.set("triage.acuteOnset", e.target.checked));
  on("painful", "change", e => sessionStore.set("triage.painful", e.target.checked));
  on("neuroSx", "change", e => sessionStore.set("triage.neuroSx", e.target.checked));
  on("trauma", "change", e => sessionStore.set("triage.trauma", e.target.checked));

  // Nystagmus present
  on("nystagmusPresent", "change", e => sessionStore.set("nystagmus.present", e.target.checked));

  // Characteristics
  on("nystagmusType", "change", e => sessionStore.set("nystagmus.type", e.target.value));
  on("nystagmusWaveform", "change", e => sessionStore.set("nystagmus.waveform", e.target.value));
  on("fastPhase", "change", e => sessionStore.set("nystagmus.fastPhase", e.target.value));

  // Amplitude
  document.querySelectorAll('input[name="amplitude"]').forEach(el => {
    el.addEventListener("change", e => {
      if (e.target.checked) {
        sessionStore.set("nystagmus.amplitude", e.target.value);
      }
    });
  });

  // Frequency
  document.querySelectorAll('input[name="frequency"]').forEach(el => {
    el.addEventListener("change", e => {
      if (e.target.checked) {
        sessionStore.set("nystagmus.frequency", e.target.value);
      }
    });
  });

  // Gaze patterns
  on("primaryPosition", "change", e => sessionStore.set("nystagmus.primaryPosition", e.target.checked));
  on("gazeEvoked", "change", e => {
    sessionStore.set("nystagmus.gazeEvoked", e.target.checked);
    const group = $("gazeEvokedDirectionGroup");
    if (group) group.style.display = e.target.checked ? "block" : "none";
  });
  on("gazeEvokedDirection", "change", e => sessionStore.set("nystagmus.gazeEvokedDirection", e.target.value));
  on("downbeatPrimary", "change", e => sessionStore.set("nystagmus.downbeatPrimary", e.target.checked));
  on("upbeatPrimary", "change", e => sessionStore.set("nystagmus.upbeatPrimary", e.target.checked));

  // Special patterns
  on("convergenceRetraction", "change", e => sessionStore.set("nystagmus.convergenceRetraction", e.target.checked));
  on("seesaw", "change", e => sessionStore.set("nystagmus.seesaw", e.target.checked));
  on("periodicAlternating", "change", e => sessionStore.set("nystagmus.periodicAlternating", e.target.checked));
  on("dissociated", "change", e => sessionStore.set("nystagmus.dissociated", e.target.checked));
  on("latent", "change", e => sessionStore.set("nystagmus.latent", e.target.checked));
  on("directionChanging", "change", e => sessionStore.set("nystagmus.directionChanging", e.target.checked));

  // Associated signs
  on("oscillopsia", "change", e => sessionStore.set("nystagmus.oscillopsia", e.target.checked));
  on("vertigo", "change", e => sessionStore.set("nystagmus.vertigo", e.target.checked));
  on("headShaking", "change", e => sessionStore.set("nystagmus.headShaking", e.target.checked));
  on("headTilt", "change", e => sessionStore.set("nystagmus.headTilt", e.target.checked));
  on("positional", "change", e => sessionStore.set("nystagmus.positional", e.target.checked));
  on("spontaneous", "change", e => sessionStore.set("nystagmus.spontaneous", e.target.checked));

  // Notes
  on("nystagmusNotes", "input", e => sessionStore.set("nystagmus.notes", e.target.value));

  // Presets
  on("presetDownbeat", "click", () => applyPreset("downbeat"));
  on("presetUpbeat", "click", () => applyPreset("upbeat"));
  on("presetParinaud", "click", () => applyPreset("parinaud"));
  on("presetSeesaw", "click", () => applyPreset("seesaw"));
  on("presetBPPV", "click", () => applyPreset("bppv"));
  on("presetVestibularNeuritis", "click", () => applyPreset("vestibularNeuritis"));
  on("presetCentralVestibular", "click", () => applyPreset("centralVestibular"));
  on("presetPAN", "click", () => applyPreset("pan"));
  on("presetINO", "click", () => applyPreset("ino"));
  on("presetGazeEvoked", "click", () => applyPreset("gazeEvoked"));
  on("presetCongenital", "click", () => applyPreset("congenital"));
  on("presetOpsoclonus", "click", () => applyPreset("opsoclonus"));
}

function init() {
  initSidebar("./nystagmus.html");
  bind();
  syncFromSession(sessionStore.getSession());
  sessionStore.subscribe((s) => syncFromSession(s));
}

init();
