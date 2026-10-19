import { useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Lock, Pencil, ShieldCheck, ShieldOff, Trash2, UserPlus, Users } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useList } from '../lib/useList';
import { accountApi, employeesApi } from '../services/api';
import { withAll } from '../lib/constants';
import { date, timeAgo, titleCase } from '../lib/format';
import { Badge, Button, Card, EmptyState, Field, Identity, Input, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog, Drawer, Menu } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';

const EMPTY = { name: '', email: '', phone: '', designation: '', password: '', permissions: [], isActive: true };
const PRESETS = [
  { label: 'Operations', perms: ['dashboard', 'vendors', 'riders', 'orders', 'customers'] },
  { label: 'Support', perms: ['orders', 'customers'] },
  { label: 'Finance', perms: ['dashboard', 'payments', 'reports'] },
  { label: 'Catalog', perms: ['products', 'catalog', 'inventory'] },
];
const FIELDS = ['name', 'email', 'phone', 'designation', 'isActive'];

const toForm = (e) => (e ? { ...EMPTY, ...e, designation: e.designation || '', permissions: e.permissions || [], password: '' } : EMPTY);
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function validate(form, isNew) {
  const err = {};
  if (!form.name.trim()) err.name = 'Name is required';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Enter a valid email';
  if (!form.phone.trim()) err.phone = 'Phone is required';
  if ((isNew || form.password) && form.password.length < 8) err.password = 'At least 8 characters';
  if (!form.permissions.length) err.permissions = 'Give at least one permission, or the employee will see nothing';
  return err;
}

// PUT only sends what changed (a new password or deactivation logs them out).
function changes(form, initial) {
  const payload = {};
  FIELDS.forEach((k) => {
    const v = typeof form[k] === 'string' ? form[k].trim() : form[k];
    if (v !== initial[k]) payload[k] = v;
  });
  if (!sameSet(form.permissions, initial.permissions)) payload.permissions = form.permissions;
  if (form.password) payload.password = form.password;
  return payload;
}

function PasswordField({ value, onChange, isNew, error }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={isNew ? 'Temporary password' : 'Reset password'} required={isNew} error={error} hint={isNew ? 'Share it securely. They can change it after signing in.' : 'Leave blank to keep the current password. Setting one signs them out.'} className="span-2">
      {(id) => (
        <div className="input-group">
          <span className="input-affix"><KeyRound size={15} /></span>
          <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder="At least 8 characters" autoComplete="new-password" />
          <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
      )}
    </Field>
  );
}

