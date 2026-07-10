'use client';

// Single in-memory store shared by all three views. This is the honest
// version of "consistent data everywhere": one state object, no fake
// persistence. Refreshing the page resets to seed data (and the UI says so).

import React, { createContext, useContext, useMemo, useState } from 'react';
import { botRespond } from './chat';
import { daysSince, buildSeedState, instantiateTasks } from './seed';
import {
  AppState,
  CompanyInfo,
  Contact,
  Faq,
  Hire,
  Task,
  TaskTemplate,
} from './types';

let uid = 1000;
const nextId = (p: string) => `${p}-${++uid}`;

export interface Store {
  state: AppState;
  resetDemo: () => void;

  // --- per-hire checklist interactions ---
  toggleTask: (hireId: string, taskId: string) => void;
  toggleActionItem: (hireId: string, taskId: string, itemId: string) => void;
  submitCheckpoint: (hireId: string, checkpointId: string, rating: number, comment: string) => void;

  // --- chat & escalation ---
  sendChat: (hireId: string, text: string) => void;
  escalate: (hireId: string, topic: string, note: string) => void;
  resolveEscalation: (escalationId: string) => void;

  // --- template mechanics (HR Ops → Checklist Settings) ---
  moveTemplateTask: (taskId: string, dir: -1 | 1) => void;
  updateTemplateTask: (taskId: string, patch: Partial<TaskTemplate>) => void;
  insertTemplateTask: (afterIndex: number) => string; // returns new task id
  deleteTemplateTask: (taskId: string) => void;
  applyTemplateToHires: () => void;

  // --- HR Ops config ---
  updateCompany: (patch: Partial<CompanyInfo>) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  addContact: () => void;
  removeContact: (id: string) => void;
  updateFaq: (id: string, patch: Partial<Faq>) => void;
  addFaq: () => void;
  removeFaq: (id: string) => void;
}

const StoreContext = createContext<Store | null>(null);

