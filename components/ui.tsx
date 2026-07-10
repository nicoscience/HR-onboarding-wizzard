'use client';

import React, { useEffect, useState } from 'react';
import { healthLabel } from '@/lib/engine';
import { ALL_PEOPLE_GROUPS, HireHealth, PEOPLE_GROUP_LABELS, PeopleGroup } from '@/lib/types';

/**
 * Renders children only after mount. The three views derive state from
 * "days since start date" — computed against the current date — so their
 * markup must not be baked in at build time: statically prerendered HTML
 * from an earlier day would mismatch the client render on hydration.
 * The server/prerender pass emits the fallback instead.
 */
export function ClientGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <p className="muted">Loading demo data…</p>;
  return <>{children}</>;
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <span className="progress-label">{done}/{total} tasks · {pct}%</span>
    </div>
  );
}

export function HealthBadge({ health }: { health: HireHealth }) {
  return <span className={`badge health-${health}`}>{healthLabel(health)}</span>;
}

export function GroupTag({ group }: { group: PeopleGroup }) {
  return <span className={`tag tag-${group}`}>{PEOPLE_GROUP_LABELS[group]}</span>;
}

export function PeopleFilter({
  active,
  onChange,
}: {
  active: PeopleGroup | 'ALL';
  onChange: (g: PeopleGroup | 'ALL') => void;
}) {
  return (
    <div className="people-filter" role="group" aria-label="Filter tasks by people involved">
      <span className="filter-label">People involved:</span>
      <button className={`chip ${active === 'ALL' ? 'chip-active' : ''}`} onClick={() => onChange('ALL')}>
        All
      </button>
      {ALL_PEOPLE_GROUPS.map((g) => (
        <button key={g} className={`chip chip-${g} ${active === g ? 'chip-active' : ''}`} onClick={() => onChange(g)}>
          {PEOPLE_GROUP_LABELS[g]}
        </button>
      ))}
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="demo-banner">
      Prototype — in-memory demo data only. Refreshing resets everything. No ATS/HRIS is connected; see the
      data-schema brief for what a real integration needs.
    </div>
  );
}

export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
