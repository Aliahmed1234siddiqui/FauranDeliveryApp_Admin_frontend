import { CheckCircle2, Clock, Lock, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { adminApi } from '../services/adminApi';
import { NAV_ITEMS } from '../layout/nav';
import { timeAgo } from '../lib/format';
import { Avatar, Badge, Card, PageHeader, Skeleton } from '../ui/primitives';

// GET /admin/me + GET /admin/permissions
export default function Profile() {
  const { can, previewAs } = useAuth();
  const { navigate } = useRouter();
  const me = useApi(() => adminApi.getMe(), []);
  const perms = useApi(() => adminApi.getPermissionList(), []);
  const m = me.data;

  return (
    <>
      <PageHeader title="My profile & access" description="Your account and the parts of the portal you can open." />
      {!m ? <Skeleton h={140} r={16} /> : (
        <Card className="mb">
          <div className="profile-card">
            <Avatar name={m.name} size="lg" tone="brand" />
            <div>
              <div className="row row-wrap"><h2>{m.name}</h2>{m.isSuperAdmin && !previewAs ? <Badge tone="brand" icon={ShieldCheck}>Super admin</Badge> : <Badge>{m.designation}</Badge>}</div>
              <p>
                <span><Mail size={14} /> {m.email}</span>
                <span><Phone size={14} /> {m.phone}</span>
                <span><Clock size={14} /> Signed in {timeAgo(m.lastLoginAt)}</span>
              </p>
            </div>
          </div>
        </Card>
      )}
      <Card title="Permissions" subtitle={previewAs ? `Showing ${previewAs.name}'s access (preview)` : m?.isSuperAdmin ? 'Super admins pass every permission check.' : 'Ask a super admin if you need more access.'}>
        <div className="perm-grid">
          {(perms.data || []).map((p) => {
            const on = can(p.key);
            const pages = NAV_ITEMS.filter((n) => n.perm.includes(p.key));
            return (
              <div key={p.key} className={`perm ${on ? 'is-on' : ''}`} style={{ cursor: on && pages[0] ? 'pointer' : 'default' }} onClick={() => on && pages[0] && navigate(pages[0].to)}>
                {on ? <CheckCircle2 size={18} className="pos" style={{ flex: 'none' }} /> : <Lock size={18} className="muted" style={{ flex: 'none' }} />}
                <div>
                  <strong>{p.label}</strong>
                  <small>{p.description}</small>
                  {pages.length > 0 && <small style={{ marginTop: 4 }}>Pages: {pages.map((n) => n.label).join(', ')}</small>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
