import { Lock } from 'lucide-react';

import { Button } from '@/components/ui';
import { paths, useRouter } from '@/router';

export function ForbiddenPage() {
  const { navigate } = useRouter();
  return (
    <div className="blank-state">
      <div>
        <span className="big-icon tone-warning">
          <Lock size={30} />
        </span>
        <h1>You don&apos;t have access to this page</h1>
        <p>
          Your account doesn&apos;t include the permission this page needs. Ask a super admin to update your
          access under Employees.
        </p>
        <Button variant="secondary" onClick={() => navigate(paths.profile())}>
          See my permissions
        </Button>
      </div>
    </div>
  );
}
