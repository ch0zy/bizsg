export interface QuickReply {
  label: string;
  nextId: string;
  action?: string;
}

export interface FlowNode {
  id: string;
  botMessages: string[];
  quickReplies?: QuickReply[];
}

export const flow: FlowNode[] = [
  {
    id: "greeting",
    botMessages: [
      "Hi! Congratulations on registering your business with ACRA.",
      "I'm the BizSG assistant. I can guide you through next steps for your business.",
      "Ready to get started?",
    ],
    quickReplies: [
      { label: "Apply for CPF as new employer", nextId: "cpf-intent" },
      { label: "I need help with something else", nextId: "other" },
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
    botMessages: [
      "First step: Corppass setup.",
      "Should I automatically provision a Corppass account for your business, or would you prefer to review and submit the form yourself?",
    ],
    quickReplies: [
      { label: "Auto-provision for me", nextId: "corppass-auto-processing" },
      { label: "I'll review the form first", nextId: "corppass-manual-prefill" },
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
        nextId: "corppass-manual-done",
        action: "open-singpass-qr",
      },
    ],
  },

  // ── Singpass login (both paths land here via signal) ─────────────────────
  // Signal: "singpass-logged-in" → advances to cpf-form-prefill

  // ── CPF form (both paths land here after Singpass login) ─────────────────
  {
    id: "cpf-form-prefill",
    botMessages: [
      "You're now logged in to Corppass. ✓",
      "I've pre-filled your CPF employer registration form using your business details and Corppass credentials.",
      "Review the details, then submit.",
    ],
    quickReplies: [
      {
        label: "Open pre-filled CPF form →",
        nextId: "cpf-form-prefill",
        action: "open-cpf-form",
      },
      { label: "Make an amendment", nextId: "cpf-amend" },
    ],
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
  // Signal: "cpf-form-submitted" → advances to cpf-submitted
  {
    id: "cpf-submitted",
    botMessages: [
      "CPF employer registration submitted. ✓",
      "Good news: for mandatory CPF contributions, your CSN is processed instantly — right after your online application.",
      "Your CPF Submission Number (CSN): 12345678A\n\nYou can start submitting staff CPF payments from the very next calendar day.",
    ],
    quickReplies: [
      { label: "Set up EZPay now →", nextId: "ezpay-intro" },
      { label: "What do I need to know first?", nextId: "csn-explainer" },
    ],
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
  "cpf-form-submitted": "cpf-submitted",
  "ezpay-form-submitted": "complete",
};
