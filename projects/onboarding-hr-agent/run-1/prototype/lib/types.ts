// Domain types for the Onboarding HR Agent prototype.
// All state is in-memory demo data — see data-schema-brief.md for what a
// real ATS/HRIS-backed version of each entity would need.

export type PeopleGroup = 'TEAM_LEAD' | 'HR' | 'IT' | 'OFFICE_ADMIN';

export const PEOPLE_GROUP_LABELS: Record<PeopleGroup, string> = {
  TEAM_LEAD: 'Team/Department Lead',
  HR: 'HR Team',
  IT: 'IT',
  OFFICE_ADMIN: 'Office Admin',
};

export const ALL_PEOPLE_GROUPS: PeopleGroup[] = ['TEAM_LEAD', 'HR', 'IT', 'OFFICE_ADMIN'];

/** Who is responsible for driving a task to done. */
export type TaskOwner = 'NEW_HIRE' | PeopleGroup;

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  details: string;
  /** Calendar days relative to the hire's start date. Negative = pre-boarding. */
  dayOffset: number;
  /** Human label for the timing bucket, e.g. "Before Day 1", "Week 1", "Day 30". */
  timingLabel: string;
  durationMins: number;
  owner: TaskOwner;
  /** People involved, grouped for the filter. */
  involves: PeopleGroup[];
  actionItems: ActionItem[];
  deliverables: string[];
  done: boolean;
}

/** Template task: same shape minus completion state. */
export type TaskTemplate = Omit<Task, 'done' | 'actionItems'> & {
  actionItems: { id: string; text: string }[];
};

export interface Checkpoint {
  id: string;
  /** Day offset from start when this checkpoint is due. */
  day: number;
  label: string; // "Week 1", "Day 30", ...
  submitted: boolean;
  rating?: number; // 1–5
  comment?: string;
  submittedOnDay?: number;
}

export interface ChatMessage {
  id: string;
  from: 'hire' | 'assistant';
  text: string;
  /** Set when the assistant suggests a human instead of answering. */
  suggestsHuman?: boolean;
}

export interface Escalation {
  id: string;
  hireId: string;
  hireName: string;
  topic: string;
  note: string;
  createdOnDay: number;
  status: 'open' | 'resolved';
}

export interface Hire {
  id: string;
  name: string;
  role: string;
  department: string;
  managerId: string;
  buddyName: string;
  startDate: string; // ISO yyyy-mm-dd
  tasks: Task[];
  checkpoints: Checkpoint[];
  chat: ChatMessage[];
}

export interface Manager {
  id: string;
  name: string;
  title: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  group: PeopleGroup;
  email: string;
}

export interface Faq {
  id: string;
  q: string;
  a: string;
}

export interface CompanyInfo {
  name: string;
  blurb: string;
  officeAddress: string;
  wifiNote: string;
  payrollNote: string;
  ptoNote: string;
  toolsNote: string;
}

export interface AppState {
  company: CompanyInfo;
  contacts: Contact[];
  faqs: Faq[];
  managers: Manager[];
  hires: Hire[];
  templateTasks: TaskTemplate[];
  checkpointDays: { day: number; label: string }[];
  escalations: Escalation[];
}

// ---- Derived status types (computed, never stored) ----

export type HireHealth = 'not-started' | 'on-track' | 'behind' | 'at-risk' | 'completed';

export interface CheckpointView extends Checkpoint {
  status: 'upcoming' | 'due' | 'submitted' | 'missed';
}

export interface HireStatus {
  hireId: string;
  daysIn: number; // negative if not started yet
  totalTasks: number;
  doneTasks: number;
  overdueTasks: Task[];
  checkpoints: CheckpointView[];
  health: HireHealth;
  reasons: string[]; // human-readable reasons behind the flag
}
