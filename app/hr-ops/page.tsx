'use client';

// HR Ops: status dashboard (behind-schedule / at-risk flags with reasons,
// open escalations), company info, key contacts, and checklist template
// settings with the full editing mechanics.

import React, { useState } from 'react';
import { CheckpointStrip } from '@/components/checkpoints';
import { TemplateEditor } from '@/components/template-editor';
import { ClientGate, GroupTag, HealthBadge, ProgressBar, Section } from '@/components/ui';
import { hireStatus } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { ALL_PEOPLE_GROUPS, CompanyInfo, PEOPLE_GROUP_LABELS } from '@/lib/types';

type Tab = 'dashboard' | 'company' | 'contacts' | 'checklist';

function Dashboard() {
  const { state, resolveEscalation } = useStore();
  const statuses = state.hires.map((h) => ({ hire: h, status: hireStatus(h) }));
  const atRisk = statuses.filter((s) => s.status.health === 'at-risk').length;
  const behind = statuses.filter((s) => s.status.health === 'behind').length;
  const openEsc = state.escalations.filter((e) => e.status === 'open');

  const order = { 'at-risk': 0, behind: 1, 'on-track': 2, 'not-started': 3, completed: 4 } as const;
  statuses.sort((a, b) => order[a.status.health] - order[b.status.health]);

  return (
    <div>
      <div className="stat-row">
        <div className="stat"><b>{state.hires.length}</b><span>hires onboarding</span></div>
        <div className="stat"><b style={{ color: 'var(--risk)' }}>{atRisk}</b><span>at risk</span></div>
        <div className="stat"><b style={{ color: 'var(--warn)' }}>{behind}</b><span>behind schedule</span></div>
        <div className="stat"><b style={{ color: 'var(--human)' }}>{openEsc.length}</b><span>open escalations</span></div>
      </div>

      <Section title="🙋 Escalations (from the new-hire chat)">
        {state.escalations.length === 0 && <p className="muted">None yet.</p>}
        {state.escalations.map((e) => (
          <div key={e.id} className={`esc-item ${e.status === 'open' ? 'esc-open' : ''}`}>
            <div className="grow">
              <strong>{e.hireName}</strong>: {e.topic}
              {e.note && <p className="muted small">“{e.note}”</p>}
            </div>
            <span className="muted small">day {e.createdOnDay + 1}</span>
            {e.status === 'open' ? (
              <button className="btn btn-small" onClick={() => resolveEscalation(e.id)}>Mark resolved</button>
            ) : (
              <span className="badge health-on-track">resolved</span>
            )}
          </div>
        ))}
      </Section>

      {statuses.map(({ hire, status }) => (
        <div key={hire.id} className="hire-card" style={{ marginBottom: 14 }}>
          <div className="hire-card-head">
            <div>
              <h3>{hire.name} — {hire.role} ({hire.department})</h3>
              <p className="muted small">
                Started {hire.startDate} · {status.daysIn < 0 ? `starts in ${-status.daysIn} days` : `day ${status.daysIn + 1}`} ·
                manager {state.managers.find((m) => m.id === hire.managerId)?.name}
              </p>
            </div>
            <HealthBadge health={status.health} />
          </div>
          <ProgressBar done={status.doneTasks} total={status.totalTasks} />
          {status.reasons.length > 0 ? (
            <ul className="reason-list">
              {status.reasons.map((r, i) => <li key={i}>⚠ {r}</li>)}
            </ul>
          ) : (
            <p className="muted small" style={{ marginTop: 8 }}>No flags. Rules: overdue tasks ⇒ behind; missed checkpoint, low check-in score, or 4+ seriously overdue tasks ⇒ at risk.</p>
          )}
          <div style={{ marginTop: 10 }}>
            <CheckpointStrip hire={hire} checkpoints={status.checkpoints} canSubmit={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanyTab() {
  const { state, updateCompany, updateFaq, addFaq, removeFaq } = useStore();
  const c = state.company;
  const field = (label: string, key: keyof CompanyInfo, rows = 2) => (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={c[key]} onChange={(e) => updateCompany({ [key]: e.target.value })} />
    </label>
  );
  return (
    <div>
      <Section title="Company info (grounds the new-hire assistant)">
        <p className="muted small">Everything here is what the chat assistant is allowed to answer from. Edit it and the assistant's answers change immediately.</p>
        <div className="editor" style={{ borderTop: 'none', paddingTop: 0 }}>
          <label className="field"><span>Company name</span>
            <input value={c.name} onChange={(e) => updateCompany({ name: e.target.value })} />
          </label>
          {field('About the company', 'blurb')}
          {field('Office & access', 'officeAddress')}
          {field('Wi-Fi & guest access', 'wifiNote')}
          {field('Payroll', 'payrollNote')}
          {field('Leave / PTO', 'ptoNote')}
          {field('Core tools', 'toolsNote')}
        </div>
      </Section>
      <Section title="FAQs" aside={<button className="btn btn-small" onClick={addFaq}>+ Add FAQ</button>}>
        {state.faqs.map((f) => (
          <div key={f.id} className="editor" style={{ marginBottom: 12 }}>
            <div className="field-row">
              <label className="field"><span>Question</span>
                <input value={f.q} onChange={(e) => updateFaq(f.id, { q: e.target.value })} />
              </label>
              <label className="field"><span>Answer</span>
                <input value={f.a} onChange={(e) => updateFaq(f.id, { a: e.target.value })} />
              </label>
            </div>
            <button className="btn-ghost btn-danger" style={{ justifySelf: 'start' }} onClick={() => removeFaq(f.id)}>✕ Remove</button>
          </div>
        ))}
      </Section>
    </div>
  );
}

function ContactsTab() {
  const { state, updateContact, addContact, removeContact } = useStore();
  return (
    <Section title="Key contacts" aside={<button className="btn btn-small" onClick={addContact}>+ Add contact</button>}>
      <p className="muted small">Shown to new hires by the assistant, grouped into the four people-involved groups.</p>
      {state.contacts.map((c) => (
        <div key={c.id} className="editor" style={{ marginBottom: 12 }}>
          <div className="field-row">
            <label className="field"><span>Name</span>
              <input value={c.name} onChange={(e) => updateContact(c.id, { name: e.target.value })} />
            </label>
            <label className="field"><span>Role</span>
              <input value={c.role} onChange={(e) => updateContact(c.id, { role: e.target.value })} />
            </label>
            <label className="field"><span>Group</span>
              <select value={c.group} onChange={(e) => updateContact(c.id, { group: e.target.value as typeof c.group })}>
                {ALL_PEOPLE_GROUPS.map((g) => <option key={g} value={g}>{PEOPLE_GROUP_LABELS[g]}</option>)}
              </select>
            </label>
            <label className="field"><span>Email</span>
              <input value={c.email} onChange={(e) => updateContact(c.id, { email: e.target.value })} />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <GroupTag group={c.group} />
            <button className="btn-ghost btn-danger" onClick={() => removeContact(c.id)}>✕ Remove</button>
          </div>
        </div>
      ))}
    </Section>
  );
}

export default function HrOpsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'company', label: '🏢 Company info' },
    { id: 'contacts', label: '👥 Key contacts' },
    { id: 'checklist', label: '📋 Checklist settings' },
  ];
  return (
    <ClientGate>
      <div className="page-head">
        <h1>HR Ops</h1>
        <p className="muted">
          Status at a glance instead of chasing hires one by one. Every flag lists its reasons — no black-box scores.
        </p>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'company' && <CompanyTab />}
      {tab === 'contacts' && <ContactsTab />}
      {tab === 'checklist' && (
        <Section title="Checklist template">
          <TemplateEditor />
        </Section>
      )}
    </ClientGate>
  );
}
