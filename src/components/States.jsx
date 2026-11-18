import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LangContext';

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="pgrid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pcard pcard--skeleton">
          <div className="skeleton pcard__media" />
          <div className="pcard__body">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action, to }) {
  return (
    <div className="empty">
      {Icon && <Icon size={44} strokeWidth={1.4} />}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action && to && <Link to={to} className="btn btn--primary">{action}</Link>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useLang();
  return (
    <div className="empty empty--error">
      <AlertTriangle size={40} strokeWidth={1.5} />
      <h2>{t('Couldn’t load this')}</h2>
      <p>{error?.message}</p>
      {onRetry && <button className="btn btn--ghost" onClick={onRetry}>{t('Try again')}</button>}
    </div>
  );
}
