import { MapPinOff } from 'lucide-react';
import { EmptyState } from '../components/States';
import { useLang } from '../context/LangContext';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="page container">
      <EmptyState icon={MapPinOff} title={t('This page doesn’t exist')} text={t('The link may be old or mistyped.')} action={t('Go to home')} to="/" />
    </div>
  );
}
