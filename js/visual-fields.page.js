// js/visual-fields.page.js
import { sessionStore } from "./common.js";
import { initSidebar } from "./sidebar.js";
import { compute } from "./engine.js";

const $ = (id) => document.getElementById(id);

function boolOrNullFromSelect(v) {
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
}

function syncFromSession(session) {
    const vf = session.visualFields;

    $("vfTestType").value = vf.testType || "";
    $("vfReliability").value = vf.reliability || "";
    $("vfNewDefect").checked = !!vf.newDefect;
    $("vfSymptoms").checked = !!vf.complaint;

    $("vfLaterality").value = vf.laterality || "";
    $("vfVertical").value = vf.respectsVerticalMeridian === true ? "true" : (vf.respectsVerticalMeridian === false ? "false" : "");
    $("vfHorizontal").value = vf.respectsHorizontalMeridian === true ? "true" : (vf.respectsHorizontalMeridian === false ? "false" : "");

    $("vfHomonymous").checked = !!vf.homonymous;
    $("vfBitemporal").checked = !!vf.bitemporal;
    $("vfAltitudinal").checked = !!vf.altitudinal;
    $("vfCentralScotoma").checked = !!vf.centralScotoma;

    $("vfCongruity").value = vf.congruity || "";
    $("vfNotes").value = vf.notes || "";

    // Local helper text driven by the shared engine
    const out = compute(session);
    const f = out.features;

    $("vfLocalize").textContent = localizeHint(f);
    $("vfQuality").textContent = qualityHint(vf);
    $("vfNext").textContent = nextDiscriminatorHint(f);
}

function localizeHint(f) {
    if (f.vf_bitemporal) return "Bitemporal → chiasmal process rises (confirm pattern + correlate with optic nerve/RAPD, symptoms).";
    if (f.vf_homonymous && f.vf_respects_vertical) {
        if (f.vf_congruity === "high") return "Highly congruous homonymous → occipital lobe more likely (vs tract/radiations).";
        if (f.vf_congruity === "low") return "Low congruity homonymous → optic tract/radiations rise (combine with neuro signs).";
        return "Homonymous + vertical meridian → retrochiasmal pathway rises.";
    }
    if (f.vf_altitudinal && f.vf_respects_horizontal) return "Altitudinal + horizontal meridian → optic nerve/anterior ischemic pattern rises.";
    if (f.vf_central_scotoma) return "Central scotoma → macula/optic nerve (optic neuritis/toxic/nutritional) rises.";
    if (f.vf_respects_vertical) return "Vertical meridian respect → chiasmal/retrochiasmal localization rises.";
    return "Add pattern flags (vertical/homonymous/bitemporal/altitudinal/central) to generate stronger localization.";
}

function qualityHint(vf) {
    if (vf.reliability === "poor") return "Poor reliability: re-test / confirm with repeat strategy before hard localization.";
    if (vf.reliability === "borderline") return "Borderline reliability: interpret with caution; correlate with structure and symptoms.";
    if (vf.reliability === "good") return "Good reliability: pattern-based localization is more trustworthy.";
    return "Set reliability to guide how strongly the engine weighs VF features.";
}

function nextDiscriminatorHint(f) {
    if (f.vf_bitemporal) return "Check for optic disc pallor, color desaturation, and consider endocrine/sellar symptoms if present.";
    if (f.vf_homonymous) return "Ask timing/vascular risk, neuro symptoms; assess congruity and look for macular sparing clues.";
    if (f.vf_altitudinal) return "Correlate with optic disc edema/pallor and acuity/color; consider arteritic vs non-arteritic context.";
    if (f.vf_central_scotoma) return "Correlate with acuity/color desaturation, RAPD, pain on eye movement, and OCT RNFL/GCC if available.";
    return "Toggle one hallmark feature (homonymous/bitemporal/altitudinal/central scotoma) to refine the differential.";
}

function bind() {
    $("vfTestType").addEventListener("change", e => sessionStore.set("visualFields.testType", e.target.value));
    $("vfReliability").addEventListener("change", e => sessionStore.set("visualFields.reliability", e.target.value));
    $("vfNewDefect").addEventListener("change", e => sessionStore.set("visualFields.newDefect", e.target.checked));
    $("vfSymptoms").addEventListener("change", e => sessionStore.set("visualFields.complaint", e.target.checked));

    $("vfLaterality").addEventListener("change", e => sessionStore.set("visualFields.laterality", e.target.value));

    $("vfVertical").addEventListener("change", e => sessionStore.set("visualFields.respectsVerticalMeridian", boolOrNullFromSelect(e.target.value)));
    $("vfHorizontal").addEventListener("change", e => sessionStore.set("visualFields.respectsHorizontalMeridian", boolOrNullFromSelect(e.target.value)));

    $("vfHomonymous").addEventListener("change", e => sessionStore.set("visualFields.homonymous", e.target.checked));
    $("vfBitemporal").addEventListener("change", e => sessionStore.set("visualFields.bitemporal", e.target.checked));
    $("vfAltitudinal").addEventListener("change", e => sessionStore.set("visualFields.altitudinal", e.target.checked));
    $("vfCentralScotoma").addEventListener("change", e => sessionStore.set("visualFields.centralScotoma", e.target.checked));

    $("vfCongruity").addEventListener("change", e => sessionStore.set("visualFields.congruity", e.target.value));
    $("vfNotes").addEventListener("input", e => sessionStore.set("visualFields.notes", e.target.value));
}

function init() {
    initSidebar("./visual-fields.html");
    bind();
    syncFromSession(sessionStore.getSession());
    sessionStore.subscribe((s) => syncFromSession(s));
}

init();
