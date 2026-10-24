import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Modal } from '@/components/overlays';
import { Button, Field, Segmented } from '@/components/ui';

// delivery_failed -> returned. restock = true puts the items back in stock.
export function ReturnDialog({ order, loading, onClose, onConfirm }) {
  const [restock, setRestock] = useState('true');
  const [note, setNote] = useState('');
  const paidByCard = order.paymentMethod === 'stripe' && order.paymentStatus === 'paid';
  return (
    <Modal
      open
      onClose={onClose}
      icon={RotateCcw}
      size="sm"
      title="Confirm the return?"
      description={`The order will be marked returned.${paidByCard ? ' The card payment then needs a manual refund (products only, delivery fee kept).' : ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={loading} onClick={() => onConfirm(restock === 'true', note.trim())}>
            Confirm return
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <Field label="Condition of the items">
          <Segmented
            value={restock}
            onChange={setRestock}
            options={[
              { value: 'true', label: 'Back in stock' },
              { value: 'false', label: 'Damaged' },
            ]}
          />
        </Field>
        <div className="field">
          <label className="field-label" htmlFor="return-note">
            Note (optional)
          </label>
          <textarea
            id="return-note"
            className="input textarea"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Rider returned the bag sealed"
          />
        </div>
      </div>
    </Modal>
  );
}
