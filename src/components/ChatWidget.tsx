import { useEffect, useRef, useState } from "react";
import { Button } from "@molb-prelogin/zero-design-library";
import { flow, signalToNode } from "../data/flow";
import { MessageBubble } from "./MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  onAction?: (action: string) => void;
  externalSignal?: string | null;
  onSignalHandled?: () => void;
}

const COMPANY_CONTEXT = {
  name: "Tan & Co Pte Ltd",
  uen: "202412345A",
  type: "Private Limited Company",
};

export function ChatWidget({ onAction, externalSignal, onSignalHandled }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState("greeting");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const node = flow.find((n) => n.id === "greeting");
      if (node) {
        setMessages(
          node.botMessages.map((content, i) => ({
            id: `init-${i}`,
            role: "assistant",
            content,
          }))
        );
      }
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle signals from external events (form submit, Singpass login)
  useEffect(() => {
    if (!externalSignal) return;
    const targetId = signalToNode[externalSignal];
    if (!targetId) {
      onSignalHandled?.();
      return;
    }
    const node = flow.find((n) => n.id === targetId);
    if (!node) {
      onSignalHandled?.();
      return;
    }
    const botMsgs: Message[] = node.botMessages.map((content, i) => ({
      id: `signal-${Date.now()}-${i}`,
      role: "assistant",
      content,
    }));
    setMessages((prev) => [...prev, ...botMsgs]);
    setCurrentNodeId(targetId);
    setIsOpen(true);
    onSignalHandled?.();
  }, [externalSignal, onSignalHandled]);

  function handleQuickReply(label: string, nextId: string, action?: string) {
    if (action) {
      onAction?.(action);
      // Add user message to show selection
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", content: label },
      ]);
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: label,
    };
    const nextNode = flow.find((n) => n.id === nextId);
    if (!nextNode) return;

    const botMsgs: Message[] = nextNode.botMessages.map((content, i) => ({
      id: `bot-${Date.now()}-${i}`,
      role: "assistant",
      content,
    }));
    setMessages((prev) => [...prev, userMsg, ...botMsgs]);
    setCurrentNodeId(nextId);
  }

  function handleReset() {
    setMessages([]);
    setCurrentNodeId("greeting");
  }

  const currentNode = flow.find((n) => n.id === currentNodeId);
  const quickReplies = currentNode?.quickReplies ?? [];

  return (
    <div className="widget-root">
      {isOpen && (
        <div className="widget-panel">
          {/* Header */}
          <div className="widget-header">
            <div className="widget-header-left">
              <div className="widget-avatar" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <line x1="12" y1="3" x2="12" y2="7" />
                  <circle cx="9" cy="16" r="1" fill="currentColor" />
                  <circle cx="15" cy="16" r="1" fill="currentColor" />
                </svg>
              </div>
              <div>
                <p className="widget-header-name">BizSG Assistant</p>
                <p className="widget-header-status">
                  <span className="widget-status-dot" aria-hidden="true" />
                  Online
                </p>
              </div>
            </div>
            <div className="widget-header-actions">
              <button className="widget-icon-btn" onClick={handleReset} aria-label="Restart conversation" title="Restart">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                </svg>
              </button>
              <button className="widget-icon-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="widget-messages" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && (
            <div className="widget-quick-replies" role="group" aria-label="Quick reply options">
              {quickReplies.map((qr) => (
                <Button
                  key={qr.label}
                  variant="secondary"
                  size="small"
                  onClick={() => handleQuickReply(qr.label, qr.nextId, qr.action)}
                >
                  {qr.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        className={`widget-fab ${isOpen ? "widget-fab--open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close chat assistant" : "Open BizSG chat assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
