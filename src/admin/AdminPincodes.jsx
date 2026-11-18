import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Info } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useToast } from '../context/ToastContext';
import { asList, getId, money, toPaise, toRupees } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { Drawer, BilingualInput, Toggle, ConfirmButton } from './AdminUi';

function PincodeForm({ area, onSaved, onCancel }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pincode: area?.pincode || '',
    areaName: area?.areaName || { en: '', hi: '' },
    // blank = use the store-wide delivery fee
    deliveryFee: area?.deliveryFee !== null && area?.deliveryFee !== undefined ? toRupees(area.deliveryFee) : '',
    etaDays: area?.etaDays ?? 1,
    isActive: area?.isActive ?? true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const body = {
      pincode: form.pincode,
      areaName: form.areaName,
      deliveryFee: form.deliveryFee === '' ? null : toPaise(form.deliveryFee),
      etaDays: Number(form.etaDays),
      isActive: form.isActive,
    };
    try {
      if (area) await adminApi.updatePincode(getId(area), body);
      else await adminApi.createPincode(body);
      toast.success(area ? 'Area updated' : 'Area added');
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
        <span className="field__label">Pincode</span>
        <input value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" required />
      </label>
      <label className="field">
        <span className="field__label">Delivery in (days) <em>0 = same day</em></span>
        <input type="number" min="0" max="30" value={form.etaDays} onChange={(e) => set('etaDays', e.target.value)} required />
      </label>
      <BilingualInput label="Area name" required value={form.areaName} onChange={(v) => set('areaName', v)} />
      <label className="field field--full">
        <span className="field__label">Delivery fee for this area (₹) <em>leave blank to use the store fee</em></span>
        <input type="number" min="0" step="0.01" value={form.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value)} />
      </label>
      <div className="field--full"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Delivering here" /></div>
      <div className="row-end field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save area'}</button>
      </div>
    </form>
  );
}

export default function AdminPincodes() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const { data, meta, loading, error, reload } = useFetch(() => adminApi.pincodes({ page, limit: 20, q: search }), [page, search]);
  const list = asList(data);
  const pages = meta?.pages || 1;

  async function toggle(area) {
    try {
      await adminApi.updatePincode(getId(area), { isActive: !area.isActive });
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(area) {
    try {
      await adminApi.deletePincode(getId(area));
      toast.success('Area deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Delivery areas</h1>
        <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add area</button>
      </div>

      <div className="notice notice--info">
        <Info size={18} />
        <p>
          {!loading && meta?.total === 0 && !search
            ? 'No areas added yet, so orders are accepted from every pincode. Add your first area to deliver only to listed pincodes.'
            : 'Orders are accepted only from active pincodes in this list.'}
        </p>
      </div>

      <form className="search search--admin" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pincode or area name" />
      </form>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Pincode</th><th>Area</th><th>Delivery fee</th><th>Delivery in</th><th>Active</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={getId(a)}>
                  <td><strong>{a.pincode}</strong></td>
                  <td>{a.areaName?.en}<span className="muted small" lang="hi">{a.areaName?.hi}</span></td>
                  <td>{a.deliveryFee === null ? <span className="muted">Store fee</span> : money(a.deliveryFee)}</td>
                  <td>{a.etaDays === 0 ? 'Same day' : `${a.etaDays} day${a.etaDays > 1 ? 's' : ''}`}</td>
                  <td><Toggle checked={a.isActive} onChange={() => toggle(a)} /></td>
                  <td className="table__actions">
                    <button className="icon-btn icon-btn--sm" onClick={() => setEditing(a)} aria-label="Edit"><Pencil size={16} /></button>
                    <ConfirmButton message={`Delete ${a.pincode}? This can’t be undone.`} onConfirm={() => remove(a)} aria-label="Delete"><Trash2 size={16} /></ConfirmButton>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="muted center">No areas found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {editing && (
        <Drawer title={editing === 'new' ? 'Add delivery area' : 'Edit delivery area'} onClose={() => setEditing(null)}>
          <PincodeForm area={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
        </Drawer>
      )}
    </div>
  );
}
