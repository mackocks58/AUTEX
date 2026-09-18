import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/firebase";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
  market_cap_rank: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
}

interface GlobalData {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number; eth: number };
  active_cryptocurrencies: number;
  market_cap_change_percentage_24h_usd: number;
}

interface TrendingItem {
  item: {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    score: number;
    data?: { price_change_percentage_24h?: { usd: number }; price?: string };
  };
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function formatPrice(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return "$" + p.toFixed(4);
  if (p >= 0.01) return "$" + p.toFixed(5);
  return "$" + p.toFixed(8);
}

function formatLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return "$" + n.toLocaleString();
}

// ─────────────────────────────────────────────
// Sparkline SVG
// ─────────────────────────────────────────────
function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (!prices || prices.length < 2) {
    return <div style={{ width: 100, height: 40 }} />;
  }
  // Sample down to ≤ 60 points
  const step = Math.max(1, Math.floor(prices.length / 60));
  const sampled = prices.filter((_, i) => i % step === 0);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  const W = 100, H = 40, pad = 3;
  const pts = sampled
    .map((p, i) => `${(i / (sampled.length - 1)) * W},${H - pad - ((p - min) / range) * (H - pad * 2)}`)
    .join(" ");
  const fill = `0,${H} ${pts} ${W},${H}`;
  const color = positive ? "#10b981" : "#f43f5e";
  const fillOpacity = positive ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <polygon points={fill} fill={fillOpacity} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Hero Slider
