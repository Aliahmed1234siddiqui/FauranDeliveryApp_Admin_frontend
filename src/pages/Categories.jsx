import { useEffect, useState } from 'react';
import { Check, EyeOff, FolderTree, Layers, Package, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { adminApi } from '../services/adminApi';
import { num } from '../lib/format';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, SearchInput, Skeleton, StatCard, Toggle } from '../ui/primitives';
import { ConfirmDialog, Menu, Modal } from '../ui/overlays';
import ImageUpload from '../ui/ImageUpload';

const EMOJIS = ['🛒', '🥬', '🥛', '🍞', '🧴', '🍪', '🧼', '🍚', '🐾', '🧊', '🍗', '👶', '💊', '🍫', '🥤', '🧃'];

// POST /admin/categories & PUT /admin/categories/:id (multipart, single `image`)
const toForm = (c, parent = '') => (c
  ? { name: c.name, parentCategory: c.parentCategory || '', icon: c.icon, isActive: c.isActive, sortOrder: String(c.sortOrder ?? '') }
  : { name: '', parentCategory: parent, icon: '🛒', isActive: true, sortOrder: '' });

function CategoryModal(props) {
  return props.state ? <CategoryModalBody key={props.state.category?._id || props.state.parent || 'new'} {...props} /> : null;
}

function CategoryModalBody({ state, parents, onClose, onSaved }) {
  const editing = state.category;
  const [initial] = useState(() => toForm(editing, state.parent));
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState([]);
  const [error, setError] = useState('');
  const [run, pending] = useAction();

  // Pull the latest copy when editing (GET /admin/categories/:id), unless the user already started typing.
  useEffect(() => {
    if (!editing) return undefined;
    let live = true;
    adminApi.getCategoryById(editing._id).then((c) => live && setForm((f) => (f === initial ? toForm(c) : f))).catch(() => {});
    return () => { live = false; };
  }, [editing, initial]);

  const isSub = !!form.parentCategory;
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Give the category a name');
    const payload = { ...form, name: form.name.trim(), parentCategory: form.parentCategory || null, sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined, image: file[0] };
    return run(() => (editing ? adminApi.updateCategory(editing._id, payload) : adminApi.createCategory(payload)), { success: editing ? 'Category updated' : `${isSub ? 'Sub-category' : 'Category'} created` })
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
        <div className="form-grid">
          <Field label="Parent category" hint="Leave empty for a top-level category">
            {(id) => <select id={id} className="input" value={form.parentCategory} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}><option value="">None (top level)</option>{parents.filter((p) => p._id !== editing?._id).map((p) => <option key={p._id} value={p._id}>{p.icon} {p.name}</option>)}</select>}
          </Field>
          <Field label="Display order" hint="Lower shows first">{(id) => <Input id={id} type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} placeholder="1" />}</Field>
        </div>
        {!isSub && (
          <Field label="Icon">
            <div className="emoji-picker">{EMOJIS.map((e) => <button type="button" key={e} className={form.icon === e ? 'is-active' : ''} onClick={() => setForm({ ...form, icon: e })}>{e}</button>)}</div>
          </Field>
        )}
        <Field label="Banner image" hint="Optional. Shown on the category page in the app.">
          <ImageUpload files={file} onChange={setFile} max={1} hint="PNG or JPG, 800×400 recommended" />
        </Field>
        <Toggle label="Active" description="Inactive categories are hidden from customers." checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
      </form>
    </Modal>
  );
}