// Checkbox grid from GET /admin/permissions. You can only grant permissions you have yourself.
function PermissionPicker({ permissions, value, onChange, canGrant, locked, error }) {
  const grantable = permissions.filter((p) => canGrant(p.key)).map((p) => p.key);
  const toggle = (key) => onChange(value.includes(key) ? value.filter((p) => p !== key) : [...value, key]);
  return (
    <div className="form-section">
      <div className="row row-wrap" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="form-section-title">Page access</div>
          <p className="form-section-desc" style={{ marginBottom: 0 }}>
            {locked ? "You can't change your own permissions. Ask another admin." : `${value.length} of ${permissions.length} permissions · you can only grant ones you have`}
          </p>
        </div>
        {!locked && (
          <div className="row" style={{ gap: 4 }}>
            <Button size="sm" variant="ghost" type="button" onClick={() => onChange([...new Set([...value.filter((k) => !canGrant(k)), ...grantable])])}>All</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => onChange(value.filter((k) => !canGrant(k)))}>None</Button>
          </div>
        )}
      </div>
      {!locked && (
        <div className="row row-wrap" style={{ gap: 6, margin: '12px 0' }}>
          <span className="muted" style={{ fontSize: 12.5 }}>Presets:</span>
          {PRESETS.map((p) => <button type="button" key={p.label} className="chip chip-add" onClick={() => onChange(p.perms.filter((k) => grantable.includes(k)))}>{p.label}</button>)}
        </div>
      )}
      {error && <p className="field-error" style={{ marginBottom: 10 }}>{error}</p>}
      <div className="perm-grid" style={locked ? { marginTop: 12 } : undefined}>
        {permissions.map((p) => {
          const on = value.includes(p.key);
          const disabled = locked || !canGrant(p.key);
          return (
            <label key={p.key} className={`perm ${on ? 'is-on' : ''}`} style={disabled ? { cursor: 'not-allowed', opacity: 0.6 } : undefined} title={!locked && disabled ? "You don't have this permission, so you can't grant it" : undefined}>
              <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(p.key)} />
              <div><strong>{titleCase(p.key)}</strong><small>{p.description}</small></div>
              {!locked && disabled && <Lock size={14} className="muted" style={{ flex: 'none', marginLeft: 'auto' }} />}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// POST /admin/employees · PUT /admin/employees/:id
function EmployeeForm(props) {
  return props.open ? <EmployeeFormBody key={props.employee?._id || 'new'} {...props} /> : null;
}

function EmployeeFormBody({ employee, permissions, onClose, onSaved }) {
  const { admin } = useAuth();
  const [initial] = useState(() => toForm(employee));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [run, pending] = useAction();
  const isNew = !employee;
  const isSelf = employee?._id === admin?._id;
  const canGrant = (key) => admin?.isSuperAdmin || admin?.permissions?.includes(key);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const submit = (e) => {
    e.preventDefault();
    const err = validate(form, isNew);
    setErrors(err);
    if (Object.keys(err).length) return;
    if (isNew) {
      const { name, email, phone, designation, password } = form;
      const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), designation: designation.trim(), password, permissions: form.permissions };
      run(() => employeesApi.create(payload), { success: `${payload.name} can now sign in` }).then(() => { onSaved(); onClose(); }).catch(() => {});
      return;
    }
    const payload = changes(form, initial);
    if (!Object.keys(payload).length) { onClose(); return; }
    run(() => employeesApi.update(employee._id, payload), { success: 'Employee updated' }).then(() => { onSaved(); onClose(); }).catch(() => {});
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={640}
      title={isNew ? 'Add an employee' : `Edit ${employee.name}`}
      subtitle={isNew ? 'Employees are sub-admins. They only see the pages you allow.' : `${employee.employeeId} · added ${date(employee.createdAt)}${employee.createdBy?.name ? ` by ${employee.createdBy.name}` : ''}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="emp-form" icon={Check} loading={pending}>{isNew ? 'Create employee' : 'Save changes'}</Button></>}
    >
      <form id="emp-form" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="form-section-title">Account</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Full name" required error={errors.name}>{(id) => <Input id={id} value={form.name} onChange={set('name')} placeholder="Sana Khan" autoFocus={isNew} />}</Field>
            <Field label="Designation">{(id) => <Input id={id} value={form.designation} onChange={set('designation')} placeholder="Operations Lead" />}</Field>
            <Field label="Work email" required error={errors.email}>{(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} placeholder="name@fauran.pk" />}</Field>
            <Field label="Phone" required error={errors.phone}>{(id) => <Input id={id} value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" />}</Field>
            <PasswordField value={form.password} onChange={set('password')} isNew={isNew} error={errors.password} />
            {!isNew && !isSelf && <div className="span-2"><Toggle label="Account active" description="Inactive employees can't sign in. Deactivating signs them out." checked={form.isActive} onChange={set('isActive')} /></div>}
          </div>
        </div>
        <PermissionPicker permissions={permissions} value={form.permissions} onChange={set('permissions')} canGrant={canGrant} locked={isSelf} error={errors.permissions} />
      </form>
    </Drawer>
  );
}

const FILTERS = ['status', 'permission'];

export default function Employees() {
  const { navigate } = useRouter();
  const { admin, setPreviewAs } = useAuth();
  const [isNew, setIsNew] = useQueryState('new');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const list = useList(employeesApi.list, FILTERS);
  const perms = useApi(() => accountApi.permissions(), []);
  const [run, pending] = useAction();
  const permissions = perms.data || [];
  const isSelf = (e) => e._id === admin?._id;

  const remove = () => run(() => employeesApi.remove(deleting._id), { success: `${deleting.name} deleted` }).then(() => { setDeleting(null); list.reload(); }).catch(() => {});
  const toggleActive = (e) => run(() => employeesApi.update(e._id, { isActive: !e.isActive }), { success: e.isActive ? `${e.name} deactivated and signed out` : `${e.name} can sign in again` }).then(list.reload).catch(() => {});

  const columns = [
    { key: 'name', header: 'Employee', render: (e) => <Identity name={e.name} sub={e.email} /> },
    { key: 'role', header: 'Designation', hideOnMobile: true, render: (e) => <><span className="cell-strong">{e.designation || '—'}</span><span className="cell-sub">{e.employeeId}</span></> },
    {
      key: 'perms',
      header: 'Access',
      render: (e) => (
        <div className="perm-chips">
          {(e.permissions || []).slice(0, 3).map((p) => <Badge key={p} tone="brand">{titleCase(p)}</Badge>)}
          {e.permissions?.length > 3 && <Badge>+{e.permissions.length - 3}</Badge>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.isActive ? 'active' : 'inactive'} /> },
    { key: 'by', header: 'Added by', hideOnMobile: true, render: (e) => <><span className="cell-strong">{e.createdBy?.name || '—'}</span><span className="cell-sub">{timeAgo(e.createdAt)}</span></> },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <Menu items={[
          { label: isSelf(e) ? 'Edit my details' : 'Edit access', icon: Pencil, onClick: () => setEditing(e) },
          admin?.isSuperAdmin && { label: 'Preview as this employee', icon: Eye, onClick: () => { setPreviewAs(e); navigate('/'); } },
          !isSelf(e) && { label: e.isActive ? 'Deactivate' : 'Activate', icon: e.isActive ? ShieldOff : ShieldCheck, onClick: () => toggleActive(e) },
          !isSelf(e) && 'divider',
          !isSelf(e) && { label: 'Delete employee', icon: Trash2, tone: 'danger', onClick: () => setDeleting(e) },
        ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Employees" description="Sub-admins and the pages each one can open. Super admins always have full access and aren't listed." actions={<Button icon={UserPlus} onClick={() => setIsNew('1')}>Add employee</Button>} />
      <div className="stat-grid">
        <StatCard icon={Users} label="Employees" value={list.loading && !list.data ? '–' : list.total} footer="Matching the current filters" />
        <StatCard icon={ShieldCheck} tone="violet" label="Permission areas" value={perms.data ? permissions.length : '–'} footer="Each maps to a set of admin routes" />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name, email, phone or id" />
          <Segmented value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={withAll('All', ['active', 'inactive'], titleCase)} />
          <div className="spacer" />
          <Select value={list.filters.permission} onChange={(v) => list.setFilter('permission', v)} options={withAll('Any permission', permissions.map((p) => p.key), titleCase)} aria-label="Filter by permission" />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={setEditing}
          empty={<EmptyState icon={Users} title="No employees found" description="Add an employee, or clear the search and filters." />}
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
      <EmployeeForm open={!!editing || isNew === '1'} employee={editing} permissions={permissions} onClose={() => { setEditing(null); setIsNew(''); }} onSaved={list.reload} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={pending}
        icon={Trash2}
        title={`Delete ${deleting?.name}?`}
        description="The account is removed for good and they lose all access. To keep the account and its history, deactivate it instead."
        confirmLabel="Delete employee"
      />
    </>
  );
}
