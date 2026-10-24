import { useState } from 'react';
import {
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

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
import { useAuth } from '@/context';
import { useAction, useApi, useList } from '@/hooks';
import { paths, useQueryState, useRouter } from '@/router';
import { categoriesApi, productsApi, vendorsApi } from '@/services/api';
import { money, num } from '@/utils/format';

import { categoryOptions, imageThumb, masterIdOf } from './catalog-utils';
import { ProductForm } from './components/product-form';
import { useCounts } from './hooks/use-product-counts';

// Filter keys are sent to GET /admin/products as-is.
const FILTERS = ['approval', 'isActive', 'stock', 'vendorId', 'category'];

export default function Products() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const list = useList(productsApi.list, FILTERS, { limit: 10 });
  const [isNew, setIsNew] = useQueryState('new');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [run, pending] = useAction();
  const vendors = useApi(() => vendorsApi.list({ status: 'approved', limit: 500 }), [], {
    key: 'approved-vendors',
  });
  const categories = useApi(() => categoriesApi.list(), [], { key: 'categories' });
  const counts = useCounts();
  const c = counts.data;
  const refresh = () => {
    list.reload();
    counts.reload();
  };

  const approve = (p) =>
    run(() => productsApi.setApproval(p._id, true), { success: `${p.name} approved` })
      .then(refresh)
      .catch(() => {});
  const reject = (reason) =>
    run(() => productsApi.setApproval(rejecting._id, false, reason), {
      success: 'Listing rejected. The store has been notified.',
    })
      .then(() => {
        setRejecting(null);
        refresh();
      })
      .catch(() => {});
  const toggleActive = (p) =>
    run(() => productsApi.update(p._id, { isActive: !p.isActive }), {
      success: p.isActive ? `${p.name} hidden` : `${p.name} is visible again`,
    })
      .then(refresh)
      .catch(() => {});
  const remove = () =>
    run(() => productsApi.remove(deleting._id), { success: 'Product deleted' })
      .then(() => {
        setDeleting(null);
        refresh();
      })
      .catch(() => {});

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <Identity
          icon={imageThumb(p)}
          name={p.name}
          sub={
            <>
              {p.unit && `${p.unit} · `}
              <span style={{ fontFamily: 'var(--mono)' }}>{p.productId}</span>
            </>
          }
        />
      ),
    },
    {
      key: 'vendor',
      header: 'Store',
      hideOnMobile: true,
      render: (p) => (
        <>
          <span className="cell-strong">{p.vendor?.storeName || '—'}</span>
          <span className="cell-sub">{p.vendor?.vendorId}</span>
        </>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideOnMobile: true,
      render: (p) => (
        <>
          <span>{p.category?.name || '—'}</span>
          {masterIdOf(p) && <span className="cell-sub">Master catalog item</span>}
        </>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p) =>
        p.discountPrice ? (
          <>
            <span className="cell-strong">{money(p.discountPrice)}</span>
            <span className="cell-sub" style={{ textDecoration: 'line-through' }}>
              {money(p.price)}
            </span>
          </>
        ) : (
          <span className="cell-strong">{money(p.price)}</span>
        ),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => (p.stock === 0 ? <Badge tone="danger">Out</Badge> : num(p.stock)),
    },
    {
      key: 'status',
      header: 'Listing',
      render: (p) => (
        <div className="row" style={{ gap: 4 }}>
          <StatusBadge status={p.isApproved ? 'approved' : 'pending'} />
          {!p.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {!p.isApproved && (
            <>
              <Button size="sm" variant="soft" icon={Check} onClick={() => approve(p)}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={X}
                onClick={() => setRejecting(p)}
                aria-label="Reject"
              />
            </>
          )}
          <Menu
            items={[
              { label: 'Edit product', icon: Pencil, onClick: () => setEditing(p) },
              p.isApproved && { label: 'Withdraw approval', icon: X, onClick: () => setRejecting(p) },
              {
                label: p.isActive ? 'Hide from app' : 'Show in app',
                icon: p.isActive ? EyeOff : Eye,
                onClick: () => toggleActive(p),
              },
              can('vendors') &&
                p.vendor?.vendorId && {
                  label: 'View store',
                  icon: Package,
                  onClick: () => navigate(paths.vendor(p.vendor.vendorId)),
                },
              'divider',
              { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleting(p) },
            ]}
          />
        </div>
      ),
    },
  ];

  const closeForm = () => {
    setEditing(null);
    setIsNew('');
  };
  const filtered = list.search || Object.values(list.filters).some((v) => v !== 'all');

  return (
    <>
      <PageHeader
        title="Products"
        description="Every product listed by every store. Approve new listings, fix pricing, and keep stock honest."
        actions={
          <Button icon={Plus} onClick={() => setIsNew('1')}>
            Add product
          </Button>
        }
      />
      <div className="stat-grid">
        <StatCard
          icon={Package}
          label="Total listings"
          value={c ? num(c.all) : '–'}
          footer={vendors.data ? `${num(vendors.data.total)} approved stores` : 'Across all stores'}
          onClick={() => list.setFilter('approval', 'all')}
        />
        <StatCard
          icon={CircleAlert}
          tone="amber"
          label="Waiting for approval"
          value={c ? num(c.pending) : '–'}
          footer="Not visible to customers yet"
          onClick={() => list.setFilter('approval', 'pending')}
        />
        <StatCard
          icon={PackageCheck}
          tone="blue"
          label="Low stock"
          value={c ? num(c.low) : '–'}
          footer="At or below the low-stock level"
          onClick={() => list.setFilter('stock', 'low')}
        />
        <StatCard
          icon={PackageX}
          tone="rose"
          label="Out of stock"
          value={c ? num(c.out) : '–'}
          footer="Customers can't order these"
          onClick={() => list.setFilter('stock', 'out')}
        />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented
            value={list.filters.approval}
            onChange={(v) => list.setFilter('approval', v)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending', count: c?.pending },
              { value: 'approved', label: 'Approved' },
            ]}
          />
          <div className="spacer" />
          <Select
            value={list.filters.vendorId}
            onChange={(v) => list.setFilter('vendorId', v)}
            options={[
              { value: 'all', label: 'All stores' },
              ...(vendors.data?.items || []).map((v) => ({ value: v._id, label: v.storeName })),
            ]}
          />
          <Select
            value={list.filters.category}
            onChange={(v) => list.setFilter('category', v)}
            options={[{ value: 'all', label: 'All categories' }, ...categoryOptions(categories.data || [])]}
          />
          <Select
            value={list.filters.isActive}
            onChange={(v) => list.setFilter('isActive', v)}
            options={[
              { value: 'all', label: 'Any visibility' },
              { value: 'true', label: 'Visible' },
              { value: 'false', label: 'Hidden' },
            ]}
          />
          <Select
            value={list.filters.stock}
            onChange={(v) => list.setFilter('stock', v)}
            options={[
              { value: 'all', label: 'Any stock' },
              { value: 'low', label: 'Low stock' },
              { value: 'out', label: 'Out of stock' },
            ]}
          />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Name or PRD id" />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={setEditing}
          rowClassName={(p) => (p.isApproved ? '' : 'row-attention')}
          empty={
            <EmptyState
              icon={Package}
              title={filtered ? 'No products match' : 'No products yet'}
              description={
                filtered
                  ? 'Try a different search or clear the filters.'
                  : 'Products appear here once stores list them.'
              }
              action={
                !filtered && (
                  <Button icon={Plus} onClick={() => setIsNew('1')}>
                    Add product
                  </Button>
                )
              }
            />
          }
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>

      <ProductForm
        open={!!editing || isNew === '1'}
        product={editing}
        onClose={closeForm}
        onSaved={refresh}
        vendors={vendors.data?.items}
        categories={categories.data || []}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={pending}
        title={`Delete ${deleting?.name}?`}
        description="The listing is removed for good. Past orders keep their copy of the product. To take it off the app but keep it, hide it instead."
        confirmLabel="Delete product"
        icon={Trash2}
      />
      <ConfirmDialog
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={reject}
        loading={pending}
        title={rejecting?.isApproved ? 'Withdraw approval?' : 'Reject this listing?'}
        description="The listing stays hidden from customers. The store sees your reason and can fix it."
        confirmLabel="Reject listing"
        reason
        reasonRequired
        reasonPlaceholder="e.g. Photos don't match the product"
      />
    </>
  );
}
