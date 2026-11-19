import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Star, Check, X } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { asList, formatDate } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { ConfirmButton } from './AdminUi';

const TABS = [
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

const STATUS_PILL = { pending: 'pill--packed', approved: 'pill--delivered', rejected: 'pill--cancelled' };

export default function AdminReviews() {
  const { tr } = useLang();
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState('');
  const [busyId, setBusyId] = useState(null);
  const { data, meta, loading, error, reload } = useFetch(
    () => adminApi.reviews({ page, limit: 20, rating, status }),
    [page, rating, status]
  );
  const reviews = asList(data);
  const pages = meta?.pages || 1;

  async function moderate(review, nextStatus) {
    // A short reason helps later; customers never see it
    const note = nextStatus === 'rejected' ? window.prompt('Reason for rejecting (only admins see this):', '') : undefined;
    if (note === null) return; // cancelled the prompt
    setBusyId(review.id);
    try {
      const { data: res } = await adminApi.moderateReview(review.id, nextStatus, note?.trim() || undefined);
      toast.success(
        `${nextStatus === 'approved' ? 'Approved' : 'Rejected'}. Rating is now ${res.product.ratingAvg.toFixed(1)} (${res.product.ratingCount})`
      );
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(review) {
    try {
      const { data: res } = await adminApi.deleteReview(review.id);
      toast.success(`Review deleted. Product rating is now ${res.product.ratingAvg.toFixed(1)} (${res.product.ratingCount})`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Reviews</h1>

      <div className="seg seg--tabs">
        {TABS.map((tab) => (
          <button key={tab.value} type="button" className={status === tab.value ? 'is-on' : ''} onClick={() => { setPage(1); setStatus(tab.value); }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="chip-scroll">
        <button className={`chip ${!rating ? 'is-on' : ''}`} onClick={() => { setPage(1); setRating(''); }}>All ratings</button>
        {[1, 2, 3, 4, 5].map((r) => (
          <button key={r} className={`chip ${rating === String(r) ? 'is-on' : ''}`} onClick={() => { setPage(1); setRating(String(r)); }}>
            {r} <Star size={13} />
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      <div className="review-admin-list">
        {reviews.map((r) => (
          <article key={r.id} className="card review-admin">
            <div className="review-admin__top">
              <span className={`rating-badge rating-badge--${r.rating}`}>{r.rating} <Star size={13} /></span>
              <Link to={`/product/${r.product?.slug}`} target="_blank" className="link-btn">{tr(r.product?.title)}</Link>
              <span className={`pill ${STATUS_PILL[r.status]}`}>{r.status}</span>
            </div>
            {r.comment ? <p>{r.comment}</p> : <p className="muted">No comment</p>}
            <p className="muted small">{r.user?.name}, {r.user?.mobile}, {formatDate(r.createdAt)}</p>
            {r.moderationNote && <p className="muted small">Note: {r.moderationNote}</p>}

            <div className="row-end">
              {r.status !== 'approved' && (
                <button className="btn btn--primary btn--sm" onClick={() => moderate(r, 'approved')} disabled={busyId === r.id}>
                  <Check size={16} /> Approve
                </button>
              )}
              {r.status !== 'rejected' && (
                <button className="btn btn--danger-ghost btn--sm" onClick={() => moderate(r, 'rejected')} disabled={busyId === r.id}>
                  <X size={16} /> Reject
                </button>
              )}
              <ConfirmButton message="Delete this review for good? The customer can then write a new one." onConfirm={() => remove(r)} aria-label="Delete review">
                <Trash2 size={16} />
              </ConfirmButton>
            </div>
          </article>
        ))}
      </div>
      {!loading && !error && reviews.length === 0 && (
        <p className="muted">{status === 'pending' ? 'No reviews waiting. All caught up!' : 'No reviews here.'}</p>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
