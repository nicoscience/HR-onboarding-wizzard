# Data-Schema & Integration Brief — Onboarding HR Agent

**Audience:** engineering team scoping a real ATS/HRIS-backed version.
**Honesty statement:** the prototype has *no* backend, auth, persistence, or integration. Everything below is what would be required, not what exists. Where the prototype fakes something (in-memory state, a rule-based chat bot, a role switcher instead of auth), that is called out explicitly.

## 1. Entities the prototype models (and their real-world source of truth)

### 1.1 `Employee` (new hire, manager, buddy, contacts)
Prototype: hard-coded seed objects. Real system: **sourced from the HRIS, never entered by hand.**

| Field | Prototype | Real integration requirement |
|---|---|---|
| `id` | local string | HRIS employee ID (e.g. Workday WID, BambooHR employee id). Must be the join key everywhere. |
| `name`, `role`, `department` | seeded | HRIS worker record (read-only here) |
| `managerId` | seeded | HRIS reporting line — needed to build the Hiring Manager view automatically |
| `startDate` | seeded relative to demo day | ATS offer-accepted → HRIS hire record. **The single most load-bearing field**: every task due date, checkpoint date, and at-risk flag derives from it. Start-date changes (common!) must propagate and recompute schedules. |
| `buddyName` | seeded string | Should be a proper employee reference set by the manager task "assign a buddy" |
| `email` / identity | display-only | From IdP (see §3 auth) |

**Sync direction:** ATS/HRIS → this tool (read). New-hire record creation should be event-driven: *offer accepted* (ATS webhook, e.g. Greenhouse/Lever) or *worker created* (HRIS event) spawns an onboarding instance.

### 1.2 `ChecklistTemplate` and `TaskTemplate`
Prototype: one in-memory template, editable in HR Ops → Checklist Settings. Real system: owned by *this* tool (it is the system of record for onboarding process design), persisted in its own DB.

`TaskTemplate` fields (all exist in the prototype): `title`, `details`, `dayOffset` (relative to start date; negative = pre-boarding), `timingLabel` (bucket: Before Day 1 / Day 1 / Week 1 / Day 30 / 60 / 90), `durationMins`, `owner` (NEW_HIRE or one of the four people groups), `involves[]` (Team/Department Lead, HR Team, IT, Office Admin), `actionItems[]`, `deliverables[]`, plus `orderIndex` (implicit array order in the prototype — make it explicit in a DB).

Real additions needed: template versioning (which template version was a hire instantiated from), per-department/role template variants, and an audit trail of edits.

### 1.3 `TaskInstance` (per hire)
Prototype: instantiated copy of the template per hire, with `done` and per-action-item completion. Real system: same model, plus:

- `completedBy` + `completedAt` (who checked it off — needed for accountability and for the manager-involvement metrics)
- `dueDate` materialized from `startDate + dayOffset` (recompute on start-date change)
- assignee resolution: `owner: TEAM_LEAD` must resolve to a *person* via the HRIS reporting line; `IT`/`OFFICE_ADMIN`/`HR` resolve to queues or named owners
- optional links out: deliverables in a real build are usually artifacts in other systems (signed doc in e-sign tool, ticket in ITSM). Store URLs/refs, don't duplicate content.

### 1.4 `FeedbackCheckpoint`
Prototype: fixed Week 1 / Day 30 / 60 / 90 per hire, with `submitted`, `rating` (1–5), `comment`, `submittedOnDay`; "missed" is derived (past due + grace, not submitted). Real system: identical shape, plus **access control is critical** — checkpoint comments are sensitive. New hire writes; HR Ops reads; managers see status but comment visibility is a policy decision to make explicitly (in the prototype, the manager view shows submitted comments — flag for review).

### 1.5 `Escalation`
Prototype: created from chat, visible to HR Ops and the hire's manager, resolvable. Real system: needs `assignedTo`, SLA timestamps, and a notification channel (Slack/email) — an escalation nobody is pinged about is theater. Consider syncing to the HR case-management tool if one exists rather than owning cases here.

