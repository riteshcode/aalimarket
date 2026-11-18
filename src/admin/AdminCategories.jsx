import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { asList, getId, imageUrl } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { Drawer, BilingualInput, ImageUploader, Toggle, ConfirmButton } from './AdminUi';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function CategoryForm({ category, onSaved, onCancel }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: category?.name || { en: '', hi: '' },
    slug: category?.slug || '',
    icon: category?.icon || '',
    image: category?.image || '',
    sortOrder: category?.sortOrder ?? 99,
    isActive: category?.isActive ?? true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, sortOrder: Number(form.sortOrder) };
      if (category) await adminApi.updateCategory(getId(category), body);
      else await adminApi.createCategory(body);
      toast.success(category ? 'Category updated' : 'Category created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <BilingualInput label="Category name" required value={form.name} onChange={(v) => {
        set('name', v);
        if (!category) set('slug', slugify(v.en || ''));
      }} />
      <label className="field">
        <span className="field__label">URL slug</span>
        <input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} required />
      </label>
      <label className="field">
        <span className="field__label">Sort order <em>lower shows first</em></span>
        <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
      </label>
      <div className="field field--full">
        <span className="field__label">Image</span>
        <ImageUploader single images={form.image ? [form.image] : []} onChange={(v) => set('image', v[0] || '')} />
      </div>
      <div className="field--full"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Show in store" /></div>
      <div className="row-end field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
      </div>
    </form>
  );
}

export default function AdminCategories() {
  const { tr } = useLang();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => adminApi.categories(), []);
  const [editing, setEditing] = useState(null);
  const list = asList(data);

  async function reactivate(c) {
    try {
      await adminApi.updateCategory(getId(c), { isActive: true });
      toast.success('Category is back in the store');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(c) {
    try {
      await adminApi.deleteCategory(getId(c));
      toast.success('Category hidden');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Categories</h1>
        <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add category</button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Category</th><th>Slug</th><th>Order</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={getId(c)}>
                  <td>
                    <div className="table__product">
                      <span className="table__thumb">
                        {c.image ? <img src={imageUrl(c.image)} alt="" /> : <span className="cat__initial">{tr(c.name).charAt(0)}</span>}
                      </span>
                      <div><strong>{c.name?.en}</strong><span className="muted small" lang="hi">{c.name?.hi}</span></div>
                    </div>
                  </td>
                  <td className="muted">{c.slug}</td>
                  <td>{c.sortOrder} {!c.isActive && <span className="pill pill--cancelled">Hidden</span>}</td>
                  <td className="table__actions">
                    <button className="icon-btn icon-btn--sm" onClick={() => setEditing(c)} aria-label="Edit"><Pencil size={16} /></button>
                    {c.isActive ? (
                      <ConfirmButton message="Hide this category from the store?" onConfirm={() => remove(c)} aria-label="Hide"><Trash2 size={16} /></ConfirmButton>
                    ) : (
                      <button className="icon-btn icon-btn--sm" onClick={() => reactivate(c)} aria-label="Show in store" title="Show in store"><RotateCcw size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="muted center">No categories yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Drawer title={editing === 'new' ? 'Add category' : 'Edit category'} onClose={() => setEditing(null)}>
          <CategoryForm category={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
        </Drawer>
      )}
    </div>
  );
}
