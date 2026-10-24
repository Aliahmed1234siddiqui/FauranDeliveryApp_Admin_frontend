import { useState } from 'react';
import { Eye, Pencil, ShieldCheck, ShieldOff, Trash2, UserPlus, Users } from 'lucide-react';

import { DataTable, Pagination } from '@/components/data-table';
import { ConfirmDialog, Menu } from '@/components/overlays';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Identity,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { withAll } from '@/constants';
import { useAuth } from '@/context';
import { useAction, useApi, useList } from '@/hooks';
import { paths, useQueryState, useRouter } from '@/router';
import { accountApi, employeesApi } from '@/services/api';
import { timeAgo, titleCase } from '@/utils/format';

import { EmployeeForm } from './components/employee-form';

const FILTERS = ['status', 'permission'];

export default function Employees() {
  const { navigate } = useRouter();
  const { admin, setPreviewAs } = useAuth();
  const [isNew, setIsNew] = useQueryState('new');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const list = useList(employeesApi.list, FILTERS);
  const perms = useApi(() => accountApi.permissions(), [], { key: 'permissions' });
  const [run, pending] = useAction();
  const permissions = perms.data || [];
  const isSelf = (e) => e._id === admin?._id;

  const remove = () =>
    run(() => employeesApi.remove(deleting._id), { success: `${deleting.name} deleted` })
      .then(() => {
        setDeleting(null);
        list.reload();
      })
      .catch(() => {});
  const toggleActive = (e) =>
    run(() => employeesApi.update(e._id, { isActive: !e.isActive }), {
      success: e.isActive ? `${e.name} deactivated and signed out` : `${e.name} can sign in again`,
    })
      .then(list.reload)
      .catch(() => {});

  const columns = [
    { key: 'name', header: 'Employee', render: (e) => <Identity name={e.name} sub={e.email} /> },
    {
      key: 'role',
      header: 'Designation',
      hideOnMobile: true,
      render: (e) => (
        <>
          <span className="cell-strong">{e.designation || '—'}</span>
          <span className="cell-sub">{e.employeeId}</span>
        </>
      ),
    },
    {
      key: 'perms',
      header: 'Access',
      render: (e) => (
        <div className="perm-chips">
          {(e.permissions || []).slice(0, 3).map((p) => (
            <Badge key={p} tone="brand">
              {titleCase(p)}
            </Badge>
          ))}
          {e.permissions?.length > 3 && <Badge>+{e.permissions.length - 3}</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'by',
      header: 'Added by',
      hideOnMobile: true,
      render: (e) => (
        <>
          <span className="cell-strong">{e.createdBy?.name || '—'}</span>
          <span className="cell-sub">{timeAgo(e.createdAt)}</span>
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <Menu
          items={[
            {
              label: isSelf(e) ? 'Edit my details' : 'Edit access',
              icon: Pencil,
              onClick: () => setEditing(e),
            },
            admin?.isSuperAdmin && {
              label: 'Preview as this employee',
              icon: Eye,
              onClick: () => {
                setPreviewAs(e);
                navigate(paths.dashboard());
              },
            },
            !isSelf(e) && {
              label: e.isActive ? 'Deactivate' : 'Activate',
              icon: e.isActive ? ShieldOff : ShieldCheck,
              onClick: () => toggleActive(e),
            },
            !isSelf(e) && 'divider',
            !isSelf(e) && {
              label: 'Delete employee',
              icon: Trash2,
              tone: 'danger',
              onClick: () => setDeleting(e),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        description="Sub-admins and the pages each one can open. Super admins always have full access and aren't listed."
        actions={
          <Button icon={UserPlus} onClick={() => setIsNew('1')}>
            Add employee
          </Button>
        }
      />
      <div className="stat-grid">
        <StatCard
          icon={Users}
          label="Employees"
          value={list.loading && !list.data ? '–' : list.total}
          footer="Matching the current filters"
        />
        <StatCard
          icon={ShieldCheck}
          tone="violet"
          label="Permission areas"
          value={perms.data ? permissions.length : '–'}
          footer="Each maps to a set of admin routes"
        />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search name, email, phone or id"
          />
          <Segmented
            value={list.filters.status}
            onChange={(v) => list.setFilter('status', v)}
            options={withAll('All', ['active', 'inactive'], titleCase)}
          />
          <div className="spacer" />
          <Select
            value={list.filters.permission}
            onChange={(v) => list.setFilter('permission', v)}
            options={withAll(
              'Any permission',
              permissions.map((p) => p.key),
              titleCase,
            )}
            aria-label="Filter by permission"
          />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={setEditing}
          empty={
            <EmptyState
              icon={Users}
              title="No employees found"
              description="Add an employee, or clear the search and filters."
            />
          }
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
      <EmployeeForm
        open={!!editing || isNew === '1'}
        employee={editing}
        permissions={permissions}
        onClose={() => {
          setEditing(null);
          setIsNew('');
        }}
        onSaved={list.reload}
      />
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
