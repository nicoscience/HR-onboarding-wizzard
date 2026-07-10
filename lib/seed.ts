// Demo seed data. Start dates are computed relative to "today" so the
// dashboard always demonstrates every state: pre-start, healthy, behind
// schedule, at-risk (missed checkpoint), and near-graduation.

import {
  AppState,
  Checkpoint,
  Hire,
  Task,
  TaskTemplate,
} from './types';

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Calendar days from `startISO` to today. Day of start = 0. */
export function daysSince(startISO: string): number {
  const [y, m, d] = startISO.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - start.getTime()) / 86_400_000);
}

let seq = 0;
const id = (prefix: string) => `${prefix}-${++seq}`;

const CHECKPOINT_DAYS = [
  { day: 7, label: 'Week 1' },
  { day: 30, label: 'Day 30' },
  { day: 60, label: 'Day 60' },
  { day: 90, label: 'Day 90' },
];

function t(
  partial: Omit<TaskTemplate, 'id' | 'actionItems' | 'deliverables' | 'details'> &
    Partial<Pick<TaskTemplate, 'details' | 'deliverables'>> & { actionItems?: string[] }
): TaskTemplate {
  return {
    id: id('tt'),
    details: partial.details ?? '',
    deliverables: partial.deliverables ?? [],
    ...partial,
    actionItems: (partial.actionItems ?? []).map((text) => ({ id: id('ai'), text })),
  };
}

