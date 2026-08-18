import { useState } from "react";
import { Button } from "@molb-prelogin/zero-design-library";
import { FormSuccess } from "../components/FormSuccess";

interface EZPayFormProps {
  onSubmit: () => void;
  onBack: () => void;
}

export function EZPayForm({ onSubmit, onBack }: EZPayFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("giro");
  const [contactEmail, setContactEmail] = useState("admin@tanandco.com.sg");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="form-page">
        <div className="form-portal-header form-portal-header--cpf">
          <div className="form-portal-header-inner">
            <div className="form-portal-logo">
              <span className="form-portal-logo-text">CPF</span>
              <span className="form-portal-logo-accent"> EZPay</span>
            </div>
          </div>
        </div>
        <FormSuccess
          title="EZPay account activated"
          description="Your CPF EZPay account is ready. Contributions cover the current calendar month — clear payment by the 14th of the following month to avoid enforcement action and a 1.5% late interest fee."
          details={[
            "Employer: Tan & Co Pte Ltd",
            "CSN: 12345678A",
            `Payment method: ${paymentMethod === "giro" ? "GIRO — DBS 012-345678-9" : "PayNow Corporate"}`,
            `Reminders sent to: ${contactEmail}`,
          ]}
          ctaLabel="Return to BizSG Assistant"
          onContinue={onSubmit}
        />
      </div>
    );
  }

  return (
    <div className="form-page">
      {/* Portal header */}
      <div className="form-portal-header form-portal-header--cpf">
        <div className="form-portal-header-inner">
          <div className="form-portal-logo">
            <span className="form-portal-logo-text">CPF</span>
            <span className="form-portal-logo-accent"> EZPay</span>
          </div>
          <span className="form-portal-tagline">Employer CPF Submission Portal</span>
        </div>
      </div>

      <div className="form-container">
        <button className="form-back-link" onClick={onBack} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div className="form-prefill-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Pre-filled by BizSG using your CSN and Corppass credentials.
        </div>

        <h1 className="form-title">CPF EZPay Setup</h1>
        <p className="form-subtitle">
          Set up your EZPay account to submit and pay CPF contributions each month.
        </p>

        <div className="form-section">
          <h2 className="form-section-title">Account Details</h2>

          <div className="form-field">
            <label className="form-label">Employer name</label>
            <input className="form-input form-input--prefilled" value="Tan &amp; Co Pte Ltd" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">CPF Submission Number (CSN)</label>
            <input className="form-input form-input--prefilled" value="12345678A" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">Corppass account</label>
            <div className="form-status-badge form-status-badge--active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Linked
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Payment Method</h2>

          <div className="form-field">
            <label className="form-label">Default payment method</label>
            <div className="form-radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="payment"
                  value="giro"
                  checked={paymentMethod === "giro"}
                  onChange={() => setPaymentMethod("giro")}
                />
                GIRO (auto-deduct from DBS 012-345678-9)
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="payment"
                  value="paynow"
                  checked={paymentMethod === "paynow"}
                  onChange={() => setPaymentMethod("paynow")}
                />
                PayNow Corporate
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Notifications</h2>

          <div className="form-field">
            <label className="form-label" htmlFor="ezpay-email">Submission reminders sent to</label>
            <input
              id="ezpay-email"
              className="form-input"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <span className="form-hint">
              You'll receive a reminder by the 10th of each month and a confirmation after payment.
            </span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Submission schedule</h2>
          <div className="form-info-box">
            <p><strong>Contribution period:</strong> Current calendar month's wages</p>
            <p><strong>Payment deadline:</strong> Last day of the month; clear by 14th of following month</p>
            <p><strong>Late penalty:</strong> 1.5% per month + enforcement action if unpaid after 14th</p>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="ghost" size="medium" onClick={onBack}>
            Cancel
          </Button>
          <Button variant="primary" size="medium" onClick={() => setSubmitted(true)}>
            Activate EZPay account
          </Button>
        </div>
      </div>
    </div>
  );
}
