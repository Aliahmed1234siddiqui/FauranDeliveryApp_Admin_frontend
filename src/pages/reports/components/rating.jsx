import { Star } from 'lucide-react';

export const Rating = ({ value }) => (
  <span className="row" style={{ gap: 4 }}>
    <Star size={13} fill="var(--accent)" color="var(--accent)" />
    {value ? Number(value).toFixed(1) : '—'}
  </span>
);
