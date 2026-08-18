import { Button } from "@molb-prelogin/zero-design-library";

interface FormSuccessProps {
  title: string;
  description: string;
  details?: string[];
  ctaLabel?: string;
  onContinue: () => void;
}

export function FormSuccess({
  title,
  description,
  details,
  ctaLabel = "Return to BizSG Assistant",
  onContinue,
}: FormSuccessProps) {
  return (
    <div className="form-success-wrap">
      <div className="form-success-card">
        <div className="form-success-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="form-success-title">{title}</h2>
        <p className="form-success-desc">{description}</p>
        {details && details.length > 0 && (
          <ul className="form-success-details">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        <Button variant="primary" size="medium" onClick={onContinue}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
