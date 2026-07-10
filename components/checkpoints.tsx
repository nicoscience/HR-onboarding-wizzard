'use client';

// Feedback checkpoints (Week 1 / Day 30 / 60 / 90). New hires submit a
// rating + comment when one is due; HR Ops sees submissions and misses.
// A missed checkpoint is a first-class at-risk signal.

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { CheckpointView, Hire } from '@/lib/types';

const RATING_LABELS = ['', 'Really struggling', 'Not great', 'Okay', 'Good', 'Excellent'];

function CheckpointForm({ hire, cp }: { hire: Hire; cp: CheckpointView }) {
  const { submitCheckpoint } = useStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <form
      className="cp-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return;
        submitCheckpoint(hire.id, cp.id, rating, comment.trim());
      }}
    >
      <p className="cp-question">How is onboarding going so far?</p>
      <div className="rating-row" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            type="button"
            className={`rating-btn ${rating === r ? 'rating-active' : ''}`}
            onClick={() => setRating(r)}
            aria-pressed={rating === r}
            title={RATING_LABELS[r]}
          >
            {r}
          </button>
        ))}
        <span className="muted small">{rating ? RATING_LABELS[rating] : '1 = struggling · 5 = excellent'}</span>
      </div>
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What’s working? What isn’t? (goes to HR Ops)"
      />
      <button className="btn btn-primary" type="submit" disabled={!rating}>
        Submit {cp.label} check-in
      </button>
    </form>
  );
}

export function CheckpointStrip({
  hire,
  checkpoints,
  canSubmit,
}: {
  hire: Hire;
  checkpoints: CheckpointView[];
  canSubmit: boolean;
}) {
  return (
    <div className="cp-strip">
      {checkpoints.map((cp) => (
        <div key={cp.id} className={`cp-card cp-${cp.status}`}>
          <div className="cp-head">
            <strong>{cp.label}</strong>
            <span className={`badge cp-badge-${cp.status}`}>
              {cp.status === 'submitted' ? `✓ ${cp.rating}/5` : cp.status}
            </span>
          </div>
          {cp.status === 'submitted' && cp.comment && <p className="cp-comment">“{cp.comment}”</p>}
          {cp.status === 'due' && canSubmit && <CheckpointForm hire={hire} cp={cp} />}
          {cp.status === 'due' && !canSubmit && <p className="muted small">Due now — waiting on the new hire.</p>}
          {cp.status === 'missed' && (
            <p className="cp-missed-note">
              Not submitted — this flags {hire.name.split(' ')[0]} as at-risk so someone checks in.
            </p>
          )}
          {cp.status === 'upcoming' && <p className="muted small">Opens on day {cp.day}.</p>}
        </div>
      ))}
    </div>
  );
}
