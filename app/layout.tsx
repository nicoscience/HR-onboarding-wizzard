import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { TopNav } from '@/components/nav';
import { DemoBanner } from '@/components/ui';
import { StoreProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onboarding HR Agent — prototype',
  description:
    'Three-sided onboarding prototype: New Hire checklist + chat, Hiring Manager view, HR Ops dashboard. In-memory demo, no backend.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <TopNav />
          <DemoBanner />
          <main className="page">{children}</main>
        </StoreProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
