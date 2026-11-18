import { useState } from 'react';

const EMPTY = { label: 'Home', line1: '', line2: '', landmark: '', city: '', state: 'Uttar Pradesh', pincode: '', isDefault: false };

export default function AddressForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Backend schema is strict — don't send id/createdAt/updatedAt back on edit
  function submit(e) {
    e.preventDefault();
    const { label, line1, line2, landmark, city, state, pincode, isDefault } = form;
    onSubmit({ label, line1, line2, landmark, city, state, pincode, isDefault });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field field--full">
        <span className="field__label">Save as</span>
        <div className="seg">
          {['Home', 'Work', 'Other'].map((l) => (
            <button type="button" key={l} className={form.label === l ? 'is-on' : ''} onClick={() => setForm({ ...form, label: l })}>{l}</button>
          ))}
        </div>
      </div>
      <label className="field field--full">
        <span className="field__label">House / street</span>
        <input value={form.line1} onChange={set('line1')} required placeholder="123 MG Road" />
      </label>
      <label className="field field--full">
        <span className="field__label">Area / locality <em>optional</em></span>
        <input value={form.line2} onChange={set('line2')} placeholder="Near Bus Stand" />
      </label>
      <label className="field field--full">
        <span className="field__label">Landmark <em>optional</em></span>
        <input value={form.landmark} onChange={set('landmark')} placeholder="Opposite Petrol Pump" />
      </label>
      <label className="field">
        <span className="field__label">City</span>
        <input value={form.city} onChange={set('city')} required />
      </label>
      <label className="field">
        <span className="field__label">Pincode</span>
        <input value={form.pincode} onChange={set('pincode')} required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} />
      </label>
      <label className="field field--full">
        <span className="field__label">State</span>
        <input value={form.state} onChange={set('state')} required />
      </label>
      <label className="check field--full">
        <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
        Use as my default address
      </label>
      <div className="row-end field--full">
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button>
      </div>
    </form>
  );
}
