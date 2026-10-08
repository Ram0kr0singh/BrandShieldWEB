# BrandShield — AEGIS Frontend Port Plan (Phase 0)

## 1. Overview and Intent

This document plans the port of the **AEGIS** visual language onto the complete, current **BrandShield** codebase at HEAD (`4aaa37d`).

- **Visual Identity:** AEGIS (cinematic dark canvas `#060607`, editorial typography with Instrument Serif headers and JetBrains Mono metadata, "The Spine" navigation rail with bone-white halo nodes, "The Observatory" aesthetic, and "The Digital Perimeter" SVG visualization with concentric severity rings).
- **Behaviour, Contracts, and Safety:** BrandShield HEAD (all 8 routes, complete API contracts, deterministic risk authority, legal and safety disclaimer strings, source status registry with simulation controls, batch preset name checking, profile editing, and AI Analyst advisory boundaries).

---

## 2. Feature-Parity & Migration Matrix

| HEAD Route / Component | AEGIS Equivalent (`18fb654` Spec) | Action | Risk & Technical Constraints |
|---|---|---|---|
| **Application Frame (`Shell`)** (`frontend/src/main.tsx:14, 59`) | **The Spine (`AppSidebar`)** (`AEGIS_SPEC.md §11`) | **Rebuild / Re-skin** | Must keep all 8 HEAD routes only (no Settings). Must show active route state (Spine node dot + halo). Responsive at 1024px and 768px. Preserve "BrandShield", "DIGITAL RISK PROTECTION", "Monitoring active" strings. |
| **Route Error Boundary (`ViewErrorBoundary`)** (`frontend/src/main.tsx:57`) | None (Not in AEGIS) | **New design (AEGIS language)** | Style error panel with `--bg-surface`, `--border-default`, and `--accent-critical`. Keep actions: Retry, Reload, Dashboard (`main.tsx:57`). |
| **Security Overview (`OverviewPage`)** (`frontend/src/main.tsx:38-53`) | **Digital Perimeter Briefing (`OverviewPage`)** (`AEGIS_SPEC.md §12`) | **Rebuild / Integrate** | Integrate `PerimeterVisualization` SVG alongside SourceStatus strip, scanline, metrics, severity/type distribution, and recent threats table. Keep brand dropdown and `Scan now` button (`button.primary`). |
| **Digital Perimeter (`PerimeterVisualization`)** | **The Digital Perimeter** (`AEGIS_SPEC.md §17`) | **New build (AEGIS language)** | Concentric rings: Critical (r=75), Suspicious (r=135), Safe (r=185). Radial coords: Left orbit = Social Media, Right orbit = App Store. Deterministic angles from detection ID (no `Math.random`). Reconcile counts with API. Accessibility: `role="img"`, `aria-label`, text table fallback. |
| **Source Status Strip (`SourceStatus`)** (`frontend/src/SourceStatus.tsx:44-209`) | None (Not in AEGIS) | **New design (AEGIS language)** | Re-skin cards with status colors (Online green `#86b8a4`, Degraded amber `#d9ae5f`, Not configured grey `#6b6963`). Selection ring separate cyan/bone-white outline + "Selected" tag. Preserve `.source-card`, `.source-action-btn`, `.source-selected-tag`, etc., for QA script compatibility. |
| **Scan Warning Banner** (`frontend/src/main.tsx:48`) | None (Not in AEGIS) | **New design (AEGIS language)** | Render `.scan-source-warning` with `--accent-suspicious` amber tint, role="status", exact message text. |
| **Source Notices on Pages (`SourceStatusNotice`)** (`frontend/src/SourceStatus.tsx:18-42`, `main.tsx:60-61`) | None (Not in AEGIS) | **New design (AEGIS language)** | Render `.source-page-notice` with `.source-warning` and `.unavailable` styles at top of `/social` and `/apps`. |
| **Social Media Monitoring (`/social`)** (`frontend/src/main.tsx:55, 60`) | Social Monitoring Page (`AEGIS_SPEC.md §14`) | **Re-skin** | Filter candidates by `"Social Media"`. Re-skin table and filters with AEGIS tokens. |
| **App Store Monitoring (`/apps`)** (`frontend/src/main.tsx:55, 61`) | App Monitoring Page (`AEGIS_SPEC.md §15`) | **Re-skin** | Filter candidates by `"App Store"`. Re-skin table and filters. |
| **All Threats (`/threats`)** (`frontend/src/main.tsx:55`) | Threat Surface Table (`AEGIS_SPEC.md §17`) | **Re-skin** | Table with severity, source, status filters. Keep row click to `/threats/:id`. |
| **Look-alike Detection (`/lookalikes`)** (`frontend/src/main.tsx:55`) | Look-alike Detection Page (`AEGIS_SPEC.md §16`) | **Re-skin** | Re-skin lookalike card grid (`.lookgrid`, `.look`). Keep transformation formatters and badges. |
| **Threat Forensic Detail (`/threats/:id`)** (`frontend/src/main.tsx:56`) | Forensic Specimen / Investigation (`AEGIS_SPEC.md §18-20`) | **Re-skin** | Candidate details, evidence list (including `LOGO_SIMILARITY` and non-counted indicators), analyst action (status select, note input, generate draft), activity history, drafts with copy button, AI Analyst section with strict disclaimer. |
| **AI Analyst Advisory Panel** (`frontend/src/main.tsx:56`) | AI Analyst Module (`AEGIS_SPEC.md §20`) | **Re-skin** | Restyle with AEGIS palette. Keep disclaimer string verbatim: *"This explanation does not change the authoritative score, severity, evidence, or investigation decision."* |
| **Brand Profile Editor (`/profile`)** (`frontend/src/BrandProfileEditor.tsx:84-489`) | Brand Profile Page (`AEGIS_SPEC.md §13`) | **New design (AEGIS language)** | AEGIS had only a read-only profile stub. HEAD has a full multi-entity editor: brand details, logo upload, official social accounts, official apps, additional assets, validation messages, and first scan. Re-skin all forms and record lists with AEGIS tokens. |
| **On-Demand Name Check (`/check`)** (`frontend/src/CheckName.tsx:52-261`) | None (Not in AEGIS) | **New design (AEGIS language)** | Batch preset testing (Should flag / Should NOT flag), batch results table with Pass/Fail badges, single check form, Unicode codepoints, transformations, and recent checks list. |