// ─────────────────────────────────────────────
// Each slide has an image URL from CoinGecko (reliable CDN) + text
const SLIDES = [
  {
    badge: "Bitcoin · BTC",
    title: "Bitcoin — Digital Gold",
    sub: "The world's largest cryptocurrency by market cap. Store value like never before.",
    cta: { label: "Trade BTC →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    bg: "linear-gradient(135deg, rgba(247,147,26,0.28), rgba(180,100,10,0.08))",
    badge_color: "#fb923c",
    badge_bg: "rgba(247,147,26,0.15)",
    badge_border: "rgba(247,147,26,0.4)",
  },
  {
    badge: "Ethereum · ETH",
    title: "Ethereum — Smart Contracts",
    sub: "Power DeFi, NFTs and Web3 apps on the world's most programmable blockchain.",
    cta: { label: "Trade ETH →", href: "/bots" },
    ghost: { label: "Learn More", href: "/" },
    img: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    bg: "linear-gradient(135deg, rgba(98,126,234,0.28), rgba(60,80,180,0.08))",
    badge_color: "#818cf8",
    badge_bg: "rgba(98,126,234,0.15)",
    badge_border: "rgba(98,126,234,0.4)",
  },
  {
    badge: "BNB · Binance",
    title: "BNB — The Exchange Token",
    sub: "Fuel the Binance Smart Chain ecosystem, pay fees, and unlock exclusive benefits.",
    cta: { label: "Trade BNB →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    bg: "linear-gradient(135deg, rgba(243,186,47,0.28), rgba(180,130,10,0.08))",
    badge_color: "#fbbf24",
    badge_bg: "rgba(243,186,47,0.15)",
    badge_border: "rgba(243,186,47,0.4)",
  },
  {
    badge: "Solana · SOL",
    title: "Solana — Speed Meets Scale",
    sub: "Ultra-fast blockchain with 65,000 TPS. The future of decentralised applications.",
    cta: { label: "Trade SOL →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    bg: "linear-gradient(135deg, rgba(153,69,255,0.28), rgba(20,241,149,0.08))",
    badge_color: "#a78bfa",
    badge_bg: "rgba(153,69,255,0.15)",
    badge_border: "rgba(153,69,255,0.4)",
  },
  {
    badge: "XRP · Ripple",
    title: "XRP — Instant Payments",
    sub: "Enabling real-time global settlements for banks and financial institutions worldwide.",
    cta: { label: "Trade XRP →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    bg: "linear-gradient(135deg, rgba(0,153,204,0.28), rgba(0,80,140,0.08))",
    badge_color: "#38bdf8",
    badge_bg: "rgba(0,153,204,0.15)",
    badge_border: "rgba(0,153,204,0.4)",
  },
  {
    badge: "USDT · Tether",
    title: "USDT — Stable Trading",
    sub: "The most liquid stablecoin, always pegged 1:1 to the US Dollar. Trade with confidence.",
    cta: { label: "Trade USDT →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    bg: "linear-gradient(135deg, rgba(38,161,123,0.28), rgba(10,100,70,0.08))",
    badge_color: "#34d399",
    badge_bg: "rgba(38,161,123,0.15)",
    badge_border: "rgba(38,161,123,0.4)",
  },
  {
    badge: "ADA · Cardano",
    title: "Cardano — Proof of Stake",
    sub: "A research-driven, energy-efficient blockchain for secure decentralised applications.",
    cta: { label: "Trade ADA →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    bg: "linear-gradient(135deg, rgba(0,51,173,0.28), rgba(0,100,200,0.08))",
    badge_color: "#60a5fa",
    badge_bg: "rgba(0,51,173,0.15)",
    badge_border: "rgba(0,51,173,0.4)",
  },
  {
    badge: "DOGE · Dogecoin",
    title: "Dogecoin — People's Crypto",
    sub: "Started as a meme, became a movement. Fast, fun, and loved by millions globally.",
    cta: { label: "Trade DOGE →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    bg: "linear-gradient(135deg, rgba(196,163,65,0.28), rgba(140,110,20,0.08))",
    badge_color: "#fde68a",
    badge_bg: "rgba(196,163,65,0.15)",
    badge_border: "rgba(196,163,65,0.4)",
  },
  {
    badge: "AVAX · Avalanche",
    title: "Avalanche — Lightning Fast",
    sub: "Sub-second finality, low fees, and massive ecosystem. The fastest smart contracts chain.",
    cta: { label: "Trade AVAX →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
    bg: "linear-gradient(135deg, rgba(232,65,66,0.28), rgba(160,20,20,0.08))",
    badge_color: "#f87171",
    badge_bg: "rgba(232,65,66,0.15)",
    badge_border: "rgba(232,65,66,0.4)",
  },
  {
    badge: "MATIC · Polygon",
    title: "Polygon — Ethereum Layer 2",
    sub: "Scale Ethereum apps with low fees and fast confirmations. The go-to L2 solution.",
    cta: { label: "Trade MATIC →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
    bg: "linear-gradient(135deg, rgba(130,71,229,0.28), rgba(80,30,180,0.08))",
    badge_color: "#c084fc",
    badge_bg: "rgba(130,71,229,0.15)",
    badge_border: "rgba(130,71,229,0.4)",
  },
  {
    badge: "DOT · Polkadot",
    title: "Polkadot — Multi-Chain",
    sub: "Connect and secure unique blockchains. Enabling cross-chain communication at scale.",
    cta: { label: "Trade DOT →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
    bg: "linear-gradient(135deg, rgba(230,0,122,0.25), rgba(150,0,80,0.08))",
    badge_color: "#f472b6",
    badge_bg: "rgba(230,0,122,0.15)",
    badge_border: "rgba(230,0,122,0.4)",
  },
  {
    badge: "LINK · Chainlink",
    title: "Chainlink — Real World Data",
    sub: "Bring real-world data on-chain with the most trusted decentralised oracle network.",
    cta: { label: "Trade LINK →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    bg: "linear-gradient(135deg, rgba(55,91,210,0.28), rgba(20,50,160,0.08))",
    badge_color: "#93c5fd",
    badge_bg: "rgba(55,91,210,0.15)",
    badge_border: "rgba(55,91,210,0.4)",
  },
  {
    badge: "UNI · Uniswap",
    title: "Uniswap — Decentralised DEX",
    sub: "Swap any ERC-20 token instantly without middlemen. The DeFi exchange revolution.",
    cta: { label: "Trade UNI →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-logo.png",
    bg: "linear-gradient(135deg, rgba(255,0,122,0.25), rgba(180,0,80,0.08))",
    badge_color: "#fb7185",
    badge_bg: "rgba(255,0,122,0.15)",
    badge_border: "rgba(255,0,122,0.4)",
  },
  {
    badge: "LTC · Litecoin",
    title: "Litecoin — Silver to Bitcoin",
    sub: "Faster, lighter, and cheaper transactions. The veteran coin that's stood the test of time.",
    cta: { label: "Trade LTC →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
    bg: "linear-gradient(135deg, rgba(180,180,180,0.22), rgba(100,100,100,0.08))",
    badge_color: "#d1d5db",
    badge_bg: "rgba(180,180,180,0.15)",
    badge_border: "rgba(180,180,180,0.35)",
  },
  {
    badge: "SHIB · Shiba Inu",
    title: "Shiba Inu — Meme to Moon",
    sub: "The community-driven token that defied all odds. Part of the new meme coin revolution.",
    cta: { label: "Trade SHIB →", href: "/bots" },
    ghost: { label: "View Rates", href: "/" },
    img: "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
    bg: "linear-gradient(135deg, rgba(255,130,0,0.25), rgba(180,60,0,0.08))",
    badge_color: "#fdba74",
    badge_bg: "rgba(255,130,0,0.15)",
    badge_border: "rgba(255,130,0,0.4)",
  },
  {
    badge: "Affiliate Rewards",
    title: "Earn While You Trade",
    sub: "Invite friends and earn commissions on every successful referral — no limits!",
    cta: { label: "Join Now →", href: "/affiliate" },
    ghost: { label: "See Plans", href: "/payments" },
    img: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
    bg: "linear-gradient(135deg, rgba(139,92,246,0.28), rgba(109,40,217,0.08))",
    badge_color: "#c4b5fd",
    badge_bg: "rgba(139,92,246,0.15)",
    badge_border: "rgba(139,92,246,0.35)",
  },
];

function HeroBanner() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setActive(p => (p + 1) % SLIDES.length);
        setLeaving(false);
      }, 380);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[active];

  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 14,
      marginBottom: 14,
      background: "linear-gradient(180deg, rgba(11,18,36,0.98), rgba(5,8,22,0.95))",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Animated bg gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: s.bg,
        transition: "background 0.8s ease",
        opacity: leaving ? 0 : 1,
      }} />
      {/* Grid dot pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        padding: "16px 20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>
        {/* Left: text */}
        <div style={{
          flex: 1,
          opacity: leaving ? 0 : 1,
          transform: leaving ? "translateX(-16px)" : "none",
          transition: "opacity 0.38s ease, transform 0.38s ease",
        }}>
          <span style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 999,
            background: s.badge_bg,
            border: `1px solid ${s.badge_border}`,
            color: s.badge_color,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>{s.badge}</span>

          <h1 style={{
            margin: "0 0 6px",
            fontSize: "clamp(16px, 3vw, 24px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
          }}>{s.title}</h1>

          <p style={{
            margin: "0 0 14px",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            maxWidth: 380,
            lineHeight: 1.55,
          }}>{s.sub}</p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={s.cta.href} style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 16px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
              textDecoration: "none",
              transition: "transform 0.2s",
            }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"}
               onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "none"}>
              {s.cta.label}
            </a>
            <a href={s.ghost.href} style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
              fontSize: 12,
              textDecoration: "none",
            }}>{s.ghost.label}</a>
          </div>
        </div>


        {/* Right: COIN IMAGE — large, glowing, always visible */}
        <div style={{
          flexShrink: 0,
          position: "relative",
          opacity: leaving ? 0 : 1,
          transform: leaving ? "scale(0.65) rotate(-12deg)" : "scale(1) rotate(0deg)",
          transition: "all 0.44s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          {/* Animated glow ring */}
          <div style={{
            position: "absolute",
            inset: -10,
            borderRadius: "50%",
            border: `2px solid ${s.badge_border}`,
            boxShadow: `0 0 24px ${s.badge_bg}, 0 0 48px ${s.badge_bg}`,
            animation: "heroRing 2.8s ease-in-out infinite",
          }} />
          {/* Second pulse ring */}
          <div style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            border: `1px solid ${s.badge_border}`,
            opacity: 0.35,
            animation: "heroRing 2.8s ease-in-out infinite 0.6s",
          }} />
          {/* Coin image */}
          <img
            src={s.img}
            alt={s.badge}
            onError={e => {
              (e.currentTarget as HTMLImageElement).src =
                "https://assets.coingecko.com/coins/images/1/large/bitcoin.png";
            }}
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              objectFit: "contain",
              background: "rgba(255,255,255,0.07)",
              padding: 10,
              display: "block",
              boxShadow: `0 10px 40px rgba(0,0,0,0.55), 0 0 50px ${s.badge_bg}`,
            }}
          />
        </div>
      </div>

      {/* Slide dots */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 5,
        alignItems: "center",
      }}>
        {SLIDES.map((sl, i) => (
          <button
            key={i}
            id={`hero-dot-${i}`}
            onClick={() => { setLeaving(true); setTimeout(() => { setActive(i); setLeaving(false); }, 380); }}
            style={{
              width: i === active ? 18 : 5,
              height: 5,
              borderRadius: 999,
              border: "none",
              background: i === active ? sl.badge_color : "rgba(255,255,255,0.22)",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes heroRing {
          0%,100% { transform: scale(1);    opacity: 0.45; }
          50%      { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ticker Tape
// ─────────────────────────────────────────────
function TickerTape({ coins }: { coins: Coin[] }) {
  if (!coins.length) return null;
  const items = [...coins, ...coins, ...coins];
  return (
    <div style={{
      overflow: "hidden",
      background: "rgba(11,18,36,0.9)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 10,
      marginBottom: 20,
      padding: "9px 0",
    }}>
      <div className="ticker-inner">
        {items.map((c, i) => {
          const pos = c.price_change_percentage_24h >= 0;
          return (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, marginRight: 36, flexShrink: 0 }}>
              <img src={c.image} alt={c.symbol} style={{ width: 18, height: 18, borderRadius: "50%" }} />
              <span style={{ fontWeight: 700, fontSize: 12, color: "#e8eefc" }}>{c.symbol.toUpperCase()}</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatPrice(c.current_price)}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: pos ? "#10b981" : "#f43f5e" }}>
                {pos ? "▲" : "▼"}{Math.abs(c.price_change_percentage_24h).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────────
function StatsBar({ data }: { data: GlobalData | null }) {
  if (!data) return null;
  const chg = data.market_cap_change_percentage_24h_usd;
  const pos = chg >= 0;
  const stats = [
    { label: "Market Cap",     value: formatLarge(data.total_market_cap.usd),  sub: `${pos ? "+" : ""}${chg.toFixed(2)}%`, subColor: pos ? "#10b981" : "#f43f5e" },
    { label: "24h Volume",     value: formatLarge(data.total_volume.usd),       sub: "Trading volume",                        subColor: "#94a3b8" },
    { label: "BTC Dominance",  value: `${data.market_cap_percentage.btc.toFixed(1)}%`, sub: "Of total market cap",           subColor: "#94a3b8" },
    { label: "Active Coins",   value: data.active_cryptocurrencies.toLocaleString(), sub: "Listed assets",                  subColor: "#94a3b8" },
  ];
  return (
    <div className="stats-bar-grid" style={{ marginBottom: 14 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: "9px 12px",
          borderRadius: 10,
          background: "linear-gradient(180deg, rgba(17,27,51,0.92), rgba(11,18,36,0.6))",
          border: "1px solid rgba(255,255,255,0.055)",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 3, fontWeight: 600 }}>{s.label}</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#e8eefc", marginBottom: 2, letterSpacing: "-0.01em" }}>{s.value}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: s.subColor }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Coin Card
// ─────────────────────────────────────────────
function CoinCard({ coin, flash }: { coin: Coin; flash: boolean }) {
  const pos = coin.price_change_percentage_24h >= 0;
  const sparkPrices = coin.sparkline_in_7d?.price ?? [];

  return (
    <div
      className="coin-card"
      style={{
        background: "linear-gradient(180deg, rgba(17,27,51,0.97), rgba(11,18,36,0.75))",
        border: `1px solid ${flash ? (pos ? "rgba(16,185,129,0.55)" : "rgba(244,63,94,0.55)") : "rgba(255,255,255,0.055)"}`,
        borderRadius: 16,
        padding: 18,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.4s ease",
        animation: "cardEnter 0.4s cubic-bezier(0.2,0.8,0.2,1) both",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(16,185,129,0.12)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "none";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Subtle corner glow */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: pos ? "radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent 70%)" : "radial-gradient(circle at top right, rgba(244,63,94,0.08), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Rank */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        fontSize: 10, fontWeight: 700, color: "#94a3b8",
        background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 999,
      }}>#{coin.market_cap_rank}</div>

      {/* Coin identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <img src={coin.image} alt={coin.name} style={{
          width: 42, height: 42, borderRadius: "50%",
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eefc" }}>{coin.name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{coin.symbol}</div>
        </div>
      </div>

      {/* 7-day sparkline */}
      <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden" }}>
        <Sparkline prices={sparkPrices} positive={pos} />
      </div>

      {/* Price + 24h change */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{
          fontSize: 19,
          fontWeight: 900,
          letterSpacing: "-0.01em",
          color: flash ? (pos ? "#10b981" : "#f43f5e") : "#e8eefc",
          transition: "color 0.6s ease",
        }}>
          {formatPrice(coin.current_price)}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "4px 10px", borderRadius: 999,
          background: pos ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
          border: `1px solid ${pos ? "rgba(16,185,129,0.28)" : "rgba(244,63,94,0.28)"}`,
          color: pos ? "#10b981" : "#f43f5e",
          fontSize: 12, fontWeight: 800,
        }}>
          {pos ? "▲" : "▼"} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Mkt Cap</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e8eefc" }}>{formatLarge(coin.market_cap)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>24h Vol</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e8eefc" }}>{formatLarge(coin.total_volume)}</div>
        </div>
      </div>

      {/* Trade button */}
      <button
        id={`trade-${coin.id}`}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          background: "linear-gradient(135deg, #10b981, #059669)",
          border: "none",
          color: "#fff",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(16,185,129,0.28)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 22px rgba(16,185,129,0.45)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "none";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(16,185,129,0.28)";
        }}
      >
        Trade {coin.symbol.toUpperCase()}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Trending Sidebar
// ─────────────────────────────────────────────
function TrendingSidebar({ trending }: { trending: TrendingItem[] }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(17,27,51,0.97), rgba(11,18,36,0.75))",
      border: "1px solid rgba(255,255,255,0.055)",
      borderRadius: 16,
      padding: "18px 16px",
      position: "sticky",
      top: 80,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 20 }}>🔥</span>
        <span style={{ fontWeight: 900, fontSize: 15, color: "#e8eefc" }}>Trending</span>
        <span style={{
          marginLeft: "auto",
          fontSize: 10, fontWeight: 700, color: "#94a3b8",
          background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 999,
        }}>Top 7</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {trending.slice(0, 7).map((t, i) => {
          const change = t.item.data?.price_change_percentage_24h?.usd;
          const pos = change !== undefined ? change >= 0 : true;
          const priceStr = t.item.data?.price ?? "";
          return (
            <div
              key={t.item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 10px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.07)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.18)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.04)";
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", width: 16, textAlign: "center" }}>#{i + 1}</span>
              <img src={t.item.thumb} alt={t.item.name} style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e8eefc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.item.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.item.symbol}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {priceStr && <div style={{ fontSize: 11, fontWeight: 700, color: "#e8eefc", marginBottom: 1 }}>{priceStr.length > 10 ? priceStr.slice(0, 10) : priceStr}</div>}
                {change !== undefined && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: pos ? "#10b981" : "#f43f5e" }}>
                    {pos ? "+" : ""}{change.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 14, padding: "10px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "blink 1.5s infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>Live trending data from CoinGecko</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Skeleton loading cards
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16,
      padding: 18,
      background: "rgba(17,27,51,0.6)",
      border: "1px solid rgba(255,255,255,0.04)",
      overflow: "hidden",
    }}>
      {[42, 20, 40, 30, 18, 40].map((h, i) => (
        <div key={i} style={{
          height: h,
          borderRadius: 8,
          marginBottom: 12,
          background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s infinite",
          width: i === 1 ? "60%" : "100%",
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Mock Data Fallbacks (For API Rate Limits)
// ─────────────────────────────────────────────
const MOCK_COINS: Coin[] = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", current_price: 65432.10, price_change_percentage_24h: 2.45, market_cap: 1280000000000, total_volume: 35000000000, market_cap_rank: 1, high_24h: 66000, low_24h: 63000, circulating_supply: 19500000, sparkline_in_7d: { price: [63000, 64000, 63500, 65000, 64500, 65432] } },
  { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", current_price: 3456.78, price_change_percentage_24h: -1.2, market_cap: 410000000000, total_volume: 15000000000, market_cap_rank: 2, high_24h: 3550, low_24h: 3400, circulating_supply: 120000000, sparkline_in_7d: { price: [3500, 3550, 3450, 3400, 3480, 3456] } },
  { id: "tether", symbol: "usdt", name: "Tether", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", current_price: 1.00, price_change_percentage_24h: 0.01, market_cap: 90000000000, total_volume: 45000000000, market_cap_rank: 3, high_24h: 1.01, low_24h: 0.99, circulating_supply: 90000000000, sparkline_in_7d: { price: [1, 1, 1, 1, 1, 1] } },
  { id: "binancecoin", symbol: "bnb", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", current_price: 580.45, price_change_percentage_24h: 5.6, market_cap: 89000000000, total_volume: 2000000000, market_cap_rank: 4, high_24h: 590, low_24h: 550, circulating_supply: 150000000, sparkline_in_7d: { price: [540, 550, 570, 560, 580, 580.45] } },
  { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", current_price: 145.20, price_change_percentage_24h: 8.4, market_cap: 65000000000, total_volume: 5000000000, market_cap_rank: 5, high_24h: 150, low_24h: 135, circulating_supply: 450000000, sparkline_in_7d: { price: [130, 135, 132, 140, 142, 145.20] } },
  { id: "ripple", symbol: "xrp", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", current_price: 0.62, price_change_percentage_24h: -0.5, market_cap: 34000000000, total_volume: 1200000000, market_cap_rank: 6, high_24h: 0.65, low_24h: 0.60, circulating_supply: 55000000000, sparkline_in_7d: { price: [0.63, 0.64, 0.61, 0.62, 0.63, 0.62] } },
];

const MOCK_GLOBAL: GlobalData = {
  total_market_cap: { usd: 2450000000000 },
  total_volume: { usd: 85000000000 },
  market_cap_percentage: { btc: 52.4, eth: 16.8 },
  active_cryptocurrencies: 12450,
  market_cap_change_percentage_24h_usd: 1.85
};

const MOCK_TRENDING: TrendingItem[] = [
  { item: { id: "solana", name: "Solana", symbol: "SOL", thumb: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png", score: 0, data: { price: "$145.20", price_change_percentage_24h: { usd: 8.4 } } } },
  { item: { id: "pepe", name: "Pepe", symbol: "PEPE", thumb: "https://assets.coingecko.com/coins/images/29850/thumb/pepe-token.jpeg", score: 1, data: { price: "$0.00000845", price_change_percentage_24h: { usd: 15.2 } } } },
  { item: { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", thumb: "https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png", score: 2, data: { price: "$0.16", price_change_percentage_24h: { usd: -2.1 } } } },
];

// ─────────────────────────────────────────────
// Main Home Component
// ─────────────────────────────────────────────
type FilterType = "all" | "gainers" | "losers";

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");
  const [params] = useSearchParams();
  const query = (params.get("q") || "").toLowerCase().trim();
  const prevPrices = useRef<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Pagination / Lazy Loading state
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // User Balance
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (!user) return;
    const balanceRef = ref(db, `users/${user.uid}/balance`);
    const unsub = onValue(balanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setBalance(snapshot.val());
      } else {
        set(balanceRef, 0);
        setBalance(0);
      }
    });
    return () => unsub();
  }, [user]);

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [coinsRes, globalRes, trendingRes] = await Promise.all([
        fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h",
          { headers: { Accept: "application/json" } }
        ).catch(() => null),
        fetch("https://api.coingecko.com/api/v3/global").catch(() => null),
        fetch("https://api.coingecko.com/api/v3/search/trending").catch(() => null),
      ]);

      let coinsData: Coin[] = [];
      let globalJson: any = null;
      let trendingJson: any = null;

      if (coinsRes && coinsRes.ok) coinsData = await coinsRes.json();
      else coinsData = MOCK_COINS;

      if (globalRes && globalRes.ok) globalJson = await globalRes.json();
      else globalJson = { data: MOCK_GLOBAL };

      if (trendingRes && trendingRes.ok) trendingJson = await trendingRes.json();
      else trendingJson = { coins: MOCK_TRENDING };



      // Detect price changes for flash effect
      const newFlash = new Set<string>();
      coinsData.forEach(c => {
        if (prevPrices.current[c.id] !== undefined && prevPrices.current[c.id] !== c.current_price) {
          newFlash.add(c.id);
        }
        prevPrices.current[c.id] = c.current_price;
      });

      setCoins(coinsData);
      setGlobalData(globalJson.data as GlobalData);
      setTrending(trendingJson.coins ?? []);
      setLastUpdate(new Date());

      if (newFlash.size > 0) {
        setFlashIds(newFlash);
        setTimeout(() => setFlashIds(new Set()), 1200);
      }
    } catch (err) {
      console.error("CoinGecko API error handled:", err);
      // Fallback in case of absolute failure
      setCoins(MOCK_COINS);
      setGlobalData(MOCK_GLOBAL);
      setTrending(MOCK_TRENDING);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const displayed = coins.filter(c => {
    if (query) return c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query);
    if (filter === "gainers") return c.price_change_percentage_24h >= 0;
    if (filter === "losers")  return c.price_change_percentage_24h < 0;
    return true;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < displayed.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 6, displayed.length));
            setIsLoadingMore(false);
          }, 1200); // Simulate network delay
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
  }, [observerTarget, visibleCount, isLoadingMore, displayed.length]);

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all",     label: "🪙  All Coins" },
    { id: "gainers", label: "🟢  Gainers" },
    { id: "losers",  label: "🔴  Losers" },
  ];

  return (
    <Shell>
      {/* CSS overrides + animations */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .ticker-inner {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker 55s linear infinite;
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .stats-bar-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, 1fr);
        }
        .crypto-main-layout {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr 280px;
          align-items: start;
        }
        .coins-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }
        @media (max-width: 900px) {
          .crypto-main-layout {
            grid-template-columns: 1fr;
          }
          .stats-bar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 540px) {
          .stats-bar-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .coins-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Top Header with Balance */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 10 }}>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(22px, 4vw, 28px)",
          fontWeight: 900,
          background: "linear-gradient(to right, #60a5fa, #a78bfa, #f472b6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.02em",
        }}>
          Market Overview
        </h1>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link 
              to="/withdraw"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: 20,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(234, 88, 12, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(234, 88, 12, 0.25)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
              Withdraw
            </Link>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(16, 185, 129, 0.15)",
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid rgba(16, 185, 129, 0.3)",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)"
            }}>
            <div style={{ display: "flex", alignItems: "center", color: "#10b981", fontWeight: 800, fontSize: 14 }}>
              <span style={{ fontSize: 10, color: "#34d399", marginRight: 4, textTransform: "uppercase", letterSpacing: "0.02em" }}>Balance</span>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <HeroBanner />

      {/* Stats Bar */}
      {!loading && globalData && <StatsBar data={globalData} />}

      {/* Ticker */}
      {!loading && coins.length > 0 && <TickerTape coins={coins} />}

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            id={`filter-${f.id}`}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: filter === f.id
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "rgba(255,255,255,0.05)",
              color: filter === f.id ? "#fff" : "#94a3b8",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: filter === f.id ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
              transition: "all 0.22s ease",
            }}
          >{f.label}</button>
        ))}

        {/* Live indicator */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {lastUpdate && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 999,
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "blink 1.5s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399" }}>Live</span>
          </div>
        </div>
      </div>

      {/* Main layout: coin grid + sidebar */}
      <div className="crypto-main-layout">
        {/* Coin cards */}
        <div>
          {loading ? (
            <div className="coins-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              borderRadius: 18,
              background: "rgba(17,27,51,0.5)",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#e8eefc" }}>No coins found</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
                Try searching by name or symbol (e.g. "bitcoin", "btc")
              </p>
            </div>
          ) : (
            <>
              <div className="coins-grid">
                {displayed.slice(0, visibleCount).map((c, idx) => (
                  <div key={c.id} style={{ animationDelay: `${idx * 0.04}s` }}>
                    <CoinCard coin={c} flash={flashIds.has(c.id)} />
                  </div>
                ))}
                {isLoadingMore && Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={`skel-${i}`} />
                ))}
              </div>
              
              {/* Intersection Observer Sentinel */}
              {visibleCount < displayed.length && (
                <div ref={observerTarget} style={{ height: 40, width: "100%", marginTop: 20 }} />
              )}
            </>
          )}
        </div>

        {/* Trending sidebar */}
        {trending.length > 0 && !loading && (
          <div>
            <TrendingSidebar trending={trending} />
          </div>
        )}
      </div>

      {/* Footer attribution */}
      {!loading && (
        <div style={{ textAlign: "center", marginTop: 32, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            Market data powered by{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#34d399", fontWeight: 700 }}
            >CoinGecko</a>
            {" "}· Auto-refreshes every 30 seconds · © 2025 AUTEX AI
          </span>
        </div>
      )}
    </Shell>
  );
}
