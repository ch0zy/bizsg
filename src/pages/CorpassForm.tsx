import { useState } from "react";
import { Button } from "@molb-prelogin/zero-design-library";
import { FormSuccess } from "../components/FormSuccess";

interface CorpassFormProps {
  onSubmit: () => void;
  onBack: () => void;
}

export function CorpassForm({ onSubmit, onBack }: CorpassFormProps) {
  const [contactEmail, setContactEmail] = useState("admin@tanandco.com.sg");
  const [adminNric, setAdminNric] = useState("S8812345A");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="form-page">
        <div className="form-portal-header">
          <div className="form-portal-header-inner">
            <div className="form-portal-logo">
              <span className="form-portal-logo-text">Corp</span>
              <span className="form-portal-logo-accent">pass</span>
            </div>
          </div>
        </div>
        <FormSuccess
          title="Application submitted"
          description="Your Corppass application has been submitted. For a Singapore-registered entity, activation is instant once your Registered Officer (RO) approves the request. The RO has up to 30 days to approve — most do it within minutes."
          details={[
            "Entity: Tan & Co Pte Ltd (UEN 202412345A)",
            `Corppass Admin: ${adminNric}`,
            `Notification email: ${contactEmail}`,
            "Next step: RO approves → log in with Singpass",
          ]}
          onContinue={onSubmit}
        />
      </div>
    );
  }

  return (
    <div className="form-page">
      {/* Portal header */}
      <div className="form-portal-header">
        <div className="form-portal-header-inner">
          <div className="form-portal-logo">
            <span className="form-portal-logo-text">Corp</span>
            <span className="form-portal-logo-accent">pass</span>
          </div>
          <span className="form-portal-tagline">Business Digital Identity</span>
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
          Pre-filled by BusinessSG using your ACRA registration data. Review all details before submitting.
        </div>

        <h1 className="form-title">Register for Corppass</h1>
        <p className="form-subtitle">Create a corporate digital identity to access government digital services.</p>

        <div className="form-section">
          <h2 className="form-section-title">Business Information</h2>

          <div className="form-field">
            <label className="form-label">Entity name</label>
            <input className="form-input form-input--prefilled" value="Tan &amp; Co Pte Ltd" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">Unique Entity Number (UEN)</label>
            <input className="form-input form-input--prefilled" value="202412345A" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">Entity type</label>
            <input className="form-input form-input--prefilled" value="Private Limited Company" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">Registered address</label>
            <input className="form-input form-input--prefilled" value="123 Tanjong Pagar Road, #04-01, Singapore 088534" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Corppass Admin</h2>
          <p className="form-section-desc">
            The Corppass Admin manages user access for your entity. You will be assigned as Admin.
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor="admin-nric">Admin NRIC / FIN</label>
            <input
              id="admin-nric"
              className="form-input"
              value={adminNric}
              onChange={(e) => setAdminNric(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="contact-email">Contact email</label>
            <input
              id="contact-email"
              className="form-input"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <span className="form-hint">Activation details will be sent to this address.</span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Processing timeline</h2>
          <div className="form-info-box">
            <p><strong>Singapore-registered entity:</strong> Instant activation once your Registered Officer (RO) approves</p>
            <p><strong>RO approval window:</strong> Up to 30 days (most approve within minutes)</p>
            <p><strong>New UEN:</strong> Wait at least 1 working day after receiving your UEN before applying</p>
            <p><strong>Foreign entity:</strong> 5–10 working days (manual verification required)</p>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Declaration</h2>
          <div className="form-declaration">
            <label className="form-checkbox-label">
              <input type="checkbox" defaultChecked />
              I confirm that all information provided is accurate and I am authorised to register on behalf of this entity.
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="ghost" size="medium" onClick={onBack}>
            Cancel
          </Button>
          <Button variant="primary" size="medium" onClick={() => setSubmitted(true)}>
            Submit application
          </Button>
        </div>
      </div>
    </div>
  );
}
