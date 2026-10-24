import { ArrowLeft } from 'lucide-react';

import { Link } from '@/router';

export function BackLink({ to, children }) {
  return (
    <Link to={to} className="back-link">
      <ArrowLeft size={15} /> {children}
    </Link>
  );
}
