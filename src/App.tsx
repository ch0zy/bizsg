import { useState, useCallback } from "react";
import { ChatWidget } from "./components/ChatWidget";
import { SingpassModal } from "./components/SingpassModal";
import { CorpassForm } from "./pages/CorpassForm";
import { CPFForm } from "./pages/CPFForm";
import { EZPayForm } from "./pages/EZPayForm";

type Page = "main" | "corppass-form" | "cpf-form" | "ezpay-form";

function DemoPage() {
  return (
    <div className="demo-page">
      <div className="demo-page-content">
        <div className="demo-badge">GoBusiness</div>
        <h1 className="demo-title">Register Your Business</h1>
        <p className="demo-body">
          Congratulations on registering with ACRA! Your business is now officially recognised.
        </p>
        <p className="demo-body">
          As a new business owner, here are the next steps to get your operations started:
        </p>
        <ul className="demo-list">
          <li>Open a corporate bank account</li>
          <li>Register for GST if annual turnover exceeds $1M</li>
          <li>Set up CPF contributions if you plan to hire employees</li>
          <li>Apply for relevant business licences</li>
        </ul>
        <p className="demo-hint">
          Need help with CPF setup? The BizSG Assistant is ready — look for the chat icon at the bottom right.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const [showSingpassModal, setShowSingpassModal] = useState(false);
  const [chatSignal, setChatSignal] = useState<string | null>(null);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "open-corppass-form":
        setPage("corppass-form");
        break;
      case "open-singpass-qr":
        setShowSingpassModal(true);
        break;
      case "open-cpf-form":
        setPage("cpf-form");
        break;
      case "open-ezpay-form":
        setPage("ezpay-form");
        break;
    }
  }, []);

  function handleCorpassSubmit() {
    setPage("main");
    setChatSignal("corppass-form-submitted");
  }

  function handleSingpassSuccess() {
    setShowSingpassModal(false);
    setChatSignal("singpass-logged-in");
  }

  function handleCPFSubmit() {
    setPage("main");
    setChatSignal("cpf-form-submitted");
  }

  function handleEZPaySubmit() {
    setPage("main");
    setChatSignal("ezpay-form-submitted");
  }

  const handleSignalHandled = useCallback(() => {
    setChatSignal(null);
  }, []);

  return (
    <>
      {page === "main" && <DemoPage />}
      {page === "corppass-form" && (
        <CorpassForm onSubmit={handleCorpassSubmit} onBack={() => setPage("main")} />
      )}
      {page === "cpf-form" && (
        <CPFForm onSubmit={handleCPFSubmit} onBack={() => setPage("main")} />
      )}
      {page === "ezpay-form" && (
        <EZPayForm onSubmit={handleEZPaySubmit} onBack={() => setPage("main")} />
      )}

      {showSingpassModal && (
        <SingpassModal
          onSuccess={handleSingpassSuccess}
          onClose={() => setShowSingpassModal(false)}
        />
      )}

      <ChatWidget
        onAction={handleAction}
        externalSignal={chatSignal}
        onSignalHandled={handleSignalHandled}
      />
    </>
  );
}
