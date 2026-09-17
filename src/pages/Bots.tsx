import { Shell } from "@/components/Shell";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ref, onValue, set, push, serverTimestamp } from "firebase/database";
import { db } from "@/firebase";

interface TradingBot {
  id: string;
  name: string;
  image: string;
  dailyProfit: number;
  minInvestment: number;
  maxInvestment: number;
  status: "Active" | "Limited" | "New";
  color: string;
  riskLevel: "Low" | "Medium" | "High";
}

const BOTS: TradingBot[] = [
  {
    id: "bot_1",
    name: "Alpha Scalper V1",
    image: "/bots/bot_1_1789525536814.jpg",
    dailyProfit: 8,
    minInvestment: 20,
    maxInvestment: 50,
    status: "Active",
    color: "#10b981",
    riskLevel: "Low",
  },
  {
    id: "bot_2",
    name: "Quantum Yield",
    image: "/bots/bot_2_1789525546998.jpg",
    dailyProfit: 9,
    minInvestment: 50,
    maxInvestment: 100,
    status: "New",
    color: "#3b82f6",
    riskLevel: "Low",
  },
  {
    id: "bot_3",
    name: "Neural Arbitrage",
    image: "/bots/bot_3_1789525554735.jpg",
    dailyProfit: 10,
    minInvestment: 100,
    maxInvestment: 200,
    status: "Active",
    color: "#8b5cf6",
    riskLevel: "Medium",
  },
  {
    id: "bot_4",
    name: "Grid Master AI",
    image: "/bots/bot_4_1789525564406.jpg",
    dailyProfit: 11,
    minInvestment: 200,
    maxInvestment: 350,
    status: "Active",
    color: "#f59e0b",
    riskLevel: "Medium",
  },
  {
    id: "bot_5",
    name: "Apex Predator",
    image: "/bots/bot_5_1789525577472.jpg",
    dailyProfit: 12,
    minInvestment: 350,
    maxInvestment: 500,
    status: "Limited",
    color: "#ef4444",
    riskLevel: "Medium",
  },
  {
    id: "bot_6",
    name: "Sigma Trader",
    image: "/bots/bot_6_1789525588486.jpg",
    dailyProfit: 13,
    minInvestment: 500,
    maxInvestment: 750,
    status: "Active",
    color: "#06b6d4",
    riskLevel: "Medium",
  },
  {
    id: "bot_7",
    name: "Nova Swing",
    image: "/bots/bot_1_1789525536814.jpg",
    dailyProfit: 14,
    minInvestment: 750,
    maxInvestment: 1000,
    status: "New",
    color: "#ec4899",
    riskLevel: "High",
  },
  {
    id: "bot_8",
    name: "Titan DeFi",
    image: "/bots/bot_2_1789525546998.jpg",
    dailyProfit: 15,
    minInvestment: 1000,
    maxInvestment: 1500,
    status: "Active",
    color: "#14b8a6",
    riskLevel: "High",
  },
  {
    id: "bot_9",
    name: "Flash Loaner",
    image: "/bots/bot_3_1789525554735.jpg",
    dailyProfit: 16,
    minInvestment: 1500,
    maxInvestment: 2500,
    status: "Limited",
    color: "#f43f5e",
    riskLevel: "High",
  },
  {
    id: "bot_10",
    name: "Pioneer Bot",
    image: "/bots/bot_4_1789525564406.jpg",
    dailyProfit: 17,
    minInvestment: 2500,
    maxInvestment: 4000,
    status: "Active",
    color: "#6366f1",
    riskLevel: "High",
  },
  {
    id: "bot_11",
    name: "Whale Tracker",
    image: "/bots/bot_5_1789525577472.jpg",
    dailyProfit: 18,
    minInvestment: 4000,
    maxInvestment: 6000,
    status: "Limited",
    color: "#0284c7",
    riskLevel: "High",
  },
  {
    id: "bot_12",
    name: "Sniper Alpha",
    image: "/bots/bot_6_1789525588486.jpg",
    dailyProfit: 20,
    minInvestment: 6000,
    maxInvestment: 10000,
    status: "Limited",
    color: "#eab308",
    riskLevel: "High",
  },
];

