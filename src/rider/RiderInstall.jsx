import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

const SNOOZE_KEY = 'aali.snooze.riderInstall';
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// "Install the rider app" card at the top of the rider screens. Hidden for a day after "close".
export default function RiderInstall() {
  const { t } = useLang();
  const [promptEvent, setPromptEvent] = useState(() => window.__aaliInstallPrompt || null);
  const [hidden, setHidden] = useState(() => Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || 0));

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || isStandalone() || (!promptEvent && !isIos())) return null;

  function close() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 86400000));
    setHidden(true);
  }

  async function install() {
    promptEvent.prompt();
    await promptEvent.userChoice;
    window.__aaliInstallPrompt = null;
    setPromptEvent(null);
  }

  return (
    <div className="rider-install">
      <img src="/icons/rider-192.png" alt="" width="40" height="40" />
      <div>
        <strong>{t('Install the rider app')}</strong>
        {promptEvent ? (
          <span>{t('Opens straight to your deliveries, like a normal app')}</span>
        ) : (
          <span>{t('Tap')} <Share size={14} aria-label="Share" /> {t('then “Add to Home Screen”')}</span>
        )}
      </div>
      {promptEvent && (
        <button className="btn btn--haldi btn--sm" onClick={install}><Download size={16} /> {t('Install')}</button>
      )}
      <button className="icon-btn icon-btn--sm rider-install__close" onClick={close} aria-label={t('Close')}><X size={16} /></button>
    </div>
  );
}