function mutateHire(state: AppState, hireId: string, fn: (h: Hire) => Hire): AppState {
  return { ...state, hires: state.hires.map((h) => (h.id === hireId ? fn(h) : h)) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(buildSeedState);

  const store = useMemo<Store>(() => ({
    state,
    resetDemo: () => setState(buildSeedState()),

    toggleTask: (hireId, taskId) =>
      setState((s) =>
        mutateHire(s, hireId, (h) => ({
          ...h,
          tasks: h.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        }))
      ),

    toggleActionItem: (hireId, taskId, itemId) =>
      setState((s) =>
        mutateHire(s, hireId, (h) => ({
          ...h,
          tasks: h.tasks.map((t) =>
            t.id === taskId
              ? { ...t, actionItems: t.actionItems.map((ai) => (ai.id === itemId ? { ...ai, done: !ai.done } : ai)) }
              : t
          ),
        }))
      ),

    submitCheckpoint: (hireId, checkpointId, rating, comment) =>
      setState((s) =>
        mutateHire(s, hireId, (h) => ({
          ...h,
          checkpoints: h.checkpoints.map((cp) =>
            cp.id === checkpointId
              ? { ...cp, submitted: true, rating, comment, submittedOnDay: daysSince(h.startDate) }
              : cp
          ),
        }))
      ),

    sendChat: (hireId, text) =>
      setState((s) => {
        const hire = s.hires.find((h) => h.id === hireId);
        if (!hire) return s;
        const reply = botRespond(s, hire, text);
        return mutateHire(s, hireId, (h) => ({
          ...h,
          chat: [
            ...h.chat,
            { id: nextId('msg'), from: 'hire' as const, text },
            { id: nextId('msg'), from: 'assistant' as const, text: reply.text, suggestsHuman: reply.suggestsHuman },
          ],
        }));
      }),

    escalate: (hireId, topic, note) =>
      setState((s) => {
        const hire = s.hires.find((h) => h.id === hireId);
        if (!hire) return s;
        const hr = s.contacts.find((c) => c.group === 'HR');
        const confirmation =
          `✅ Escalated to a human. ${hr ? hr.name : 'The HR team'} has been notified about “${topic}” and will follow up with you directly. ` +
          `Your manager can also see open escalations.`;
        const withEsc: AppState = {
          ...s,
          escalations: [
            ...s.escalations,
            {
              id: nextId('esc'), hireId, hireName: hire.name, topic, note,
              createdOnDay: daysSince(hire.startDate), status: 'open' as const,
            },
          ],
        };
        return mutateHire(withEsc, hireId, (h) => ({
          ...h,
          chat: [...h.chat, { id: nextId('msg'), from: 'assistant' as const, text: confirmation }],
        }));
      }),

    resolveEscalation: (escalationId) =>
      setState((s) => ({
        ...s,
        escalations: s.escalations.map((e) => (e.id === escalationId ? { ...e, status: 'resolved' as const } : e)),
      })),

    moveTemplateTask: (taskId, dir) =>
      setState((s) => {
        const i = s.templateTasks.findIndex((t) => t.id === taskId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.templateTasks.length) return s;
        const next = [...s.templateTasks];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...s, templateTasks: next };
      }),

    updateTemplateTask: (taskId, patch) =>
      setState((s) => ({
        ...s,
        templateTasks: s.templateTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      })),

    insertTemplateTask: (afterIndex) => {
      const id = nextId('tt');
      setState((s) => {
        const anchor = s.templateTasks[Math.max(0, Math.min(afterIndex, s.templateTasks.length - 1))];
        const fresh: TaskTemplate = {
          id,
          title: 'New task',
          details: '',
          dayOffset: anchor?.dayOffset ?? 0,
          timingLabel: anchor?.timingLabel ?? 'Day 1',
          durationMins: 30,
          owner: 'HR',
          involves: ['HR'],
          actionItems: [],
          deliverables: [],
        };
        const next = [...s.templateTasks];
        next.splice(afterIndex + 1, 0, fresh);
        return { ...s, templateTasks: next };
      });
      return id;
    },

    deleteTemplateTask: (taskId) =>
      setState((s) => ({ ...s, templateTasks: s.templateTasks.filter((t) => t.id !== taskId) })),

    // Re-instantiate every hire's checklist from the current template,
    // preserving completion where the template task still exists (matched by title).
    applyTemplateToHires: () =>
      setState((s) => ({
        ...s,
        hires: s.hires.map((h) => {
          const doneByTitle = new Map(h.tasks.map((t) => [t.title, t]));
          const fresh: Task[] = instantiateTasks(s.templateTasks).map((t) => {
            const prev = doneByTitle.get(t.title);
            if (!prev) return t;
            return {
              ...t,
              done: prev.done,
              actionItems: t.actionItems.map((ai) => ({
                ...ai,
                done: prev.actionItems.find((p) => p.text === ai.text)?.done ?? false,
              })),
            };
          });
          return { ...h, tasks: fresh };
        }),
      })),

    updateCompany: (patch) => setState((s) => ({ ...s, company: { ...s.company, ...patch } })),

    updateContact: (id, patch) =>
      setState((s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    addContact: () =>
      setState((s) => ({
        ...s,
        contacts: [...s.contacts, { id: nextId('c'), name: 'New contact', role: 'Role', group: 'HR', email: 'email@brightloop.example' }],
      })),
    removeContact: (id) => setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) })),

    updateFaq: (id, patch) =>
      setState((s) => ({ ...s, faqs: s.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
    addFaq: () =>
      setState((s) => ({ ...s, faqs: [...s.faqs, { id: nextId('f'), q: 'New question?', a: 'Answer.' }] })),
    removeFaq: (id) => setState((s) => ({ ...s, faqs: s.faqs.filter((f) => f.id !== id) })),
  }), [state]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
