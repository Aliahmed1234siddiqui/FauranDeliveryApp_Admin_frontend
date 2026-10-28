import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronRight, Eye, EyeOff, FileSpreadsheet, FolderTree, LibraryBig, List, Pencil, Plus, Store, Tags, Trash2, Upload } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useList } from '../lib/useList';
import { useAuth } from '../lib/auth';
import { categoriesApi, masterCatalogApi } from '../services/api';
import { date, money, num } from '../lib/format';
import { Badge, Button, Card, Code, EmptyState, ErrorState, Field, Identity, Input, KeyValue, PageHeader, SearchInput, Segmented, Select, Skeleton, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog, Drawer, Menu, Modal } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';
import ImageUpload from '../ui/ImageUpload';
import { fileUrl } from '../config';
import { categoryOptions, isSubCategory } from '../lib/categories';
import { CategoryPicker } from './shared';

const FILTERS = ['category', 'isActive'];
const EMPTY = { name: '', category: '', brand: '', unit: '', barcode: '', description: '', tags: '', suggestedPrice: '', isActive: true };

const thumb = (m) => (m.images?.[0] ? <img src={fileUrl(m.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : undefined);
const priceRange = (r) => (!r ? '—' : r.min === r.max ? money(r.min) : `${money(r.min)} – ${money(r.max)}`);

// ---------------------------------------------------------------------------
// Bulk import: POST /admin/master-catalog/bulk { items } (1-500 rows)
// ---------------------------------------------------------------------------
const COLUMNS = ['name', 'brand', 'category', 'categoryName', 'unit', 'barcode', 'description', 'tags', 'suggestedPrice', 'images'];
const MAX_ROWS = 500;
const SAMPLE = `name,brand,categoryName,unit,suggestedPrice,barcode,tags
Shan Biryani Masala,Shan,Spices,50 g,140,8964000111223,masala|biryani
Nurpur Butter,Nurpur,Dairy,200 g,520,8964000334455,butter
Peek Freans Sooper,Peek Freans,Biscuits,Family pack,280,8964000556677,`;

// Splits one CSV (or tab-separated, pasted from a spreadsheet) line, honouring "quoted, cells".
function splitLine(line) {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === '\t') { cells.push(cur.trim()); cur = ''; } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

// Rows → API items. `tags` and `images` take several values separated by "|".
function parseRows(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!head) return [];
  const keys = splitLine(head).map((h) => COLUMNS.find((c) => c.toLowerCase() === h.toLowerCase()));
  return lines.map((line, i) => {
    const item = {};
    splitLine(line).forEach((cell, j) => { if (keys[j] && cell) item[keys[j]] = cell; });
    if (item.tags) item.tags = item.tags.split('|').map((t) => t.trim()).filter(Boolean);
    if (item.images) item.images = item.images.split('|').map((u) => u.trim()).filter(Boolean);
    if (item.suggestedPrice !== undefined) item.suggestedPrice = Number(item.suggestedPrice);
    const error = !item.name ? 'Missing name'
      : !item.category && !item.categoryName ? 'Missing category'
        : item.suggestedPrice !== undefined && !(item.suggestedPrice >= 0) ? 'Price is not a number' : '';
    return { item, line: i + 2, error };
  });
}

function BulkImport(props) {
  return props.open ? <BulkImportBody {...props} /> : null;
}

function BulkImportBody({ onClose, onDone }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null); // { created, failed: { [line]: error } }
  const [run, pending] = useAction();
  const rows = useMemo(() => parseRows(text), [text]);
  const valid = rows.filter((r) => !r.error);
  const tooMany = valid.length > MAX_ROWS;

  const edit = (value) => { setText(value); setResult(null); };
  const onFile = (file) => file && file.text().then(edit);
  const submit = () => run(() => masterCatalogApi.bulkCreate(valid.map((r) => r.item))).then(({ created = [], failed = [] }) => {
    // `index` points into the submitted array; map it back to the pasted line.
    setResult({ created: created.length, failed: Object.fromEntries(failed.map((f) => [valid[f.index]?.line, f.error])) });
    if (created.length) { toast.success(`${created.length} items added to the master catalog`); onDone(); }
    if (!failed.length) onClose();
    else toast.error(`${failed.length} rows could not be added`);
  }).catch(() => {});

  const status = (r) => {
    if (r.error) return <Badge tone="danger">{r.error}</Badge>;
    if (!result) return <Badge tone="success" icon={Check}>OK</Badge>;
    return result.failed[r.line] ? <Badge tone="danger">{result.failed[r.line]}</Badge> : <Badge tone="success" icon={Check}>Added</Badge>;
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={FileSpreadsheet}
      title="Bulk import master items"
      description="Paste CSV or rows from a spreadsheet, or upload a file. Columns: name, brand, categoryName (a sub-category name, or its id), unit, suggestedPrice, barcode, description, tags. Separate several tags with |."
      footer={(
        <>
          <span className="muted" style={{ marginRight: 'auto', fontSize: 13 }}>
            {result ? `${result.created} added · ${Object.keys(result.failed).length} failed` : rows.length ? `${valid.length} ready · ${rows.length - valid.length} with errors` : 'Nothing to import yet'}
          </span>
          <Button variant="ghost" onClick={onClose}>{result ? 'Close' : 'Cancel'}</Button>
          {!result && <Button icon={Upload} disabled={!valid.length || tooMany} loading={pending} onClick={submit}>Import {valid.length || ''} items</Button>}
        </>
      )}
    >
      <div className="stack">
        <div className="row row-wrap">
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}><Upload size={14} /> Upload .csv<input type="file" accept=".csv,.tsv,.txt,text/csv" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} /></label>
          <Button size="sm" variant="ghost" onClick={() => edit(SAMPLE)}>Use sample data</Button>
          {tooMany && <Badge tone="danger">At most {MAX_ROWS} rows per import</Badge>}
        </div>
        <textarea className="input textarea" rows={6} style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }} value={text} onChange={(e) => edit(e.target.value)} placeholder={SAMPLE} />
        {rows.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-scroll" style={{ maxHeight: 260 }}>
              <table className="table">
                <thead><tr><th>Line</th><th>Name</th><th>Category</th><th>Unit</th><th>Price</th><th>{result ? 'Result' : 'Check'}</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line}>
                      <td className="muted">{r.line}</td>
                      <td className="cell-strong">{r.item.name || '—'}<span className="cell-sub">{r.item.brand}</span></td>
                      <td>{r.item.categoryName || r.item.category || '—'}</td>
                      <td>{r.item.unit}</td>
                      <td>{r.item.suggestedPrice >= 0 ? money(r.item.suggestedPrice) : '—'}</td>
                      <td>{status(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Create / edit: POST /admin/master-catalog & PUT /admin/master-catalog/:id
// ---------------------------------------------------------------------------
const toForm = (m, categories) => (m ? {
  name: m.name || '',
  category: categories.find((c) => c.categoryId === m.category?.categoryId)?._id || '',
  brand: m.brand || '',
  unit: m.unit || '',
  barcode: m.barcode || '',
  description: m.description || '',
  tags: (m.tags || []).join(', '),
  suggestedPrice: m.suggestedPrice != null ? String(m.suggestedPrice) : '',
  isActive: m.isActive,
} : EMPTY);

function MasterForm(props) {
  return props.open ? <MasterFormBody key={props.item?._id || 'new'} {...props} /> : null;
}

function MasterFormBody({ item, categories, onClose, onSaved }) {
  const [initialCategory] = useState(() => toForm(item, categories).category);
  const [form, setForm] = useState(() => toForm(item, categories));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [run, pending] = useAction();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  // An unchanged category isn't sent, so items saved in a main category can still be edited.
  const keepCategory = !!item && !!form.category && form.category === initialCategory;
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!keepCategory && !isSubCategory(categories, form.category)) err.category = 'Pick a sub-category';
    if (form.suggestedPrice !== '' && !(Number(form.suggestedPrice) >= 0)) err.suggestedPrice = 'Enter a valid price';
    setErrors(err);
    if (Object.keys(err).length) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      unit: form.unit.trim(),
      barcode: form.barcode.trim(),
      description: form.description.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      suggestedPrice: form.suggestedPrice === '' ? (item ? null : undefined) : Number(form.suggestedPrice),
      isActive: form.isActive,
      images: files, // only sent when files were picked; they replace the saved ones
    };
    if (keepCategory) delete payload.category;
    if (!item) {
      run(() => masterCatalogApi.create(payload), { success: 'Added to the master catalog' }).then(() => { onSaved(); onClose(); }).catch(() => {});
      return;
    }
    run(() => masterCatalogApi.update(item._id, payload)).then(({ listingsUpdated } = {}) => {
      toast.success(listingsUpdated ? `Master item updated · ${listingsUpdated} store listings synced` : 'Master item updated');
      onSaved();
      onClose();
    }).catch(() => {});
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={560}
      title={item ? 'Edit master item' : 'New master item'}
      subtitle={item ? `${item.catalogId} · sold by ${num(item.storeCount)} stores. Changes are copied to every store listing.` : 'Stores pick from this list when they add products, so names and units stay consistent.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="master-form" icon={Check} loading={pending}>{item ? 'Save changes' : 'Add item'}</Button></>}
    >
      <form id="master-form" onSubmit={submit} className="form-grid" noValidate>
        <Field label="Product name" required error={errors.name} className="span-2">{(id) => <Input id={id} value={form.name} onChange={set('name')} placeholder="e.g. Nestlé Milkpak UHT Milk" />}</Field>
        <Field label="Brand">{(id) => <Input id={id} value={form.brand} onChange={set('brand')} placeholder="Nestlé" />}</Field>
        <Field label="Unit / pack size">{(id) => <Input id={id} value={form.unit} onChange={set('unit')} placeholder="1 L" />}</Field>
        <CategoryPicker categories={categories} value={form.category} onChange={set('category')} error={errors.category} />
        <Field label="Suggested price" error={errors.suggestedPrice} hint="Shown to stores as a starting price">{(id) => <Input id={id} type="number" min="0" prefix="Rs." value={form.suggestedPrice} onChange={set('suggestedPrice')} />}</Field>
        <Field label="Barcode (EAN)">{(id) => <Input id={id} value={form.barcode} onChange={set('barcode')} placeholder="8964000123456" />}</Field>
        <Field label="Tags" hint="Comma separated, helps search">{(id) => <Input id={id} value={form.tags} onChange={set('tags')} placeholder="milk, dairy, uht" />}</Field>
        <Field label="Description" className="span-2">{(id) => <textarea id={id} className="input textarea" rows={3} value={form.description} onChange={set('description')} />}</Field>
        <Field label="Images" className="span-2"><ImageUpload files={files} onChange={setFiles} max={5} existing={item?.images || []} /></Field>
        <div className="span-2"><Toggle label="Available to stores" description="Inactive items can't be picked for new listings." checked={form.isActive} onChange={set('isActive')} /></div>
      </form>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Detail: GET /admin/master-catalog/:id → item + listings (cheapest first)
// ---------------------------------------------------------------------------
function MasterDetail({ item, editable, onClose, onEdit, onDelete }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data, loading, error, reload } = useApi(() => masterCatalogApi.get(item._id), [item._id], { key: 'master-item' });
  const m = data || item;
  const listings = data?.listings;

  const listingColumns = [
    { key: 'store', header: 'Store', render: (l) => <><span className="cell-strong">{l.vendor?.storeName || '—'}</span><span className="cell-sub" style={{ fontFamily: 'var(--mono)' }}>{l.productId}</span></> },
    { key: 'price', header: 'Price', align: 'right', render: (l) => (l.discountPrice ? <><span className="cell-strong">{money(l.discountPrice)}</span><span className="cell-sub" style={{ textDecoration: 'line-through' }}>{money(l.price)}</span></> : money(l.price)) },
    { key: 'stock', header: 'Stock', align: 'right', render: (l) => (l.stock === 0 ? <Badge tone="danger">Out</Badge> : num(l.stock)) },
    { key: 'status', header: 'Status', render: (l) => (l.isActive === false ? <Badge icon={EyeOff}>Hidden</Badge> : l.isApproved === false ? <StatusBadge status="pending" /> : <StatusBadge status="active" />) },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      width={620}
      title={m.name}
      subtitle={[m.catalogId, m.brand, m.unit].filter(Boolean).join(' · ')}
      footer={editable && <><Button variant="danger-soft" icon={Trash2} onClick={() => onDelete(m)}>Delete</Button><span className="spacer" /><Button icon={Pencil} onClick={() => onEdit(m)}>Edit</Button></>}
    >
      <div className="stack">
        {m.images?.length > 0 && <div className="thumbs" style={{ marginTop: 0 }}>{m.images.map((url) => <div className="thumb" key={url}><img src={fileUrl(url)} alt="" /></div>)}</div>}
        <KeyValue items={[
          ['Category', m.category?.name],
          ['Status', <StatusBadge key="s" status={m.isActive ? 'active' : 'inactive'} />],
          ['Suggested price', m.suggestedPrice != null ? money(m.suggestedPrice) : null],
          ['Store price range', priceRange(m.priceRange)],
          ['Barcode', m.barcode ? <Code key="b">{m.barcode}</Code> : null],
          ['Stock across stores', m.totalStock != null ? `${num(m.totalStock)} units` : null],
          ['Tags', m.tags?.length ? m.tags.join(', ') : null],
          ['Added', `${date(m.createdAt)}${data?.createdBy?.name ? ` by ${data.createdBy.name}` : ''}`],
        ]}
        />
        {m.description && <p className="muted" style={{ margin: 0 }}>{m.description}</p>}
        <Card title="Store listings" subtitle={listings ? `${num(listings.length)} stores sell this item, cheapest first` : 'Stores selling this item'} padded={false} className="table-card">
          {error && !data ? <ErrorState error={error} onRetry={reload} /> : (
            <DataTable
              columns={listingColumns}
              rows={listings}
              loading={loading}
              skeletonRows={3}
              onRowClick={can('products') ? (l) => navigate(`/products?search=${encodeURIComponent(l.productId || '')}`) : undefined}
              empty={<EmptyState icon={Store} title="No store sells this yet" description="Stores can pick it when they add a product." />}
            />
          )}
        </Card>
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Tree: GET /admin/master-catalog/tree
// ---------------------------------------------------------------------------
// Keeps only the branches with items matching `term`.
function filterNode(node, term) {
  const items = (node.items || []).filter((i) => !term || i.name.toLowerCase().includes(term) || i.catalogId?.toLowerCase().includes(term));
  const subCategories = (node.subCategories || []).map((s) => filterNode(s, term)).filter(Boolean);
  if (term && !items.length && !subCategories.length) return null;
  return { ...node, items, subCategories };
}

function TreeItems({ items, onOpen }) {
  if (!items.length) return <span className="muted" style={{ fontSize: 12.5 }}>No master items yet</span>;
  return <div className="tree-products">{items.map((p) => <button type="button" className="chip" key={p._id} onClick={() => onOpen(p)}>{p.name} {p.unit && <b>{p.unit}</b>}</button>)}</div>;
}

function TreeSub({ node, onOpen }) {
  return (
    <div className="tree-sub">
      <div className="tree-sub-title">{node.name} <span className="muted" style={{ fontWeight: 500 }}>· {num(node.totalItems ?? node.items.length)}</span>{!node.isActive && <Badge icon={EyeOff}>Hidden</Badge>}</div>
      <TreeItems items={node.items} onOpen={onOpen} />
      {node.subCategories.length > 0 && <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>{node.subCategories.map((s) => <TreeSub key={s._id} node={s} onOpen={onOpen} />)}</div>}
    </div>
  );
}

function TreeView({ search, isActive, onOpen }) {
  const { data, loading, error, reload } = useApi(() => masterCatalogApi.tree({ isActive }), [isActive], { key: 'master-tree' });
  const [open, setOpen] = useState({});
  if (loading && !data) return <Skeleton h={300} r={16} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const term = search.trim().toLowerCase();
  const nodes = (data?.categories || []).map((n) => filterNode(n, term)).filter(Boolean);
  if (!nodes.length) return <EmptyState icon={FolderTree} title={term ? 'Nothing matches' : 'The catalog is empty'} description={term ? 'Try another search.' : 'Add master items to see them grouped by category.'} />;

  return (
    <>
      <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>{num(data.totalCategories)} categories · {num(data.totalItems)} items</p>
      <div className="tree">
        {nodes.map((cat) => {
          const isOpen = open[cat._id] ?? (!!term || cat.totalItems > 0);
          return (
            <div className="tree-node" key={cat._id}>
              <button type="button" className={`tree-head ${isOpen ? 'is-open' : ''}`} onClick={() => setOpen((o) => ({ ...o, [cat._id]: !isOpen }))}>
                <ChevronRight size={16} className="chev" />
                {cat.image ? <img src={fileUrl(cat.image)} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} /> : <Tags size={18} className="muted" />}
                <strong>{cat.name}</strong>
                {!cat.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
                <span className="spacer" />
                <Badge>{cat.subCategories.length} sub</Badge>
                <Badge tone="brand">{num(cat.totalItems)} items</Badge>
              </button>
              {isOpen && (
                <div className="tree-children">
                  {/* Items saved in a main category before sub-categories were required. */}
                  {cat.items.length > 0 && <div className="tree-sub"><div className="tree-sub-title">Directly in {cat.name} <Badge tone="warning">Move to a sub-category</Badge></div><TreeItems items={cat.items} onOpen={onOpen} /></div>}
                  {!cat.subCategories.length && <span className="muted" style={{ fontSize: 12.5 }}>No sub-categories yet</span>}
                  {cat.subCategories.map((s) => <TreeSub key={s._id} node={s} onOpen={onOpen} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

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
  const refresh = () => { list.reload(); setTreeKey((k) => k + 1); };

  const edit = (m) => { setViewing(null); setEditing(m); };
  const remove = () => run(() => masterCatalogApi.remove(deleting._id), { success: 'Removed from the master catalog' })
    .then(() => { setViewing(null); refresh(); }).catch(() => {}).finally(() => setDeleting(null));

  const columns = [
    { key: 'name', header: 'Product', render: (m) => <Identity icon={thumb(m)} name={m.name} sub={[m.brand, m.unit].filter(Boolean).join(' · ') || undefined} /> },
    { key: 'id', header: 'Catalog id', hideOnMobile: true, render: (m) => <Code>{m.catalogId}</Code> },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (m) => m.category?.name || '—' },
    { key: 'price', header: 'Suggested', align: 'right', render: (m) => (m.suggestedPrice != null ? <span className="cell-strong">{money(m.suggestedPrice)}</span> : <span className="muted">—</span>) },
    { key: 'range', header: 'Store prices', align: 'right', hideOnMobile: true, render: (m) => priceRange(m.priceRange) },
    { key: 'stores', header: 'Sold by', render: (m) => <span className="row" style={{ gap: 5 }}><Store size={13} className="muted" />{num(m.storeCount)} stores</span> },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.isActive ? 'active' : 'inactive'} /> },
    { key: 'added', header: 'Added', hideOnMobile: true, render: (m) => date(m.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (m) => (
        <Menu items={[
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
        actions={editable && (
          <>
            <Button variant="secondary" icon={FileSpreadsheet} onClick={() => setBulk(true)}>Bulk import</Button>
            <Button icon={Plus} onClick={() => setCreating(true)}>Add item</Button>
          </>
        )}
      />
      <div className="row row-wrap mb">
        <Segmented value={view} onChange={setView} options={[{ value: 'list', label: 'List', icon: List }, { value: 'tree', label: 'Category tree', icon: FolderTree }]} />
        <span className="spacer" />
        {!editable && <Badge tone="info">Read-only · you have products access</Badge>}
      </div>

      {view === 'tree' ? (
        <Card>
          <div className="row mb">
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Filter items in the tree" className="spacer" />
            <Select value={list.filters.isActive} onChange={(v) => list.setFilter('isActive', v)} options={[{ value: 'all', label: 'Any status' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
          </div>
          <TreeView key={treeKey} search={list.search} isActive={list.filters.isActive} onOpen={setViewing} />
        </Card>
      ) : (
        <Card className="table-card" padded={false}>
          <div className="toolbar">
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Name, brand, barcode or CTL id" />
            <div className="spacer" />
            <Select value={list.filters.category} onChange={(v) => list.setFilter('category', v)} options={[{ value: 'all', label: 'All categories' }, ...categoryOptions(categories.data || [])]} />
            <Select value={list.filters.isActive} onChange={(v) => list.setFilter('isActive', v)} options={[{ value: 'all', label: 'Any status' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
          </div>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            onRowClick={setViewing}
            empty={<EmptyState icon={LibraryBig} title={filtered ? 'No master items match' : 'No master items yet'} description={filtered ? 'Try a different search or clear the filters.' : 'Add items one by one or import a CSV.'} action={editable && !filtered && <Button icon={Plus} onClick={() => setCreating(true)}>Add item</Button>} />}
          />
          <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
        </Card>
      )}

      {viewing && <MasterDetail key={viewing._id} item={viewing} editable={editable} onClose={() => setViewing(null)} onEdit={edit} onDelete={setDeleting} />}
      <MasterForm open={creating || !!editing} item={editing} categories={categories.data || []} onClose={() => { setCreating(false); setEditing(null); }} onSaved={refresh} />
      <BulkImport open={bulk} onClose={() => setBulk(false)} onDone={refresh} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={pending}
        icon={Trash2}
        title={`Delete ${deleting?.name}?`}
        description={deleting?.storeCount ? `${num(deleting.storeCount)} stores sell this item, so it can't be deleted until those listings are removed. Make it inactive to stop new listings instead.` : 'No store sells this item. This cannot be undone.'}
        confirmLabel="Delete"
      />
    </>
  );
}
