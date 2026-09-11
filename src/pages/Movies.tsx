import { useEffect, useState, useMemo } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/firebase";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import type { MovieGroup } from "@/types";

const DEFAULT_GROUPS: MovieGroup[] = [
  { id: 'm1', name: 'Lethal Strike', thumbnail: 'https://images.unsplash.com/photo-1506501139174-099022460929?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'A retired special forces operative must return to the field.', createdAt: 1713744000000 },
  { id: 'm2', name: 'Code Red: Extraction', thumbnail: 'https://images.unsplash.com/photo-1535016120720-40c646bebbbb?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'A daring rescue mission deep behind enemy lines.', createdAt: 1713744000000 },
  { id: 'm3', name: 'The Last Cartel', thumbnail: 'https://images.unsplash.com/photo-1587843825866-23136209e51c?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Taking down the biggest drug syndicate in South America.', createdAt: 1713744000000 },
  { id: 'm4', name: 'Sniper\'s Nest', thumbnail: 'https://images.unsplash.com/photo-1558712613-2d2c12d4a234?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'One man, one rifle, and a city under siege.', createdAt: 1713744000000 },
  { id: 'm5', name: 'Urban Warfare', thumbnail: 'https://images.unsplash.com/photo-1614030424754-24d0e37ce739?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Street-level combat between rival gangs and SWAT.', createdAt: 1713744000000 },
  { id: 'm6', name: 'Midnight Chase', thumbnail: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'High-speed pursuits across the neon-lit city streets.', createdAt: 1713744000000 },
  { id: 'm7', name: 'Rogue Agent', thumbnail: 'https://images.unsplash.com/photo-1517436073-3b1b1b4eb640?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'A spy goes off the grid to uncover a global conspiracy.', createdAt: 1713744000000 },
  { id: 'm8', name: 'Blood & Chrome', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Undercover cops racing stolen supercars.', createdAt: 1713744000000 },
  { id: 'm9', name: 'The Syndicate', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Infiltrating the mafia from the inside out.', createdAt: 1713744000000 },
  { id: 'm10', name: 'Blackout Protocol', thumbnail: 'https://images.unsplash.com/photo-1603598516001-c8a7c2f0f421?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'When the city loses power, the purge begins.', createdAt: 1713744000000 },
  { id: 'm11', name: 'Hostage Zero', thumbnail: 'https://images.unsplash.com/photo-1605333069150-13f5fb474d20?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Negotiations fail. It\'s time for aggressive action.', createdAt: 1713744000000 },
  { id: 'm12', name: 'Mercenary Instinct', thumbnail: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Hired guns fight for survival in a hostile warzone.', createdAt: 1713744000000 },
  { id: 'm13', name: 'Fugitive\'s Run', thumbnail: 'https://images.unsplash.com/photo-1519520443-41bbd5982121?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Framed for murder, he has 24 hours to clear his name.', createdAt: 1713744000000 },
  { id: 'm14', name: 'Shadow Operative', thumbnail: 'https://images.unsplash.com/photo-1618239062369-da3570de6b83?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Assassinations and stealth in the modern era.', createdAt: 1713744000000 },
  { id: 'm15', name: 'Undercover Takedown', thumbnail: 'https://images.unsplash.com/photo-1506501139174-099022460929?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Deep cover operations go horribly wrong.', createdAt: 1713744000000 },
  { id: 'm16', name: 'Cartel Wars', thumbnail: 'https://images.unsplash.com/photo-1587843825866-23136209e51c?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Borderline justice in a lawless land.', createdAt: 1713744000000 },
  { id: 'm17', name: 'Bulletproof', thumbnail: 'https://images.unsplash.com/photo-1605333069150-13f5fb474d20?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'A heist crew attempts the impossible bank robbery.', createdAt: 1713744000000 },
  { id: 'm18', name: 'Iron Fist', thumbnail: 'https://images.unsplash.com/photo-1558712613-2d2c12d4a234?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Underground martial arts tournament to the death.', createdAt: 1713744000000 },
  { id: 'm19', name: 'Ghost Protocol', thumbnail: 'https://images.unsplash.com/photo-1535016120720-40c646bebbbb?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'Erased from existence, they fight for the truth.', createdAt: 1713744000000 },
  { id: 'm20', name: 'Final Stand', thumbnail: 'https://images.unsplash.com/photo-1614030424754-24d0e37ce739?auto=format&fit=crop&q=80&w=400&h=600', amount: 1500, currency: 'TZS', description: 'The last line of defense against an invading army.', createdAt: 1713744000000 }
];

export default function Movies() {
  const { user } = useAuth();
  const [firebaseGroups, setFirebaseGroups] = useState<Record<string, MovieGroup> | null>(null);
  const [userPurchases, setUserPurchases] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const groupsRef = ref(db, "movieGroups");
    const unsubGroups = onValue(groupsRef, (snap) => {
      setFirebaseGroups(snap.val());
      setLoading(false);
    });

    return () => unsubGroups();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserPurchases(null);
      return;
    }
    const purchaseRef = ref(db, `purchases/${user.uid}/movieGroups`);
    const unsubPurchases = onValue(purchaseRef, (snap) => {
      setUserPurchases(snap.val());
    });

    return () => unsubPurchases();
  }, [user]);

  const groups = useMemo(() => {
    if (firebaseGroups && Object.keys(firebaseGroups).length > 0) {
      return Object.entries(firebaseGroups).map(([id, v]) => ({ ...v, id }));
    }
    return DEFAULT_GROUPS;
  }, [firebaseGroups]);

  const isPurchased = (groupId: string) => {
    return userPurchases && userPurchases[groupId]?.status === "completed";
  };

  if (loading) {
    return (
      <Shell>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 className="page-title" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span className="breathe" style={{ display: "inline-block", color: "var(--accent)" }}>🎭</span> Premium Movie Groups
        </h1>
        <p className="muted" style={{ margin: "8px 0 16px 0" }}>Unlock exclusive movie connections and the latest blockbusters.</p>
      </div>

      <div className="grid cols-2 cols-2-mobile" style={{ gap: 16 }}>
        {groups.map((group) => {
          const unlocked = isPurchased(group.id!);
          return (
            <Link 
              key={group.id} 
              to={`/movies/${group.id}`}
              className="card movie-group-card" 
              style={{ 
                background: "linear-gradient(135deg, rgba(11, 18, 36, 0.9), rgba(5, 8, 22, 0.95))", 
                border: "1px solid var(--stroke)", 
                transition: "transform 0.3s ease, box-shadow 0.3s ease", 
                cursor: "pointer",
                overflow: "hidden",
                textDecoration: "none",
                display: "block"
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = "translateY(-6px)"; 
                e.currentTarget.style.boxShadow = unlocked ? "0 12px 30px rgba(16, 185, 129, 0.2)" : "0 12px 30px rgba(250, 204, 21, 0.15)"; 
                e.currentTarget.style.borderColor = unlocked ? "var(--accent)" : "#facc15"; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = "none"; 
                e.currentTarget.style.boxShadow = "var(--shadow)"; 
                e.currentTarget.style.borderColor = "var(--stroke)"; 
              }}
            >
              <div style={{ position: "relative", width: "100%", paddingTop: "130%" }}>
                <img 
                  src={group.thumbnail}
                  alt={group.name}
                  style={{ 
                    position: "absolute", 
                    top: 0, 
                    left: 0, 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    filter: unlocked ? "none" : "blur(4px) brightness(0.6)"
                  }} 
                />
                {!unlocked && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.4)"
                  }}>
                    <span className="breathe" style={{ fontSize: 40, marginBottom: 12 }}>🔒</span>
                    <span style={{ 
                      background: "rgba(250, 204, 21, 0.9)", 
                      color: "#000", 
                      padding: "6px 12px", 
                      borderRadius: 20, 
                      fontSize: 14, 
                      fontWeight: 800,
                      boxShadow: "0 0 20px rgba(250, 204, 21, 0.5)"
                    }}>
                      {group.amount} {group.currency}
                    </span>
                  </div>
                )}
                {unlocked && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(16, 185, 129, 0.9)",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)"
                  }}>
                    UNLOCKED
                  </div>
                )}
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: unlocked ? "var(--accent)" : "#fef08a" }}>
                  {group.name}
                </h3>
                <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
                  {group.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}