---

## 3. Post-AEGIS Features Requiring New AEGIS-Styled Designs

1. **Brand Profile Editor:** Multi-section forms (`.setup-panel`, `.setup-section`, `.entry-grid`) with dark surfaces (`--bg-surface`), restrained borders (`--border-subtle`), field validation errors (`--accent-critical`), logo upload drop zone, and interactive records (`.setup-record`).
2. **On-Demand Name Check (`/check`):** Preset chip grid (`.preset-grid`, `.preset-toggle`), batch execution table (`.batch-table-wrap`) with sticky header, Pass/Fail telemetry pills, Unicode codepoint inspection (`.codepoint-note`), and recent check buttons.
3. **Source Status Strip & Controls:** Horizontal card strip (`.source-chip-list`) with 4 cards, deterministic color mapping (green/amber/grey), accessible single selection, keyboard triggers (Enter/Space), per-card simulation buttons ("Simulate outage" / "Restore") labeled "demo only".
4. **Scan Banner & Route Warnings:** Amber alert banner for degraded sources with stored observations notice.
5. **Route Error Boundary & Retries:** Bounded card (`.view-error`) with Retry, Reload, and Dashboard actions.
6. **Forensic Specimen Evidence Rows:** Detail view table rendering all signal types, including `LOGO_SIMILARITY` with explicit score availability and weight status.
7. **Remediation Drafts:** Local draft viewer (`.draft`) with "DRAFT ONLY - NOT SENT" badge and copy-to-clipboard button.
8. **AI Analyst Panel:** Advisory section with summary, rationale, key evidence, uncertainties, and recommended actions, grounded by the mandatory disclaimer.

---

## 4. Contractual CSS Selectors & Classes (Preserved for QA & TSX)

The following selectors are actively asserted by `scripts/run_checks_1_to_13.mjs`, `scripts/test_check_12.mjs`, `scripts/verify_qa_browser.mjs`, or referenced in TSX logic (`docs/handoff/05` and `docs/handoff/10`):

### Source Status & Outage Controls
- `.source-card` (Must be present on all 4 source cards)
- `.source-card.online`, `.source-card.degraded`, `.source-card.not_configured`
- `.source-card.selected` (Applied when card is selected)
- `.source-card-name` (Card title)
- `.source-card-status` (Card status label)
- `.source-action-btn` (Action button: "Simulate outage" / "Restore")
- `.source-dot` (Status indicator dot)
- `.source-selected-tag` (Visible tag rendered inside selected card)
- `.source-selection-caption` (Caption below strip: "Selected: ..." / "No source selected")
- `.source-status-unavailable` (Rendered when source endpoint fails)
- `.source-page-notice` (Notices on `/social` and `/apps`)
- `.source-warning`, `.unavailable` (Modifiers for page notice)

