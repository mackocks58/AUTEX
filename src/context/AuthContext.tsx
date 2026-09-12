import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  refreshClaims: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshClaims = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setIsAdmin(false);
      return;
    }
    const token = await u.getIdTokenResult(true);
    let hasDbAdmin = false;
    
    // Check users node
    try {
      const userSnap = await get(ref(db, `users/${u.uid}/role`));
      if (userSnap.exists() && String(userSnap.val()).toLowerCase() === "admin") {
        hasDbAdmin = true;
      }
    } catch (e) {
      console.warn("Could not fetch user role", e);
    }

    // Check admins node (might fail if rules don't allow it)
    if (!hasDbAdmin) {
      try {
        const adminSnap = await get(ref(db, `admins/${u.uid}`));
        if (adminSnap.exists() && adminSnap.val() === true) {
          hasDbAdmin = true;
        }
      } catch (e) {
        // Silently ignore if admins node doesn't exist or denies permission
      }
    }
    
    setIsAdmin(Boolean(token.claims.admin) || hasDbAdmin);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdTokenResult(true);
        let hasDbAdmin = false;
        
        try {
          const userSnap = await get(ref(db, `users/${u.uid}/role`));
          if (userSnap.exists() && String(userSnap.val()).toLowerCase() === "admin") {
            hasDbAdmin = true;
          }
        } catch (e) {
          console.warn("Could not fetch user role", e);
        }

        if (!hasDbAdmin) {
          try {
            const adminSnap = await get(ref(db, `admins/${u.uid}`));
            if (adminSnap.exists() && adminSnap.val() === true) {
              hasDbAdmin = true;
            }
          } catch (e) {
            // Silently ignore permission errors here
          }
        }
        setIsAdmin(Boolean(token.claims.admin) || hasDbAdmin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin, refreshClaims, logout }),
    [user, loading, isAdmin, refreshClaims, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
