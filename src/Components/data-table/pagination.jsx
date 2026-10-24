import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const nums = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p += 1) nums.push(p);
  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing{' '}
        <strong>
          {from}–{to}
        </strong>{' '}
        of <strong>{total}</strong>
      </span>
      <div className="pagination-pages">
        <button
          type="button"
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {nums[0] > 1 && (
          <>
            <button type="button" className="page-btn" onClick={() => onPage(1)}>
              1
            </button>
            {nums[0] > 2 && <span className="page-gap">…</span>}
          </>
        )}
        {nums.map((p) => (
          <button
            key={p}
            type="button"
            className={`page-btn ${p === page ? 'is-active' : ''}`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
        {nums[nums.length - 1] < pages && (
          <>
            {nums[nums.length - 1] < pages - 1 && <span className="page-gap">…</span>}
            <button type="button" className="page-btn" onClick={() => onPage(pages)}>
              {pages}
            </button>
          </>
        )}
        <button
          type="button"
          className="page-btn"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
