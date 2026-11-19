import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import OtpLogin from '../components/OtpLogin';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { t } = useLang();
  const { saveLogin, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  if (isLoggedIn) return <Navigate to={next} replace />;

  function onVerified(data) {
    saveLogin('customer', data);
    navigate(next, { replace: true });
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <Logo />
        <h1>{t('Log in or sign up')}</h1>
        <p className="muted">{t('We’ll send a one-time code to your mobile. No password needed.')}</p>
        <OtpLogin onVerified={onVerified} />
        <nav className="login-links" aria-label={t('Help and policies')}>
          <Link to="/about">{t('About')}</Link>
          <Link to="/contact">{t('Contact us')}</Link>
          <Link to="/privacy">{t('Privacy Policy')}</Link>
          <Link to="/terms">{t('Terms of Use')}</Link>
          <Link to="/refund-policy">{t('Cancellation and Refunds')}</Link>
        </nav>
      </div>
      <div className="auth__side" aria-hidden="true">
        <div className="auth__price"><span>₹</span>42<s>₹55</s></div>
        <p>{t('Every price shows what you save on MRP.')}</p>
      </div>
    </div>
  );
}
