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
  const [username, setUsername] = useState(rider?.username || '');
  // Editing: blank = keep the current password; typing one resets it (and logs the rider out everywhere)
  const [password, setPassword] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (rider) {
        const body = { name };
        if (mobile !== rider.mobile) body.mobile = mobile;
        if (username && username !== rider.username) body.username = username;
        if (password) body.password = password;
        await adminApi.updateRider(rider.id, body);
      } else {
        await adminApi.createRider({ name, mobile, username, password });
      }
      toast.success(
        rider
          ? password ? 'Rider updated. Their password was reset, so they need to log in again.' : 'Rider updated'
          : `Rider added. Share the username "${username}" and the password with them.`
      );
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
        <span className="field__label">Mobile <em>for calls and alerts</em></span>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          maxLength={10}
          pattern="[6-9][0-9]{9}"
          required
        />
      </label>
      <label className="field">
        <span className="field__label">Username <em>for login</em></span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
          placeholder="ramesh.kumar"
          minLength={3}
          maxLength={30}
          autoCapitalize="none"
          required={!rider || !rider.username}
        />
      </label>
      <label className="field">
        <span className="field__label">{rider ? 'New password' : 'Password'} <em>{rider ? 'leave blank to keep' : 'min 8, letter + number'}</em></span>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
          title="At least 8 characters with a letter and a number"
          autoComplete="new-password"
          required={!rider || !rider.username}
        />
      </label>
      <p className="muted small field--full">
        {rider
          ? 'Typing a new password resets it and logs the rider out on every phone.'
          : 'Use a mobile number that isn’t a customer account. The rider logs in at /rider with this username and password.'}
      </p>
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
        <p>Riders open <strong>{window.location.origin}/rider</strong> on their phone and log in with the username and password you set here. Riders added before passwords existed show “Set login”.</p>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Name</th><th>Username</th><th>Mobile</th><th>Active orders</th><th>Added</th><th>Active</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.username || <button className="link-btn small warn" onClick={() => setEditing(r)}>Set login</button>}</td>
                  <td><a href={`tel:${r.mobile}`} className="link-btn">{r.mobile}</a></td>
                  <td>{r.activeOrders}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td><Toggle checked={r.isActive} onChange={() => toggleActive(r)} /></td>
                  <td className="table__actions">
                    <button className="icon-btn icon-btn--sm" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
              {riders.length === 0 && <tr><td colSpan={7} className="muted center">No riders yet.</td></tr>}
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
