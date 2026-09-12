import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { db } from "@/firebase";

type AccessMode = "free" | "paid";

interface AppSettings {
  betslipsAccessMode: AccessMode;
  betslipsFreeBadgeText: string;
  betslipsPaidBadgeText: string;
  badgeColor: "blue" | "green";
  maintenanceMode: boolean;
  maintenanceMessage: string;
  siteName: string;
  siteTagline: string;
  adEnabled: boolean;
  adImageUrl: string;
  adLinkUrl: string;
}

const DEFAULTS: AppSettings = {
  adEnabled: false,
  adImageUrl: "https://via.placeholder.com/600x400?text=Premium+Ad",
  adLinkUrl: "https://example.com",
  betslipsAccessMode: "paid",
  betslipsFreeBadgeText: "FREE",
  betslipsPaidBadgeText: "BUY TO UNLOCK",
  badgeColor: "blue",
  maintenanceMode: false,
  maintenanceMessage: "We are currently performing maintenance. Please check back soon.",
  siteName: "Mfalme wa Mikeka",
  siteTagline: "Premium Betslip Codes",
};

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div
        id={id}
        onClick={() => onChange(!checked)}
        style={{
          width: 52,
          height: 28,
          borderRadius: 14,
          background: checked ? "var(--accent)" : "rgba(148,163,184,0.25)",
          border: `1px solid ${checked ? "var(--accent)" : "rgba(148,163,184,0.3)"}`,
          position: "relative",
          transition: "background 0.25s, border-color 0.25s",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: checked ? "0 0 12px rgba(16,185,129,0.35)" : "none",
        }}
      >
        <div style={{
          position: "absolute",
          top: 3,
          left: checked ? 26 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.25s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }} />
      </div>
    </label>
  );
}

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "16px 0",
      borderBottom: "1px solid var(--stroke)",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 200 }}>
        <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{description}</div>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const r = ref(db, "settings");
    return onValue(r, (snap) => {
      const val = snap.val();
      setSettings({ ...DEFAULTS, ...(val ?? {}) });
      setLoading(false);
    });
  }, []);

  async function save<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSaving(key);
    try {
      await set(ref(db, `settings/${key}`), value);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (e) {
      console.error("Failed to save setting", e);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>

      {/* Betslips Access Banner */}
      <div style={{
        padding: "18px 20px",
        borderRadius: 16,
        background: settings.betslipsAccessMode === "free"
          ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(4,120,87,0.06))"
          : "linear-gradient(135deg, rgba(250,204,21,0.1), rgba(161,98,7,0.06))",
        border: `1px solid ${settings.betslipsAccessMode === "free" ? "rgba(16,185,129,0.35)" : "rgba(250,204,21,0.3)"}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 32 }}>{settings.betslipsAccessMode === "free" ? "🆓" : "💰"}</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: settings.betslipsAccessMode === "free" ? "var(--accent)" : "#fde047" }}>
            Betslips are currently {settings.betslipsAccessMode === "free" ? "FREE for all users" : "paid (users must buy to unlock)"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
            Change this below to switch between free and paid access globally.
          </div>
        </div>
        <div style={{
          padding: "6px 14px",
          borderRadius: 20,
          fontWeight: 800,
          fontSize: 12,
          background: settings.betslipsAccessMode === "free" ? "rgba(16,185,129,0.15)" : "rgba(250,204,21,0.12)",
          color: settings.betslipsAccessMode === "free" ? "var(--accent)" : "#fde047",
          border: `1px solid ${settings.betslipsAccessMode === "free" ? "rgba(16,185,129,0.4)" : "rgba(250,204,21,0.35)"}`,
        }}>
          {settings.betslipsAccessMode.toUpperCase()}
        </div>
      </div>

      {/* Betslips Section */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
            🎟️ Betslips Access Control
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
            Control whether users can view betslip codes for free or must pay.
          </p>

          <SettingRow
            icon="🔓"
            title="Free Access Mode"
            description="When ON, all users can see betslip codes without paying. When OFF, users must buy each betslip to unlock the code."
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                {settings.betslipsAccessMode === "free" ? "FREE" : "PAID"}
              </span>
              <ToggleSwitch
                id="toggle-free"
                checked={settings.betslipsAccessMode === "free"}
                onChange={(v) => void save("betslipsAccessMode", v ? "free" : "paid")}
              />
              {saving === "betslipsAccessMode" && (
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              )}
              {savedKey === "betslipsAccessMode" && (
                <span style={{ fontSize: 16 }}>✅</span>
              )}
            </div>
          </SettingRow>

          <SettingRow
            icon="🏷️"
            title="Free Badge Text"
            description="The label shown on free betslips on the home page."
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                value={settings.betslipsFreeBadgeText}
                onChange={e => setSettings(s => ({ ...s, betslipsFreeBadgeText: e.target.value }))}
                style={{ width: 120, padding: "6px 10px", fontSize: 13 }}
              />
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => void save("betslipsFreeBadgeText", settings.betslipsFreeBadgeText)}
                disabled={saving === "betslipsFreeBadgeText"}
              >
                {savedKey === "betslipsFreeBadgeText" ? "✅" : "Save"}
              </button>
            </div>
          </SettingRow>

          <SettingRow
            icon="💳"
            title="Paid Badge Text"
            description="The label shown on locked betslips that require payment."
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                value={settings.betslipsPaidBadgeText}
                onChange={e => setSettings(s => ({ ...s, betslipsPaidBadgeText: e.target.value }))}
                style={{ width: 140, padding: "6px 10px", fontSize: 13 }}
              />
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => void save("betslipsPaidBadgeText", settings.betslipsPaidBadgeText)}
                disabled={saving === "betslipsPaidBadgeText"}
              >
                {savedKey === "betslipsPaidBadgeText" ? "✅" : "Save"}
              </button>
            </div>
          </SettingRow>
          <SettingRow
            icon="🎨"
            title="Winning Badge Color"
            description="Choose the color of the 'WON' badge (Meta Blue or Emerald Green)."
          >
            <div style={{ display: "flex", gap: 10 }}>
              {(["blue", "green"] as const).map(color => (
                <button
                  key={color}
                  className="btn"
                  onClick={() => void save("badgeColor", color)}
                  disabled={saving === "badgeColor"}
                  style={{
                    background: settings.badgeColor === color 
                      ? (color === "blue" ? "rgba(8, 102, 255, 0.2)" : "rgba(16, 185, 129, 0.2)")
                      : "transparent",
                    border: `1px solid ${
                      settings.badgeColor === color 
                        ? (color === "blue" ? "#0866FF" : "#10b981")
                        : "var(--stroke)"
                    }`,
                    color: color === "blue" ? "#0866FF" : "#10b981",
                    padding: "6px 14px",
                    textTransform: "capitalize",
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Pop-up Ad Settings */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
            ?? Pop-up Ad Settings
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
            Configure the ad that pops up when a user visits the app.
          </p>

          <SettingRow
            icon="??"
            title="Enable Pop-up Ad"
            description="If ON, users will see the ad pop-up. If OFF, the ad is hidden."
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                {settings.adEnabled ? "ON" : "OFF"}
              </span>
              <ToggleSwitch
                id="toggle-ad"
                checked={settings.adEnabled}
                onChange={(v) => void save("adEnabled", v)}
              />
              {saving === "adEnabled" && (
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              )}
              {savedKey === "adEnabled" && <span style={{ fontSize: 16 }}>?</span>}
            </div>
          </SettingRow>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Ad Image URL (Banner)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={settings.adImageUrl}
                onChange={e => setSettings(s => ({ ...s, adImageUrl: e.target.value }))}
                style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                placeholder="https://..."
              />
              <button
                className="btn btn-ghost"
                onClick={() => void save("adImageUrl", settings.adImageUrl)}
                disabled={saving === "adImageUrl"}
              >
                {savedKey === "adImageUrl" ? "?" : "Save"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Ad Link URL (Where it clicks to)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={settings.adLinkUrl}
                onChange={e => setSettings(s => ({ ...s, adLinkUrl: e.target.value }))}
                style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                placeholder="https://..."
              />
              <button
                className="btn btn-ghost"
                onClick={() => void save("adLinkUrl", settings.adLinkUrl)}
                disabled={saving === "adLinkUrl"}
              >
                {savedKey === "adLinkUrl" ? "?" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Site Settings */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
            🌐 Site Settings
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
            Customize the site name and tagline shown to users.
          </p>

          <SettingRow icon="📛" title="Site Name" description="The name displayed in the header and browser tab.">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                value={settings.siteName}
                onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
                style={{ width: 180, padding: "6px 10px", fontSize: 13 }}
              />
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => void save("siteName", settings.siteName)}
                disabled={saving === "siteName"}
              >
                {savedKey === "siteName" ? "✅" : "Save"}
              </button>
            </div>
          </SettingRow>

          <SettingRow icon="✏️" title="Site Tagline" description="A short description shown below the site name.">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                value={settings.siteTagline}
                onChange={e => setSettings(s => ({ ...s, siteTagline: e.target.value }))}
                style={{ width: 200, padding: "6px 10px", fontSize: 13 }}
              />
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => void save("siteTagline", settings.siteTagline)}
                disabled={saving === "siteTagline"}
              >
                {savedKey === "siteTagline" ? "✅" : "Save"}
              </button>
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="card" style={{ border: settings.maintenanceMode ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--stroke)" }}>
        <div className="card-body">
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: settings.maintenanceMode ? "#f87171" : "var(--accent)" }}>
            🔧 Maintenance Mode
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
            When enabled, a maintenance banner is shown to all users.
          </p>

          <SettingRow
            icon="⚠️"
            title="Enable Maintenance Banner"
            description="Shows a site-wide notice that the platform is under maintenance."
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: settings.maintenanceMode ? "#f87171" : "var(--muted)", fontWeight: 600 }}>
                {settings.maintenanceMode ? "ON" : "OFF"}
              </span>
              <ToggleSwitch
                id="toggle-maintenance"
                checked={settings.maintenanceMode}
                onChange={(v) => void save("maintenanceMode", v)}
              />
              {savedKey === "maintenanceMode" && <span style={{ fontSize: 16 }}>✅</span>}
            </div>
          </SettingRow>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Maintenance Message
            </label>
            <textarea
              className="textarea"
              value={settings.maintenanceMessage}
              rows={3}
              onChange={e => setSettings(s => ({ ...s, maintenanceMessage: e.target.value }))}
              style={{ fontSize: 13 }}
            />
            <button
              className="btn btn-ghost"
              style={{ marginTop: 8, padding: "6px 16px", fontSize: 13 }}
              onClick={() => void save("maintenanceMessage", settings.maintenanceMessage)}
              disabled={saving === "maintenanceMessage"}
            >
              {savedKey === "maintenanceMessage" ? "✅ Saved" : "Save Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


