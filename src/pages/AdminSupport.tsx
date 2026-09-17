import { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { db } from "@/firebase";

type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "admin";
  createdAt: number;
  email?: string;
  edited?: boolean;
};

type UserChat = {
  uid: string;
  email: string;
  messages: ChatMessage[];
  lastMessageAt: number;
};

export function AdminSupport() {
  const [chats, setChats] = useState<UserChat[]>([]);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  
  const [replyText, setReplyText] = useState("");
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch all chats
  useEffect(() => {
    const r = ref(db, "supportChats");
    return onValue(r, (snap) => {
      const data = snap.val() as Record<string, Record<string, Omit<ChatMessage, "id">>> | null;
      if (!data) {
        setChats([]);
        return;
      }

      const parsedChats: UserChat[] = [];
      
      for (const [uid, userMsgsObj] of Object.entries(data)) {
        const msgs = Object.entries(userMsgsObj)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => a.createdAt - b.createdAt);
        
        if (msgs.length === 0) continue;

        // Try to find email from any message (usually the first sent by user)
        let email = "Unknown User";
        for (const m of msgs) {
          if (m.email) {
            email = m.email;
            break;
          }
        }

        parsedChats.push({
          uid,
          email,
          messages: msgs,
          lastMessageAt: msgs[msgs.length - 1].createdAt
        });
      }

      // Sort chats by latest message first
      parsedChats.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      setChats(parsedChats);
    });
  }, []);

  const activeChat = chats.find(c => c.uid === activeUid);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeUid || !replyText.trim()) return;
    
    setBusy(true);
    try {
      if (editingMsgId) {
        // Edit existing message
        await update(ref(db, `supportChats/${activeUid}/${editingMsgId}`), {
          text: replyText.trim(),
          edited: true
        });
        setEditingMsgId(null);
      } else {
        // Send new message
        const newMsgRef = push(ref(db, `supportChats/${activeUid}`));
        await set(newMsgRef, {
          text: replyText.trim(),
          sender: "admin",
          createdAt: Date.now()
        });
      }
      setReplyText("");
    } catch (err) {
      alert("Failed to send or edit reply");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage(msgId: string) {
    if (!activeUid) return;
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await remove(ref(db, `supportChats/${activeUid}/${msgId}`));
    } catch (err) {
      alert("Failed to delete message");
    }
  }

  function startEditing(msg: ChatMessage) {
    setEditingMsgId(msg.id);
    setReplyText(msg.text);
  }

  function cancelEditing() {
    setEditingMsgId(null);
    setReplyText("");
  }

  return (
    <div className="card" style={{ padding: 0, height: "calc(100vh - 200px)", minHeight: 500 }}>
      <div style={{ display: "flex", height: "100%", background: "var(--bg)", borderRadius: 12, overflow: "hidden" }}>
        
        {/* ── Left Sidebar (List of users) ── */}
        {/* Hide on mobile if a chat is active */}
        {(!isMobile || !activeUid) && (
          <div style={{ 
            width: isMobile ? "100%" : 280, 
            borderRight: "1px solid var(--stroke)", 
            display: "flex", 
            flexDirection: "column",
            background: "rgba(255,255,255,0.02)",
            flexShrink: 0
          }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Support Chats</h2>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              {chats.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                  No active support chats.
                </div>
              ) : (
                chats.map(chat => {
                  const isActive = activeUid === chat.uid;
                  const lastMsg = chat.messages[chat.messages.length - 1];
                  return (
                    <button
                      key={chat.uid}
                      onClick={() => setActiveUid(chat.uid)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "16px 14px",
                        border: "none",
                        borderBottom: "1px solid var(--stroke)",
                        background: isActive ? "rgba(37,211,102,0.1)" : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "block"
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chat.email}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ 
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px",
                          color: lastMsg.sender === "user" ? "#facc15" : "var(--muted)" 
                        }}>
                          {lastMsg.sender === "admin" ? "You: " : ""}{lastMsg.text}
                        </span>
                        <span>{new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── Right Main Area (Active Chat) ── */}
        {/* Hide on mobile if NO chat is active */}
        {(!isMobile || activeUid) && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0b0e11" }}>
            {activeChat ? (
              <>
                {/* Header */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--stroke)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 12 }}>
                  {isMobile && (
                    <button 
                      onClick={() => setActiveUid(null)}
                      style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "8px 0" }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                    </button>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                    {activeChat.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{activeChat.email}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>UID: {activeChat.uid}</div>
                  </div>
                </div>

                {/* Messages List */}
                <div 
                  ref={scrollRef}
                  style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {activeChat.messages.map(msg => {
                    const isAdmin = msg.sender === "admin";
                    return (
                      <div 
                        key={msg.id}
                        style={{ 
                          alignSelf: isAdmin ? "flex-end" : "flex-start", 
                          maxWidth: "85%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAdmin ? "flex-end" : "flex-start"
                        }}
                      >
                        <div style={{
                          background: isAdmin ? "linear-gradient(135deg, rgba(37,211,102,0.18), rgba(18,140,78,0.1))" : "rgba(255,255,255,0.08)",
                          border: isAdmin ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                          padding: "10px 14px",
                        }}>
                          <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0", lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                            {msg.text}
                          </p>
                          <div style={{ 
                            fontSize: 10, 
                            color: isAdmin ? "#25d366" : "#94a3b8", 
                            marginTop: 6, 
                            textAlign: "right",
                            display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center"
                          }}>
                            {msg.edited && <span style={{ opacity: 0.7 }}>(edited)</span>}
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        
                        {/* Admin Action Buttons */}
                        {isAdmin && (
                          <div style={{ display: "flex", gap: 8, marginTop: 4, paddingRight: 4 }}>
                            <button 
                              onClick={() => startEditing(msg)}
                              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0 }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteMessage(msg.id)}
                              style={{ background: "none", border: "none", color: "var(--danger)", fontSize: 11, cursor: "pointer", padding: 0 }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {/* Option to delete user messages too, just in case */}
                        {!isAdmin && (
                          <div style={{ display: "flex", gap: 8, marginTop: 4, paddingLeft: 4 }}>
                             <button 
                              onClick={() => deleteMessage(msg.id)}
                              style={{ background: "none", border: "none", color: "var(--danger)", fontSize: 11, cursor: "pointer", padding: 0, opacity: 0.7 }}
                            >
                              Delete User Msg
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Reply Input Box */}
                <div style={{ padding: 16, borderTop: "1px solid var(--stroke)", background: "rgba(255,255,255,0.02)" }}>
                  {editingMsgId && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "4px 8px", background: "rgba(37,211,102,0.1)", borderRadius: 4, fontSize: 12, color: "var(--accent)" }}>
                      <span>Editing message...</span>
                      <button onClick={cancelEditing} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                  )}
                  <form onSubmit={sendReply} style={{ display: "flex", gap: 10 }}>
                    <input 
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={editingMsgId ? "Edit your message..." : "Type a reply to the user..."}
                      style={{ 
                        flex: 1, padding: "12px 16px", borderRadius: 24, 
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", 
                        color: "#fff", outline: "none", fontSize: 14
                      }}
                    />
                    <button 
                      type="submit"
                      disabled={busy || !replyText.trim()}
                      style={{
                        padding: "0 24px", borderRadius: 24,
                        background: editingMsgId ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "linear-gradient(135deg, #25d366, #128c4e)",
                        color: "#fff", fontWeight: 700, border: "none",
                        cursor: (busy || !replyText.trim()) ? "not-allowed" : "pointer",
                        opacity: (!replyText.trim() || busy) ? 0.6 : 1
                      }}
                    >
                      {editingMsgId ? "Save" : "Reply"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", flexDirection: "column", gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Select a chat from the left sidebar to start replying.
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
