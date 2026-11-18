import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Star } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { asList, formatDate } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { ConfirmButton } from './AdminUi';

export default function AdminReviews() {
  const { tr } = useLang();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState('');
  const { data, meta, loading, error, reload } = useFetch(() => adminApi.reviews({ page, limit: 20, rating }), [page, rating]);
  const reviews = asList(data);
  const pages = meta?.pages || 1;

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

      <div className="chip-scroll">
        <button className={`chip ${!rating ? 'is-on' : ''}`} onClick={() => { setPage(1); setRating(''); }}>All</button>
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
              <ConfirmButton message="Delete this review? The product rating will be recalculated." onConfirm={() => remove(r)} aria-label="Delete review">
                <Trash2 size={16} />
              </ConfirmButton>
            </div>
            {r.comment ? <p>{r.comment}</p> : <p className="muted">No comment</p>}
            <p className="muted small">{r.user?.name}, {r.user?.mobile}, {formatDate(r.createdAt)}</p>
          </article>
        ))}
      </div>
      {!loading && !error && reviews.length === 0 && <p className="muted">No reviews here.</p>}

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
