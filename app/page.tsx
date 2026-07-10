import Link from 'next/link';

export default function Landing() {
  return (
    <div>
      <div className="page-head">
        <h1>Onboarding HR Agent</h1>
        <p className="muted">
          A three-sided onboarding workspace: the new hire works a living checklist and can always reach a human,
          their manager is pulled into the loop, and HR Ops sees who's on track, behind, or at risk — without chasing.
        </p>
      </div>

      <div className="landing-cards">
        <Link href="/new-hire" className="landing-card">
          <h2>🧑‍🚀 New Hire</h2>
          <p>
            Your onboarding checklist — timing, people, action items and deliverables — plus an assistant for routine
            questions with a permanent “Talk to a human” button. Feedback check-ins at Week 1 and Days 30/60/90.
          </p>
        </Link>
        <Link href="/manager" className="landing-card">
          <h2>🧭 Hiring Manager</h2>
          <p>
            Your tasks for each new hire, reminders for what's overdue or coming up, and a live view of their
            progress and check-in feedback. Involved managers make onboarding dramatically better — this view makes
            involvement the default.
          </p>
        </Link>
        <Link href="/hr-ops" className="landing-card">
          <h2>🛠️ HR Ops</h2>
          <p>
            Status of every hire at a glance with transparent behind-schedule and at-risk flags, open escalations,
            plus company info, key contacts and the checklist template settings.
          </p>
        </Link>
      </div>

      <div className="honesty-note">
        <strong>What this is (and isn't):</strong> a front-end prototype with one shared in-memory state per browser
        tab — that's why all three views stay consistent as you click around, and why a refresh resets the demo.
        There are no logins (the role pickers are demo devices), no persistence, and no ATS/HRIS connection — two
        tabs are two separate demos, nothing syncs. What a real integration would need is specified in the
        accompanying <em>data-schema brief</em> rather than faked here.
      </div>
    </div>
  );
}
