import { useEffect, useState } from 'react';
import { adminApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { toPaise, toRupees, formatDate } from '../lib/format';
import { Spinner } from '../components/States';
import { Toggle } from './AdminUi';

// Money is shown in ₹ here and sent to the API in paise
export default function AdminSettings() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    adminApi.settings()
      .then(({ data }) => fill(data))
      .catch((err) => toast.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fill(data) {
    setForm({
      deliveryFee: toRupees(data.deliveryFee),
      freeDeliveryThreshold: toRupees(data.freeDeliveryThreshold),
      handlingFee: toRupees(data.handlingFee),
      minOrderValue: toRupees(data.minOrderValue),
      storeOpen: data.storeOpen,
      open: data.storeTimings?.open || '08:00',
      close: data.storeTimings?.close || '22:00',
    });
    setUpdatedAt(data.updatedAt);
    // Store details: shown on the legal pages, footer and printed bills
    setInfo({
      storeName: data.storeName || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      line1: data.address?.line1 || '',
      city: data.address?.city || '',
      state: data.address?.state || '',
      pincode: data.address?.pincode || '',
      fssaiNumber: data.fssaiNumber || '',
      gstin: data.gstin || '',
    });
  }

  const setI = (key, value) => setInfo((f) => ({ ...f, [key]: value }));

  async function saveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const { line1, city, state, pincode, ...rest } = info;
      // "" clears a value on the backend
      const { data } = await adminApi.updateSettings({ ...rest, address: { line1, city, state, pincode } });
      fill(data);
      toast.success('Store details saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingInfo(false);
    }
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await adminApi.updateSettings({
        deliveryFee: toPaise(form.deliveryFee),
        freeDeliveryThreshold: toPaise(form.freeDeliveryThreshold),
        handlingFee: toPaise(form.handlingFee),
        minOrderValue: toPaise(form.minOrderValue),
        storeOpen: form.storeOpen,
        storeTimings: { open: form.open, close: form.close },
      });
      fill(data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Open/close is important enough to save right away
  async function toggleStore(open) {
    set('storeOpen', open);
    try {
      const { data } = await adminApi.updateSettings({ storeOpen: open });
      setUpdatedAt(data.updatedAt);
      toast.success(open ? 'Store is open for orders' : 'Store closed — new orders are paused');
    } catch (err) {
      set('storeOpen', !open);
      toast.error(err.message);
    }
  }

  if (!form) return <Spinner />;

  return (
    <div className="admin-page admin-page--narrow">
      <h1 className="admin-title">Store settings</h1>

      <section className={`card store-switch ${form.storeOpen ? 'is-open' : 'is-closed'}`}>
        <div>
          <h2>{form.storeOpen ? 'Taking orders' : 'Closed for orders'}</h2>
          <p className="muted small">
            {form.storeOpen ? 'Shoppers can place orders right now.' : 'Shoppers can browse but can’t place orders.'}
          </p>
        </div>
        <Toggle checked={form.storeOpen} onChange={toggleStore} label={form.storeOpen ? 'Open' : 'Closed'} />
      </section>

      <form className="card form-grid" onSubmit={save}>
        <h2 className="card__title field--full">Delivery and charges</h2>
        <label className="field">
          <span className="field__label">Delivery fee (₹)</span>
          <input type="number" min="0" step="0.01" value={form.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">Free delivery from (₹) <em>0 = always free</em></span>
          <input type="number" min="0" step="0.01" value={form.freeDeliveryThreshold} onChange={(e) => set('freeDeliveryThreshold', e.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">Handling fee (₹)</span>
          <input type="number" min="0" step="0.01" value={form.handlingFee} onChange={(e) => set('handlingFee', e.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">Minimum order (₹) <em>0 = no minimum</em></span>
          <input type="number" min="0" step="0.01" value={form.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} required />
        </label>

        <h2 className="card__title field--full">Store timings <em className="muted small">shown to shoppers</em></h2>
        <label className="field">
          <span className="field__label">Opens at</span>
          <input type="time" value={form.open} onChange={(e) => set('open', e.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">Closes at</span>
          <input type="time" value={form.close} onChange={(e) => set('close', e.target.value)} required />
        </label>

        <div className="row-end field--full">
          {updatedAt && <span className="muted small grow">Last changed {formatDate(updatedAt, true)}</span>}
          <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>

      <form className="card form-grid" onSubmit={saveInfo}>
        <div className="field--full">
          <h2 className="card__title">Store details</h2>
          <p className="muted small">Shown on bills, the footer, and the Contact, About and policy pages.</p>
        </div>
        <label className="field field--full">
          <span className="field__label">Store name</span>
          <input value={info.storeName} onChange={(e) => setI('storeName', e.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">Phone</span>
          <input value={info.phone} onChange={(e) => setI('phone', e.target.value)} placeholder="+91 98765 43210" />
        </label>
        <label className="field">
          <span className="field__label">WhatsApp number</span>
          <input value={info.whatsapp} onChange={(e) => setI('whatsapp', e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" maxLength={10} placeholder="9876543210" />
        </label>
        <label className="field field--full">
          <span className="field__label">Email</span>
          <input type="email" value={info.email} onChange={(e) => setI('email', e.target.value)} />
        </label>
        <label className="field field--full">
          <span className="field__label">Shop address</span>
          <input value={info.line1} onChange={(e) => setI('line1', e.target.value)} placeholder="12 Station Road" />
        </label>
        <label className="field">
          <span className="field__label">City</span>
          <input value={info.city} onChange={(e) => setI('city', e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Pincode</span>
          <input value={info.pincode} onChange={(e) => setI('pincode', e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" maxLength={6} />
        </label>
        <label className="field field--full">
          <span className="field__label">State</span>
          <input value={info.state} onChange={(e) => setI('state', e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">FSSAI licence number</span>
          <input value={info.fssaiNumber} onChange={(e) => setI('fssaiNumber', e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" maxLength={14} />
        </label>
        <label className="field">
          <span className="field__label">GSTIN <em>optional</em></span>
          <input value={info.gstin} onChange={(e) => setI('gstin', e.target.value.toUpperCase())} maxLength={15} />
        </label>
        <div className="row-end field--full">
          <button className="btn btn--primary" disabled={savingInfo}>{savingInfo ? 'Saving…' : 'Save store details'}</button>
        </div>
      </form>
    </div>
  );
}
