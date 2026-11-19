import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import StaffLogin from '../components/StaffLogin';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import RiderInstall from './RiderInstall';

export default function RiderLogin() {
  const { saveLogin, isRider } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isRider) return <Navigate to="/rider" replace />;

  function onVerified(data) {
    if (data?.user?.role !== 'rider') {
      setError(t('This account isn’t a delivery partner. Ask the store for your rider login.'));
      return;
    }
    saveLogin('rider', data);
    navigate('/rider', { replace: true });
  }

  return (
    <div className="auth auth--admin">
      <div className="auth__panel">
        <Logo to="/rider/login" sub={t('Delivery partner')} />
        <h1>{t('Rider log in')}</h1>
        <p className="muted">{t('Use the username and password the store gave you.')}</p>
        <StaffLogin
          onVerified={onVerified}
          labels={{
            username: t('Username'),
            password: t('Password'),
            submit: t('Log in'),
            busy: t('Checking…'),
            show: t('Show password'),
            lockedFor: t('Locked. Try again in {m} minutes.'),
          }}
        />
        <p className="muted small">{t('Forgot your password? Ask the store to reset it.')}</p>
        {error && <p className="form-error">{error}</p>}
        <RiderInstall />
      </div>
    </div>
  );
}
