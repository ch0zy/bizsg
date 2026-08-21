/// <reference types="vite/client" />
import { useState } from "react";

interface SingpassModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const BASE = import.meta.env.BASE_URL;
const BG = `${BASE}screenshots/singpass-login-cpf.png`;

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
    <div className="sp2-overlay">
      {/* Screenshot background */}
      <div
        className="sp2-bg"
        style={{ backgroundImage: `url(${BG})` }}
      />

      {/* Close button top-right */}
      {!done && (
        <button className="sp2-close-btn" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Content frame: same dimensions as background image for precise positioning */}
      <div className="sp2-content-frame">
      {/* Interactive zone over QR code area */}
      {!done ? (
        <button
          className={`sp2-qr-btn ${scanning ? "sp2-qr-btn--scanning" : ""}`}
          onClick={handleScan}
          disabled={scanning}
          aria-label="Simulate Singpass scan"
        >
          {scanning ? (
            <span className="sp2-qr-btn-label">Verifying…</span>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="7" width="3" height="3" />
                <rect x="14" y="7" width="3" height="3" />
                <rect x="7" y="14" width="3" height="3" />
                <rect x="14" y="14" width="3" height="3" />
              </svg>
              <span className="sp2-qr-btn-label">Simulate scan ✓</span>
            </>
          )}
        </button>
      ) : (
        <div className="sp2-success-overlay">
          <div className="sp2-success-icon">✓</div>
          <p className="sp2-success-text">Login successful</p>
          <p className="sp2-success-sub">Returning to BusinessSG…</p>
        </div>
      )}
      </div>
    </div>
  );
}
