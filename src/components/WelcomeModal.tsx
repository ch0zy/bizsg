import { Modal } from "@molb-prelogin/zero-design-library";

interface WelcomeModalProps {
  onStart: () => void;
  onDismiss: () => void;
}

export function WelcomeModal({ onStart, onDismiss }: WelcomeModalProps) {
  return (
    <Modal
      open
      widthSize="lg"
      title="Congratulations on registering your business with ACRA!"
      bodyContent={
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Are you planning to hire local employees? The BizSG Assistant can guide you through — and automate — the steps needed to set up CPF contributions, starting with your Corppass admin account.
        </p>
      }
      primaryBtnText="Get started"
      secondaryBtnText="Maybe later"
      onPrimary={onStart}
      onSecondary={onDismiss}
      onClose={onDismiss}
      closeOnOutsideClick={false}
    />
  );
}
