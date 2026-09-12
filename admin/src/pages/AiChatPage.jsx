// src/pages/AiChatPage.jsx
//
// Real chat UI for the user-facing /ai route (previously GenericPage —
// see CHANGES.md). Talks to the conversation-aware endpoints in
// server/src/routes/ai.routes.js via aiChat.service.js: create/list/get
// conversations, send a message, and confirm a proposed write action
// (Doc Section 20/67's CONFIRM_ACTION flow).
//
// Visual language: a calm, document-like reading column (Claude-style)
// instead of boxed chat bubbles everywhere — the assistant's answer is
// just well-set text, the user's turn is a soft pill on the right, and
// the composer is a single rounded input anchored to the bottom.

import { useEffect, useRef, useState } from "react";
import { Plus, ArrowUp, Loader2, Sparkles, Trash2, Square, Mic, MicOff } from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import { aiChatService } from "../services/aiChat.service.js";
import "./AiChatPage.css";

const SUGGESTIONS = [
  "How much have I spent this month?",
  "What tasks are overdue?",
  "Show my budgets",
  "Create a ₹5,000 food budget",
];

export default function AiChatPage() {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // {tool, parameters, ...} awaiting confirm/cancel
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  // Voice to text states
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const shellRef = useRef(null);
  const [shellHeight, setShellHeight] = useState(null);

  // Auto-resize textarea as input changes
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const nextH = Math.min(Math.max(textareaRef.current.scrollHeight, 24), 160);
    textareaRef.current.style.height = `${nextH}px`;
  }, [input]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // Load conversation list on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (messages.length === 0 && !pendingAction) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingAction, sending]);

  // Size the chat panel to whatever room is actually left in the
  // viewport below it, instead of guessing a fixed header height in
  // CSS — that guess drifts (different zoom levels, header changes,
  // themes) and pushes the composer off-screen when it's wrong.
  useEffect(() => {
    function measure() {
      const el = shellRef.current;
      if (!el) return;
      // Below the mobile breakpoint the sidebar/panel stack vertically
      // and size themselves from CSS instead — don't fight that with
      // an inline height meant for the two-column desktop layout.
      if (window.innerWidth <= 860) {
        setShellHeight(null);
        return;
      }
      const top = el.getBoundingClientRect().top;
      const available = window.innerHeight - top - 24;
      setShellHeight(Math.max(480, Math.round(available)));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Auto-grow the composer textarea with content, capped so it never
  // swallows the whole panel.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  async function loadConversations() {
    setConversationsLoading(true);
    try {
      const res = await aiChatService.listConversations({ limit: 30 });
      setConversations(res.data?.conversations ?? []);
    } catch (err) {
      console.error("Failed to load AI conversations:", err);
    } finally {
      setConversationsLoading(false);
    }
  }

  async function openConversation(id) {
    setActiveId(id);
    setPendingAction(null);
    setError("");
    setMessagesLoading(true);
    try {
      const res = await aiChatService.getConversation(id);
      const msgs = res.data?.messages ?? [];
      setMessages(msgs.filter((m) => m.role === "USER" || m.role === "ASSISTANT"));

      // A conversation can be reopened mid-confirmation (e.g. user
      // navigated away right after a pendingAction was proposed) — the
      // last assistant message is left as status PENDING_CONFIRMATION
      // with no content in that case, but we don't have the original
      // `call`/`messages` payload to resume it from a page reload, so
      // just surface it as a stale action the user needs to re-ask for.
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Couldn't load that conversation.");
    } finally {
      setMessagesLoading(false);
    }
  }

  function startNewChat() {
    setActiveId(null);
    setMessages([]);
    setPendingAction(null);
    setError("");
    setInput("");
  }

  async function deleteConversation(id, e) {
    e.stopPropagation();
    try {
      await aiChatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) startNewChat();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }

  // ------------------------------------------------------------------
  // Voice-to-Text Speech Recognition
  // ------------------------------------------------------------------
  const stopListening = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    baseTextRef.current = "";
    setIsListening(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      // Prefix what was already in input so speech appends smoothly
      baseTextRef.current = input ? (input.endsWith(" ") ? input : input + " ") : "";
      isListeningRef.current = true;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setError("");
      };

      recognition.onresult = (event) => {
        if (!isListeningRef.current) return;
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        const spoken = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
        if (spoken && isListeningRef.current) {
          setInput(baseTextRef.current + spoken);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone access denied. Please allow microphone permissions to dictate.");
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          setError(`Voice input error: ${event.error}`);
        }
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      isListeningRef.current = false;
      setIsListening(false);
      setError("Could not start speech recognition.");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // ------------------------------------------------------------------
  // Sending a message
  // ------------------------------------------------------------------
  async function handleSend(overrideText) {
    stopListening();
    baseTextRef.current = "";

    const text = (overrideText ?? input).trim();
    if (!text || sending) return;

    setError("");
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    setSending(true);
    setMessages((prev) => [...prev, { role: "USER", content: text, _pending: true }]);

    try {
      let conversationId = activeId;
      if (!conversationId) {
        const created = await aiChatService.createConversation();
        conversationId = created.data?.conversation?.id;
        setActiveId(conversationId);
        loadConversations(); // refresh sidebar so the new thread appears
      }

      const res = await aiChatService.sendMessage(conversationId, text);
      const data = res.data?.data ?? {};

      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
      } else {
        setMessages((prev) => [...prev, { role: "ASSISTANT", content: data.reply }]);
      }
    } catch (err) {
      console.error("Failed to send AI message:", err);
      const message = err.response?.data?.message || "AI provider unavailable — try again in a moment.";
      setError(message);
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: `⚠️ ${message}`, _error: true }]);
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm() {
    if (!pendingAction || !activeId) return;
    setConfirming(true);
    setError("");
    try {
      const res = await aiChatService.confirmAction(activeId, pendingAction);
      const data = res.data?.data ?? {};

      if (data.pendingAction) {
        // The confirmed tool chained into another proposed write —
        // resume the confirm flow instead of dropping it (Section
        // 67's resumable pendingAction).
        setPendingAction(data.pendingAction);
      } else {
        setMessages((prev) => [...prev, { role: "ASSISTANT", content: data.reply }]);
        setPendingAction(null);
      }
    } catch (err) {
      console.error("Failed to confirm AI action:", err);
      setError(err.response?.data?.message || "Couldn't complete that action.");
    } finally {
      setConfirming(false);
    }
  }

  function handleCancel() {
    setMessages((prev) => [...prev, { role: "ASSISTANT", content: "Okay, I won't do that.", _cancelled: true }]);
    setPendingAction(null);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isListening) stopListening();
      handleSend();
    }
  }

  const showWelcome = messages.length === 0 && !pendingAction && !messagesLoading;

  return (
    <div className="ai-chat-page">
      <PageHeader title="AI" subtitle="Ask MONE AI about your finances, tasks and more." />

      <div
        ref={shellRef}
        className="ai-chat-shell"
        style={shellHeight ? { height: shellHeight } : undefined}
      >
        {/* ============ CONVERSATION SIDEBAR ============ */}
        <aside className="ai-sidebar">
          <button type="button" className="ai-new-chat" onClick={startNewChat}>
            <Plus size={16} /> New chat
          </button>

          <div className="ai-conversation-list">
            {conversationsLoading ? (
              <div className="ai-sidebar-loading">
                <div className="users-loader" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="ai-conversation-empty">No conversations yet — send a message to start one.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`ai-conversation-item${activeId === c.id ? " is-active" : ""}`}
                >
                  <span className="ai-conversation-item__title">{c.title || "New Conversation"}</span>
                  <Trash2
                    size={14}
                    className="ai-conversation-item__delete"
                    onClick={(e) => deleteConversation(c.id, e)}
                  />
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ============ CHAT PANEL ============ */}
        <main className="ai-chat-main">
          <div ref={scrollRef} className="ai-scroll">
            {messagesLoading ? (
              <div className="ai-sidebar-loading ai-sidebar-loading--center">
                <div className="users-loader" />
              </div>
            ) : showWelcome ? (
              <div className="ai-welcome">
                <div className="ai-welcome__icon">
                  <Sparkles size={20} />
                </div>
                <h3 className="ai-welcome__title">Ask MONE AI anything</h3>
                <p className="ai-welcome__subtitle">
                  It can see your spending, budgets and tasks — and can create things for you after you confirm.
                </p>
                <div className="ai-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="ai-suggestion-chip" onClick={() => handleSend(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ai-thread">
                {messages.map((m, i) => (
                  <ChatTurn key={i} message={m} />
                ))}

                {sending && <ChatTurn message={{ role: "ASSISTANT", content: "" }} typing />}

                {pendingAction && (
                  <ConfirmCard
                    pendingAction={pendingAction}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirming={confirming}
                  />
                )}
              </div>
            )}
          </div>

          {error && <div className="ai-error-banner">{error}</div>}

          <div className="ai-composer-dock">
            {isListening && (
              <div className="ai-composer__listening-pill">
                <span className="ai-composer__recording-dot" />
                <span className="ai-composer__listening-text">Listening... Speak into your microphone</span>
                <button
                  type="button"
                  className="ai-composer__listening-stop"
                  onClick={stopListening}
                >
                  Done
                </button>
              </div>
            )}

            <div className={`ai-composer${pendingAction ? " is-disabled" : ""}${isListening ? " is-recording" : ""}`}>
              <textarea
                ref={textareaRef}
                className="ai-composer__textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  pendingAction
                    ? "Confirm or cancel the action above first…"
                    : isListening
                    ? "Listening to voice input..."
                    : "Ask MONE AI..."
                }
                disabled={sending || !!pendingAction}
                rows={1}
              />

              <div className="ai-composer__actions">
                <button
                  type="button"
                  className={`ai-composer__mic${isListening ? " is-active" : ""}`}
                  disabled={sending || !!pendingAction}
                  onClick={toggleListening}
                  aria-label={isListening ? "Stop voice input" : "Voice to text"}
                  title={isListening ? "Stop voice listening" : "Voice to text"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  type="button"
                  className={`ai-composer__send${input.trim() ? " has-text" : ""}`}
                  disabled={sending || !input.trim() || !!pendingAction}
                  onClick={() => handleSend()}
                  aria-label="Send message"
                  title="Send message"
                >
                  {sending ? <Square size={13} /> : <ArrowUp size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
            <p className="ai-composer__hint">MONE AI can make mistakes. Check important info before acting on it.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

// ======================================================================
// Message rendering — a small, dependency-free markdown-lite renderer.
// Assistant replies are plain LLM text that may contain **bold**,
// `inline code`, ``` fenced code blocks ```, and "- "/"1. " lists; this
// gives them real typographic structure instead of a single <pre> blob.
// ======================================================================

function ChatTurn({ message, typing }) {
  const isUser = message.role === "USER";

  if (isUser) {
    return (
      <div className="ai-turn ai-turn--user">
        <div className="ai-user-bubble">{message.content}</div>
      </div>
    );
  }

  return (
    <div className={`ai-turn ai-turn--assistant${message._error ? " is-error" : ""}`}>
      <div className="ai-assistant-mark">
        <Sparkles size={13} />
      </div>
      <div className="ai-assistant-body">
        {typing ? <TypingDots /> : <MessageContent text={message.content} />}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="ai-typing-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

function MessageContent({ text }) {
  if (!text) return null;
  const segments = text.split("```");

  return segments.map((segment, i) => {
    if (i % 2 === 1) {
      const lines = segment.split("\n");
      const hasLangTag = lines.length > 1 && /^[a-zA-Z0-9_+-]*$/.test(lines[0].trim());
      const code = hasLangTag ? lines.slice(1).join("\n") : segment;
      return <CodeBlock key={i} code={code.replace(/^\n/, "").replace(/\n$/, "")} />;
    }
    return <ProseBlocks key={i} text={segment} />;
  });
}

function ProseBlocks({ text }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim() !== "");

  return blocks.map((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    const isBulleted = lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l));
    const isNumbered = lines.length > 0 && lines.every((l) => /^\s*\d+\.\s+/.test(l));

    if (isBulleted) {
      return (
        <ul className="ai-list" key={i}>
          {lines.map((l, j) => (
            <li key={j}>{formatInline(l.replace(/^\s*[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    if (isNumbered) {
      return (
        <ol className="ai-list" key={i}>
          {lines.map((l, j) => (
            <li key={j}>{formatInline(l.replace(/^\s*\d+\.\s+/, ""))}</li>
          ))}
        </ol>
      );
    }

    return (
      <p className="ai-paragraph" key={i}>
        {lines.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {formatInline(l)}
          </span>
        ))}
      </p>
    );
  });
}

function formatInline(text) {
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  const nodes = [];
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code className="ai-inline-code" key={key++}>
          {match[3]}
        </code>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <div className="ai-code-block">
      <div className="ai-code-block__bar">
        <button type="button" className="ai-code-block__copy" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Doc Section 20/67 — write actions require explicit confirmation before
// they touch the database. Shown inline in the message stream, set at
// the same left margin as assistant text, so it reads as part of the
// conversation rather than a modal interruption.
function ConfirmCard({ pendingAction, onConfirm, onCancel, confirming }) {
  const { tool, parameters } = pendingAction;
  const label = tool
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="ai-turn ai-turn--assistant">
      <div className="ai-assistant-mark">
        <Sparkles size={13} />
      </div>
      <div className="ai-confirm-card">
        <p className="ai-confirm-card__title">Confirm: {label}</p>
        <ul className="ai-confirm-card__params">
          {Object.entries(parameters || {}).map(([key, value]) => (
            <li key={key}>
              <span className="key">{key}</span>
              <strong>{String(value)}</strong>
            </li>
          ))}
        </ul>
        <div className="ai-confirm-card__actions">
          <button type="button" className="ai-confirm-btn ai-confirm-btn--primary" onClick={onConfirm} disabled={confirming}>
            {confirming ? <Loader2 size={14} className="todo-spin" /> : null}
            {confirming ? "Working…" : "Confirm"}
          </button>
          <button type="button" className="ai-confirm-btn ai-confirm-btn--ghost" onClick={onCancel} disabled={confirming}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
