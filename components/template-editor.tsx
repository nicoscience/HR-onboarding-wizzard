'use client';

// Checklist Settings (HR Ops): the company template with full mechanics —
// ↑/↓ reorder, "+ Add task here" insertion between any two steps, in-place
// editing of every field, expandable detail, delete, and the
// people-involved filter. Template edits do NOT silently change live
// hires; "Apply template to existing hires" does that explicitly.

import React, { useState } from 'react';
import { formatDuration } from '@/lib/engine';
import { useStore } from '@/lib/store';
import {
  ALL_PEOPLE_GROUPS,
  PEOPLE_GROUP_LABELS,
  PeopleGroup,
  TaskTemplate,
} from '@/lib/types';
import { GroupTag, PeopleFilter } from './ui';

const TIMING_OPTIONS = ['Before Day 1', 'Day 1', 'Week 1', 'Day 30', 'Day 60', 'Day 90'];

function TemplateTaskEditor({ task, onClose }: { task: TaskTemplate; onClose: () => void }) {
  const { updateTemplateTask } = useStore();
  const [draft, setDraft] = useState<TaskTemplate>({
    ...task,
    involves: [...task.involves],
    actionItems: task.actionItems.map((a) => ({ ...a })),
    deliverables: [...task.deliverables],
  });

  const set = <K extends keyof TaskTemplate>(key: K, value: TaskTemplate[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleGroup = (g: PeopleGroup) =>
    set('involves', draft.involves.includes(g) ? draft.involves.filter((x) => x !== g) : [...draft.involves, g]);

  return (
    <div className="editor">
      <label className="field">
        <span>Title</span>
        <input value={draft.title} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label className="field">
        <span>Details</span>
        <textarea rows={2} value={draft.details} onChange={(e) => set('details', e.target.value)} />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Timing bucket</span>
          <select value={draft.timingLabel} onChange={(e) => set('timingLabel', e.target.value)}>
            {TIMING_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Day offset (0 = start day, negative = before start)</span>
          <input
            type="number"
            value={draft.dayOffset}
            onChange={(e) => set('dayOffset', Number(e.target.value) || 0)}
          />
        </label>
        <label className="field">
          <span>Duration (minutes)</span>
          <input
            type="number"
            min={5}
            value={draft.durationMins}
            onChange={(e) => set('durationMins', Math.max(5, Number(e.target.value) || 5))}
          />
        </label>
      </div>
      <div className="field">
        <span>Responsible</span>
        <select value={draft.owner} onChange={(e) => set('owner', e.target.value as TaskTemplate['owner'])}>
          <option value="NEW_HIRE">New hire</option>
          {ALL_PEOPLE_GROUPS.map((g) => <option key={g} value={g}>{PEOPLE_GROUP_LABELS[g]}</option>)}
        </select>
      </div>
      <div className="field">
        <span>People involved</span>
        <div className="chip-row">
          {ALL_PEOPLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip chip-${g} ${draft.involves.includes(g) ? 'chip-active' : ''}`}
              onClick={() => toggleGroup(g)}
            >
              {PEOPLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Action items (one per line)</span>
        <textarea
          rows={3}
          value={draft.actionItems.map((a) => a.text).join('\n')}
          onChange={(e) =>
            set(
              'actionItems',
              e.target.value
                .split('\n')
                .filter((l) => l.trim())
                .map((text, i) => ({ id: draft.actionItems[i]?.id ?? `${draft.id}-ai-${i}`, text }))
            )
          }
        />
      </label>
      <label className="field">
        <span>Deliverables (one per line)</span>
        <textarea
          rows={2}
          value={draft.deliverables.join('\n')}
          onChange={(e) => set('deliverables', e.target.value.split('\n').filter((l) => l.trim()))}
        />
      </label>
      <div className="editor-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            updateTemplateTask(task.id, draft);
            onClose();
          }}
        >
          Save task
        </button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function AddTaskHere({ afterIndex, onAdded }: { afterIndex: number; onAdded: (id: string) => void }) {
  const { insertTemplateTask } = useStore();
  return (
    <button
      className="add-here"
      onClick={() => onAdded(insertTemplateTask(afterIndex))}
      title="Insert a new task at this position"
    >
      + Add task here
    </button>
  );
}

export function TemplateEditor() {
  const { state, moveTemplateTask, deleteTemplateTask, applyTemplateToHires } = useStore();
  const [filter, setFilter] = useState<PeopleGroup | 'ALL'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const tasks = state.templateTasks;

  return (
    <div>
      <p className="muted">
        This is the company checklist template. New hires get their own copy of it — editing here does{' '}
        <strong>not</strong> change hires already onboarding until you apply it below.
      </p>
      <PeopleFilter active={filter} onChange={setFilter} />
      <ul className="task-list template-list">
        <li key="add-top">
          <AddTaskHere afterIndex={-1} onAdded={setEditingId} />
        </li>
        {tasks.map((task, i) => {
          const hidden = filter !== 'ALL' && !task.involves.includes(filter) && task.owner !== filter;
          if (hidden) return null;
          const expanded = expandedId === task.id;
          return (
            <React.Fragment key={task.id}>
              <li className="task template-task">
                <div className="task-row">
                  <span className="order-btns">
                    <button aria-label="Move up" disabled={i === 0} onClick={() => moveTemplateTask(task.id, -1)}>↑</button>
                    <button aria-label="Move down" disabled={i === tasks.length - 1} onClick={() => moveTemplateTask(task.id, 1)}>↓</button>
                  </span>
                  <button
                    className="task-title"
                    onClick={() => setExpandedId(expanded ? null : task.id)}
                    aria-expanded={expanded}
                  >
                    {task.title}
                  </button>
                  <span className="task-meta">
                    {task.timingLabel} · {formatDuration(task.durationMins)}
                  </span>
                  <button className="btn-ghost" onClick={() => setEditingId(editingId === task.id ? null : task.id)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-ghost btn-danger" onClick={() => deleteTemplateTask(task.id)} aria-label={`Delete ${task.title}`}>
                    ✕
                  </button>
                </div>
                {editingId === task.id ? (
                  <TemplateTaskEditor task={task} onClose={() => setEditingId(null)} />
                ) : (
                  expanded && (
                    <div className="task-detail">
                      {task.details && <p>{task.details}</p>}
                      <p>
                        <strong>Involves:</strong>{' '}
                        {task.involves.length ? task.involves.map((g) => <GroupTag key={g} group={g} />) : '—'}
                      </p>
                      {task.actionItems.length > 0 && (
                        <p><strong>Action items:</strong> {task.actionItems.map((a) => a.text).join(' · ')}</p>
                      )}
                      {task.deliverables.length > 0 && (
                        <p><strong>Deliverables:</strong> {task.deliverables.join(' · ')}</p>
                      )}
                    </div>
                  )
                )}
              </li>
              <li key={`add-${task.id}`}>
                <AddTaskHere afterIndex={i} onAdded={setEditingId} />
              </li>
            </React.Fragment>
          );
        })}
      </ul>
      <div className="apply-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            applyTemplateToHires();
            setApplied(true);
            setTimeout(() => setApplied(false), 2500);
          }}
        >
          Apply template to existing hires
        </button>
        <span className="muted">
          {applied
            ? '✓ Applied — per-hire checklists rebuilt (completion kept where tasks match).'
            : 'Rebuilds every active hire’s checklist from this template, keeping completed tasks completed.'}
        </span>
      </div>
    </div>
  );
}