### Dashboard & Scan
- `button.primary` (Dashboard "Scan now" button)
- `.scan-source-warning` (Amber banner displayed when scan used stored observations)
- `.metric strong` (Metric card count values: threats, high risk, lookalikes, candidates)
- `.scanline` (Scan metadata strip)

### Layout & Navigation
- `.shell` / `.aegis-shell`
- `aside` / `.aegis-spine`
- `nav`, `nav a`
- `.brand`, `.caption`, `.eyebrow`
- `.content`
- `.active` / `.spine-node.active`

### Badges, Scores & Tables
- `.badge`
- `.badge.high`, `.badge.critical`
- `.badge.medium`
- `.badge.low`
- `.badge.safe`, `.badge.false_positive`
- `table`, `thead`, `tbody tr`, `td`, `th`
- `.score`

### Error & Recovery
- `.view-error`
- `.loader`
- `button` (containing text "Retry")

### Lookalikes & Detail
- `.lookgrid`, `.look`
- `.detail`, `.evidence`, `.workspace`, `.timeline`, `.draft`, `.analysis`, `.notice`, `.analyst-button`

### Brand Profile Editor
- `.brand-profile-page`, `.profile-actions`, `.setup-panel`, `.setup-heading`, `.setup-fields`, `.setup-section`, `.profile-field`, `.field-error`, `.logo-upload`, `.entry-grid`, `.record-list`, `.setup-record`, `.icon-button`, `.form-message.success`, `.form-message.error`, `.first-scan`

### Name Checker (`/check`)
- `.check-panel`, `.check-fields`, `.preset-grid`, `.preset-toggle.selected`, `.preset-toggle.unselected`, `.preset-state`, `.preset-selection-tools`, `.check-result`, `.verdict.detected`, `.verdict.clear`, `.comparison`, `.codepoint-note`, `.transformations`, `.recent-checks`, `.batch-table-wrap`, `.batch-row`, `.batch-summary.pass`, `.batch-summary.fail`, `.check-pass`, `.check-fail`

### Utilities
- `.spin` (CSS keyframe animation for loading indicators)

---

## 5. AEGIS Token & Variable Definitions

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-canvas: #060607;
  --bg-elevated: #0b0b0d;
  --bg-surface: #121215;
  --bg-raised: #1a1a1e;
  --bg-highlight: #24242a;

  /* Borders */
  --border-subtle: #1c1c22;
  --border-default: #262630;
  --border-strong: #383844;

  /* Text & Content */
  --text-primary: #ece9e1;
  --text-secondary: #a9a69e;
  --text-muted: #8b8982; /* Raised from #6b6963 for informational text to meet WCAG AA contrast (5.8:1) */
  --text-faint: #4e4d48; /* Allowed for decoration and disabled controls */

  /* Semantic Accents */
  --accent-legitimate: #86b8a4; /* Safe, official baseline */
  --accent-suspicious: #d9ae5f; /* Warnings, degraded, medium risk */
  --accent-critical: #e4574a;   /* High risk, alerts, errors */

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
}
```

---

## 6. Known Spec Contradictions & Directives

1. **Ring Contradiction:** Radial geometry puts the most critical threats closer to the protected brand (`rCritical = 75`, `rSuspicious = 135`, `rSafe = 185`). We will label rings by severity (`CRITICAL VECTOR (r=75)`, `SUSPICIOUS HORIZON (r=135)`, `SAFE PERIMETER (r=185)`).
2. **Severity Mapping & Counts:** HIGH and CRITICAL map to the Critical ring (75); MEDIUM and LOW map to the Suspicious ring (135); SAFE maps to the Safe ring (185). Counts match API totals exactly. Angles are derived deterministically from the string hash of candidate detection ID (no `Math.random`). Social threats occupy the left arc (`-160°` to `-20°`), and App threats occupy the right arc (`20°` to `160°`).
3. **Contrast Compliance:** Raised `--text-muted` to `#8b8982` on small text to ensure minimum 4.5:1 / 5.8:1 contrast over `#060607`.
4. **Reduced Motion:** Wrapped `.orbit-spin` and `.pulse-critical` in `@media (prefers-reduced-motion: no-preference)`.
5. **Fonts:** Installed `@fontsource/inter`, `@fontsource/instrument-serif`, `@fontsource/jetbrains-mono` for offline demo support.

