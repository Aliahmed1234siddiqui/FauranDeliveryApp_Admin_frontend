import { useState } from 'react';
import { Check } from 'lucide-react';

import { Drawer } from '@/components/overlays';
import { Button, Field, Input, Toggle } from '@/components/ui';
import { useAuth } from '@/context';
import { useAction } from '@/hooks';
import { employeesApi } from '@/services/api';
import { date } from '@/utils/format';

import { PasswordField } from './password-field';
import { PermissionPicker } from './permission-picker';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  designation: '',
  password: '',
  permissions: [],
  isActive: true,
};

const FIELDS = ['name', 'email', 'phone', 'designation', 'isActive'];

const toForm = (e) =>
  e
    ? { ...EMPTY, ...e, designation: e.designation || '', permissions: e.permissions || [], password: '' }
    : EMPTY;

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function validate(form, isNew) {
  const err = {};
  if (!form.name.trim()) err.name = 'Name is required';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Enter a valid email';
  if (!form.phone.trim()) err.phone = 'Phone is required';
  if ((isNew || form.password) && form.password.length < 8) err.password = 'At least 8 characters';
  if (!form.permissions.length)
    err.permissions = 'Give at least one permission, or the employee will see nothing';
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

// POST /admin/employees · PUT /admin/employees/:id
export function EmployeeForm(props) {
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
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: designation.trim(),
        password,
        permissions: form.permissions,
      };
      run(() => employeesApi.create(payload), { success: `${payload.name} can now sign in` })
        .then(() => {
          onSaved();
          onClose();
        })
        .catch(() => {});
      return;
    }
    const payload = changes(form, initial);
    if (!Object.keys(payload).length) {
      onClose();
      return;
    }
    run(() => employeesApi.update(employee._id, payload), { success: 'Employee updated' })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch(() => {});
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={640}
      title={isNew ? 'Add an employee' : `Edit ${employee.name}`}
      subtitle={
        isNew
          ? 'Employees are sub-admins. They only see the pages you allow.'
          : `${employee.employeeId} · added ${date(employee.createdAt)}${employee.createdBy?.name ? ` by ${employee.createdBy.name}` : ''}`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="emp-form" icon={Check} loading={pending}>
            {isNew ? 'Create employee' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="emp-form" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="form-section-title">Account</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Full name" required error={errors.name}>
              {(id) => (
                <Input
                  id={id}
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Sana Khan"
                  autoFocus={isNew}
                />
              )}
            </Field>
            <Field label="Designation">
              {(id) => (
                <Input
                  id={id}
                  value={form.designation}
                  onChange={set('designation')}
                  placeholder="Operations Lead"
                />
              )}
            </Field>
            <Field label="Work email" required error={errors.email}>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="name@fauran.pk"
                />
              )}
            </Field>
            <Field label="Phone" required error={errors.phone}>
              {(id) => (
                <Input id={id} value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" />
              )}
            </Field>
            <PasswordField
              value={form.password}
              onChange={set('password')}
              isNew={isNew}
              error={errors.password}
            />
            {!isNew && !isSelf && (
              <div className="span-2">
                <Toggle
                  label="Account active"
                  description="Inactive employees can't sign in. Deactivating signs them out."
                  checked={form.isActive}
                  onChange={set('isActive')}
                />
              </div>
            )}
          </div>
        </div>
        <PermissionPicker
          permissions={permissions}
          value={form.permissions}
          onChange={set('permissions')}
          canGrant={canGrant}
          locked={isSelf}
          error={errors.permissions}
        />
      </form>
    </Drawer>
  );
}
