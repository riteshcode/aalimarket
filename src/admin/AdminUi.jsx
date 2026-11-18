// Small building blocks reused across admin screens.
import { useEffect, useRef, useState } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { imageUrl } from '../lib/format';

export function Drawer({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__panel">
        <div className="drawer__head">
          <h2>{title}</h2>
          <button className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}

// English + Hindi input pair for { en, hi } fields
export function BilingualInput({ label, value = {}, onChange, textarea, required }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="field field--full">
      <span className="field__label">{label}</span>
      <div className="bilingual">
        <Tag rows={3} placeholder="English" value={value.en || ''} required={required} onChange={(e) => onChange({ ...value, en: e.target.value })} />
        <Tag rows={3} placeholder="हिंदी" lang="hi" value={value.hi || ''} required={required} onChange={(e) => onChange({ ...value, hi: e.target.value })} />
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" />
      {label}
    </label>
  );
}

// Upload response shape isn't documented — pull URLs out of common variants
function extractUrls(data) {
  const list = Array.isArray(data) ? data : data?.urls || data?.images || data?.files || (data ? [data] : []);
  return list.map((x) => (typeof x === 'string' ? x : x.url || x.path || x.location)).filter(Boolean);
}

export function ImageUploader({ images = [], onChange, max = 6, single }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const limit = single ? 1 : max;

  async function onFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, limit - (single ? 0 : images.length));
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const { data } = await adminApi.upload(files);
      const urls = extractUrls(data);
      onChange(single ? urls.slice(0, 1) : [...images, ...urls]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="uploader">
      {images.map((img, i) => (
        <div key={img + i} className="uploader__item">
          <img src={imageUrl(img)} alt="" />
          <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Remove image"><X size={14} /></button>
        </div>
      ))}
      {images.length < limit || single ? (
        <button type="button" className="uploader__add" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="spin" size={22} /> : <UploadCloud size={22} />}
          <span>{uploading ? 'Uploading…' : single && images.length ? 'Replace' : 'Upload'}</span>
        </button>
      ) : null}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={!single} hidden onChange={onFiles} />
    </div>
  );
}

export function ConfirmButton({ onConfirm, children, message = 'Are you sure?', className = 'icon-btn icon-btn--sm danger', ...rest }) {
  return (
    <button className={className} onClick={() => window.confirm(message) && onConfirm()} {...rest}>
      {children}
    </button>
  );
}
