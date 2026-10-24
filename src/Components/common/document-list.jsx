import { ExternalLink, FileText } from 'lucide-react';

import { EmptyState } from '@/components/ui';

// Uploaded documents (CNIC, licence, …) arrive as plain Cloudinary links.
export function DocumentList({ documents = [] }) {
  if (!documents.length)
    return (
      <EmptyState
        icon={FileText}
        title="No documents uploaded"
        description="Documents appear here once they are uploaded from the app."
      />
    );
  return (
    <div className="doc-list">
      {documents.map((url, i) => (
        <a key={url} className="doc" href={url} target="_blank" rel="noreferrer">
          <FileText size={16} />
          <span>
            Document {i + 1}
            {/\.pdf(\?|$)/i.test(url) ? ' (PDF)' : ''}
          </span>
          <ExternalLink size={14} className="muted" />
        </a>
      ))}
    </div>
  );
}
