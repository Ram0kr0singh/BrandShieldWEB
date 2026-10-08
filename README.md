# BrandShield

**Digital Risk Protection for Modern Brands**

BrandShield is a brand protection and threat monitoring platform that helps organizations detect impersonation, look-alike accounts, fake mobile apps, suspicious publishers, and brand abuse patterns before they escalate into customer harm. Built as a polished hackathon-ready prototype, the project combines a React frontend, a FastAPI backend, and an evidence-driven detection engine to present clear, explainable monitoring workflows for brand teams.

The system is designed to feel like a real-world threat intelligence dashboard: protected brands, signal checks, synthetic monitoring feeds, persisted detections, investigation records, and remediation draft generation, all in one place.

> BrandShield is intentionally built as a deterministic demo platform using controlled synthetic data and local evidence. It showcases the end-to-end workflow of digital brand protection without relying on live scraping or external production monitoring.

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Hackathon Evaluation Criteria](#hackathon-evaluation-criteria)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Local Development Workflow](#local-development-workflow)
- [Deployment Guide](#deployment-guide)
- [API Overview](#api-overview)
- [Evaluation Checklist](#evaluation-checklist)
- [Limitations](#limitations)
- [Future Roadmap](#future-roadmap)
- [Acknowledgments](#acknowledgments)

---

## Why This Exists

Modern brands face rising risk from:

- impersonation accounts and typo-squatted social profiles
- fake apps with misleading branding or suspicious publishers
- look-alike domains and app names that confuse customers
- promotional scam pages that appear official but are not

Most solutions stop at simple monitoring or static brand registration. BrandShield goes a step further by creating a structured workflow that combines:

- protected brand identity baseline
- candidate discovery from unknown social or app sources
- signal-based comparison with official assets
- persisted evidence and risk scoring
- investigation and remediation drafting
- explainable risk reasoning for analysts and stakeholders

This turns brand monitoring from a passive checklist into an operational workflow that resembles a real digital risk protection tool.

---

## Hackathon Evaluation Criteria

The challenge emphasizes both automated and human evaluation.

### Automated Evaluation

The platform will be evaluated on required features and must work end-to-end without manual workaround. The key requirement is to make sure all mandatory functionalities from the challenge are implemented and functioning correctly.

### Human Evaluation

Judges will assess:

- problem understanding
- functionality
- technical execution
- innovation & creativity
- user experience
- overall solution quality
- deployment readiness
- scalability and potential

BrandShield is built to satisfy this rubric by delivering a complete, visually polished, real-world simulation that looks production-aware while remaining easy to understand and demo.

---

## Screenshots

The project includes a set of polished dashboard and product views for product storytelling and GitHub presentation.

| Page | Screenshot |
|---|---|
| Dashboard Overview | ![Dashboard Overview](screenshots/aegis_01_dashboard.png) |
| Brand Profile | ![Brand Profile](screenshots/aegis_02_profile.png) |
| Social Media Monitoring | ![Social Monitoring](screenshots/aegis_03_social.png) |
| App Store Monitoring | ![App Monitoring](screenshots/aegis_04_apps.png) |
| Threat Investigation | ![Threats](screenshots/aegis_05_threats.png) |
| Detail View | ![Threat Detail](screenshots/aegis_06_detail.png) |
| Look-alike Detection | ![Look-alikes](screenshots/aegis_07_lookalikes.png) |
| Name Checker | ![Name Checker](screenshots/aegis_08_check.png) |

> These visuals are designed to communicate the product story clearly and are ideal for hackathon submissions, pitch decks, and GitHub presentation pages.

---

## Architecture

BrandShield follows a layered architecture that separates data, detection logic, and presentation while keeping the system easy to run locally and demo in a live environment.

```mermaid
flowchart TD
    A[Protected brand profile] --> B[Frontend Dashboard]
    B --> C[FastAPI Backend]
    C --> D[(PostgreSQL Database)]
    C --> E[Detection Engine]
    E --> F[Name similarity analysis]
    E --> G[Publisher mismatch logic]
    E --> H[Look-alike / visual similarity checks]
    E --> I[Evidence persistence]
    I --> J[Threat investigation workflows]
    J --> K[Draft remediation recommendations]
    C --> L[AI Analyst Layer]
    L --> M[Explainable evidence summary]
```

### System flow

1. A protected brand is defined with official domain, logo, social handles, and app metadata.
2. The system loads candidate social and app observations as potential impersonation threats.
3. A deterministic detection engine evaluates candidate signals such as:
   - name matching and typo transformations
   - logo similarity
   - publisher mismatch
   - description overlap
   - platform trust signals
4. Evidence is persisted in PostgreSQL for auditability.
5. The dashboard surfaces risk, severity, and investigation status.
6. A remediation draft can be generated without triggering real-world actions.

### Runtime stack

```text
React + TypeScript (Vite) → FastAPI → PostgreSQL
          ↓                      ↓
      Vite frontend         SQLAlchemy + Alembic
      http://localhost:5173  http://localhost:8000
```

---

## Features

### Brand identity management

- register and manage protected brands
- store official domains and brand assets
- maintain official social handles and app references
- support profile editing and brand metadata updates

### Threat monitoring dashboard

- overview metrics for detected risk and severity distribution
- threat prioritization across social and app channels
- scan results with chart summaries and risk breakdowns
- source status monitoring for operational health

### Detection engine

- deterministic similarity analysis for brand names
- transformation detection, including character substitution and spacing variants
- evidence-based detection scoring
- severity classification (SAFE, LOW, MEDIUM, HIGH, CRITICAL)
- persisted evidence trail per finding

### Investigation experience

- candidate-level inspection for suspicious entities
- investigation notes and status updates
- activity timeline for each detection
- remediation draft generation (draft-only, no external takedown action)

### Explainable analyst layer

- AI-generated summaries grounded in evidence
- risk rationales tied to actual detection facts
- uncertainties and recommended follow-up actions

### Demo-safe design

- synthetic local data only
- no live scraping
- no live takedown automation
- no production credential exposure to the browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Recharts, Lucide React |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL via Docker Compose |
| Migrations | Alembic |
| Runtime | Python 3.13, Node.js 24 LTS |
| File handling | Pillow for logo validation and processing |
| Optional AI Analyst | Groq-compatible OpenAI-style API |
| Testing | pytest |
| Dev environment | Docker Desktop, Python venv |

---

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── detection/
│   │   ├── analyst.py
│   │   ├── logos.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── seed.py
│   │   └── sources.py
│   ├── alembic/
│   ├── tests/
│   ├── .pytest_cache/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── vite.config.ts
│   └── index.html
├── data/
│   └── logos/
├── docs/
│   ├── aegis/
│   └── FRONTEND_MANUAL_CHECKS.md
├── screenshots/
│   ├── aegis_01_dashboard.png
│   ├── aegis_02_profile.png
│   ├── aegis_03_social.png
│   ├── aegis_04_apps.png
│   ├── aegis_05_threats.png
│   ├── aegis_06_detail.png
│   ├── aegis_07_lookalikes.png
│   └── aegis_08_check.png
├── docker-compose.yml
├── .env.example
├── README.md
├── postman/
├── scripts/
└── .gitignore
```

---

## Getting Started

### Prerequisites

Before running the project, install the following:

- Node.js 24 LTS and npm
- Docker Desktop with Docker Compose enabled
- Python 3.13 installed and available via `py` on Windows

> Use the repo-local Python virtual environment instead of a global Python installation. The backend is configured to run from the project `.venv` and not from a separate machine-wide setup.

### Environment setup

1. Copy `.env.example` to `.env`.
2. Set a secure local PostgreSQL password.
3. Ensure `DATABASE_URL` matches your local database password.
4. Keep the frontend base URL aligned with the backend port:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

> The app is configured for the backend on port `8001` from the frontend side. If your deployment or local setup differs, update this value and rebuild the frontend.

### Optional AI analyst configuration

Set the following if you want the backend analyst to call a Groq-compatible API:

```env
LLM_API_KEY=your_key_here
LLM_MODEL=openai/gpt-oss-120b
LLM_BASE_URL=https://api.groq.com/openai/v1
```

If no key is configured, the backend gracefully falls back to deterministic explanatory output instead of failing.

---

## Local Development Workflow

### 1) Create the virtual environment

```powershell
py -3.13 -m venv .venv
.venv\Scripts\activate
python --version
```

### 2) Install backend dependencies

```powershell
python -m pip install -e ".\backend[dev]"
```

### 3) Install frontend dependencies

```powershell
npm install --prefix frontend
```

### 4) Start PostgreSQL with Docker

```powershell
docker compose up -d postgres
docker compose ps
```

### 5) Run database migrations

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head
```

### 6) Seed demo data

```powershell
cd backend
..\.venv\Scripts\python.exe -m app.seed
```

This loads controlled, clearly synthetic demo data for Nike, Apple, Samsung, Spotify, and Adidas.

### 7) Start the backend API

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 8) Start the frontend

```powershell
npm run dev --prefix frontend
```

### 9) Open the app

Visit:

```text
http://localhost:5173
```

The frontend is expected to communicate with the backend at:

```text
http://localhost:8000
```

A healthy backend will respond on the `/api/health` endpoint with database status information.

### 10) Run tests

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest
```

### 11) Create a production frontend build

```powershell
npm run build --prefix frontend
```

---

## Deployment Guide

The project is designed to be deployment-friendly for modern hosting.

### Recommended deployment pattern

- Frontend: Vercel
- Backend: Render or any Python hosting provider
- Database: PostgreSQL service (local Docker in development, hosted Postgres in deployment)

### Environment variables for deployment

Set the backend environment values on the deployment platform:

```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dbname
CORS_ORIGINS=https://your-frontend-domain.vercel.app
LLM_API_KEY=optional-key
LLM_MODEL=openai/gpt-oss-120b
LLM_BASE_URL=https://api.groq.com/openai/v1
```

Set the frontend environment variable for the deployed API URL:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

> A common deployment issue is mismatched frontend and backend ports. In this project, the frontend is expected to target the backend API endpoint through `VITE_API_BASE_URL`; if your API is hosted elsewhere, update that variable accordingly.

---

## API Overview

The application exposes a structured set of endpoints for brand, detection, monitoring, and investigation workflows.

### Brand APIs

- `GET /api/brands`
- `POST /api/brands`
- `GET /api/brands/{id}`
- `PATCH /api/brands/{id}`
- `POST /api/brands/{id}/logo`
- `GET /api/brands/{id}/social-accounts`
- `POST /api/brands/{id}/social-accounts`
- `GET /api/brands/{id}/apps`
- `POST /api/brands/{id}/apps`
- `GET /api/brands/{id}/assets`
- `POST /api/brands/{id}/assets`

### Detection APIs

- `POST /api/analyze/name`
- `POST /api/analyze/social/{candidate_id}`
- `POST /api/analyze/app/{candidate_id}`
- `POST /api/detections/scan`
- `GET /api/detections`
- `GET /api/detections/{id}`
- `POST /api/detections/{id}/analyze`

### Dashboard & monitoring APIs

- `GET /api/dashboard/overview`
- `GET /api/sources/status`
- `POST /api/monitoring/scan`

### Investigation APIs

- status updates
- note creation
- remediation draft generation
- investigation timeline retrieval

---

## Evaluation Checklist

BrandShield is aligned with the challenge’s evaluation rubric and is designed to present a strong, complete digital product experience.

### Automated evaluation readiness

- functional backend routes
- database-backed persistence
- frontend-backend integration
- deterministic demo data without broken dependencies
- risk detection pipeline and status tracking

### Human evaluation readiness

- clear product concept and problem framing
- visual polish and professional dashboard design
- explainable threat intelligence workflow
- realistic investigation UX
- strong project presentation for GitHub and demo use

---

## Limitations

This is a demo-grade platform and not a production-grade brand monitoring service.

- uses controlled synthetic data, not live market monitoring
- no live scraping of social networks or app stores
- no automated takedown systems or legal enforcement workflows
- no authentication or user-role authorization layer
- AI analyst output is explanatory and optional

These are intentional trade-offs to keep the project focused, deterministic, and suitable for a hackathon environment.

---

## Future Roadmap

Potential next steps:

- real-time monitoring integrations
- broader branded asset discovery and domain intelligence
- threat prioritization with active scoring pipelines
- role-based analyst workspace
- exportable investigation reports
- live dashboard for multiple brands and teams
- real-world connector integrations for social and app ecosystems

---

## Acknowledgments

This project was developed as a polished end-to-end digital risk protection prototype to demonstrate the value of threat monitoring, evidence-based risk classification, and operational brand defense workflows.

It is designed especially for hackathon presentations, GitHub showcases, and product-storytelling environments where a real-world user journey matters as much as the technical implementation.

---

## Final Note

BrandShield is not just a UI mockup or a static prototype. It represents a complete workflow for identifying suspicious digital threats around a brand, organizing findings, proving them with evidence, and helping teams act with clarity.

Whether used as a hackathon submission, a product demo, or a foundation for a larger digital risk protection platform, the project is built to look credible, explainable, and professional.

If you want, I can also craft a second version of this README tuned specifically for:

- GitHub aesthetic / project landing page style
- hackathon submission version with a shorter executive summary
- investor pitch / product showcase version
- deployment-focused README with Vercel + Render setup steps
