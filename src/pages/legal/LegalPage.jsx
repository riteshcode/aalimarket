// Shared wrapper for the policy pages
export default function LegalPage({ title, updated, children }) {
  return (
    <div className="page container narrow">
      <article className="card legal">
        <h1>{title}</h1>
        {updated && <p className="muted small">Last updated: {updated}</p>}
        {children}
      </article>
    </div>
  );
}
