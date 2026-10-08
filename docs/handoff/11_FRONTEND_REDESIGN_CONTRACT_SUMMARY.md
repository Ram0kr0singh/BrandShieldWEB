# BrandShield — Complete Frontend Redesign Handoff

## Table of contents

- [00 — BrandShield Handoff Documentation Index](#doc-00)
- [01 — BrandShield — Changelog by Commit](#doc-01)
- [02 — BrandShield backend API contract](#doc-02)
- [03 — BrandShield detection and scoring rules](#doc-03)
- [04 — Frontend Code Map](#doc-04)
- [05 — Styling and Class Contract](#doc-05)
- [06 — UX State Matrix and Copy](#doc-06)
- [07 — BrandShield — Invariants: Do Not Break](#doc-07)
- [08 — BrandShield — Migration Guide: Old Frontend to HEAD](#doc-08)
- [09 — Demo Script and Run-Observed Sample Data](#doc-09)
- [10 — BrandShield — QA Script Dependencies and Selectors](#doc-10)
- [11 — Frontend Redesign Contract Summary](#doc-11)

---

<a id="doc-00"></a>
## Document 00: BrandShield Handoff Documentation Index

_Source document: `00_README_INDEX.md`._

<a id="doc-00-table-of-contents"></a>
### Table of contents

- [Purpose and evidence labels](#doc-00-purpose-and-evidence-labels)
- [Repository snapshot](#doc-00-repository-snapshot)
- [Dependency versions](#doc-00-dependency-versions)
- [Tracked file inventory](#doc-00-tracked-file-inventory)
  - [Backend application](#doc-00-backend-application)
  - [Backend tests](#doc-00-backend-tests)
  - [Migrations](#doc-00-migrations)
  - [Frontend source](#doc-00-frontend-source)
  - [Configuration and project documentation](#doc-00-configuration-and-project-documentation)
  - [Scripts and tooling](#doc-00-scripts-and-tooling)
- [Uncommitted and generated changes](#doc-00-uncommitted-and-generated-changes)
- [Handoff reading order](#doc-00-handoff-reading-order)
- [Final self-check](#doc-00-final-self-check)

<a id="doc-00-purpose-and-evidence-labels"></a>
### Purpose and evidence labels

This directory is the code-grounded handoff for a frontend redesign of BrandShield. It records the current backend contracts, detection behavior, frontend implementation and UX, styling dependencies, demo data, and migration constraints.

- **VERIFIED** means the claim was checked against the named repository source.
- **RUN-OBSERVED** means the claim was observed by invoking the current API or build/test tooling. The API examples were exercised through the real FastAPI routes against an isolated in-memory SQLite database seeded with the project’s deterministic demo data. Mutating examples therefore did not create lasting notes, drafts, or investigation activity in the configured database.
- **PROVIDED CONTEXT** marks design rationale or historical interpretation supplied for this task, rather than information inferred solely from current source.
- **UNVERIFIED** marks a claim or behavior that could not be established by the evidence available during this handoff.

No secret values are included. Configuration names, where needed, are taken from `.env.example`; the local `.env` was not opened.

<a id="doc-00-repository-snapshot"></a>
### Repository snapshot

- Repository: `Ram0kr0singh/BrandShield`
- Branch: `main`, tracking `origin/main`.
- HEAD: `4aaa37d0f3f37184e40ef46cccaab6ca3f9d0497`.
- HEAD subject: `feat: source status panel, demo outage controls, error boundary, dashboard retry fix`.
- Initial tracked worktree state: clean. See `01_CHANGELOG_BY_COMMIT.md` for the full commit sequence.
- Frontend implementation split verified: `frontend/src/main.tsx` is 80 physical lines and contains the shell, dashboard, list/detail and route wiring components; profile editor, name-check page/presets, and source panel are separate files. See `04_FRONTEND_CODE_MAP.md`.
- The seed function creates missing synthetic records idempotently. In an isolated in-memory run it reported 5 brands, 13 social candidates, and 11 app candidates. A separate `python -m app.seed` run against the configured local database reported 6 brands; the extra local brand’s origin is not established here. The handoff examples use only the isolated, standard five-brand seed.

<a id="doc-00-runtime-capture-method"></a>
#### Runtime capture method

**RUN-OBSERVED:** A local API was already responding on port 8001, so a separate app process was started on an unused port to verify backend startup: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8002`, with working directory `backend` and interpreter `.venv\Scripts\python.exe`. `GET http://127.0.0.1:8002/api/health` returned `{"status":"ok","database":"connected"}`. The required idempotent seed command was run from `backend`: `python -m app.seed`. Detailed sample requests and responses appear in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`.

The route samples for read and mutation endpoints were then run against an isolated in-memory SQLite database through FastAPI’s `TestClient`; the API key environment variable was explicitly blanked before app import for that capture, so the analyst response demonstrates deterministic fallback without sending a provider request. Synthetic logo files used by the in-memory seed were redirected to a temporary directory.

<a id="doc-00-dependency-versions"></a>
### Dependency versions

Frontend exact versions are from `frontend/package-lock.json` (`node_modules/<package>/version`). The manifest itself uses `latest` for these direct runtime dependencies. Python values below distinguish manifest ranges from the exact versions installed in the configured `.venv`; `backend/pyproject.toml` does not pin exact versions.

| Package | Manifest constraint / declaration | Locked or installed exact version | Evidence |
|---|---|---:|---|
| React | `latest` | 19.3.0 | `frontend/package.json`; `frontend/package-lock.json` |
| React Router | `latest` | 7.18.4 | `frontend/package.json`; `frontend/package-lock.json` |
| Vite | `latest` | 8.3.3 | `frontend/package.json`; `frontend/package-lock.json` |
| TypeScript | `latest` | 7.0.2 | `frontend/package.json`; `frontend/package-lock.json` |
| Tailwind CSS | `latest` | 4.3.3 | `frontend/package.json`; `frontend/package-lock.json` |
| Recharts | `latest` | 3.10.1 | `frontend/package.json`; `frontend/package-lock.json` |
| Lucide React | `latest` | 1.52.0 | `frontend/package.json`; `frontend/package-lock.json` |
| FastAPI | `>=0.115,<1.0` | 0.142.2 | `backend/pyproject.toml`; configured `.venv` |
| SQLAlchemy | `>=2.0,<3.0` | 2.1.3 | `backend/pyproject.toml`; configured `.venv` |
| Pydantic | indirect via `pydantic-settings>=2.7,<3.0` | 2.13.5 | `backend/pyproject.toml`; configured `.venv` |
| Pillow | `>=11.0,<12.0` | 11.3.0 | `backend/pyproject.toml`; configured `.venv` |
| httpx | `>=0.28,<1.0` | 0.28.1 | `backend/pyproject.toml`; configured `.venv` |

The selected Python runtime was 3.13.15; the project declares `requires-python = ">=3.13,<3.14"`.

<a id="doc-00-tracked-file-inventory"></a>
### Tracked file inventory

Line counts are physical source-file lines as counted from the current tracked worktree. One-line purposes are filename/source-role descriptions; individual behavior is documented in the linked detailed handoff.

<a id="doc-00-backend-application"></a>
#### Backend application

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/__init__.py` | 1 | Marks the API package. |
| `backend/app/analyst.py` | 265 | Builds evidence-grounded analyst output and provider/fallback behavior. |
| `backend/app/api/__init__.py` | 1 | Marks API route package. |
| `backend/app/api/brands.py` | 211 | Brand profile and official asset endpoints. |
| `backend/app/api/dashboard.py` | 40 | Dashboard overview endpoint and aggregation. |
| `backend/app/api/detections.py` | 86 | Detection read, scan, analysis, and investigation entry routes. |
| `backend/app/api/health.py` | 18 | Health endpoint. |
| `backend/app/api/investigations.py` | 111 | Investigation status, notes, activity, and draft endpoints. |
| `backend/app/api/monitoring.py` | 67 | Monitoring scan and monitoring-run endpoints. |
| `backend/app/core/__init__.py` | 1 | Marks configuration package. |
| `backend/app/core/config.py` | 32 | Reads typed application settings and environment values. |
| `backend/app/database/__init__.py` | 1 | Marks database package. |
| `backend/app/database/base.py` | 6 | SQLAlchemy declarative metadata base. |
| `backend/app/database/session.py` | 19 | SQLAlchemy engine, session factory, request dependency. |
| `backend/app/detection/__init__.py` | 1 | Marks detection package. |
| `backend/app/detection/engine.py` | 131 | Computes and persists candidate detection evidence and scores. |
| `backend/app/detection/normalization.py` | 161 | Text normalization and name-lookalike transformation logic. |
| `backend/app/detection/signals.py` | 74 | Detection signal definitions and weights. |
| `backend/app/logos.py` | 81 | Local logo loading, validation, upload, and similarity utilities. |
| `backend/app/main.py` | 31 | FastAPI app, CORS, route registration, and static mount. |
| `backend/app/models.py` | 305 | SQLAlchemy domain models and enums. |
| `backend/app/schemas.py` | 448 | Pydantic request and response schemas and validation. |
| `backend/app/seed.py` | 124 | Idempotent synthetic demo data and generated logos. |
| `backend/app/sources.py` | 157 | Process-local source status and simulated outage registry. |

<a id="doc-00-backend-tests"></a>
#### Backend tests

| File | Lines | Purpose |
|---|---:|---|
| `backend/tests/conftest.py` | 21 | Shared pytest setup for isolated logo paths. |
| `backend/tests/test_analyst.py` | 168 | Analyst response and scoring-invariance checks. |
| `backend/tests/test_brand_profile.py` | 177 | Brand profile endpoint and validation tests. |
| `backend/tests/test_detection.py` | 108 | Name normalization, detection engine, and API scan tests. |
| `backend/tests/test_domain.py` | 72 | Seed and domain-model behavior checks. |
| `backend/tests/test_health.py` | 10 | Health endpoint test. |
| `backend/tests/test_investigations.py` | 41 | Investigation action and activity tests. |
| `backend/tests/test_logo_similarity.py` | 95 | Logo comparison and logo API tests. |
| `backend/tests/test_monitoring_dashboard.py` | 40 | Monitoring run and dashboard scope tests. |
| `backend/tests/test_sources.py` | 140 | Source-status registry and outage behavior tests. |

<a id="doc-00-migrations"></a>
#### Migrations

| File | Lines | Purpose |
|---|---:|---|
| `backend/alembic.ini` | 37 | Alembic configuration. |
| `backend/alembic/env.py` | 53 | Alembic metadata and migration environment setup. |
| `backend/alembic/script.py.mako` | 23 | Migration-file template. |
| `backend/alembic/versions/.gitkeep` | 1 | Keeps the migrations directory tracked. |
| `backend/alembic/versions/20261007_0001_brand_domain.py` | 49 | Initial brand/domain schema migration. |
| `backend/alembic/versions/20261007_0002_align_brand_slug_index.py` | 27 | Brand slug index alignment migration. |
| `backend/alembic/versions/20261007_0003_detection_results.py` | 61 | Detection results schema migration. |
| `backend/alembic/versions/20261007_0004_monitoring_runs.py` | 27 | Monitoring run schema migration. |
| `backend/alembic/versions/20261007_0005_investigation_workflow.py` | 25 | Investigation workflow schema migration. |

<a id="doc-00-frontend-source"></a>
#### Frontend source

| File | Lines | Purpose |
|---|---:|---|
| `frontend/src/BrandProfileEditor.tsx` | 489 | Brand profile editing and official records UI. |
| `frontend/src/CheckName.tsx` | 261 | Brand-aware name-check and batch result UI. |
| `frontend/src/SourceStatus.tsx` | 208 | Dashboard source-status strip, notices, and demo controls. |
| `frontend/src/api.ts` | 59 | Typed fetch client and API response/request types. |
| `frontend/src/check.css` | 33 | Name-check page visual styling. |
| `frontend/src/checkPresets.ts` | 192 | Curated and generated name-check presets. |
| `frontend/src/main.tsx` | 80 | Shell, overview/list/detail pages, charting, and routes. |
| `frontend/src/source-status.css` | 284 | Source strip, page notice, and degraded-scan banner styles. |
| `frontend/src/styles.css` | 8 | Main application styling; dense CSS lines. |
| `frontend/src/vite-env.d.ts` | 1 | Vite client type declarations. |

<a id="doc-00-configuration-and-project-documentation"></a>
#### Configuration and project documentation

| File | Lines | Purpose |
|---|---:|---|
| `.env.example` | 18 | Local environment variable names and example settings; no local secret values were read. |
| `.gitignore` | 30 | Excludes local, generated, and temporary files. |
| `.postman/resources.yaml` | 9 | Postman workspace resource metadata. |
| `README.md` | 112 | Project overview and local development guidance. |
| `backend/pyproject.toml` | 29 | Python project metadata and dependency ranges. |
| `data/.gitkeep` | 1 | Keeps the data directory tracked. |
| `docker-compose.yml` | 23 | Local service orchestration configuration. |
| `docs/.gitkeep` | 1 | Keeps the documentation directory tracked. |
| `docs/FRONTEND_MANUAL_CHECKS.md` | 9 | Manual frontend QA checklist. |
| `docs/STAGE_04_FINAL_REPORT.md` | 253 | Earlier Stage 04 implementation report. |
| `frontend/index.html` | 5 | Frontend HTML entry document. |
| `frontend/package-lock.json` | 2360 | Locked frontend dependency graph. |
| `frontend/package.json` | 27 | Frontend scripts and direct dependencies. |
| `frontend/tsconfig.app.json` | 19 | TypeScript application compiler options. |
| `frontend/tsconfig.json` | 4 | Root TypeScript project references. |
| `frontend/vite.config.ts` | 8 | Vite plugin and environment-directory configuration. |
| `postman/globals/workspace.globals.yaml` | 2 | Postman global workspace settings. |

<a id="doc-00-scripts-and-tooling"></a>
#### Scripts and tooling

| File | Lines | Purpose |
|---|---:|---|
| `scripts/.gitkeep` | 1 | Keeps the QA scripts directory tracked. |
| `scripts/run_checks_1_to_13.mjs` | 646 | Browser automation checks for the wider application. |
| `scripts/test_check_12.mjs` | 148 | Focused automation for Check page behavior. |
| `scripts/verify_qa_browser.mjs` | 274 | Browser automation/verification workflow. |

<a id="doc-00-uncommitted-and-generated-changes"></a>
### Uncommitted and generated changes

At task start, `git status --short` returned no changes. The documentation deliverables created for this task are intentionally uncommitted. The explicit `python -m app.seed` operation was permitted by the task and idempotently seeded the configured database; it reported 6 total brands (the standard five plus an extra local row of unknown provenance), 13 social candidates, and 11 app candidates. It generated or refreshed ignored synthetic logo files under `data/logos/`. No tracked source, test, configuration, migration, or `.gitignore` file was edited for this handoff.

<a id="doc-00-handoff-reading-order"></a>
### Handoff reading order

1. [01_CHANGELOG_BY_COMMIT.md](#doc-01) — history and endpoint/field/route introduction points.
2. [02_BACKEND_API_CONTRACT.md](#doc-02) — backend API, schemas, and runtime contracts.
3. [03_DETECTION_AND_SCORING_RULES.md](#doc-03) — deterministic scoring and evidence details.
4. [04_FRONTEND_CODE_MAP.md](#doc-04) — frontend components, routes, state, and API data flow.
5. [05_STYLING_AND_CLASS_CONTRACT.md](#doc-05) — stylesheet classes, tokens, and responsive behavior.
6. [06_UX_STATE_MATRIX_AND_COPY.md](#doc-06) — exact page states, errors, and copy.
7. [07_INVARIANTS_DO_NOT_BREAK.md](#doc-07) — redesign safety and behavior checklist.
8. [08_MIGRATION_GUIDE_OLD_FRONTEND_TO_HEAD.md](#doc-08) — upgrade path from earlier frontend iterations.
9. [09_DEMO_SCRIPT_AND_SAMPLE_DATA.md](#doc-09) — run-observed three-minute demo and API samples.
10. [10_QA_SCRIPT_DEPENDENCIES.md](#doc-10) — automation assumptions and commands.
11. [11_FRONTEND_REDESIGN_CONTRACT_SUMMARY.md](#doc-11) — short designer/developer contract.

<a id="doc-00-final-self-check"></a>
### Final self-check

<a id="doc-00-fifteen-source-rechecks"></a>
#### Fifteen source rechecks

All fifteen checks are complete. Evidence is linked inline; source/runtime distinction is preserved throughout the handoff.

| # | Claim to verify | Result |
|---:|---|---|
| 1 | HEAD hash and title match Git. | PASS — `4aaa37d0f3f37184e40ef46cccaab6ca3f9d0497`, subject `feat: source status panel, demo outage controls, error boundary, dashboard retry fix`; recorded in this index’s [repository snapshot](#doc-00-repository-snapshot) and checked with `git log -1`. |
| 2 | `/api/health` response shape matches `health.py`. | PASS — handler is in `backend/app/api/health.py:1-18`; isolated runtime returned `{"status":"ok","database":"connected"}` (`09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:22`). |
| 3 | Source warning generation filters for `DEGRADED` only. | PASS — `backend/app/sources.py:99-111`; test and runtime evidence in `backend/tests/test_sources.py:126-140` and `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:352-369`. |
| 4 | Normal scan response has `source_warnings: []`. | PASS — response schema and scan assembly in `backend/app/schemas.py:351-366` and `backend/app/api/monitoring.py:42-45`; assertion/capture in `backend/tests/test_sources.py:117-118` and `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:335-348`. |
| 5 | Simulated outage scan contains only the degraded Instagram source. | PASS — `backend/app/sources.py:99-127`; test/runtime in `backend/tests/test_sources.py:120-140` and `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:352-369`. |
| 6 | Source registry contains the four documented source IDs. | PASS — `backend/app/sources.py:20-63`; test and captured status data in `backend/tests/test_sources.py:51-59` and `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:291-300`. |
| 7 | Outage operations refuse the demo dataset and do not write DB rows. | PASS — status handlers are in-memory and have no DB dependency (`backend/app/sources.py:17-18,64-82,115-141`); tests assert 409 and unchanged table counts (`backend/tests/test_sources.py:83-99`). |
| 8 | App analysis creates six priority-ordered evidence signals for the sample. | PASS — signal creation/order in `backend/app/detection/engine.py:92,110-120` and `backend/app/detection/signals.py:20-74`; captured N1ke Shopping detail has priorities 1–6 (`09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:184-262`). |
| 9 | N1ke Shopping sample score and severity match the observed API. | PASS — isolated response is 82.3 / HIGH (`09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:184-195`); score/severity logic is `backend/app/detection/engine.py:16-25,28-53`. |
| 10 | Logo scores below 70 are excluded; scores of 70+ are weighted, and scores of 90+ can corroborate lifting the 49 cap. | PASS — `backend/app/detection/engine.py:13,34-51`; test coverage `backend/tests/test_logo_similarity.py:62-95`; explanation `03_DETECTION_AND_SCORING_RULES.md:54-64`. |
| 11 | Source controls default on, dashboard enables them, and controls render for non-DEMO sources. | PASS — `showControls = true` and non-DEMO guard in `frontend/src/SourceStatus.tsx:44,174-198`; dashboard usage in `frontend/src/main.tsx:66`. |
| 12 | Social and Apps routes show the matching source-kind notice. | PASS — kind filtering and message in `frontend/src/SourceStatus.tsx:27-36`; route composition in `frontend/src/main.tsx:77-80`. |
| 13 | `main.tsx` has 80 physical lines and routes pages as documented. | PASS — 80-line count; route declarations `frontend/src/main.tsx:77-80`; map `04_FRONTEND_CODE_MAP.md:19-33`. |
| 14 | Source status classes and CSS selectors align. | PASS — generated `.source-card`, `.source-dot`, `.source-card-status`, and `.selected` classes in `frontend/src/SourceStatus.tsx:140-188`; matching rules in `frontend/src/source-status.css:65-106`; contract `05_STYLING_AND_CLASS_CONTRACT.md:24-35`. |
| 15 | QA guide distinguishes actual assertions from comments and selection inputs. | PASS — `10_QA_SCRIPT_DEPENDENCIES.md:95` classifies literals with exact script locations; references include `scripts/run_checks_1_to_13.mjs:127,170,207-208,280,313-314,422,451,474-477,492,612,619-621` and `scripts/verify_qa_browser.mjs:212-218,251-257`. |

<a id="doc-00-remaining-uncertainty"></a>
#### Remaining uncertainty

- The extra sixth brand in the configured local database has unknown provenance; it is excluded from the isolated standard-five-brand samples (`09_DEMO_SCRIPT_AND_SAMPLE_DATA.md:24-30`).
- The isolated API captures do not establish deployed API/environment values or live Groq behavior. The analyst capture deliberately used deterministic fallback (`02_BACKEND_API_CONTRACT.md:428`).
- The frontend’s deployed API base, compatibility with remote response schemas, empty-brand-list API outcome, network-failure behavior, target-browser rendering, assistive-technology behavior, and clipboard permissions were not exercised (`04_FRONTEND_CODE_MAP.md:19,103,113`; `06_UX_STATE_MATRIX_AND_COPY.md:59,152`).
- The QA scripts were inspected for assertions and side effects but were not run as part of this documentation task; their source does not prove that UI assertions pass (`10_QA_SCRIPT_DEPENDENCIES.md:99-107`).
- `.scan-failure` styling is not defined in the reviewed stylesheets (`05_STYLING_AND_CLASS_CONTRACT.md:36`).
- Exact service versions beyond those in the current lockfile and selected Python environment are not asserted.

<a id="doc-00-secret-and-scope-confirmation"></a>
#### Secret and scope confirmation

No secret values were written into the handoff. The local `.env` was not opened. Only the allowed idempotent seed command wrote/updated generated local demo data; repository source/config/tests/migrations were not edited. Final `git status --short` must show only new or modified files under `docs/handoff/`.

---

<a id="doc-01"></a>
## Document 01: BrandShield — Changelog by Commit

_Source document: `01_CHANGELOG_BY_COMMIT.md`._

<a id="doc-01-contents"></a>
### Contents

- [Scope and reading notes](#doc-01-scope-and-reading-notes)
- [Chronological commit record](#doc-01-chronological-commit-record)
- [Baseline and current-head delta](#doc-01-baseline-and-current-head-delta)
- [Context and verification notes](#doc-01-context-and-verification-notes)

<a id="doc-01-scope-and-reading-notes"></a>
### Scope and reading notes

This log was assembled from the repository's complete Git history in oldest-to-newest order. Commit subjects and touched paths below describe Git metadata; frontend impact is classified from whether and how a commit touched `frontend/`. “No frontend files” means the commit did not modify the frontend tree, not that it had no effect on frontend behavior through an API.

The inspected history begins at `3efb8a1` and ends at `4aaa37d` (`feat: source status panel, demo outage controls, error boundary, dashboard retry fix`). Paths are shown relative to the repository root. Where a commit includes generated test artifacts, those artifacts are called out separately rather than reproducing every generated filename.

<a id="doc-01-chronological-commit-record"></a>
### Chronological commit record

| # | Commit / exact subject | Files touched (all paths) | Frontend impact |
|---:|---|---|---|
| 1 | `3efb8a1` — `first commit` | `README.md` | Documentation only; no frontend files. |
| 2 | `ae02afd` — `chore: establish BrandShield project foundation` | `.env.example`; `.gitignore`; `README.md`; `backend/alembic.ini`; `backend/alembic/env.py`; `backend/alembic/script.py.mako`; `backend/alembic/versions/.gitkeep`; `backend/app/__init__.py`; `backend/app/api/__init__.py`; `backend/app/api/health.py`; `backend/app/core/__init__.py`; `backend/app/core/config.py`; `backend/app/database/__init__.py`; `backend/app/database/session.py`; `backend/app/main.py`; `backend/pyproject.toml`; `backend/tests/test_health.py`; `docker-compose.yml`; `frontend/index.html`; `frontend/package-lock.json`; `frontend/package.json`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css`; `frontend/src/vite-env.d.ts`; `frontend/tsconfig.app.json`; `frontend/tsconfig.json`; `frontend/vite.config.ts` | Established the React/Vite shell, API client, build configuration, and initial frontend-to-health-check presentation. |
| 3 | `e89902b` — `feat: add BrandShield domain model and demo data` | `README.md`; `backend/alembic/env.py`; `backend/alembic/versions/20261007_0001_brand_domain.py`; `backend/alembic/versions/20261007_0002_align_brand_slug_index.py`; `backend/app/api/brands.py`; `backend/app/database/base.py`; `backend/app/main.py`; `backend/app/models.py`; `backend/app/schemas.py`; `backend/app/seed.py`; `backend/tests/test_domain.py` | No frontend files; added the domain/API data contract consumed by later UI work. |
| 4 | `ddd8c7d` — `fix: connect frontend to backend API` | `.env.example`; `frontend/vite.config.ts` | Frontend development proxy/configuration change; no page/component change. |
| 5 | `0cff7e2` — `feat: add deterministic detection engine and evidence` | `README.md`; `backend/alembic/versions/20261007_0003_detection_results.py`; `backend/app/api/detections.py`; `backend/app/detection/__init__.py`; `backend/app/detection/engine.py`; `backend/app/detection/normalization.py`; `backend/app/detection/signals.py`; `backend/app/main.py`; `backend/app/models.py`; `backend/app/schemas.py`; `backend/tests/test_detection.py` | No frontend files; established detection/evidence APIs and deterministic backend behavior. |
| 6 | `0c335cd` — `feat: add threat monitoring dashboard` | `backend/alembic/versions/20261007_0004_monitoring_runs.py`; `backend/app/api/dashboard.py`; `backend/app/api/detections.py`; `backend/app/api/monitoring.py`; `backend/app/detection/engine.py`; `backend/app/detection/signals.py`; `backend/app/main.py`; `backend/app/models.py`; `backend/app/schemas.py`; `backend/tests/test_monitoring_dashboard.py`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css` | First real monitoring dashboard, using overview, detection, and scan API data. |
| 7 | `064db6b` — `feat: add threat investigation and remediation workflow` | `backend/alembic/versions/20261007_0005_investigation_workflow.py`; `backend/app/api/investigations.py`; `backend/app/detection/engine.py`; `backend/app/main.py`; `backend/app/models.py`; `backend/app/schemas.py`; `backend/tests/test_investigations.py`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css` | Connected investigation details and remediation-draft workflow to the frontend. |
| 8 | `f6fdb11` — `feat: add AI-powered AI analyst` | `.env.example`; `README.md`; `backend/app/api/detections.py`; `backend/app/core/config.py`; `backend/app/schemas.py`; `backend/pyproject.toml`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css` | Added frontend/API wiring for analyst explanations; provider implementation and tests arrived in the following commit. |
| 9 | `7c614bb` — `chore: add project docs and development assets` | `.postman/resources.yaml`; `backend/app/analyst.py`; `backend/tests/test_analyst.py`; `data/.gitkeep`; `docs/.gitkeep`; `docs/STAGE_04_FINAL_REPORT.md`; `postman/globals/workspace.globals.yaml`; `scripts/.gitkeep` | No frontend files; added analyst backend implementation/tests, project report, and development-asset placeholders. |
| 10 | `a9bf143` — `feat: finalize competition demo workflow` | `backend/app/api/investigations.py`; `backend/tests/test_investigations.py`; `frontend/src/main.tsx` | Frontend route/workflow polish tied to the completed investigation demo. |
| 11 | `18fb654` — `feat: add protected brand profile and finalize demo hardening` | `README.md`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css` | Frontend API and application-shell changes for protected-brand profile work and demo hardening. This is the migration guide's requested baseline. |
| 12 | `551a0f8` — `feat: local logo similarity (booster-only)` | `.gitignore`; `backend/app/api/brands.py`; `backend/app/detection/engine.py`; `backend/app/detection/signals.py`; `backend/app/logos.py`; `backend/app/main.py`; `backend/app/schemas.py`; `backend/app/seed.py`; `backend/pyproject.toml`; `backend/tests/conftest.py`; `backend/tests/test_brand_profile.py`; `backend/tests/test_detection.py`; `backend/tests/test_logo_similarity.py`; `frontend/src/BrandProfileEditor.tsx`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css` | Added the profile-editor component and asset-management UI/API wiring; also changed the backend detection signal set. |
| 13 | `9c87cb2` — `feat: lookalike detection upgrade and /check page` | `backend/app/detection/normalization.py`; `backend/tests/test_detection.py`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/styles.css`; plus **179 generated files** under `backend/.pytest-tmp/` (logo fixtures/artifacts) | Added look-alike normalization/detection presentation and the first `/check` UI/API wiring. The test-output files were accidental tracked artifacts, not product assets. |
| 14 | `e4720a9` — `chore: stop tracking pytest temp files` | `.gitignore`; the same **179 generated files** under `backend/.pytest-tmp/` were removed from version control | No frontend files; repository hygiene only. |
| 15 | `7732b9c` — `feat: brand-aware /check page with selectable presets and batch results` | `frontend/src/CheckName.tsx`; `frontend/src/check.css`; `frontend/src/checkPresets.ts`; `frontend/src/main.tsx` | Replaced/expanded the initial check UI with brand-aware presets, selection, and batch results. |
| 16 | `4aaa37d` — `feat: source status panel, demo outage controls, error boundary, dashboard retry fix` | `.gitignore`; `backend/app/api/monitoring.py`; `backend/app/main.py`; `backend/app/schemas.py`; `backend/app/sources.py`; `backend/tests/test_sources.py`; `docs/FRONTEND_MANUAL_CHECKS.md`; `frontend/src/SourceStatus.tsx`; `frontend/src/api.ts`; `frontend/src/main.tsx`; `frontend/src/source-status.css`; `frontend/src/styles.css`; `scripts/run_checks_1_to_13.mjs`; `scripts/test_check_12.mjs`; `scripts/verify_qa_browser.mjs` | Added the source-status panel/filtered notices, scan warnings, demo outage controls, retry/error handling, and browser QA scripts. |

<a id="doc-01-baseline-and-current-head-delta"></a>
### Baseline and current-head delta

`18fb654` is followed in history by five commits: logo similarity (`551a0f8`), look-alike detection plus the initial `/check` page (`9c87cb2`), generated pytest-artifact cleanup (`e4720a9`), selectable/batch `/check` (`7732b9c`), and source status/outage/error-handling (`4aaa37d`). These are history-verified additions, not inferred from the commit message alone.

No file under `backend/alembic/versions/` is touched after `18fb654`; the post-baseline application changes do not introduce a new Alembic revision. This is verified by the commit-path history query, rather than a claim that the database schema is unchanged in every other way. The commits do add runtime behavior and UI/API contracts: logo evidence, new check flows, and source status/warnings. See [the migration guide](#doc-08).

<a id="doc-01-context-and-verification-notes"></a>
### Context and verification notes

- Git metadata verifies commit order, exact subjects, changed paths, and the 179 generated test-artifact paths introduced and later deleted. It does not, by itself, prove that any historical QA run passed.
- The current task referenced rationale in an attachment, but no attachment content was available in the task context visible for this documentation pass. No rationale has been treated as verified fact or silently substituted from another source.
- Current-code behavioral claims and invariants are separately cited with `path:line` in the companion documents.

---

<a id="doc-02"></a>
## Document 02: BrandShield backend API contract

_Source document: `02_BACKEND_API_CONTRACT.md`._

> **Evidence labels:** **VERIFIED** describes behavior read from current source with `path:line` citations. **RUN-OBSERVED** is behavior seen during the local server/TestClient capture documented in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`. **PROVIDED CONTEXT** records request rationale, not implementation fact.

<a id="doc-02-table-of-contents"></a>
### Table of contents

- [Evidence boundary](#doc-02-evidence-boundary)
- [Service-wide behavior](#doc-02-service-wide-behavior)
- [Endpoints](#doc-02-endpoints)
- [Validation, errors, and enums](#doc-02-validation-errors-and-enums)
- [Database reads and writes](#doc-02-database-reads-and-writes)
- [Frontend-consumed Pydantic contracts](#doc-02-frontend-consumed-pydantic-contracts)
- [Runtime samples and verification](#doc-02-runtime-samples-and-verification)

<a id="doc-02-evidence-boundary"></a>
### Evidence boundary

- **VERIFIED:** This contract is based on the API routers, schemas, models, settings, logo utilities, and frontend API caller cited below.
- **RUN-OBSERVED:** A local Uvicorn process was started from `backend` on `127.0.0.1:8002`; health returned `{"status":"ok","database":"connected"}`. Endpoint examples were exercised through FastAPI `TestClient` against isolated in-memory SQLite seeded with the deterministic demo data. Mutation samples therefore did not persist to the configured database. `LLM_API_KEY` was blanked before app import, so analyst output used fallback. Exact commands and samples are in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`.
- **PROVIDED CONTEXT:** The requested deliverable is documentation only; no source, configuration, test, or secret-bearing environment file is part of this handoff.

<a id="doc-02-service-wide-behavior"></a>
### Service-wide behavior

- **VERIFIED:** FastAPI identifies itself as `BrandShield API`, version `0.1.0`; every API router is mounted under `/api`. The application enables CORS for configured origins, disallows credentials, permits `GET`, `POST`, `PATCH`, and `DELETE`, and accepts any request header. It mounts local logo files at `/static/logos`. (`backend/app/main.py:15-31`)
- **VERIFIED:** `Settings` takes `DATABASE_URL` as a required setting; the other setting names are `CORS_ORIGINS`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, and `LLM_TIMEOUT_SECONDS`. These are setting names only; no key, secret, or `.env` content is reproduced. `CORS_ORIGINS` is split on commas and trimmed to form the allowed-origin list. (`backend/app/core/config.py:6-27`)
- **VERIFIED:** The frontend API base is `VITE_API_BASE_URL` if set, otherwise the caller uses `http://localhost:8000`; frontend requests append `/api`. A `204` response is treated as `undefined`, and non-success responses become `ApiError` with HTTP status and, when parseable, the response `detail`. (`frontend/src/api.ts:1-12`)
- **VERIFIED:** Static logo references use `/static/logos/`; logos are stored beneath the repository's `data/logos` directory, and upload files are placed in its `uploads` subdirectory. Logo comparison accepts local static references rather than downloading remote image URLs. (`backend/app/logos.py:9-12,20-27,30-43`; `backend/app/api/brands.py:64-99`)

<a id="doc-02-endpoints"></a>
### Endpoints

All paths below include the `/api` prefix. UUID path/query values are parsed as UUIDs by FastAPI. A request not matching the declared schema is subject to framework validation; explicit application errors and their statuses are listed where relevant.

| Method and path | Request / response | Behavior and explicit statuses |
|---|---|---|
| `GET /health` | JSON object `{status, database}` | Executes `SELECT 1`; returns `{"status":"ok","database":"connected"}` on success or `{"status":"degraded","database":"unavailable"}` when a `SQLAlchemyError` occurs. (`backend/app/api/health.py:10-18`) |
| `GET /brands` | `BrandRead[]` | Reads brands ordered by name. (`backend/app/api/brands.py:36-38`) |
| `POST /brands` | `BrandCreate` → `BrandRead` | Creates a brand (`201`). Duplicate official domain and database uniqueness failures return `409`. (`backend/app/api/brands.py:25-33,41-48`) |
| `GET /brands/{brand_id}` | `BrandRead` | Reads one brand; missing brand returns `404`. (`backend/app/api/brands.py:18-22,100-102`) |
| `PATCH /brands/{brand_id}` | `BrandUpdate` → `BrandRead` | Updates provided fields; missing brand `404`, blank explicit name `422`, duplicate official domain `409`, uniqueness failure `409`. (`backend/app/api/brands.py:25-33,50-64`) |
| `POST /brands/{brand_id}/logo` | multipart form field `file` → `BrandRead` | Accepts PNG/JPEG only; media type mismatch `415`, file above 2 MiB `413`, empty or unreadable/unsupported image `422`, missing brand `404`. The image is validated and saved locally; the stored `logo_url` is a static path. (`backend/app/api/brands.py:64-99`) |
| `GET /brands/{brand_id}/assets` | `AssetRead[]` | Reads assets for a brand; missing brand `404`. (`backend/app/api/brands.py:105-109`) |
| `POST /brands/{brand_id}/assets` | `AssetCreate` → `AssetRead` | Creates an official asset (`201`); missing brand `404`; case-insensitive duplicate asset of same type for the brand `409`. (`backend/app/api/brands.py:111-122`) |
| `DELETE /brands/{brand_id}/assets/{asset_id}` | no body → no body | Deletes an asset (`204`); missing brand or asset not owned by that brand returns `404`. (`backend/app/api/brands.py:124-132`) |
| `GET /brands/{brand_id}/social-accounts` | `OfficialSocialRead[]` | Reads official social accounts; missing brand `404`. (`backend/app/api/brands.py:134-138`) |
| `POST /brands/{brand_id}/social-accounts` | `OfficialSocialCreate` → `OfficialSocialRead` | Creates an account (`201`); missing brand `404`; duplicate platform/handle (case-insensitive handle comparison) `409`. (`backend/app/api/brands.py:140-150`) |
| `DELETE /brands/{brand_id}/social-accounts/{account_id}` | no body → no body | Deletes an account (`204`); missing brand or account not belonging to it returns `404`. (`backend/app/api/brands.py:152-160`) |
| `GET /brands/{brand_id}/apps` | `OfficialAppRead[]` | Reads official apps; missing brand `404`. (`backend/app/api/brands.py:162-166`) |
| `POST /brands/{brand_id}/apps` | `OfficialAppCreate` → `OfficialAppRead` | Creates an official app (`201`); missing brand `404`; duplicate platform/package identifier (case-insensitive comparison) `409`. (`backend/app/api/brands.py:168-178`) |
| `DELETE /brands/{brand_id}/apps/{app_id}` | no body → no body | Deletes an app (`204`); missing brand or app not belonging to it returns `404`. (`backend/app/api/brands.py:180-188`) |
| `GET /brands/{brand_id}/social-candidates` | `SocialCandidateRead[]` | Reads stored social candidates; missing brand `404`. (`backend/app/api/brands.py:190-194`) |
| `POST /brands/{brand_id}/social-candidates` | `SocialCandidateCreate` → `SocialCandidateRead` | Creates a stored candidate (`201`); missing brand `404`. (`backend/app/api/brands.py:196-200`) |
| `GET /brands/{brand_id}/app-candidates` | `AppCandidateRead[]` | Reads stored app candidates; missing brand `404`. (`backend/app/api/brands.py:202-206`) |
| `POST /brands/{brand_id}/app-candidates` | `AppCandidateCreate` → `AppCandidateRead` | Creates a stored candidate (`201`); missing brand `404`. (`backend/app/api/brands.py:208-211`) |
| `POST /analyze/name` | `NameAnalysisRequest` → `NameAnalysisRead` | Returns deterministic name normalization, similarity, detection flag, and transformations. (`backend/app/api/detections.py:33-35`) |
| `POST /analyze/social/{candidate_id}` | UUID path → `DetectionRead` | Analyzes and persists a social candidate; missing candidate returns `404`. (`backend/app/api/detections.py:38-44`) |
| `POST /analyze/app/{candidate_id}` | UUID path → `DetectionRead` | Analyzes and persists an app candidate; missing candidate returns `404`. (`backend/app/api/detections.py:46-52`) |
| `POST /detections/scan` | no body → `ScanRead` | Scans all stored social/app candidates and returns analyzed/created-or-updated totals and a severity count map. (`backend/app/api/detections.py:54-61`) |
| `GET /detections` | `DetectionRead[]` | Reads detections newest first, including evidence and a derived candidate display object. (`backend/app/api/detections.py:63-66,22-31`) |
| `GET /detections/{detection_id}` | `DetectionRead` | Reads one detection with evidence and derived candidate display; missing detection `404`. (`backend/app/api/detections.py:68-74`) |
| `POST /detections/{detection_id}/analyze` | empty JSON accepted by current caller → `AnalystAnalysisRead` | Generates an analysis from persisted detection/brand/candidate facts; missing detection `404`, missing persisted brand/candidate `422`. The endpoint description says this does not change detection state. (`backend/app/api/detections.py:76-86`) |
| `GET /detections/{detection_id}/investigation` | → `InvestigationRead` | Reads status, notes, activity, and drafts; missing detection `404`. (`backend/app/api/investigations.py:24-28,41-43`) |
| `POST /detections/{detection_id}/status` | `StatusUpdate` → `InvestigationRead` | Applies only permitted status transitions; missing detection `404`, invalid transition `422`. (`backend/app/api/investigations.py:16-28,45-57`) |
| `POST /detections/{detection_id}/notes` | `NoteCreate` → `InvestigationRead` | Adds a note and audit activity; missing detection `404`. (`backend/app/api/investigations.py:59-70`) |
| `POST /detections/{detection_id}/remediation-drafts` | `RemediationDraftCreate` → `RemediationDraftRead` | Persists a draft and audit activity; missing detection `404`; missing persisted candidate/brand or a draft type inconsistent with candidate source `422`. Draft text is explicitly marked not sent. (`backend/app/api/investigations.py:77-98,100-111`) |
| `GET /monitoring/runs` | optional `brand_id` UUID; `limit` default `20`, range `1..100` → `MonitoringRunRead[]` | Reads runs newest first, optionally filtered by brand. (`backend/app/api/monitoring.py:54-60`) |
| `GET /monitoring/runs/{run_id}` | → `MonitoringRunRead` | Reads one run; missing run `404`. (`backend/app/api/monitoring.py:62-67`) |
| `POST /monitoring/scan` | `MonitoringScanRequest` → `MonitoringRunRead` | Requires an existing brand (`404`); writes a run, scans stored candidates for that brand, then records completion/counts and source warnings. On scan exception it marks the run failed and re-raises. (`backend/app/api/monitoring.py:21-52`) |
| `GET /dashboard/overview` | optional `brand_id` UUID → `DashboardOverview` | Uses the specified brand or, if omitted, the alphabetically first brand; returns `404` if none/the selected ID is absent. Summarizes stored candidates, detections, threat types, recent threats, and latest monitoring run. (`backend/app/api/dashboard.py:22-40`) |
| `GET /sources/status` | → list of source status objects | Returns the process-local source registry in insertion order and updates check timestamps in memory. (`backend/app/sources.py:91-96,143-145`) |
| `POST /sources/{source_id}/simulate-outage` | no meaningful body → source object | Marks one of the three configured live-source IDs degraded in memory; unknown source `404`, controlled demo dataset `409`. No live connection is made. (`backend/app/sources.py:115-127,148-151`) |
| `POST /sources/{source_id}/restore` | no meaningful body → source object | Returns an allowed source to `NOT_CONFIGURED` in memory; unknown source `404`, controlled demo dataset `409`. No live connection is made. (`backend/app/sources.py:129-140,154-157`) |

<a id="doc-02-validation-errors-and-enums"></a>
### Validation, errors, and enums

- **VERIFIED:** Brand names are trimmed and cannot be blank; slug is lowercase alphanumeric words separated by single hyphens and capped at 160 characters. Domains are trimmed/lowercased hostnames with at least two valid labels, no scheme/path, and at most 253 characters. Logo references must be valid `/static/logos/` relative paths or complete HTTP(S) URLs without embedded username/password or whitespace. (`backend/app/schemas.py:19-69,87-112`)
- **VERIFIED:** Social handles are trimmed, an optional leading `@` is removed, and only letters, numbers, dots, underscores, and hyphens are allowed, up to 255 characters. Store/profile URLs require HTTP(S). Package IDs use reverse-domain syntax except numeric IDs are accepted for Apple App Store. (`backend/app/schemas.py:37-57,71-84,147-165,174-210`)
- **VERIFIED:** Asset values are trimmed/nonblank; domain assets use domain validation; logo values use the logo-reference validator; social-account/mobile-app assets use HTTP(S) validation. (`backend/app/schemas.py:229-246`)
- **VERIFIED:** Candidate create schemas constrain required text lengths and nonnegative follower/review counts; `downloads_text` is optional text, and app ratings are constrained to `0..5`. The candidate schemas declare candidate status defaults of `NEW`. (`backend/app/schemas.py:248-298`)
- **VERIFIED:** Note content must be 1–4000 characters and is trimmed; whitespace-only notes fail validation. (`backend/app/schemas.py:383-393`)
- **VERIFIED:** Detection status transitions are: `NEW` → `INVESTIGATING`, `CONFIRMED_THREAT`, `FALSE_POSITIVE`, or `DISMISSED`; `INVESTIGATING` → any of those four; `CONFIRMED_THREAT` → `INVESTIGATING` or `DISMISSED`; `FALSE_POSITIVE` and `DISMISSED` → `INVESTIGATING`. Same-status requests return current investigation without transition. (`backend/app/api/investigations.py:16-22,45-57`)
- **VERIFIED:** Model enums include brand status `ACTIVE|INACTIVE`; social platforms `INSTAGRAM|FACEBOOK|X|LINKEDIN|YOUTUBE|TIKTOK|OTHER`; app platforms `GOOGLE_PLAY|APPLE_APP_STORE|OTHER`; asset types `LOGO|DOMAIN|SOCIAL_ACCOUNT|MOBILE_APP|OTHER`; candidate statuses `NEW|REVIEWED|IGNORED`; candidate kinds `SOCIAL|APP`; detection statuses `NEW|INVESTIGATING|CONFIRMED_THREAT|FALSE_POSITIVE|DISMISSED`; severity `CRITICAL|HIGH|MEDIUM|LOW|SAFE`; threat types `BRAND_IMPERSONATION|FAKE_COMPANY_PAGE|SCAM_ACCOUNT|FAKE_APP|LOOKALIKE_IDENTITY|SUSPICIOUS_PUBLISHER|SUSPICIOUS_LINK`; run statuses `RUNNING|COMPLETED|FAILED`; investigation event types `INVESTIGATION_CREATED|STATUS_CHANGED|NOTE_ADDED|REMEDIATION_DRAFT_GENERATED`; remediation draft types `SOCIAL_PLATFORM|APP_STORE|DOMAIN_REGISTRAR`. (`backend/app/models.py:16-97`)
- **VERIFIED:** Source kinds are `SOCIAL|APP|DEMO`; statuses are `ONLINE|DEGRADED|NOT_CONFIGURED`. The default in-memory entries are `demo_dataset`, `instagram`, `google_play`, and `app_store`; live source entries start `NOT_CONFIGURED`, and scan warnings contain only `DEGRADED` sources. (`backend/app/sources.py:12-63,99-112`)

<a id="doc-02-database-reads-and-writes"></a>
### Database reads and writes

- **VERIFIED:** Brand/profile and official asset/account/app endpoints query SQLAlchemy models, insert/update through a shared `save` helper that commits and refreshes, or delete and commit. Foreign-owned asset/account/app IDs are rejected with `404`. (`backend/app/api/brands.py:18-33,36-211`)
- **VERIFIED:** Candidate create endpoints write candidate rows; scan/analyze endpoints read candidates and official brand assets, then upsert one `Detection` per `(candidate_type, candidate_id)`, replace its evidence, commit, and refresh. Existing analyst status is not reset by later scans. (`backend/app/api/brands.py:190-211`; `backend/app/detection/engine.py:68-96,98-128`; `backend/app/models.py:196-217`)
- **VERIFIED:** Investigation status, notes, activity, and remediation drafts persist as related records. The fixed actor written by the API is `local-demo-analyst`. (`backend/app/api/investigations.py:15,30-38,45-70,100-111`; `backend/app/models.py:237-286`)
- **VERIFIED:** A monitoring scan commits a `RUNNING` row before analysis, then commits counts/completion or commits `FAILED`/completion if analysis raises. (`backend/app/api/monitoring.py:21-52`)
- **VERIFIED:** The source registry is protected by an `RLock` and is process-local; status and simulated outage/restore changes are not database writes. (`backend/app/sources.py:17-18,62-74,91-96,115-140`)
- **VERIFIED:** Source status objects expose `id`, `name`, `kind`, `status`, `message`, `last_checked_at`, `last_success_at`, and `simulated`. A status read updates `last_checked_at`; it updates `last_success_at` only while status is `ONLINE`. The restore response explicitly overrides its returned `simulated` field to `true`, although the stored source value is reset to `false`. (`backend/app/sources.py:20-60,84-96,129-140`)
- **VERIFIED:** Dashboard counts and results are assembled from database queries; there is no separate dashboard persistence model in the endpoint implementation. (`backend/app/api/dashboard.py:22-40`)

<a id="doc-02-frontend-consumed-pydantic-contracts"></a>
### Frontend-consumed Pydantic contracts

The following definitions are transcribed verbatim from `backend/app/schemas.py`; frontend usage is visible in `frontend/src/api.ts:13-58`. Source ranges are noted by each heading. Imports and base/helper declarations are not repeated.

<a id="doc-02-brand-profile-and-official-asset-requestsresponses-backendappschemaspy87-145147-172174-217219-247"></a>
#### Brand profile and official asset requests/responses — `backend/app/schemas.py:87-145,147-172,174-217,219-247`

```python
class BrandCreate(Schema):
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=160)
    description: Optional[str] = None
    official_domain: Optional[str] = Field(default=None, max_length=253)
    logo_url: Optional[str] = Field(default=None, max_length=2048)
    status: BrandStatus = BrandStatus.ACTIVE

    @field_validator("name")
    @classmethod
    def brand_name_is_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Brand name cannot be empty")
        return value

    @field_validator("official_domain")
    @classmethod
    def domain_has_no_scheme_or_path(cls, value: Optional[str]) -> Optional[str]:
        return _validate_domain(value)

    @field_validator("logo_url")
    @classmethod
    def logo_is_http_url(cls, value: Optional[str]) -> Optional[str]:
        return _validate_logo_reference(value)


class BrandUpdate(Schema):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    description: Optional[str] = None
    official_domain: Optional[str] = Field(default=None, max_length=253)
    logo_url: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("name")
    @classmethod
    def brand_name_is_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Brand name cannot be empty")
        return value

    @field_validator("official_domain")
    @classmethod
    def domain_has_no_scheme_or_path(cls, value: Optional[str]) -> Optional[str]:
        return _validate_domain(value)

    @field_validator("logo_url")
    @classmethod
    def logo_is_http_url(cls, value: Optional[str]) -> Optional[str]:
        return _validate_logo_reference(value)


class BrandRead(BrandCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class OfficialSocialCreate(Schema):
    platform: SocialPlatform
    handle: str = Field(min_length=1, max_length=255)
    profile_url: str = Field(max_length=2048)
    display_name: Optional[str] = Field(default=None, max_length=255)
    verified: bool = False
    description: Optional[str] = None
    status: BrandStatus = BrandStatus.ACTIVE

    @field_validator("handle")
    @classmethod
    def valid_handle(cls, value: str) -> str:
        return _validate_handle(value)

    @field_validator("profile_url")
    @classmethod
    def valid_profile_url(cls, value: str) -> str:
        return _validate_http_url(value) or value


class OfficialSocialRead(OfficialSocialCreate):
    id: UUID
    brand_id: UUID
    created_at: datetime
    updated_at: datetime


class OfficialAppCreate(Schema):
    platform: AppPlatform
    app_name: str = Field(min_length=1, max_length=255)
    package_identifier: str = Field(min_length=1, max_length=255)
    store_url: str = Field(max_length=2048)
    developer_name: str = Field(min_length=1, max_length=255)
    developer_identifier: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = Field(default=None, max_length=2048)
    status: BrandStatus = BrandStatus.ACTIVE

    @field_validator("app_name", "developer_name")
    @classmethod
    def required_app_text_is_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value

    @field_validator("package_identifier")
    @classmethod
    def valid_package_identifier(cls, value: str, info: ValidationInfo) -> str:
        platform = info.data.get("platform")
        if platform is None:
            return value
        return _validate_package_identifier(value, platform)

    @field_validator("store_url")
    @classmethod
    def valid_store_url(cls, value: str) -> str:
        return _validate_http_url(value) or value

    @field_validator("logo_url")
    @classmethod
    def valid_logo_url(cls, value: Optional[str]) -> Optional[str]:
        return _validate_logo_reference(value)


class OfficialAppRead(OfficialAppCreate):
    id: UUID
    brand_id: UUID
    created_at: datetime
    updated_at: datetime


class AssetRead(Schema):
    id: UUID
    brand_id: UUID
    asset_type: AssetType
    value: str
    label: Optional[str]
    created_at: datetime
    updated_at: datetime


class AssetCreate(Schema):
    asset_type: AssetType
    value: str = Field(min_length=1, max_length=2048)
    label: Optional[str] = Field(default=None, max_length=255)

    @field_validator("value")
    @classmethod
    def validate_asset_value(cls, value: str, info: ValidationInfo) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Asset value cannot be empty")
        asset_type = info.data.get("asset_type")
        if asset_type == AssetType.DOMAIN:
            return _validate_domain(value) or value
        if asset_type in {AssetType.LOGO, AssetType.SOCIAL_ACCOUNT, AssetType.MOBILE_APP}:
            return (_validate_logo_reference(value) if asset_type == AssetType.LOGO else _validate_http_url(value)) or value
        return value
```

<a id="doc-02-detection-name-analysis-scan-dashboard-and-investigation-contracts-backendappschemaspy291-448"></a>
#### Detection, name analysis, scan, dashboard, and investigation contracts — `backend/app/schemas.py:291-448`

```python
class EvidenceRead(Schema):
    id: UUID
    signal_type: str
    available: bool
    score: Optional[float]
    priority: int
    details: dict


class DetectionRead(Schema):
    id: UUID
    brand_id: UUID
    candidate_type: DetectionCandidateType
    candidate_id: UUID
    status: DetectionStatus
    threat_type: Optional[ThreatType]
    severity: Severity
    risk_score: float
    confidence: float
    official_match: bool
    lookalike_detected: bool
    detected_at: datetime
    created_at: datetime
    updated_at: datetime
    evidence: list[EvidenceRead]
    candidate: Optional[dict] = None


class NameAnalysisRequest(Schema):
    official_name: str = Field(min_length=1, max_length=255)
    candidate_name: str = Field(min_length=1, max_length=255)


class NameAnalysisRead(Schema):
    official_name: str
    candidate_name: str
    normalized_official: str
    normalized_candidate: str
    similarity: float
    detected: bool
    transformations: list[dict]


class ScanRead(Schema):
    analyzed: int
    created_or_updated: int
    by_severity: dict[str, int]


class MonitoringScanRequest(Schema):
    brand_id: UUID


class SourceWarning(Schema):
    id: str
    name: str
    status: str
    message: str


class MonitoringRunRead(Schema):
    id: UUID
    brand_id: UUID
    status: MonitoringRunStatus
    started_at: datetime
    completed_at: Optional[datetime]
    candidate_count: int
    social_candidate_count: int
    app_candidate_count: int
    safe_count: int
    low_count: int
    medium_count: int
    high_count: int
    critical_count: int
    created_at: datetime
    source_warnings: list[SourceWarning] = Field(default_factory=list)


class DashboardOverview(Schema):
    brand: dict
    summary: dict[str, int]
    risk_distribution: list[dict]
    source_distribution: list[dict]
    threat_type_distribution: list[dict]
    recent_threats: list[dict]
    last_scan: Optional[dict]


class StatusUpdate(Schema):
    status: DetectionStatus


class NoteCreate(Schema):
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def content_is_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("content must not be blank")
        return value.strip()


class InvestigationNoteRead(Schema):
    id: UUID
    content: str
    actor: str
    created_at: datetime


class InvestigationActivityRead(Schema):
    id: UUID
    event_type: InvestigationEventType
    previous_value: Optional[str]
    new_value: Optional[str]
    details: dict
    actor: str
    created_at: datetime


class RemediationDraftCreate(Schema):
    draft_type: RemediationDraftType


class RemediationDraftRead(Schema):
    id: UUID
    draft_type: RemediationDraftType
    content: str
    evidence_summary: list
    actor: str
    created_at: datetime


class InvestigationRead(Schema):
    detection_id: UUID
    status: DetectionStatus
    notes: list[InvestigationNoteRead]
    activity: list[InvestigationActivityRead]
    drafts: list[RemediationDraftRead]


class AnalystEvidenceRead(Schema):
    signal_type: str
    summary: str
    score: Optional[float]
    details: dict


class AnalystAnalysisRead(Schema):
    summary: str
    risk_rationale: str
    key_evidence: list[AnalystEvidenceRead]
    uncertainties: list[str]
    recommended_actions: list[str]
    confidence: str
    source_facts: dict
    generated_at: datetime
    provider: str
```

<a id="doc-02-runtime-samples-and-verification"></a>
### Runtime samples and verification

- **VERIFIED:** The repository contains assertions for name-analysis examples and scan persistence/API response shape; these are test-source evidence, not a claim that the tests were executed for this document. (`backend/tests/test_detection.py:13-31,56-83`)
- **RUN-OBSERVED:** Health, brands, Nike brand detail and official records, dashboard overview, detection scan/list/detail, investigation, status/note/draft/analyst actions, name analysis, source status/outage/restore, normal and degraded monitoring scans, and representative 422/409 errors were captured. These samples are in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`; IDs/timestamps are run-specific.
- **UNVERIFIED:** This capture does not establish the behavior of a deployed/remote environment or its configuration. In particular, the analyst runtime sample deliberately used deterministic fallback and does not prove live Groq behavior.

---

<a id="doc-03"></a>
## Document 03: BrandShield detection and scoring rules

_Source document: `03_DETECTION_AND_SCORING_RULES.md`._

> **Evidence labels:** **VERIFIED** means supported by current source or test assertions with `path:line` citations. **RUN-OBSERVED** means observed in the isolated API capture in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`. **PROVIDED CONTEXT** denotes the requested boundary, not a verified runtime fact.

<a id="doc-03-table-of-contents"></a>
### Table of contents

- [Evidence boundary](#doc-03-evidence-boundary)
- [Detection inputs and generated signals](#doc-03-detection-inputs-and-generated-signals)
- [Name normalization and lookalike rules](#doc-03-name-normalization-and-lookalike-rules)
- [Risk score and confidence](#doc-03-risk-score-and-confidence)
- [Severity and threat classification](#doc-03-severity-and-threat-classification)
- [Persistence and rescans](#doc-03-persistence-and-rescans)
- [Worked example](#doc-03-worked-example)

<a id="doc-03-evidence-boundary"></a>
### Evidence boundary

- **VERIFIED:** Rules below are read directly from `normalization.py`, `signals.py`, `engine.py`, `logos.py`, and cited detection tests.
- **RUN-OBSERVED:** The API samples in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md` include a 24-candidate detection scan and the six evidence rows returned for N1ke Shopping. These are isolated seeded-data results; no live-source data was used.
- **PROVIDED CONTEXT:** This is a deterministic-rule description, not a claim that live social/app data is collected. Source registry defaults explicitly say live collection is not enabled and stored observations are used. (`backend/app/sources.py:12-15,31-59`)

<a id="doc-03-detection-inputs-and-generated-signals"></a>
### Detection inputs and generated signals

**VERIFIED:** Social-candidate analysis uses the candidate's display name when truthy, otherwise its handle; it compares official social accounts, a name signal, a lookalike-name signal, descriptions, and brand/candidate logos. Description references are the brand description plus official account descriptions. (`backend/app/detection/engine.py:98-108`)

**VERIFIED:** App-candidate analysis uses the app name; it compares official apps, name/lookalike signals, developer/publisher identity, descriptions, and logos. The official logo reference is the brand logo if truthy, otherwise the first official app logo with a value; description references are the brand description plus official app descriptions. (`backend/app/detection/engine.py:110-121`)

| Signal | Exact rule | Availability, score, priority |
|---|---|---|
| `OFFICIAL_ASSET_MATCH` | Social: any official account on the same platform with case-insensitive exact handle **or** exact profile URL. App: any official app on the same platform with exact package identifier **or** exact store URL. | Always available; score `None`; priority `1`. Details report match and matching official row ID. (`backend/app/detection/signals.py:55-63`) |
| `NAME_SIMILARITY` | `analyze_name(brand.name, candidate_name)`; score is the returned name similarity. | Available; priority `2`. (`backend/app/detection/signals.py:20-22`) |
| `LOOKALIKE_NAME` | `100.0` if name analysis has any transformation, otherwise `0.0`; details carry detection flag and transformations. | Available; priority `3`. (`backend/app/detection/signals.py:25-38`) |
| `DESCRIPTION_SIMILARITY` | Compare normalized candidate description against each non-empty official reference description. For each pair, use the larger of `SequenceMatcher` ratio × 100 and Jaccard overlap of token sets × 100; keep the maximum across reference descriptions. | Unavailable (`None`) if candidate description or all official descriptions are absent; otherwise score rounded to 2 decimals; priority `5`. (`backend/app/detection/signals.py:40-53`) |
| `PUBLISHER_MISMATCH` | App only. If candidate developer name is absent or there are no official apps: unavailable, `None`, result `UNKNOWN`. Otherwise a match is normalized developer-name equality **or** a non-empty candidate developer identifier equal to an official identifier. | Available score `0.0` on match, `100.0` otherwise; priority `4`. (`backend/app/detection/signals.py:65-70`) |
| `LOGO_SIMILARITY` | Compare official and candidate logo references using local-image dHash described below. | Available iff local comparison produces a score; priority `6`. (`backend/app/detection/signals.py:72-74`) |

**VERIFIED — logo transform:** Only references beginning `/static/logos/` resolve to local files; absent/unsupported references, missing files, or decoding failures yield unavailable score and reason details. Images are EXIF-transposed, converted to grayscale, resized to 9×8 with Lanczos, and compared through 64 left-versus-right pixel comparisons. Hamming distance `d` yields `round(max(0, 1 - d / 32) * 100, 2)`. Details include `dHash-64`, distance, and `visually_matches` at score `>=90`. (`backend/app/logos.py:30-78`)

<a id="doc-03-name-normalization-and-lookalike-rules"></a>
### Name normalization and lookalike rules

**VERIFIED — comparison normalization:** Homoglyph substitutions are applied before Unicode NFKC normalization and lowercasing; punctuation is replaced by spaces and whitespace is collapsed. `normalize_text` does not alter the stored source strings. The supported Cyrillic lookalikes are Cyrillic `а е о р с х у і` and their listed uppercase forms, mapped to Latin counterparts. (`backend/app/detection/normalization.py:11-33`)

**VERIFIED — canonicalization:** For lookalike comparison, the homoglyph map is applied, followed by NFKC and lowercasing. Repeated character-confusable substitutions are `1→i`, `l→i`, `!→i`, `|→l`, `0→o`, `3→e`, `4→a`, `5→s`, `@→a`, `$→s`; multi-character confusables are `rn→m`, `vv→w`, and `cl→d`. Non-alphanumeric units are discarded for canonical strings. (`backend/app/detection/normalization.py:9-10,36-64`)

**VERIFIED — similarity calculation:** It computes (1) `SequenceMatcher` similarity ×100 on normalized strings with spaces removed, (2) the same on canonical strings, and (3) maximum similarity between the canonical official name and each canonical candidate token. Reported similarity is the maximum of these three, rounded to two decimals. There is no fixed score threshold in `analyze_name` for the returned `detected` boolean. (`backend/app/detection/normalization.py:128-138,161`)

**VERIFIED — transformation detection:**

- Raw normalized equality (normalization with homoglyph substitution disabled) is handled as an exact official-name/handle case: `detected=False` and no transformations. (`backend/app/detection/normalization.py:136-143`)
- Canonical identity can add `CHARACTER_SUBSTITUTION` entries when the canonical units match but source characters differ; homoglyph substitution evidence includes original position and Unicode code point. (`backend/app/detection/normalization.py:14-21,81-85,145-147`)
- Candidate names that add words before or after all official name tokens get `ADDED_WORDS`; equal condensed strings with different normalized spacing get `SPACING_VARIATION`. (`backend/app/detection/normalization.py:148-155`)
- Edit transformations are considered only when the official canonical name has at least four characters and Damerau–Levenshtein distance is at most one for official lengths under eight, or two for lengths eight or longer. Supported output types are adjacent `CHARACTER_TRANSPOSITION`, insertion, internal `REPEATED_CHARS`, and `CHARACTER_OMISSION`. (`backend/app/detection/normalization.py:66-78,88-110`)
- `detected` is `bool(transformations)`; a transformation can therefore set lookalike flag independent of the similarity score. (`backend/app/detection/normalization.py:161`)

<a id="doc-03-risk-score-and-confidence"></a>
### Risk score and confidence

**VERIFIED:** The weights are `NAME_SIMILARITY=25`, `LOOKALIKE_NAME=15`, `DESCRIPTION_SIMILARITY=20`, `PUBLISHER_MISMATCH=15`, and `LOGO_SIMILARITY=15`. `OFFICIAL_ASSET_MATCH` is not a weighted score; it short-circuits scoring. (`backend/app/detection/engine.py:13,28-31`)

1. If an official asset match is true, risk score is exactly `0.0` and confidence `100.0`. (`backend/app/detection/engine.py:28-31`)
2. Otherwise, include only available signals with non-`None` scores whose signal types have a configured weight. The score is the weighted mean over only those included signals, not a fixed denominator. (`backend/app/detection/engine.py:32-43`)
3. A measured logo score below `70` remains in evidence, but is excluded from the weighted mean; its details are annotated `counted: false` and reason `below 70, not counted as evidence`. Scores of `70` or above enter the mean. (`backend/app/detection/engine.py:34-41`)
4. The score may exceed `49` only when corroborated by at least one of: publisher mismatch score `100`, description similarity `>=70`, or logo similarity `>=90`. Otherwise raw risk is capped at `49.0`. Name and lookalike similarity alone cannot exceed that cap. (`backend/app/detection/engine.py:44-53`)
5. Final non-short-circuit risk score is rounded to two decimals. Confidence is the percent of all generated signals that are available, rounded to two decimals; it is not the score's certainty calibration. (`backend/app/detection/engine.py:28-29,52-53`)

**VERIFIED:** Social analysis creates five signals (official match, name, lookalike, description, logo); app analysis creates six (adds publisher). Availability and confidence therefore depend on signal availability, not which scores were counted. (`backend/app/detection/engine.py:104-108,117-121`)

<a id="doc-03-severity-and-threat-classification"></a>
### Severity and threat classification

**VERIFIED — severity thresholds:** `CRITICAL` for score `>=90`; `HIGH` for `>=75`; `MEDIUM` for `>=50`; `LOW` for `>=25`; otherwise `SAFE`. (`backend/app/detection/engine.py:16-25`)

**VERIFIED — threat type:** Scores below `25` have no threat type. At or above `25`, an app with publisher mismatch score `100` becomes `SUSPICIOUS_PUBLISHER`; otherwise any `LOOKALIKE_NAME` score `100` becomes `LOOKALIKE_IDENTITY`; remaining apps become `FAKE_APP`, remaining social detections `BRAND_IMPERSONATION`. (`backend/app/detection/engine.py:56-66`)

**VERIFIED:** Model enums also define `FAKE_COMPANY_PAGE`, `SCAM_ACCOUNT`, and `SUSPICIOUS_LINK`, but the current `_threat_type` function does not assign them. (`backend/app/models.py:71-80`; `backend/app/detection/engine.py:56-66`)

<a id="doc-03-persistence-and-rescans"></a>
### Persistence and rescans

- **VERIFIED:** Detection identity is unique on `(candidate_type, candidate_id)`; a scan upserts the latest deterministic finding. (`backend/app/models.py:210-217`; `backend/app/detection/engine.py:68-77`)
- **VERIFIED:** On update, the engine replaces prior evidence, updates brand, score, confidence, match/lookalike flags, severity, threat type, and `detected_at`; it then writes current signals ordered by priority, commits, and refreshes. (`backend/app/detection/engine.py:78-96`)
- **VERIFIED:** A newly created finding starts as `FALSE_POSITIVE` if official match is true, otherwise `NEW`. Later scans preserve the analyst's existing status instead of resetting it. (`backend/app/detection/engine.py:89-94`)
- **VERIFIED:** `scan_all` visits all stored social and app candidates, or filters each query to one brand when `brand_id` is provided. It does not retrieve live source data. (`backend/app/detection/engine.py:123-131`; `backend/app/sources.py:12-15`)
- **VERIFIED:** Database schema stores `risk_score`, `confidence`, `official_match`, `lookalike_detected`, and one-to-many evidence rows containing signal type, availability, score, priority, and JSON details. (`backend/app/models.py:196-244`)

<a id="doc-03-worked-example"></a>
### Worked example

**VERIFIED from test source (not run here):** The detection tests assert that `analyze_name("Nike", "N1ke")` yields similarity `100`, `detected=True`, and a `CHARACTER_SUBSTITUTION` transformation. They also assert transformation cases for homoglyphs, transposition, repetition, added words, spacing variation, and insertion. (`backend/tests/test_detection.py:13-31`)

**VERIFIED from test source (not run here):** Logo-similarity tests assert that visually similar local marks provide corroboration sufficient to lift the 49 cap, while a logo score below 70 is marked not counted and does not reduce the no-logo score. These assertions intentionally do not establish an API response sample or a production run result. (`backend/tests/test_logo_similarity.py:49-81`)

**RUN-OBSERVED:** The isolated API capture returned N1ke Shopping at `82.3` risk score (displayed as `82.30`), `HIGH`, and confidence `100.0`; the corresponding six signal rows and their values are recorded in `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`. Nike Running Club Local returned `49.0` / `LOW`; Nike dashboard counts were 7 candidates, 5 detected threats, and 4 high-risk detections. These are results of this seeded fixture run, not universal outcomes for arbitrary inputs or a live-source guarantee.

---

<a id="doc-04"></a>
## Document 04: Frontend Code Map

_Source document: `04_FRONTEND_CODE_MAP.md`._

<a id="doc-04-contents"></a>
### Contents

- [Scope and runtime](#doc-04-scope-and-runtime)
- [Routes and application frame](#doc-04-routes-and-application-frame)
- [Screen and component map](#doc-04-screen-and-component-map)
- [Shared types and API mapping](#doc-04-shared-types-and-api-mapping)
- [Browser APIs and runtime boundaries](#doc-04-browser-apis-and-runtime-boundaries)
- [Source inventory](#doc-04-source-inventory)
- [Verbatim API client](#doc-04-verbatim-api-client)

<a id="doc-04-scope-and-runtime"></a>
### Scope and runtime

This map reflects the checked-in frontend source, not an assumed backend contract. The Vite entry document mounts `/src/main.tsx` into `#root` (`frontend/index.html:1-5`); React renders a `BrowserRouter` around the application (`frontend/src/main.tsx:78`). The frontend package is an ES module using React, React Router, Recharts, Lucide, Vite, Tailwind’s Vite plugin, and TypeScript (`frontend/package.json:1-25`). Vite enables React and Tailwind plugins and sets `envDir` to `..` (`frontend/vite.config.ts:1-8`).

The app-specific TS config enables strict checking, targets ES2022 with DOM libraries, uses bundler module resolution and the React JSX transform, emits no output, and includes `src` (`frontend/tsconfig.app.json:1-19`). The root config references it (`frontend/tsconfig.json:1-4`). `vite-env.d.ts` only includes Vite client types (`frontend/src/vite-env.d.ts:1`).

The API base is read from `import.meta.env.VITE_API_BASE_URL`, falling back to `http://localhost:8000` (`frontend/src/api.ts:1`). The actual deployed value and backend response behavior are **unverified**: this map does not read `.env` files or call the API. Vite’s configured environment directory is the parent of `frontend`, but that does not establish which runtime values exist.

<a id="doc-04-routes-and-application-frame"></a>
### Routes and application frame

`RoutedContent` declares the following routes; `*` renders the overview rather than a not-found page (`frontend/src/main.tsx:77`):

| Route | Rendered view |
| --- | --- |
| `/` | Security overview |
| `/profile` | Brand profile editor |
| `/social` | Social source notice and filtered detections |
| `/apps` | App source notice and filtered detections |
| `/threats` | All detections with filters |
| `/lookalikes` | Look-alike detections |
| `/check` | On-demand name check |
| `/threats/:id` | Threat investigation |
| Any other path | Security overview |

`Shell` is outside the route switch and provides the sidebar links, brand mark, “DIGITAL RISK PROTECTION” caption, “Monitoring active” indicator, and `<main className="content">` for every view (`frontend/src/main.tsx:14`, `78-80`). The current route is not marked with a route-specific active-link class in this component. `Badge` derives its CSS class from the lowercase value and displays underscores as spaces; `Loading` is a centered shared loader (`frontend/src/main.tsx:13-15`). `Table` renders recent-threat rows and invokes its `open(id)` callback when a row is clicked; empty data displays a static empty message (`frontend/src/main.tsx:16`).

<a id="doc-04-screen-and-component-map"></a>
### Screen and component map

<a id="doc-04-overview-overviewpage"></a>
#### Overview (`OverviewPage`)

- State: brands, selected brand ID, overview payload, page error, scan busy state, scan source warnings; `useNavigate` handles threat-detail navigation (`frontend/src/main.tsx:38-39`).
- Initialization effect calls `api.brands()`, chooses a case-insensitive Nike match or the first brand, then loads overview. Load failures distinguish dashboard failure from protected-brand-list failure. If the brand list is empty there is no explicit empty-state branch; the overview remains in its loading state (**behavior read from the branch; no live API verification**) (`frontend/src/main.tsx:40-54`).
- Brand selection clears previous scan warnings and loads the selected brand. Scan calls `api.scan(id)`, keeps array-valued `source_warnings`, reloads overview, and displays generic failure copy on rejection. The scan button is disabled while scanning; its icon uses `spin` (`frontend/src/main.tsx:53-55`).
- Conditional branches: error loader with Retry; loading loader until data; optional warning if scan warnings exist; scanline text varies with `last_scan`; threat-type chart becomes an empty message when its data is empty; the threat table has its own empty state (`frontend/src/main.tsx:52-55`, `16`).
- Metric cards map summary values `detected_threats`, `high_risk`, `lookalikes`, and `total_candidates` to labels and Lucide icons. Risk distribution is a Recharts vertical bar chart over `risk_distribution` (`severity`/`count`), with integer-only Y axis and severity-keyed colors. Threat types use a Recharts pie chart over `threat_type_distribution` (`threat_type`/`count`), cyclically coloring cells. Both charts have `ResponsiveContainer` width `100%`, height `240`; the pie radius is `85`. `source_distribution` exists in the API type but is not charted in this view (`frontend/src/main.tsx:12`, `54-55`; `frontend/src/api.ts:25`).
- Clicking a recent threat navigates to `/threats/{id}` (`frontend/src/main.tsx:54-55`, `16`).

<a id="doc-04-detection-lists-list-socialpage-appspage"></a>
#### Detection lists (`List`, `SocialPage`, `AppsPage`)

- State: nullable detections, error string, severity/source/status filters (each initially `"ALL"`), and navigation callback. An effect calls `api.detections()`; retry repeats the request. Rejection shows a connection-oriented message. Null data shows a loading state (`frontend/src/main.tsx:56-57`).
- Mode filtering: `social` matches candidate source `"Social Media"`; `apps` matches `"App Store"`; `look` requires `LOOKALIKE_NAME` evidence with `details.detected === true`; then the severity, source, and status filters are applied (`frontend/src/main.tsx:57`).
- The `look` mode hides filters and renders cards with official name (evidence value or `"Nike"` fallback), candidate, formatted transformation, severity badge, and score. Other modes render the shared `Table`, mapping candidate fields into the table’s `name/source/publisher` shape. Row click navigates to the detail route (`frontend/src/main.tsx:57`, `16-37`).
- Severity selector is available in all non-look modes. Source and investigation-state selectors are shown only for `all` mode. Severity values are HIGH/MEDIUM/LOW/SAFE; investigation values are NEW/INVESTIGATING/CONFIRMED_THREAT/FALSE_POSITIVE/DISMISSED (`frontend/src/main.tsx:57`).
- Social and app routes compose a `SourceStatusNotice` of the appropriate kind before the matching list (`frontend/src/main.tsx:79-80`).

<a id="doc-04-threat-investigation-detail"></a>
#### Threat investigation (`Detail`)

- Reads `id` from the route. State comprises detection, investigation, analyst analysis, note draft, mutation busy flag, analysis busy flag, and error. `load` concurrently fetches detection and investigation; its effect runs when `load` changes. `mutate` executes an investigation action, updates investigation state and reloads, with shared error/busy handling (`frontend/src/main.tsx:75`).
- Status changes call `api.status`; note submission calls `api.note` and clears the note after success; draft generation chooses APP_STORE for App Store candidates and SOCIAL_PLATFORM otherwise, calls `api.draft`, then reloads investigation; AI Analyst calls `api.analyze` and exposes an independent analyzing state (`frontend/src/main.tsx:75`).
- Until both detection and investigation exist, the page shows the loading/error branch and Retry on error. Once loaded it displays candidate/source/publisher, severity and score, status selector, note input (maximum 4,000 characters), evidence rows, activity, notes, drafts, and optional analysis. Evidence details are serialized for presentation; missing threat type displays `"None"` (`frontend/src/main.tsx:75`).
- Generated remediation drafts are presented as drafts, not submitted externally. Copy invokes `navigator.clipboard?.writeText`. Analyst analysis is separately rendered with summary, rationale, evidence, uncertainties, recommended actions, provider/time/confidence, and a qualification that it cannot alter authoritative detection data (`frontend/src/main.tsx:75`).

<a id="doc-04-brand-profile-brandprofileeditor-field-recordlist-record"></a>
#### Brand profile (`BrandProfileEditor`, `Field`, `RecordList`, `Record`)

- State covers brand list/selection/profile, editable brand form, loaded social/app/asset records, three add-entry forms, three pending-record queues, creating/busy/scanning/loading flags, field errors, general message, scan message and scan-failure flag (`frontend/src/BrandProfileEditor.tsx:84-105`).
- Initial effect fetches brands, prefers Nike case-insensitively then first brand, and invokes `load`; with no brands it enters create mode. `load` concurrently fetches brand, social, app and asset records; optionally copies profile values into the form; catches into a displayed message and always ends loading (`frontend/src/BrandProfileEditor.tsx:107-150`).
- Callback/event behavior: brand selector resets pending entries and scan message then loads; New brand clears selection and forms; controlled fields update their respective form and clear that field error. Add-account/app/asset actions validate and append client-side pending records keyed by `crypto.randomUUID()`. Pending records can be removed before save; existing records call the kind-specific delete endpoint and reload. Save creates or patches the brand, submits queued records with `Promise.allSettled`, removes successful entries from pending queues, reloads, and reports partial or full success. Logo upload validates PNG/JPEG and a 2 MB maximum, uploads and refreshes the profile. Scan refuses creation/no-ID and unsaved state, otherwise calls the deterministic scan endpoint (`frontend/src/BrandProfileEditor.tsx:152-397`).
- Validation covers hostname-only domain, HTTP(S) URL, supported local logo prefix or URL, handle characters/length, reverse-domain or numeric Apple app identifier, duplicate records, brand name/slug constraints and server 409/422 errors (`frontend/src/BrandProfileEditor.tsx:20-73`, `189-336`).
- Render branches include the initial loader, create/edit headings, selector only when brands exist, logo upload only in edit mode, displayed persisted and pending records, success/error message styling, and first-scan section only for a loaded existing profile (`frontend/src/BrandProfileEditor.tsx:398-489`).
- `Field` selects controlled `<input>` or `<textarea>` according to `multiline`, supplies an accessible label, and displays inline errors. `RecordList` is a wrapper; `Record` appends “Not saved yet” to pending details and labels its remove button with the record title (`frontend/src/BrandProfileEditor.tsx:75-82`, `482-489`).

<a id="doc-04-source-status-sourcestatus-sourcestatusnotice"></a>
#### Source status (`SourceStatus`, `SourceStatusNotice`)

- `SourceStatusNotice` independently fetches source status once. An `active` closure flag prevents state updates after unmount. It displays failure/loading, filters by SOCIAL or APP, returns nothing for no matching sources, and reports either offline/stored observations or online sources (`frontend/src/SourceStatus.tsx:18-42`).
- `SourceStatus` state is nullable sources, failed, refreshing, selected source ID, busy source ID and per-source action errors. Memoized `refresh` calls `api.sourceStatus()` and normalizes non-array responses to `[]`; its effect invokes it on mount. `toggle` restores only DEGRADED simulated sources; otherwise simulates an outage, merges response then refreshes. `handleCardClick` toggles selection; Enter/Space call it and prevent default (`frontend/src/SourceStatus.tsx:44-104`).
- Render branches: unavailable plus Retry; loading; otherwise cards and selection caption. Each card is keyboard-focusable, uses role button/pressed state, receives a status-derived class, displays status/message/last-success time and conditional simulated/selected tags. Controls are omitted for DEMO or when `showControls` is false; action errors use `role="alert"`. The nested action button stops click propagation so it does not also toggle card selection (`frontend/src/SourceStatus.tsx:106-208`).

<a id="doc-04-on-demand-name-check-checkname"></a>
#### On-demand name check (`CheckName`)

- State: brands, selected brand, candidate, batch results, up-to-10 recent individual checks, selected result, selected preset-key set, error, busy, brands-loading. Memoized brand presets/all-presets and derived selected/passed/failed counts keep list/result derivation local (`frontend/src/CheckName.tsx:52-70`).
- Effects: when brand name changes, select every preset; on mount fetch brands and prefer Nike or the first item. Errors are normalized for display. Loading/no-brand return branches precede the form (`frontend/src/CheckName.tsx:72-83`, `161-162`).
- Single check guards missing brand/blank input, calls `api.analyzeName`, remembers successful result and selects it; errors are displayed; busy always resets. Batch check snapshots the currently selected presets, clears prior batch/selected result, runs a worker pool capped at four requests concurrently, retains original result ordering, and stores individual failures as rows (`frontend/src/CheckName.tsx:84-138`).
- Choosing a brand clears batch/selected/error. Preset toggles update the Set and copy the candidate into the input; Select all/Clear selection replace the Set (`frontend/src/CheckName.tsx:139-159`).
- The candidate input handles Enter by preventing the default and calling `runSingle`; `runSingle` guards only absent brand/blank value, not `busy`. The input itself is not disabled while a request is busy. The brand selector and preset buttons are disabled while busy (`frontend/src/CheckName.tsx:92-104`, `169-196`).
- Batch row click selects a successful result; row result says expected/actual/Pass/Fail/Error and renders transformations. Single/batch selected result shows verdict, official/candidate/normalized candidate/similarity, optional non-ASCII code points, and transformations. Recent items reselect without another request (`frontend/src/CheckName.tsx:179-261`).
- `presetsForBrand` uses curated examples for Nike, Apple, Samsung, Adidas and Spotify, otherwise synthesizes flag examples and uses common non-flag examples. Generated cases apply the first available confusable substitution or homoglyph, first eligible transposition, repeat and omission, plus “Official”, spacing, optional homoglyph and “Store” examples. Compact names under three characters yield no generated flag set (`frontend/src/checkPresets.ts:1-192`).

<a id="doc-04-shared-types-and-api-mapping"></a>
### Shared types and API mapping

The API client defines the frontend contract (not independently verified against server schemas): `Brand`, `OfficialSocial`, `OfficialApp`, `BrandAsset` and their input types; `SourceWarning`, `SourceStatus`, `MonitoringRun`; `Threat`, `Overview`, `Detection`; investigation `Note`, `Activity`, `Draft`, `Investigation`; `AnalystAnalysis`; and `NameAnalysis` (`frontend/src/api.ts:13-29`). Several enum-like fields (`status`, platform, severity, threat type) are plain strings, so their full server value sets are not guaranteed by TypeScript.

| UI operation | API method / mapping |
| --- | --- |
| Dashboard brand list and metrics | `brands()` → `Brand[]`; `overview(id)` → `Overview` with `summary`, distributions, recent threats and last scan (`api.ts:32-33`, `49`) |
| Scan | `scan(id)` posts `{brand_id}` and returns candidate counts and optional source warnings (`api.ts:50`) |
| List / investigation | `detections()`; `detection(id)`; `investigation(id)`; mutations `status`, `note`, `draft`, `analyze` (`api.ts:53-59`) |
| Profile | Brands and detail; PATCH/create; logo multipart; social, app and asset list/create/delete (`api.ts:32-48`) |
| Source status | `sourceStatus()`, `simulateSourceOutage(id)`, `restoreSource(id)` (`api.ts:51-52`) |
| On-demand analysis | `analyzeName(official_name,candidate_name)` → `NameAnalysis` (`api.ts:58`) |

`request<T>` prefixes `${base}/api`, uses `fetch`, extracts a JSON `detail` on non-2xx responses, throws `ApiError(status, detail)`, maps HTTP 204 to `undefined as T`, and otherwise parses JSON. These are client assumptions; response schema correctness is **unverified** without a server contract or runtime response (`frontend/src/api.ts:1-12`).

<a id="doc-04-browser-apis-and-runtime-boundaries"></a>
### Browser APIs and runtime boundaries

- `fetch` and `RequestInit` implement API requests (`frontend/src/api.ts:3-12`).
- `FormData` and browser `File` support logo upload (`frontend/src/api.ts:36`; `frontend/src/BrandProfileEditor.tsx:337-360`).
- `URL` parses and validates profile URLs; `crypto.randomUUID()` keys pending records and recent checks (`frontend/src/BrandProfileEditor.tsx:26-37`, `189-209`; `frontend/src/CheckName.tsx:84-90`).
- `Date(...).toLocaleString()` formats connection, detection and activity times (`frontend/src/SourceStatus.tsx:14-15`; `frontend/src/main.tsx:54`, `75`).
- `navigator.clipboard?.writeText` copies a draft; `window.location.reload()` reloads after an error-boundary action (`frontend/src/main.tsx:75-76`).
- `document.getElementById("root")` is asserted non-null at React startup (`frontend/src/main.tsx:78`).
- No persistence through browser storage is implemented in the reviewed frontend source. Clipboard availability and permission behavior are **unverified** in target browsers.

<a id="doc-04-source-inventory"></a>
### Source inventory

| File | Responsibility |
| --- | --- |
| `frontend/src/main.tsx` | Router, shell, overview, lists, investigation, boundary, source page wrappers (`:1-80`) |
| `frontend/src/BrandProfileEditor.tsx` | Profile forms, local validation, records and scanning (`:1-489`) |
| `frontend/src/SourceStatus.tsx` | Source notices, status cards and demo controls (`:1-208`) |
| `frontend/src/CheckName.tsx` | Single and batch name-analysis UI (`:1-261`) |
| `frontend/src/checkPresets.ts` | Curated and generated examples (`:1-192`) |
| `frontend/src/api.ts` | Types, fetch wrapper and endpoint methods (`:1-59`) |
| `frontend/src/styles.css` | Main visual system and view-specific CSS (`:1-8`) |
| `frontend/src/check.css` | Name-check classes and breakpoints (`:1-33`) |
| `frontend/src/source-status.css` | Source-status classes and breakpoint (`:1-284`) |
| `frontend/src/vite-env.d.ts` | Vite client type reference (`:1`) |

<a id="doc-04-verbatim-api-client"></a>
### Verbatim API client

Copied verbatim from `frontend/src/api.ts:1-59`:

```ts
const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export class ApiError extends Error { constructor(public status: number, public detail: unknown) { super(typeof detail === "string" ? detail : `Request failed (${status})`); } }
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${base}/api${path}`, init);
  if (!r.ok) {
    let detail: unknown;
    try { detail = (await r.json()).detail; } catch { detail = undefined; }
    throw new ApiError(r.status, detail);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}
export type Brand = { id: string; name: string; slug?: string; description?: string|null; official_domain?: string|null; logo_url?: string|null; status?: string };
export type OfficialSocial = { id:string; platform:string; handle:string; display_name?:string|null; verified:boolean; profile_url:string };
export type OfficialApp = { id:string; platform:string; app_name:string; developer_name:string; package_identifier:string; store_url:string };
export type BrandAsset = { id:string; asset_type:string; value:string; label?:string|null };
export type BrandInput = { name:string; slug:string; description:string|null; official_domain:string|null; logo_url:string|null };
export type SocialInput = { platform:string; handle:string; profile_url:string; display_name:string|null };
export type AppInput = { platform:string; app_name:string; package_identifier:string; store_url:string; developer_name:string };
export type AssetInput = { asset_type:string; value:string; label:string|null };
export type SourceWarning = { id:string; name:string; status:string; message:string };
export type SourceStatus = SourceWarning & { kind:"SOCIAL"|"APP"|"DEMO"; last_checked_at:string|null; last_success_at:string|null; simulated:boolean };
export type MonitoringRun = { id:string; brand_id:string; status:string; candidate_count:number; social_candidate_count:number; app_candidate_count:number; completed_at:string|null; source_warnings?:SourceWarning[]|null };
export type Threat = { id:string; name:string; source:string; publisher?:string|null; threat_type:string|null; risk_score:number; severity:string; status:string; detected_at:string };
export type Overview = { brand:Brand; summary:Record<string,number>; risk_distribution:{severity:string;count:number}[]; source_distribution:{source:string;count:number}[]; threat_type_distribution:{threat_type:string;count:number}[]; recent_threats:Threat[]; last_scan:{completed_at:string|null;candidate_count:number}|null };
export type Detection = { id:string; risk_score:number; severity:string; threat_type:string|null; status:string; detected_at:string; candidate:{name:string;source:string;publisher?:string|null}; evidence:{signal_type:string;available:boolean;score:number|null;details:Record<string,unknown>}[] };
export type Note={id:string;content:string;actor:string;created_at:string}; export type Activity={id:string;event_type:string;previous_value:string|null;new_value:string|null;details:Record<string,unknown>;actor:string;created_at:string}; export type Draft={id:string;draft_type:string;content:string;evidence_summary:string[];created_at:string}; export type Investigation={detection_id:string;status:string;notes:Note[];activity:Activity[];drafts:Draft[]};
export type AnalystAnalysis={summary:string;risk_rationale:string;key_evidence:{signal_type:string;summary:string;score:number|null;details:Record<string,unknown>}[];uncertainties:string[];recommended_actions:string[];confidence:string;source_facts:{risk_score:number;severity:string;candidate_name:string;[key:string]:unknown};generated_at:string;provider:string};
export type NameAnalysis={official_name:string;candidate_name:string;normalized_official:string;normalized_candidate:string;similarity:number;detected:boolean;transformations:Record<string,unknown>[]};
const post=<T>(path:string,body:unknown)=>request<T>(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
export const api = {
  brands:()=>request<Brand[]>("/brands"),
  brand:(id:string)=>request<Brand>(`/brands/${id}`),
  createBrand:(payload:BrandInput)=>post<Brand>("/brands",payload),
  updateBrand:(id:string,payload:Omit<BrandInput,"slug">)=>request<Brand>(`/brands/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),
  uploadLogo:(id:string,file:File)=>{ const form=new FormData(); form.append("file",file); return request<Brand>(`/brands/${id}/logo`,{method:"POST",body:form}); },
  brandSocial:(id:string)=>request<OfficialSocial[]>(`/brands/${id}/social-accounts`),
  createSocial:(id:string,payload:SocialInput)=>post<OfficialSocial>(`/brands/${id}/social-accounts`,payload),
  deleteSocial:(id:string,accountId:string)=>request<void>(`/brands/${id}/social-accounts/${accountId}`,{method:"DELETE"}),
  brandApps:(id:string)=>request<OfficialApp[]>(`/brands/${id}/apps`),
  createApp:(id:string,payload:AppInput)=>post<OfficialApp>(`/brands/${id}/apps`,payload),
  deleteApp:(id:string,appId:string)=>request<void>(`/brands/${id}/apps/${appId}`,{method:"DELETE"}),
  brandAssets:(id:string)=>request<BrandAsset[]>(`/brands/${id}/assets`),
  createAsset:(id:string,payload:AssetInput)=>post<BrandAsset>(`/brands/${id}/assets`,payload),
  deleteAsset:(id:string,assetId:string)=>request<void>(`/brands/${id}/assets/${assetId}`,{method:"DELETE"}),
  overview:(id:string)=>request<Overview>(`/dashboard/overview?brand_id=${id}`),
  scan:(id:string)=>post<MonitoringRun>("/monitoring/scan",{brand_id:id}),
  sourceStatus:()=>request<SourceStatus[]>("/sources/status"),
  simulateSourceOutage:(id:string)=>post<SourceStatus & {simulated:true}>(`/sources/${id}/simulate-outage`,{}),
  restoreSource:(id:string)=>post<SourceStatus & {simulated:true}>(`/sources/${id}/restore`,{}),
  detections:()=>request<Detection[]>("/detections"),
  detection:(id:string)=>request<Detection>(`/detections/${id}`),
  investigation:(id:string)=>request<Investigation>(`/detections/${id}/investigation`),
  status:(id:string,status:string)=>post<Investigation>(`/detections/${id}/status`,{status}),
  note:(id:string,content:string)=>post<Investigation>(`/detections/${id}/notes`,{content}),
  draft:(id:string,draft_type:string)=>post<Draft>(`/detections/${id}/remediation-drafts`,{draft_type}),
  analyzeName:(official_name:string,candidate_name:string)=>post<NameAnalysis>("/analyze/name",{official_name,candidate_name}),
  analyze:(id:string)=>post<AnalystAnalysis>(`/detections/${id}/analyze`,{})
};
```

---

<a id="doc-05"></a>
## Document 05: Styling and Class Contract

_Source document: `05_STYLING_AND_CLASS_CONTRACT.md`._

<a id="doc-05-contents"></a>
### Contents

- [Styling layers](#doc-05-styling-layers)
- [Global tokens and layout](#doc-05-global-tokens-and-layout)
- [State-derived class contracts](#doc-05-state-derived-class-contracts)
- [View-specific class families](#doc-05-view-specific-class-families)
- [Responsive behavior](#doc-05-responsive-behavior)
- [Maintenance notes](#doc-05-maintenance-notes)

<a id="doc-05-styling-layers"></a>
### Styling layers

The frontend imports Tailwind through `@import "tailwindcss"` in the global stylesheet, while the reviewed JSX uses named semantic classes rather than Tailwind utility classes (`frontend/src/styles.css:1`; `frontend/src/main.tsx:13-16`, `38-80`; other view source files). CSS is divided into `styles.css` (global shell and page/view layouts), `check.css` (name checker), and `source-status.css` (source-status notice/cards). `BrandProfileEditor` imports only `api`; its classes are supplied by global `styles.css`. `SourceStatus` imports `source-status.css`; `main.tsx` imports `styles.css` and `check.css` (`frontend/src/SourceStatus.tsx:1-4`; `frontend/src/main.tsx:1-11`).

<a id="doc-05-global-tokens-and-layout"></a>
### Global tokens and layout

There is no CSS custom-property token system in the source. Colors, spacing, radii and breakpoints are literal declarations. The dominant palette is dark navy (`#09111e`, `#0a1220`, `#0d1727`, `#101b2d`), blue-gray borders (`#243248`, `#253650`, `#354761`), light foreground (`#e8eef9`), muted text (`#9fb0c7`/`#9eb1ca`), and teal-green primary/success (`#188b70`, `#26ae90`, `#54d6ab`, `#81dcba`). Risk badge colors: high/critical orange-red; medium amber; low blue; safe/false-positive green (`frontend/src/styles.css:5`).

Global layout is a minimum-viewport-height flex shell with a 240px sidebar, max-width 1500px content region, 34px content padding, and shared header/heading/label/button styles. Cards share dark backgrounds, 1px borders, 10px radii and 18px padding. Tables scroll through their `.tablecard` wrapper; table rows are clickable and hover-highlighted. Shared `.spin` rotates the refresh icon (`frontend/src/styles.css:5`).

Other notable layout classes include `.metrics`, `.charts`, `.detail`, `.evidence`, `.lookgrid`, `.workspace`, `.analysis`, and `.profile-grid`; they define overview charts/metrics, detail evidence, lookalike cards, investigation columns, and profile summaries. These selectors share the same stylesheet line group; refer to `frontend/src/styles.css:2-8`.

<a id="doc-05-state-derived-class-contracts"></a>
### State-derived class contracts

| Rendered class pattern | State/source mapping | CSS behavior |
| --- | --- | --- |
| `badge ${v.toLowerCase()}` | Badge value passed by severity, status or draft marker; display text replaces `_` with spaces (`frontend/src/main.tsx:13`) | `.badge.high` and `.badge.critical` are warm red; `.medium` amber; `.low` blue; `.safe` and `.false_positive` green. Unmatched values retain base badge styling (`frontend/src/styles.css:5`). |
| `source-card ${statusKey} ${selected ? "selected" : ""}` | Status fallback is `NOT_CONFIGURED`, then lowercased; selection is separate (`frontend/src/SourceStatus.tsx:140-145`) | `.online` green, `.degraded` amber, `.not_configured` gray, `.selected` independent cyan outline. Focus-visible gets the same cyan outline treatment (`frontend/src/source-status.css:36-89`). Unknown status keys have no mapped status color (fallback behavior inferred from selector coverage). |
| `source-dot ${statusKey}` | Same status key as card (`SourceStatus.tsx:148`) | Dot color maps for online/degraded/not_configured (`frontend/src/source-status.css:42-74`). |
| `source-page-notice` + optional `source-warning` / `unavailable` | Notice success/warning and fetch failure (`SourceStatus.tsx:32-42`) | Default blue notice, amber warning, muted unavailable border/text (`frontend/src/source-status.css:251-269`). |
| `preset-toggle selected` / `unselected` | Membership in selected preset-key Set (`CheckName.tsx:183-188`) | Selected green emphasis; unselected dim; hover restores opacity (`frontend/src/check.css:18-26`). |
| `batch-summary pass` / `fail`, `check-pass` / `check-fail` | All expected results and no failed requests determines summary; each result uses actual-vs-expected (`CheckName.tsx:69-70`, `:221-229`) | Green pass, red/peach fail; compact inline-flex result labels (`frontend/src/check.css:2-7`). |
| `verdict detected` / `clear` | `NameAnalysis.detected` (`CheckName.tsx:238-241`) | Red detected pill or green clear pill (`frontend/src/check.css:13-14`). |
| `form-message success` / `error` | Only exact full-success `"Brand profile saved."` and `"Official record removed."` strings select success; all other nonempty messages use error (`BrandProfileEditor.tsx:474`) | Green success or red error block (`frontend/src/styles.css:7`). |
| `scan-failure` | `scanFailed` (`BrandProfileEditor.tsx:477`) | No `.scan-failure` rule exists in the reviewed stylesheets; class styling is therefore **unverified/not defined here**. |
| `spin` | Refresh/scan busy flags (`main.tsx:53-55`; `SourceStatus.tsx:117-120`; `BrandProfileEditor.tsx:476-477`) | 1-second linear rotation (`frontend/src/styles.css:5`). |

`SourceStatus` sets `aria-pressed` and `role="button"` on cards; that semantic state is not a CSS selector itself. The selection style remains separate from the status hue (`frontend/src/SourceStatus.tsx:140-145`; `frontend/src/source-status.css:77-89`).

<a id="doc-05-view-specific-class-families"></a>
### View-specific class families

- **Profile:** `.brand-profile-page`, `.profile-actions`, `.setup-panel`, `.setup-heading`, `.setup-fields`, `.setup-section`, `.profile-field`, `.field-error`, `.logo-upload`, `.entry-grid`, `.record-list`, `.setup-record`, `.icon-button`, `.form-message`, `.first-scan`. Inputs have a green focus outline; record rows and upload control use dark panels and teal/red action accents (`frontend/src/styles.css:7`).
- **Name check:** `.check-panel`, `.check-fields`, `.preset-grid`, `.preset-toggle`, `.preset-state`, `.preset-selection-tools`, `.check-result`, `.verdict`, `.comparison`, `.codepoint-note`, `.transformations`, `.recent-checks`, `.batch-table-wrap`, `.batch-row`. Batch table is vertically constrained with sticky header; row 5 truncates long transformation copy; candidate table remains horizontally scrollable (`frontend/src/check.css:1-33`).
- **Source status:** `.source-status`, `.source-status-heading`, `.source-refresh`, `.source-chip-list`, `.source-card` and child card classes, `.source-card-actions`, `.source-action-btn`, `.source-card-error`, `.source-selection-caption`, `.source-status-unavailable`, `.source-page-notice`, `.scan-source-warning`. Action hover is suppressed when disabled; disabled controls use reduced opacity and wait/not-allowed cursors (`frontend/src/source-status.css:1-284`).
- **Investigation:** `.detail`, `.workspace`, `.timeline`, `.draft`, `.analysis`, `.analyst-button`, `.notice` lay out persisted evidence, history, draft and analyst content; draft code uses a bounded, scrollable preformatted block (`frontend/src/styles.css:2-4`).
- **Error view:** `.view-error` provides a centered bounded panel with retry/reload/dashboard actions (`frontend/src/styles.css:8`; `frontend/src/main.tsx:76`).

<a id="doc-05-responsive-behavior"></a>
### Responsive behavior

| Breakpoint | Rules |
| --- | --- |
| `max-width: 950px` | Profile entry grids reduce from four columns to two (`frontend/src/styles.css:7`). |
| `max-width: 900px` | Sidebar narrows to 190px, content padding becomes 22px, metrics reduce to two columns (`frontend/src/styles.css:5`). |
| `max-width: 850px` | Name-check form/comparison grids become two columns and form buttons full width (`frontend/src/check.css:32`). |
| `max-width: 650px` | Shell stacks; sidebar becomes full width; nav scrolls horizontally; caption/status marker hide; content padding reduces; page headers stack; chart/detail/action and many form/card grids collapse to one column. Name-check table keeps a 760px minimum width and recent-check buttons align to top. Source-status cards collapse to one column and heading aligns to start (`frontend/src/styles.css:2-8`; `frontend/src/check.css:33`; `frontend/src/source-status.css:277-284`). |

At 650px, profile action controls stack, setup heading stacks, and first-scan content stacks; source status’s chip grid is one column. The overview’s metrics remain two columns at this breakpoint, while its charts/detail become one column (`frontend/src/styles.css:5`, `7`; `frontend/src/source-status.css:277-284`).

<a id="doc-05-maintenance-notes"></a>
### Maintenance notes

- If adding a new severity/source state, keep the source value-to-class mapping and CSS selector mapping in sync. The source card class is derived from raw lowercased status, whereas its visible label uses a lookup with `"Unavailable"` fallback (`frontend/src/SourceStatus.tsx:8-12`, `140-145`).
- Global CSS intentionally includes broad selectors (`header`, `label`, `select`, `button`, `p`, `textarea`); new views inherit them. Scope new control overrides under a view class when needed (`frontend/src/styles.css:5`).
- Breakpoint declarations are split among global, checker and source-status CSS; verify all three for responsive edits.

---

<a id="doc-06"></a>
## Document 06: UX State Matrix and Copy

_Source document: `06_UX_STATE_MATRIX_AND_COPY.md`._

<a id="doc-06-contents"></a>
### Contents

- [Reading this matrix](#doc-06-reading-this-matrix)
- [Application and route states](#doc-06-application-and-route-states)
- [Profile states](#doc-06-profile-states)
- [Source-status states](#doc-06-source-status-states)
- [Name-check states](#doc-06-name-check-states)
- [Visible-copy ledger](#doc-06-visible-copy-ledger)
- [Behavior and verification boundaries](#doc-06-behavior-and-verification-boundaries)

<a id="doc-06-reading-this-matrix"></a>
### Reading this matrix

“Copy” below is literal JSX text unless marked as a template or generated display value. User-entered content, server-provided names/messages, date values and numeric counts vary at runtime. Line citations refer to current frontend source. API outcomes, deployment environment values and browser permission behavior have not been exercised; where they matter, they are marked **unverified**.

<a id="doc-06-application-and-route-states"></a>
### Application and route states

| View/state | Trigger or branch | Visible result / action | Evidence |
| --- | --- | --- | --- |
| Shell on every route | App mounts | “BrandShield”; “DIGITAL RISK PROTECTION”; “Monitoring active”; seven navigation links | `frontend/src/main.tsx:14`, `78` |
| Unknown route | `path="*"` | Renders Security overview; no not-found state | `frontend/src/main.tsx:77` |
| Overview initial | Brands request in progress or no brand selected | “Loading dashboard...” | `frontend/src/main.tsx:38-54` |
| Overview API error | Brand or overview request fails | Error-specific loader and “Retry”; messages “Unable to load protected brands.” or “Unable to load dashboard data.” | `frontend/src/main.tsx:40-52` |
| Overview ready, no scan | `last_scan` is null | “No monitoring run recorded yet. Run a scan to establish the latest monitoring snapshot.” plus “Scan now” | `frontend/src/main.tsx:54-55` |
| Overview ready, prior scan | Has `last_scan` | “Last scan completed {localized time or recently} · {candidate_count} candidates analyzed” | `frontend/src/main.tsx:54` |
| Scan in progress | `busy` | Button disabled; icon spins; label “Scanning...” | `frontend/src/main.tsx:53-55` |
| Scan returns warning(s) | Nonempty array `source_warnings` | “Scan completed using stored observations. Degraded sources: {names}.” | `frontend/src/main.tsx:53-55` |
| Scan error | `api.scan` rejects | “Scan could not be completed.” then overview error/retry branch | `frontend/src/main.tsx:53-54` |
| Overview chart empty threat types | Empty type distribution | “No threats detected for this brand.” | `frontend/src/main.tsx:55` |
| Table empty | No rows | “No threats detected. No suspicious candidates were identified for this protected brand.” | `frontend/src/main.tsx:16` |
| List loading/error | Detections pending or request fails | “Loading monitoring data...” / “Unable to load monitoring data. Check the API connection and retry.”; error branch has “Retry” | `frontend/src/main.tsx:56-57` |
| Investigation pending/error | Detection or investigation missing | “Loading threat...” or “Unable to load investigation data. Check the API connection and retry.”; error includes “Retry” | `frontend/src/main.tsx:75` |
| Investigation mutation error | Status/note/draft operation rejects | “The requested investigation update could not be completed.” | `frontend/src/main.tsx:75` |
| Analyst pending/error | Analyst request | Button switches to “Analyzing evidence…”; error “AI Analyst could not generate an evidence-grounded explanation.” | `frontend/src/main.tsx:75` |
| Error boundary | Descendant render throws | “Something went wrong in this view”; actions “Retry”, “Reload”, “Dashboard” | `frontend/src/main.tsx:76` |

<a id="doc-06-dashboard-and-list-copy"></a>
#### Dashboard and list copy

The overview heading/copy is “THREAT INTELLIGENCE”, “Security overview”, “Prioritization for your protected digital presence.”; controls say “Protected brand” and “Scan now”. Metrics are “Detected threats”, “High risk”, “Look-alikes”, “Candidates monitored”. Chart headings are “Risk distribution” and “Threat types” (`frontend/src/main.tsx:54-55`).

Table headings are “Recent threats”, “Prioritized from persisted detection evidence.”, “Candidate”, “Source”, “Threat type”, “Risk”, “Severity”, “Status” (`frontend/src/main.tsx:16`). Mode headings are “Social media monitoring”, “App store monitoring”, “Look-alike detection”, “Threats”; eyebrow “MONITORING”. Filters display “All severities”, “All sources”, and “All investigation states”; values include the literal enum strings (`frontend/src/main.tsx:57`).

Look-alike cards use uppercase labels “OFFICIAL”, “CANDIDATE”, and “TRANSFORMATION”; transformation display text varies by evidence and may be “No transformation recorded”, “Added words: …”, “Spacing variation”, “Homoglyph: …”, “Transposed characters: …”, “Repeated character: …”, “Omitted character: …”, “Inserted character: …” or serialized JSON (`frontend/src/main.tsx:17-37`, `57`).

<a id="doc-06-investigation-copy"></a>
#### Investigation copy

Visible section/actions include “THREAT INVESTIGATION”; “Analyst action”; “Current status:”; “Add note”; “Generate {APP STORE or SOCIAL PLATFORM} draft”; “AI Analyst”; “Detection”; “Threat type:”; “Detected:”; “Persisted evidence”; availability values “Available” / “Unavailable”; “None” for absent threat type; and “—” for absent evidence score (`frontend/src/main.tsx:75`).

Analyst result copy: “AI ANALYST · {provider}”, “Analyst summary”, “Why it was flagged”, “Key evidence”, “Uncertainties”, “Recommended analyst actions”, “Provider / confidence”, plus “Unavailable” when a key-evidence score is null. Disclaimer: “This explanation does not change the authoritative score, severity, evidence, or investigation decision.” (`frontend/src/main.tsx:75`).

History/draft copy: “Activity history”, “No investigation activity yet.”, “Notes”, “No analyst notes yet.”, “Remediation drafts”, “No remediation draft has been generated. Drafts are local templates and are never sent.”, and “Copy draft” (`frontend/src/main.tsx:75`).

<a id="doc-06-profile-states"></a>
### Profile states

| State | Trigger or branch | Visible result / action | Evidence |
| --- | --- | --- | --- |
| Initial load | Brands/profile request pending and not creating | “Loading protected identity...” | `frontend/src/BrandProfileEditor.tsx:398` |
| Empty brand list | Initial `/brands` returns empty | Create mode, setup form, no brand selector; this is code-derived, API response **unverified** | `frontend/src/BrandProfileEditor.tsx:135-150`, `399-429` |
| Existing profile | Brand loaded | Brand name (or “Brand profile”), “Edit brand details”, “Save profile”; selector if brands exist | `frontend/src/BrandProfileEditor.tsx:399-429` |
| New profile | User chooses “New brand” or no initial brands | “Set up your brand”, “Set up brand”, “Create brand and save records”; upload control omitted until saved | `frontend/src/BrandProfileEditor.tsx:173-182`, `399-429` |
| Saving | `busy` | “Saving...” and disabled save button | `frontend/src/BrandProfileEditor.tsx:419-420` |
| Saved | Full success | “Brand profile saved.”; success styling | `frontend/src/BrandProfileEditor.tsx:329-336`, `474` |
| Partial record save | Some queued records fail | “Brand details saved. Some official records still need attention: {kind}: {error} …” (failed pending entries remain) | `frontend/src/BrandProfileEditor.tsx:312-335` |
| Removed | Existing social/app/asset delete succeeds | “Official record removed.” | `frontend/src/BrandProfileEditor.tsx:363-375`, `474` |
| Upload valid | Edit mode, PNG/JPEG ≤ 2 MB | Upload request; on success “Local logo uploaded. Future scans compare only local /static/logos files.” | `frontend/src/BrandProfileEditor.tsx:337-360` |
| Upload invalid | Unsupported MIME or > 2 MB | “Choose a PNG or JPEG image no larger than 2 MB.” | `frontend/src/BrandProfileEditor.tsx:342-345` |
| Upload while creating | No saved brand | “Create the brand before uploading its local logo.” | `frontend/src/BrandProfileEditor.tsx:339-341` |
| Unsaved profile/records | First scan requested | “Save brand details and pending records before scanning.”; scan marked failed | `frontend/src/BrandProfileEditor.tsx:377-397` |
| Scan running/success/failure | Scan request | “Scanning...” / “First scan completed: {count} candidates analyzed.” / converted error text | `frontend/src/BrandProfileEditor.tsx:377-397`, `475-478` |

Profile headings and guidance: eyebrow “PROTECTED IDENTITY”; “Define verified identity details used as the legitimate baseline for monitoring.”; “Official identity baseline”; “Records saved here are compared with candidate observations. Similarity alone is not a threat verdict.”; “Domain must be a hostname only. URLs must begin with http:// or https://.”; “Profile saved?”; “Run the existing deterministic monitor against this brand's candidate records.” (`frontend/src/BrandProfileEditor.tsx:399-429`, `475`).

Form labels/placeholders/actions:

- “Protected brand”; “Brand / organization name” / “Example Organization”; “Official domain” / “example.com”; “Logo URL” / “/static/logos/brand-logo.png”; “Upload local PNG/JPEG”; “Description” / “Describe the legitimate organization and its public presence” (`frontend/src/BrandProfileEditor.tsx:422-429`).
- “Official social accounts”; “Platform”; “Handle” / “@official_handle”; “Profile URL” / “https://social.example/official”; “Display name (optional)” / “Official profile name”; “Add account” (`frontend/src/BrandProfileEditor.tsx:430-443`).
- “Official apps”; “App name” / “Official app”; “Package / App Store ID” / “com.example.app”; “Store URL” / “https://store.example/app”; “Publisher” / “Official publisher”; “Add app” (`frontend/src/BrandProfileEditor.tsx:445-459`).
- “Additional official assets”; “Asset type”; “Asset value” / “Official URL, identifier, or registered mark”; “Label (optional)” / “What this asset identifies”; “Add asset” (`frontend/src/BrandProfileEditor.tsx:461-473`).
- Conditional buttons: “New brand”; “Create brand and save records”; “Save profile”; “Save changes first”; “Run first scan”. Pending record suffix: “Not saved yet”; remove button aria-label template: “Remove {title}” (`frontend/src/BrandProfileEditor.tsx:399-429`, `475-489`).

<a id="doc-06-profile-validation-and-request-copy"></a>
#### Profile validation and request copy

All are literal frontend messages; server validation can add messages:

| Condition | Exact message | Source |
| --- | --- | --- |
| Name empty/too long | “Enter the brand or organization name.” / “Name must be 160 characters or fewer.” | `BrandProfileEditor.tsx:263-265` |
| Domain malformed/duplicate | “Enter a hostname only, such as example.com—no scheme or path.” / “This official domain is already registered.” | `BrandProfileEditor.tsx:267-271` |
| Logo URL invalid | “Upload a PNG/JPEG or enter a complete http:// or https:// URL.” | `BrandProfileEditor.tsx:272-273` |
| New-brand slug invalid/too long/duplicate | “Use a name containing at least one letter or number.” / “The generated brand ID must be 160 characters or fewer.” / “This generated brand ID is already in use.” | `BrandProfileEditor.tsx:274-277` |
| Missing profile while saving | “Wait for the selected brand profile to finish loading before saving.” | `BrandProfileEditor.tsx:282-285` |
| Missing ID | “Select or create a brand before saving.” | `BrandProfileEditor.tsx:299-301` |
| API/non-API errors | “The request could not be completed. Check your connection and try again.”; 409 identity conflict text; 422 field/message composition; or “The server could not save this profile (HTTP {status}).” | `BrandProfileEditor.tsx:58-73` |
| Social handle / URL / duplicate | “Use letters, numbers, dots, underscores, or hyphens.”; “Enter a complete http:// or https:// URL.”; “Handle must be 255 characters or fewer.”; “This platform and handle are already listed.” | `BrandProfileEditor.tsx:189-209` |
| App fields / duplicate | “Enter the official app name.”; “App name must be 255 characters or fewer.”; “Use a reverse-domain ID (for example com.example.app) or a numeric Apple App Store ID.”; “Package ID must be 255 characters or fewer.”; “Enter a complete http:// or https:// URL.”; “Enter the official publisher name.”; “Publisher name must be 255 characters or fewer.”; “This platform and package ID are already listed.” | `BrandProfileEditor.tsx:211-236` |
| Asset fields / duplicate | “Enter the official asset value.”; “Asset value must be 2,048 characters or fewer.”; “Enter a hostname only, such as example.com.”; “Enter a complete http:// or https:// URL for this asset type.”; “This asset type and value are already listed.”; “Asset label must be 255 characters or fewer.” | `BrandProfileEditor.tsx:238-260` |

<a id="doc-06-source-status-states"></a>
### Source-status states

| State | Visible copy/behavior | Evidence |
| --- | --- | --- |
| Notice pending/failure | “Checking source status...” / “Source status unavailable.” | `frontend/src/SourceStatus.tsx:22-35` |
| No matching kind | Notice renders nothing | `frontend/src/SourceStatus.tsx:35-36` |
| Notice warning / online | “Live {social or app-store} collection is not enabled. Showing stored observations ({source names}).” / “Live {social or app-store} sources are online.” | `frontend/src/SourceStatus.tsx:35-42` |
| Card request pending/error | “Loading source status...” / “Source status unavailable.” and “Retry” | `frontend/src/SourceStatus.tsx:124-133` |
| Refresh idle/running | “Refresh” / “Refreshing...” and disabled while running | `frontend/src/SourceStatus.tsx:113-122` |
| Card fields | “Source status”; “Live collectors are planned, not implemented. Analysis uses stored observations only.”; fallback names “Source” / “Unnamed source”; labels “Online”, “Degraded”, “Not configured”, fallback “Unavailable”; message fallback “No source detail available.” | `frontend/src/SourceStatus.tsx:8-12`, `109-110`, `140-166` |
| Card timestamp | “Last successful connection: {localized time}”; null time displays “Never” | `frontend/src/SourceStatus.tsx:14-15`, `163-164` |
| Selected/unselected | “Selected” tag; caption “Selected: {name}” or “No source selected” | `frontend/src/SourceStatus.tsx:155-156`, `201-203` |
| Simulation action | “Simulate outage” / “Restore”; busy copy “Working...”; always-present “demo only” tag for shown controls; error fallback “Source control failed.” | `frontend/src/SourceStatus.tsx:69-91`, `180-198` |
| Simulated tag | “simulated” when `source.simulated` | `frontend/src/SourceStatus.tsx:155` |

`SourceStatusNotice` and the full `SourceStatus` panel have independent request state and can therefore show different transient results; that follows from two separate fetch-owning components, not a shared cache (`frontend/src/SourceStatus.tsx:18-22`, `44-66`).

<a id="doc-06-name-check-states"></a>
### Name-check states

| State | Visible copy/behavior | Evidence |
| --- | --- | --- |
| Brand list pending | “Loading protected brands...” | `frontend/src/CheckName.tsx:161` |
| No brands | API error if present, otherwise “No protected brands are available.” | `frontend/src/CheckName.tsx:162` |
| Ready | “ON-DEMAND ANALYSIS”; “Check any name”; “Compare names with the selected brand without creating a candidate or database record.” | `frontend/src/CheckName.tsx:164-168` |
| Blank candidate/busy | Check button disabled if busy, blank or missing brand. Candidate input remains enabled during requests; Enter calls the single-check handler, which guards only missing brand/blank value, so repeated Enter can start another request | `frontend/src/CheckName.tsx:92-104`, `169-179` |
| Single request pending | “Checking...” | `frontend/src/CheckName.tsx:169-179` |
| Batch pending | “Running examples...” | `frontend/src/CheckName.tsx:169-179` |
| Error | `role="alert"` with normalized API error text | `frontend/src/CheckName.tsx:41-50`, `176` |
| Preset states | Headings “Should flag” / “Should NOT flag”; `✓` selected and `+` unselected; count “{selected} of {all} examples selected for batch check”; “Select all” / “Clear selection” | `frontend/src/CheckName.tsx:181-218` |
| Batch result | “{brand} example results”; “{passed}/{total} behave as expected”; optional “ · {n} request(s) failed”; columns “Candidate”, “Expected”, “Actual verdict”, “Similarity”, “Transformation”, “Result” | `frontend/src/CheckName.tsx:220-234` |
| Batch result values | “Flag” / “Not flag”; “Flagged” / “Not flagged” / “Request failed”; “Pass” / “Fail” / “Error”; similarity to two decimal places with `%`, or “—” | `frontend/src/CheckName.tsx:225-233` |
| Selected verdict | “LOOK-ALIKE DETECTED” / “NOT A LOOK-ALIKE”; optional “ · EXPECTED FLAG” / “ · EXPECTED NOT FLAG” | `frontend/src/CheckName.tsx:238-241` |
| Selected details | “Official”, “Candidate”, “Normalized candidate”, “Similarity”, “Transformations”; no transformation: “No look-alike transformation was recorded.” | `frontend/src/CheckName.tsx:242-256` |
| Non-ASCII candidate | “Non-ASCII code point: …” or “Non-ASCII code points: …”, with uppercase padded Unicode code point | `frontend/src/CheckName.tsx:35-39`, `247-249` |
| Recent checks | Heading “Recent checks”; empty text “Individual checks you run will appear here (up to 10).”; status “Flagged” / “Not flagged”; reselecting a row restores result | `frontend/src/CheckName.tsx:84-90`, `258-261` |
| General caveat | “Similarity alone is not proof of maliciousness. The engine's actual verdict is shown for every example.” | `frontend/src/CheckName.tsx:178` |

Transformation labels emitted by the checker: “Homoglyph {from} → {to}”, “Character substitution {from} → {to}”, “Transposed characters”, “Repeated character”, “Omitted character”, “Spacing variation”, “Added word(s): {tokens}”; unknown type becomes its lowercased underscore-to-space form or “Transformation”. Empty batch transformation uses “—” (`frontend/src/CheckName.tsx:20-34`). If a caught value is neither a recognized `ApiError` detail nor an `Error`, the fallback is “The name check could not be completed.” (`frontend/src/CheckName.tsx:41-50`).

<a id="doc-06-visible-copy-ledger"></a>
### Visible-copy ledger

The preceding tables include major exact labels, statuses, validation and empty/error messages. Additional reusable or data-derived text:

- Preset candidates come from curated brand examples or generated strings. Curated names, candidates and optional labels are data (for example `Nіke (Cyrillic і)`); exact list and algorithms are in `frontend/src/checkPresets.ts:12-192`. All preset buttons show their `label` when supplied, otherwise candidate text (`frontend/src/CheckName.tsx:183-196`).
- Profile selects display enum values with underscores replaced by spaces. Existing social/app/asset record summaries concatenate platform, handle, URL, package, publisher, asset label/value; record identity comes from API data (`frontend/src/BrandProfileEditor.tsx:430-473`, `486-489`).
- Threat source, candidate name, publisher, dates, scores, evidence types/details, actors, analysis and server-returned error details are dynamic, not fixed copy (`frontend/src/main.tsx:16`, `75`; `frontend/src/BrandProfileEditor.tsx:58-73`).
- `ApiError` defaults to `Request failed ({status})` when its detail is not a string, but most screen handlers replace it with view-specific generic errors; profile and name-check surfaces have their own error formatting (`frontend/src/api.ts:2-11`; `frontend/src/BrandProfileEditor.tsx:58-73`; `frontend/src/CheckName.tsx:41-50`).

<a id="doc-06-behavior-and-verification-boundaries"></a>
### Behavior and verification boundaries

- Source status copy explicitly says live collectors are planned and analysis uses stored observations. The interface’s outage/restore controls are explicitly marked “demo only”; do not interpret a green source state as proof that live collection is running (`frontend/src/SourceStatus.tsx:109-110`, `180-198`).
- The profile scan button is suppressed while there are unsaved changes, and the message says to save first. The dashboard scan button has no equivalent dirty-profile check (`frontend/src/BrandProfileEditor.tsx:161-171`, `377-397`; `frontend/src/main.tsx:53-55`).
- The visible “Monitoring active” shell indicator is static JSX copy, not derived from an API status field (`frontend/src/main.tsx:14`).
- Network outcomes, exact backend validation, deployed API base, rendering in target browsers, mobile assistive-technology behavior, and clipboard permissions are **unverified**. The TypeScript client signatures are frontend declarations, not proof of server schema compatibility (`frontend/src/api.ts:1-59`).

---

<a id="doc-07"></a>
## Document 07: BrandShield — Invariants: Do Not Break

_Source document: `07_INVARIANTS_DO_NOT_BREAK.md`._

<a id="doc-07-contents"></a>
### Contents

- [Authority and data boundaries](#doc-07-authority-and-data-boundaries)
- [Scoring and detection invariants](#doc-07-scoring-and-detection-invariants)
- [Monitoring and source-status invariants](#doc-07-monitoring-and-source-status-invariants)
- [Investigation and action-safety invariants](#doc-07-investigation-and-action-safety-invariants)
- [Schema and frontend/API compatibility](#doc-07-schema-and-frontendapi-compatibility)
- [Context cross-check](#doc-07-context-cross-check)

<a id="doc-07-authority-and-data-boundaries"></a>
### Authority and data boundaries

1. **The deterministic engine is authoritative for risk decisions.** It calculates score, confidence, severity, threat type, official-match status, and persisted evidence; do not move those decisions into UI heuristics or an LLM. The core calculation is in `backend/app/detection/engine.py:13-51`, with persistence at `:55-98`.
2. **Analyst output is explanatory, not a second verdict.** Preserve the existing separation between risk analysis and analyst text. Deterministic analysis and the provider protocol are in `backend/app/analyst.py:59-119,245-264`; the detection analyst route is `backend/app/api/detections.py:76-87`. Do not let analyst availability or wording mutate a detection's score/status.
3. **The application currently analyzes stored candidates; it does not collect live social/app-store observations.** `scan_all` queries `SocialCandidate` and `AppCandidate` rows (`backend/app/detection/engine.py:123-131`). Source status explicitly says live collection is not enabled and observations are stored (`backend/app/sources.py:14-15,20-62`). Do not describe a status check, scan, or outage simulation as a live scraper or platform connection.
4. **Use controlled demo data honestly.** The README describes the project as a local deterministic prototype, synthetic observations, no scraping, and no takedown submission (`README.md:1-3,83-85`). Do not imply real-world monitoring coverage or production enforcement.

<a id="doc-07-scoring-and-detection-invariants"></a>
### Scoring and detection invariants

5. **Official matches remain safe.** `_score` returns `0.0` risk and `100.0` confidence for `official_match=True` (`backend/app/detection/engine.py:28-32`). Do not allow similarity signals alone to override a verified official match.
6. **Similarity without corroboration is capped.** If there is no qualifying publisher mismatch, strong description match, or very strong logo match, risk is capped at `49.0` (`backend/app/detection/engine.py:41-51`). This prevents similarity-only evidence from becoming a medium-or-higher risk verdict.
7. **Logo similarity is a constrained booster.** `LOGO_SIMILARITY` has a configured weight, scores below `70` are excluded from the weighted calculation, and logo evidence can corroborate only at `>=90` (`backend/app/detection/engine.py:13,34-48`). The signal is produced by `backend/app/detection/signals.py:64-74`; do not turn an unavailable logo comparison into negative evidence or claim it is always available.
8. **Normalization and transformation evidence are part of the explainability contract.** Keep the candidate-to-brand transformation descriptions explainable and persisted as signal details (`backend/app/detection/normalization.py:122-161`; `backend/app/detection/signals.py:25-35`). Do not replace exact transformation explanations with an opaque binary match.
9. **A re-scan must not reset a human investigation decision.** For an existing detection, the engine refreshes calculated fields/evidence, but only assigns initial `NEW`/`FALSE_POSITIVE` status when creating a new detection (`backend/app/detection/engine.py:83-98`). Preserve analyst workflow state while updating computed evidence.

<a id="doc-07-monitoring-and-source-status-invariants"></a>
### Monitoring and source-status invariants

10. **The demo dataset cannot be “taken offline.”** Only `instagram`, `google_play`, and `app_store` are eligible for simulated outages. Unknown IDs return 404, while the controlled dataset is refused with 409 (`backend/app/sources.py:70-79,113-129`).
11. **Outage controls are in-memory simulation, not provider operations.** The registry is a process-local dictionary guarded by an `RLock`; status/toggle handlers update it and make no live request (`backend/app/sources.py:17-18,64-82,113-156`). A backend restart resets the simulation to defaults; a browser hard reload alone does not restart the process.
12. **The status panel does not change what a scan analyzes.** The monitoring endpoint checks the requested brand, counts its persisted candidates, invokes `scan_all`, persists the run, then attaches `source_warnings` (`backend/app/api/monitoring.py:21-47`). Warnings communicate degraded source state; they are not proof that new data was collected.
13. **Warnings remain additive and optional for clients.** `source_warnings` is added to the scan response only after a successful scan; the Pydantic response field has a default (`backend/app/schemas.py:344-366`, `backend/app/api/monitoring.py:42-46`). The TypeScript client marks it optional (`frontend/src/api.ts:21-23`). Keep older scan payloads without the field usable. The manual compatibility check explicitly exercises an omitted `source_warnings` field (`docs/FRONTEND_MANUAL_CHECKS.md:1-8`).
14. **A status endpoint failure must not take down the dashboard.** The source widget renders an unavailable state and retry path independently of overview data (`frontend/src/SourceStatus.tsx:44-52,117-128`). Page notices also handle unavailable status (`:18-40`). Keep source-health UI failure isolated from the main dashboard and candidate lists.
15. **Source-status persistence is intentionally limited.** Simulated status belongs to the running process, not SQLAlchemy models or Alembic migrations (`backend/app/sources.py:17-18,64-82`; `backend/app/main.py:24-30`). Do not present it as durable outage history or add a database write without changing the stated contract and tests.

<a id="doc-07-investigation-and-action-safety-invariants"></a>
### Investigation and action-safety invariants

16. **Remediation remains draft-only.** The investigation API creates remediation draft records; it does not send takedown requests or contact platforms (`backend/app/api/investigations.py:100-119`; `README.md:70-74`). Keep visible language clear that drafts are not submitted.
17. **Brand identity is the comparison baseline.** Official accounts, apps, and assets are managed through the brand API (`backend/app/api/brands.py:100-188`). Profile save/upload actions update that identity baseline (`frontend/src/BrandProfileEditor.tsx:281-355`); they must not silently rewrite candidate observations or erase investigation history.
18. **Preserve the documented source identifiers, names, kinds, and exact status messages.** These are cross-layer API/UI contracts defined in `backend/app/sources.py:14-62` and rendered by `frontend/src/SourceStatus.tsx:137-176`. Change the backend and frontend together if one is intentionally revised.
19. **Demo-only controls must remain visibly labeled as simulation.** The routes are `POST /api/sources/{source_id}/simulate-outage` and `POST /api/sources/{source_id}/restore` (`backend/app/sources.py:148-156`). They must not be repurposed as actual source-disabling or external-service actions without a separately designed integration.

<a id="doc-07-schema-and-frontendapi-compatibility"></a>
### Schema and frontend/API compatibility

20. **Alembic owns persistent schema changes.** The repository contains a linear five-revision history from brand domain through investigation workflow (`backend/alembic/versions/20261007_0001_brand_domain.py` through `..._0005_investigation_workflow.py`). Do not hand-edit the database as a substitute for a migration, and do not infer that post-`18fb654` frontend/backend changes imply a schema migration; history has no later Alembic file.
21. **Preserve API field names and optional-field tolerance.** The TypeScript client in `frontend/src/api.ts:21-23` mirrors backend response schemas; keep scan warnings additive and tolerate their absence for older responses.
22. **Keep current route families reachable.** Navigation and route registration include Overview, Brand Profile, Social Media, App Stores, Threats, Look-alike Detection, Check any name, and threat detail (`frontend/src/main.tsx:14,77-80`). A feature should not break the other routes through shared loading/error state.
23. **Retry/error boundaries should recover, not mask permanent failures.** Dashboard retry re-fetches required overview/brand data; the route error boundary offers retry, reload, and return-to-dashboard controls (`frontend/src/main.tsx:38-42,76-77`). Do not turn an API error into a blank view or false successful scan.
24. **Keep deterministic fixtures and assertion expectations synchronized.** Later commits add logo evidence and a new check flow; the browser script still contains literal regression scores (`scripts/run_checks_1_to_13.mjs:608-626`). Treat those numbers as test expectations to verify against current code, not as established current results.

<a id="doc-07-context-cross-check"></a>
### Context cross-check

No user-provided rationale attachment was available in the task context visible for this pass. Accordingly, this document does not claim to validate any rationale statements. The invariants above are derived from the current source and committed documentation; if a separate rationale is supplied later, compare it against these cited facts and mark any mismatch explicitly.

---

<a id="doc-08"></a>
## Document 08: BrandShield — Migration Guide: Old Frontend to HEAD

_Source document: `08_MIGRATION_GUIDE_OLD_FRONTEND_TO_HEAD.md`._

<a id="doc-08-contents"></a>
### Contents

- [Purpose and verified baseline](#doc-08-purpose-and-verified-baseline)
- [What changed after `18fb654`](#doc-08-what-changed-after-18fb654)
- [Current frontend surface](#doc-08-current-frontend-surface)
- [Migration sequence](#doc-08-migration-sequence)
- [Compatibility and validation checklist](#doc-08-compatibility-and-validation-checklist)
- [Context cross-check and uncertainties](#doc-08-context-cross-check-and-uncertainties)

<a id="doc-08-purpose-and-verified-baseline"></a>
### Purpose and verified baseline

This guide treats commit `18fb654` (`feat: add protected brand profile and finalize demo hardening`) as the old-frontend baseline and current HEAD `4aaa37d` as the target. Git history verifies five post-baseline commits; the exact messages and paths are listed in [the commit changelog](#doc-01).

This is a frontend/API migration guide, not a database upgrade guide. **No Alembic revision was added after `18fb654`**: the history contains no post-baseline path under `backend/alembic/versions/`. The existing migration chain remains the five revisions `20261007_0001` through `20261007_0005`. See the files in `backend/alembic/versions/` and commit-path history.

<a id="doc-08-what-changed-after-18fb654"></a>
### What changed after `18fb654`

The post-baseline sequence is verified from Git:

1. **`551a0f8` — local logo similarity (booster-only).** Adds `frontend/src/BrandProfileEditor.tsx` and profile/asset client and shell wiring; also adds local logo comparison and a new detection signal. Current logo scoring is weighted but constrained: below-70 similarities are excluded and logo evidence corroborates only at 90 or above (`backend/app/detection/engine.py:13,34-48`).
2. **`9c87cb2` — look-alike detection upgrade and initial `/check` page.** Changes normalization, detection tests and frontend API/shell/styles. Git also records 179 generated files under `backend/.pytest-tmp/`, which are cleanup artifacts rather than product resources.
3. **`e4720a9` — stop tracking pytest temp files.** Deletes those 179 generated files and updates `.gitignore`; no frontend code changes.
4. **`7732b9c` — brand-aware check, selectable presets, batch results.** Adds `CheckName.tsx`, `check.css`, and `checkPresets.ts`, and wires the route in `main.tsx`.
5. **`4aaa37d` — source status panel, demo outage controls, error boundary, dashboard retry fix.** Adds the source registry and API, source status component/styles, dashboard warnings, source notices on Social/App pages, recoverable error handling, a source test, and browser QA scripts.

These deltas change frontend behavior and the detection evidence contract, but do not add a persistent schema migration. The backend source registry is explicitly process-local (`backend/app/sources.py:17-18,64-82`); the scan still uses stored candidate records (`backend/app/api/monitoring.py:21-45`, `backend/app/detection/engine.py:123-131`).

<a id="doc-08-current-frontend-surface"></a>
### Current frontend surface

The current navigation and route set is defined in `frontend/src/main.tsx:14,77-80`:

- `/` — overview/dashboard with brand selector, scan action, metrics, charts, recent threats, source-status panel, and optional degraded-source scan banner (`frontend/src/main.tsx:38-68`).
- `/profile` — editable protected brand and its official identity baseline; component setup/save/upload flows are in `frontend/src/BrandProfileEditor.tsx:84-114,281-355`.
- `/social` and `/apps` — persisted candidate lists with source-kind-filtered notices (`frontend/src/main.tsx:79-80`).
- `/threats` and `/threats/:id` — filtered detection list and investigation details.
- `/lookalikes` — detections with normalized-name transformation evidence.
- `/check` — name analysis using brand-aware presets, selectable examples, and batch results (`frontend/src/CheckName.tsx:52-69,107-112,178-213`; `frontend/src/checkPresets.ts:178-190`).

The source panel represents actual current prototype behavior honestly: the demo dataset is available, while Instagram, Google Play, and Apple App Store live collection are not configured by default (`backend/app/sources.py:20-62`). A completed scan may include degraded-source warnings (`backend/app/api/monitoring.py:42-46`); the UI says it used stored observations (`frontend/src/main.tsx:67`).

<a id="doc-08-migration-sequence"></a>
### Migration sequence

1. **Keep backend contracts as the boundary.** Continue using the typed API client in `frontend/src/api.ts`; do not hard-code database values or duplicate scoring in components.
2. **Wire the complete route set.** Register the components and links listed above. Preserve the route error boundary and retry/reload/dashboard actions (`frontend/src/main.tsx:76-80`).
3. **Add source status as independent state.** Load `/api/sources/status` through the API client; render the strip and retryable “Source status unavailable” state without gating the dashboard (`frontend/src/SourceStatus.tsx:44-52,117-128`). Render `SourceStatusNotice` only for the relevant kind on `/social` or `/apps` (`frontend/src/main.tsx:79-80`).
4. **Treat outage buttons as demo operations only.** Controls call simulated outage/restore endpoints; preserve the clear simulated label, prevent taking `demo_dataset` offline, and do not imply a live-source toggle (`backend/app/sources.py:113-156`).
5. **Keep scan warnings optional.** Read `source_warnings` if present and show a calm banner only for a non-empty array. Do not fail rendering if an older scan response omits the field; the backend makes warnings additive (`backend/app/api/monitoring.py:42-46`; manual compatibility check: `docs/FRONTEND_MANUAL_CHECKS.md:1-8`).
6. **Preserve result and investigation semantics.** The backend remains the authority for score/evidence; profile edits update the official comparison baseline, while a re-scan must retain existing analyst status (`backend/app/detection/engine.py:28-51,83-98`).
7. **Do not create schema migrations for UI-only state.** The simulated registry is process memory, and there are no post-baseline migration files. If future work requires durable source configuration/history, that is a new backend/schema design rather than a frontend port.

<a id="doc-08-compatibility-and-validation-checklist"></a>
### Compatibility and validation checklist

- Confirm TypeScript/API field names match backend schemas, including optional `source_warnings`.
- Confirm all eight route paths above render and in-app navigation remains usable.
- Test status API failure separately from overview/list API failure; the source strip should not blank the page.
- Test scan without warnings, scan with a simulated warning, and old scan payload without `source_warnings`.
- Confirm source pages only show notices for their own kind.
- Confirm demo-source outage is refused and unknown source IDs return 404; do not test by contacting external platform services.
- Re-run backend tests and the frontend production build after code changes. The documented commands are `..\.venv\Scripts\python.exe -m pytest` from `backend` and `npm run build --prefix frontend` from the repository root (`README.md:64-66`).
- Review the QA browser script's literal score expectations before relying on check 13: it asserts `82.30` and `82.88` (`scripts/run_checks_1_to_13.mjs:608-626`). This documentation pass did not execute the QA scripts.

<a id="doc-08-context-cross-check-and-uncertainties"></a>
### Context cross-check and uncertainties

No user-provided rationale attachment was available in the task context visible for this pass. No claims from a missing attachment are represented as verified. The baseline and post-baseline feature list above are based on Git history; present behavior is based on cited current code. Browser-script assertions are not reported as passing test results.

---

<a id="doc-09"></a>
## Document 09: Demo Script and Run-Observed Sample Data

_Source document: `09_DEMO_SCRIPT_AND_SAMPLE_DATA.md`._

<a id="doc-09-table-of-contents"></a>
### Table of contents

- [Evidence and capture environment](#doc-09-evidence-and-capture-environment)
- [Three-minute demo flow](#doc-09-three-minute-demo-flow)
- [Run-observed seeded data](#doc-09-run-observed-seeded-data)
- [Run-observed API examples](#doc-09-run-observed-seeded-data)
- [Design mock data and states](#doc-09-design-mock-data-and-states)
- [Interpretation cautions](#doc-09-interpretation-cautions)

<a id="doc-09-evidence-and-capture-environment"></a>
### Evidence and capture environment

**RUN-OBSERVED:** The standard demo seed was loaded into a fresh in-memory SQLite database, then exercised through FastAPI `TestClient`. The seed counts were 5 brands, 13 social candidates, and 11 app candidates. A temporary directory was used for generated synthetic logo files. `LLM_API_KEY` was explicitly set to an empty value before app import, so the analyst sample below used deterministic fallback and did not call an LLM provider. The source-status registry was reset before capture.

The app was started from working directory `backend` with:

```powershell
& 'C:\1. Mine\Coding\ByteXL\BrandShield\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8002
```

`GET /api/health` on port 8002 returned `{"status":"ok","database":"connected"}`. Port 8001 was already occupied and responding to the same health route, so the separately started documentation process used 8002.

The following command was executed from `backend`; seed output reported counts from the configured local database, which already contained one additional brand of unknown provenance:

```powershell
..\ .venv\Scripts\python.exe -m app.seed
```

That command is idempotent according to `seed_demo_data` in `backend/app/seed.py:38-108`. It reported 6 total brands, 13 social candidates, and 11 app candidates for the configured database. It generated/refreshed local ignored demo logo assets. The five-brand examples below are from the isolated run, not an assertion that the configured local database has only five brands.

The idempotent seed command actually invoked from working directory `backend` was:

```powershell
& 'C:\1. Mine\Coding\ByteXL\BrandShield\.venv\Scripts\python.exe' -m app.seed
```

**VERIFIED:** `seed_demo_data` constructs five standard brand records and 24 total synthetic candidates (13 social plus 11 app) in `backend/app/seed.py:12-16, 69-108`. The synthetic catalog contains more than one Nike social candidate and multiple Nike app candidates. All displayed names and scores below came from observed API responses, not a frontend mock.

<a id="doc-09-three-minute-demo-flow"></a>
### Three-minute demo flow

| Approx. time | Screen/action | Run-observed expected content |
|---:|---|---|
| 0:00–0:25 | Open `/` and choose Nike. | Dashboard summary: 7 candidates, 7 detections, 5 detected threats, 4 high-risk, 6 lookalikes. There are 4 social candidates and 3 app candidates. |
| 0:25–0:55 | Open the N1ke Shopping threat. | HIGH, score 82.30, `SUSPICIOUS_PUBLISHER`, publisher `Market Mall Demo`; six ordered evidence rows are present. |
| 0:55–1:20 | Show look-alike details. | `N1ke Shopping` maps Nike to normalized `n1ke shopping`, similarity 100, and records `ADDED_WORDS` with token `shopping`. The detail also displays the other evidence factors rather than treating name similarity alone as proof. |
| 1:20–1:45 | Open `/check` and run selected examples. | This invokes name analysis with selected, brand-aware presets. Exact selection, curated preset count, and row copy should follow [04_FRONTEND_CODE_MAP.md](#doc-04) and [06_UX_STATE_MATRIX_AND_COPY.md](#doc-06); no score/detection record is created by the name-analysis endpoint. |
| 1:45–2:20 | On dashboard, simulate the Instagram outage, then scan. | Instagram changes to `DEGRADED`; other unconfigured sources remain grey chips. Scan completes from stored observations and returns one warning for Instagram only; dashboard banner reads “Scan completed using stored observations. Degraded sources: Instagram live monitor.” |
| 2:20–2:35 | Restore Instagram. | The source returns to `NOT_CONFIGURED`, not `ONLINE`, because live collection is not configured. No live connection is implied. |
| 2:35–3:00 | Open Brand Profile. | Show legitimate brand details and official assets. Saving/editing should be performed only if the demo database is intended to retain changes. |

The score and summary values above are from the isolated seeded API run. Run timestamps and UUIDs vary between runs. API sample exact fields below use the single capture.

<a id="doc-09-run-observed-seeded-data"></a>
### Run-observed seeded data

<a id="doc-09-seed-summary"></a>
#### Seed summary

```json
{
  "brands": 5,
  "official_social_accounts": 5,
  "official_apps": 5,
  "official_assets": 10,
  "social_candidates": 13,
  "app_candidates": 11
}
```

<a id="doc-09-brand-list-and-nike-profile-samples"></a>
#### Brand list and Nike profile samples

`GET /api/brands` returned the five standard synthetic brands:

```json
[
  {"name":"Adidas","slug":"adidas","description":"Adidas demo profile","official_domain":"adidas.demo.example","logo_url":"/static/logos/adidas-official.png","status":"ACTIVE"},
  {"name":"Apple","slug":"apple","description":"Apple demo profile","official_domain":"apple.demo.example","logo_url":"/static/logos/apple-official.png","status":"ACTIVE"},
  {"name":"Nike","slug":"nike","description":"Nike demo profile","official_domain":"nike.demo.example","logo_url":"/static/logos/nike-official.png","status":"ACTIVE"},
  {"name":"Samsung","slug":"samsung","description":"Samsung demo profile","official_domain":"samsung.demo.example","logo_url":"/static/logos/samsung-official.png","status":"ACTIVE"},
  {"name":"Spotify","slug":"spotify","description":"Spotify demo profile","official_domain":"spotify.demo.example","logo_url":"/static/logos/spotify-official.png","status":"ACTIVE"}
]
```

The list response also has generated `id`, `created_at`, and `updated_at` values for each brand; these are omitted above because the values vary per run. `GET /api/brands/{nike_id}` returned:

```json
{
  "name":"Nike",
  "slug":"nike",
  "description":"Nike demo profile",
  "official_domain":"nike.demo.example",
  "logo_url":"/static/logos/nike-official.png",
  "status":"ACTIVE",
  "id":"147e9f04-0392-4a37-ba5a-55edc0b27d4e",
  "created_at":"2026-10-07T23:23:59",
  "updated_at":"2026-10-07T23:23:59"
}
```

The associated official assets, social account, and official app were:

```json
{
  "assets": [
    {"asset_type":"DOMAIN","value":"nike.demo.example","label":"Nike demo domain"},
    {"asset_type":"LOGO","value":"/static/logos/nike-official.png","label":"Nike synthetic local logo"}
  ],
  "social_accounts": [
    {
      "platform":"INSTAGRAM",
      "handle":"nike",
      "profile_url":"https://social.demo.example/nike",
      "display_name":"Nike",
      "verified":true,
      "description":"Synthetic official Nike social account",
      "status":"ACTIVE"
    }
  ],
  "apps": [
    {
      "platform":"GOOGLE_PLAY",
      "app_name":"Nike App",
      "package_identifier":"example.demo.nike.official",
      "store_url":"https://store.demo.example/nike-official",
      "developer_name":"Nike Demo Publisher",
      "developer_identifier":"demo.nike.official",
      "description":"Synthetic official Nike application",
      "logo_url":"/static/logos/nike-official.png",
      "status":"ACTIVE"
    }
  ]
}
```

The actual responses also include record IDs, `brand_id` values for the related rows, and `created_at` / `updated_at` timestamps. Those identifier/time fields are omitted from this combined compact sample; no profile or asset value has been changed to a mock value.

<a id="doc-09-nike-dashboard-sample"></a>
#### Nike dashboard sample

`GET /api/dashboard/overview?brand_id=<Nike UUID>` returned the following summary:

```json
{
  "brand": {"name": "Nike"},
  "summary": {
    "protected_brands": 1,
    "total_candidates": 7,
    "total_detections": 7,
    "detected_threats": 5,
    "high_risk": 4,
    "lookalikes": 6,
    "safe": 2,
    "low_risk": 1,
    "medium_risk": 0
  },
  "risk_distribution": [
    {"severity": "CRITICAL", "count": 0},
    {"severity": "HIGH", "count": 4},
    {"severity": "MEDIUM", "count": 0},
    {"severity": "LOW", "count": 1},
    {"severity": "SAFE", "count": 2}
  ],
  "source_distribution": [
    {"source": "Social Media", "count": 4},
    {"source": "App Stores", "count": 3}
  ],
  "threat_type_distribution": [
    {"threat_type": "SUSPICIOUS_PUBLISHER", "count": 2},
    {"threat_type": "LOOKALIKE_IDENTITY", "count": 3}
  ]
}
```

The observed recent-threat rows were:

| Candidate | Source | Publisher | Threat type | Score | Severity | Status |
|---|---|---|---|---:|---|---|
| N1ke Shopping | App Store | Market Mall Demo | SUSPICIOUS_PUBLISHER | 82.30 | HIGH | NEW |
| Nike Rewards Pro | App Store | Rewardworks Demo LLC | SUSPICIOUS_PUBLISHER | 82.88 | HIGH | NEW |
| Nike Running Club Local | Social Media | — | LOOKALIKE_IDENTITY | 49.00 | LOW | NEW |
| Nike Customer Help | Social Media | — | LOOKALIKE_IDENTITY | 81.76 | HIGH | NEW |
| N1ke Support | Social Media | — | LOOKALIKE_IDENTITY | 78.12 | HIGH | NEW |

The overview response includes one additional `last_scan` object; exact identifiers and timestamps are run-specific.

<a id="doc-09-n1ke-shopping-detail-complete-evidence-content"></a>
#### N1ke Shopping detail: complete evidence content

The observed `GET /api/detections/{id}` entry was:

```json
{
  "candidate": {"name": "N1ke Shopping", "source": "App Store", "publisher": "Market Mall Demo"},
  "status": "NEW",
  "threat_type": "SUSPICIOUS_PUBLISHER",
  "severity": "HIGH",
  "risk_score": 82.3,
  "confidence": 100.0,
  "official_match": false,
  "lookalike_detected": true,
  "evidence": [
    {
      "signal_type": "OFFICIAL_ASSET_MATCH",
      "available": true,
      "score": null,
      "priority": 1,
      "details": {"matched": false, "matched_by": null, "official_app_id": null}
    },
    {
      "signal_type": "NAME_SIMILARITY",
      "available": true,
      "score": 100.0,
      "priority": 2,
      "details": {
        "official_name": "Nike",
        "candidate_name": "N1ke Shopping",
        "normalized_official": "nike",
        "normalized_candidate": "n1ke shopping",
        "similarity": 100.0,
        "detected": true,
        "transformations": [{"type": "ADDED_WORDS", "tokens": ["shopping"]}]
      }
    },
    {
      "signal_type": "LOOKALIKE_NAME",
      "available": true,
      "score": 100.0,
      "priority": 3,
      "details": {
        "detected": true,
        "official_name": "Nike",
        "candidate_name": "N1ke Shopping",
        "transformations": [{"type": "ADDED_WORDS", "tokens": ["shopping"]}]
      }
    },
    {
      "signal_type": "PUBLISHER_MISMATCH",
      "available": true,
      "score": 100.0,
      "priority": 4,
      "details": {
        "result": "MISMATCH",
        "candidate_developer": "Market Mall Demo",
        "official_developers": ["Nike Demo Publisher"]
      }
    },
    {
      "signal_type": "DESCRIPTION_SIMILARITY",
      "available": true,
      "score": 27.37,
      "priority": 5,
      "details": {
        "candidate_description": "Character-swap app name with a different synthetic publisher.",
        "official_reference_count": 2
      }
    },
    {
      "signal_type": "LOGO_SIMILARITY",
      "available": true,
      "score": 90.62,
      "priority": 6,
      "details": {
        "official_logo": "/static/logos/nike-official.png",
        "candidate_logo": "/static/logos/candidate-shopping.png",
        "hash_algorithm": "dHash-64",
        "hamming_distance": 3,
        "visually_matches": true
      }
    }
  ]
}
```

The API’s full detail response additionally contains generated IDs, candidate IDs, brand ID, and timestamps. Those identifiers are omitted here because they are random per isolated run; no signal row or detail field above is omitted.

<a id="doc-09-name-analysis-sample"></a>
#### Name analysis sample

`POST /api/analyze/name` with `{"official_name":"Nike","candidate_name":"N1ke"}` returned:

```json
{
  "official_name": "Nike",
  "candidate_name": "N1ke",
  "normalized_official": "nike",
  "normalized_candidate": "n1ke",
  "similarity": 100.0,
  "detected": true,
  "transformations": [
    {"type": "CHARACTER_SUBSTITUTION", "position": 1, "from": "i", "to": "1"}
  ]
}
```

<a id="doc-09-source-status-samples"></a>
#### Source-status samples

The initial `GET /api/sources/status` returned four records:

| ID | Kind | Status | Message |
|---|---|---|---|
| `demo_dataset` | DEMO | ONLINE | Stored controlled observations are available. |
| `instagram` | SOCIAL | NOT_CONFIGURED | Live collection is not enabled in this prototype. Using stored observations. |
| `google_play` | APP | NOT_CONFIGURED | Live collection is not enabled in this prototype. Using stored observations. |
| `app_store` | APP | NOT_CONFIGURED | Live collection is not enabled in this prototype. Using stored observations. |

`POST /api/sources/instagram/simulate-outage` returned status `DEGRADED`, message `Source unreachable (simulated for demo). Showing last stored data.`, and `simulated: true`. Restore returned it to `NOT_CONFIGURED`, with `simulated: true` on the action response; a subsequent source-status snapshot reports `simulated: false`.

Observed action response bodies (timestamps are those of this capture):

```json
{
  "simulate_outage": {
    "id": "instagram",
    "name": "Instagram live monitor",
    "kind": "SOCIAL",
    "status": "DEGRADED",
    "message": "Source unreachable (simulated for demo). Showing last stored data.",
    "last_checked_at": "2026-10-07T23:24:00.171843+00:00",
    "last_success_at": null,
    "simulated": true
  },
  "restore": {
    "id": "instagram",
    "name": "Instagram live monitor",
    "kind": "SOCIAL",
    "status": "NOT_CONFIGURED",
    "message": "Live collection is not enabled in this prototype. Using stored observations.",
    "last_checked_at": "2026-10-07T23:24:00.223968+00:00",
    "last_success_at": null,
    "simulated": true
  }
}
```

Initial status rows have the same field shape. The demo row has `status: "ONLINE"` and its check/success timestamps set; each live row initially has `status: "NOT_CONFIGURED"` and `last_success_at: null`. Those exact messages are reproduced in the status table above.

<a id="doc-09-monitoring-scan-samples"></a>
#### Monitoring scan samples

The normal Nike scan completed with 7 candidates (4 social, 3 app), 2 safe, 1 low, 0 medium, 4 high, and 0 critical. Its `source_warnings` was empty:

```json
{
  "status": "COMPLETED",
  "candidate_count": 7,
  "social_candidate_count": 4,
  "app_candidate_count": 3,
  "safe_count": 2,
  "low_count": 1,
  "medium_count": 0,
  "high_count": 4,
  "critical_count": 0,
  "source_warnings": []
}
```

During the simulated Instagram outage, the scan still completed with the same candidate and severity counts. `source_warnings` contained exactly the one degraded source:

```json
{
  "status": "COMPLETED",
  "candidate_count": 7,
  "source_warnings": [
    {
      "id": "instagram",
      "name": "Instagram live monitor",
      "status": "DEGRADED",
      "message": "Source unreachable (simulated for demo). Showing last stored data."
    }
  ]
}
```

**VERIFIED/RUN-OBSERVED:** `NOT_CONFIGURED` sources remain visible in the status response, but do not appear in scan warnings. The degraded-only filter is covered in `backend/app/sources.py` and `backend/tests/test_sources.py`.

<a id="doc-09-investigation-and-mutation-samples"></a>
#### Investigation and mutation samples

The initial investigation read returned status `NEW`, with empty `notes`, `activity`, and `drafts`. In the isolated run:

- Status update to `INVESTIGATING` returned the new status and an activity event `STATUS_CHANGED` from `NEW` to `INVESTIGATING`.
- Adding the synthetic note `Handoff sample note; synthetic test data.` returned a note authored by `local-demo-analyst` and a `NOTE_ADDED` activity event.
- Creating an `APP_STORE` remediation draft returned `draft_type: "APP_STORE"` and a body beginning `DRAFT ONLY — NOT SENT`. The sample draft includes the 82.30 HIGH score and six evidence signal names.

These were performed only in the isolated in-memory database. Exact schemas and full UI copy are documented separately.

Compact response bodies from the same run:

```json
{
  "investigation_initial": {
    "detection_id": "45210ff6-9165-47bb-9f06-43ab64c5cf58",
    "status": "NEW",
    "notes": [],
    "activity": [],
    "drafts": []
  },
  "status_post": {
    "detection_id": "45210ff6-9165-47bb-9f06-43ab64c5cf58",
    "status": "INVESTIGATING",
    "activity": [
      {
        "id": "d8452da1-d30b-41eb-9062-2a02c97b295c",
        "event_type": "INVESTIGATION_CREATED",
        "previous_value": null,
        "new_value": "NEW",
        "details": {"source": "persisted detection"},
        "actor": "local-demo-analyst",
        "created_at": "2026-10-07T23:24:00"
      },
      {
        "id": "ef484a73-e2b2-4a89-ba59-bc7eedcd8aa7",
        "event_type": "STATUS_CHANGED",
        "previous_value": "NEW",
        "new_value": "INVESTIGATING",
        "details": {},
        "actor": "local-demo-analyst",
        "created_at": "2026-10-07T23:24:00"
      }
    ],
    "notes": [],
    "drafts": []
  },
  "note_post": {
    "detection_id": "45210ff6-9165-47bb-9f06-43ab64c5cf58",
    "status": "INVESTIGATING",
    "notes": [
      {
        "id": "10d42250-5f06-4b72-a126-303b8e1d628a",
        "content": "Handoff sample note; synthetic test data.",
        "actor": "local-demo-analyst",
        "created_at": "2026-10-07T23:24:00"
      }
    ],
    "activity": [
      {
        "id": "9b7f24f7-40a4-4a48-b83c-c3a057957da2",
        "event_type": "NOTE_ADDED",
        "previous_value": null,
        "new_value": null,
        "details": {"note_id": "10d42250-5f06-4b72-a126-303b8e1d628a"},
        "actor": "local-demo-analyst",
        "created_at": "2026-10-07T23:24:00"
      }
    ],
    "drafts": []
  },
  "draft_post": {
    "id": "4aee8bdc-16ed-4b46-b943-cff1d0a3d6f2",
    "draft_type": "APP_STORE",
    "content": "DRAFT ONLY — NOT SENT\n\nRemediation notice template\n\nProtected brand: Nike\nCandidate: N1ke Shopping\nSource URL: https://store.demo.example/example.demo.n1ke.shopping\nRisk score: 82.30\nSeverity: HIGH\nPublisher/developer: Market Mall Demo\nDetection classification: SUSPICIOUS PUBLISHER\nEvidence signals: OFFICIAL ASSET MATCH, NAME SIMILARITY, LOOKALIKE NAME, PUBLISHER MISMATCH, DESCRIPTION SIMILARITY, LOGO SIMILARITY\n\nPlease review this report and take appropriate action under your applicable impersonation or trademark policy. This is an analyst draft based on persisted deterministic evidence; it does not assert confirmed malicious activity unless separately investigated.",
    "evidence_summary": [
      "OFFICIAL ASSET MATCH",
      "NAME SIMILARITY",
      "LOOKALIKE NAME",
      "PUBLISHER MISMATCH",
      "DESCRIPTION SIMILARITY",
      "LOGO SIMILARITY"
    ],
    "actor": "local-demo-analyst",
    "created_at": "2026-10-07T23:24:00"
  }
}
```

The generated UUIDs and timestamps shown are from this one isolated run and are not stable API fixtures.

<a id="doc-09-analyst-sample"></a>
#### Analyst sample

The analysis endpoint was invoked with the API key environment variable blanked. It returned `provider: "deterministic_fallback"`, summary/rationale based on persisted evidence, and `source_facts.risk_score: 82.3`, `source_facts.severity: "HIGH"`. The long response (more than 80 pretty-printed lines) is summarized here; its key observed fact is that the analyst describes evidence and does not replace the deterministic score or severity.

<a id="doc-09-error-samples"></a>
#### Error samples

Invalid hostname input to `POST /api/brands` returned HTTP 422:

```json
{
  "detail": [{
    "type": "value_error",
    "loc": ["body", "official_domain"],
    "msg": "Value error, Enter a hostname such as example.com, without a scheme or path",
    "input": "https://bad.example/path"
  }]
}
```

Posting the already-registered Nike Instagram handle returned HTTP 409:

```json
{"detail": "This platform handle is already registered"}
```

<a id="doc-09-design-mock-data-and-states"></a>
### Design mock data and states

Use these stable example facts for a mock dashboard or detail screen:

| Item | Value |
|---|---|
| Protected brand | Nike |
| Candidate count | 7 |
| Threat count | 5 |
| High-risk count | 4 |
| N1ke Shopping | 82.30 / HIGH / SUSPICIOUS_PUBLISHER / NEW |
| Nike Rewards Pro | 82.88 / HIGH / SUSPICIOUS_PUBLISHER / NEW |
| Nike Running Club Local | 49.00 / LOW / LOOKALIKE_IDENTITY / NEW |
| Normal source-warning state | Empty list; do not show degraded banner |
| Simulated outage state | One Instagram warning; stored-data scan still completed |
| App/social live collector state | NOT_CONFIGURED; grey status-chip appearance |
| Source status endpoint failure | “Source status unavailable” state |

Use these empty/error/success conditions to test layout:

1. Empty dashboard threat list: no recent threats for the selected brand.
2. Sources loading, then success with four chips.
3. Sources request fails: status-unavailable text plus a retry affordance.
4. Normal scan: results render, no warning banner.
5. Degraded scan: results still render with one calm amber banner.
6. Name-analysis request fails: preserve readable error and allow another attempt.
7. Investigation with no activity/notes/drafts: empty states remain visible without implying live remediation.

Exact strings, route states, and button semantics are listed in [06_UX_STATE_MATRIX_AND_COPY.md](#doc-06). The frontend designer should use those files as the copy source of truth.

<a id="doc-09-interpretation-cautions"></a>
### Interpretation cautions

- The records are controlled synthetic observations. They do not establish live Instagram, Google Play, or Apple App Store collection.
- A `NOT_CONFIGURED` source is not necessarily an observed outage; it means live collection is not enabled in the prototype.
- The source outage is a process-local demo simulation; it is not a real external-source health check.
- A detection or lookalike match is not an independent finding of malicious intent. Preserve the UI’s analyst-review and draft-only cautions.
- The runtime seed output from the configured local database differed from the isolated five-brand seed by one extra brand. Its provenance was not verified and is intentionally omitted from sample records.

---

<a id="doc-10"></a>
## Document 10: BrandShield — QA Script Dependencies and Selectors

_Source document: `10_QA_SCRIPT_DEPENDENCIES.md`._

<a id="doc-10-contents"></a>
### Contents

- [Scripts and execution model](#doc-10-scripts-and-execution-model)
- [Environment and exact commands](#doc-10-environment-and-exact-commands)
- [Check coverage](#doc-10-check-coverage)
- [DOM selectors and asserted strings](#doc-10-dom-selectors-and-asserted-strings)
- [Side effects and safety](#doc-10-side-effects-and-safety)
- [Known gaps and unverified context](#doc-10-known-gaps-and-unverified-context)

<a id="doc-10-scripts-and-execution-model"></a>
### Scripts and execution model

The repository contains three standalone Node scripts, added by commit `4aaa37d`:

- `scripts/run_checks_1_to_13.mjs` — thirteen browser-driven source-status, outage, recovery, and regression checks.
- `scripts/test_check_12.mjs` — focused backend-down/recovery test.
- `scripts/verify_qa_browser.mjs` — focused source-card rendering check.

They are **not** npm package scripts (`frontend/package.json:6-10` defines only `dev`, `build`, and `preview`). They use Node built-ins (`child_process`, `fs`, `path`, `os`), global `fetch`/`WebSocket`, and Chrome's remote debugging protocol rather than a declared Playwright/Puppeteer dependency (`scripts/run_checks_1_to_13.mjs:1-4,8-14,24-27`; analogous setup in `scripts/test_check_12.mjs:1-18` and `scripts/verify_qa_browser.mjs:1-18`).

<a id="doc-10-environment-and-exact-commands"></a>
### Environment and exact commands

<a id="doc-10-prerequisites"></a>
#### Prerequisites

- Windows, Node.js 24 LTS and npm, as specified in `README.md:11-13`.
- Google Chrome at the hard-coded path `C:\Program Files\Google\Chrome\Application\chrome.exe` (`scripts/run_checks_1_to_13.mjs:8`; same in the other scripts).
- Frontend dev server at `http://127.0.0.1:5173` and API at `http://127.0.0.1:8001`. The scripts navigate to port 5173 and call the backend on port 8001 (`scripts/run_checks_1_to_13.mjs:8-17,518-545,594-603`), while the ordinary README development API command uses port 8000 (`README.md:51-61`). Start the QA API on 8001 explicitly.
- Set `VITE_API_BASE_URL=http://127.0.0.1:8001` for the QA frontend process. `frontend/src/api.ts:1` otherwise defaults to `http://localhost:8000`; the example config uses 8001 (`.env.example:11-12`). The local `.env` was intentionally not opened.
- A migrated and seeded local database, and the controlled synthetic candidates expected by the assertions (`README.md:35-48`; `backend/app/seed.py`).

<a id="doc-10-installbuildsetup-commands"></a>
#### Install/build/setup commands

Commands documented by the project:

```powershell
npm install --prefix frontend
```

From `backend`, after the local Python environment and database are ready:

```powershell
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m app.seed
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

From the repository root, start the frontend:

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8001"; npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173
```

To use a normal API command instead of the bundled smoke scripts' process restart, start the API from `backend` on port 8001 (as above). The repo's usual local API command uses port 8000.

Run scripts from the repository root:

```powershell
node scripts/run_checks_1_to_13.mjs
node scripts/test_check_12.mjs
node scripts/verify_qa_browser.mjs
```

The README's normal API command is `..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000` from `backend` (`README.md:51-56`); it does not satisfy scripts hard-coded to port 8001. `test_check_12.mjs` and check 12 restart the server with `.venv\Scripts\python.exe -m uvicorn backend.app.main:app ...` from the repository root (`scripts/test_check_12.mjs:91-96`; `scripts/run_checks_1_to_13.mjs:536-545`). Verify that this alternate module path is importable in the QA environment before relying on automatic recovery.

<a id="doc-10-check-coverage"></a>
### Check coverage

`run_checks_1_to_13.mjs` asserts these exact scenarios and titles (`scripts/run_checks_1_to_13.mjs:114-626`):

1. Baseline four source cards with Nike selected.
2. Baseline scan: 7 Nike candidates, no degraded-source banner.
3. Simulated Instagram outage; only that card degrades.
4. Scan during Instagram outage: warning mentions Instagram/stored observations; expected metrics include 7 candidates, 5 threats, and 4 high-risk in this script.
5. `/social` notice mentions Instagram while `/apps` does not.
6. Google Play outage: dashboard and `/apps` mention Google Play; `/social` does not.
7. Both app stores degraded: warning mentions Google Play and Apple App Store.
8. Restore app stores: warning disappears and they return to `NOT_CONFIGURED`.
9. Instagram outage persists over a browser hard reload while the backend process remains alive; next scan warns again.
10. Selecting Google Play remains selected while Apple App Store is toggled.
11. Adidas scan during Instagram outage expects 5 candidates and an Instagram warning.
12. Backend-down rendering and Retry recovery; the script terminates the port-8001 listener, starts an API process, and retries.
13. Regression assertions for exact detection scores/severities and a safe official Nike detection.

`test_check_12.mjs` independently repeats the port-8001 failure/recovery case (`:69-139`). `verify_qa_browser.mjs` verifies source-card render/status classes and layout via DOM and computed-style evaluation (`:60-112`).

<a id="doc-10-dom-selectors-and-asserted-strings"></a>
### DOM selectors and asserted strings

The scripts use CSS selectors directly in Chrome DevTools Protocol `Runtime.evaluate`; these selectors are part of the test contract:

- **Source cards/controls:** `.source-card`, `.source-card-name`, `.source-card-status`, `.source-action-btn`, `.source-dot`, `.source-selected-tag`, `.source-selection-caption`.
- **Dashboard/scan:** `button.primary`, `.scan-source-warning`, `.metric strong`, `.scanline`.
- **Source-specific pages:** `.source-page-notice`; pages are loaded at `/social` and `/apps`.
- **Unavailable/error/recovery:** `.source-status-unavailable`, `.view-error`, `.loader`, `button`; a retry button is located by visible text containing `"Retry"`.
- **Detection regression:** `tbody tr`, then `td`; candidate names `"N1ke Shopping"` and `"Nike Rewards Pro"`. The safe-official API request is `GET http://127.0.0.1:8001/api/detections?brand_id=c75cace3-ff65-4a6e-ae64-7b5077e15997&severity=SAFE` (`scripts/run_checks_1_to_13.mjs:594-603`).
- **Script literals by role:** Actual string assertions include `"Instagram live monitor"`, `"Google Play live monitor"`, `"Apple App Store live monitor"`, `"stored observations"`, `"Restore"`, and `"Adidas"` (`scripts/run_checks_1_to_13.mjs:170,207-208,280,313-314,422,474-477`). `"Scan now"` appears only in a comment (`:127`). `"Nike"` is a brand-selection input (`:492`), not an asserted selected brand in check 1; the script does assert the exact candidate `"Nike Rewards Pro"` (`:612,619-621`). The browser verifier checks card selection/status/recovery, but does not assert the listed warning phrases, `"Scan now"`, or the exact `"Restore"` button label (`scripts/verify_qa_browser.mjs:212-218,251-257`).
- **Screenshot output:** `screenshots/qa_checks/` (`scripts/run_checks_1_to_13.mjs:6-7`; `scripts/test_check_12.mjs:7-8`).

When an assertion fails, first distinguish a selector/UI regression from data drift. The script's check 13 currently expects `N1ke Shopping` at `82.30 HIGH` and `Nike Rewards Pro` at `82.88 HIGH` (`scripts/run_checks_1_to_13.mjs:617-626`). Later commits added logo evidence and alter scoring semantics (`backend/app/detection/engine.py:13,34-51`); these literals need a current seeded run before they can be treated as correct. The QA script source alone does not establish that the current assertions pass.

<a id="doc-10-side-effects-and-safety"></a>
### Side effects and safety

- `run_checks_1_to_13.mjs` creates `screenshots/qa_checks/`, writes PNGs there, and uses Chrome profile data under `os.tmpdir()` (`:5-7,72-78`). It also starts and kills a Chrome process.
- `test_check_12.mjs` uses PowerShell `Get-NetTCPConnection -LocalPort 8001` and `Stop-Process -Id ... -Force` (`:70-84`). `run_checks_1_to_13.mjs` does the same in check 12 (`:518-527`). This can forcibly terminate **any** process owning port 8001; use only in an isolated local QA session with that port reserved.
- Both check-12 scripts start a detached backend process for recovery (`scripts/run_checks_1_to_13.mjs:536-545`; `scripts/test_check_12.mjs:91-99`). Confirm and stop that process intentionally after QA.
- Outage toggles modify only the in-memory demo registry but change subsequent scan warnings until restored or the backend restarts (`backend/app/sources.py:64-82,113-156`).
- These scripts are browser smoke checks, not pure unit tests. The code's `console.table` output is an assertion summary generated by the script; no successful run is claimed in this documentation.

<a id="doc-10-known-gaps-and-unverified-context"></a>
### Known gaps and unverified context

- No user-provided rationale attachment was available in the task context visible for this pass. Consequently, no rationale-originated test assumptions are presented as verified.
- No scripts were executed for this docs-only task. Dependencies and assertions above are read from the current source.
- Port configuration has conflicting defaults: `frontend/src/api.ts:1` falls back to 8000, `.env.example:12` selects 8001, the README's standard API command is 8000, and these browser scripts call 8001. The explicit QA environment override above avoids depending on the uninspected local `.env`.
- Script expectations should be refreshed/confirmed against current data before publishing a QA pass: notably check 4's `"4"` high-risk expectation, check 13's literal scores, and the automatic restart import path. Source code/history alone do not confirm these assertions against a running database.
- The `18fb654` baseline-to-HEAD migration is additive on the frontend/API but has no post-baseline Alembic revision, as documented in `01_CHANGELOG_BY_COMMIT.md` and `08_MIGRATION_GUIDE_OLD_FRONTEND_TO_HEAD.md`.

---

<a id="doc-11"></a>
## Document 11: Frontend Redesign Contract Summary

_Source document: `11_FRONTEND_REDESIGN_CONTRACT_SUMMARY.md`._

<a id="doc-11-table-of-contents"></a>
### Table of contents

- [Purpose](#doc-11-purpose)
- [What the redesign may change](#doc-11-what-the-redesign-may-change)
- [What the redesign must preserve](#doc-11-what-the-redesign-must-preserve)
- [Prioritized UX opportunities observed in code](#doc-11-prioritized-ux-opportunities-observed-in-code)
- [Detailed references](#doc-11-detailed-references)

<a id="doc-11-purpose"></a>
### Purpose

This is the short implementation contract for a redesign of the current BrandShield frontend. The detailed endpoint, scoring, styling, state/copy, and migration references are in the linked documents; this summary is not a substitute for those contracts.

<a id="doc-11-what-the-redesign-may-change"></a>
### What the redesign may change

- Page composition, layout, spacing, typography, colors, shadows, decorative imagery, animations, and responsive arrangements.
- How dashboard metrics, charts, source cards, detections, evidence, profile forms, and investigation history are visually grouped, provided their data and interactions remain equivalent.
- Component boundaries and internal state organization, including decomposing the dense JSX currently in `frontend/src/main.tsx` (80 physical lines; see `04_FRONTEND_CODE_MAP.md`).
- How loading, empty, error, and success states are styled, provided each state remains available and retains its retry/action semantics.
- Visual styling of source-status chips and scan alerts. Keep the severity/status distinction and do not present `NOT_CONFIGURED` as a live outage.

<a id="doc-11-what-the-redesign-must-preserve"></a>
### What the redesign must preserve

1. **Routes and API contract:** Keep `/`, `/profile`, `/social`, `/apps`, `/threats`, `/threats/:id`, `/lookalikes`, and `/check`, plus the existing backend routes and payload/response fields. The route and client maps are in [04_FRONTEND_CODE_MAP.md](#doc-04) and [02_BACKEND_API_CONTRACT.md](#doc-02).
2. **Detection authority:** The deterministic backend owns the official match, evidence, score, confidence, severity, and threat type. The frontend and AI Analyst must not recompute or mutate those fields. See [03_DETECTION_AND_SCORING_RULES.md](#doc-03) and [07_INVARIANTS_DO_NOT_BREAK.md](#doc-07).
3. **Scan warning semantics:** Only `DEGRADED` sources are in `source_warnings`. A normal scan has an empty list; `NOT_CONFIGURED` remains visible in the source strip but is not a warning. Keep the calm banner copy “Scan completed using stored observations. Degraded sources: {names}.” (`frontend/src/main.tsx:53-55`; `backend/app/sources.py:99-112`).
4. **Honest source claims:** The interface must continue to say live collectors are planned/not implemented. Demo outage controls are in-memory simulations and must remain clearly labelled “demo only”; restore returns a live source to `NOT_CONFIGURED`, not `ONLINE` (`frontend/src/SourceStatus.tsx:69-91,109-122`; `backend/app/sources.py:115-157`).
5. **Safety copy and boundaries:** Preserve “DRAFT ONLY — NOT SENT”, “Drafts are local templates and are never sent.”, “Similarity alone is not proof of maliciousness.”, and “This explanation does not change the authoritative score, severity, evidence, or investigation decision.” The first is in generated remediation draft content; the others are visible in the investigation/check screens (`backend/app/api/investigations.py:74-96`; `frontend/src/main.tsx:75`; `frontend/src/CheckName.tsx:178`).
6. **Human investigation actions:** Status, notes, activity, and remediation drafts retain their distinct behaviors. A draft is not sent externally; a note/status action remains associated with investigation history (`backend/app/api/investigations.py:31-96`; details in [07_INVARIANTS_DO_NOT_BREAK.md](#doc-07)).
7. **Profile validation:** Retain client and server validation for hostname-only domains, URL formats, social handles, package identifiers, duplicates, and uploaded image requirements. Preserve readable inline errors and server 409/422 handling (`frontend/src/BrandProfileEditor.tsx:189-285`; `backend/app/schemas.py:9-67`; [06_UX_STATE_MATRIX_AND_COPY.md](#doc-06)).
8. **No browser-to-provider calls or client secrets:** The browser’s analyst method calls the backend `/api/detections/{id}/analyze`; it does not call a model provider. Do not put server provider keys or direct provider requests in the bundle (`frontend/src/api.ts:4,58-59`; `backend/app/analyst.py:1-240`).
9. **Investigation semantics:** Keep permitted status transitions and blank-note disabling; status changes, notes, and drafts retain their activity-history behavior (`backend/app/api/investigations.py:31-96`; `frontend/src/main.tsx:75`; [07_INVARIANTS_DO_NOT_BREAK.md](#doc-07)).
10. **Dynamic class/accessibility contracts:** Keep source status-to-class mapping aligned with status colors; preserve button types, keyboard operation, role/aria state, and the identity of selected presets/cards. Styling and interactions are mapped in [05_STYLING_AND_CLASS_CONTRACT.md](#doc-05) and [04_FRONTEND_CODE_MAP.md](#doc-04).
11. **Formatting and count meanings:** Keep numeric precision and date formatting deliberate, and do not conflate candidates, detections, threats, and high-risk records. Formula and formatting references are in [07_INVARIANTS_DO_NOT_BREAK.md](#doc-07).

<a id="doc-11-prioritized-ux-opportunities-observed-in-code"></a>
### Prioritized UX opportunities observed in code

These are code-grounded opportunities, not user research findings:

1. **Keep errors recoverable without hiding the failure.** The dashboard has an error/retry branch, and the checker has separate fetch/error states; a redesign can make recovery more visible while preserving those states (`frontend/src/main.tsx:40-54`; `frontend/src/CheckName.tsx:41-50,160-179`).
2. **Clarify source status at a glance.** The source panel and page notices perform separate status requests, so transient display states can differ; a shared status cache could remove redundant requests if it preserves failure handling and refresh behavior (`frontend/src/SourceStatus.tsx:18-42,44-66`).
3. **Reduce the name-check interaction risk during requests.** The candidate field remains enabled during requests and Enter can start another check; disable or queue duplicate submissions without changing result semantics (`frontend/src/CheckName.tsx:92-104,169-179`; [06_UX_STATE_MATRIX_AND_COPY.md](#doc-06)).
4. **Make evidence hierarchy scannable.** Detection detail renders persisted evidence rows and serializes evidence details; a redesign can give signals a clearer hierarchy while preserving their exact values and provenance (`frontend/src/main.tsx:75`; [03_DETECTION_AND_SCORING_RULES.md](#doc-03)).
5. **Preserve clear empty states.** The overview/list and profile/check routes each have distinct empty/loading behavior. A more explicit empty state is appropriate, but should not silently substitute seeded values or imply live collection (`frontend/src/main.tsx:52-55`; `frontend/src/BrandProfileEditor.tsx:398-429`; `frontend/src/CheckName.tsx:160-164`).

<a id="doc-11-detailed-references"></a>
### Detailed references

- [00_README_INDEX.md](#doc-00) — repository snapshot, file inventory, versions, evidence labels, and final audit.
- [01_CHANGELOG_BY_COMMIT.md](#doc-01) — source history and per-commit frontend impact.
- [02_BACKEND_API_CONTRACT.md](#doc-02) — request/response and runtime examples.
- [03_DETECTION_AND_SCORING_RULES.md](#doc-03) — score authority, thresholds, transformations, and evidence.
- [04_FRONTEND_CODE_MAP.md](#doc-04) — routes, components, state, API functions, and browser APIs.
- [05_STYLING_AND_CLASS_CONTRACT.md](#doc-05) — styling and state-derived classes.
- [06_UX_STATE_MATRIX_AND_COPY.md](#doc-06) — visible strings and state branches.
- [07_INVARIANTS_DO_NOT_BREAK.md](#doc-07) — safety and data invariants.
- [08_MIGRATION_GUIDE_OLD_FRONTEND_TO_HEAD.md](#doc-08) — step-by-step upgrade.
- [09_DEMO_SCRIPT_AND_SAMPLE_DATA.md](#doc-09) — demo flow and observed seeded API values.
- [10_QA_SCRIPT_DEPENDENCIES.md](#doc-10) — browser automation assumptions.


# 12 - BrandShield Decision Log (the "why")

**Evidence label: PROVIDED CONTEXT.** This file records the reasoning and history
supplied by the project owner. It is NOT derived from source code. Documents
01 to 11 describe *what* the code does; this file explains *why* it was changed.
Where this file and the code disagree, the code is the truth for behaviour and
this file is the truth for intent. Report any disagreement instead of hiding it.

---

## 1. Contest context

Challenge: Kampus.VC "Digital Risk Protection - Social & App Monitoring".

| Rubric item | Weight | What judges look for |
|---|---:|---|
| Social Media Monitoring | 30% | impersonating profiles, fake pages, scam accounts; similar names, logos, branding; official accounts NOT flagged |
| App Store Monitoring | 30% | similar names, logos, publisher differences, similar descriptions; official apps NOT flagged |
| Brand Profile | 15% | clear definition of legitimate assets, validation, profile used to guide detection |
| User Experience | 15% | easy setup, readable detections, graceful handling of unavailable sources |
| Presentation and Demo | 10% | working prototype shown clearly |
| Bonus (about 5-10 pts) | - | look-alike name detection: character swaps, added words, spacing, WITHOUT over-flagging normal names |

Build method: the project owner used ChatGPT Go as the planning "mind" and VS Code
agents (Copilot, Codex, Antigravity) as implementers; Claude was later used as
reviewer and task planner. The competition was 24 hours.

Every feature below was chosen to close a specific rubric gap.

---

## 2. Design principles that drove every decision

1. **The deterministic engine decides; AI only explains.** Score, severity, threat
   type and evidence come from rules. The AI Analyst never changes them.
2. **Official assets are the baseline and are never flagged.** An official match
   forces score 0.00 and severity SAFE.
3. **Similarity alone is not proof.** Without corroboration a candidate cannot
   exceed 49 (never MEDIUM or higher).
4. **Be honest about what is simulated.** Live collectors are NOT built. The UI must
   say so. Outage controls are demo-only and in-memory.
5. **Remediation is draft-only.** Nothing is ever sent to a platform.
6. **No outbound fetching.** Logos are local files; the browser never calls an
   LLM provider; secrets never reach the frontend bundle.

---

## 3. Commit-by-commit reasoning

Hashes are from `git log`. Items marked (subject) are inferred from the commit
subject only; the owner did not supply further reasoning for them.

### Foundation (commits 1-9)

| Commit | Subject | Why |
|---|---|---|
| `3efb8a1` | first commit | repository start |
| `ae02afd` | establish project foundation | FastAPI + PostgreSQL + Alembic backend and React/Vite frontend shell with a health check, so every later stage had a working skeleton |
| `e89902b` | domain model and demo data | brands, official social accounts, official apps, official assets, and synthetic candidates (5 brands, 13 social + 11 app candidates). Synthetic data makes the demo reproducible and avoids scraping |
| `ddd8c7d` | connect frontend to backend API | (subject) dev configuration so the UI could reach the API |
| `0cff7e2` | deterministic detection engine and evidence | signals persisted as evidence rows so every score is explainable |
| `0c335cd` | threat monitoring dashboard | overview metrics, charts, scan and monitoring runs |
| `064db6b` | investigation and remediation workflow | status transitions, notes, audit activity, draft-only remediation |
| `f6fdb11` | AI analyst | server-side explanation of persisted evidence (Groq, with a deterministic fallback); advisory only |
| `7c614bb` | project docs and development assets | analyst backend and tests, Stage 04 report, placeholders |
| `a9bf143` | finalize competition demo workflow | polish of the investigation demo flow |

### Baseline for the "old frontend": `18fb654`

`feat: add protected brand profile and finalize demo hardening`.
A frontend built at or before this commit is the "older iteration". Everything
below happened AFTER it.

### Post-baseline work

#### `551a0f8` - Local logo similarity (booster-only)

- **Why:** the rubric names logo similarity explicitly for both social and app
  monitoring, and the LOGO signal was permanently "unavailable". The Brand Profile
  editor was also added in this window (see 3.1).
- **How:** 64-bit dHash (Pillow), Hamming distance, local files only under
  `data/logos`, served read-only at `/static/logos`; upload endpoint accepts PNG
  or JPEG up to 2 MB. Seed regenerates deterministic synthetic logos; they are
  not committed.
- **Why booster-only (important):** the first version averaged the logo score into
  the weighted mean. A DIFFERENT logo then LOWERED risk, so copycat apps such as
  Spotify Premium Player fell from HIGH to MEDIUM and AdidasStore Coupons from
  MEDIUM to LOW. That is wrong reasoning: not copying a logo is not evidence of
  safety. Fix: a logo score below 70 stays visible as evidence but is excluded
  from the weighted average (details record `counted: false`); 70 or above is
  weighted; 90 or above counts as corroboration that can lift the 49 cap.
- **Why the scale is distance/32:** the original `distance/64` scale made unrelated
  images score about 45-50, which looked like partial similarity. With
  `max(0, 1 - distance/32) * 100`, unrelated images score near 0 and a Hamming
  distance of 3 gives 90.62.
- **Caution:** the seeded near-copy logos (N1ke Shopping, Nike Rewards Pro) sit at
  exactly 90.62 (distance 3), the corroboration edge. Do not alter the logo seed
  code or the dHash scale without re-checking those two.

#### 3.1 Brand Profile editor (landed with `551a0f8`)

- **Why:** rubric item "allow an organization to define legitimate assets, with
  validation". `/profile` was read-only and the backend had create endpoints only.
- **Added:** `PATCH /api/brands/{id}`, `POST /api/brands/{id}/assets`, scoped
  `DELETE` for social accounts, apps and assets; CORS now allows PATCH and DELETE;
  server-side and client-side validation (hostname-only domain, URL, handle,
  package ID formats; duplicates -> 409; invalid -> 422); a "Run first scan"
  action that reuses the existing scan endpoint; logo upload control.
- **Design choice:** pending records are queued locally and saved together;
  partial failures are reported without losing the successful ones.

#### `9c87cb2` - Look-alike upgrade and first `/check` page

- **Why:** bonus credit for look-alike detection that handles swaps, added words
  and spacing without over-flagging.
- **Added rules:** wider confusables (`1 l ! | 0 3 4 5 @ $`, and `rn->m`, `vv->w`,
  `cl->d`), Unicode homoglyphs (for example Cyrillic U+0456) recorded with code
  points, and Damerau-Levenshtein edits (transposition, omission, insertion,
  repeated characters).
- **Why the anti-over-flagging design matters:** verdicts are TRANSFORMATION-based,
  not similarity-threshold-based. "Nkie" flags at 75% similarity while "Mike's
  Bakery" does NOT flag at 75%. A judge asking "what is your threshold?" gets the
  answer: there is none; similarity alone never flags.
- **Side effect:** "ADlDAS Deals" (lowercase L for I) now flags, which is a genuine
  typosquat the old rules missed.
- **Mistake made here:** `git add -A` accidentally committed 179 pytest temp files.
  See `e4720a9`.

#### `e4720a9` - Stop tracking pytest temp files

Repository hygiene. `backend/.pytest-tmp/` removed from tracking and ignored.
Files remain in history by choice; rewriting history close to a demo was judged
too risky.

#### `7732b9c` - Brand-aware `/check` with selectable presets and batch results

- **Why:** user testing showed three real problems: presets were hard-coded Nike
  examples regardless of the selected brand; each click replaced the single result
  so examples could not be compared; the Social/App toggle did nothing because
  `POST /api/analyze/name` accepts no platform context.
- **Fix:** curated presets for the five seeded brands (8 should-flag, 6 should-NOT-
  flag each, 70 total) verified against the real engine (70/70 matched); generated
  presets for other brands; presets are toggle buttons; "Run selected" runs them
  with concurrency 4 and shows a results table with pass/fail; "Recent checks"
  keeps the last 10; the toggle and its tile were removed.
- **Behaviour to remember:** clicking a preset only toggles selection. It does not
  run a check by itself.

#### `4aaa37d` - Source status, demo outage controls, error boundary, dashboard retry fix

- **Why:** rubric UX line "graceful handling of unavailable sources", without
  claiming live collection exists.
- **Backend:** in-memory registry (`demo_dataset` ONLINE; `instagram`, `google_play`,
  `app_store` NOT_CONFIGURED); `GET /api/sources/status`; demo-only
  `simulate-outage` and `restore`; the demo dataset cannot be broken (409);
  `POST /api/monitoring/scan` never fails because of a source and adds
  `source_warnings`.
- **Why warnings list DEGRADED sources only:** NOT_CONFIGURED is permanent, so
  including it would show an amber banner on every scan and make the outage demo
  invisible.
- **Frontend:** source strip, scan banner, per-page notices (SOCIAL sources on
  `/social`, APP sources on `/apps`), card selection (click selects, click again
  deselects, keyed by `source.id`), outage buttons inside each live card, one
  status-to-colour mapping, error boundary around routed content.
- **Bugs found and fixed in this stage:**
  1. Cards were native `<details>` elements, so messages were hidden and clicks
     expanded cards instead of selecting; outage buttons sat in a separate row.
  2. The dashboard went blank after a scan because an old backend returned no
     `source_warnings` and the UI read `.length` of undefined. Missing values are
     now treated as `[]`.
  3. Retry after a failed first load re-ran `load("")` and never re-fetched the
     brand list, so the dashboard could not recover without a manual reload.
  4. The status endpoint returned 404 until the backend process was restarted; the
     in-memory registry only exists after restart.
- **Cosmetic known issue:** the restore action response carries `simulated: true`
  while a later status snapshot reports `simulated: false` (documented in doc 02).
- **QA:** a 13-check browser script plus two focused scripts were added under
  `scripts/`; all 13 checks passed at the time.

---

## 4. Why the scoring numbers are what they are

| Rule | Value | Reason |
|---|---|---|
| Weights | name 25, look-alike 15, description 20, publisher 15, logo 15 | name evidence is strongest, but no single signal should dominate; official match is a gate, not a weight |
| Cap without corroboration | 49 | similarity alone must never reach MEDIUM |
| Corroboration | publisher mismatch (100), description >= 70, logo >= 90 | independent evidence beyond a name |
| Logo counted in average | only when >= 70 | an absent copy is not evidence of safety |
| Severity bands | 90 CRITICAL, 75 HIGH, 50 MEDIUM, 25 LOW, below 25 SAFE | simple, explainable bands |
| Official match | score 0.00, confidence 100, SAFE | official assets must never be flagged |

---

## 5. Numbers that changed (use the CURRENT column)

| Item | Before logo and look-alike work | Current |
|---|---|---|
| N1ke Shopping | 80.63 HIGH | 82.30 HIGH |
| Nike Rewards Pro | 81.33 HIGH | 82.88 HIGH |
| Nike high-risk count | 2 | 4 (N1ke Shopping, Nike Rewards Pro, Nike Customer Help, N1ke Support) |
| Nike Running Club Local | 49.00 LOW | 49.00 LOW (unchanged; the false-positive example) |
| Official assets | SAFE 0.00 | SAFE 0.00 (unchanged) |
| Backend tests | 14 | 28 |

Nike dashboard totals (current): 7 candidates, 7 detections, 5 detected threats,
4 high risk, 6 look-alikes, 2 safe, 1 low.

---

## 6. Decisions deliberately NOT taken

- No live scraping or platform APIs: out of scope for 24 hours; would require
  credentials and break reproducibility.
- No database writes for source outage state: it is process memory by design.
- No new Alembic migration after `18fb654`: every later change is additive at the
  API or runtime level.
- No LLM involvement in scoring.
- No social/app platform context in name analysis: the endpoint does not accept it,
  so the toggle was removed instead of faking it.
- No automatic takedown submission: drafts only.

---

## 7. Known limitations and operational notes

- **Live collectors are not implemented.** The UI says "Live collectors are planned,
  not implemented. Analysis uses stored observations only."
- **Port mismatch:** the frontend default API base is 8000, the README starts the
  API on 8000, but the QA scripts and local `.env` use 8001. Always set
  `VITE_API_BASE_URL` to match the running backend.
- **A sixth brand exists in the owner's local database.** It is almost certainly the
  "Zomato Demo" test brand created while checking the profile form. It has no
  candidates and appears in brand dropdowns. There is no delete-brand endpoint.
- **QA scripts are environment-specific:** they assume Chrome at
  `C:\Program Files\Google\Chrome\Application\chrome.exe`, port 8001, and Nike's
  UUID in check 13 (it will differ on a freshly seeded database).
- **Outage state resets** when the backend process restarts.
- **Groq key:** an API key was exposed in earlier conversation context and must be
  rotated before any public demo or screen share. Never write the key into any
  file.
- **Dependency pinning:** `frontend/package.json` uses `latest` for runtime
  dependencies; the lockfile fixes versions, so use `npm ci`.
- **Known UI weak spots** (see doc 11 and the points below) are intentional
  targets for the redesign: no active-link state in the sidebar, an empty brand
  list leaves the dashboard on "Loading dashboard...", `.scan-failure` has no CSS,
  Enter on `/check` can send duplicate requests, the `*` route shows the dashboard
  instead of a 404.

---

## 8. Demo narrative (owner's intended order)

1. Nike dashboard: 7 candidates, 5 threats, 4 high risk.
2. N1ke Shopping: 82.30 HIGH, publisher Market Mall Demo vs Nike Demo Publisher,
   logo 90.62, six ordered evidence rows.
3. `/check`: Run selected; show a flagged homoglyph (U+0456) and a non-flagged
   normal name.
4. Simulate Instagram outage, Scan now, show the amber banner, Restore. Say:
   "These live collectors are on the roadmap. When one is down, BrandShield keeps
   scanning stored observations and tells the analyst exactly what is stale."
   The outage is clearly labelled as simulated.
5. Brand Profile: define legitimate assets with validation.