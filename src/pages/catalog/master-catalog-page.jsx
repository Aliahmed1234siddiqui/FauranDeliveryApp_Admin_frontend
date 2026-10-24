import { useState } from 'react';
import {
  Eye,
  FileSpreadsheet,
  FolderTree,
  LibraryBig,
  List,
  Pencil,
  Plus,
  Store,
  Trash2,
} from 'lucide-react';

import { DataTable, Pagination } from '@/components/data-table';
import { ConfirmDialog, Menu } from '@/components/overlays';
import {
  Badge,
  Button,
  Card,
  Code,
  EmptyState,
  Identity,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatusBadge,
} from '@/components/ui';
import { useAuth } from '@/context';
import { useAction, useApi, useList } from '@/hooks';
import { useQueryState } from '@/router';
import { categoriesApi, masterCatalogApi } from '@/services/api';
import { date, money, num } from '@/utils/format';

import { categoryOptions, imageThumb, priceRange } from './catalog-utils';
import { BulkImport } from './components/master-bulk-import';
import { MasterDetail } from './components/master-detail';
import { MasterForm } from './components/master-form';
import { TreeView } from './components/master-tree-view';

const FILTERS = ['category', 'isActive'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MasterCatalog() {
  const { can } = useAuth();
  const editable = can('catalog');
  const [view, setView] = useQueryState('view', 'list');
  const list = useList(masterCatalogApi.list, FILTERS, { limit: 10 });
  const categories = useApi(() => categoriesApi.list(), [], { key: 'categories' });
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [run, pending] = useAction();
  const [treeKey, setTreeKey] = useState(0);
  const refresh = () => {
    list.reload();
    setTreeKey((k) => k + 1);
  };

  const edit = (m) => {
    setViewing(null);
    setEditing(m);
  };
  const remove = () =>
    run(() => masterCatalogApi.remove(deleting._id), { success: 'Removed from the master catalog' })
      .then(() => {
        setViewing(null);
        refresh();
      })
      .catch(() => {})
      .finally(() => setDeleting(null));

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (m) => (
        <Identity
          icon={imageThumb(m)}
          name={m.name}
          sub={[m.brand, m.unit].filter(Boolean).join(' · ') || undefined}
        />
      ),
    },
    { key: 'id', header: 'Catalog id', hideOnMobile: true, render: (m) => <Code>{m.catalogId}</Code> },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (m) => m.category?.name || '—' },
    {
      key: 'price',
      header: 'Suggested',
      align: 'right',
      render: (m) =>
        m.suggestedPrice != null ? (
          <span className="cell-strong">{money(m.suggestedPrice)}</span>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: 'range',
      header: 'Store prices',
      align: 'right',
      hideOnMobile: true,
      render: (m) => priceRange(m.priceRange),
    },
    {
      key: 'stores',
      header: 'Sold by',
      render: (m) => (
        <span className="row" style={{ gap: 5 }}>
          <Store size={13} className="muted" />
          {num(m.storeCount)} stores
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <StatusBadge status={m.isActive ? 'active' : 'inactive'} />,
    },
    { key: 'added', header: 'Added', hideOnMobile: true, render: (m) => date(m.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (m) => (
        <Menu
          items={[
            { label: 'View listings', icon: Eye, onClick: () => setViewing(m) },
            editable && { label: 'Edit', icon: Pencil, onClick: () => setEditing(m) },
            editable && 'divider',
            editable && { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleting(m) },
          ]}
        />
      ),
    },
  ];

  const filtered = list.search || Object.values(list.filters).some((v) => v !== 'all');

  return (
    <>
      <PageHeader
        title="Master catalog"
        description="The standard list of products stores choose from. One clean record per product keeps search, pricing and reports consistent."
        actions={
          editable && (
            <>
              <Button variant="secondary" icon={FileSpreadsheet} onClick={() => setBulk(true)}>
                Bulk import
              </Button>
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Add item
              </Button>
            </>
          )
        }
      />
      <div className="row row-wrap mb">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'List', icon: List },
            { value: 'tree', label: 'Category tree', icon: FolderTree },
          ]}
        />
        <span className="spacer" />
        {!editable && <Badge tone="info">Read-only · you have products access</Badge>}
      </div>

      {view === 'tree' ? (
        <Card>
          <div className="row mb">
            <SearchInput
              value={list.search}
              onChange={list.setSearch}
              placeholder="Filter items in the tree"
              className="spacer"
            />
            <Select
              value={list.filters.isActive}
              onChange={(v) => list.setFilter('isActive', v)}
              options={[
                { value: 'all', label: 'Any status' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </div>
          <TreeView key={treeKey} search={list.search} isActive={list.filters.isActive} onOpen={setViewing} />
        </Card>
      ) : (
        <Card className="table-card" padded={false}>
          <div className="toolbar">
            <SearchInput
              value={list.search}
              onChange={list.setSearch}
              placeholder="Name, brand, barcode or catalog id"
            />
            <div className="spacer" />
            <Select
              value={list.filters.category}
              onChange={(v) => list.setFilter('category', v)}
              options={[{ value: 'all', label: 'All categories' }, ...categoryOptions(categories.data || [])]}
            />
            <Select
              value={list.filters.isActive}
              onChange={(v) => list.setFilter('isActive', v)}
              options={[
                { value: 'all', label: 'Any status' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </div>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            onRowClick={setViewing}
            empty={
              <EmptyState
                icon={LibraryBig}
                title={filtered ? 'No master items match' : 'No master items yet'}
                description={
                  filtered
                    ? 'Try a different search or clear the filters.'
                    : 'Add items one by one or import a CSV.'
                }
                action={
                  editable &&
                  !filtered && (
                    <Button icon={Plus} onClick={() => setCreating(true)}>
                      Add item
                    </Button>
                  )
                }
              />
            }
          />
          <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
        </Card>
      )}

      {viewing && (
        <MasterDetail
          key={viewing._id}
          item={viewing}
          editable={editable}
          onClose={() => setViewing(null)}
          onEdit={edit}
          onDelete={setDeleting}
        />
      )}
      <MasterForm
        open={creating || !!editing}
        item={editing}
        categories={categories.data || []}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={refresh}
      />
      <BulkImport open={bulk} onClose={() => setBulk(false)} onDone={refresh} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={pending}
        icon={Trash2}
        title={`Delete ${deleting?.name}?`}
        description={
          deleting?.storeCount
            ? `${num(deleting.storeCount)} stores sell this item, so it can't be deleted until those listings are removed. Make it inactive to stop new listings instead.`
            : 'No store sells this item. This cannot be undone.'
        }
        confirmLabel="Delete"
      />
    </>
  );
}
