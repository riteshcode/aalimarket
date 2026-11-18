import { Link } from 'react-router-dom';

export default function Logo({ to = '/', sub }) {
  return (
    <Link to={to} className="logo" aria-label="Aali Market home">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <path d="M18 46 30 16h4l12 30h-6l-3-8H27l-3 8z" fill="#fff" />
        <path d="M29 33h6l-3-8z" fill="currentColor" />
        <circle cx="47" cy="17" r="6" fill="#F4B400" />
      </svg>
      <span className="logo__text">
        Aali Market
        {sub && <small>{sub}</small>}
      </span>
    </Link>
  );
}
