import { useState } from 'react';
import { EyeOff, FolderTree, Layers, Plus, Tags, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/overlays';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Skeleton,
  StatCard,
} from '@/components/ui';
import { useAuth } from '@/context';
import { useAction, useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { categoriesApi } from '@/services/api';
import { num } from '@/utils/format';

import { parentIdOf } from './catalog-utils';
import { CategoryCard } from './components/category-card';
import { CategoryModal } from './components/category-modal';

const deleteHint = (c) => {
  if (!c) return '';
  if (c.subCategoryCount)
    return `It still has ${c.subCategoryCount} sub-categories. Delete or move those first.`;
  if (c.productCount) return `${c.productCount} products use it. Move them to another category first.`;
  return 'This cannot be undone.';
};

export default function Categories() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const editable = can('catalog');
  const { data, loading, error, reload } = useApi(() => categoriesApi.list(), [], { key: 'categories' });
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [run, pending] = useAction();

  const all = data || [];
  const parents = all.filter((c) => !c.parentCategory);
  const subsOf = (id) => all.filter((c) => parentIdOf(c) === id);
  const term = search.trim().toLowerCase();
  const matches = (c) => c.name.toLowerCase().includes(term);
  const shown = parents.filter((p) => !term || matches(p) || subsOf(p._id).some(matches));

  // The server refuses (409) while the category is in use; useAction shows its message.
  const remove = () =>
    run(() => categoriesApi.remove(deleting._id), { success: `${deleting.name} deleted` })
      .then(reload)
      .catch(() => {})
      .finally(() => setDeleting(null));
  const toggleActive = (c) =>
    run(() => categoriesApi.update(c._id, { isActive: !c.isActive }), {
      success: c.isActive ? `${c.name} hidden` : `${c.name} is live`,
    })
      .then(reload)
      .catch(() => {});

  const newButton = editable && (
    <Button icon={Plus} onClick={() => setModal({})}>
      New category
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="The aisles of the store. Organise products into categories and sub-categories that customers browse."
        actions={newButton}
      />
      <div className="stat-grid">
        <StatCard
          icon={Tags}
          label="Categories"
          value={data ? num(parents.length) : '–'}
          footer="Top level"
        />
        <StatCard
          icon={Layers}
          tone="violet"
          label="Sub-categories"
          value={data ? num(all.length - parents.length) : '–'}
          footer="Across all categories"
        />
        <StatCard
          icon={EyeOff}
          tone="amber"
          label="Hidden"
          value={data ? num(all.filter((c) => !c.isActive).length) : '–'}
          footer="Not shown in the customer app"
        />
      </div>
      <div className="row mb">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Find a category or sub-category"
          className="spacer"
        />
        {can('catalog', 'products') && (
          <Button
            variant="secondary"
            icon={FolderTree}
            onClick={() => navigate(paths.masterCatalog({ view: 'tree' }))}
          >
            View catalog tree
          </Button>
        )}
      </div>

      {loading && !data ? (
        <div className="cat-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} h={190} r={16} />
          ))}
        </div>
      ) : error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tags}
            title={term ? 'No categories match' : 'No categories yet'}
            description={term ? 'Try another search.' : 'Create the first category customers will browse.'}
            action={!term && newButton}
          />
        </Card>
      ) : (
        <div className="cat-grid">
          {shown.map((c) => (
            <CategoryCard
              key={c._id}
              category={c}
              subs={subsOf(c._id)}
              editable={editable}
              onEdit={(category) => setModal({ category })}
              onAddSub={(p) => setModal({ parent: p._id })}
              onToggle={toggleActive}
              onDelete={setDeleting}
              onProducts={can('products') ? (p) => navigate(paths.products({ category: p._id })) : undefined}
            />
          ))}
        </div>
      )}

      <CategoryModal state={modal} parents={parents} onClose={() => setModal(null)} onSaved={reload} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={pending}
        icon={Trash2}
        title={`Delete ${deleting?.name}?`}
        description={deleteHint(deleting)}
        confirmLabel="Delete"
      />
    </>
  );
}
