import { Shell } from "@/components/Shell";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue, update, increment } from "firebase/database";
import { db } from "@/firebase";
import { Link } from "react-router-dom";

const BOTS_METADATA: Record<string, { image: string; color: string; riskLevel: string }> = {
  "bot_1": { image: "/bots/bot_1_1789525536814.jpg", color: "#0ecb81", riskLevel: "Low" },
  "bot_2": { image: "/bots/bot_2_1789525546998.jpg", color: "#3b82f6", riskLevel: "Low" },
  "bot_3": { image: "/bots/bot_3_1789525554735.jpg", color: "#8b5cf6", riskLevel: "Medium" },
  "bot_4": { image: "/bots/bot_4_1789525564406.jpg", color: "#fcd535", riskLevel: "Medium" },
  "bot_5": { image: "/bots/bot_5_1789525577472.jpg", color: "#f6465d", riskLevel: "Medium" },
  "bot_6": { image: "/bots/bot_6_1789525588486.jpg", color: "#06b6d4", riskLevel: "Medium" },
  "bot_7": { image: "/bots/bot_1_1789525536814.jpg", color: "#ec4899", riskLevel: "High" },
  "bot_8": { image: "/bots/bot_2_1789525546998.jpg", color: "#14b8a6", riskLevel: "High" },
  "bot_9": { image: "/bots/bot_3_1789525554735.jpg", color: "#f6465d", riskLevel: "High" },
  "bot_10": { image: "/bots/bot_4_1789525564406.jpg", color: "#6366f1", riskLevel: "High" },
  "bot_11": { image: "/bots/bot_5_1789525577472.jpg", color: "#0284c7", riskLevel: "High" },
  "bot_12": { image: "/bots/bot_6_1789525588486.jpg", color: "#fcd535", riskLevel: "High" },
};

interface UserBot {
  id: string;
  botId: string;
  botName: string;
  investedAmount: number;
  dailyProfitExpected: number;
  status: string;
  startedAt: number;
  lastCollectedAt?: number;
}

const S: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "mbShimmer 1.8s ease-in-out infinite",
  borderRadius: 6,
};

function SkeletonRow() {
  return (
    <div style={{ background: "#181a20", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...S, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ ...S, width: "40%", height: 14 }} />
        <div style={{ ...S, width: "14%", height: 18, borderRadius: 4 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...S, width: "70%", height: 11 }} />
            <div style={{ ...S, width: "55%", height: 14 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 12 }}>
        <div style={{ ...S, width: "28%", height: 10 }} />
        <div style={{ ...S, width: "25%", height: 28, borderRadius: 6 }} />
      </div>
    </div>
  );
}

function SkeletonSummary() {
  return (
    <div style={{ background: "#181a20", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...S, width: "42%", height: 12 }} />
      <div style={{ ...S, width: "52%", height: 28 }} />
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...S, width: 80, height: 11 }} />
          <div style={{ ...S, width: 60, height: 14 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...S, width: 60, height: 11 }} />
          <div style={{ ...S, width: 30, height: 14 }} />
        </div>
      </div>
    </div>
  );
}

