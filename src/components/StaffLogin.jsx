import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/endpoints';

/**
 * Username + password form for the admin panel and the rider app.
 * onVerified(data) gets { user, accessToken, refreshToken } — the same shape as the customer OTP login.
 * labels: optional translated texts (the rider app passes Hindi via t()).
 */
export default function StaffLogin({ onVerified, labels = {} }) {
  const L = {
    username: 'Username',
    password: 'Password',
    submit: 'Log in',
    busy: 'Checking…',
    show: 'Show password',
    lockedFor: 'Locked. Try again in {m} minutes.',
    ...labels,
  };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await authApi.staffLogin(username.trim().toLowerCase(), password);
      await onVerified(data);
    } catch (err) {
      if (err.code === 'ACCOUNT_LOCKED' && err.details?.retryAfterSeconds) {
        setError(L.lockedFor.replace('{m}', Math.ceil(err.details.retryAfterSeconds / 60)));
      } else {
        setError(err.message);
      }
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="otp" onSubmit={submit}>
      <label className="field">
        <span className="field__label">{L.username}</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
        />
      </label>
      <label className="field">
        <span className="field__label">{L.password}</span>
        <div className="password-input">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={L.show}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn--primary btn--block" disabled={busy || !username || !password}>
        {busy ? L.busy : L.submit}
      </button>
    </form>
  );
}
