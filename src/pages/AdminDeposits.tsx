import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { db } from "@/firebase";

export interface CryptoNetworkSetting {
  enabled: boolean;
  address: string;
}

export interface MobileNetworkSetting {
  enabled: boolean;
  accountNo: string;
  accountName: string;
}

export interface DepositSettings {
  crypto: {
    TRC20: CryptoNetworkSetting;
    BEP20: CryptoNetworkSetting;
    ERC20: CryptoNetworkSetting;
  };
  mobile: {
    Ecocash: MobileNetworkSetting;
    OneMoney: MobileNetworkSetting;
    Telecash: MobileNetworkSetting;
  };
}

export const DEFAULT_DEPOSIT_SETTINGS: DepositSettings = {
  crypto: {
    TRC20: { enabled: true, address: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
    BEP20: { enabled: true, address: "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
    ERC20: { enabled: true, address: "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
  },
  mobile: {
    Ecocash: { enabled: true, accountNo: "123456", accountName: "AUTEX TRADING" },
    OneMoney: { enabled: true, accountNo: "654321", accountName: "AUTEX LTD" },
    Telecash: { enabled: true, accountNo: "112233", accountName: "AUTEX CORP" },
  },
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

export function AdminDeposits() {
  const [settings, setSettings] = useState<DepositSettings>(DEFAULT_DEPOSIT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const r = ref(db, "settings/deposits");
    return onValue(r, (snap) => {
      const val = snap.val();
      
      const merged: DepositSettings = {
        crypto: {
          ...DEFAULT_DEPOSIT_SETTINGS.crypto,
          ...(val?.crypto || {})
        },
        mobile: {
          ...DEFAULT_DEPOSIT_SETTINGS.mobile,
          ...(val?.mobile || {})
        }
      };
      
      setSettings(merged);
      setLoading(false);
    });
  }, []);

  async function saveSettings(newSettings: DepositSettings, keyIndicator: string) {
    setSaving(keyIndicator);
    try {
      await set(ref(db, "settings/deposits"), newSettings);
    } catch (e) {
      console.error("Failed to save deposit settings", e);
    } finally {
      setSaving(null);
    }
  }

  const updateCrypto = (network: keyof DepositSettings["crypto"], field: keyof CryptoNetworkSetting, value: any) => {
    const next = { ...settings };
    next.crypto[network] = { ...next.crypto[network], [field]: value };
    setSettings(next);
  };

  const updateMobile = (network: keyof DepositSettings["mobile"], field: keyof MobileNetworkSetting, value: any) => {
    const next = { ...settings };
    next.mobile[network] = { ...next.mobile[network], [field]: value };
    setSettings(next);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      
      {/* Crypto Settings */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>🪙</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Crypto Networks</h2>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>Configure deposit addresses and enable/disable crypto networks.</p>
            </div>
          </div>

          {(["TRC20", "BEP20", "ERC20"] as Array<keyof DepositSettings["crypto"]>).map((net) => (
            <div key={net} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>{net}</h3>
                <ToggleSwitch 
                  id={`crypto-${net}`}
                  checked={settings.crypto[net].enabled}
                  onChange={(v) => {
                    const next = { ...settings };
                    next.crypto[net].enabled = v;
                    saveSettings(next, `crypto-${net}`);
                  }}
                />
              </div>
              <div className="field">
                <label>Deposit Address</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.crypto[net].address}
                    onChange={(e) => updateCrypto(net, "address", e.target.value)}
                    placeholder={`e.g. 0x...`}
                  />
                  <button 
                    className="btn btn-primary" 
                    style={{ flexShrink: 0 }}
                    onClick={() => saveSettings(settings, `save-crypto-${net}`)}
                  >
                    {saving === `save-crypto-${net}` ? "..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Money Settings */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>📱</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Mobile Money</h2>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>Configure Zimbabwean mobile money details.</p>
            </div>
          </div>

          {(["Ecocash", "OneMoney", "Telecash"] as Array<keyof DepositSettings["mobile"]>).map((net) => (
            <div key={net} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)" }}>{net}</h3>
                <ToggleSwitch 
                  id={`mobile-${net}`}
                  checked={settings.mobile[net].enabled}
                  onChange={(v) => {
                    const next = { ...settings };
                    next.mobile[net].enabled = v;
                    saveSettings(next, `mobile-${net}`);
                  }}
                />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Account No</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.mobile[net].accountNo}
                  onChange={(e) => updateMobile(net, "accountNo", e.target.value)}
                  placeholder={`e.g. 123456`}
                />
              </div>
              <div className="field">
                <label>Account Name</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.mobile[net].accountName}
                    onChange={(e) => updateMobile(net, "accountName", e.target.value)}
                    placeholder={`e.g. AUTEX LTD`}
                  />
                  <button 
                    className="btn btn-primary" 
                    style={{ flexShrink: 0 }}
                    onClick={() => saveSettings(settings, `save-mobile-${net}`)}
                  >
                    {saving === `save-mobile-${net}` ? "..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
