# Build Log — Onboarding HR Agent (run-1)

**Date:** 2026-07-11 · **Builder:** Claude Code (autonomous run) · **Status:** shipped & verified

**Verification evidence:** `tsc --noEmit` clean · `next build` clean (all 4 routes prerender, ~115 kB first load) · 15/15 logic smoke tests pass (seeded health states: Jordan on-track with Week-1 check-in due, Alex behind, Sam at-risk via missed Day-30 checkpoint + 2/5 rating, Maya pre-start, Priya near-graduation; chat responder: pay/wifi/leave/contacts/checklist answers from configured content, relational → human nudge, unknown → honest fallback) · all views verified serving on `http://localhost:3789` with the expected flags in rendered output.

## 0. One-line description

> A three-sided onboarding workspace where a new hire works a living checklist and can always reach a human, their manager is pulled into the loop with their own tasks and reminders, and HR Ops sees at a glance who is on track, behind, or at risk of leaving.

## 1. Scoping questions (self-answered, in character as HR Ops lead)

The brief says never ask the operator anything, so each scoping question is answered here in character as the HR Ops lead who tested this workflow, with reasoning logged.

**Q1. Who is the "user" — do we need real logins?**
*A (HR Ops lead):* No. This is a prototype to validate the workflow, not a deployment. Give me an honest role switcher ("viewing as…") so I can demo all three sides in one session.
*Reasoning:* The guardrails forbid real auth/backends. A visible role switcher is more honest than a fake login screen, and it directly supports the "try to break it / session collisions" test — there is one shared in-memory state, and the UI says so.

**Q2. One checklist for everyone, or per-role templates?**
*A:* One company template is enough for V1, but each hire must have their *own instance* of it — Sam being behind cannot show Jordan as behind.
*Reasoning:* Per-hire task instances (instantiated from the template) are what make the manager view and the at-risk dashboard meaningful. Template lives in HR Ops → Checklist Settings; instances live on each hire.

**Q3. What makes a hire "behind schedule" vs "at risk"?**
*A:* Behind = overdue tasks piling up. At risk = the human signals: a missed feedback checkpoint, or a submitted checkpoint with a low score. Those are the two signals the attrition data points at.
*Reasoning:* Sourced pains: ~1 in 5 orgs lose half their new hires inside 90 days, and ~29% of new hires never got to give feedback. So checkpoints are first-class objects, and missing one is a stronger signal than a late task. Rules implemented in `lib/engine.ts` and shown transparently in the UI (every flag lists its reasons — no black-box "AI risk score").

**Q4. What should the chat assistant actually answer from?**
*A:* Only what HR Ops has configured — company info, contacts, FAQs — plus the hire's own checklist. If it doesn't know, it must say so and hand off to a person, not improvise.
*Reasoning:* Sourced tension: 52.7% of HR leaders want more AI, but 32% of new hires already default to AI over people, which worsens the human-connection gap (31% felt onboarding lacked human interaction). So the assistant is deliberately grounded + escalation-forward: the "Talk to a human" button is permanently visible, relational topics get nudged to the buddy/manager, and every escalation lands on the HR Ops dashboard.

**Q5. Timing model — real dates or day offsets?**
*A:* Day offsets from each hire's start date ("Day −5", "Day 1", "Week 1", "Day 30"). That's how our real checklist is written.
*Reasoning:* Offsets make one template reusable across hires and make "overdue" computable without a calendar integration. Demo data seeds start dates relative to *today* so the dashboard always shows one pre-start hire, one healthy hire, one behind, one at-risk, one graduating.

**Q6. What about persistence and the ATS/HRIS?**
*A:* Don't fake it. In-memory only, say so on screen, and give me the schema brief so engineering knows exactly what a real integration needs.
*Reasoning:* Sourced pain: "Frankensystems" — siloed tools pretending to integrate. The prototype shows a persistent banner ("in-memory demo — refresh resets, no ATS/HRIS connected") and ships `data-schema-brief.md` instead of a mock API that lies.

## 2. Design decisions → sourced pain points

