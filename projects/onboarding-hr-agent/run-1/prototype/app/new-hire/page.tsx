'use client';

import React, { useState } from 'react';
import { ChatPanel } from '@/components/chat-panel';
import { HireChecklist } from '@/components/checklist';
import { CheckpointStrip } from '@/components/checkpoints';
import { ProgressBar, Section } from '@/components/ui';
import { hireStatus } from '@/lib/engine';
import { useStore } from '@/lib/store';

export default function NewHirePage() {
  const { state } = useStore();
  const [hireId, setHireId] = useState('hire-jordan');
  const hire = state.hires.find((h) => h.id === hireId) ?? state.hires[0];
  const status = hireStatus(hire);
  const manager = state.managers.find((m) => m.id === hire.managerId);
  const dueCheckpoint = status.checkpoints.find((c) => c.status === 'due');

  return (
    <div>
      <div className="viewing-as">
        <span>
          <strong>Viewing as new hire</strong> (demo role switcher — no real logins in this prototype):
        </span>
        <select value={hire.id} onChange={(e) => setHireId(e.target.value)} aria-label="Choose which new hire to view as">
          {state.hires.map((h) => (
            <option key={h.id} value={h.id}>{h.name} — {h.role}</option>
          ))}
        </select>
      </div>

      <div className="page-head">
        <h1>Welcome, {hire.name.split(' ')[0]} 👋</h1>
        <p className="muted">
          {hire.role} · {hire.department} · manager {manager?.name ?? '—'} · buddy {hire.buddyName} ·{' '}
          {status.daysIn < 0
            ? `starting in ${-status.daysIn} day${status.daysIn === -1 ? '' : 's'}`
            : `day ${status.daysIn + 1} of onboarding`}
        </p>
      </div>

      {dueCheckpoint && (
        <Section title={`📣 Your ${dueCheckpoint.label} check-in is open`}>
          <p className="muted small">
            Two minutes, goes straight to HR Ops. This is your channel to say how it's really going — don't skip it.
          </p>
          <CheckpointStrip hire={hire} checkpoints={[dueCheckpoint]} canSubmit />
        </Section>
      )}

      <div className="grid-2">
        <Section title="Your onboarding checklist" aside={<ProgressBar done={status.doneTasks} total={status.totalTasks} />}>
          <HireChecklist hire={hire} daysIn={status.daysIn} />
        </Section>

        <div>
          <Section title="Ask the onboarding assistant">
            <ChatPanel hire={hire} />
          </Section>
          <Section title="Feedback check-ins">
            <p className="muted small">
              Short check-ins at Week 1 and Days 30/60/90 — visible to you and HR Ops, so problems surface early.
            </p>
            <CheckpointStrip hire={hire} checkpoints={status.checkpoints} canSubmit />
          </Section>
        </div>
      </div>
    </div>
  );
}
