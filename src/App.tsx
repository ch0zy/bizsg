import { useState, useCallback, useEffect, useRef } from "react";
import { ChatWidget } from "./components/ChatWidget";
import { SingpassModal } from "./components/SingpassModal";
import { ScreenshotBackground } from "./components/ScreenshotBackground";
import { WelcomeModal } from "./components/WelcomeModal";
import { CSNModal } from "./components/CSNModal";
import { CorpassForm } from "./pages/CorpassForm";
import { CPFForm } from "./pages/CPFForm";
import { EZPayForm } from "./pages/EZPayForm";

type Modal = "corppass-form" | "cpf-form" | "ezpay-form" | "singpass" | null;

export default function App() {
  const [modal, setModal] = useState<Modal>(null);
  const [chatSignal, setChatSignal] = useState<string | null>(null);
  const [bgNode, setBgNode] = useState("greeting");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCSNModal, setShowCSNModal] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const csnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const csnShownRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleBackgroundChange = useCallback((filename: string) => {
    if (filename === "cpf-form-06.png" && !csnShownRef.current) {
      csnTimerRef.current = setTimeout(() => setShowCSNModal(true), 5000);
    }
  }, []);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "open-corppass-form":
        setModal("corppass-form");
        break;
      case "open-singpass-qr":
        setModal("singpass");
        break;
      case "open-cpf-form":
        setModal("cpf-form");
        break;
      case "open-ezpay-form":
        setModal("ezpay-form");
        break;
    }
  }, []);

  const handleSignalHandled = useCallback(() => {
    setChatSignal(null);
  }, []);

  return (
    <>
      <ScreenshotBackground nodeId={bgNode} onBackgroundChange={handleBackgroundChange} />

      {modal === "corppass-form" && (
        <div className="modal-overlay">
          <CorpassForm
            onSubmit={() => { setModal(null); setChatSignal("corppass-form-submitted"); }}
            onBack={() => setModal(null)}
          />
        </div>
      )}

      {modal === "cpf-form" && (
        <div className="modal-overlay">
          <CPFForm
            onSubmit={() => { setModal(null); setChatSignal("cpf-form-submitted"); }}
            onBack={() => setModal(null)}
          />
        </div>
      )}

      {modal === "ezpay-form" && (
        <div className="modal-overlay">
          <EZPayForm
            onSubmit={() => { setModal(null); setChatSignal("ezpay-form-submitted"); }}
            onBack={() => setModal(null)}
          />
        </div>
      )}

      {showCSNModal && (
        <CSNModal
          onProceed={() => { csnShownRef.current = true; setShowCSNModal(false); setChatSignal("cpf-form-submitted"); setOpenChat(true); }}
          onDismiss={() => { csnShownRef.current = true; setShowCSNModal(false); }}
        />
      )}

      {showWelcome && (
        <WelcomeModal
          onStart={() => { setShowWelcome(false); setOpenChat(true); }}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {modal === "singpass" && (
        <SingpassModal
          onSuccess={() => { setModal(null); setChatSignal("singpass-logged-in"); }}
          onClose={() => setModal(null)}
        />
      )}

      <ChatWidget
        onAction={handleAction}
        externalSignal={chatSignal}
        onSignalHandled={handleSignalHandled}
        onNodeChange={setBgNode}
        requestOpen={openChat}
      />
    </>
  );
}
