import { useState } from 'react';
import { Check, EyeOff, FolderTree, Layers, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { categoriesApi } from '../services/api';
import { num } from '../lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, SearchInput, Skeleton, StatCard, Toggle } from '../ui/primitives';
import { ConfirmDialog, Menu, Modal } from '../ui/overlays';
import ImageUpload from '../ui/ImageUpload';
import { fileUrl } from '../config';

const parentIdOf = (c) => c.parentCategory?._id || '';

const toForm = (c, parent = '') => (c
  ? { name: c.name, parentCategory: parentIdOf(c), isActive: c.isActive }
  : { name: '', parentCategory: parent, isActive: true });

// POST /admin/categories & PUT /admin/categories/:id (multipart only when an `image` is picked)
function CategoryModal(props) {
  return props.state ? <CategoryModalBody key={props.state.category?._id || props.state.parent || 'new'} {...props} /> : null;
}

function CategoryModalBody({ state, parents, onClose, onSaved }) {
  const editing = state.category;
  const [form, setForm] = useState(() => toForm(editing, state.parent));
  const [file, setFile] = useState([]);
  const [error, setError] = useState('');
  const [run, pending] = useAction();

  const isSub = !!form.parentCategory;
  // A category that has sub-categories can't itself become one.
  const canMove = !editing?.subCategoryCount;
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Give the category a name');
    const payload = { name: form.name.trim(), isActive: form.isActive, image: file[0] };
    // '' clears the parent on update; on create it's simply left out.
    if (editing) payload.parentCategory = form.parentCategory;
    else if (form.parentCategory) payload.parentCategory = form.parentCategory;
    return run(() => (editing ? categoriesApi.update(editing._id, payload) : categoriesApi.create(payload)), { success: editing ? 'Category updated' : `${isSub ? 'Sub-category' : 'Category'} created` })
      .then(() => { onSaved(); onClose(); }).catch(() => {});
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={isSub ? Layers : Tags}
      title={editing ? `Edit ${editing.name}` : isSub ? 'New sub-category' : 'New category'}
      description={isSub ? 'Sub-categories group products inside a parent category.' : 'Top-level categories appear on the home screen of the customer app.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="cat-form" icon={Check} loading={pending}>{editing ? 'Save' : 'Create'}</Button></>}
    >
      <form id="cat-form" className="stack" onSubmit={submit}>
        <Field label="Name" required error={error}>{(id) => <Input id={id} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isSub ? 'e.g. Frozen snacks' : 'e.g. Frozen foods'} />}</Field>
        <Field label="Parent category" hint={canMove ? 'Leave empty for a top-level category' : 'It has sub-categories, so it stays top-level'}>
          {(id) => <select id={id} className="input" value={form.parentCategory} disabled={!canMove} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}><option value="">None (top level)</option>{parents.filter((p) => p._id !== editing?._id).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>}
        </Field>
        <Field label="Image" hint="Optional. Shown on the category in the app.">
          <ImageUpload files={file} onChange={setFile} max={1} existing={editing?.image ? [editing.image] : []} hint="JPG, PNG or WebP, up to 5 MB" />
        </Field>
        <Toggle label="Active" description="Inactive categories are hidden from customers." checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
      </form>
    </Modal>
  );
}

function CategoryCard({ category: c, subs, editable, onEdit, onAddSub, onToggle, onDelete, onProducts }) {
  return (
    <article className={`cat-card ${c.isActive ? '' : 'is-inactive'}`}>
      <div className="cat-card-head">
        <span className="cat-emoji">{c.image ? <img src={fileUrl(c.image)} alt="" /> : <Tags size={22} />}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{c.name}</h3>
          <small>{num(c.subCategoryCount)} sub-categories · {num(c.productCount)} products</small>
        </div>
        {!c.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
        {editable && (
          <Menu items={[
            { label: 'Edit', icon: Pencil, onClick: () => onEdit(c) },
            { label: 'Add sub-category', icon: Plus, onClick: () => onAddSub(c) },
            { label: c.isActive ? 'Hide from app' : 'Show in app', icon: EyeOff, onClick: () => onToggle(c) },
            'divider',
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => onDelete(c) },
          ]}
          />
        )}
      </div>
      <div className="cat-subs">
        {subs.map((s) => (
          <span key={s._id} className="chip" style={s.isActive ? undefined : { opacity: 0.6 }} title={s.isActive ? undefined : 'Hidden from the app'}>
            {s.name} <b>{num(s.productCount)}</b>
            {editable && (
              <>
                <button type="button" aria-label={`Edit ${s.name}`} onClick={() => onEdit(s)}><Pencil size={11} /></button>
                <button type="button" aria-label={`Delete ${s.name}`} onClick={() => onDelete(s)}><X size={12} /></button>
              </>
            )}
          </span>
        ))}
        {editable && <button type="button" className="chip chip-add" onClick={() => onAddSub(c)}><Plus size={12} /> Add</button>}
        {!editable && !subs.length && <span className="muted" style={{ fontSize: 12.5 }}>No sub-categories</span>}
      </div>
      <div className="cat-card-foot">
        <span style={{ fontFamily: 'var(--mono)' }}>{c.categoryId}</span>
        <span className="spacer" />
        {onProducts && <Button size="sm" variant="ghost" onClick={() => onProducts(c)}>Products</Button>}
      </div>
    </article>
  );
}

const deleteHint = (c) => {
  if (!c) return '';
  if (c.subCategoryCount) return `It still has ${c.subCategoryCount} sub-categories. Delete or move those first.`;
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
  const matches = (c) => c.name.toLowerCase().includes(term) || c.categoryId?.toLowerCase().includes(term);
  const shown = parents.filter((p) => !term || matches(p) || subsOf(p._id).some(matches));

  // The server refuses (409) while the category is in use; useAction shows its message.
  const remove = () => run(() => categoriesApi.remove(deleting._id), { success: `${deleting.name} deleted` }).then(reload).catch(() => {}).finally(() => setDeleting(null));
  const toggleActive = (c) => run(() => categoriesApi.update(c._id, { isActive: !c.isActive }), { success: c.isActive ? `${c.name} hidden` : `${c.name} is live` }).then(reload).catch(() => {});

  const newButton = editable && <Button icon={Plus} onClick={() => setModal({})}>New category</Button>;

  return (
    <>
      <PageHeader
        title="Categories"
        description="The aisles of the store. Organise products into categories and sub-categories that customers browse."
        actions={newButton}
      />
      <div className="stat-grid">
        <StatCard icon={Tags} label="Categories" value={data ? num(parents.length) : '–'} footer="Top level" />
        <StatCard icon={Layers} tone="violet" label="Sub-categories" value={data ? num(all.length - parents.length) : '–'} footer="Across all categories" />
        <StatCard icon={EyeOff} tone="amber" label="Hidden" value={data ? num(all.filter((c) => !c.isActive).length) : '–'} footer="Not shown in the customer app" />
      </div>
      <div className="row mb">
        <SearchInput value={search} onChange={setSearch} placeholder="Find a category, sub-category or CAT id" className="spacer" />
        {can('catalog', 'products') && <Button variant="secondary" icon={FolderTree} onClick={() => navigate('/master-catalog?view=tree')}>View catalog tree</Button>}
      </div>

      {loading && !data ? (
        <div className="cat-grid">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={190} r={16} />)}</div>
      ) : error && !data ? (
        <Card><ErrorState error={error} onRetry={reload} /></Card>
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
              onProducts={can('products') ? (p) => navigate(`/products?category=${p._id}`) : undefined}
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
