import { useEffect, useState } from 'react';
import { Download, Share, Bell, Zap, Wifi, PackageCheck, PlusSquare } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePush, hasOptedOut } from '../lib/usePush';

const SNOOZE_DAYS = 3;
const snoozeKey = (name) => `aali.snooze.${name}`;
const isSnoozed = (name) => Date.now() < Number(localStorage.getItem(snoozeKey(name)) || 0);
const snooze = (name) => localStorage.setItem(snoozeKey(name), String(Date.now() + SNOOZE_DAYS * 86400000));

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/**
 * Shown once the store opens, one at a time:
 *   1. "Install the app"  — Android uses the browser's install prompt; iPhone gets "Share → Add to Home Screen"
 *   2. "Allow notifications" — our sheet first, the browser's permission popup only after the shopper taps Allow
 * "Not now" hides a sheet for 3 days.
 * If notifications are allowed before login, we subscribe automatically right after login.
 */
export default function AppPrompts() {
  const { t } = useLang();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const push = usePush();
  const [installEvent, setInstallEvent] = useState(() => window.__aaliInstallPrompt || null);
  const [step, setStep] = useState(null); // null | 'install' | 'notify'
  const [ready, setReady] = useState(false);

  // Catch Chrome's install prompt so our button can open it
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    // small delay so the sheet doesn't jump in while the page is still loading
    const timer = setTimeout(() => setReady(true), 1500);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(timer);
    };
  }, []);

  const canInstall = !isStandalone() && (Boolean(installEvent) || isIos());
  const canAskNotify = push.supported && Notification.permission === 'default' && !hasOptedOut();

  // Decide which sheet (if any) to show
  useEffect(() => {
    if (!ready || step) return;
    if (canInstall && !isSnoozed('install')) setStep('install');
    else if (canAskNotify && !isSnoozed('notify')) setStep('notify');
  }, [ready, step, canInstall, canAskNotify]);

  // Permission given earlier (maybe before login) → save the subscription once logged in
  useEffect(() => {
    if (isLoggedIn && push.supported && Notification.permission === 'granted' && !push.subscribed && !push.busy && !hasOptedOut()) {
      push.enable().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, push.supported, push.subscribed]);

  function closeInstall() {
    snooze('install');
    // move on to notifications in the same visit
    setStep(canAskNotify && !isSnoozed('notify') ? 'notify' : 'done');
  }

  async function install() {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setStep(canAskNotify && !isSnoozed('notify') ? 'notify' : 'done');
  }

  async function allowNotifications() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if (isLoggedIn) await push.enable();
        toast.success(t('You’ll get a notification at every step'));
      }
    } catch (err) {
      toast.error(err.message);
    }
    setStep('done');
  }

  function closeNotify() {
    snooze('notify');
    setStep('done');
  }

  if (step === 'install') {
    return (
      <Sheet onClose={closeInstall}>
        <img src="/icons/icon-192.png" alt="" width="64" height="64" className="sheet__icon" />
        <h2>{t('Get the Aali Market app')}</h2>
        <ul className="sheet__perks">
          <li><Zap size={18} /> {t('Opens instantly from your home screen')}</li>
          <li><Wifi size={18} /> {t('Works smoothly on slow internet')}</li>
          <li><PackageCheck size={18} /> {t('Live updates on your orders')}</li>
        </ul>
        {installEvent ? (
          <button className="btn btn--primary btn--block" onClick={install}>
            <Download size={18} /> {t('Install app')}
          </button>
        ) : (
          <ol className="sheet__ios">
            <li>{t('Tap')} <Share size={16} aria-label="Share" /> {t('at the bottom of Safari')}</li>
            <li>{t('Choose')} <PlusSquare size={16} /> <strong>“Add to Home Screen”</strong></li>
          </ol>
        )}
        <button className="btn btn--ghost btn--block" onClick={closeInstall}>{t('Not now')}</button>
      </Sheet>
    );
  }

  if (step === 'notify') {
    return (
      <Sheet onClose={closeNotify}>
        <span className="sheet__bell"><Bell size={30} /></span>
        <h2>{t('Get order updates')}</h2>
        <p>{t('We’ll tell you when your order is packed, out for delivery and delivered. No spam.')}</p>
        <button className="btn btn--primary btn--block" onClick={allowNotifications} disabled={push.busy}>
          <Bell size={18} /> {t('Allow notifications')}
        </button>
        <button className="btn btn--ghost btn--block" onClick={closeNotify}>{t('Not now')}</button>
      </Sheet>
    );
  }

  return null;
}

function Sheet({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel">
        <span className="sheet__handle" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
