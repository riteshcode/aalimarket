import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, MapPin, LogOut, Pencil, Trash2, Star, Plus } from 'lucide-react';
import { authApi, addressApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { asList, getId } from '../lib/format';
import AddressForm from '../components/AddressForm';
import { Spinner } from '../components/States';

function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch fresh profile from /me
  useEffect(() => {
    authApi.me().then(({ data }) => {
      updateUser(data);
      setForm({ name: data.name || '', email: data.email || '' });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: form.name };
      if (form.email.trim()) body.email = form.email.trim();
      const { data } = await authApi.updateMe(body);
      updateUser(data);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card profile">
      <div className="profile__avatar">{(form.name || 'A').charAt(0).toUpperCase()}</div>
      {!editing ? (
        <div className="profile__info">
          <h1>{form.name || 'Add your name'}</h1>
          <p className="muted">+91 {user?.mobile}{form.email ? `, ${form.email}` : ''}</p>
          <button className="link-btn" onClick={() => setEditing(true)}><Pencil size={15} /> Edit profile</button>
        </div>
      ) : (
        <form className="form-grid profile__form" onSubmit={save}>
          <label className="field field--full">
            <span className="field__label">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field field--full">
            <span className="field__label">Email <em>optional</em></span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <div className="row-end field--full">
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

function Addresses() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 'new' | address id
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await addressApi.list();
      setList(asList(data));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function save(form) {
    setSaving(true);
    try {
      if (editing === 'new') await addressApi.create(form);
      else await addressApi.update(editing, form);
      toast.success('Address saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id) {
    try {
      await addressApi.setDefault(id);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressApi.remove(id);
      toast.success('Address deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <section className="card">
      <div className="card__head">
        <h2><MapPin size={18} /> Saved addresses</h2>
        {!editing && <button className="link-btn" onClick={() => setEditing('new')}><Plus size={16} /> Add</button>}
      </div>

      {loading && <Spinner />}

      {editing && (
        <AddressForm
          initial={editing === 'new' ? {} : list.find((a) => getId(a) === editing)}
          onSubmit={save}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {!editing && !loading && list.length === 0 && <p className="muted">No saved addresses yet.</p>}

      {!editing && (
        <ul className="addr-list">
          {list.map((a) => (
            <li key={getId(a)}>
              <div>
                <strong>{a.label}</strong> {a.isDefault && <span className="pill pill--default">Default</span>}
                <p>{[a.line1, a.line2, a.landmark].filter(Boolean).join(', ')}</p>
                <p className="muted small">{a.city}, {a.state} {a.pincode}</p>
              </div>
              <div className="addr-list__actions">
                {!a.isDefault && <button className="icon-btn icon-btn--sm" onClick={() => makeDefault(getId(a))} aria-label="Make default" title="Make default"><Star size={16} /></button>}
                <button className="icon-btn icon-btn--sm" onClick={() => setEditing(getId(a))} aria-label="Edit"><Pencil size={16} /></button>
                <button className="icon-btn icon-btn--sm danger" onClick={() => remove(getId(a))} aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Account() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout('customer');
    navigate('/');
  }

  return (
    <div className="page container narrow">
      <Profile />
      <nav className="card quick-links">
        <Link to="/orders"><Package size={20} /> Your orders</Link>
        <Link to="/wishlist"><Heart size={20} /> Wishlist</Link>
      </nav>
      <Addresses />
      <button className="btn btn--ghost btn--block" onClick={onLogout}><LogOut size={18} /> Log out</button>
    </div>
  );
}
