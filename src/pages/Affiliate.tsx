import { useState, useEffect } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { Shell } from "@/components/Shell";

const S: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "affShimmer 1.8s ease-in-out infinite",
  borderRadius: 6,
};

function SkeletonAffiliate() {
  return (
    <div style={{ padding: "0 16px 80px", maxWidth: 640, margin: "0 auto" }}>
      <style>{`@keyframes affShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      {/* Header */}
      <div style={{ paddingTop: 20, marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...S, width: "60%", height: 28 }} />
        <div style={{ ...S, width: "40%", height: 14 }} />
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ background: "#181a20", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ ...S, width: "60%", height: 11, marginBottom: 8 }} />
            <div style={{ ...S, width: "45%", height: 22 }} />
          </div>
        ))}
      </div>

      {/* Commission tiers */}
      <div style={{ background: "#181a20", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ ...S, width: "35%", height: 14, marginBottom: 16 }} />
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ ...S, width: 32, height: 32, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...S, width: "50%", height: 12, marginBottom: 6 }} />
              <div style={{ ...S, width: "30%", height: 10 }} />
            </div>
            <div style={{ ...S, width: 48, height: 24, borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Link box */}
      <div style={{ background: "#181a20", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ ...S, width: "40%", height: 14, marginBottom: 16 }} />
        <div style={{ ...S, width: "100%", height: 44, borderRadius: 10, marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...S, flex: 1, height: 40, borderRadius: 10 }} />
          <div style={{ ...S, flex: 1, height: 40, borderRadius: 10 }} />
        </div>
      </div>

      {/* Referrals list */}
      <div style={{ background: "#181a20", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ ...S, width: "40%", height: 14, marginBottom: 16 }} />
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...S, width: 36, height: 36, borderRadius: "50%" }} />
              <div>
                <div style={{ ...S, width: 100, height: 12, marginBottom: 6 }} />
                <div style={{ ...S, width: 70, height: 10 }} />
              </div>
            </div>
            <div style={{ ...S, width: 50, height: 20, borderRadius: 20 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Affiliate() {
  const { user } = useAuth();
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [timerDone, setTimerDone] = useState(false);
  const [dataArrived, setDataArrived] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const showSkeleton = !timerDone || !dataArrived;

  useEffect(() => {
    const t = setTimeout(() => setTimerDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) {
      setDataArrived(true);
      return;
    }

    async function loadAffiliateData() {
      const userRef = ref(db, `users/${user!.uid}`);
      const snap = await get(userRef);

      let code = "";
      if (snap.exists() && snap.val().affiliateCode) {
        code = snap.val().affiliateCode;
      } else {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await set(ref(db, `users/${user!.uid}/affiliateCode`), code);
      }

      setAffiliateCode(code);

      const refCountRef = ref(db, `referrals/${code}`);
      const unsub = onValue(refCountRef, (rSnap) => {
        if (rSnap.exists()) {
          const data = rSnap.val();
          const list = Object.entries(data).map(([uid, val]: [string, any]) => ({ uid, ...val }));
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setReferrals(list);
        } else {
          setReferrals([]);
        }
        setDataArrived(true);
      });

      return () => unsub();
    }

    loadAffiliateData();
  }, [user]);

  const referralLink = affiliateCode ? `${window.location.origin}/register?ref=${affiliateCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyCode = () => {
    if (!affiliateCode) return;
    navigator.clipboard.writeText(affiliateCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join AUTEX AI using my referral code *${affiliateCode}* and earn passive income from AI trading bots! ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const TIERS = [
    { level: 1, label: "Direct Referral", pct: "15%", color: "#fcd535", desc: "Every deposit they make" },
    { level: 2, label: "Level 2 Referral", pct: "5%", color: "#0ecb81", desc: "Their referrals' deposits" },
    { level: 3, label: "Level 3 Referral", pct: "1%", color: "#3b82f6", desc: "Deep network deposits" },
  ];

  return (
    <Shell>
      {showSkeleton ? (
        <SkeletonAffiliate />
      ) : (
        <div style={{ padding: "0 16px 80px", maxWidth: 640, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ paddingTop: 20, marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#eaecef" }}>
              Affiliate Program
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#848e9c" }}>
              Invite friends and earn commissions on every deposit they make.
            </p>
          </div>

          {/* Stats Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Total Referrals", value: referrals.length, color: "#fcd535" },
              { label: "Level 1 Earn", value: "15%", color: "#0ecb81" },
              { label: "Max Depth", value: "3 Lvls", color: "#3b82f6" },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: "#181a20",
                borderRadius: 12,
                padding: "14px 12px",
                border: "1px solid rgba(255,255,255,0.03)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#848e9c", marginBottom: 6, fontWeight: 500 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Commission Tiers */}
          <div style={{
            background: "#181a20",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef", marginBottom: 16 }}>Commission Structure</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TIERS.map(tier => (
                <div key={tier.level} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: `${tier.color}18`,
                    border: `1px solid ${tier.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: tier.color,
                    flexShrink: 0,
                  }}>
                    L{tier.level}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef" }}>{tier.label}</div>
                    <div style={{ fontSize: 11, color: "#848e9c", marginTop: 2 }}>{tier.desc}</div>
                  </div>
                  <div style={{
                    background: `${tier.color}18`,
                    color: tier.color,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: `1px solid ${tier.color}33`,
                  }}>
                    {tier.pct}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Referral Link */}
          <div style={{
            background: "#181a20",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef", marginBottom: 4 }}>Your Referral Link</div>
            <div style={{ fontSize: 12, color: "#848e9c", marginBottom: 14 }}>
              Share this link to invite your friends.
            </div>

            {/* Code pill */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(252,213,53,0.06)",
              border: "1px solid rgba(252,213,53,0.2)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 12,
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#848e9c", marginBottom: 2 }}>Referral Code</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fcd535", fontFamily: "monospace", letterSpacing: 2 }}>
                  {affiliateCode}
                </div>
              </div>
              <button
                onClick={copyCode}
                style={{
                  background: codeCopied ? "rgba(14,203,129,0.15)" : "rgba(252,213,53,0.12)",
                  color: codeCopied ? "#0ecb81" : "#fcd535",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {codeCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            {/* Full link box */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 12,
              fontSize: 12,
              color: "#848e9c",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}>
              {referralLink}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={copyLink}
                style={{
                  flex: 1,
                  background: copied ? "rgba(14,203,129,0.15)" : "#fcd535",
                  color: copied ? "#0ecb81" : "#0b0e11",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {copied ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy Link</>
                )}
              </button>
              <button
                onClick={shareWhatsApp}
                style={{
                  flex: 1,
                  background: "rgba(37,211,102,0.1)",
                  color: "#25D366",
                  border: "1px solid rgba(37,211,102,0.3)",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div style={{
            background: "#181a20",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef", marginBottom: 14 }}>How It Works</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { step: "1", title: "Share Your Link", desc: "Send your unique referral link or code to friends." },
                { step: "2", title: "They Register", desc: "Friends sign up using your link and start trading." },
                { step: "3", title: "Earn on Deposits", desc: "Get 15% commission every time they make a deposit." },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(252,213,53,0.12)",
                    border: "1px solid rgba(252,213,53,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fcd535",
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#848e9c", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Network List */}
          <div style={{
            background: "#181a20",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef" }}>Your Network</div>
              <div style={{
                background: "rgba(252,213,53,0.1)",
                color: "#fcd535",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
              }}>
                {referrals.length} Members
              </div>
            </div>

            {referrals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 24px" }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#474d57" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#eaecef", marginBottom: 6 }}>No referrals yet</div>
                <div style={{ fontSize: 12, color: "#848e9c" }}>Share your link above to start building your network and earning commissions.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {referrals.map((r, i) => {
                  const initials = (r.displayName || "??").slice(0, 2).toUpperCase();
                  const colors = ["#fcd535", "#0ecb81", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
                  const col = colors[i % colors.length];
                  return (
                    <div key={r.uid || i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: i < referrals.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: `${col}18`,
                        border: `1px solid ${col}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: col,
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#eaecef" }}>{r.displayName || "Unknown User"}</div>
                        <div style={{ fontSize: 11, color: "#848e9c", marginTop: 2 }}>
                          Joined {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                        </div>
                      </div>
                      <div style={{
                        background: "rgba(14,203,129,0.1)",
                        color: "#0ecb81",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 20,
                        letterSpacing: "0.05em",
                      }}>
                        ACTIVE
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </Shell>
  );
}
