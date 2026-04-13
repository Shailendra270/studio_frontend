import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { apiGet, apiPost, videoapiUrl } from "../../utils/apiClient.js";

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatRole = "user" | "assistant" | "system" | "error";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
}

type HistoryRole = "user" | "assistant";

interface HistoryMessage {
  role: HistoryRole;
  content: string;
  createdAt?: string;
}

interface ChatHistoryResponse {
  status: boolean;
  threadId?: string | null;
  messages?: HistoryMessage[];
  message?: string;
}

interface ChatResponse {
  status: boolean;
  threadId?: string | null;
  reply?: string;
  message?: string;
}

const HelpDrawer: React.FC<HelpDrawerProps> = ({ isOpen, onClose }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const suggestions = useMemo(
    () => [
      "How do I publish a clip to social media?",
      "Find my latest clips from this week",
      "How do I create a highlight from a live stream?",
      "Explain roles & permissions (RBAC) in the dashboard",
    ],
    [],
  );

  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const storedThreadId = localStorage.getItem("studio_chat_thread_id");
    const load = async () => {
      try {
        const qs = storedThreadId ? `?threadId=${encodeURIComponent(storedThreadId)}&limit=50` : "?limit=50";
        const res = await apiGet(`${videoapiUrl}/api/chat/history${qs}`);
        const raw: unknown = await res.json();
        const data: ChatHistoryResponse = isObject(raw) ? (raw as ChatHistoryResponse) : { status: false };
        if (!res.ok || !data?.status) {
          setErrorText(data?.message || "Failed to load chat history");
          return;
        }
        if (data.threadId) {
          setThreadId(data.threadId);
          localStorage.setItem("studio_chat_thread_id", data.threadId);
        }
        const loaded: ChatMessage[] = (data.messages || []).map((m, idx) => ({
          id: `${m.createdAt || "m"}-${idx}`,
          role: m.role,
          content: String(m.content || ""),
          createdAt: m.createdAt,
        }));
        setMessages(loaded);
        setErrorText(null);
      } catch (e: unknown) {
        setErrorText(e instanceof Error ? e.message : "Failed to load chat history");
      }
    };
    load();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isOpen, messages, isSending]);

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = String(text || "").trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setErrorText(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    pushMessage(userMsg);

    const typingId = createId();
    pushMessage({
      id: typingId,
      role: "assistant",
      content: "",
    });

    try {
      const payload: { message: string; locale: string; threadId?: string } = {
        message: trimmed,
        locale: navigator.language,
      };
      if (threadId) payload.threadId = threadId;
      const res = await apiPost(`${videoapiUrl}/api/chat`, payload);
      const raw: unknown = await res.json();
      const data: ChatResponse = isObject(raw) ? (raw as ChatResponse) : { status: false };
      if (!res.ok || !data?.status) {
        throw new Error(data?.message || "Chat failed");
      }
      if (data.threadId) {
        setThreadId(data.threadId);
        localStorage.setItem("studio_chat_thread_id", data.threadId);
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, content: String(data.reply || "") } : m)),
      );
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      const errText = e instanceof Error ? e.message : "Chat failed";
      setErrorText(errText);
      pushMessage({
        id: createId(),
        role: "error",
        content: errText,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-500 ease-out ${
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        }`}
      />
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[560px] bg-black border-l-2 border-[#373737] z-50 transform transition-all duration-500 ease-out sm:rounded-l-[50px] overflow-hidden ${
          isOpen ? "translate-x-0 opacity-90" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#373737]">
          <div className="flex items-center gap-3">
            <svg width="38" height="25" viewBox="0 0 38 25" fill="none" className="flex-shrink-0">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.1836 0C12.7511 0 14.1592 0.303826 15.407 0.911704C16.2464 1.31026 16.982 1.81292 17.615 2.41789V0.479966H24.8143V23.8069H17.615V21.9149C17.0017 22.4948 16.282 22.9819 15.455 23.3747C14.1749 23.9825 12.7511 24.2867 11.1836 24.2867C9.03969 24.2867 7.11963 23.7588 5.42375 22.7029C3.76003 21.647 2.43174 20.207 1.43954 18.3831C0.479844 16.5592 0 14.4792 0 12.1433C0 9.80752 0.479844 7.72754 1.43954 5.9036C2.43174 4.07975 3.76003 2.63984 5.42375 1.58382C7.11963 0.527916 9.03969 0 11.1836 0ZM10.7671 7.55488C9.70048 6.93922 8.3675 7.70883 8.3675 8.94042V15.314C8.3675 16.5455 9.70048 17.3152 10.7671 16.6994L16.287 13.5129C17.3536 12.897 17.3536 11.3573 16.287 10.7415L10.7671 7.55488Z"
                fill="url(#paint0_linear)"
              />
              <path
                d="M37.9998 23.8063H30.656V0.479492H37.9998V23.8063Z"
                fill="url(#paint1_linear)"
              />
              <defs>
                <linearGradient id="paint0_linear" x1="19" y1="0" x2="19" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00EEFF"/>
                  <stop offset="1" stopColor="#0051FF"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="34.328" y1="0" x2="34.328" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00EEFF"/>
                  <stop offset="1" stopColor="#0051FF"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-white text-xl sm:text-2xl font-medium">Studio Assistant</span>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-78px)]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="text-white/70 text-sm">
                  Ask anything about streams, clips, tags, templates, publishing, roles, or troubleshooting.
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-2 rounded-xl bg-[#252525] text-white text-sm hover:bg-[#333] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === "user";
              const isError = m.role === "error";
              const align = isUser ? "justify-end" : "justify-start";
              const bubble =
                m.role === "assistant"
                  ? "bg-[#1A1A1A] border border-[#373737]"
                  : isUser
                    ? "bg-[#00BBFF]/20 border border-[#00BBFF]/40"
                    : isError
                      ? "bg-red-500/10 border border-red-500/40"
                      : "bg-[#252525] border border-[#373737]";

              return (
                <div key={m.id} className={`w-full flex ${align}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-white text-sm leading-relaxed ${bubble}`}>
                    {m.role === "assistant" && m.content === "" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:150ms]" />
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:300ms]" />
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#373737] p-4 sm:p-6 space-y-2">
            {errorText && <div className="text-red-400 text-xs">{errorText}</div>}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask your question..."
                className="w-full h-[42px] bg-[#252525] border border-[#373737] rounded-xl px-4 text-white placeholder-white/70 text-sm focus:outline-none focus:border-[#00EEFF]"
                disabled={isSending}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isSending || !input.trim()}
                className="h-[42px] w-[42px] rounded-xl bg-[#00BBFF] disabled:bg-[#00BBFF]/40 flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </div>
            <div className="text-white/50 text-xs">Replies are generated by AI and may be imperfect.</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpDrawer;
