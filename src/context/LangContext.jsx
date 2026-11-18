import { createContext, useContext, useState } from 'react';
import { pickLang } from '../lib/format';
import HI from '../lib/hi';

const LangContext = createContext(null);

// lang = 'en' | 'hi'
// tr(field) → picks { en, hi } fields from the API (product names etc.)
// t('Add to cart') → UI text; looks up lib/hi.js, falls back to the English text
// t('Save {amount}', { amount: '₹5' }) → fills {placeholders}
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('aali.lang') || 'en');

  function setLang(next) {
    localStorage.setItem('aali.lang', next);
    document.documentElement.lang = next;
    setLangState(next);
  }

  const tr = (field) => pickLang(field, lang);

  function t(text, params) {
    let out = lang === 'hi' ? HI[text] || text : text;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        out = out.replace(`{${key}}`, value);
      });
    }
    return out;
  }

  return <LangContext.Provider value={{ lang, setLang, tr, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
