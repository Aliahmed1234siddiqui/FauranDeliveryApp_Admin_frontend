import { useMemo, useState } from 'react';
import { Check, CircleAlert, Download, Package, PackageCheck, PackageX, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useList } from '../lib/useList';
import { adminApi } from '../services/adminApi';
import { money, num } from '../lib/format';
import { Badge, Button, Card, Code, Field, Identity, Input, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog, Drawer, Menu } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';
import ImageUpload from '../ui/ImageUpload';

const FILTERS = ['status', 'vendorId', 'category', 'stock'];
const EMPTY = { vendorId: '', masterProductId: '', name: '', sku: '', category: '', subCategory: '', unit: '', mrp: '', price: '', salePrice: '', stock: '', isActive: true, description: '' };

// POST /admin/products and PUT /admin/products/:id (multipart, `images` x5)
function ProductForm(props) {
  // Mount only while open so each opening starts from the product's current values.
  return props.open ? <ProductFormBody key={props.product?._id || 'new'} {...props} /> : null;
}

function ProductFormBody({ product, onClose, onSaved, vendors, categories }) {
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product, vendorId: product.vendor._id, mrp: String(product.mrp), price: String(product.price), salePrice: product.salePrice ? String(product.salePrice) : '', stock: String(product.stock) } : EMPTY));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [run, pending] = useAction();
  const master = useApi(() => adminApi.getMasterCatalog({ limit: 999 }), []);

  const parents = categories.filter((c) => !c.parentCategory);
  const subs = categories.filter((c) => c.parentCategory === form.category);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const pickMaster = (id) => {
    const m = master.data?.items.find((x) => x.masterId === id);
    if (!m) return setForm((f) => ({ ...f, masterProductId: '' }));
    setForm((f) => ({ ...f, masterProductId: m.masterId, name: m.name, category: m.category, subCategory: m.subCategory, unit: m.unit, mrp: String(m.mrp), price: f.price || String(m.mrp), icon: m.icon }));
  };

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.vendorId) err.vendorId = 'Choose the store selling this product';
    if (!form.name.trim()) err.name = 'Product name is required';
    if (!form.category) err.category = 'Pick a category';
    if (!(Number(form.price) > 0)) err.price = 'Enter a selling price';
    if (form.salePrice && Number(form.salePrice) >= Number(form.price)) err.salePrice = 'Sale price must be lower than the price';
    if (form.stock === '' || Number(form.stock) < 0) err.stock = 'Enter stock on hand';
    setErrors(err);
    if (Object.keys(err).length) return;
    const payload = { ...form, mrp: Number(form.mrp) || Number(form.price), price: Number(form.price), salePrice: form.salePrice ? Number(form.salePrice) : null, stock: Number(form.stock), images: files };
    delete payload.vendor;
    run(() => (product ? adminApi.updateProduct(product._id, payload) : adminApi.createProduct(payload)), { success: product ? 'Product updated' : 'Product created' })
      .then(() => { onSaved(); onClose(); }).catch(() => {});
  };

  const discount = form.salePrice && form.price ? Math.round((1 - Number(form.salePrice) / Number(form.price)) * 100) : 0;

  return (
    <Drawer
      open
      onClose={onClose}
      width={600}
      title={product ? 'Edit product' : 'Add a product'}
      subtitle={product ? `${product.productId} · ${product.vendor.storeName}` : 'List a product for a vendor. Start from the master catalog to keep names consistent.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="product-form" loading={pending} icon={Check}>{product ? 'Save changes' : 'Create product'}</Button></>}
    >
      <form id="product-form" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="form-section-title">Source</div>
          <p className="form-section-desc">Choose the store and, ideally, a standard master-catalog product.</p>
          <div className="form-grid">
            <Field label="Vendor" required error={errors.vendorId}>{(id) => <select id={id} className="input" value={form.vendorId} onChange={set('vendorId')} disabled={!!product}><option value="">Select a store…</option>{vendors.map((v) => <option key={v._id} value={v._id}>{v.storeName}</option>)}</select>}</Field>
            <Field label="Master catalog item" hint="Fills name, category, unit and MRP">{(id) => <select id={id} className="input" value={form.masterProductId} onChange={(e) => pickMaster(e.target.value)}><option value="">Custom product</option>{(master.data?.items || []).map((m) => <option key={m.masterId} value={m.masterId}>{m.icon} {m.name} · {m.unit}</option>)}</select>}</Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Details</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Product name" required error={errors.name} className="span-2">{(id) => <Input id={id} value={form.name} onChange={set('name')} placeholder="e.g. Olpers Full Cream Milk" />}</Field>
            <Field label="Category" required error={errors.category}>{(id) => <select id={id} className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))}><option value="">Select…</option>{parents.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}</select>}</Field>
            <Field label="Sub-category">{(id) => <select id={id} className="input" value={form.subCategory} onChange={set('subCategory')} disabled={!subs.length}><option value="">{subs.length ? 'Select…' : 'Pick a category first'}</option>{subs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}</Field>
            <Field label="SKU" hint="Leave blank to auto-generate">{(id) => <Input id={id} value={form.sku} onChange={set('sku')} placeholder="VEN0001-MILK-1L" />}</Field>
            <Field label="Unit / pack size">{(id) => <Input id={id} value={form.unit} onChange={set('unit')} placeholder="1 L, 500 g, 12 pcs" />}</Field>
            <Field label="Description" className="span-2">{(id) => <textarea id={id} className="input textarea" rows={3} value={form.description} onChange={set('description')} placeholder="Short description shown in the customer app" />}</Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Pricing & stock</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="MRP">{(id) => <Input id={id} prefix="Rs." type="number" value={form.mrp} onChange={set('mrp')} />}</Field>
            <Field label="Selling price" required error={errors.price}>{(id) => <Input id={id} prefix="Rs." type="number" value={form.price} onChange={set('price')} />}</Field>
            <Field label="Sale price" error={errors.salePrice} hint={discount > 0 ? `${discount}% off shown to customers` : 'Optional promotional price'}>{(id) => <Input id={id} prefix="Rs." type="number" value={form.salePrice} onChange={set('salePrice')} />}</Field>
            <Field label="Stock on hand" required error={errors.stock}>{(id) => <Input id={id} type="number" min="0" suffix="units" value={form.stock} onChange={set('stock')} />}</Field>
            <div className="span-2"><Toggle label="Visible to customers" description="Turn off to hide the listing without deleting it." checked={form.isActive} onChange={set('isActive')} /></div>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Images</div>
          <p className="form-section-desc">Up to 5 photos. The first one is the cover.</p>
          <ImageUpload files={files} onChange={setFiles} max={5} existing={product?.icon ? [product.icon] : []} />
        </div>
      </form>
    </Drawer>
  );
}

