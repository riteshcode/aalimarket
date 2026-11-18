import { useState } from 'react';
import { LocateFixed, Check, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

const EMPTY = { label: 'Home', line1: '', line2: '', landmark: '', city: '', state: 'Uttar Pradesh', pincode: '', isDefault: false };

export default function AddressForm({ initial, onSubmit, onCancel, saving }) {
  const { t } = useLang();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  // { lat, lng } from the phone's GPS — helps the rider find the house
  const [location, setLocation] = useState(initial?.location || null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  function useMyLocation() {
    setLocError('');
    if (!navigator.geolocation) return setLocError(t('Location isn’t available on this device.'));
    if (!window.isSecureContext) return setLocError(t('Location needs a secure (https) connection.'));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 5 decimals ≈ 1 metre, plenty for delivery
        setLocation({ lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) });
        setLocating(false);
      },
      () => {
        setLocError(t('Couldn’t get your location. Allow location access and try again.'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Backend schema is strict — don't send id/createdAt/updatedAt back on edit
  function submit(e) {
    e.preventDefault();
    const { label, line1, line2, landmark, city, state, pincode, isDefault } = form;
    const body = { label, line1, line2, landmark, city, state, pincode, isDefault };
    if (location) body.location = location;
    else if (initial?.location) body.location = null; // editing: the shopper removed the saved pin
    onSubmit(body);
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field field--full">
        <span className="field__label">{t('Save as')}</span>
        <div className="seg">
          {['Home', 'Work', 'Other'].map((l) => (
            <button type="button" key={l} className={form.label === l ? 'is-on' : ''} onClick={() => setForm({ ...form, label: l })}>{t(l)}</button>
          ))}
        </div>
      </div>
      <div className="field--full locate">
        {location ? (
          <p className="locate__done">
            <Check size={16} /> {t('Exact location saved for the delivery person')}
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => setLocation(null)} aria-label={t('Remove')}><X size={14} /></button>
          </p>
        ) : (
          <button type="button" className="btn btn--ghost btn--block" onClick={useMyLocation} disabled={locating}>
            <LocateFixed size={18} /> {locating ? t('Finding you…') : t('Use my current location')}
          </button>
        )}
        {locError && <p className="form-error small">{locError}</p>}
      </div>
      <label className="field field--full">
        <span className="field__label">{t('House / street')}</span>
        <input value={form.line1} onChange={set('line1')} required placeholder="123 MG Road" />
      </label>
      <label className="field field--full">
        <span className="field__label">{t('Area / locality')} <em>{t('optional')}</em></span>
        <input value={form.line2} onChange={set('line2')} placeholder="Near Bus Stand" />
      </label>
      <label className="field field--full">
        <span className="field__label">{t('Landmark')} <em>{t('optional')}</em></span>
        <input value={form.landmark} onChange={set('landmark')} placeholder="Opposite Petrol Pump" />
      </label>
      <label className="field">
        <span className="field__label">{t('City')}</span>
        <input value={form.city} onChange={set('city')} required />
      </label>
      <label className="field">
        <span className="field__label">{t('Pincode')}</span>
        <input value={form.pincode} onChange={set('pincode')} required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} />
      </label>
      <label className="field field--full">
        <span className="field__label">{t('State')}</span>
        <input value={form.state} onChange={set('state')} required />
      </label>
      <label className="check field--full">
        <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
        {t('Use as my default address')}
      </label>
      <div className="row-end field--full">
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>{t('Cancel')}</button>}
        <button className="btn btn--primary" disabled={saving}>{saving ? t('Saving…') : t('Save address')}</button>
      </div>
    </form>
  );
}
