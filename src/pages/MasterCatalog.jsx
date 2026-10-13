import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, FileSpreadsheet, FolderTree, LibraryBig, List, Pencil, Plus, Store, Trash2, Upload } from 'lucide-react';
import { useQueryState } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useList } from '../lib/useList';
import { useAuth } from '../lib/auth';
import { adminApi } from '../services/adminApi';
import { date, money } from '../lib/format';
import { Badge, Button, Card, Code, EmptyState, Field, Identity, Input, PageHeader, SearchInput, Segmented, Select, Skeleton, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog, Drawer, Menu, Modal } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';
import ImageUpload from '../ui/ImageUpload';

const EMPTY = { name: '', brand: '', category: '', subCategory: '', unit: '', mrp: '', barcode: '', description: '', isActive: true };
const SAMPLE = `name,brand,category,subCategory,unit,mrp,barcode
Shan Biryani Masala,Shan,cat1,cat1-3,50 g,140,8964000111223
Nurpur Butter,Nurpur,cat2,cat2-1,200 g,520,8964000334455
Peek Freans Sooper,Peek Freans,cat3,cat3-2,Family pack,280,8964000556677`;

function parseCsv(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/).filter(Boolean);
  if (!head) return [];
  const keys = head.split(',').map((k) => k.trim());
  return lines.map((line, i) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = Object.fromEntries(keys.map((k, j) => [k, cells[j] ?? '']));
    row.mrp = Number(row.mrp) || 0;
    row._line = i + 2;
    row._error = !row.name ? 'Missing name' : !row.category ? 'Missing category' : !row.mrp ? 'Missing MRP' : '';
    return row;
  });
}

// POST /admin/master-catalog/bulk  { items: [...] }
const stripMeta = (row) => Object.fromEntries(Object.entries(row).filter(([k]) => !k.startsWith('_')));

function BulkImport(props) {
  return props.open ? <BulkImportBody {...props} /> : null;
}

function BulkImportBody({ onClose, onDone, catName }) {
  const [text, setText] = useState('');
  const [run, pending] = useAction();
  const rows = useMemo(() => parseCsv(text), [text]);
  const valid = rows.filter((r) => !r._error);
  const submit = () => run(() => adminApi.bulkCreateMasterProducts(valid.map(stripMeta)), { success: `${valid.length} products added to the master catalog` }).then(() => { onDone(); onClose(); }).catch(() => {});
  const onFile = (file) => file && file.text().then(setText);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={FileSpreadsheet}
      title="Bulk import products"
      description="Paste CSV or upload a file. Columns: name, brand, category, subCategory, unit, mrp, barcode."
      footer={(
        <>
          <span className="muted" style={{ marginRight: 'auto', fontSize: 13 }}>{rows.length ? `${valid.length} ready · ${rows.length - valid.length} with errors` : 'Nothing to import yet'}</span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={Upload} disabled={!valid.length} loading={pending} onClick={submit}>Import {valid.length || ''} products</Button>
        </>
      )}
    >
      <div className="stack">
        <div className="row row-wrap">
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}><Upload size={14} /> Upload .csv<input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files[0])} /></label>
          <Button size="sm" variant="ghost" onClick={() => setText(SAMPLE)}>Use sample data</Button>
        </div>
        <textarea className="input textarea" rows={6} style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} />
        {rows.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-scroll" style={{ maxHeight: 240 }}>
              <table className="table">
                <thead><tr><th>Line</th><th>Name</th><th>Category</th><th>Unit</th><th>MRP</th><th>Check</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._line}>
                      <td className="muted">{r._line}</td>
                      <td className="cell-strong">{r.name || '—'}<span className="cell-sub">{r.brand}</span></td>
                      <td>{catName[r.category] || r.category}<span className="cell-sub">{catName[r.subCategory] || r.subCategory}</span></td>
                      <td>{r.unit}</td>
                      <td>{r.mrp ? money(r.mrp) : '—'}</td>
                      <td>{r._error ? <Badge tone="danger">{r._error}</Badge> : <Badge tone="success" icon={Check}>OK</Badge>}</td>
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

// POST /admin/master-catalog & PUT /admin/master-catalog/:id (multipart, `images` x5)
const toForm = (m) => (m ? { ...EMPTY, ...m, mrp: String(m.mrp) } : EMPTY);

function MasterForm(props) {
  return props.open ? <MasterFormBody key={props.item?._id || 'new'} {...props} /> : null;
}

