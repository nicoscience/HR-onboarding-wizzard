// Rule-based chat responder. Deliberately NOT a general-purpose AI:
// it only answers from HR Ops-configured content (company info, contacts,
// FAQs) and the hire's own checklist. Relational topics are routed to a
// human, and unknown questions get an honest "ask a person" — the
// assistant never invents policy. The escalation path is rendered
// permanently by the chat panel, not only in these replies.

import { hireStatus } from './engine';
import { AppState, Contact, Hire, PeopleGroup } from './types';

export interface BotReply {
  text: string;
  suggestsHuman?: boolean;
}

function contactLine(c: Contact): string {
  return `${c.name} — ${c.role} (${c.email})`;
}

function firstContact(state: AppState, group: PeopleGroup): Contact | undefined {
  return state.contacts.find((c) => c.group === group);
}

const RELATIONAL = /\b(lonely|isolated|overwhelmed|anxious|stressed|struggling|homesick|awkward|left out|don'?t fit|not sure (i|I) belong|no one talks|nobody talks|friend|social|connect with)\b/i;

export function botRespond(state: AppState, hire: Hire, raw: string): BotReply {
  const q = raw.toLowerCase();
  const manager = state.managers.find((m) => m.id === hire.managerId);
  const managerContact = state.contacts.find((c) => manager && c.name === manager.name);

  // 1. Relational / wellbeing topics → route to a human, on purpose.
  if (RELATIONAL.test(raw)) {
    return {
      suggestsHuman: true,
      text:
        `That sounds like something a person should hear, not a bot. Your buddy ${hire.buddyName} is there exactly for this, ` +
        `and ${manager ? manager.name : 'your manager'} wants to know how it's really going.` +
        `\n\nIf you'd rather talk to HR privately, use “Talk to a human” below and ${firstContact(state, 'HR')?.name ?? 'the HR team'} will reach out.`,
    };
  }

  // 2. IT topics.
  if (/\b(wifi|wi-fi|laptop|password|2fa|vpn|login|log in|slack|jira|email|access|account|computer|it help)\b/i.test(q)) {
    const it = firstContact(state, 'IT');
    return {
      text: `${state.company.wifiNote}\n\n${state.company.toolsNote}\n\nFor anything broken or missing (logins, access, hardware): ${it ? contactLine(it) : 'the IT helpdesk'}.`,
    };
  }

  // 3. Pay / benefits / leave.
  if (/\b(pay|paid|payroll|payslip|salary|bank|tax|benefit|insurance|retirement|kiwisaver|401k)\b/i.test(q)) {
    const hr = state.contacts.find((c) => c.group === 'HR' && /payroll|benefit/i.test(c.role)) ?? firstContact(state, 'HR');
    return { text: `${state.company.payrollNote}\n\nQuestions about your specific situation: ${hr ? contactLine(hr) : 'the HR team'}.` };
  }
  if (/\b(leave|pto|holiday|vacation|sick|time off|day off)\b/i.test(q)) {
    return { text: state.company.ptoNote };
  }

  // 4. Office / badge / desk.
  if (/\b(badge|desk|office|parking|building|reception|delivery|deliveries|address|kitchen)\b/i.test(q)) {
    const admin = firstContact(state, 'OFFICE_ADMIN');
    return { text: `${state.company.officeAddress}\n\nBadges, desks and deliveries: ${admin ? contactLine(admin) : 'the office admin team'}.` };
  }

  // 5. Remote / hybrid — answered from configured FAQs.
  const faqHit = state.faqs.find((f) =>
    f.q.toLowerCase().split(/\W+/).filter((w) => w.length > 3).some((w) => q.includes(w))
  );
  if (faqHit) {
    return { text: `${faqHit.a}` };
  }

  // 6. Who do I ask / contacts.
  if (/\b(who|contact|reach|ask about|speak to|talk to)\b/i.test(q)) {
    return {
      text:
        `Key people for you:\n` +
        state.contacts.map((c) => `• ${contactLine(c)}`).join('\n') +
        `\n\nYour buddy is ${hire.buddyName}${manager ? `, and your manager is ${manager.name}` : ''}${managerContact ? ` (${managerContact.email})` : ''}.`,
    };
  }

  // 7. Checklist / what's next.
  if (/\b(checklist|task|next|schedule|today|this week|what should i|what do i)\b/i.test(q)) {
    const status = hireStatus(hire);
    const upcoming = hire.tasks.filter((t) => !t.done).slice(0, 3);
    if (upcoming.length === 0) return { text: 'Your checklist is fully complete. 🎉' };
    return {
      text:
        `You're ${status.doneTasks}/${status.totalTasks} through your checklist. Next up:\n` +
        upcoming.map((t) => `• ${t.title} (${t.timingLabel})`).join('\n'),
    };
  }

  // 8. Company basics.
  if (/\b(company|brightloop|mission|what do we|about)\b/i.test(q)) {
    return { text: state.company.blurb };
  }

  // 9. Honest fallback — no invented answers.
  const hr = firstContact(state, 'HR');
  return {
    suggestsHuman: true,
    text:
      `I don't have a configured answer for that — I only know what HR Ops has loaded here (company info, contacts, FAQs, and your checklist), and I'd rather hand you to a person than guess.` +
      `\n\nTry ${hr ? contactLine(hr) : 'the HR team'}, or hit “Talk to a human” below and they'll come to you.`,
  };
}
