import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useToast } from '../context/ToastContext';
import { asList, getId, imageUrl } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { Drawer, BilingualInput, ImageUploader, Toggle, ConfirmButton } from './AdminUi';

function BannerForm({ banner, onSaved, onCancel }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: banner?.title || { en: '', hi: '' },
    image: banner?.image || '',
    link: banner?.link || '',
    sortOrder: banner?.sortOrder ?? 1,
    isActive: banner?.isActive ?? true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.image) return toast.error('Upload a banner image first.');
    setSaving(true);
    try {
      const body = { ...form, sortOrder: Number(form.sortOrder) };
      if (banner) await adminApi.updateBanner(getId(banner), body);
      else await adminApi.createBanner(body);
      toast.success(banner ? 'Banner updated' : 'Banner created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <BilingualInput label="Banner title" required value={form.title} onChange={(v) => set('title', v)} />
      <div className="field field--full">
        <span className="field__label">Image <em>wide, about 3:1</em></span>
        <ImageUploader single images={form.image ? [form.image] : []} onChange={(v) => set('image', v[0] || '')} />
      </div>
      <label className="field">
        <span className="field__label">Opens <em>optional</em></span>
        <input value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="/category/grocery-staples or /products/tomato" />
      </label>
      <label className="field">
        <span className="field__label">Sort order</span>
        <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
      </label>
      <div className="field--full"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Show on home page" /></div>
      <div className="row-end field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save banner'}</button>
      </div>
    </form>
  );
}

export default function AdminBanners() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => adminApi.banners(), []);
  const [editing, setEditing] = useState(null);
  const list = asList(data);

  async function reactivate(b) {
    try {
      await adminApi.updateBanner(getId(b), { isActive: true });
      toast.success('Banner is back on the home page');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(b) {
    try {
      await adminApi.deleteBanner(getId(b));
      toast.success('Banner hidden');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Banners</h1>
        <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add banner</button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      <div className="banner-grid">
        {list.map((b) => (
          <div key={getId(b)} className={`card banner-card ${b.isActive ? '' : 'is-hidden'}`}>
            <img src={imageUrl(b.image)} alt="" />
            <div className="banner-card__body">
              <div>
                <strong>{b.title?.en}</strong>
                <p className="muted small">Order {b.sortOrder}{b.link ? `, opens ${b.link}` : ''}</p>
                {!b.isActive && <span className="pill pill--cancelled">Hidden</span>}
              </div>
              <div className="table__actions">
                <button className="icon-btn icon-btn--sm" onClick={() => setEditing(b)} aria-label="Edit"><Pencil size={16} /></button>
                {b.isActive ? (
                  <ConfirmButton message="Hide this banner?" onConfirm={() => remove(b)} aria-label="Hide"><Trash2 size={16} /></ConfirmButton>
                ) : (
                  <button className="icon-btn icon-btn--sm" onClick={() => reactivate(b)} aria-label="Show on home page" title="Show on home page"><RotateCcw size={16} /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && !error && list.length === 0 && <p className="muted">No banners yet. The home page shows a default hero until you add one.</p>}

      {editing && (
        <Drawer title={editing === 'new' ? 'Add banner' : 'Edit banner'} onClose={() => setEditing(null)}>
          <BannerForm banner={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
        </Drawer>
      )}
    </div>
  );
}
