import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Lang } from "@/i18n/translations";

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations.en;
  toggle: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "autex_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "sw" ? "sw" : "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "sw" : "en");
  }, [lang, setLang]);

  // Update html lang attribute for accessibility
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => translations[lang], [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, toggle }),
    [lang, setLang, t, toggle]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