export function buildTemplate(): TaskTemplate[] {
  seq = 0;
  return [
    // ---- Pre-boarding ----
    t({
      title: 'Send offer paperwork & collect signed contract',
      dayOffset: -10, timingLabel: 'Before Day 1', durationMins: 30,
      owner: 'HR', involves: ['HR'],
      details: 'Send contract, tax and banking forms via the HR system. Chase anything unsigned 3 days before start.',
      actionItems: ['Send contract pack', 'Confirm signed contract received', 'File forms in personnel record'],
      deliverables: ['Signed contract on file'],
    }),
    t({
      title: 'Provision laptop and accounts',
      dayOffset: -5, timingLabel: 'Before Day 1', durationMins: 90,
      owner: 'IT', involves: ['IT', 'TEAM_LEAD'],
      details: 'Image laptop, create email/SSO accounts, add to team groups requested by the department lead.',
      actionItems: ['Order/image laptop', 'Create email + SSO', 'Add to team access groups'],
      deliverables: ['Laptop ready for Day 1', 'Credentials sealed for handover'],
    }),
    t({
      title: 'Prepare desk, badge and welcome kit',
      dayOffset: -3, timingLabel: 'Before Day 1', durationMins: 45,
      owner: 'OFFICE_ADMIN', involves: ['OFFICE_ADMIN'],
      details: 'Desk assignment, building badge, welcome kit (notebook, swag, seating map).',
      actionItems: ['Assign desk', 'Print badge', 'Assemble welcome kit'],
      deliverables: ['Badge active', 'Desk ready'],
    }),
    t({
      title: 'Manager: write the 30-60-90 plan',
      dayOffset: -5, timingLabel: 'Before Day 1', durationMins: 60,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD', 'HR'],
      details: 'Draft what success looks like at 30, 60 and 90 days. Share with HR before start so expectations are set from Day 1.',
      actionItems: ['Draft 30-60-90 goals', 'Share with HR'],
      deliverables: ['30-60-90 plan document'],
    }),
    t({
      title: 'Manager: assign an onboarding buddy',
      dayOffset: -3, timingLabel: 'Before Day 1', durationMins: 15,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD'],
      details: 'Pick a peer (not the manager) as buddy. Brief them: daily check-ins in week 1, lunch on Day 1.',
      actionItems: ['Choose buddy', 'Brief buddy on expectations'],
      deliverables: ['Buddy confirmed'],
    }),
    t({
      title: 'Send welcome email with first-day logistics',
      dayOffset: -2, timingLabel: 'Before Day 1', durationMins: 15,
      owner: 'HR', involves: ['HR', 'OFFICE_ADMIN'],
      details: 'Where to go, when, who meets them, what to bring, dress code, first-day schedule.',
      actionItems: ['Send welcome email', 'Confirm hire acknowledged'],
      deliverables: ['First-day logistics confirmed'],
    }),
    // ---- Day 1 ----
    t({
      title: 'Office tour, badge handover & safety walkthrough',
      dayOffset: 0, timingLabel: 'Day 1', durationMins: 30,
      owner: 'OFFICE_ADMIN', involves: ['OFFICE_ADMIN'],
      details: 'Meet at reception. Tour, fire exits, kitchen, printers, desk handover.',
      actionItems: ['Reception meet & greet', 'Tour + safety walkthrough', 'Hand over badge & desk'],
    }),
    t({
      title: 'IT setup: laptop login, 2FA, core tools',
      dayOffset: 0, timingLabel: 'Day 1', durationMins: 60,
      owner: 'IT', involves: ['IT'],
      details: 'First login, password reset, 2FA enrolment, email, chat, VPN, and the team’s core tools.',
      actionItems: ['First login + password', 'Enrol 2FA', 'Verify email/chat/VPN access'],
      deliverables: ['Hire can access all core systems'],
    }),
    t({
      title: 'Welcome meeting with your manager',
      dayOffset: 0, timingLabel: 'Day 1', durationMins: 45,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD'],
      details: 'Walk through the 30-60-90 plan, how the team works, communication norms, and the week-1 schedule.',
      actionItems: ['Review 30-60-90 plan together', 'Agree week-1 schedule'],
      deliverables: ['Shared 30-60-90 plan'],
    }),
    t({
      title: 'Team lunch with your buddy',
      dayOffset: 0, timingLabel: 'Day 1', durationMins: 60,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD'],
      details: 'Purely social — no work agenda. Buddy hosts, team joins. This is a deliberate human touchpoint, not admin.',
    }),
    t({
      title: 'HR intro: paperwork check & benefits overview',
      dayOffset: 0, timingLabel: 'Day 1', durationMins: 45,
      owner: 'HR', involves: ['HR'],
      details: 'Verify remaining paperwork, explain payroll cycle, benefits enrolment window, and who to ask what.',
      actionItems: ['Verify outstanding forms', 'Walk through benefits options'],
    }),
    // ---- Week 1 ----
    t({
      title: 'Complete benefits enrolment',
      dayOffset: 4, timingLabel: 'Week 1', durationMins: 40,
      owner: 'NEW_HIRE', involves: ['HR'],
      details: 'Choose plans in the benefits portal. HR is available for questions; enrolment window closes at day 30.',
      actionItems: ['Pick health plan', 'Set retirement contribution', 'Add dependents if any'],
      deliverables: ['Benefits enrolment submitted'],
    }),
    t({
      title: 'Security & compliance training',
      dayOffset: 3, timingLabel: 'Week 1', durationMins: 60,
      owner: 'NEW_HIRE', involves: ['IT', 'HR'],
      details: 'Mandatory modules: security basics, data handling, code of conduct.',
      actionItems: ['Security module', 'Data handling module', 'Code of conduct'],
      deliverables: ['Training completion certificates'],
    }),
    t({
      title: 'Meet your key stakeholders (intro round)',
      dayOffset: 4, timingLabel: 'Week 1', durationMins: 120,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD'],
      details: 'Manager books 30-min intros with the 4–6 people the hire will work with most. Human connection, not status meetings.',
      actionItems: ['Manager books intro meetings', 'Hire attends and notes who-does-what'],
      deliverables: ['Stakeholder map (who to ask what)'],
    }),
    t({
      title: 'First starter task shipped',
      dayOffset: 5, timingLabel: 'Week 1', durationMins: 240,
      owner: 'NEW_HIRE', involves: ['TEAM_LEAD'],
      details: 'A small, real, shippable piece of work — chosen by the manager so the first week is about the job, not paperwork.',
      actionItems: ['Manager assigns starter task', 'Ship it', 'Quick retro with buddy'],
      deliverables: ['First contribution shipped'],
    }),
    // ---- Day 30 ----
    t({
      title: '30-day review with your manager',
      dayOffset: 30, timingLabel: 'Day 30', durationMins: 45,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD'],
      details: 'Review the first month against the 30-60-90 plan. Two-way: what’s working, what’s blocking, what to adjust.',
      actionItems: ['Review 30-day goals', 'Adjust 60/90 goals if needed'],
      deliverables: ['Updated 30-60-90 plan'],
    }),
    // ---- Day 60 ----
    t({
      title: 'Cross-team shadowing session',
      dayOffset: 55, timingLabel: 'Day 60', durationMins: 120,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD'],
      details: 'Half a day with an adjacent team the hire depends on, to see how work actually flows between teams.',
    }),
    // ---- Day 90 ----
    t({
      title: '90-day review & onboarding wrap-up',
      dayOffset: 90, timingLabel: 'Day 90', durationMins: 60,
      owner: 'TEAM_LEAD', involves: ['TEAM_LEAD', 'HR'],
      details: 'Formal end of onboarding: review the 90-day goals, confirm role expectations going forward, HR closes the onboarding record.',
      actionItems: ['Review 90-day goals', 'HR closes onboarding record'],
      deliverables: ['Onboarding completion sign-off'],
    }),
  ];
}

