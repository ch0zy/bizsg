import { Modal } from "@molb-prelogin/zero-design-library";

interface CSNModalProps {
  onProceed: () => void;
  onDismiss: () => void;
}

export function CSNModal({ onProceed, onDismiss }: CSNModalProps) {
  return (
    <Modal
      open
      widthSize="lg"
      title="Your CPF Submission Number (CSN) is ready"
      bodyContent={
        <div style={{ lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 0.75rem" }}>Transaction details will be sent to your email.</p>
          <p style={{ margin: 0 }}>
            The BusinessSG assistant can help you link your CSN to Corppass and grant
            CPF EZPay access — so you can start filing contributions the next calendar day.
          </p>
        </div>
      }
      primaryBtnText="Proceed with CPF EZPay setup"
      secondaryBtnText="Maybe later"
      onPrimary={onProceed}
      onSecondary={onDismiss}
      onClose={onDismiss}
      closeOnOutsideClick={false}
    />
  );
}
