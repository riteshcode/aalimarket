import { createContext, useContext, useState } from 'react';
import { pickLang } from '../lib/format';

const LangContext = createContext(null);

// Product, category and banner names come in English and Hindi.
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('aali.lang') || 'en');

  function setLang(next) {
    localStorage.setItem('aali.lang', next);
    document.documentElement.lang = next;
    setLangState(next);
  }

  const tr = (field) => pickLang(field, lang);

  return <LangContext.Provider value={{ lang, setLang, tr }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
