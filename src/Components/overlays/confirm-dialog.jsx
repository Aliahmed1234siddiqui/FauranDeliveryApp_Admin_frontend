import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui';

import { Modal } from './modal';

// Confirmation dialog for destructive or irreversible actions. Optionally
// collects a reason (cancel order, reject vendor…) before confirming.
export function ConfirmDialog(props) {
  // Mounting only while open gives every opening a fresh, empty reason box.
  return props.open ? <ConfirmBody {...props} /> : null;
}

function ConfirmBody({
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  icon = AlertTriangle,
  reason,
  reasonLabel = 'Reason',
  reasonPlaceholder,
  reasonRequired,
  loading,
}) {
  const [text, setText] = useState('');
  const disabled = reasonRequired && !text.trim();
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            disabled={disabled}
            onClick={() => onConfirm(text.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {reason && (
        <div className="field">
          <label className="field-label">
            {reasonLabel}
            {reasonRequired && <span className="req">*</span>}
          </label>
          <textarea
            className="input textarea"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={reasonPlaceholder}
            autoFocus
          />
        </div>
      )}
    </Modal>
  );
}
