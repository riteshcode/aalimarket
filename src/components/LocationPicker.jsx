import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Zap, ChevronDown, LocateFixed, X, Check, Home } from 'lucide-react';
import { addressApi, geoApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { useLocationPref } from '../context/LocationContext';

// "⚡ 30 minutes" / "Today" / "In 2 days" from the serviceability answer
function etaText(location, t) {
  if (location.etaMinutes) return t('{n} minutes', { n: location.etaMinutes });
  if (location.etaDays === 0) return t('Delivery today');
  if (location.etaDays === 1) return t('Delivery tomorrow');
  if (location.etaDays) return t('In {n} days', { n: location.etaDays });
  return t('Delivery');
}

// Header pill: "⚡ Delivery tomorrow · G Block, Sitapur ▾"
export default function LocationPicker() {
  const { t } = useLang();
  const { location } = useLocationPref();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="loc-pill" onClick={() => setOpen(true)} aria-label={t('Change delivery location')}>
        {location ? (
          <>
            <span className={`loc-pill__eta ${location.serviceable ? '' : 'is-no'}`}>
              {location.serviceable ? <><Zap size={14} /> {etaText(location, t)}</> : t('Not delivering here')}
            </span>
            <span className="loc-pill__place">
              {location.label} <ChevronDown size={14} />
            </span>
          </>
        ) : (
          <>
            <span className="loc-pill__eta"><MapPin size={14} /> {t('Delivering to')}</span>
            <span className="loc-pill__place">{t('Set your location')} <ChevronDown size={14} /></span>
          </>
        )}
      </button>
      {open && <LocationSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function LocationSheet({ onClose }) {
  const { t } = useLang();
  const toast = useToast();
  const { isLoggedIn } = useAuth();
  const { location, choosePincode } = useLocationPref();
  const [pincode, setPincode] = useState('');
  const [busy, setBusy] = useState(false);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (isLoggedIn) addressApi.list().then(({ data }) => setAddresses(data || [])).catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function pick(code, label, addressId) {
    setBusy(true);
    try {
      const next = await choosePincode(code, label, addressId);
      if (!next.serviceable) toast.error(t('We don’t deliver to {pincode} yet', { pincode: code }));
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function onPincode(e) {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pincode)) return toast.error(t('Enter a 6-digit pincode'));
    pick(pincode);
  }

  // GPS → backend reverse geocode → pincode
  function useCurrentLocation() {
    if (!navigator.geolocation || !window.isSecureContext) return toast.error(t('Location isn’t available on this device.'));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await geoApi.reverse(pos.coords.latitude.toFixed(5), pos.coords.longitude.toFixed(5));
          const label = [data.area, data.city].filter(Boolean).join(', ') || data.pincode;
          await pick(data.pincode, label);
        } catch {
          toast.error(t('Couldn’t find your area. Please enter your pincode.'));
          setBusy(false);
        }
      },
      () => {
        toast.error(t('Couldn’t get your location. Allow location access and try again.'));
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t('Choose delivery location')}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel loc-sheet">
        <span className="sheet__handle" aria-hidden="true" />
        <div className="variant-sheet__head">
          <h2>{t('Choose delivery location')}</h2>
          <button className="icon-btn icon-btn--sm" onClick={onClose} aria-label={t('Close')}><X size={16} /></button>
        </div>

        <button className="loc-current" onClick={useCurrentLocation} disabled={busy}>
          <LocateFixed size={20} />
          <span>
            <strong>{t('Use my current location')}</strong>
            <small>{t('Using GPS')}</small>
          </span>
        </button>

        <form className="loc-pincode" onSubmit={onPincode}>
          <input
            inputMode="numeric"
            maxLength={6}
            placeholder={t('Enter pincode')}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            aria-label={t('Pincode')}
          />
          <button className="btn btn--primary btn--sm" disabled={busy || pincode.length !== 6}>{t('Check')}</button>
        </form>

        {addresses.length > 0 && (
          <div className="loc-saved">
            <span className="field__label">{t('Saved addresses')}</span>
            {addresses.map((a) => (
              <button key={a.id} className={`loc-saved__item ${location?.addressId === a.id ? 'is-on' : ''}`} onClick={() => pick(a.pincode, a.line2 || a.line1, a.id)} disabled={busy}>
                <Home size={18} />
                <span>
                  <strong>{t(a.label)}</strong>
                  <small>{[a.line1, a.line2].filter(Boolean).join(', ')}, {a.city} {a.pincode}</small>
                </span>
                {location?.addressId === a.id && <Check size={18} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
