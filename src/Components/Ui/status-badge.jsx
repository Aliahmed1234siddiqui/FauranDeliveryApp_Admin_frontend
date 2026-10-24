import { STATUS } from '@/constants/status';

import { Badge } from './badge';

export function StatusBadge({ status, label }) {
  const [tone, text] = STATUS[status] || ['neutral', status];
  return (
    <Badge tone={tone} dot>
      {label || text}
    </Badge>
  );
}
