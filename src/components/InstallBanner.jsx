import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

const DISMISS_KEY = 'aali.installDismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Android/desktop Chrome: uses the browser's install prompt.
// iPhone: Safari has no prompt, so we explain "Share → Add to Home Screen".
export default function InstallBanner() {
  const { t } = useLang();
  const [promptEvent, setPromptEvent] = useState(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const onPrompt = (e) => {
      e.preventDefault(); // keep it for our own button
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIos()) setShowIos(true);

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  async function install() {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (dismissed || (!promptEvent && !showIos)) return null;

  return (
    <div className="install">
      <img src="/icons/icon-192.png" alt="" width="40" height="40" />
      <div className="install__text">
        <strong>{t('Get the Aali Market app')}</strong>
        {promptEvent ? (
          <span>{t('Faster shopping, works on slow internet')}</span>
        ) : (
          <span>
            {t('Tap')} <Share size={14} aria-label="Share" /> {t('then “Add to Home Screen”')}
          </span>
        )}
      </div>
      {promptEvent && (
        <button className="btn btn--haldi btn--sm" onClick={install}>
          <Download size={16} /> {t('Install')}
        </button>
      )}
      <button className="icon-btn icon-btn--sm install__close" onClick={dismiss} aria-label={t('Close')}>
        <X size={16} />
      </button>
    </div>
  );
}
