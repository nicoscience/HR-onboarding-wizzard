'use client';

// Per-hire checklist: grouped by timing bucket, filterable by people
// involved, tasks expandable to timing/duration/people/action items/
// deliverables. Checking things off updates the shared store, so the
// manager view and HR Ops dashboard reflect it immediately.

import React, { useState } from 'react';
import { formatDayOffset, formatDuration } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { Hire, PEOPLE_GROUP_LABELS, PeopleGroup, Task } from '@/lib/types';
import { GroupTag, PeopleFilter } from './ui';

function ownerLabel(owner: Task['owner']): string {
  return owner === 'NEW_HIRE' ? 'You (new hire)' : PEOPLE_GROUP_LABELS[owner];
}

function TaskRow({ hire, task, daysIn }: { hire: Hire; task: Task; daysIn: number }) {
  const { toggleTask, toggleActionItem } = useStore();
  const [open, setOpen] = useState(false);
  const overdue = !task.done && task.dayOffset < daysIn;

  return (
    <li className={`task ${task.done ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}`}>
      <div className="task-row">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleTask(hire.id, task.id)}
          aria-label={`Mark “${task.title}” ${task.done ? 'not done' : 'done'}`}
        />
        <button className="task-title" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {task.title}
          {overdue && <span className="badge badge-overdue">overdue</span>}
        </button>
        <span className="task-meta">
          {task.timingLabel} · {formatDuration(task.durationMins)}
        </span>
        <button className="btn-ghost" onClick={() => setOpen((o) => !o)}>
          {open ? '▴' : '▾'}
        </button>
      </div>
      {open && (
        <div className="task-detail">
          {task.details && <p>{task.details}</p>}
          <dl className="task-facts">
            <div><dt>Timing</dt><dd>{formatDayOffset(task.dayOffset)} ({task.timingLabel})</dd></div>
            <div><dt>Duration</dt><dd>{formatDuration(task.durationMins)}</dd></div>
            <div><dt>Responsible</dt><dd>{ownerLabel(task.owner)}</dd></div>
            <div>
              <dt>People involved</dt>
              <dd>{task.involves.length ? task.involves.map((g) => <GroupTag key={g} group={g} />) : '—'}</dd>
            </div>
          </dl>
          {task.actionItems.length > 0 && (
            <div className="task-sub">
              <h4>Action items</h4>
              <ul>
                {task.actionItems.map((ai) => (
                  <li key={ai.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={ai.done}
                        onChange={() => toggleActionItem(hire.id, task.id, ai.id)}
                      />
                      <span className={ai.done ? 'done-text' : ''}>{ai.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {task.deliverables.length > 0 && (
            <div className="task-sub">
              <h4>Deliverables</h4>
              <ul>{task.deliverables.map((d, i) => <li key={i}>📄 {d}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function HireChecklist({ hire, daysIn }: { hire: Hire; daysIn: number }) {
  const [filter, setFilter] = useState<PeopleGroup | 'ALL'>('ALL');

  const visible = hire.tasks.filter(
    (t) => filter === 'ALL' || t.involves.includes(filter) || t.owner === filter
  );

  // Group by timing bucket, preserving checklist order.
  const buckets: { label: string; tasks: Task[] }[] = [];
  for (const task of visible) {
    const bucket = buckets.find((b) => b.label === task.timingLabel);
    if (bucket) bucket.tasks.push(task);
    else buckets.push({ label: task.timingLabel, tasks: [task] });
  }

  return (
    <div>
      <PeopleFilter active={filter} onChange={setFilter} />
      {buckets.length === 0 && <p className="muted">No tasks involve this group.</p>}
      {buckets.map((bucket) => (
        <div key={bucket.label} className="bucket">
          <h3 className="bucket-title">{bucket.label}</h3>
          <ul className="task-list">
            {bucket.tasks.map((task) => (
              <TaskRow key={task.id} hire={hire} task={task} daysIn={daysIn} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
