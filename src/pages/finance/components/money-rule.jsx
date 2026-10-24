import { Info } from 'lucide-react';

export function MoneyRule({ children }) {
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <div className="callout callout-info">
        <Info size={16} />
        <div>{children}</div>
      </div>
    </div>
  );
}
