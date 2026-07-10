# Onboarding HR Agent — run-1

A working front-end prototype of a three-sided onboarding tool, built against sourced 2025–2026 onboarding failure data (see `master-prompt.md` at the repo root for the sources, and `build-log.md` here for the feature-to-pain-point mapping).

## Contents

| Path | What it is |
|---|---|
| `app/`, `components/`, `lib/` | The Next.js 15 + React 19 + TypeScript app (the live prototype, at repo root) |
| `build-log.md` | Scoping Q&A (self-answered in character), design decisions traced to sourced pain points, break-it pass, done-check |
| `data-schema-brief.md` | What a real ATS/HRIS integration would need — entities, sync direction, auth, notifications, and what the prototype honestly can't do |

## Run the live prototype

```bash
npm install
npm run dev
# → http://localhost:3789
```

`npm run build && npm start` for a production build. `<SpeedInsights/>` (`@vercel/speed-insights/next`) is mounted in `app/layout.tsx`; it no-ops locally and activates if the app is ever deployed on Vercel.

## Deploy to Vercel

The app is deployment-ready — standard Next.js 15, no env vars required, no backend, all routes prerender statically. The app lives at the repo root, so no Root Directory override is needed. Two options:

- **CLI:** `npx vercel` from the repo root (then `npx vercel --prod`).
- **Git import:** import the repo in the Vercel dashboard as-is. Framework preset auto-detects as Next.js; leave build settings default.

`.env.local` (a Vercel CLI artifact with a short-lived OIDC token) and `.vercel/` are gitignored — don't commit them; Vercel regenerates both on demand.

After the first deployment, enable **Speed Insights** for the project in the Vercel dashboard (Project → Speed Insights) — the `<SpeedInsights/>` component is already mounted and starts reporting as soon as it's enabled.

Deployment note: the three views render client-side only (`ClientGate`) because all demo state derives from "days since start date" relative to the viewer's current date — baking it into build-time HTML would go stale and cause hydration mismatches. The brief prerendered fallback ("Loading demo data…") is expected.

## The three views

- **`/new-hire`** — interactive checklist (timing, duration, people involved with a four-group filter, action items, deliverables), feedback check-ins at Week 1 / Day 30 / 60 / 90, and a chat panel grounded only in HR-configured content with a permanently visible **Talk to a human** escalation.
- **`/manager`** — the hiring manager's own tasks per hire, overdue/upcoming reminders, open escalations from their hires, and live progress + check-in feedback for each report.
- **`/hr-ops`** — dashboard (per-hire health with transparent reasons: on-track / behind / at-risk, escalation queue), company info & FAQs (the assistant's grounding), key contacts, and checklist template settings with full mechanics: ↑/↓ reorder, "+ Add task here" insertion between any steps, in-place editing, delete, and an explicit "apply template to existing hires".

## Demo notes (honest limits)

- One shared in-memory state per browser tab — that's why all three views stay consistent as you click around, and why **refresh resets the demo** ("Reset demo data" in the nav does it on purpose).
- The role pickers ("viewing as…") stand in for auth; there are no logins, no persistence, no notifications, and **no ATS/HRIS connection** — see `data-schema-brief.md` for what a real one requires.
- Seed data is generated relative to today so the dashboard always demonstrates every state: pre-start (Maya), healthy day 7 with a Week-1 check-in due (Jordan), behind schedule (Alex), at-risk via missed Day-30 checkpoint + low Week-1 rating (Sam), and near-graduation (Priya).

## 2-minute demo script

1. Open **HR Ops → Dashboard**: Sam Reyes is *At risk* (missed Day-30 checkpoint, rated Week 1 2/5), Alex Kim is *Behind schedule*, one open escalation.
2. Open **New Hire** (Jordan): submit the due Week-1 check-in with a rating of 1 → HR Ops now flags Jordan at-risk too.
3. Ask the chat "when do I get paid?", then something it can't know — it hands off to a human instead of guessing. Hit **Talk to a human** → the escalation appears on HR Ops and the manager view.
4. Open **Hiring Manager** (Dana Park): reminders list Dana's overdue tasks; check one off and watch Jordan's progress bar move — same data everywhere.
5. **HR Ops → Checklist settings**: reorder a task, insert one mid-list, edit it in place, then "Apply template to existing hires".
