import { useState } from 'react';
import { authApi } from '../api/endpoints';
import { getSession, setSession } from '../api/client';

/**
 * Change password for a staff session (kind = 'admin' | 'rider').
 * The backend signs out every OTHER session and returns a fresh token pair for this one, which we save.
 */
export default function ChangePasswordForm({ kind, onDone, labels = {} }) {
  const L = {
    current: 'Current password',
    next: 'New password',
    hint: 'At least 8 characters, with a letter and a number',
    confirm: 'Repeat new password',
    mismatch: 'The new passwords don’t match.',
    weak: 'Use at least 8 characters with a letter and a number.',
    save: 'Change password',
    saving: 'Saving…',
    ...labels,
  };
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (next !== repeat) return setError(L.mismatch);
    if (next.length < 8 || !/[a-z]/i.test(next) || !/\d/.test(next)) return setError(L.weak);

    setBusy(true);
    try {
      const { data } = await authApi.changePassword(kind, current, next);
      const session = getSession(kind);
      setSession(kind, { ...session, accessToken: data.accessToken, refreshToken: data.refreshToken });
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-sm" onSubmit={submit}>
      <label className="field">
        <span className="field__label">{L.current}</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="field">
        <span className="field__label">{L.next} <em>{L.hint}</em></span>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
      </label>
      <label className="field">
        <span className="field__label">{L.confirm}</span>
        <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn--primary btn--block" disabled={busy}>{busy ? L.saving : L.save}</button>
    </form>
  );
}
