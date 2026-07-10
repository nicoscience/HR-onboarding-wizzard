'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useStore } from '@/lib/store';

const LINKS = [
  { href: '/new-hire', label: '🧑‍🚀 New Hire' },
  { href: '/manager', label: '🧭 Hiring Manager' },
  { href: '/hr-ops', label: '🛠️ HR Ops' },
];

export function TopNav() {
  const pathname = usePathname();
  const { resetDemo } = useStore();
  return (
    <header className="topnav">
      <Link href="/" className="brand">Onboarding HR Agent</Link>
      <nav>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? 'nav-active' : ''}>
            {l.label}
          </Link>
        ))}
      </nav>
      <button className="btn btn-small" onClick={resetDemo} title="Restore the seeded demo data">
        ↺ Reset demo data
      </button>
    </header>
  );
}
