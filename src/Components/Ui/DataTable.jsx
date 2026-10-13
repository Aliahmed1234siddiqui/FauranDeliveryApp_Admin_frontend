import { ChevronLeft, ChevronRight } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

const PAGE_SIZE = 10;

/**
 * Generic table used by every list page (Orders, Vendors, Riders, Customers).
 * `columns`: [{ key, header, render?(row) }]
 * `data`: full array - pagination is handled client-side here since the admin
 * routes already return filtered result sets that are small enough to page locally.
 */
export default function DataTable({ columns, data, loading, emptyTitle, emptyDescription, page, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs uppercase tracking-wide text-ink-faint">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => (
              <tr key={row._id || row.id || idx} className="border-b border-surface-border last:border-0 hover:bg-surface/60">
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-ink">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <p className="text-xs text-ink-muted">
            Page {currentPage} of {totalPages} &middot; {data.length} total
          </p>
          <div className="flex gap-1">
            <button
              className="btn-secondary !px-2 !py-1"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-secondary !px-2 !py-1"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
