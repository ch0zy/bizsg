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
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          The BizSG assistant can help you link your CSN to Corppass and grant
          CPF EZPay access — so you can start filing contributions the next calendar day.
        </p>
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
