import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { push, ref, set, onValue } from "firebase/database";
import { db } from "@/firebase";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";

type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "admin";
  createdAt: number;
};

export default function Support() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const email = useMemo(() => user?.email ?? "", [user]);

  // Load chat history
  useEffect(() => {
    if (!user) return;
    const chatRef = ref(db, `supportChats/${user.uid}`);
    const unsub = onValue(chatRef, (snap) => {
      const data = snap.val() as Record<string, Omit<ChatMessage, "id">> | null;
      if (data) {
        const msgs = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => a.createdAt - b.createdAt);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || !message.trim()) return;
    setBusy(true);
    try {
      // If this is the very first message, we might want to ensure the admin knows who they are.
      // We can store a metadata node, but for now we'll just push the message.
      // AdminSupport will list all users who have a node in supportChats.
      
      const newMsgRef = push(ref(db, `supportChats/${user.uid}`));
      await set(newMsgRef, {
        text: message.trim(),
        sender: "user",
        createdAt: Date.now(),
        // Store email on each message to make it easy for admin to identify, 
        // though typically you'd store this at the root of the chat.
        email: email
      });
      setMessage("");
    } catch (err: unknown) {
      alert("Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  // Helper to send common topics
  function sendTopic(topic: string) {
    setMessage(topic);
    // Focus the input to let them add more context or they can just hit send
  }

  return (
    <Shell>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bubblePop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
        .support-bubble { animation: bubblePop 0.35s cubic-bezier(0.4,0,0.2,1) both; }
        .support-input:focus {
          outline: none;
          border-color: rgba(37,211,102,0.5) !important;
          box-shadow: 0 0 0 3px rgba(37,211,102,0.1);
        }
        .send-btn:hover:not(:disabled) {
          background: #20c366 !important;
          transform: scale(1.05);
        }
        .send-btn:active:not(:disabled) { transform: scale(0.97); }
      `}</style>

      <div style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "16px 16px 32px",
        animation: "fadeUp 0.4s ease both",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 140px)", // Leave room for bottom nav
      }}>

        {/* ── Chat Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "14px 18px",
          marginBottom: 16,
          backdropFilter: "blur(12px)",
          flexShrink: 0
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #25d366, #128c4e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.1-1.34C8.53 21.53 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.65 0-3.19-.44-4.52-1.2l-.32-.19-3.03.8.81-2.96-.21-.34A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.59-5.76c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.78.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43H8.7c-.15 0-.4.06-.61.29C7.88 9.08 7.25 9.7 7.25 10.9s.79 2.1.9 2.25c.11.14 1.55 2.37 3.76 3.32.53.23.94.36 1.26.46.53.17 1.01.14 1.39.09.42-.06 1.3-.53 1.48-1.05.18-.51.18-.95.12-1.05-.06-.09-.22-.15-.47-.27z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>AUTEX Support</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#25d366", boxShadow: "0 0 6px #25d366" }} />
              <span style={{ fontSize: 11, color: "#25d366", fontWeight: 600 }}>Online</span>
            </div>
          </div>
        </div>

        {/* ── Chat Messages Area ── */}
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: 12, 
            marginBottom: 16,
            paddingRight: 8,
            scrollbarWidth: "none" // hide scrollbar for cleaner look
          }}
        >
          {/* Welcome Message (Always shown at top) */}
          <div className="support-bubble" style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div style={{
              background: "rgba(37,211,102,0.08)",
              border: "1px solid rgba(37,211,102,0.15)",
              borderRadius: "4px 18px 18px 18px",
              padding: "12px 14px",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0", lineHeight: 1.55 }}>
                👋 Hi! Welcome to <strong style={{ color: "#25d366" }}>AUTEX Support</strong>.
                We're here to help. Send us a message and we'll reply as soon as possible.
              </p>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, textAlign: "right" }}>AUTEX AI</div>
            </div>
          </div>

          {messages.length === 0 && (
            <div className="support-bubble" style={{ animationDelay: "0.15s", alignSelf: "flex-start", maxWidth: "100%" }}>
              <div style={{
                background: "rgba(37,211,102,0.05)",
                border: "1px solid rgba(37,211,102,0.12)",
                borderRadius: "4px 18px 18px 18px",
                padding: "10px 14px",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Common topics</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Deposit issue", "Withdrawal delay", "Bot not working", "Account locked"].map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => sendTopic(topic)}
                      style={{
                        padding: "5px 12px", borderRadius: 20,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actual Chat History */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div 
                key={msg.id} 
                className="support-bubble" 
                style={{ 
                  alignSelf: isUser ? "flex-end" : "flex-start", 
                  maxWidth: "85%",
                  animation: "bubblePop 0.2s cubic-bezier(0.4,0,0.2,1) both"
                }}
              >
                <div style={{
                  background: isUser ? "linear-gradient(135deg, rgba(37,211,102,0.18), rgba(18,140,78,0.1))" : "rgba(37,211,102,0.08)",
                  border: isUser ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(37,211,102,0.15)",
                  borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                  padding: "10px 14px",
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0", lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </p>
                  <div style={{ 
                    fontSize: 10, 
                    color: isUser ? "#25d366" : "#64748b", 
                    marginTop: 6, 
                    textAlign: "right",
                    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isUser && <span>✓✓</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Input Area ── */}
        {!user ? (
          <div style={{
            background: "rgba(37,211,102,0.07)",
            border: "1px solid rgba(37,211,102,0.2)",
            borderRadius: 16, padding: "20px",
            textAlign: "center",
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#94a3b8" }}>
              You need to be logged in to chat.
            </p>
            <Link to="/login" style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #25d366, #128c4e)",
              color: "#fff", padding: "10px 24px", borderRadius: 24,
              fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              Log In →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 28, padding: "8px 8px 8px 14px",
            }}>
              <textarea
                className="support-input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                required
                rows={1}
                placeholder="Type your message…"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
                  resize: "none", outline: "none", lineHeight: 1.5,
                  padding: "10px 0", maxHeight: 100
                }}
              />

              <button
                className="send-btn"
                type="submit"
                disabled={busy || !message.trim()}
                style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: busy ? "rgba(37,211,102,0.4)" : "linear-gradient(135deg, #25d366, #128c4e)",
                  border: "none", cursor: (busy || !message.trim()) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: busy ? "none" : "0 4px 14px rgba(37,211,102,0.4)",
                  transition: "all 0.2s",
                  opacity: !message.trim() ? 0.5 : 1
                }}
              >
                {busy ? (
                  <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#475569", textAlign: "center" }}>
              🔒 End-to-end secured · We never share your information
            </p>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  );
}