| Feature built | Sourced pain it answers |
|---|---|
| HR Ops dashboard: per-hire status at a glance (on-track / behind / at-risk with listed reasons), open escalations queue | **Admin overload** — 45% of HR leaders spend >half their time on admin; status must be visible without chasing |
| Chat panel with permanently visible "Talk to a human" button; relational questions nudged to buddy/manager; escalations create a visible follow-up request | **Missing human connection** — 31% of new hires (41% Gen Z) say onboarding lacked human interaction |
| Dedicated Hiring Manager view: their assigned tasks, reminders for overdue/upcoming items, live progress on each of their hires | **Weak manager involvement** — active managers → 3.4× more "exceptional" ratings; ~29% of HR leaders say managers gave no real guidance |
| At-risk flagging from missed checkpoints + low feedback scores + severe overdue, with transparent reasons | **High early attrition** — 29% rank onboarding-stage attrition top challenge; ~1 in 5 lose half of new hires in 90 days |
| Feedback checkpoints at Week 1 / Day 30 / 60 / 90, first-class in the checklist, visible to hire and HR Ops | **No feedback loop** — ~29% of new hires never got a chance to give feedback |
| No fake integration; on-screen honesty banner; `data-schema-brief.md` for a real ATS/HRIS handoff | **Frankensystems** — siloed tools that pretend to integrate |
| Assistant answers only from HR-configured content, defers to humans on relational topics | **AI appetite vs. risk** — 52.7% want more AI, but 32% of hires default to AI over people |
| Checklist prompts human touchpoints as tasks (buddy assignment, team lunch, stakeholder intros), not just paperwork | **Missing human connection** + >half of hires say onboarding was dominated by paperwork |

All percentages above are quoted from the operator's sourced brief (`master-prompt.md`); nothing new was asserted. Anything beyond those claims in this log is labeled design reasoning, not data.

## 3. Architecture (V1)

- **Stack:** Next.js 15 (App Router) + React 19 + TypeScript, plain CSS. `<SpeedInsights/>` from `@vercel/speed-insights/next` mounted in the root layout, per the operator's instruction.
- **State:** one in-memory client store (React context) shared by all three views — this is what makes "all three views reflect consistent data" literally true: checking a task as the new hire updates the manager's progress bar and the HR Ops dashboard in the same session.
- **No backend, no persistence, no network calls.** The banner says so. Refresh = reset (a "Reset demo data" button makes this a feature for demos).
- **Views:** `/new-hire`, `/manager`, `/hr-ops`, with a landing page explaining who each view is for and what is/isn't real.
- **Checklist mechanics** (HR Ops → Checklist Settings, on the shared template): ↑/↓ reorder, "+ Add task here" insertion between any two steps, inline per-task editing (title, timing, duration, people involved, details, action items, deliverables), expandable detail, people-involved filter across the four groups (Team/Department Lead, HR Team, IT, Office Admin). An explicit "Apply template to existing hires" action re-instantiates per-hire checklists (preserving completion by task id) — template edits do **not** silently mutate live hires, and the UI says so.

## 4. Break-it pass (step 9) — gaps found and how they're handled

1. **Session collisions between "users":** there are none to collide — one browser tab = one shared demo state, and the role switcher is labeled as a demo device. Two different browser tabs each get their own independent in-memory state; the landing page states this so nobody mistakes it for sync.
2. **Fake persistence claims:** none made. Banner on every page: in-memory only, refresh resets. Verified no `localStorage`/`fetch` calls in the code.
3. **Implied ATS/HRIS connection:** the "integrations" surface is deliberately absent; company/contact data is editable demo data labeled as such; the schema brief documents the real requirement instead.
4. **Stale prerender / timezone edge (fixed):** "days since start" is computed against the current date, so markup for the three views must never be baked into build-time HTML — a static deploy would serve day-old state and hydration would mismatch. Fixed with a `ClientGate`: the prerendered HTML carries a neutral fallback and all date-derived UI renders client-side against the viewer's clock. Verified on the production build: static HTML of all three views contains zero date-derived content. This also makes the app Vercel-deployment-ready (see README §Deploy).
5. **Template vs. instance drift:** editing the template does not change existing hires until "Apply to existing hires" is pressed — this is surfaced in the settings UI rather than hidden.
6. **Chat overreach:** the assistant only string-matches against configured content and its own checklist; unknown questions return an honest "I don't know — here's the right person," never invented policy. Relational keywords route to humans by design.

## 5. Definition-of-done check

- [x] Stranger can open the prototype and run a new hire through the checklist end to end (New Hire view, "viewing as" switcher, tasks checkable, action items tickable)
- [x] Same hire's progress visible in the Hiring Manager view (live, same state)
- [x] HR Ops sees an at-risk flag when a checkpoint is missed (seeded: Sam Reyes, missed Day-30 checkpoint) and behind-schedule flags (seeded: Alex Kim)
- [x] Chat panel answers a question; "Talk to a human" always visible; escalation appears on HR Ops dashboard
- [x] Checklist mechanics all work: reorder, insert-between, in-place edit, expandable detail, people filter
- [x] No persistence/integration claims beyond reality; honesty banner on every page
- [x] `data-schema-brief.md` documents what a real ATS/HRIS connection needs
- [x] Exportable code: self-contained `prototype/` folder, `npm install && npm run dev`
- [x] This build log ties each feature to its sourced pain point
