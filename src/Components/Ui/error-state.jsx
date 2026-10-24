import { X } from 'lucide-react';

import { Button } from './button';

export function ErrorState({ error, onRetry }) {
  return (
    <div className="empty empty-error">
      <span className="empty-icon">
        <X size={22} />
      </span>
      <strong>Couldn&apos;t load this</strong>
      <p>{error?.message || 'The server did not respond.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
