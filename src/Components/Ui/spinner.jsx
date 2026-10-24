import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="spin" />;
}
