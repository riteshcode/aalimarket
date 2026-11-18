import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { useLang } from '../context/LangContext';

/**
 * Two-step mobile + OTP login, used by both shopper and admin login screens.
 * onVerified(data) receives { accessToken, refreshToken, user }.
 */
export default function OtpLogin({ askName = true, onVerified, defaultMobile = '' }) {
  const { t } = useLang();
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState(defaultMobile);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const codeRef = useRef(null);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    if (step === 'otp') codeRef.current?.focus();
  }, [step]);

  async function sendOtp(e) {
    e?.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError(t('Enter a 10-digit mobile number.'));
    setBusy(true);
    try {
      await authApi.sendOtp(mobile);
      setStep('otp');
      setTimer(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await authApi.verifyOtp(mobile, code.trim(), askName ? name.trim() : '');
      await onVerified(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === 'mobile') {
    return (
      <form onSubmit={sendOtp} className="otp">
        <label className="field">
          <span className="field__label">{t('Mobile number')}</span>
          <div className="phone-input">
            <span>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="98765 43210"
              autoFocus
              required
            />
          </div>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--primary btn--block" disabled={busy}>{busy ? t('Sending…') : t('Send OTP')}</button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="otp">
      <button type="button" className="link-btn" onClick={() => { setStep('mobile'); setCode(''); setError(''); }}>
        <ArrowLeft size={16} /> +91 {mobile}
      </button>

      <label className="field">
        <span className="field__label">{t('Enter the 6-digit OTP')}</span>
        <input
          ref={codeRef}
          className="otp__code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
        />
      </label>

      {askName && (
        <label className="field">
          <span className="field__label">{t('Your name')} <em>{t('for new accounts')}</em></span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ritesh" autoComplete="name" />
        </label>
      )}

      {import.meta.env.DEV && (
        <p className="dev-hint">{t('Dev mode: the OTP is printed in the backend server console.')}</p>
      )}

      {error && <p className="form-error">{error}</p>}
      <button className="btn btn--primary btn--block" disabled={busy || code.length < 4}>{busy ? t('Checking…') : t('Verify and continue')}</button>
      <button type="button" className="link-btn center" disabled={timer > 0 || busy} onClick={sendOtp}>
        {timer > 0 ? t('Resend OTP in {s}s', { s: timer }) : t('Resend OTP')}
      </button>
    </form>
  );
}
