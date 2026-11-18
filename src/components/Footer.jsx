import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useStoreInfo } from '../pages/legal/useStoreInfo';

export default function Footer() {
  const { t } = useLang();
  const store = useStoreInfo();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <nav aria-label="Policies">
          <Link to="/about">{t('About')}</Link>
          <Link to="/contact">{t('Contact us')}</Link>
          <Link to="/privacy">{t('Privacy Policy')}</Link>
          <Link to="/terms">{t('Terms of Use')}</Link>
          <Link to="/refund-policy">{t('Cancellation and Refunds')}</Link>
        </nav>
        <p className="muted small">© {new Date().getFullYear()} {store.name}. FSSAI Lic. No. {store.fssai}</p>
      </div>
    </footer>
  );
}
