import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useToast } from '../context/ToastContext';
import { asList, getId, money, toPaise, toRupees, formatDate } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { Drawer, Toggle, ConfirmButton } from './AdminUi';

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time
function toLocalInput(value) {
  const d = value ? new Date(value) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CouponForm({ coupon, onSaved, onCancel }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const in30Days = new Date(Date.now() + 30 * 86400000);

  const [form, setForm] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percent',
    // flat: value is paise (shown in ₹). percent: value is whole %
    value: coupon ? (coupon.type === 'flat' ? toRupees(coupon.value) : coupon.value) : '',
    minOrderValue: coupon ? toRupees(coupon.minOrderValue) : '',
    maxDiscount: coupon?.maxDiscount ? toRupees(coupon.maxDiscount) : '',
    startsAt: toLocalInput(coupon?.startsAt),
    expiresAt: toLocalInput(coupon?.expiresAt || in30Days),
    usageLimit: coupon?.usageLimit ?? 100,
    perUserLimit: coupon?.perUserLimit ?? 1,
    isActive: coupon?.isActive ?? true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const body = {
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: form.type === 'flat' ? toPaise(form.value) : Number(form.value),
      minOrderValue: toPaise(form.minOrderValue),
      maxDiscount: form.type === 'percent' && form.maxDiscount ? toPaise(form.maxDiscount) : null,
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
      usageLimit: Number(form.usageLimit),
      perUserLimit: Number(form.perUserLimit),
      isActive: form.isActive,
    };
    try {
      if (coupon) {
        delete body.code; // update schema doesn't accept code
        await adminApi.updateCoupon(getId(coupon), body);
      } else {
        await adminApi.createCoupon(body);
      }
      toast.success(coupon ? 'Coupon updated' : 'Coupon created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field">
        <span className="field__label">Code</span>
        <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} required placeholder="AALI50" disabled={Boolean(coupon)} />
      </label>
      <div className="field">
        <span className="field__label">Discount type</span>
        <div className="seg">
          <button type="button" className={form.type === 'percent' ? 'is-on' : ''} onClick={() => set('type', 'percent')}>% off</button>
          <button type="button" className={form.type === 'flat' ? 'is-on' : ''} onClick={() => set('type', 'flat')}>₹ off</button>
        </div>
      </div>
      <label className="field">
        <span className="field__label">{form.type === 'flat' ? 'Amount off (₹)' : 'Percent off'}</span>
        <input type="number" min="0" step={form.type === 'flat' ? '0.01' : '1'} max={form.type === 'percent' ? 100 : undefined} value={form.value} onChange={(e) => set('value', e.target.value)} required />
      </label>
      {form.type === 'percent' && (
        <label className="field">
          <span className="field__label">Max discount (₹)</span>
          <input type="number" min="0" step="0.01" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
        </label>
      )}
      <label className="field">
        <span className="field__label">Minimum order (₹)</span>
        <input type="number" min="0" step="0.01" value={form.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} required />
      </label>
      <label className="field">
        <span className="field__label">Starts</span>
        <input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} required />
      </label>
      <label className="field">
        <span className="field__label">Expires</span>
        <input type="datetime-local" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} required />
      </label>
      <label className="field">
        <span className="field__label">Total uses allowed</span>
        <input type="number" min="1" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Uses per shopper</span>
        <input type="number" min="1" value={form.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} />
      </label>
      <div className="field--full"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active" /></div>
      <div className="row-end field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</button>
      </div>
    </form>
  );
}

export default function AdminCoupons() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => adminApi.coupons(), []);
  const [editing, setEditing] = useState(null);
  const list = asList(data);

  async function toggleActive(c) {
    try {
      await adminApi.updateCoupon(getId(c), { isActive: !c.isActive });
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(c) {
    try {
      await adminApi.deleteCoupon(getId(c));
      toast.success('Coupon deactivated');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const describe = (c) =>
    c.type === 'flat' ? `${money(c.value)} off` : `${c.value}% off${c.maxDiscount ? `, up to ${money(c.maxDiscount)}` : ''}`;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Coupons</h1>
        <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add coupon</button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Valid till</th><th>Active</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={getId(c)}>
                  <td><span className="code">{c.code}</span></td>
                  <td>{describe(c)}</td>
                  <td>{money(c.minOrderValue)}</td>
                  <td>{formatDate(c.expiresAt)}</td>
                  <td><Toggle checked={!!c.isActive} onChange={() => toggleActive(c)} /></td>
                  <td className="table__actions">
                    <button className="icon-btn icon-btn--sm" onClick={() => setEditing(c)} aria-label="Edit"><Pencil size={16} /></button>
                    <ConfirmButton message="Deactivate this coupon?" onConfirm={() => remove(c)} aria-label="Delete"><Trash2 size={16} /></ConfirmButton>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="muted center">No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Drawer title={editing === 'new' ? 'Add coupon' : 'Edit coupon'} onClose={() => setEditing(null)}>
          <CouponForm coupon={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
        </Drawer>
      )}
    </div>
  );
}
