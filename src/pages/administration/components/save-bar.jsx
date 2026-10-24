import { Save } from 'lucide-react';

import { Button } from '@/components/ui';

export function SaveBar({ dirty, saving, onSave, onReset, blocked }) {
  if (!dirty) return null;
  return (
    <div className="save-bar">
      <span>{blocked ? 'Fix the highlighted fields to save' : 'You have unsaved changes'}</span>
      <span className="spacer" />
      <Button variant="ghost" size="sm" onClick={onReset}>
        Discard
      </Button>
      <Button variant="accent" size="sm" icon={Save} loading={saving} disabled={blocked} onClick={onSave}>
        Save changes
      </Button>
    </div>
  );
}
