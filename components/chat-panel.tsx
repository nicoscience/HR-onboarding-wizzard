'use client';

// Chat panel with a permanently visible "Talk to a human" escalation path.
// The assistant is grounded in HR Ops-configured content only, and nudges
// relational topics toward the buddy/manager instead of answering them.

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Hire } from '@/lib/types';

const SUGGESTIONS = [
  'When do I get paid?',
  'How do I get on the wifi?',
  'Who do I ask about benefits?',
  'What should I do this week?',
];

export function ChatPanel({ hire }: { hire: Hire }) {
  const { sendChat, escalate, state } = useStore();
  const [input, setInput] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [hire.chat.length]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendChat(hire.id, trimmed);
    setInput('');
  };

  const hrContact = state.contacts.find((c) => c.group === 'HR');

  return (
    <div className="chat">
      <div className="chat-log" ref={logRef} aria-live="polite">
        {hire.chat.length === 0 && (
          <div className="chat-empty">
            <p>
              Hi {hire.name.split(' ')[0]} 👋 — I can answer routine questions using what HR has set up here:
              company info, key contacts, and your checklist. I don’t guess beyond that.
            </p>
            <p className="muted">For anything personal or unclear, a human is one click away — always.</p>
            <div className="chip-row">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {hire.chat.map((m) => (
          <div key={m.id} className={`msg msg-${m.from}`}>
            <div className="msg-bubble">
              {m.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              {m.suggestsHuman && (
                <button className="btn btn-human btn-inline" onClick={() => setEscalating(true)}>
                  🙋 Talk to a human about this
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pay, tools, leave, your checklist…"
          aria-label="Ask the onboarding assistant"
        />
        <button className="btn btn-primary" type="submit">Send</button>
      </form>

      {/* Escalation path: permanently visible, never buried. */}
      <div className="escalate-bar">
        {!escalating ? (
          <button className="btn btn-human" onClick={() => setEscalating(true)}>
            🙋 Talk to a human
          </button>
        ) : (
          <form
            className="escalate-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!topic.trim()) return;
              escalate(hire.id, topic.trim(), note.trim());
              setTopic('');
              setNote('');
              setEscalating(false);
            }}
          >
            <p>
              This goes straight to {hrContact ? `${hrContact.name} (${hrContact.role})` : 'the HR team'} and shows
              on the HR Ops dashboard. They’ll come to you.
            </p>
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's it about? (required)"
              aria-label="Escalation topic"
            />
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything they should know first (optional)"
              aria-label="Escalation details"
            />
            <div className="editor-actions">
              <button className="btn btn-human" type="submit" disabled={!topic.trim()}>Send to a person</button>
              <button className="btn" type="button" onClick={() => setEscalating(false)}>Cancel</button>
            </div>
          </form>
        )}
        <span className="muted small">Routine questions → assistant. Anything human → a person, no friction.</span>
      </div>
    </div>
  );
}
