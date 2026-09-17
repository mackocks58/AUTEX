import { useEffect, useState } from "react";
import { ref, get, set, update, push } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";
import { Gift, CheckCircle } from "lucide-react";

export function WelcomeBonusModal() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkBonus = async () => {
      const bonusRef = ref(db, `users/${user.uid}/hasClaimedWelcomeBonus`);
      const snap = await get(bonusRef);
      if (!snap.exists() || snap.val() !== true) {
        setTimeout(() => setShow(true), 800);
      }
    };
    checkBonus();
  }, [user]);

  const handleClaim = async () => {
    if (!user) return;
    setClaiming(true);
    try {
      const balanceRef = ref(db, `users/${user.uid}/balance`);
      const balanceSnap = await get(balanceRef);
      const currentBalance = balanceSnap.exists() ? balanceSnap.val() : 0;
      
      const newBalance = currentBalance + 5;
      
      const updates: any = {};
      updates[`users/${user.uid}/balance`] = newBalance;
      updates[`users/${user.uid}/hasClaimedWelcomeBonus`] = true;
      
      await update(ref(db), updates);

      // Record in payments history so it shows in Transactions page
      const paymentRef = push(ref(db, `users/${user.uid}/payments`));
      await set(paymentRef, {
        type: "welcome_bonus",
        amount: 5,
        currency: "USD",
        status: "completed",
        createdAt: Date.now(),
        description: "Welcome bonus for joining AUTEX",
      });
      
      setSuccess(true);
      
      // Confetti effect from bottom
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.9 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"],
      });

      // hide after a delay
      setTimeout(() => {
        setShow(false);
      }, 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div 
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 99998,
          opacity: show ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />

      <div
        style={{
          position: "fixed",
          bottom: show ? 0 : "-100%",
          left: 0,
          right: 0,
          background: "rgba(15,15,18,0.95)",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: "40px 24px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.7)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          zIndex: 99999,
          transition: "bottom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {!success ? (
          <>
            <div 
              className="pulse-animation"
              style={{
                background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
                padding: 24,
                borderRadius: "50%",
                marginBottom: 20,
              }}
            >
              <Gift size={64} color="#f59e0b" style={{ filter: "drop-shadow(0 0 12px rgba(245,158,11,0.6))" }} />
            </div>
            
            <h2 style={{ fontSize: 26, fontWeight: "800", margin: "0 0 12px 0", color: "#fff", letterSpacing: "-0.5px" }}>
              Welcome to the <span style={{ color: "#f59e0b", textShadow: "0 0 15px rgba(245,158,11,0.8)" }}>AUTEX</span> Company!
            </h2>
            <p style={{ color: "#a1a1aa", marginBottom: 32, fontSize: 15, maxWidth: 320, lineHeight: 1.5 }}>
              Congratulations on joining us! Claim your free <strong style={{ color: "#f59e0b" }}>$5 welcome bonus</strong> to start your journey.
            </p>

            <button
              onClick={handleClaim}
              disabled={claiming}
              className="claim-button"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                border: "none",
                padding: "16px 32px",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: "700",
                cursor: claiming ? "not-allowed" : "pointer",
                width: "100%",
                maxWidth: 320,
                boxShadow: "0 8px 25px rgba(245,158,11,0.3)",
                transition: "all 0.2s ease",
                opacity: claiming ? 0.7 : 1,
              }}
            >
              {claiming ? "Claiming..." : "Claim $5 Bonus"}
            </button>
          </>
        ) : (
          <>
             <div 
              className="breathing-success"
              style={{
                background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)",
                padding: 24,
                borderRadius: "50%",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={72} color="#10b981" style={{ filter: "drop-shadow(0 0 20px rgba(16,185,129,0.7))" }} />
            </div>
            
            <h2 style={{ fontSize: 28, fontWeight: "800", margin: "0 0 12px 0", color: "#10b981", letterSpacing: "-0.5px" }}>
              Bonus Claimed!
            </h2>
            <p style={{ color: "#a1a1aa", marginBottom: 16, fontSize: 16, maxWidth: 300, lineHeight: 1.5 }}>
              Your $5 welcome bonus has been credited to your balance. Enjoy!
            </p>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes pulse-gift {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.08); filter: brightness(1.2); }
            100% { transform: scale(1); filter: brightness(1); }
          }
          .pulse-animation svg {
            animation: pulse-gift 2.5s infinite ease-in-out;
          }

          @keyframes breathing-badge {
            0% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(16,185,129,0.4)); }
            50% { transform: scale(1.06); filter: drop-shadow(0 0 24px rgba(16,185,129,0.8)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(16,185,129,0.4)); }
          }
          .breathing-success svg {
            animation: breathing-badge 2.5s infinite ease-in-out;
          }
          
          .claim-button:hover:not(:disabled) {
             transform: translateY(-2px);
             box-shadow: 0 12px 30px rgba(245,158,11,0.4) !important;
          }
          .claim-button:active:not(:disabled) {
             transform: translateY(1px);
             box-shadow: 0 4px 15px rgba(245,158,11,0.3) !important;
          }
        `}
      </style>
    </>
  );
}
