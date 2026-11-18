import { useState } from 'react';
import { Plus, Pencil, Info } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useToast } from '../context/ToastContext';
import { asList, formatDate } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { Drawer, Toggle } from './AdminUi';

function RiderForm({ rider, onSaved, onCancel }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(rider?.name || '');
  const [mobile, setMobile] = useState(rider?.mobile || '');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (rider) {
        const body = { name };
        if (mobile !== rider.mobile) body.mobile = mobile; // rider logs in with the new number from now on
        await adminApi.updateRider(rider.id, body);
      }
      else await adminApi.createRider({ name, mobile });
      toast.success(rider ? 'Rider updated' : 'Rider added. They can log in at /rider with this number.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field field--full">
        <span className="field__label">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="field field--full">
        <span className="field__label">Mobile {rider && <em>rider logs in with this number</em>}</span>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          maxLength={10}
          pattern="[6-9][0-9]{9}"
          required
        />
      </label>
      {!rider && (
        <p className="muted small field--full">
          Use a number that isn’t already a customer account. The rider logs in at <strong>/rider</strong> with an OTP.
        </p>
      )}
      <div className="row-end field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save rider'}</button>
      </div>
    </form>
  );
}

export default function AdminRiders() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload } = useFetch(() => adminApi.riders({ limit: 100 }), []);
  const riders = asList(data);

  async function toggleActive(rider) {
    try {
      await adminApi.updateRider(rider.id, { isActive: !rider.isActive });
      toast.success(rider.isActive ? 'Rider deactivated and logged out' : 'Rider can log in again');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Riders</h1>
        <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add rider</button>
      </div>

      <div className="notice notice--info">
        <Info size={18} />
        <p>Riders open <strong>{window.location.origin}/rider</strong> on their phone and log in with their mobile number. Assign them orders from the Orders page.</p>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Name</th><th>Mobile</th><th>Active orders</th><th>Added</th><th>Active</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td><a href={`tel:${r.mobile}`} className="link-btn">{r.mobile}</a></td>
                  <td>{r.activeOrders}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td><Toggle checked={r.isActive} onChange={() => toggleActive(r)} /></td>
                  <td className="table__actions">
                    <button className="icon-btn icon-btn--sm" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
              {riders.length === 0 && <tr><td colSpan={6} className="muted center">No riders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Drawer title={editing === 'new' ? 'Add rider' : 'Edit rider'} onClose={() => setEditing(null)}>
          <RiderForm rider={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
        </Drawer>
      )}
    </div>
  );
}
