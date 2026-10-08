# AEGIS FRONTEND COMPLETE SPECIFICATION

## 1. REPOSITORY IDENTIFICATION

- **Repository Name**: BrandShield
- **Current Branch**: frontend/aegis-redesign (REPOSITORY VERIFIED)
- **Current Commit**: 18fb654 (feat: add protected brand profile and finalize demo hardening)
- **Frontend Location**: `frontend/`
- **Backend Location**: `backend/`
- **Backend Code Modified**: NONE (REPOSITORY VERIFIED)
- **Database/Migrations Modified**: NONE (REPOSITORY VERIFIED)
- **API Contracts Modified**: NONE (REPOSITORY VERIFIED)

**Boundary Explanation:**
The AEGIS frontend acts strictly as a visual and interaction layer consuming data from the BrandShield backend API. Deterministic risk authority, threat statuses, and entity relationships remain in the BrandShield backend. The frontend maps this data into a highly spatial, investigative design language (AEGIS) without fabricating new capabilities.

## 2. TECHNOLOGY STACK

(REPOSITORY VERIFIED from `frontend/package.json`)

- **React & React DOM**: Core UI library (`latest`). Used for component architecture.
- **TypeScript**: Typed JavaScript (`latest`). Used for strong typing of API contracts and components.
- **Vite**: Build tool and dev server (`latest`). Used for rapid HMR and building the application.
- **React Router (react-router-dom)**: Client-side routing (`latest`). Used for navigating between Overview, Investigation, Monitoring, and Settings.
- **Tailwind CSS**: Utility-first CSS framework (`latest`, via `@tailwindcss/vite`). Used for rapid styling, though heavily augmented by custom CSS variables in `styles.css`.
- **Lucide React**: Iconography (`latest`). Used for restrained, minimal line icons.
- **Recharts**: Data visualization library (`latest`). (IMPLEMENTATION INFERENCE) Used for telemetry charts.

*Note: Framer Motion is NOT in package.json (NOT IMPLEMENTED). Animations are primarily CSS-based.*

## 3. FRONTEND ARCHITECTURE

The frontend follows a classic SPA architecture with a custom application shell.

**Browser → React Entry Point (`main.tsx`) → Router (`BrowserRouter`) → Application Shell (`<div className="aegis-shell">`) → Sidebar (`<AppSidebar>`) + Content Area (`<main>`) → Pages → Components → API (`api.ts`).**

- **State Management**: Local component state (`useState`, `useEffect`) and URL state. No Redux, Zustand, or Context used globally.
- **Data Fetching**: Custom `api.ts` wrapper around `fetch`. Promises resolved in `useEffect`.
- **Error Handling**: Component-level error states (`<LoadingState error={error} />`).

## 4. COMPLETE FILE INVENTORY

| File | Purpose | Component/Module | Dependencies | Data/API | Importance |
|------|---------|------------------|--------------|----------|------------|
| `package.json` | Project manifest | N/A | Vite, React, Tailwind | N/A | High - Defines stack |
| `main.tsx` | Entry point | App, Router setup | React, Router | N/A | High |
| `styles.css` | Core design system | Variables, base styles | Tailwind | N/A | CRITICAL - Defines visual identity |
| `api.ts` | API client | Fetch wrapper | None | Backend REST API | CRITICAL - Data contract |
| `AppSidebar.tsx` | Navigation spine | Spine rail | Router | N/A | High |
| `OverviewPage.tsx` | Main dashboard | Briefing, Visualization | API | `api.overview()` | High |
| `PerimeterVisualization.tsx` | Core visual | SVG mapping | React | Overview data | CRITICAL |
| `BrandProfilePage.tsx` | Identity view | Official assets | API | `api.brand()`, etc | High |
| `ThreatDetailPage.tsx` | Forensic view | Investigation UI | API | `api.investigation()` | High |
| `ThreatsPage.tsx` | Table list | Threat table | API | `api.detections()` | Medium |

## 5. AEGIS PRODUCT IDENTITY

