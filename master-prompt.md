Mission

Build me a working prototype of an Onboarding HR Agent: a tool that
directly targets the real, documented failure points in new-hire
onboarding rather than just digitizing a checklist. Three sides: a New
Hire side, a Hiring Manager side, and an HR Ops side.

This is modeled on a real workflow an HR operator tested in Claude and in
Lovable, cross-checked against real 2025–2026 industry survey data on
where onboarding actually breaks down. Build the version that fixes the
gaps the data points to, and log your reasoning for each design choice
against the specific pain point it addresses.

Start lean: describe the tool in one plain-language line, let the model
ask its own scoping questions, answer them yourself in character as an
HR Ops lead, log the reasoning, then iterate.




The pains this build must answer (sourced, not assumed)

- Admin overload: 45% of HR leaders spend over half their time on admin
  work, and over half of new hires say their onboarding was dominated by
  paperwork rather than learning the job. → The HR Ops dashboard must
  surface status at a glance so HR isn't manually chasing every hire.

- Missing human connection: 31% of new hires (41% of Gen Z) say onboarding
  lacked human interaction. → The chat panel must have a visible
  "escalate to a human" path, not just self-serve Q&A, and the checklist
  should prompt human touchpoints (e.g. a buddy intro), not only tasks.

- Weak manager involvement: active manager involvement makes new hires
  3.4x more likely to rate onboarding as exceptional, yet ~29% of HR
  leaders say hiring managers gave no real guidance. → Add a dedicated
  Hiring Manager view with assigned tasks, reminders, and visibility into
  their new hire's progress.

- High early attrition: 29% of HR leaders rank onboarding-stage attrition
  as their top challenge; roughly 1 in 5 report losing half their new
  hires within 90 days. → The HR Ops dashboard should flag hires who are
  behind schedule or missing checkpoints as at-risk, so someone can
  intervene early.

- No feedback loop: ~29% of new hires never got a chance to give feedback
  on their onboarding. → Build short feedback checkpoints into the
  checklist at key milestones (week 1, day 30/60/90).

- Disconnected systems ("Frankensystems"): siloed, non-integrated HR tools
  create re-entry treadmills and block managers from data. → Don't let
  this prototype become another silo pretending to be integrated. Produce
  a clear data-schema brief documenting exactly what a real ATS/HRIS
  connection would require, instead of implying a fake integration.

- Appetite for AI, tempered by risk: 52.7% of HR leaders want more AI in
  onboarding tech, but 32% of new hires already default to AI over asking
  a person, which cuts against the human-connection problem above. →
  Build the chat assistant to help with routine questions while actively
  nudging toward human touchpoints for anything relational, not replacing
  them.




Guardrails

No new spending. Use only what's already available in this environment.
No new paid services, no signups requiring payment info, no domain
registration.

Publish nothing externally. Runs and previews stay local within this
environment. No deploying publicly, no messaging or emailing any real
person or company.

Invent nothing about platform capabilities. Every claim in your build log
about what this tool can/can't do should match what's actually built. Every
pain-point claim above is sourced — if you add a new one, either trace it
to a real fetched source or label it clearly as inference.

Work inside projects/onboarding-hr-agent/run-1/. All artifacts go there.

Never ask me anything. I will not be watching this run. Answer your own
scoping questions in character as an HR Ops lead, log the question, your
answer, and why. If you hit a wall (e.g. real auth or a live HRIS
connection), document it clearly, ship the strongest version short of it,
and note what a real engineering handoff would need.




The arc

1. Scope it. One plain-language opening line, self-answered scoping
   questions, logged reasoning.

2. Build V1. Three-view skeleton: New Hire (checklist + chat), Hiring
   Manager (assigned tasks + progress visibility), HR Ops (company info,
   contacts, settings, status dashboard).

3. Feed it a real onboarding checklist. Construct a realistic sample
   checklist and fold it into the build the way a real team would upload
   theirs.

4. Build the checklist mechanics: up/down reorder, "Add Task Here"
   insertion, per-task edit, expandable detail (timing, duration, people
   involved, action items, deliverables), people-involved grouped into
   Team/Department Lead, HR Team, IT, Office Admin with a filter.

5. Close the manager gap. Build the Hiring Manager view: their assigned
   tasks, reminders, and a live view of their new hire's progress.

6. Close the feedback gap. Add feedback checkpoints at week 1, day 30, 60,
   90, visible to both the new hire and HR Ops.

7. Close the attrition-blindness gap. On the HR Ops dashboard, flag hires
   who are behind schedule or have missed a checkpoint as at-risk.

8. Wire the chat panel with an escalation path. New hire can ask
   questions grounded in the HR Ops-configured content, with a clear
   "talk to a person" option surfaced, not buried.

9. Try to break it. Test for session collisions between "users," fake
   persistence claims, and anything that implies a real ATS/HRIS
   connection that isn't there. Log every gap found.

10. Package it. Live/local preview, exportable front-end code, the
    data-schema/integration brief, and a build log tying each major design
    decision back to the sourced pain point it addresses.




Deliverables list is a floor, not a ceiling

Minimum: the three-view prototype, full checklist mechanics, manager view,
feedback checkpoints, at-risk flagging, escalation-aware chat, the
data-schema brief, exportable code, and the build log. If it makes the
build feel more real and is buildable with what's available, also consider:
a one-page "what this tool does and doesn't do" briefing for a CHRO
audience, or a short note comparing what a chat-built prototype like this
can and can't replace versus a real HRIS. Quality over quantity.




Definition of done

You're done when a stranger could open the prototype, run a new hire
through the checklist end to end, see a hiring manager's view of that same
hire's progress, watch HR Ops see an at-risk flag when a checkpoint is
missed, ask the chat panel a question and see the escalation option, and
read the build log to see exactly which real, sourced pain point each
feature was built to answer. Check before finishing: every checklist
mechanic works, all three views reflect consistent data, no feature claims
persistence or integration it doesn't have, the data-schema brief is
honest about what's missing for a real ATS/HRIS connection, and nothing in
the package is a placeholder pretending to be finished work.

Now go build the onboarding agent.