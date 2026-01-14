// js/eom.page.js
import { sessionStore } from "./common.js";
import { initSidebar } from "./sidebar.js";

const $ = (id) => document.getElementById(id);

function boolOrNullFromSelect(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function syncFromSession(session) {
  $("diplopia").checked = !!session.eom.diplopia;
  $("ptosis").checked = !!session.eom.ptosis;

  $("abductionDeficit").checked = session.eom.abductionDeficit === true;
  $("adductionDeficit").checked = session.eom.adductionDeficit === true;
  $("verticalLimitation").checked = session.eom.verticalLimitation === true;

  $("comitant").value =
    session.eom.comitant === true ? "true" :
    session.eom.comitant === false ? "false" : "";

  $("eomNotes").value = session.eom.notes || "";
}

function bind() {
  $("diplopia").addEventListener("change", e => sessionStore.set("eom.diplopia", e.target.checked));
  $("ptosis").addEventListener("change", e => sessionStore.set("eom.ptosis", e.target.checked));

  $("abductionDeficit").addEventListener("change", e => sessionStore.set("eom.abductionDeficit", e.target.checked ? true : null));
  $("adductionDeficit").addEventListener("change", e => sessionStore.set("eom.adductionDeficit", e.target.checked ? true : null));
  $("verticalLimitation").addEventListener("change", e => sessionStore.set("eom.verticalLimitation", e.target.checked ? true : null));

  $("comitant").addEventListener("change", e => sessionStore.set("eom.comitant", boolOrNullFromSelect(e.target.value)));
  $("eomNotes").addEventListener("input", e => sessionStore.set("eom.notes", e.target.value));
}

function init() {
  initSidebar("./eom.html");
  bind();
  syncFromSession(sessionStore.getSession());
  sessionStore.subscribe((s) => syncFromSession(s));
}

init();