export default function MyBots() {
  const { user } = useAuth();
  const [myBots, setMyBots] = useState<UserBot[]>([]);
  const [timerDone, setTimerDone] = useState(false);
  const [dataArrived, setDataArrived] = useState(false);
  const showSkeleton = !timerDone || !dataArrived;

  // Real-time tick for countdown
  const [now, setNow] = useState(Date.now());
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ amount: number, botName: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTimerDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      setDataArrived(true);
      return;
    }
    const botsRef = ref(db, `userBots/${user.uid}`);
    const unsub = onValue(botsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: UserBot[] = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => b.startedAt - a.startedAt);
        setMyBots(list);
      } else {
        setMyBots([]);
      }
      setDataArrived(true);
    });
    return () => unsub();
  }, [user]);

  const totalInvested = myBots.reduce((s, b) => s + b.investedAmount, 0);
  const totalEstDaily = myBots.reduce((s, b) => s + b.investedAmount * (b.dailyProfitExpected / 100), 0);

  const handleCollect = async (bot: UserBot, dailyReturn: number) => {
    if (!user) return;
    setCollectingId(bot.id);
    
    try {
      const updates: any = {};
      updates[`users/${user.uid}/balance`] = increment(dailyReturn);
      updates[`userBots/${user.uid}/${bot.id}/lastCollectedAt`] = Date.now();
      
      const { push } = await import("firebase/database");
      const newNotifKey = push(ref(db, `userNotifications/${user.uid}`)).key;
      updates[`userNotifications/${user.uid}/${newNotifKey}`] = {
        title: "Income Collected",
        message: `You collected $${dailyReturn.toFixed(2)} from ${bot.botName}.`,
        type: "success",
        date: Date.now(),
        read: false,
      };

      const newPaymentKey = push(ref(db, `users/${user.uid}/payments`)).key;
      updates[`users/${user.uid}/payments/${newPaymentKey}`] = {
        type: "bot_income",
        amount: dailyReturn,
        currency: "USD",
        status: "completed",
        createdAt: Date.now(),
        description: `Daily profit from ${bot.botName}`,
      };
      
      await update(ref(db), updates);
      
      setSuccessModal({ amount: dailyReturn, botName: bot.botName });
    } catch (e) {
      console.error("Failed to collect income:", e);
      alert("Failed to collect income. Please try again.");
    } finally {
      setCollectingId(null);
    }
  };

  const getCountdownString = (lastCollectedAt: number) => {
    const target = lastCollectedAt + 24 * 60 * 60 * 1000;
    const diff = target - now;
    if (diff <= 0) return "Ready";
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <Shell>
      <style>{`
        @keyframes mbShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes rotateBorder {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ padding: "0 16px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, paddingBottom: 16 }}>
          <Link to="/account" style={{ color: "#848e9c", textDecoration: "none", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#eaecef" }}>
            My Trading Bots
          </h1>
        </div>

        {showSkeleton ? (
          <>
            <SkeletonSummary />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </>
        ) : (
          <>
            {myBots.length > 0 && (
              <div style={{ background: "#181a20", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ color: "#848e9c", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>Total Asset Value (USDT)</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#eaecef", marginBottom: 16 }}>
                  {totalInvested.toFixed(2)}
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div style={{ color: "#848e9c", fontSize: 12, marginBottom: 2 }}>Est. Daily Profit</div>
                    <div style={{ color: "#0ecb81", fontSize: 14, fontWeight: 600 }}>+${totalEstDaily.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#848e9c", fontSize: 12, marginBottom: 2 }}>Active Bots</div>
                    <div style={{ color: "#eaecef", fontSize: 14, fontWeight: 600 }}>{myBots.length}</div>
                  </div>
                </div>
              </div>
            )}

            {myBots.length > 0 && (
              <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
                <div style={{ paddingBottom: 10, color: "#fcd535", fontSize: 14, fontWeight: 600, borderBottom: "2px solid #fcd535" }}>
                  Active Positions
                </div>
              </div>
            )}

            {myBots.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#474d57" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px", display: "block" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#eaecef", margin: "0 0 8px" }}>No Active Bots</h2>
                <p style={{ color: "#848e9c", fontSize: 13, margin: "0 0 24px" }}>
                  You don't have any running trading bots.
                </p>
                <Link to="/bots" style={{ display: "inline-block", background: "#fcd535", color: "#181a20", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                  Go to Marketplace
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myBots.map(bot => {
                  const meta = BOTS_METADATA[bot.botId] || { image: "/default_bot.jpg", color: "#0ecb81", riskLevel: "Medium" };
                  const dailyReturn = bot.investedAmount * (bot.dailyProfitExpected / 100);
                  
                  const isRunning = bot.status.toLowerCase() === "running" || bot.status.toLowerCase() === "active";
                  const canCollect = !bot.lastCollectedAt || (now - bot.lastCollectedAt) >= 24 * 60 * 60 * 1000;
                  const isCollecting = collectingId === bot.id;

                  return (
                    <div key={bot.id} style={{ background: "#181a20", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column" }}>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        {/* Animated Avatar Wrapper */}
                        <div style={{ 
                          position: "relative", 
                          width: 40, 
                          height: 40, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          borderRadius: 10,
                          overflow: "hidden"
                        }}>
                          {isRunning && (
                            <div style={{
                              position: "absolute",
                              width: "150%",
                              height: "150%",
                              background: `conic-gradient(from 0deg, transparent 0%, transparent 70%, ${meta.color} 100%)`,
                              animation: "rotateBorder 2s linear infinite",
                            }} />
                          )}
                          <div style={{
                            position: "absolute",
                            inset: 2,
                            background: "#181a20",
                            borderRadius: 8,
                            zIndex: 1
                          }} />
                          <img 
                            src={meta.image} 
                            alt={bot.botName} 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              borderRadius: 8, 
                              objectFit: "cover",
                              position: "relative",
                              zIndex: 2,
                              border: "2px solid #181a20"
                            }} 
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#eaecef" }}>{bot.botName}</div>
                          <span style={{ 
                            display: "inline-block",
                            background: isRunning ? "rgba(14,203,129,0.1)" : "rgba(255,255,255,0.05)", 
                            color: isRunning ? "#0ecb81" : "#848e9c", 
                            padding: "2px 6px", 
                            borderRadius: 4, 
                            fontSize: 10, 
                            fontWeight: 600,
                            marginTop: 4
                          }}>
                            {bot.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#848e9c", marginBottom: 4 }}>Principal (USDT)</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#eaecef" }}>{bot.investedAmount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: "#848e9c", marginBottom: 4 }}>Est. APR</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0ecb81" }}>{(bot.dailyProfitExpected * 365).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: "#848e9c", marginBottom: 4 }}>Daily Profit</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0ecb81" }}>+${dailyReturn.toFixed(2)}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 12 }}>
                        <div style={{ fontSize: 11, color: "#5e6673" }}>Started: {new Date(bot.startedAt).toLocaleDateString()}</div>
                        
                        <button 
                          onClick={() => handleCollect(bot, dailyReturn)}
                          disabled={!canCollect || isCollecting}
                          style={{ 
                            background: canCollect ? "#0ecb81" : "rgba(255,255,255,0.05)", 
                            color: canCollect ? "#0b0e11" : "#848e9c", 
                            border: "none", 
                            padding: "8px 16px", 
                            borderRadius: 8, 
                            fontSize: 13, 
                            fontWeight: 600, 
                            cursor: canCollect ? "pointer" : "not-allowed",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {isCollecting ? (
                             <div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0b0e11", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                          ) : canCollect ? (
                            "Collect Income"
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              {getCountdownString(bot.lastCollectedAt!)}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Success Modal */}
      {successModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            background: "#181a20",
            border: "1px solid rgba(14,203,129,0.2)",
            borderRadius: 24,
            width: "100%",
            maxWidth: 400,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}>
            <div style={{
              width: 64, height: 64,
              background: "rgba(14,203,129,0.1)",
              color: "#0ecb81",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#eaecef", margin: "0 0 12px" }}>Income Collected!</h2>
            <p style={{ color: "#848e9c", fontSize: 15, margin: "0 0 24px", lineHeight: 1.5 }}>
              You have successfully collected <strong style={{ color: "#0ecb81" }}>${successModal.amount.toFixed(2)}</strong> from your {successModal.botName}.
            </p>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#848e9c", marginBottom: 4 }}>Next collection available in</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#eaecef" }}>24h 0m 0s</div>
            </div>
            <button 
              onClick={() => setSuccessModal(null)}
              style={{
                width: "100%",
                background: "#0ecb81",
                color: "#0b0e11",
                border: "none",
                padding: "14px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Great
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