export default function Products() {
  const { navigate } = useRouter();
  const list = useList(adminApi.getProducts, FILTERS, { limit: 10 });
  const [isNew, setIsNew] = useQueryState('new');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [run, pending] = useAction();
  const vendors = useApi(() => adminApi.getVendors({ limit: 999 }), []);
  const categories = useApi(() => adminApi.getCategories(), []);
  const all = useApi(() => adminApi.getProducts({ limit: 9999 }), []);
  const allItems = all.data?.items || [];
  const catName = useMemo(() => Object.fromEntries((categories.data || []).map((c) => [c._id, c.name])), [categories.data]);
  const refresh = () => { list.reload(); all.reload(); };

  const approve = (p, status, reason) => run(() => adminApi.approveProduct(p._id, status, reason), { success: status === 'approved' ? `${p.name} approved` : 'Listing rejected' }).then(() => { setRejecting(null); refresh(); }).catch(() => {});
  const remove = () => run(() => adminApi.deleteProduct(deleting._id), { success: 'Product deleted' }).then(() => { setDeleting(null); refresh(); }).catch(() => {});

  const columns = [
    { key: 'name', header: 'Product', sortable: true, sortKey: 'name', render: (p) => <Identity icon={p.icon} name={p.name} sub={<>{p.unit} · <span style={{ fontFamily: 'var(--mono)' }}>{p.productId}</span></>} /> },
    { key: 'vendor', header: 'Store', hideOnMobile: true, render: (p) => <span className="cell-strong">{p.vendor.storeName}</span> },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (p) => <><span>{catName[p.category]}</span><span className="cell-sub">{catName[p.subCategory]}</span></> },
    { key: 'price', header: 'Price', align: 'right', sortable: true, sortKey: 'price', render: (p) => (p.salePrice ? <><span className="cell-strong">{money(p.salePrice)}</span><span className="cell-sub" style={{ textDecoration: 'line-through' }}>{money(p.price)}</span></> : <span className="cell-strong">{money(p.price)}</span>) },
    { key: 'stock', header: 'Stock', align: 'right', sortable: true, sortKey: 'stock', render: (p) => (p.stock === 0 ? <Badge tone="danger">Out</Badge> : p.stock <= p.reorderLevel ? <Badge tone="warning">{p.stock}</Badge> : num(p.stock)) },
    { key: 'status', header: 'Listing', render: (p) => <StatusBadge status={p.approvalStatus} /> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {p.approvalStatus === 'pending' && (
            <>
              <Button size="sm" variant="soft" icon={Check} onClick={() => approve(p, 'approved')}>Approve</Button>
              <Button size="sm" variant="ghost" icon={X} onClick={() => setRejecting(p)} aria-label="Reject" />
            </>
          )}
          <Menu items={[
            { label: 'Edit product', icon: Pencil, onClick: () => setEditing(p) },
            p.approvalStatus !== 'approved' && { label: 'Approve listing', icon: Check, onClick: () => approve(p, 'approved') },
            p.approvalStatus === 'approved' && { label: 'Reject listing', icon: X, onClick: () => setRejecting(p) },
            { label: 'View store', icon: Package, onClick: () => navigate(`/vendors/${p.vendor.vendorId}`) },
            'divider',
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleting(p) },
          ]}
          />
        </div>
      ),
    },
  ];

  const pending_ = allItems.filter((p) => p.approvalStatus === 'pending').length;

  return (
    <>
      <PageHeader
        title="Products"
        description="Every product listed by every store. Approve new listings, fix pricing, and keep stock honest."
        actions={<><Button variant="secondary" icon={Download}>Export</Button><Button icon={Plus} onClick={() => setIsNew('1')}>Add product</Button></>}
      />
      <div className="stat-grid">
        <StatCard icon={Package} label="Total listings" value={num(allItems.length)} footer={`${vendors.data?.items.filter((v) => v.approvalStatus === 'approved').length || '–'} stores`} />
        <StatCard icon={CircleAlert} tone="amber" label="Waiting for approval" value={pending_} footer="Not visible to customers yet" onClick={() => list.setFilter('status', 'pending')} />
        <StatCard icon={PackageCheck} tone="blue" label="Low stock" value={allItems.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length} footer="At or below reorder level" onClick={() => list.setFilter('stock', 'low')} />
        <StatCard icon={PackageX} tone="rose" label="Out of stock" value={allItems.filter((p) => p.stock === 0).length} footer="Hidden from the app" onClick={() => list.setFilter('stock', 'out')} />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending', count: pending_ }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} />
          <div className="spacer" />
          <Select value={list.filters.vendorId} onChange={(v) => list.setFilter('vendorId', v)} options={[{ value: 'all', label: 'All stores' }, ...(vendors.data?.items || []).map((v) => ({ value: v._id, label: v.storeName }))]} />
          <Select value={list.filters.category} onChange={(v) => list.setFilter('category', v)} options={[{ value: 'all', label: 'All categories' }, ...(categories.data || []).filter((c) => !c.parentCategory).map((c) => ({ value: c._id, label: c.name }))]} />
          <Select value={list.filters.stock} onChange={(v) => list.setFilter('stock', v)} options={[{ value: 'all', label: 'Any stock' }, { value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Name, SKU, PRD id or store" />
        </div>
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} sort={list.sort} onSort={list.setSort} onRowClick={setEditing} rowClassName={(p) => (p.approvalStatus === 'pending' ? 'row-attention' : '')} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>SKUs follow <Code>VENDOR-MASTER</Code> so you can trace every listing back to the master catalog.</p>

      <ProductForm open={!!editing || isNew === '1'} product={editing} onClose={() => { setEditing(null); setIsNew(''); }} onSaved={refresh} vendors={(vendors.data?.items || []).filter((v) => v.approvalStatus !== 'rejected')} categories={categories.data || []} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={pending} title={`Delete ${deleting?.name}?`} description="The listing is removed from the store and the customer app. Past orders keep their copy of the product." confirmLabel="Delete product" icon={Trash2} />
      <ConfirmDialog open={!!rejecting} onClose={() => setRejecting(null)} onConfirm={(reason) => approve(rejecting, 'rejected', reason)} loading={pending} title="Reject this listing?" description="The vendor will see your reason and can fix and resubmit." confirmLabel="Reject listing" reason reasonRequired reasonPlaceholder="e.g. Price is above MRP" />
    </>
  );
}
