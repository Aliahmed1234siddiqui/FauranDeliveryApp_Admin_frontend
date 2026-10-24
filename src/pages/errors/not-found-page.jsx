import { Compass } from 'lucide-react';

import { Button } from '@/components/ui';
import { paths, useRouter } from '@/router';

export function NotFoundPage() {
  const { navigate } = useRouter();
  return (
    <div className="blank-state">
      <div>
        <span className="big-icon tone-brand">
          <Compass size={30} />
        </span>
        <h1>Page not found</h1>
        <p>The link may be broken or the page may have moved.</p>
        <Button onClick={() => navigate(paths.dashboard())}>Back to dashboard</Button>
      </div>
    </div>
  );
}