function BotCard({ bot, onStart, index }: { bot: TradingBot, onStart: (b: TradingBot) => void, index: number }) {
  return (
    <div

      style={{
        background: "linear-gradient(160deg, rgba(17,27,51,0.95), rgba(5,8,22,0.85))",
        border: `1px solid ${bot.color}50`,
        borderRadius: 14,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 15px ${bot.color}15`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: `floatCard 4s ease-in-out infinite`,
        animationDelay: `${index * 0.15}s`,
      }}
    >
      <style>
        {`
          @keyframes floatCard {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
      {/* Background Glow */}
      <div style={{
        position: "absolute",
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        background: bot.color,
        filter: "blur(40px)",
        opacity: 0.15,
        pointerEvents: "none",
        borderRadius: "50%",
      }} />

      {/* Header: Image + Title + Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src={bot.image}
          alt={bot.name}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${bot.color}40`,
            objectFit: "cover",
            boxShadow: `0 4px 12px ${bot.color}20`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {bot.name}
            </h3>
            {bot.status === "New" && (
              <span style={{ background: "#3b82f620", color: "#60a5fa", fontSize: 9, padding: "2px 6px", borderRadius: 999, fontWeight: 800, textTransform: "uppercase" }}>NEW</span>
            )}
            {bot.status === "Limited" && (
              <span style={{ background: "#ef444420", color: "#f87171", fontSize: 9, padding: "2px 6px", borderRadius: 999, fontWeight: 800, textTransform: "uppercase" }}>HOT</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
            Risk: <span style={{ color: bot.riskLevel === "Low" ? "#10b981" : bot.riskLevel === "Medium" ? "#f59e0b" : "#ef4444" }}>{bot.riskLevel}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Daily Profit</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>{bot.dailyProfit}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Investment</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#e8eefc" }}>${bot.minInvestment} - ${bot.maxInvestment}</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onStart(bot)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 8,
          border: "none",
          background: bot.color,
          color: "#000",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          marginTop: 2,
          boxShadow: `0 4px 12px ${bot.color}40`,
        }}
      >
        Start Trading Bot
      </button>
    </div>
  );
}

function SkeletonBotCard() {
  const shimmerStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "botShimmer 1.8s ease-in-out infinite",
    borderRadius: 6,
  };

  return (
    <div
      style={{
        background: "linear-gradient(160deg, rgba(17,27,51,0.95), rgba(5,8,22,0.85))",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 14,
        padding: "14px 16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <style>{`
        @keyframes botShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ ...shimmerStyle, width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...shimmerStyle, width: "70%", height: 15 }} />
          <div style={{ ...shimmerStyle, width: "40%", height: 11 }} />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...shimmerStyle, width: "60%", height: 10 }} />
          <div style={{ ...shimmerStyle, width: "45%", height: 16 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...shimmerStyle, width: "60%", height: 10 }} />
          <div style={{ ...shimmerStyle, width: "80%", height: 13 }} />
        </div>
      </div>

      {/* Button */}
      <div style={{ ...shimmerStyle, width: "100%", height: 38, borderRadius: 8, marginTop: 2 }} />
    </div>
  );
}

export default function Bots() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    // Simulate initial loading to show beautiful skeleton shimmer
    const timer = setTimeout(() => setIsInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Pagination / Lazy Loading state
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < BOTS.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 4, BOTS.length));
            setIsLoadingMore(false);
          }, 1200); // Simulate network delay for Instagram-like smooth loading
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, visibleCount, isLoadingMore]);

  // Fetch or initialize user balance
  useEffect(() => {
    if (!user) return;
    const balanceRef = ref(db, `users/${user.uid}/balance`);
    const unsubscribe = onValue(balanceRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.val());
      } else {
        set(balanceRef, 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleStartBot = (bot: TradingBot) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedBot(bot);
    setAmount("");
    setErrorMsg("");
    setPurchaseSuccess(false);
    setIsClosing(false);
  };

  const handleCloseModal = () => {
    if (isProcessing) return;
    setIsClosing(true);
    setTimeout(() => {
      setSelectedBot(null);
      setIsClosing(false);
      setPurchaseSuccess(false);
    }, 350);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !selectedBot) return;
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < selectedBot.minInvestment) {
      setErrorMsg(`Minimum investment is $${selectedBot.minInvestment}`);
      return;
    }
    if (numAmount > selectedBot.maxInvestment) {
      setErrorMsg(`Maximum investment is $${selectedBot.maxInvestment}`);
      return;
    }
    if (numAmount > balance) {
      setErrorMsg(`Insufficient balance. You have $${balance.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      // 1. Deduct balance
      const newBalance = balance - numAmount;
      await set(ref(db, `users/${user.uid}/balance`), newBalance);

      // 2. Save bot details to Firebase
      const botSubsRef = ref(db, `userBots/${user.uid}`);
      await push(botSubsRef, {
        botId: selectedBot.id,
        botName: selectedBot.name,
        investedAmount: numAmount,
        dailyProfitExpected: selectedBot.dailyProfit,
        status: "Running",
        startedAt: serverTimestamp(),
      });

      // Show success state
      setPurchaseSuccess(true);
    } catch (err) {
      setErrorMsg("Failed to process transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Shell>
      <div style={{ padding: "16px 20px 80px", maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header with Balance if logged in */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, marginTop: 8 }}>
          <h1 style={{
            margin: 0,
            fontSize: "clamp(24px, 5vw, 32px)",
            fontWeight: 900,
            background: "linear-gradient(to right, #60a5fa, #a78bfa, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>
            AI Trading Bots
          </h1>
          {user && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(16, 185, 129, 0.15)",
              padding: "8px 16px",
              borderRadius: 20,
              border: "1px solid rgba(16, 185, 129, 0.3)",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
            }}>
              <div style={{ color: "#10b981", fontWeight: 800, fontSize: 16 }}>
                ${showBalance ? balance.toFixed(2) : "***"}
              </div>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                style={{
                  background: "transparent", border: "none", padding: 0,
                  color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center",
                  opacity: 0.8
                }}
              >
                {showBalance ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
        
        <p style={{ margin: "0 0 24px 0", color: "var(--muted)", fontSize: 14, maxWidth: 400 }}>
          Automate your crypto trades with our advanced AI algorithms. Select a bot that matches your investment style.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {isInitialLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonBotCard key={`initial-skel-${idx}`} />
            ))
          ) : (
            <>
              {BOTS.slice(0, visibleCount).map((bot, idx) => (
                <BotCard key={bot.id} bot={bot} index={idx} onStart={handleStartBot} />
              ))}
              {isLoadingMore && Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonBotCard key={`skeleton-${idx}`} />
              ))}
            </>
          )}
        </div>
        
        {/* Intersection Observer Sentinel */}
        {!isInitialLoading && visibleCount < BOTS.length && (
          <div ref={observerTarget} style={{ height: 40, width: "100%", marginTop: 20 }} />
        )}

      </div>

      {/* Bottom Sheet Modal */}
      {selectedBot && (
        <>
          <div
            onClick={handleCloseModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5, 8, 22, 0.8)",
              backdropFilter: "blur(8px)",
              zIndex: 999,
              animation: isClosing ? "fadeOut 0.35s ease forwards" : "fadeIn 0.2s ease",
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: "linear-gradient(180deg, #111b33 0%, #050816 100%)",
              borderTop: `1px solid ${selectedBot.color}30`,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: "16px 24px 24px",
              boxShadow: `0 -10px 40px ${selectedBot.color}15`,
              transform: "translateY(100%)",
              animation: isClosing ? "slideDownSmooth 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "slideUpSmooth 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              maxWidth: 600,
              margin: "0 auto",
              minHeight: "55vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <style>
              {`
                @keyframes slideUpSmooth {
                  from { transform: translateY(100%); }
                  to { transform: translateY(0); }
                }
                @keyframes slideDownSmooth {
                  from { transform: translateY(0); }
                  to { transform: translateY(100%); }
                }
                @keyframes fadeOut {
                  from { opacity: 1; }
                  to { opacity: 0; }
                }
                @keyframes scaleCheckmark {
                  0% { transform: scale(0); opacity: 0; }
                  50% { transform: scale(1.2); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes glowPulse {
                  0% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
                  50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
                  100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
                }
              `}
            </style>
            
            {/* Drag Handle */}
            <div style={{ width: 48, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.2)", margin: "0 auto 24px" }} />
            
            {purchaseSuccess ? (
              <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid #10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  animation: "scaleCheckmark 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, glowPulse 2s infinite ease-in-out",
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 900, color: "#10b981" }}>Investment Successful!</h2>
                
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "20px", marginBottom: "auto", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>Invested Amount</span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>Daily ROI</span>
                    <span style={{ color: selectedBot.color, fontWeight: 700 }}>{selectedBot.dailyProfit}%</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>Daily Return Received</span>
                    <span style={{ color: "#10b981", fontWeight: 900, fontSize: 20 }}>
                      +${(parseFloat(amount) * (selectedBot.dailyProfit / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 12,
                    border: "none",

                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  <img
                    src={selectedBot.image}
                    alt={selectedBot.name}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                      border: `2px solid ${selectedBot.color}80`,
                      boxShadow: `0 4px 16px ${selectedBot.color}30`,
                    }}
                  />
                  <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>{selectedBot.name}</h2>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      Limits: <span style={{ color: "#fff", fontWeight: 700 }}>${selectedBot.minInvestment}</span> to <span style={{ color: "#fff", fontWeight: 700 }}>${selectedBot.maxInvestment}</span>
                    </div>
                    <div style={{ color: "#10b981", fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                      Expected ROI: {selectedBot.dailyProfit}% Daily
                    </div>
                  </div>
                </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "var(--muted)", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                Enter Investment Amount (Available: ${balance.toFixed(2)})
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 18, fontWeight: 800 }}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMsg("");
                  }}
                  disabled={isProcessing}
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 32px",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${errorMsg ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: 800,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {errorMsg && (
                <div style={{ color: "#ef4444", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
              <button
                onClick={handleCloseModal}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 12,
                  border: "none",
                  background: isProcessing ? "rgba(255,255,255,0.1)" : selectedBot.color,
                  color: isProcessing ? "var(--muted)" : "#000",
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </button>
            </div>
            </>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