### 1.6 `CompanyInfo`, `Contact`, `Faq`
Prototype: HR Ops-editable content that grounds the chat assistant. Real system: this tool can own it, but contacts should be *references* to HRIS employees (so they don't go stale), and content needs review dates.

### 1.7 Derived status (never stored)
`daysIn`, overdue tasks, checkpoint state, and health (`on-track / behind / at-risk / …`) are computed from the entities above with transparent thresholds (in `lib/engine.ts`: checkpoint grace 4 days; ≥2 overdue ⇒ behind; missed checkpoint, rating ≤2, or ≥4 seriously overdue ⇒ at-risk). Keep these **computed and explainable** in the real system too; store only the inputs. If thresholds become configurable, they belong on the template.

## 2. Integration surface (what to actually build)

1. **Inbound — hire lifecycle events** (ATS/HRIS → tool): offer accepted / hire created / start date changed / manager changed / hire terminated. Prefer webhooks (Greenhouse, Lever, BambooHR) or scheduled delta sync (Workday RaaS reports); reconcile nightly.
2. **Inbound — org data** (HRIS → tool): employee directory, reporting lines, departments. Read-only, cached, refreshed daily.
3. **Outbound — completion signals** (tool → HRIS, optional phase 2): onboarding-complete sign-off, training completions (or write those directly to the LMS).
4. **Notifications** (tool → Slack/email): manager reminders (the prototype computes them but cannot deliver them), checkpoint-due nudges to hires, at-risk and escalation alerts to HR Ops. This is the highest-value integration after HRIS sync — reminders that only exist inside a dashboard don't change manager behavior.
5. **Provisioning tasks** (optional): IT tasks could sync to the ITSM (Jira SM/ServiceNow) instead of being checkboxes here — one system must be the truth for each task; never both.

## 3. Auth & permissions (entirely absent from the prototype)

- SSO via the company IdP (SAML/OIDC). The prototype's "viewing as" pickers are demo devices and must be deleted, not hidden, in a real build.
- Roles: `new_hire` (own checklist + chat only), `manager` (own reports), `hr_ops` (all hires, template, content, escalations), `it`/`office_admin` (their task queues).
- Row-level rule: everything keys off employee ID and reporting line from the HRIS — no per-app user database.

## 4. Persistence & multi-user reality

The prototype is one shared in-memory state per browser tab (this is why its three views are perfectly consistent — same object). A real build needs a DB (the entities in §1 map to ~8 tables) and either polling or a live channel (websocket/SSE) if the "manager sees the hire's progress live" behavior should survive multiple sessions. Concurrency is real: a hire checking a task while HR Ops applies a new template version needs last-write-wins at minimum, ideally optimistic locking on the checklist.

## 5. The chat assistant, honestly

The prototype's assistant is **rule-based string matching** over HR-configured content, with two deliberate behaviors worth keeping in any LLM-backed replacement: (1) it refuses to answer beyond configured content instead of guessing, and (2) it routes relational/wellbeing topics to a human and keeps the escalation button permanently visible. An LLM version needs: retrieval over the same HR-owned content only, no access to other hires' data (per-hire context isolation), logged answers for HR review, and the same hard escalation path. The sourced tension this design answers: HR leaders want more AI in onboarding, but a third of new hires already default to AI over people — the assistant must funnel toward humans, not replace them.

## 6. What this prototype can and can't replace

**Can:** validate the workflow (three views, checklist mechanics, checkpoint cadence, at-risk rules) with real HR/managers/hires clicking through; serve as the front-end spec for the real build.
**Can't:** run a real onboarding program — nothing persists, nobody is notified, no one is authenticated, and no HRIS data flows. Anything that looks like it works across users works only because it is one browser tab talking to itself.
