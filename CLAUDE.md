# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neuro-Ophtho Assistant is a local, offline clinical decision support tool for neuro-ophthalmology. It helps clinicians evaluate anisocoria, extraocular motility deficits, and visual field patterns through a shared session that persists findings across modules.

## Running Locally

Start a local server from the project root:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000/index.html`

No build step, bundler, or dependencies—just static HTML/CSS/JS with ES modules.

## Architecture

### Shared Session Model
All modules share a single clinical session stored in `localStorage` (key: `neuro_ophtho_session_v1`). The session contains:
- `meta`: patient label, timestamps
- `triage`: acute onset, pain, neuro symptoms, trauma flags
- `pupils`: OD/OS measurements in light/dark, reactions, signs (dilation lag, anhidrosis, etc.)
- `eom`: diplopia, ptosis, motility deficits, comitance
- `visualFields`: test type, reliability, pattern features (homonymous, bitemporal, altitudinal, etc.)

### Core Files
- **js/common.js**: `SessionStore` class with pub/sub pattern, manages localStorage read/write and emits `session:changed` events
- **js/engine.js**: `deriveFeatures()` extracts clinical features from session; `scoreDifferential()` scores diagnoses based on feature weights; `compute()` orchestrates both and returns differential + urgency banner
- **js/sidebar.js**: Renders the persistent sidebar (session info, urgency callout, top differentials) shared across all pages

### Page Modules
Each HTML page has a corresponding `*.page.js` file that:
1. Calls `initSidebar()` to set up the sidebar
2. Binds form inputs to `sessionStore.set()` calls
3. Subscribes to session changes to keep UI in sync across tabs

### Differential Scoring Logic (engine.js)
The engine uses a weighted scoring system:
- **Anisocoria threshold**: 0.5mm (`CONFIG.ANISO_THRESHOLD_MM`)
- **Dominance pattern**: "light" (large pupil abnormal) vs "dark" (small pupil abnormal) drives differential weighting
- **Diagnoses scored**: Physiologic anisocoria, Horner syndrome, Compressive CN3 palsy, Adie/tonic pupil, Pharmacologic mydriasis, CN VI palsy, plus VF-based patterns (chiasmal, retrochiasmal, optic nerve, central scotoma)
- Pupil-based differentials require both light AND dark measurements before appearing

### Urgency Levels
The engine sets urgency banners based on pattern + context:
- `danger`: Large pupil pattern + acute/pain/neuro + ptosis/diplopia
- `warn`: Small pupil pattern + acute/pain/neuro + sympathetic signs
- `info`: Bitemporal VF pattern or general acute flags
- `none`: Default/awaiting data