function MasterFormBody({ item, categories, onClose, onSaved }) {
  const [initial] = useState(() => toForm(item));
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [run, pending] = useAction();

  // Refresh from GET /admin/master-catalog/:id unless the user already started editing.
  useEffect(() => {
    if (!item) return undefined;
    let live = true;
    adminApi.getMasterProductById(item._id).then((m) => live && setForm((f) => (f === initial ? toForm(m) : f))).catch(() => {});
    return () => { live = false; };
  }, [item, initial]);

  const parents = categories.filter((c) => !c.parentCategory);
  const subs = categories.filter((c) => c.parentCategory === form.category);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!form.category) err.category = 'Pick a category';
    if (!(Number(form.mrp) > 0)) err.mrp = 'Enter the MRP';
    setErrors(err);
    if (Object.keys(err).length) return;
    const payload = { ...form, mrp: Number(form.mrp), images: files };
    run(() => (item ? adminApi.updateMasterProduct(item._id, payload) : adminApi.createMasterProduct(payload)), { success: item ? 'Master product updated' : 'Added to master catalog' }).then(() => { onSaved(); onClose(); }).catch(() => {});
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={560}
      title={item ? 'Edit master product' : 'New master product'}
      subtitle={item ? `${item.masterId} · used by ${item.vendorsUsing} stores` : 'Vendors pick from this list when they add products, so names and units stay consistent.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="master-form" icon={Check} loading={pending}>{item ? 'Save changes' : 'Add product'}</Button></>}
    >
      <form id="master-form" onSubmit={submit} className="form-grid" noValidate>
        <Field label="Product name" required error={errors.name} className="span-2">{(id) => <Input id={id} value={form.name} onChange={set('name')} placeholder="e.g. Nestlé Milkpak UHT Milk" />}</Field>
        <Field label="Brand">{(id) => <Input id={id} value={form.brand} onChange={set('brand')} placeholder="Nestlé" />}</Field>
        <Field label="Unit / pack size">{(id) => <Input id={id} value={form.unit} onChange={set('unit')} placeholder="1 L" />}</Field>
        <Field label="Category" required error={errors.category}>{(id) => <select id={id} className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))}><option value="">Select…</option>{parents.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}</select>}</Field>
        <Field label="Sub-category">{(id) => <select id={id} className="input" value={form.subCategory} onChange={set('subCategory')} disabled={!subs.length}><option value="">Select…</option>{subs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}</Field>
        <Field label="MRP" required error={errors.mrp}>{(id) => <Input id={id} type="number" prefix="Rs." value={form.mrp} onChange={set('mrp')} />}</Field>
        <Field label="Barcode (EAN)">{(id) => <Input id={id} value={form.barcode} onChange={set('barcode')} placeholder="8964000123456" />}</Field>
        <Field label="Description" className="span-2">{(id) => <textarea id={id} className="input textarea" rows={3} value={form.description} onChange={set('description')} />}</Field>
        <Field label="Images" className="span-2"><ImageUpload files={files} onChange={setFiles} max={5} existing={item?.icon ? [item.icon] : []} /></Field>
        <div className="span-2"><Toggle label="Available to vendors" description="Inactive items can't be picked for new listings." checked={form.isActive} onChange={set('isActive')} /></div>
      </form>
    </Drawer>
  );
}