**Product Name**: AEGIS
**Product Positioning**: Digital Risk Intelligence / Digital Risk Protection
**Core Visual Concept**: THE OBSERVATORY
**Core Recurring Visual Motif**: THE DIGITAL PERIMETER

**Visual Implementation**:
AEGIS implements "The Observatory" through spatial composition. Instead of grids of dashboard cards, the UI uses open canvas (`var(--bg-canvas)`) with deliberate negative space. "The Digital Perimeter" is realized in `PerimeterVisualization.tsx` as concentric SVG rings (Legitimate Core, Suspicious Horizon, Critical Vector) where threats are placed based on severity, not arbitrary geography. 

This differs drastically from generic SOC dashboards: there is no "neon cyberpunk" hacking aesthetic, no arbitrary maps with pew-pew lasers. It is cinematic, restrained, and forensic.

## 6. DESIGN LANGUAGE — EXTREMELY PRECISE

**Overall Aesthetic**: Cinematic, enterprise, restrained, forensic, minimal, dark.

**Visual Philosophy**:
- **Whitespace**: Generous.
- **Density**: Sparse, becoming dense only in forensic tables.
- **Contrast**: High contrast for critical elements, low contrast for ambient elements.
- **Hierarchy**: Editorial typography drives hierarchy over card boundaries.

## 7. EXACT COLOR SYSTEM

(REPOSITORY VERIFIED from `styles.css`)

| Role | Value | Where Used | Meaning |
|------|-------|------------|---------|
| Canvas | `#060607` | Background | Absolute space |
| Elevated | `#0b0b0d` | Sidebar | Raised background |
| Surface | `#121215` | Cards | Content container |
| Raised | `#1a1a1e` | Active elements | Interactive surface |
| Highlight | `#24242a` | Hover | Interactive hover |
| Border Subtle | `#1c1c22` | Dividers | Ambient structure |
| Border Default| `#262630` | Inputs, Buttons | Active structure |
| Text Primary | `#ece9e1` | Headings, active | Focus information |
| Text Secondary| `#a9a69e` | Body text | Standard reading |
| Text Muted | `#6b6963` | Labels, meta | Secondary context |
| Text Faint | `#3e3d3a` | Disabled | Inactive |
| Legitimate | `#86b8a4` | Safe badges, core | Verified, secure |
| Suspicious | `#d9ae5f` | Warnings | Potential threat |
| Critical | `#e4574a` | Alerts, high risk | Active threat |

Color is strictly semantic, not decorative. Red (`#e4574a`) is reserved ONLY for critical vectors. 

## 8. TYPOGRAPHY SYSTEM

- **Sans-Serif (`--font-sans`)**: Inter, -apple-system. Used for UI, body, labels.
- **Serif (`--font-serif`)**: Instrument Serif, Georgia. Used for prominent headers, brand names (e.g., in `PerimeterVisualization`), lending an editorial, official, intelligence-briefing weight.
- **Monospace (`--font-mono`)**: JetBrains Mono. Used for data points, badges, telemetry tags, ensuring technical precision.

Sizes:
- Badges: 10px uppercase
- Buttons/Inputs: 12px
- Tables/Body: 13px

## 9. SPACING / GRID / GEOMETRY

- Content Max Width: `1480px`
- Sidebar Width: `250px`
- Content Padding: `36px 48px`
- Card Padding: `22px`
- Raised Card Padding: `24px`

## 10. BORDERS / RADII / SURFACES

- Card Radius: `8px`
- Button Radius: `6px`
- Badge Radius: `4px`
- Border Widths: `1px`
- Shadows: Minimal. Minimal glow (`0 0 10px rgba(...)`) used only for active states (like the active Spine node) or SVG gradients. No glassmorphism.

## 11. NAVIGATION / APPLICATION SHELL

Called **"The Spine"** (`.aegis-spine`).
Visual implementation: A vertical connecting hairline thread (`.spine-line`) runs behind navigation nodes (`.spine-node-dot`). It visually resembles a backbone of data. Active state is bone-white with a subtle halo; inactive is faint.

## 12. OVERVIEW — DIGITAL PERIMETER BRIEFING