export function instantiateTasks(template: TaskTemplate[]): Task[] {
  return template.map((tt) => ({
    ...tt,
    id: id('task'),
    actionItems: tt.actionItems.map((ai) => ({ ...ai, id: id('ai'), done: false })),
    deliverables: [...tt.deliverables],
    involves: [...tt.involves],
    done: false,
  }));
}

function instantiateCheckpoints(): Checkpoint[] {
  return CHECKPOINT_DAYS.map((c) => ({
    id: id('cp'),
    day: c.day,
    label: c.label,
    submitted: false,
  }));
}

/** Mark tasks done up to a given day offset, with optional skips (indices into the sorted-by-day list). */
function progressTasks(tasks: Task[], uptoDay: number, skipTitles: string[] = []): void {
  for (const task of tasks) {
    if (task.dayOffset <= uptoDay && !skipTitles.includes(task.title)) {
      task.done = true;
      task.actionItems.forEach((ai) => (ai.done = true));
    }
  }
}

export function buildSeedState(): AppState {
  const template = buildTemplate();
  const today = todayISO();

  const managers = [
    { id: 'mgr-dana', name: 'Dana Park', title: 'Engineering Manager' },
    { id: 'mgr-luis', name: 'Luis Romero', title: 'Customer Success Lead' },
  ];

  const mkHire = (
    hid: string, name: string, role: string, department: string,
    managerId: string, buddyName: string, startOffsetFromToday: number
  ): Hire => ({
    id: hid, name, role, department, managerId, buddyName,
    startDate: addDaysISO(today, startOffsetFromToday),
    tasks: instantiateTasks(template),
    checkpoints: instantiateCheckpoints(),
    chat: [],
  });

  // Starts in 9 days — pre-boarding underway.
  const maya = mkHire('hire-maya', 'Maya Chen', 'Product Designer', 'Design', 'mgr-dana', 'Elle Watson', 9);
  progressTasks(maya.tasks, -6);

  // Day 7 — healthy, week-1 checkpoint just came due.
  const jordan = mkHire('hire-jordan', 'Jordan Okafor', 'Software Engineer', 'Engineering', 'mgr-dana', 'Priya Nair', -7);
  progressTasks(jordan.tasks, 5, ['Security & compliance training']);

  // Day 16 — behind schedule: two tasks well overdue.
  const alex = mkHire('hire-alex', 'Alex Kim', 'Support Specialist', 'Customer Success', 'mgr-luis', 'Tom Field', -16);
  progressTasks(alex.tasks, 4, ['IT setup: laptop login, 2FA, core tools']);
  {
    const w1 = alex.checkpoints.find((c) => c.day === 7)!;
    w1.submitted = true; w1.rating = 3; w1.submittedOnDay = 8;
    w1.comment = 'Okay so far, but I still don’t have access to half the tools I need.';
  }

  // Day 36 — at-risk: missed the Day-30 checkpoint (past grace), low week-1 rating.
  const sam = mkHire('hire-sam', 'Sam Reyes', 'Account Executive', 'Sales', 'mgr-luis', 'Gina Brand', -36);
  progressTasks(sam.tasks, 6, ['Meet your key stakeholders (intro round)', 'First starter task shipped']);
  {
    const w1 = sam.checkpoints.find((c) => c.day === 7)!;
    w1.submitted = true; w1.rating = 2; w1.submittedOnDay = 7;
    w1.comment = 'Mostly paperwork so far. I’ve barely spoken to my team and I’m not sure what I’m meant to be doing.';
    // Day-30 checkpoint left unsubmitted → missed.
  }

  // Day 85 — nearly done, healthy.
  const priya = mkHire('hire-priya', 'Priya Nair', 'Data Analyst', 'Engineering', 'mgr-dana', 'Jordan Lee', -85);
  progressTasks(priya.tasks, 60);
  for (const [day, rating, comment] of [
    [7, 5, 'Great first week — buddy system really worked.'],
    [30, 4, 'Settled in. Would have liked earlier access to the analytics stack.'],
    [60, 4, 'Going well, shipping regularly.'],
  ] as const) {
    const cp = priya.checkpoints.find((c) => c.day === day)!;
    cp.submitted = true; cp.rating = rating; cp.comment = comment; cp.submittedOnDay = day;
  }

  return {
    company: {
      name: 'Brightloop Ltd',
      blurb: 'Brightloop builds monitoring hardware and software for commercial refrigeration fleets. ~180 people across Auckland and Melbourne.',
      officeAddress: 'Level 4, 12 Halsey Street, Auckland CBD. Office hours 8:00–18:00; badge access after hours.',
      wifiNote: 'Wi-Fi: network "Brightloop-Corp", sign in with your SSO account. Guest network is "Brightloop-Guest" (password at reception).',
      payrollNote: 'Payroll runs fortnightly on Wednesdays. Payslips appear in the HR portal. Bank/tax changes need 5 working days’ notice.',
      ptoNote: 'Leave: 4 weeks annual + public holidays. Request in the HR portal; your manager approves. Sick leave needs no advance approval — just tell your manager.',
      toolsNote: 'Core tools: Google Workspace (email/docs), Slack (chat), Jira (work tracking), and the HR portal for anything people-related.',
    },
    contacts: [
      { id: 'c-1', name: 'Dana Park', role: 'Engineering Manager', group: 'TEAM_LEAD', email: 'dana.park@brightloop.example' },
      { id: 'c-2', name: 'Luis Romero', role: 'Customer Success Lead', group: 'TEAM_LEAD', email: 'luis.romero@brightloop.example' },
      { id: 'c-3', name: 'Aroha Ngata', role: 'HR Ops Lead (onboarding owner)', group: 'HR', email: 'aroha.ngata@brightloop.example' },
      { id: 'c-4', name: 'Ben Sutton', role: 'HR Coordinator (payroll & benefits)', group: 'HR', email: 'ben.sutton@brightloop.example' },
      { id: 'c-5', name: 'Kai Zhou', role: 'IT Helpdesk', group: 'IT', email: 'helpdesk@brightloop.example' },
      { id: 'c-6', name: 'Mere Kaipara', role: 'Office Manager (badges, desks, deliveries)', group: 'OFFICE_ADMIN', email: 'office@brightloop.example' },
    ],
    faqs: [
      { id: 'f-1', q: 'When do I get paid?', a: 'Fortnightly on Wednesdays. Your first payslip appears in the HR portal after your first full pay period.' },
      { id: 'f-2', q: 'How do I book leave?', a: 'Request it in the HR portal; your manager approves it there. Sick leave: just message your manager.' },
      { id: 'f-3', q: 'Who fixes laptop/access problems?', a: 'IT Helpdesk (Kai Zhou) — #it-help on Slack or helpdesk@brightloop.example.' },
      { id: 'f-4', q: 'Can I work from home?', a: 'Hybrid by default: 3 office days (Tue–Thu) during onboarding, flexible after your 90-day wrap-up, agreed with your manager.' },
    ],
    managers,
    hires: [maya, jordan, alex, sam, priya],
    templateTasks: template,
    checkpointDays: CHECKPOINT_DAYS,
    escalations: [
      {
        id: 'esc-1', hireId: 'hire-alex', hireName: 'Alex Kim',
        topic: 'Tool access still missing', note: 'Two weeks in and I still can’t access the support ticketing queue.',
        createdOnDay: 14, status: 'open',
      },
    ],
  };
}