function TreeView({ search }) {
  const { data, loading } = useApi(() => adminApi.getMasterCatalogTree(), []);
  const [open, setOpen] = useState({});
  if (loading && !data) return <Skeleton h={300} r={16} />;
  const term = search.toLowerCase();
  return (
    <div className="tree">
      {data.map((cat) => {
        const total = cat.children.reduce((s, c) => s + c.products.length, 0);
        const isOpen = open[cat._id] ?? (!!term || total > 0);
        const children = cat.children.map((s) => ({ ...s, products: s.products.filter((p) => !term || p.name.toLowerCase().includes(term)) })).filter((s) => !term || s.products.length);
        if (term && !children.length) return null;
        return (
          <div className="tree-node" key={cat._id}>
            <button type="button" className={`tree-head ${isOpen ? 'is-open' : ''}`} onClick={() => setOpen((o) => ({ ...o, [cat._id]: !isOpen }))}>
              <ChevronRight size={16} className="chev" />
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <strong>{cat.name}</strong>
              <span className="spacer" />
              <Badge>{cat.children.length} sub</Badge>
              <Badge tone="brand">{total} products</Badge>
            </button>
            {isOpen && (
              <div className="tree-children">
                {children.map((s) => (
                  <div className="tree-sub" key={s._id}>
                    <div className="tree-sub-title">{s.name} <span className="muted" style={{ fontWeight: 500 }}>· {s.products.length}</span></div>
                    <div className="tree-products">
                      {s.products.length ? s.products.map((p) => <span className="chip" key={p._id}>{p.icon} {p.name} <b>{p.unit}</b></span>) : <span className="muted" style={{ fontSize: 12.5 }}>No master products yet</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MasterCatalog() {
  const { can } = useAuth();
  const editable = can('catalog');
  const [view, setView] = useQueryState('view', 'list');
  const list = useList(adminApi.getMasterCatalog, ['category', 'status'], { limit: 10 });
  const categories = useApi(() => adminApi.getCategories(), []);
  const catName = useMemo(() => Object.fromEntries((categories.data || []).map((c) => [c._id, c.name])), [categories.data]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [run, pending] = useAction();

  const remove = () => run(() => adminApi.deleteMasterProduct(deleting._id), { success: 'Removed from master catalog' }).then(() => { setDeleting(null); list.reload(); }).catch(() => {});

  const columns = [
    { key: 'name', header: 'Product', sortable: true, sortKey: 'name', render: (m) => <Identity icon={m.icon} name={m.name} sub={`${m.brand} · ${m.unit}`} /> },
    { key: 'id', header: 'Master id', hideOnMobile: true, render: (m) => <Code>{m.masterId}</Code> },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (m) => <><span>{catName[m.category]}</span><span className="cell-sub">{catName[m.subCategory]}</span></> },
    { key: 'mrp', header: 'MRP', align: 'right', sortable: true, sortKey: 'mrp', render: (m) => <span className="cell-strong">{money(m.mrp)}</span> },
    { key: 'barcode', header: 'Barcode', hideOnMobile: true, render: (m) => <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{m.barcode}</span> },
    { key: 'vendors', header: 'Used by', sortable: true, sortKey: 'vendorsUsing', render: (m) => <span className="row" style={{ gap: 5 }}><Store size={13} className="muted" />{m.vendorsUsing} stores</span> },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.isActive ? 'active' : 'inactive'} /> },
    { key: 'added', header: 'Added', hideOnMobile: true, render: (m) => date(m.createdAt) },
    editable && { key: 'actions', header: '', render: (m) => <Menu items={[{ label: 'Edit', icon: Pencil, onClick: () => setEditing(m) }, 'divider', { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleting(m) }]} /> },
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Master catalog"
        description="The standard list of products vendors choose from. One clean record per product keeps search, pricing and reports consistent."
        actions={editable && (
          <>
            <Button variant="secondary" icon={FileSpreadsheet} onClick={() => setBulk(true)}>Bulk import</Button>
            <Button icon={Plus} onClick={() => setCreating(true)}>Add product</Button>
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
          <div className="row mb"><SearchInput value={list.search} onChange={list.setSearch} placeholder="Filter products in the tree" className="spacer" /></div>
          <TreeView search={list.search} />
        </Card>
      ) : (
        <Card className="table-card" padded={false}>
          <div className="toolbar">
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Name, brand, barcode or MCP id" />
            <div className="spacer" />
            <Select value={list.filters.category} onChange={(v) => list.setFilter('category', v)} options={[{ value: 'all', label: 'All categories' }, ...(categories.data || []).filter((c) => !c.parentCategory).map((c) => ({ value: c._id, label: c.name }))]} />
            <Select value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'all', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            sort={list.sort}
            onSort={list.setSort}
            onRowClick={editable ? setEditing : undefined}
            empty={<EmptyState icon={LibraryBig} title="No master products found" description="Add products one by one or import a CSV." action={editable && <Button icon={Plus} onClick={() => setCreating(true)}>Add product</Button>} />}
          />
          <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
        </Card>
      )}

      <MasterForm open={creating || !!editing} item={editing} categories={categories.data || []} onClose={() => { setCreating(false); setEditing(null); }} onSaved={list.reload} />
      <BulkImport open={bulk} onClose={() => setBulk(false)} onDone={list.reload} catName={catName} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={pending} icon={Trash2} title={`Delete ${deleting?.name}?`} description={deleting?.vendorsUsing ? `${deleting.vendorsUsing} stores list this product. Their listings stay, but lose the link to the master record.` : 'This product is not used by any store.'} confirmLabel="Delete" />
    </>
  );
}
