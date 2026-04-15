import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const EXAMPLES = [
  "Rohit likes Dairy Milk 🍫",
  "Meeting with Ankit tomorrow at 3pm",
  "Priya's birthday is April 20th 🎂",
  "Remind me to follow up with Raj",
];

interface BrainInputProps {
  onInputProcessed: () => void;
  themeColor: string;
  isDark: boolean;
}

export function BrainInput({ onInputProcessed, themeColor, isDark }: BrainInputProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your Second Brain. Tell me anything — people in your life, upcoming events, tasks, or just random things you want to remember. I'll keep it all organized for you!",
      timestamp: new Date(),
    }
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");

    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: userMessage, conversation_id: conversationId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }]);
      if (data.conversation_id) setConversationId(data.conversation_id);
      onInputProcessed();
    } catch (e: any) {
      toast.error("Failed to process", { description: e.message });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Oops! Something went wrong. Please try again 🙏",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}05)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e80",
            animation: "pulse 2s infinite",
          }} />
          <span style={{
            fontWeight: 800,
            fontSize: 16,
            color: "var(--theme-text)",
            letterSpacing: "-0.3px",
          }}>
            Chat with your Brain
          </span>
        </div>
        <p style={{ margin: "4px 0 0 20px", fontSize: 12, color: "var(--theme-muted)" }}>
          Always listening, never forgetting
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              animation: "fadeSlideIn 0.3s ease",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width: 28, height: 28, borderRadius: 10,
                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}99)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 6, fontSize: 14,
              }}>
                🧠
              </div>
            )}
            <div style={{
              maxWidth: "82%",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              background: msg.role === "user"
                ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`
                : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
              color: msg.role === "user" ? "white" : "var(--theme-text)",
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: msg.role === "user"
                ? `0 4px 15px ${themeColor}40`
                : "0 2px 8px rgba(0,0,0,0.06)",
              border: msg.role === "assistant"
                ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`
                : "none",
            }}>
              {msg.content}
            </div>
            <span style={{
              fontSize: 10,
              color: "var(--theme-muted)",
              marginTop: 4,
              paddingLeft: msg.role === "assistant" ? 4 : 0,
              paddingRight: msg.role === "user" ? 4 : 0,
            }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 10,
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}99)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>
              🧠
            </div>
            <div style={{
              padding: "12px 18px",
              borderRadius: "4px 18px 18px 18px",
              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: themeColor,
                  animation: `bounce 1.2s ease ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Example prompts — show only at start */}
        {messages.length <= 1 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, color: "var(--theme-muted)", marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>
              TRY SAYING...
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => { setInput(ex); inputRef.current?.focus(); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: `1px solid ${themeColor}40`,
                    background: `${themeColor}10`,
                    color: themeColor,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 24px 20px",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Tell me something..."
            disabled={loading}
            style={{
              flex: 1,
              height: 48,
              padding: "0 18px",
              borderRadius: 16,
              border: `1.5px solid ${input ? themeColor + "80" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              background: isDark ? "rgba(255,255,255,0.05)" : "white",
              color: "var(--theme-text)",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            style={{
              width: 48, height: 48,
              borderRadius: 16,
              border: "none",
              background: !input.trim() || loading
                ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                : `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
              color: !input.trim() || loading ? "var(--theme-muted)" : "white",
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: input.trim() && !loading ? `0 4px 15px ${themeColor}50` : "none",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