**Composition**:
- **Digital Perimeter Briefing**: Executive header.
- **Perimeter Visualization**: Central SVG component.
- **Source Split**: Threat origins.
- **Intelligence Ledger**: Recent threat list.

**Data Mapping**:
API Endpoint: `/dashboard/overview?brand_id={id}`
Rendered via `OverviewPage.tsx`.

## 13. PROTECTED IDENTITY
IMPLEMENTED via `BrandProfilePage.tsx` and `api.brand()`. Differentiates official identity from threats.

## 14-16. SOCIAL, APP, LOOK-ALIKE MONITORING
IMPLEMENTED via `SocialMonitoringPage.tsx`, `AppMonitoringPage.tsx`, `LookalikeDetectionPage.tsx`.

## 17. THREAT SURFACE

(REPOSITORY VERIFIED via `PerimeterVisualization.tsx`)
Spatial visualization uses radial SVG coordinates.
- **Core (cx, cy)**: Brand Logo/Name.
- **Left Orbit**: Social Media threats.
- **Right Orbit**: App Store threats.
- **Radius**: Maps to severity (`rCritical = 75`, `rSuspicious = 135`, `rSafe = 185`).
*This is visualization logic, not geographic distance.*

## 18-20. INVESTIGATION & AI ANALYST
IMPLEMENTED via `ThreatDetailPage.tsx` and `/detections/{id}/investigation` API endpoint. Displays Forensic Specimen. AI Analyst boundaries respect deterministic backend risk scores.

## 21. REMEDIATION
IMPLEMENTED via `api.draft()`. Drafts are generated, no destructive "send" actions fabricated.

## 22. API INTEGRATION
Documented in `api.ts`.
- `api.overview(id)`
- `api.detections()`
- `api.scan(id)`
- `api.analyze(id)`

## 23-26. DATA FLOW, STATE, ERRORS, HONESTY
Data flows top-down via React state. Errors are caught in `catch` blocks and render `<LoadingState error={err} />`. Honest messaging like "DETERMINISTIC PERIMETER RADIAL PROXIMITY" used to avoid faking live capability.

## 27. MOTION DESIGN
- `spin`: 1s linear (loading).
- `pulse-critical`: 2s ease-in-out opacity and scale pulsing for critical SVG nodes.
- `orbit-spin`: 90s slow linear rotation for ambient perimeter rings.
Framer motion NOT IMPLEMENTED. Pure CSS.

## 28. RESPONSIVE DESIGN
- **1024px**: Spine narrows to 210px.
- **768px**: Spine moves to top row (horizontal flex), connecting line hidden.

## 29-30. ACCESSIBILITY & PERFORMANCE
- Semantic HTML tags used. SVG utilizes `<text>`. CSS animations are performant transforms.

## 31. DESIGN PRINCIPLES
(IMPLEMENTATION INFERENCE)
Dark UI reduces eye strain. Red is rare to preserve alarm value. Serif typography adds "intelligence report" gravity. The Perimeter avoids generic dashboard grids, forcing spatial understanding of risk.

## 32. WHAT MAKES AEGIS DISTINCTIVE
- Large editorial typography (Instrument Serif).
- Cinematic dark canvas (`#060607`).
- Sparse surfaces (cards blend with background).
- The Spine navigation metaphor.

## 33-35. REPRODUCTION & MIGRATION
Future AI: Recreate `styles.css` exact hex codes. Build `<PerimeterVisualization>` using SVG and `Math.cos/sin` logic. Adapt `api.ts` to new backends if necessary, keeping interfaces intact.

## 36. DO NOT BREAK
- Do NOT fabricate live crawling if API does not stream.
- Do NOT alter deterministic risk scores via frontend.
- Do NOT add Tailwind generic classes over the defined CSS variables.

## 37. FINAL CLAUDE / AI INTEGRATION INSTRUCTIONS
"This is the AEGIS frontend implementation. The backend is BrandShield. Preserve the existing AEGIS experience while adapting API/data mappings when necessary. Read `api.ts` to understand the data contract. Do not inject mock data if the API fails; show the correct error boundary."
