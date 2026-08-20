export interface QuickReply {
  label: string;
  nextId: string;
  action?: string;
}

export interface Hotspot {
  top: string;
  left: string;
  width: string;
  height: string;
  nextBackground: string;
}

export interface FlowNode {
  id: string;
  botMessages: string[];
  quickReplies?: QuickReply[];
  background?: string; // screenshot filename in public/screenshots/
  hotspot?: Hotspot;   // clickable region on initial background
  hotspotChain?: Record<string, Hotspot>; // hotspots keyed by override filename
  delays?: number[];   // cumulative ms delay per message (index-matched)
}

export const flow: FlowNode[] = [
  {
    id: "greeting",
    background: "acra-inbox-reg-approved.jpeg",
    botMessages: [
      "Hi! I'm the BizSG Assistant.",
      "To set up CPF contributions, you'll need three things:",
      "1. Corppass — corporate digital identity for government portals\n2. CPF Submission Number (CSN) — your CPF employer reference\n3. CPF EZPay — the portal for filing and paying contributions",
      "I can begin by applying for Corppass on your behalf. Want to get started?",
    ],
    quickReplies: [
      { label: "Yes, let's start", nextId: "corppass-provision-choice" },
      { label: "Tell me more first", nextId: "cpf-explainer" },
    ],
  },
  {
    id: "other",
    botMessages: [
      "I can help with CPF setup, business licences, and government portal onboarding.",
      "What would you like to do?",
    ],
    quickReplies: [
      { label: "Apply for CPF as new employer", nextId: "cpf-intent" },
    ],
  },
  {
    id: "cpf-intent",
    botMessages: [
      "To set up CPF contributions, you'll need three things:",
      "1. Corppass — corporate digital identity for government portals\n2. CPF Submission Number (CSN) — your CPF employer reference\n3. CPF EZPay — the portal for filing and paying contributions",
      "I can handle the applications for you. Want to get started?",
    ],
    quickReplies: [
      { label: "Yes, let's go", nextId: "corppass-provision-choice" },
      { label: "Tell me more first", nextId: "cpf-explainer" },
    ],
  },
  {
    id: "cpf-explainer",
    botMessages: [
      "CPF (Central Provident Fund) is Singapore's mandatory social security savings scheme.",
      "As an employer, you're required to make monthly contributions for employees earning more than $50/month.",
      "The process is entirely online and I can pre-fill most forms using your ACRA data.",
    ],
    quickReplies: [
      { label: "Ok, let's apply", nextId: "corppass-provision-choice" },
    ],
  },

  // ── Corppass provisioning ────────────────────────────────────────────────
  {
    id: "corppass-provision-choice",
    delays: [0, 1000],
    botMessages: [
      "First step: Corppass setup.",
      "I have created the Corppass admin account for you. Log in with Singpass to continue with the CPF setup.",
    ],
    quickReplies: [
      {
        label: "Log in with Singpass →",
        nextId: "singpass-qr-hint",
        action: "open-singpass-qr",
      },
    ],
  },

  // Auto path ───────────────────────────────────────────────────────────────
  {
    id: "corppass-auto-processing",
    botMessages: [
      "Applying for your Corppass account now…",
      "✓ Application submitted. For a Singapore-registered entity like yours, activation is instant once your company's Registered Officer (RO) approves the request.",
      "Your RO has up to 30 days to approve — most do it within minutes. Once approved, log in with Singpass to continue.",
    ],
    quickReplies: [
      {
        label: "Log in with Singpass →",
        nextId: "corppass-auto-processing",
        action: "open-singpass-qr",
      },
    ],
  },

  // Manual path ─────────────────────────────────────────────────────────────
  {
    id: "corppass-manual-prefill",
    botMessages: [
      "Your Corppass application has been pre-filled using your ACRA business details.",
      "Note: make sure your company's Registered Officer (RO) details are fully updated with ACRA before submitting — the RO will need to approve your application.",
      "Review the details, make any amendments needed, then submit.",
    ],
    quickReplies: [
      {
        label: "Open pre-filled Corppass form →",
        nextId: "corppass-manual-prefill",
        action: "open-corppass-form",
      },
      { label: "Make an amendment", nextId: "corppass-amend" },
    ],
  },
  {
    id: "corppass-amend",
    botMessages: [
      "Which field would you like to change? (e.g. registered address, contact email)",
      "Tell me what to update and I'll amend the form.",
    ],
    quickReplies: [
      {
        label: "Form looks correct — open form",
        nextId: "corppass-manual-prefill",
        action: "open-corppass-form",
      },
    ],
  },
  // Signal: "corppass-form-submitted" → advances to corppass-manual-done
  {
    id: "corppass-manual-done",
    botMessages: [
      "Application submitted. ✓",
      "Activation is instant once your Registered Officer (RO) approves — they have up to 30 days, but most approve within minutes.",
      "Once approved, log in with Singpass to continue to CPF registration.",
    ],
    quickReplies: [
      {
        label: "Log in with Singpass →",
        nextId: "singpass-qr-hint",
        action: "open-singpass-qr",
      },
    ],
  },

  // ── Singpass login (both paths land here via signal) ─────────────────────
  {
    id: "singpass-qr-hint",
    delays: [1000],
    botMessages: ["Scan the QR code in the main window."],
    quickReplies: [],
  },
  // Signal: "singpass-logged-in" → advances to cpf-form-prefill

  // ── CPF form (both paths land here after Singpass login) ─────────────────
  {
    id: "cpf-form-prefill",
    background: "cpf-form-01.png",
    hotspot: {
      top: "50%",
      left: "10%",
      width: "80%",
      height: "24%",
      nextBackground: "cpf-form-02.png",
    },
    hotspotChain: {
      "cpf-form-02.png": {
        top: "73.5%",
        left: "77.4%",
        width: "12%",
        height: "3%",
        nextBackground: "cpf-form-03b.png",
      },
      "cpf-form-03b.png": {
        top: "75.75%",
        left: "77.3%",
        width: "12%",
        height: "3%",
        nextBackground: "cpf-form-04b.png",
      },
      "cpf-form-04b.png": {
        top: "74.75%",
        left: "77.4%",
        width: "12%",
        height: "3%",
        nextBackground: "cpf-form-05.png",
      },
      "cpf-form-05.png": {
        top: "73.5%",
        left: "10.54%",
        width: "34.1%",
        height: "2.5%",
        nextBackground: "cpf-form-05b.png",
      },
      "cpf-form-05b.png": {
        top: "77.6%",
        left: "76.1%",
        width: "12.93%",
        height: "2.5%",
        nextBackground: "cpf-form-06.png",
      },
    },
    delays: [1000, 2000, 3000],
    botMessages: [
      "You're now logged in to Corppass. ✓",
      "I've pre-filled your CPF employer registration form using your business details and Corppass credentials.",
      "Select the contribution type in the main window. Please check the details, then click on Next.",
    ],
    quickReplies: [],
  },
  {
    id: "cpf-amend",
    botMessages: [
      "Which field would you like to change? (e.g. payroll cycle, bank account, contact person)",
      "Tell me what to update and I'll amend the form.",
    ],
    quickReplies: [
      {
        label: "Form looks correct — open form",
        nextId: "cpf-form-prefill",
        action: "open-cpf-form",
      },
    ],
  },
  // Signal: "cpf-form-submitted" → advances to cpf-submitted-interim
  {
    id: "cpf-submitted-interim",
    background: "cpf-form-06.png",
    delays: [1000, 2000],
    botMessages: [
      "CPF employer registration submitted. ✓",
      "I can help you link your CSN to Corppass and grant CPF EZPay access.",
    ],
    quickReplies: [
      { label: "Proceed with CPF EZPay setup", nextId: "cpf-submitted" },
    ],
  },
  {
    id: "cpf-submitted",
    background: "cpf-form-06.png",
    delays: [1000, 3000, 4000],
    botMessages: [
      "Linking CSN to Corppass and setting up CPF EZPay access…",
      "CSN linked to your Corppass; CPF EZPay access granted. ✓",
      "You can start making CPF contributions for your employees from tomorrow onwards.",
    ],
    quickReplies: [],
  },
  {
    id: "csn-explainer",
    botMessages: [
      "A few things to know before your first submission:",
      "• CPF contributions cover wages for the current calendar month\n• Payment must be made by the last day of the month\n• Clear all payments by the 14th of the following month to avoid enforcement action and a 1.5% late interest fee",
      "Your Corppass one-time setup is already done — you can log straight into CPF EZPay.",
    ],
    quickReplies: [
      { label: "Set up EZPay now →", nextId: "ezpay-intro" },
    ],
  },

  // ── EZPay ─────────────────────────────────────────────────────────────────
  {
    id: "ezpay-intro",
    botMessages: [
      "Last step: CPF EZPay setup.",
      "I've pre-filled the EZPay registration using your CSN and Corppass credentials. You're already set up on Corppass so login is ready.",
    ],
    quickReplies: [
      {
        label: "Open pre-filled EZPay form →",
        nextId: "ezpay-intro",
        action: "open-ezpay-form",
      },
    ],
  },
  // Signal: "ezpay-form-submitted" → advances to complete

  // ── Complete ───────────────────────────────────────────────────────────────
  {
    id: "complete",
    botMessages: [
      "You're all set. Here's your CPF setup summary:",
      "✅ Corppass provisioned\n✅ CPF employer registration submitted\n✅ CSN issued instantly\n✅ CPF EZPay configured",
      "You can submit your first CPF contribution from tomorrow. Contributions cover the current calendar month — clear payment by the 14th of the following month to avoid late fees. Employer helpline: 1800-227-1188 (Mon–Fri, 8am–5:30pm).",
    ],
    quickReplies: [
      { label: "Start over", nextId: "greeting" },
      { label: "More resources", nextId: "resources" },
    ],
  },
  {
    id: "resources",
    botMessages: [
      "Helpful links:",
      "• Corppass: corppass.gov.sg\n• CPF for employers: cpf.gov.sg/employer\n• CPF EZPay: cpf.gov.sg/ezpay\n• Employer helpline: 1800-227-1188",
    ],
    quickReplies: [
      { label: "Start over", nextId: "greeting" },
    ],
  },
];

// Maps external signal → next flow node
export const signalToNode: Record<string, string> = {
  "corppass-form-submitted": "corppass-manual-done",
  "singpass-logged-in": "cpf-form-prefill",
  "cpf-form-submitted": "cpf-submitted-interim",
  "ezpay-form-submitted": "complete",
};
