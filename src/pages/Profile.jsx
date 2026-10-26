import { CalendarDays, CheckCircle2, Hash, Lock, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { accountApi } from '../services/api';
import { NAV_ITEMS } from '../layout/nav';
import { date, titleCase } from '../lib/format';
import { Avatar, Badge, Card, Code, ErrorState, PageHeader, Skeleton } from '../ui/primitives';

function IdentityCard({ me, previewing }) {
  const superAdmin = me.isSuperAdmin && !previewing;
  return (
    <Card className="mb">
      <div className="profile-card">
        <Avatar name={me.name} src={me.profileImage} size="lg" tone="brand" />
        <div>
          <div className="row row-wrap">
            <h2>{me.name}</h2>
            {superAdmin ? <Badge tone="brand" icon={ShieldCheck}>Super admin</Badge> : <Badge>Employee</Badge>}
            {me.designation && <Badge tone="info">{me.designation}</Badge>}
          </div>
          <p>
            <span><Hash size={14} /> <Code>{me.adminId || me.employeeId}</Code></span>
            <span><Mail size={14} /> {me.email}</span>
            {me.phone && <span><Phone size={14} /> {me.phone}</span>}
            {me.createdAt && <span><CalendarDays size={14} /> Since {date(me.createdAt)}</span>}
          </p>
        </div>
      </div>
    </Card>
  );
}

function PermissionTile({ perm, on, onOpen }) {
  const pages = NAV_ITEMS.filter((n) => n.perm.includes(perm.key));
  const target = on && pages[0];
  return (
    <div className={`perm ${on ? 'is-on' : ''}`} style={{ cursor: target ? 'pointer' : 'default' }} onClick={() => target && onOpen(target.to)}>
      {on ? <CheckCircle2 size={18} className="pos" style={{ flex: 'none' }} /> : <Lock size={18} className="muted" style={{ flex: 'none' }} />}
      <div>
        <strong>{titleCase(perm.key)}</strong>
        <small>{perm.description}</small>
        {pages.length > 0 && <small style={{ marginTop: 4 }}>Pages: {pages.map((n) => n.label).join(', ')}</small>}
      </div>
    </div>
  );
}

// GET /admin/me + GET /admin/permissions
export default function Profile() {
  const { can, previewAs } = useAuth();
  const { navigate } = useRouter();
  const me = useApi(() => accountApi.me(), [], { key: 'me' });
  const perms = useApi(() => accountApi.permissions(), [], { key: 'permissions' });
  const m = me.data;
  // While previewing, show the previewed employee's access (what `can` checks); otherwise the real record.
  const has = (key) => (previewAs ? can(key) : Boolean(m && (m.isSuperAdmin || m.permissions?.includes(key))));
  const list = perms.data || [];
  const count = list.filter((p) => has(p.key)).length;

  const subtitle = previewAs
    ? `Showing ${previewAs.name}'s access (preview)`
    : m?.isSuperAdmin ? 'Super admins pass every permission check.' : `You have ${count} of ${list.length}. Ask a super admin if you need more access.`;

  return (
    <>
      <PageHeader title="My profile & access" description="Your account and the parts of the portal you can open." />
      {me.error && !m ? <Card className="mb"><ErrorState error={me.error} onRetry={me.reload} /></Card>
        : !m ? <Skeleton h={140} r={16} className="mb" />
          : <IdentityCard me={m} previewing={!!previewAs} />}
      <Card title="Permissions" subtitle={m || previewAs ? subtitle : undefined}>
        {perms.error && !perms.data ? <ErrorState error={perms.error} onRetry={perms.reload} /> : perms.loading && !perms.data ? <Skeleton h={220} /> : (
          <div className="perm-grid">
            {list.map((p) => <PermissionTile key={p.key} perm={p} on={has(p.key)} onOpen={navigate} />)}
          </div>
        )}
      </Card>
    </>
  );
}