export default function Categories() {
  const { navigate } = useRouter();
  const { data, loading, reload } = useApi(() => adminApi.getCategories(), []);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [run, pending] = useAction();

  const all = data || [];
  const parents = all.filter((c) => !c.parentCategory).sort((a, b) => a.sortOrder - b.sortOrder);
  const subsOf = (id) => all.filter((c) => c.parentCategory === id);
  const term = search.toLowerCase();
  const shown = parents.filter((p) => !term || p.name.toLowerCase().includes(term) || subsOf(p._id).some((s) => s.name.toLowerCase().includes(term)));

  const remove = () => run(() => adminApi.deleteCategory(deleting._id), { success: `${deleting.name} deleted` }).then(() => { setDeleting(null); reload(); }).catch(() => setDeleting(null));
  const toggleActive = (c) => run(() => adminApi.updateCategory(c._id, { isActive: !c.isActive }), { success: c.isActive ? `${c.name} hidden` : `${c.name} is live` }).then(reload).catch(() => {});

  return (
    <>
      <PageHeader
        title="Categories"
        description="The aisles of the store. Organise products into categories and sub-categories that customers browse."
        actions={<Button icon={Plus} onClick={() => setModal({})}>New category</Button>}
      />
      <div className="stat-grid">
        <StatCard icon={Tags} label="Categories" value={parents.length} footer={`${parents.filter((p) => !p.isActive).length} hidden`} />
        <StatCard icon={Layers} tone="violet" label="Sub-categories" value={all.length - parents.length} footer="Across all categories" />
        <StatCard icon={Package} tone="amber" label="Products categorised" value={num(parents.reduce((s, p) => s + p.productsCount, 0))} footer="In the master catalog" onClick={() => navigate('/master-catalog')} />
      </div>
      <div className="row mb">
        <SearchInput value={search} onChange={setSearch} placeholder="Find a category or sub-category" className="spacer" />
        <Button variant="secondary" icon={FolderTree} onClick={() => navigate('/master-catalog?view=tree')}>View catalog tree</Button>
      </div>

      {loading && !data ? (
        <div className="cat-grid">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={190} r={16} />)}</div>
      ) : shown.length === 0 ? (
        <Card><EmptyState icon={Tags} title="No categories match" description="Try another search or create a new category." action={<Button icon={Plus} onClick={() => setModal({})}>New category</Button>} /></Card>
      ) : (
        <div className="cat-grid">
          {shown.map((c) => {
            const subs = subsOf(c._id);
            return (
              <article key={c._id} className={`cat-card ${c.isActive ? '' : 'is-inactive'}`}>
                <div className="cat-card-head">
                  <span className="cat-emoji">{c.image ? <img src={c.image} alt="" /> : c.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{c.name}</h3>
                    <small>{subs.length} sub-categories · {num(c.productsCount)} products</small>
                  </div>
                  {!c.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
                  <Menu items={[
                    { label: 'Edit', icon: Pencil, onClick: () => setModal({ category: c }) },
                    { label: 'Add sub-category', icon: Plus, onClick: () => setModal({ parent: c._id }) },
                    { label: c.isActive ? 'Hide from app' : 'Show in app', icon: EyeOff, onClick: () => toggleActive(c) },
                    'divider',
                    { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleting(c) },
                  ]}
                  />
                </div>
                <div className="cat-subs">
                  {subs.map((s) => (
                    <span key={s._id} className="chip">
                      {s.name} <b>{s.productsCount}</b>
                      <button type="button" aria-label={`Edit ${s.name}`} onClick={() => setModal({ category: s })}><Pencil size={11} /></button>
                      <button type="button" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}><X size={12} /></button>
                    </span>
                  ))}
                  <button type="button" className="chip chip-add" onClick={() => setModal({ parent: c._id })}><Plus size={12} /> Add</button>
                </div>
                <div className="cat-card-foot">
                  <span style={{ fontFamily: 'var(--mono)' }}>{c.categoryId}</span>
                  <span className="spacer" />
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/products?category=${c._id}`)}>Products</Button>
                </div>
              </article>
            );
          })}
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
        description={deleting && !deleting.parentCategory && subsOf(deleting._id).length ? `It still has ${subsOf(deleting._id).length} sub-categories. Delete or move those first.` : 'Products in this category will need to be re-categorised.'}
        confirmLabel="Delete"
      />
    </>
  );
}
