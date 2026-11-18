import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, RotateCcw } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { asList, getId, money, toPaise, toRupees, discountPercent } from '../lib/format';
import ProductImage from '../components/ProductImage';
import { Spinner, ErrorState } from '../components/States';
import { Drawer, BilingualInput, ImageUploader, Toggle, ConfirmButton } from './AdminUi';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function ProductForm({ product, categories, onSaved, onCancel }) {
  const toast = useToast();
  const isEdit = Boolean(product);
  const [saving, setSaving] = useState(false);

  // Prices are shown in rupees in the form and sent to the API in paise
  const [form, setForm] = useState({
    title: product?.title || { en: '', hi: '' },
    slug: product?.slug || '',
    description: product?.description || { en: '', hi: '' },
    category: getId(product?.category) || getId(categories[0]) || '',
    brand: product?.brand || 'Aali',
    images: (product?.images || []).map((i) => (typeof i === 'string' ? i : i.url)),
    mrp: product ? toRupees(product.mrp) : '',
    price: product ? toRupees(product.price) : '',
    unit: product?.unit || '',
    stock: product?.stock ?? 0,
    tags: (product?.tags || []).join(', '),
    isActive: product?.isActive ?? true,
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    if (Number(form.price) > Number(form.mrp)) return toast.error('Selling price can’t be more than MRP.');
    setSaving(true);
    const body = {
      ...form,
      slug: form.slug || slugify(form.title.en),
      mrp: toPaise(form.mrp),
      price: toPaise(form.price),
      stock: Number(form.stock),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        delete body.slug; // update schema doesn't accept slug
        await adminApi.updateProduct(getId(product), body);
      } else {
        await adminApi.createProduct(body);
      }
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const off = discountPercent(toPaise(form.mrp), toPaise(form.price));

  return (
    <form className="form-grid" onSubmit={submit}>
      <BilingualInput label="Product name" value={form.title} required onChange={(v) => {
        set('title', v);
        if (!isEdit) set('slug', slugify(v.en || ''));
      }} />
      <label className="field">
        <span className="field__label">URL slug</span>
        <input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} required disabled={isEdit} />
      </label>
      <label className="field">
        <span className="field__label">Category</span>
        <select value={form.category} onChange={(e) => set('category', e.target.value)} required>
          <option value="" disabled>Choose…</option>
          {categories.map((c) => <option key={getId(c)} value={getId(c)}>{c.name?.en || c.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">MRP (₹)</span>
        <input type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} required />
      </label>
      <label className="field">
        <span className="field__label">Selling price (₹) {off > 0 && <em>{off}% off</em>}</span>
        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
      </label>
      <label className="field">
        <span className="field__label">Pack size</span>
        <input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="1 kg" required />
      </label>
      <label className="field">
        <span className="field__label">Stock</span>
        <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
      </label>
      <label className="field">
        <span className="field__label">Brand</span>
        <input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Tags <em>comma separated</em></span>
        <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="rice, staple" />
      </label>
      <BilingualInput label="Description" textarea required value={form.description} onChange={(v) => set('description', v)} />
      <div className="field field--full">
        <span className="field__label">Photos <em>up to 6</em></span>
        <ImageUploader images={form.images} onChange={(v) => set('images', v)} />
      </div>
      <div className="field--full">
        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Show in store" />
      </div>
      <div className="row-end field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const { tr } = useLang();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [params, setParams] = useSearchParams();
  const show = params.get('isActive') || '';       // '' = all, 'true', 'false'
  const lowStock = params.get('lowStock') || '';

  const products = useFetch(
    () => adminApi.products({ page, limit: 20, q: search, isActive: show, lowStock }),
    [page, search, show, lowStock]
  );
  const categories = useFetch(() => adminApi.categories(), []);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
    setPage(1);
  }

  async function reactivate(p) {
    try {
      await adminApi.updateProduct(getId(p), { isActive: true });
      toast.success('Product is back in the store');
      products.reload();
    } catch (err) {
      toast.error(err.message);
    }
  }
  const list = asList(products.data);
  const categoryList = asList(categories.data);
  const pages = products.meta?.pages || 1;

  async function remove(p) {
    try {
      await adminApi.deleteProduct(getId(p));
      toast.success('Product hidden from store');
      products.reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const catName = (cat) => tr(cat?.name) || tr(categoryList.find((c) => getId(c) === getId(cat))?.name) || '';

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Products</h1>
        <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add product</button>
      </div>

      <form className="search search--admin" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }}>
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" />
      </form>

      <div className="chip-scroll">
        <button className={`chip ${!show && !lowStock ? 'is-on' : ''}`} onClick={() => { setFilter('isActive', ''); setFilter('lowStock', ''); }}>All</button>
        <button className={`chip ${show === 'true' ? 'is-on' : ''}`} onClick={() => setFilter('isActive', 'true')}>In store</button>
        <button className={`chip ${show === 'false' ? 'is-on' : ''}`} onClick={() => setFilter('isActive', 'false')}>Hidden</button>
        <button className={`chip ${lowStock ? 'is-on' : ''}`} onClick={() => setFilter('lowStock', lowStock ? '' : 'true')}>Low stock</button>
      </div>

      {products.loading && <Spinner />}
      {products.error && <ErrorState error={products.error} onRetry={products.reload} />}

      {!products.loading && !products.error && (
        <div className="card card--flush">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={getId(p)}>
                  <td>
                    <div className="table__product">
                      <span className="table__thumb"><ProductImage src={p.images?.[0]} alt="" /></span>
                      <div>
                        <strong>{tr(p.title)}</strong>
                        <span className="muted small">{p.unit}</span>
                      </div>
                    </div>
                  </td>
                  <td>{catName(p.category)}</td>
                  <td>
                    <strong>{money(p.price)}</strong>
                    {p.mrp > p.price && <s className="muted small"> {money(p.mrp)}</s>}
                  </td>
                  <td>
                    <span className={p.stock <= 10 ? 'warn' : ''}>{p.stock}</span>
                    {!p.isActive && <span className="pill pill--cancelled">Hidden</span>}
                  </td>
                  <td className="table__actions">
                    <button className="icon-btn icon-btn--sm" onClick={() => setEditing(p)} aria-label="Edit"><Pencil size={16} /></button>
                    {p.isActive ? (
                      <ConfirmButton message={`Hide “${tr(p.title)}” from the store?`} onConfirm={() => remove(p)} aria-label="Hide"><Trash2 size={16} /></ConfirmButton>
                    ) : (
                      <button className="icon-btn icon-btn--sm" onClick={() => reactivate(p)} aria-label="Show in store" title="Show in store"><RotateCcw size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="muted center">No products yet. Add your first one.</td></tr>}
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
        <Drawer title={editing === 'new' ? 'Add product' : 'Edit product'} onClose={() => setEditing(null)}>
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categoryList}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); products.reload(); }}
          />
        </Drawer>
      )}
    </div>
  );
}
