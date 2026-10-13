import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Pencil, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { adminApi } from '../services/adminApi';
import { timeAgo } from '../lib/format';
import { Badge, Button, Card, Field, Identity, Input, PageHeader, SearchInput, StatCard, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog, Drawer, Menu } from '../ui/overlays';
import DataTable from '../ui/DataTable';

const EMPTY = { name: '', email: '', phone: '', designation: '', password: '', permissions: [], isActive: true };
const PRESETS = [
  { label: 'Operations', perms: ['dashboard', 'vendors', 'riders', 'orders', 'customers'] },
  { label: 'Support', perms: ['orders', 'customers'] },
  { label: 'Finance', perms: ['dashboard', 'payments', 'reports'] },
  { label: 'Catalog', perms: ['products', 'catalog', 'inventory'] },
];

// POST /admin/employees  { name, email, phone, password, designation, permissions }
// PUT  /admin/employees/:id
const toForm = (e) => (e ? { ...EMPTY, ...e, password: '' } : EMPTY);

function EmployeeForm(props) {
  return props.open ? <EmployeeFormBody key={props.employee?._id || 'new'} {...props} /> : null;
}

function EmployeeFormBody({ employee, permissions, onClose, onSaved }) {
  const [initial] = useState(() => toForm(employee));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [run, pending] = useAction();

  // Fetch the full record when editing (GET /admin/employees/:id), unless already being edited.
  useEffect(() => {
    if (!employee) return undefined;
    let live = true;
    adminApi.getEmployeeById(employee._id).then((e) => live && setForm((f) => (f === initial ? toForm(e) : f))).catch(() => {});
    return () => { live = false; };
  }, [employee, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const togglePerm = (key) => setForm((f) => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key] }));

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Enter a valid email';
    if (!form.phone.trim()) err.phone = 'Phone is required';
    if (!employee && form.password.length < 8) err.password = 'At least 8 characters';
    if (employee && form.password && form.password.length < 8) err.password = 'At least 8 characters';
    if (!form.permissions.length) err.permissions = 'Give at least one permission, or the employee will see nothing';
    setErrors(err);
    if (Object.keys(err).length) return;
    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), designation: form.designation, permissions: form.permissions, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) };
    run(() => (employee ? adminApi.updateEmployee(employee._id, payload) : adminApi.createEmployee(payload)), { success: employee ? 'Employee updated' : `${payload.name} can now sign in` })
      .then(() => { onSaved(); onClose(); }).catch(() => {});
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={640}
      title={employee ? `Edit ${employee.name}` : 'Add an employee'}
      subtitle={employee ? `${employee.employeeId} · last seen ${timeAgo(employee.lastLoginAt)}` : 'Employees are sub-admins. They only see the pages you allow.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="emp-form" icon={Check} loading={pending}>{employee ? 'Save changes' : 'Create employee'}</Button></>}
    >
      <form id="emp-form" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="form-section-title">Account</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Full name" required error={errors.name}>{(id) => <Input id={id} value={form.name} onChange={set('name')} placeholder="Sana Khan" autoFocus={!employee} />}</Field>
            <Field label="Designation">{(id) => <Input id={id} value={form.designation} onChange={set('designation')} placeholder="Operations Lead" />}</Field>
            <Field label="Work email" required error={errors.email}>{(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} placeholder="name@fauran.pk" />}</Field>
            <Field label="Phone" required error={errors.phone}>{(id) => <Input id={id} value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" />}</Field>
            <Field label={employee ? 'Reset password' : 'Temporary password'} required={!employee} error={errors.password} hint={employee ? 'Leave blank to keep the current password' : 'Share it securely. They can change it after signing in.'} className="span-2">
              {(id) => (
                <div className="input-group">
                  <span className="input-affix"><KeyRound size={15} /></span>
                  <input id={id} className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password visibility">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              )}
            </Field>
            <div className="span-2"><Toggle label="Account active" description="Inactive employees can't sign in." checked={form.isActive} onChange={set('isActive')} /></div>
          </div>
        </div>
        <div className="form-section">
          <div className="row row-wrap" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="form-section-title">Page access</div>
              <p className="form-section-desc" style={{ marginBottom: 0 }}>{form.permissions.length} of {permissions.length} pages · matches the backend permission checks</p>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <Button size="sm" variant="ghost" type="button" onClick={() => setForm((f) => ({ ...f, permissions: permissions.map((p) => p.key) }))}>All</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setForm((f) => ({ ...f, permissions: [] }))}>None</Button>
            </div>
          </div>
          <div className="row row-wrap" style={{ gap: 6, margin: '12px 0' }}>
            <span className="muted" style={{ fontSize: 12.5 }}>Presets:</span>
            {PRESETS.map((p) => <button type="button" key={p.label} className="chip chip-add" onClick={() => setForm((f) => ({ ...f, permissions: p.perms }))}>{p.label}</button>)}
          </div>
          {errors.permissions && <p className="field-error" style={{ marginBottom: 10 }}>{errors.permissions}</p>}
          <div className="perm-grid">
            {permissions.map((p) => {
              const on = form.permissions.includes(p.key);
              return (
                <label key={p.key} className={`perm ${on ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => togglePerm(p.key)} />
                  <div><strong>{p.label}</strong><small>{p.description}</small></div>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </Drawer>
  );
}

export default function Employees() {
  const { navigate } = useRouter();
  const { setPreviewAs } = useAuth();
  const [isNew, setIsNew] = useQueryState('new');
  const [search, setSearch] = useState('');
  const [weekAgo] = useState(() => Date.now() - 7 * 864e5);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, loading, reload } = useApi(() => adminApi.getEmployees({ search }), [search]);
  const perms = useApi(() => adminApi.getPermissionList(), []);
  const [run, pending] = useAction();
  const permLabel = Object.fromEntries((perms.data || []).map((p) => [p.key, p.label]));
  const rows = data?.items || [];

  const remove = () => run(() => adminApi.deleteEmployee(deleting._id), { success: `${deleting.name} removed` }).then(() => { setDeleting(null); reload(); }).catch(() => {});
  const toggleActive = (e) => run(() => adminApi.updateEmployee(e._id, { isActive: !e.isActive }), { success: e.isActive ? 'Access paused' : 'Access restored' }).then(reload).catch(() => {});

  const columns = [
    { key: 'name', header: 'Employee', render: (e) => <Identity name={e.name} sub={e.email} /> },
    { key: 'role', header: 'Designation', hideOnMobile: true, render: (e) => <><span className="cell-strong">{e.designation || '—'}</span><span className="cell-sub">{e.employeeId}</span></> },
    {
      key: 'perms',
      header: 'Access',
      render: (e) => (
        <div className="perm-chips">
          {e.permissions.slice(0, 3).map((p) => <Badge key={p} tone="brand">{permLabel[p] || p}</Badge>)}
          {e.permissions.length > 3 && <Badge>+{e.permissions.length - 3}</Badge>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.isActive ? 'active' : 'inactive'} /> },
    { key: 'last', header: 'Last sign-in', hideOnMobile: true, render: (e) => (e.lastLoginAt ? timeAgo(e.lastLoginAt) : <span className="muted">Never</span>) },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <Menu items={[
          { label: 'Edit access', icon: Pencil, onClick: () => setEditing(e) },
          { label: 'Preview as this employee', icon: Eye, onClick: () => { setPreviewAs(e); navigate('/'); } },
          { label: e.isActive ? 'Pause access' : 'Restore access', icon: ShieldCheck, onClick: () => toggleActive(e) },
          'divider',
          { label: 'Remove employee', icon: Trash2, tone: 'danger', onClick: () => setDeleting(e) },
        ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Employees" description="Sub-admins and the pages each one can open. Super admins always have full access." actions={<Button icon={UserPlus} onClick={() => setIsNew('1')}>Add employee</Button>} />
      <div className="stat-grid">
        <StatCard icon={Users} label="Employees" value={rows.length || '–'} footer={`${rows.filter((e) => e.isActive).length} active`} />
        <StatCard icon={ShieldCheck} tone="violet" label="Permission areas" value={perms.data?.length || '–'} footer="Each maps to a set of admin routes" />
        <StatCard icon={Eye} tone="blue" label="Signed in this week" value={rows.filter((e) => e.lastLoginAt && new Date(e.lastLoginAt) > Math.min(weekAgo, new Date('2026-10-06').getTime())).length} footer="Based on last sign-in" />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Search name, email or designation" /></div>
        <DataTable columns={columns} rows={data?.items} loading={loading} onRowClick={setEditing} />
      </Card>
      <EmployeeForm open={!!editing || isNew === '1'} employee={editing} permissions={perms.data || []} onClose={() => { setEditing(null); setIsNew(''); }} onSaved={reload} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={pending} icon={Trash2} title={`Remove ${deleting?.name}?`} description="They'll be signed out and lose all access to the admin portal. This can't be undone." confirmLabel="Remove employee" />
    </>
  );
}
