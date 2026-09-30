/* ── Context ─────────────────────────────────────────────────────── */
const CTX = {
  company:   'Chocoero Pte Ltd',
  uen:       '202500298W',
  csn:       'S20250001B',
  officer:   'Mr Y. Lee',
  addr_old:  '100 High Street #04-01\nSingapore 179434',
  addr_new:  '200 Victoria Street #08-02\nSingapore 188021',
  email_old: 'admin@chocoero.sg',
  email_new: 'contact@chocoero.sg',
  phone_old: '+65 6123 4567',
  phone_new: '+65 6234 5678',
};

/* ── DOM refs ────────────────────────────────────────────────────── */
const msgsOuter   = document.getElementById('msgs-outer');
const msgsInner   = document.getElementById('msgs-inner');
const typingRow   = document.getElementById('typing-row');
const authOverlay = document.getElementById('auth-overlay');

/* ── Scroll to bottom (iframe-safe) ─────────────────────────────── */
function scrollBottom() {
  setTimeout(() => {
    msgsOuter.scrollTop = msgsOuter.scrollHeight;
  }, 50);
}

/* ── Keep typing row at bottom of msgs-inner ─────────────────────── */
function pinTypingRow() {
  msgsInner.appendChild(typingRow);
}

/* ── Time helper ─────────────────────────────────────────────────── */
function nowTime() {
  return new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ── Typing indicator ────────────────────────────────────────────── */
function showTyping() {
  typingRow.classList.add('visible');
  scrollBottom();
}
function hideTyping() {
  typingRow.classList.remove('visible');
}

/* ── Track last sender for bubble tail / group-start ─────────────── */
let lastDir = null;

/* ── Add message row ─────────────────────────────────────────────── */
function addMessage(dir, content, opts = {}) {
  const isGroupStart = lastDir !== dir;
  lastDir = dir;

  const row = document.createElement('div');
  row.className = 'wa-row ' + dir + (isGroupStart ? ' group-start' : '');

  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + dir + (isGroupStart ? ' tail' : '');

  if (opts.html) {
    bubble.innerHTML = content;
  } else {
    const textNode = document.createTextNode(content);
    bubble.appendChild(textNode);
  }

  // Meta (time + tick for outgoing)
  const meta = document.createElement('div');
  meta.className = 'bubble-meta';
  meta.innerHTML = `<span class="bubble-time">${nowTime()}</span>` +
    (dir === 'out' ? '<span class="bubble-tick">✓✓</span>' : '');
  bubble.appendChild(meta);

  row.appendChild(bubble);
  // Insert before typing row so typing row stays last
  msgsInner.insertBefore(row, typingRow);
  scrollBottom();
  return { row, bubble };
}

/* ── Add diff card inside a bubble ──────────────────────────────── */
function addDiff(fromLabel, fromVal, toLabel, toVal) {
  const isGroupStart = lastDir !== 'in';
  lastDir = 'in';

  const row = document.createElement('div');
  row.className = 'wa-row in' + (isGroupStart ? ' group-start' : '');

  const bubble = document.createElement('div');
  bubble.className = 'bubble in' + (isGroupStart ? ' tail' : '');

  bubble.innerHTML = `
    <div class="diff-card">
      <div class="diff-label from">${fromLabel}</div>
      <div class="diff-val">${fromVal}</div>
      <div class="diff-sep"></div>
      <div class="diff-label to">${toLabel}</div>
      <div class="diff-val">${toVal}</div>
    </div>
    <div class="bubble-meta"><span class="bubble-time">${nowTime()}</span></div>`;

  row.appendChild(bubble);
  msgsInner.insertBefore(row, typingRow);
  scrollBottom();
}

/* ── Reply buttons ──────────────────────────────────────────────── */
function addReplyButtons(message, buttons) {
  const { row, bubble } = addMessage('in', message);

  // Attach reply buttons below the bubble's row
  const wrap = document.createElement('div');
  wrap.className = 'reply-btns-wrap';
  const btnsEl = document.createElement('div');
  btnsEl.className = 'reply-btns';

  buttons.forEach(({ label, next, action }) => {
    const btn = document.createElement('button');
    btn.className = 'reply-btn';
    btn.textContent = label;
    btn.onclick = () => {
      // Disable all buttons
      btnsEl.querySelectorAll('.reply-btn').forEach(b => {
        b.disabled = true;
        b.classList.toggle('selected', b === btn);
      });
      // Show user selection as outgoing bubble
      lastDir = null; // force group-start for outgoing
      addMessage('out', label);
      if (action) action();
      else if (next) go(next);
    };
    btnsEl.appendChild(btn);
  });

  wrap.appendChild(btnsEl);
  row.after(wrap);
  // Keep typing row last
  msgsInner.appendChild(typingRow);
  scrollBottom();
}

/* ── CTA URL button ──────────────────────────────────────────────── */
function addCTAButton(message, btnLabel, action) {
  const { row } = addMessage('in', message);

  const wrap = document.createElement('div');
  wrap.className = 'cta-btn-wrap';
  const btn = document.createElement('button');
  btn.className = 'cta-btn';
  btn.innerHTML = `<span class="cta-icon">🔗</span> ${btnLabel}`;
  btn.onclick = () => {
    btn.disabled = true;
    action();
  };
  wrap.appendChild(btn);
  row.after(wrap);
  msgsInner.appendChild(typingRow);
  scrollBottom();
}

/* ── List message ────────────────────────────────────────────────── */
function addListMessage(message, openLabel, sections, onSelect) {
  const { row } = addMessage('in', message);

  const wrap = document.createElement('div');
  wrap.className = 'list-btn-wrap';
  const openBtn = document.createElement('button');
  openBtn.className = 'list-open-btn';
  openBtn.innerHTML = `≡ ${openLabel}`;

  const overlay = document.createElement('div');
  overlay.className = 'list-overlay hidden';

  const sheet = document.createElement('div');
  sheet.className = 'list-sheet';

  const header = document.createElement('div');
  header.className = 'list-sheet-header';
  const title = document.createElement('div');
  title.className = 'list-sheet-title';
  title.textContent = openLabel;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'list-sheet-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => overlay.classList.add('hidden');
  header.append(title, closeBtn);

  const body = document.createElement('div');
  body.className = 'list-sheet-body';

  sections.forEach(({ label, items }) => {
    if (label) {
      const sec = document.createElement('div');
      sec.className = 'list-section-label';
      sec.textContent = label;
      body.appendChild(sec);
    }
    items.forEach(({ title: t, desc }) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div>
          <div class="list-item-title">${t}</div>
          ${desc ? `<div class="list-item-desc">${desc}</div>` : ''}
        </div>
        <span class="list-item-check">✓</span>`;
      item.onclick = () => {
        overlay.classList.add('hidden');
        openBtn.disabled = true;
        if (onSelect) onSelect(t);
      };
      body.appendChild(item);
    });
  });

  sheet.append(header, body);
  overlay.appendChild(sheet);
  document.getElementById('app').appendChild(overlay);

  openBtn.onclick = () => overlay.classList.remove('hidden');
  wrap.appendChild(openBtn);
  row.after(wrap);
  msgsInner.appendChild(typingRow);
  scrollBottom();
}

/* ── Sequential message delivery with typing indicator ─────────── */
function deliver(messages, onDone) {
  let i = 0;
  function next() {
    if (i >= messages.length) { if (onDone) onDone(); return; }
    const msg = messages[i++];
    const delay = msg.delay ?? 800;

    showTyping();
    setTimeout(() => {
      hideTyping();
      if (msg.type === 'text') {
        addMessage('in', msg.content);
      } else if (msg.type === 'reply') {
        addReplyButtons(msg.content, msg.buttons);
        return; // stop sequence — user drives next step
      } else if (msg.type === 'cta') {
        addCTAButton(msg.content, msg.label, msg.action);
        return; // stop sequence
      } else if (msg.type === 'list') {
        addListMessage(msg.content, msg.label, msg.sections, msg.onSelect);
        return; // stop sequence
      } else if (msg.type === 'diff') {
        addDiff(msg.fromLabel, msg.fromVal, msg.toLabel, msg.toVal);
      }
      next();
    }, delay);
  }
  next();
}

/* ── Auth flow ───────────────────────────────────────────────────── */
function openAuth(onSuccess) {
  const overlay  = document.getElementById('auth-overlay');
  const step1    = document.getElementById('auth-step-1');
  const step2    = document.getElementById('auth-step-2');
  const step3    = document.getElementById('auth-step-3');
  const spBtn    = document.getElementById('singpass-btn');

  overlay.classList.remove('hidden');

  spBtn.onclick = () => {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');

    // Simulate verification delay
    setTimeout(() => {
      step2.classList.add('hidden');
      step3.classList.remove('hidden');

      setTimeout(() => {
        overlay.classList.add('hidden');
        // Reset auth steps for re-use
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');
        onSuccess();
      }, 1200);
    }, 1800);
  };
}

/* ── Flow states ─────────────────────────────────────────────────── */
function go(state) {
  switch (state) {

    case 'greeting':
      deliver([
        { type: 'text',  delay: 600,  content: `Hi! I'm BizSG.` },
        { type: 'text',  delay: 1000, content: `I can help you update your CPF employer records for *${CTX.company}* (UEN ${CTX.uen}).` },
        {
          type: 'reply', delay: 900,
          content: 'What would you like to do?',
          buttons: [
            { label: 'Update particulars', next: 'auth-prompt' },
            { label: 'Ask a question',     next: 'faq'         },
          ],
        },
      ]);
      break;

    case 'faq':
      deliver([
        { type: 'text', delay: 700, content: `I can answer CPF employer questions. For now, let me know what you'd like to update and I'll help you get it done.` },
        {
          type: 'reply', delay: 600,
          content: 'Ready when you are.',
          buttons: [
            { label: 'Update particulars', next: 'auth-prompt' },
          ],
        },
      ]);
      break;

    case 'auth-prompt':
      deliver([
        { type: 'text', delay: 700, content: `To update your CPF records, I need to verify your identity and retrieve your current particulars.` },
        {
          type: 'cta', delay: 800,
          content: 'Tap below to log in with CorpPass. I'll handle the rest.',
          label: 'Log in with CorpPass →',
          action: () => {
            openAuth(() => go('auth-return'));
          },
        },
      ]);
      break;

    case 'auth-return':
      deliver([
        { type: 'text',  delay: 400,  content: `✅ Identity verified. Retrieving your CPF records…` },
        { type: 'text',  delay: 1800, content: `Found employer records for *${CTX.company}* (CSN: ${CTX.csn}).` },
        {
          type: 'list', delay: 900,
          content: 'Here are your current CPF employer particulars. Tap to view details.',
          label: 'View current records',
          sections: [
            {
              label: `CSN ${CTX.csn}`,
              items: [
                { title: 'Business address', desc: CTX.addr_old.replace('\n', ', ') },
                { title: 'Contact name',     desc: CTX.officer },
                { title: 'Contact email',    desc: CTX.email_old },
                { title: 'Contact phone',    desc: CTX.phone_old },
                { title: 'Direct debit',     desc: 'DBS ****4521 (active)' },
              ],
            },
          ],
          onSelect: (title) => {
            addMessage('out', title);
            // Map list selection to update state
            const map = {
              'Business address': 'update-address',
              'Contact email':    'update-contact',
              'Contact phone':    'update-contact',
              'Contact name':     'update-contact',
              'Direct debit':     'update-dda',
            };
            go(map[title] || 'update-choice');
          },
        },
      ]);
      break;

    case 'update-choice':
      deliver([
        {
          type: 'reply', delay: 700,
          content: 'Which details would you like to update?',
          buttons: [
            { label: 'Business address', next: 'update-address' },
            { label: 'Contact details',  next: 'update-contact' },
            { label: 'Direct debit',     next: 'update-dda'     },
          ],
        },
      ]);
      break;

    case 'update-address':
      deliver([
        { type: 'text', delay: 700,  content: `I can see your ACRA-registered address has changed. Here's the proposed update for CSN ${CTX.csn}:` },
        {
          type: 'diff', delay: 1200,
          fromLabel: 'Current (CPF records)',
          fromVal:   CTX.addr_old,
          toLabel:   'New (ACRA records)',
          toVal:     CTX.addr_new,
        },
        {
          type: 'reply', delay: 900,
          content: 'Would you like to apply this address update to CPF?',
          buttons: [
            { label: 'Confirm update', action: () => { go('declaration'); } },
            { label: 'Edit manually',  next: 'edit-manual' },
            { label: 'Cancel',         next: 'cancelled'   },
          ],
        },
      ]);
      break;

    case 'update-contact':
      deliver([
        { type: 'text', delay: 700,  content: `Here's the proposed contact details update for CSN ${CTX.csn}:` },
        {
          type: 'diff', delay: 1200,
          fromLabel: 'Current email (CPF records)',
          fromVal:   CTX.email_old,
          toLabel:   'New email',
          toVal:     CTX.email_new,
        },
        {
          type: 'reply', delay: 900,
          content: 'Apply this update?',
          buttons: [
            { label: 'Confirm update', action: () => { go('declaration'); } },
            { label: 'Edit manually',  next: 'edit-manual' },
            { label: 'Cancel',         next: 'cancelled'   },
          ],
        },
      ]);
      break;

    case 'update-dda':
      deliver([
        { type: 'text', delay: 800, content: `To update your direct debit account, you'll need to complete this through the CPF Employer Portal directly, as it requires bank verification.` },
        {
          type: 'cta', delay: 700,
          content: 'I can take you there with your details pre-filled.',
          label: 'Go to CPF Employer Portal →',
          action: () => {
            addMessage('out', 'Go to CPF Employer Portal →');
            deliver([
              { type: 'text', delay: 600, content: `Opening CPF portal… (This is a prototype — the link would open the live CPF service.)` },
            ]);
          },
        },
      ]);
      break;

    case 'edit-manual':
      deliver([
        { type: 'text', delay: 600, content: `Manual editing isn't available in this prototype. In the live agent, you'd be able to type the new value directly here.` },
        {
          type: 'reply', delay: 600,
          content: 'What would you like to do?',
          buttons: [
            { label: 'Use suggested value', action: () => { go('declaration'); } },
            { label: 'Cancel',              next: 'cancelled' },
          ],
        },
      ]);
      break;

    case 'declaration':
      deliver([
        { type: 'text', delay: 700,  content: `Almost done. Please read the declaration below.` },
        {
          type: 'text', delay: 1000,
          content: `Declaration\n\nI, the authorised person for ${CTX.company}, declare that the information provided is true and correct to the best of my knowledge. I consent to CPF Board updating the employer particulars as confirmed above.`,
        },
        {
          type: 'reply', delay: 900,
          content: 'Tap confirm to submit the update.',
          buttons: [
            { label: 'I confirm', next: 'submitted' },
            { label: 'Cancel',    next: 'cancelled' },
          ],
        },
      ]);
      break;

    case 'submitted':
      deliver([
        { type: 'text', delay: 500,  content: `Submitting update…` },
        { type: 'text', delay: 1600, content: `✅ Update submitted successfully!` },
        { type: 'text', delay: 900,  content: `Reference: CPF-TXN-2026-082678\n\nA confirmation will be sent to your registered email address within 1 business day.` },
        {
          type: 'reply', delay: 1000,
          content: 'Is there anything else I can help you with?',
          buttons: [
            { label: 'Update more details', next: 'update-choice' },
            { label: 'No, I\'m done',       next: 'done'          },
          ],
        },
      ]);
      break;

    case 'done':
      deliver([
        { type: 'text', delay: 600, content: `Great! Your CPF employer particulars have been updated. 👋` },
      ]);
      break;

    case 'cancelled':
      deliver([
        { type: 'text', delay: 500, content: `No changes have been made.` },
        {
          type: 'reply', delay: 600,
          content: 'What would you like to do?',
          buttons: [
            { label: 'Update particulars', next: 'update-choice' },
            { label: 'I\'m done',          next: 'done'          },
          ],
        },
      ]);
      break;

    default:
      deliver([{ type: 'text', delay: 400, content: `(State "${state}" not yet implemented in this prototype.)` }]);
  }
}

/* ── Init ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Date separator
  const sep = document.createElement('div');
  sep.className = 'date-sep';
  sep.innerHTML = '<span>Today</span>';
  msgsInner.appendChild(sep);

  go('greeting');
});
