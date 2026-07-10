'use client';

// Hiring Manager view: their own tasks per hire, reminders for overdue and
// upcoming manager work, and live progress + check-in feedback for each of
// their new hires.

import React, { useState } from 'react';
import { CheckpointStrip } from '@/components/checkpoints';
import { HealthBadge, ProgressBar, Section } from '@/components/ui';
import { formatDayOffset, formatDuration, hireStatus, tasksOwnedBy } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { Hire, Task } from '@/lib/types';

function ManagerTaskRow({ hire, task, daysIn }: { hire: Hire; task: Task; daysIn: number }) {
  const { toggleTask } = useStore();
  const overdue = !task.done && task.dayOffset < daysIn;
  return (
    <li className={`task ${task.done ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}`}>
      <div className="task-row">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleTask(hire.id, task.id)}
          aria-label={`Mark “${task.title}” for ${hire.name} ${task.done ? 'not done' : 'done'}`}
        />
        <span className="task-title" style={{ cursor: 'default' }}>
          {task.title}
          {overdue && <span className="badge badge-overdue">overdue</span>}
        </span>
        <span className="task-meta">
          {hire.name.split(' ')[0]} · {formatDayOffset(task.dayOffset)} · {formatDuration(task.durationMins)}
        </span>
      </div>
    </li>
  );
}

export default function ManagerPage() {
  const { state } = useStore();
  const [managerId, setManagerId] = useState('mgr-dana');
  const manager = state.managers.find((m) => m.id === managerId) ?? state.managers[0];
  const myHires = state.hires.filter((h) => h.managerId === manager.id);

  const reminders: { hire: Hire; task: Task; daysIn: number; overdue: boolean }[] = [];
  for (const hire of myHires) {
    const daysIn = hireStatus(hire).daysIn;
    for (const task of tasksOwnedBy(hire, 'TEAM_LEAD')) {
      if (task.done) continue;
      const overdue = task.dayOffset < daysIn;
      const dueSoon = task.dayOffset >= daysIn && task.dayOffset <= daysIn + 7;
      if (overdue || dueSoon) reminders.push({ hire, task, daysIn, overdue });
    }
  }
  reminders.sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.task.dayOffset - b.task.dayOffset);

  const openEscalations = state.escalations.filter(
    (e) => e.status === 'open' && myHires.some((h) => h.id === e.hireId)
  );

  return (
    <div>
      <div className="viewing-as">
        <span><strong>Viewing as hiring manager</strong> (demo role switcher):</span>
        <select value={manager.id} onChange={(e) => setManagerId(e.target.value)} aria-label="Choose which manager to view as">
          {state.managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name} — {m.title}</option>
          ))}
        </select>
      </div>

      <div className="page-head">
        <h1>{manager.name}'s onboarding cockpit</h1>
        <p className="muted">
          Active managers make new hires 3.4× more likely to rate onboarding as exceptional — this view exists so
          your part never falls through the cracks.
        </p>
      </div>

      <Section title={`⏰ Reminders — your tasks (${reminders.filter((r) => r.overdue).length} overdue, ${reminders.filter((r) => !r.overdue).length} due within a week)`}>
        {reminders.length === 0 ? (
          <p className="muted">Nothing overdue or due in the next 7 days. 🎉</p>
        ) : (
          <ul className="task-list">
            {reminders.map(({ hire, task, daysIn }) => (
              <ManagerTaskRow key={`${hire.id}-${task.id}`} hire={hire} task={task} daysIn={daysIn} />
            ))}
          </ul>
        )}
      </Section>

      {openEscalations.length > 0 && (
        <Section title="🙋 Open escalations from your hires">
          {openEscalations.map((e) => (
            <div key={e.id} className="esc-item esc-open">
              <div className="grow">
                <strong>{e.hireName}</strong>: {e.topic}
                {e.note && <p className="muted small">“{e.note}”</p>}
              </div>
              <span className="muted small">day {e.createdOnDay + 1} · HR is on it — worth a check-in from you too</span>
            </div>
          ))}
        </Section>
      )}

      <h2 style={{ margin: '20px 0 12px' }}>Your new hires</h2>
      {myHires.map((hire) => {
        const status = hireStatus(hire);
        const myTasks = tasksOwnedBy(hire, 'TEAM_LEAD');
        const myDone = myTasks.filter((t) => t.done).length;
        return (
          <Section
            key={hire.id}
            title={`${hire.name} — ${hire.role}`}
            aside={<HealthBadge health={status.health} />}
          >
            <div className="stat-row">
              <div className="stat">
                <b>{status.daysIn < 0 ? `T−${-status.daysIn}` : `Day ${status.daysIn + 1}`}</b>
                <span>{status.daysIn < 0 ? 'days until start' : 'of onboarding'}</span>
              </div>
              <div className="stat" style={{ flex: 1 }}>
                <span>Overall checklist progress (live — same data the hire and HR Ops see)</span>
                <ProgressBar done={status.doneTasks} total={status.totalTasks} />
              </div>
              <div className="stat">
                <b>{myDone}/{myTasks.length}</b>
                <span>your manager tasks done</span>
              </div>
            </div>
            {status.reasons.length > 0 && (
              <ul className="reason-list">
                {status.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
            <h4>Your tasks for {hire.name.split(' ')[0]}</h4>
            <ul className="task-list">
              {myTasks.map((task) => (
                <ManagerTaskRow key={task.id} hire={hire} task={task} daysIn={status.daysIn} />
              ))}
            </ul>
            <h4>Feedback check-ins</h4>
            <CheckpointStrip hire={hire} checkpoints={status.checkpoints} canSubmit={false} />
          </Section>
        );
      })}
    </div>
  );
}
