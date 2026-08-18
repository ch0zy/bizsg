import { useState } from "react";
import { Button } from "@molb-prelogin/zero-design-library";

interface SingpassModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function SingpassModal({ onSuccess, onClose }: SingpassModalProps) {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);

  function handleScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setDone(true);
      setTimeout(onSuccess, 900);
    }, 1800);
  }

  return (
    <div className="sp-overlay" role="dialog" aria-modal="true" aria-label="Singpass login">
      <div className="sp-modal">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-logo">
            <span className="sp-logo-sing">Sing</span>
            <span className="sp-logo-pass">pass</span>
          </div>
          {!done && (
            <button className="sp-close" onClick={onClose} aria-label="Close Singpass login">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {done ? (
          <div className="sp-success">
            <div className="sp-success-icon" aria-hidden="true">✓</div>
            <p className="sp-success-text">Login successful</p>
            <p className="sp-success-sub">Returning to BizSG…</p>
          </div>
        ) : (
          <>
            <p className="sp-instruction">
              Scan with your <strong>Singpass app</strong> to log in to Corppass
            </p>

            {/* Mock QR */}
            <div className={`sp-qr-wrap ${scanning ? "sp-qr-wrap--scanning" : ""}`} aria-label="Singpass QR code">
              <svg
                className="sp-qr"
                viewBox="0 0 37 37"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Top-left finder */}
                <rect x="1" y="1" width="10" height="10" rx="1.5" fill="#1a1a1a" />
                <rect x="3" y="3" width="6" height="6" rx="0.5" fill="white" />
                <rect x="4" y="4" width="4" height="4" rx="0.5" fill="#1a1a1a" />
                {/* Top-right finder */}
                <rect x="26" y="1" width="10" height="10" rx="1.5" fill="#1a1a1a" />
                <rect x="28" y="3" width="6" height="6" rx="0.5" fill="white" />
                <rect x="29" y="4" width="4" height="4" rx="0.5" fill="#1a1a1a" />
                {/* Bottom-left finder */}
                <rect x="1" y="26" width="10" height="10" rx="1.5" fill="#1a1a1a" />
                <rect x="3" y="28" width="6" height="6" rx="0.5" fill="white" />
                <rect x="4" y="29" width="4" height="4" rx="0.5" fill="#1a1a1a" />
                {/* Data dots */}
                <rect x="13" y="1" width="2" height="2" fill="#1a1a1a" />
                <rect x="16" y="1" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="4" width="2" height="2" fill="#1a1a1a" />
                <rect x="16" y="4" width="2" height="2" fill="#1a1a1a" />
                <rect x="19" y="2" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="1" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="4" width="2" height="2" fill="#1a1a1a" />
                <rect x="1" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="4" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="4" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="7" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="7" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="1" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="16" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="19" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="25" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="19" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="25" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="28" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="34" y="13" width="2" height="2" fill="#1a1a1a" />
                <rect x="31" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="34" y="16" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="19" width="2" height="2" fill="#1a1a1a" />
                <rect x="16" y="19" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="19" width="2" height="2" fill="#1a1a1a" />
                <rect x="25" y="22" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="22" width="2" height="2" fill="#1a1a1a" />
                <rect x="19" y="22" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="25" width="2" height="2" fill="#1a1a1a" />
                <rect x="16" y="25" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="25" width="2" height="2" fill="#1a1a1a" />
                <rect x="28" y="25" width="2" height="2" fill="#1a1a1a" />
                <rect x="31" y="22" width="2" height="2" fill="#1a1a1a" />
                <rect x="34" y="25" width="2" height="2" fill="#1a1a1a" />
                <rect x="1" y="22" width="2" height="2" fill="#1a1a1a" />
                <rect x="7" y="22" width="2" height="2" fill="#1a1a1a" />
                <rect x="4" y="25" width="2" height="2" fill="#1a1a1a" />
                <rect x="31" y="28" width="2" height="2" fill="#1a1a1a" />
                <rect x="34" y="31" width="2" height="2" fill="#1a1a1a" />
                <rect x="28" y="31" width="2" height="2" fill="#1a1a1a" />
                <rect x="19" y="28" width="2" height="2" fill="#1a1a1a" />
                <rect x="22" y="31" width="2" height="2" fill="#1a1a1a" />
                <rect x="16" y="31" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="28" width="2" height="2" fill="#1a1a1a" />
                <rect x="13" y="34" width="2" height="2" fill="#1a1a1a" />
                <rect x="19" y="34" width="2" height="2" fill="#1a1a1a" />
              </svg>
              {scanning && (
                <div className="sp-scan-line" aria-hidden="true" />
              )}
            </div>

            <p className="sp-qr-hint">
              Open Singpass app → tap <strong>Scan</strong>
            </p>

            <div className="sp-divider">
              <span>or</span>
            </div>

            <Button variant="primary" size="small" onClick={handleScan} disabled={scanning}>
              {scanning ? "Verifying…" : "Simulate scan ✓"}
            </Button>

            <p className="sp-legal">
              By logging in, you consent to Singpass verifying your identity for Corppass access.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
