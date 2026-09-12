import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/firebase";

export function PopUpAd() {
  const [adSettings, setAdSettings] = useState<{
    adEnabled: boolean;
    adImageUrl: string;
    adLinkUrl: string;
  } | null>(null);
  
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check once per session using sessionStorage
    const isDismissed = sessionStorage.getItem("adDismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const r = ref(db, "settings");
    const unsub = onValue(r, (snap) => {
      const val = snap.val();
      if (val) {
        setAdSettings({
          adEnabled: val.adEnabled === true,
          adImageUrl: val.adImageUrl || "https://via.placeholder.com/600x400?text=Premium+Ad",
          adLinkUrl: val.adLinkUrl || "#"
        });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading || dismissed || !adSettings || !adSettings.adEnabled) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("adDismissed", "true");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      background: "rgba(5, 8, 22, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div 
        className="breathe"
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 8,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          position: "relative",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: -16,
            right: -16,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--danger)",
            color: "#fff",
            border: "2px solid #fff",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)",
            zIndex: 10
          }}
        >
          &times;
        </button>
        <a href={adSettings.adLinkUrl} target="_blank" rel="noreferrer" onClick={handleDismiss} style={{ display: "block" }}>
          <img 
            src={adSettings.adImageUrl} 
            alt="Advertisement" 
            style={{ 
              width: "100%", 
              height: "auto", 
              borderRadius: 16, 
              display: "block",
              aspectRatio: "1/1",
              objectFit: "cover"
            }} 
          />
        </a>
      </div>
    </div>
  );
}
