import { useState } from "react";
import { Button } from "@molb-prelogin/zero-design-library";
import { FormSuccess } from "../components/FormSuccess";

interface CPFFormProps {
  onSubmit: () => void;
  onBack: () => void;
}

export function CPFForm({ onSubmit, onBack }: CPFFormProps) {
  const [bankAccount, setBankAccount] = useState("DBS 012-345678-9");
  const [contactName, setContactName] = useState("Tan Wei Ming");
  const [contactEmail, setContactEmail] = useState("admin@tanandco.com.sg");
  const [payrollCycle, setPayrollCycle] = useState("monthly");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="form-page">
        <div className="form-portal-header form-portal-header--cpf">
          <div className="form-portal-header-inner">
            <div className="form-portal-logo">
              <span className="form-portal-logo-text">CPF</span>
            </div>
          </div>
        </div>
        <FormSuccess
          title="Registration submitted"
          description="Your CPF employer registration has been received. Your Customer Service Number (CSN) is issued instantly for mandatory contributions — you can start submitting CPF payments from the next calendar day."
          details={[
            "Employer: Tan & Co Pte Ltd (UEN 202412345A)",
            "CPF Submission Number (CSN): 12345678A",
            `Payroll cycle: ${payrollCycle.charAt(0).toUpperCase() + payrollCycle.slice(1)}`,
            `GIRO account: ${bankAccount}`,
            `Contact: ${contactName} — ${contactEmail}`,
          ]}
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
          </div>
          <span className="form-portal-tagline">Central Provident Fund Board</span>
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
          Pre-filled by BizSG using your ACRA and Corppass data. Review all details before submitting.
        </div>

        <h1 className="form-title">CPF Employer Registration</h1>
        <p className="form-subtitle">Register as a new employer to file CPF contributions for your employees.</p>

        <div className="form-section">
          <h2 className="form-section-title">Employer Information</h2>

          <div className="form-field">
            <label className="form-label">Company name</label>
            <input className="form-input form-input--prefilled" value="Tan &amp; Co Pte Ltd" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">UEN</label>
            <input className="form-input form-input--prefilled" value="202412345A" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">Business type</label>
            <input className="form-input form-input--prefilled" value="Private Limited Company" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">Corppass status</label>
            <div className="form-status-badge form-status-badge--active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Active
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Payroll Details</h2>

          <div className="form-field">
            <label className="form-label" htmlFor="payroll-cycle">Payroll cycle</label>
            <select
              id="payroll-cycle"
              className="form-select"
              value={payrollCycle}
              onChange={(e) => setPayrollCycle(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="weekly">Weekly</option>
            </select>
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>

          <div className="form-field">
            <label className="form-label">First contribution month</label>
            <input className="form-input form-input--prefilled" value="September 2026" readOnly />
            <span className="form-prefilled-tag">Pre-filled</span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Payment Details</h2>

          <div className="form-field">
            <label className="form-label" htmlFor="bank-account">Bank account for GIRO</label>
            <input
              id="bank-account"
              className="form-input"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
            <span className="form-hint">CPF deductions will be made from this account on the 14th of each month.</span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Contact Person</h2>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                className="form-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="contact-email-cpf">Email</label>
              <input
                id="contact-email-cpf"
                className="form-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Declaration</h2>
          <div className="form-declaration">
            <label className="form-checkbox-label">
              <input type="checkbox" defaultChecked />
              I declare that I am authorised to submit this application on behalf of the company, and all information is accurate and complete.
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="ghost" size="medium" onClick={onBack}>
            Cancel
          </Button>
          <Button variant="primary" size="medium" onClick={() => setSubmitted(true)}>
            Submit registration
          </Button>
        </div>
      </div>
    </div>
  );
}
