// Derived status: progress, overdue work, checkpoint states and the
// behind-schedule / at-risk flags. All rules are transparent — every flag
// carries the human-readable reasons it fired, so the dashboard never shows
// a black-box score.

import { daysSince } from './seed';
import { CheckpointView, Hire, HireStatus, Task } from './types';

/** Days after a checkpoint's due day before an unsubmitted checkpoint counts as missed. */
export const CHECKPOINT_GRACE_DAYS = 4;
/** A task this many days past due is "seriously overdue". */
export const SERIOUS_OVERDUE_DAYS = 3;
/** This many overdue tasks ⇒ behind schedule. */
export const BEHIND_TASK_THRESHOLD = 2;
/** A checkpoint rating at or below this ⇒ at-risk signal. */
export const LOW_RATING = 2;

export function checkpointViews(hire: Hire, daysIn: number): CheckpointView[] {
  return hire.checkpoints.map((cp) => {
    let status: CheckpointView['status'];
    if (cp.submitted) status = 'submitted';
    else if (daysIn > cp.day + CHECKPOINT_GRACE_DAYS) status = 'missed';
    else if (daysIn >= cp.day) status = 'due';
    else status = 'upcoming';
    return { ...cp, status };
  });
}

export function overdueTasks(hire: Hire, daysIn: number): Task[] {
  return hire.tasks.filter((t) => !t.done && t.dayOffset < daysIn);
}

export function hireStatus(hire: Hire): HireStatus {
  const daysIn = daysSince(hire.startDate);
  const totalTasks = hire.tasks.length;
  const doneTasks = hire.tasks.filter((t) => t.done).length;
  const overdue = overdueTasks(hire, daysIn);
  const cps = checkpointViews(hire, daysIn);
  const reasons: string[] = [];

  const missedCps = cps.filter((c) => c.status === 'missed');
  const lowRatings = cps.filter((c) => c.submitted && (c.rating ?? 5) <= LOW_RATING);
  const seriouslyOverdue = overdue.filter((t) => daysIn - t.dayOffset >= SERIOUS_OVERDUE_DAYS);

  for (const c of missedCps) reasons.push(`Missed the ${c.label} feedback checkpoint`);
  for (const c of lowRatings) reasons.push(`Rated the ${c.label} checkpoint ${c.rating}/5`);

  let health: HireStatus['health'];
  if (daysIn < 0) {
    health = 'not-started';
    if (overdue.length > 0) {
      health = 'behind';
      reasons.push(`${overdue.length} pre-boarding task${overdue.length > 1 ? 's' : ''} overdue before start day`);
    }
  } else if (daysIn > 90 && doneTasks === totalTasks && cps.every((c) => c.submitted)) {
    health = 'completed';
  } else if (missedCps.length > 0 || lowRatings.length > 0 || seriouslyOverdue.length >= 4) {
    health = 'at-risk';
    if (seriouslyOverdue.length >= 4) {
      reasons.push(`${seriouslyOverdue.length} tasks more than ${SERIOUS_OVERDUE_DAYS} days overdue`);
    }
  } else if (overdue.length >= BEHIND_TASK_THRESHOLD) {
    health = 'behind';
    reasons.push(`${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}: ${overdue.slice(0, 3).map((t) => `“${t.title}”`).join(', ')}${overdue.length > 3 ? '…' : ''}`);
  } else {
    health = 'on-track';
  }

  return { hireId: hire.id, daysIn, totalTasks, doneTasks, overdueTasks: overdue, checkpoints: cps, health, reasons };
}

export function healthLabel(health: HireStatus['health']): string {
  switch (health) {
    case 'not-started': return 'Starts soon';
    case 'on-track': return 'On track';
    case 'behind': return 'Behind schedule';
    case 'at-risk': return 'At risk';
    case 'completed': return 'Completed';
  }
}

/** Tasks on this hire's checklist that a given people-group is responsible for. */
export function tasksOwnedBy(hire: Hire, owner: Task['owner']): Task[] {
  return hire.tasks.filter((t) => t.owner === owner);
}

export function formatDayOffset(dayOffset: number): string {
  if (dayOffset < 0) return `${-dayOffset} day${dayOffset === -1 ? '' : 's'} before start`;
  return `Day ${dayOffset + 1}`;
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
