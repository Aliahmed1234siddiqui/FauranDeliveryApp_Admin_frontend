import { useState } from 'react';
import { Check, CircleAlert, Eye, EyeOff, LibraryBig, Package, PackageCheck, PackageX, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useList } from '../lib/useList';
import { useAuth } from '../lib/auth';
import { categoriesApi, masterCatalogApi, productsApi, vendorsApi } from '../services/api';
import { money, num } from '../lib/format';
import { Badge, Button, Card, Code, EmptyState, Field, Identity, Input, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog, Drawer, Menu } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';
import ImageUpload from '../ui/ImageUpload';
import { fileUrl } from '../config';
import { categoryOptions, isSubCategory } from '../lib/categories';
import { CategoryPicker } from './shared';

// Filter keys are sent to GET /admin/products as-is.
const FILTERS = ['approval', 'isActive', 'stock', 'vendorId', 'category'];
const EMPTY = { vendorId: '', masterProductId: '', name: '', category: '', description: '', unit: '', price: '', discountPrice: '', stock: '', isActive: true };
const MASTER_FIELDS = ['name', 'category', 'description', 'unit'];

const masterIdOf = (p) => p?.masterProduct?._id || p?.masterProduct || '';

// The list item names its category by readable id; the form needs the _id.
const toForm = (p, categories) => (p ? {
  ...EMPTY,
  masterProductId: masterIdOf(p),
  name: p.name || '',
  category: categories.find((c) => c.categoryId === p.category?.categoryId)?._id || '',
  description: p.description || '',
  unit: p.unit || '',
  price: String(p.price ?? ''),
  discountPrice: p.discountPrice ? String(p.discountPrice) : '',
  stock: String(p.stock ?? 0),
  isActive: p.isActive,
} : EMPTY);

// Typed values as the API takes them. Master listings don't own name/category/description/unit.
function toFields(form) {
  const fields = {
    name: form.name.trim(),
    category: form.category,
    description: form.description.trim(),
    unit: form.unit.trim(),
    price: Number(form.price),
    discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
    stock: Number(form.stock),
    isActive: form.isActive,
  };
  if (form.masterProductId) MASTER_FIELDS.forEach((k) => delete fields[k]);
  return fields;
}

// `categoryOk`: a sub-category is picked, or the saved category is left as it is (it isn't sent then).
function validate(form, isNew, categoryOk) {
  const err = {};
  const price = Number(form.price);
  if (isNew && !form.vendorId) err.vendorId = 'Choose the store selling this product';
  if (!form.masterProductId) {
    if (!form.name.trim()) err.name = 'Product name is required';
    if (!categoryOk) err.category = 'Pick a sub-category';
  }
  if (!(price > 0)) err.price = 'Enter a selling price';
  if (form.discountPrice !== '' && !(Number(form.discountPrice) >= 0 && Number(form.discountPrice) < price)) err.discountPrice = 'Discount price must be lower than the price';
  if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) err.stock = 'Enter stock as a whole number';
  return err;
}

// POST /admin/products and PUT /admin/products/:id (multipart only when `images` are picked)
function ProductForm(props) {
  // Mount only while open so each opening starts from the product's current values.
  return props.open ? <ProductFormBody key={props.product?._id || 'new'} {...props} /> : null;
}

function ProductFormBody({ product, onClose, onSaved, vendors, categories }) {
  const [initial] = useState(() => toForm(product, categories));
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [run, pending] = useAction();
  // Master items can only be picked when creating a listing.
  const masters = useApi(() => (product ? Promise.resolve(null) : masterCatalogApi.list({ isActive: true, limit: 500 })), [], { key: 'master-options' });

  const fromMaster = !!form.masterProductId;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const pickMaster = (id) => {
    const m = masters.data?.items.find((x) => x._id === id);
    setForm((f) => ({ ...f, masterProductId: m?._id || '', price: f.price || (m?.suggestedPrice ? String(m.suggestedPrice) : '') }));
  };

  const save = () => {
    const fields = toFields(form);
    if (!product) {
      const payload = { ...fields, vendorId: form.vendorId, discountPrice: fields.discountPrice ?? undefined };
      if (fromMaster) payload.masterProductId = form.masterProductId;
      else payload.images = files;
      return productsApi.create(payload);
    }
    // Send only what changed; new images replace the old ones.
    const before = toFields(initial);
    const changes = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== before[k]));
    if (files.length && !fromMaster) changes.images = files;
    return Object.keys(changes).length ? productsApi.update(product._id, changes) : Promise.resolve(product);
  };

  const submit = (e) => {
    e.preventDefault();
    const categoryOk = product && form.category && form.category === initial.category ? true : isSubCategory(categories, form.category);
    const err = validate(form, !product, categoryOk);
    setErrors(err);
    if (Object.keys(err).length) return;
    run(save, { success: product ? 'Product updated' : 'Product created' }).then(() => { onSaved(); onClose(); }).catch(() => {});
  };

  const discount = form.discountPrice && Number(form.price) > 0 ? Math.round((1 - Number(form.discountPrice) / Number(form.price)) * 100) : 0;

  return (
    <Drawer
      open
      onClose={onClose}
      width={600}
      title={product ? 'Edit product' : 'Add a product'}
      subtitle={product ? `${product.productId} · ${product.vendor?.storeName || 'Unknown store'}` : 'List a product for a store. Start from the master catalog to keep names consistent.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="product-form" loading={pending} icon={Check}>{product ? 'Save changes' : 'Create product'}</Button></>}
    >
      <form id="product-form" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="form-section-title">Source</div>
          <p className="form-section-desc">{product ? 'The store a listing belongs to cannot be changed.' : 'Choose the store and, ideally, a standard master-catalog product.'}</p>
          <div className="form-grid">
            <Field label="Store" required={!product} error={errors.vendorId}>
              {(id) => (product
                ? <Input id={id} value={product.vendor?.storeName || ''} disabled />
                : <select id={id} className="input" value={form.vendorId} onChange={set('vendorId')}><option value="">{vendors ? 'Select a store…' : 'Loading stores…'}</option>{(vendors || []).map((v) => <option key={v._id} value={v._id}>{v.storeName}</option>)}</select>)}
            </Field>
            {!product && (
              <Field label="Master catalog item" hint="Name, category, unit and images come from it">
                {(id) => <select id={id} className="input" value={form.masterProductId} onChange={(e) => pickMaster(e.target.value)}><option value="">{masters.loading ? 'Loading…' : 'Custom product'}</option>{(masters.data?.items || []).map((m) => <option key={m._id} value={m._id}>{m.name}{m.unit ? ` · ${m.unit}` : ''}{m.brand ? ` · ${m.brand}` : ''}</option>)}</select>}
              </Field>
            )}
          </div>
        </div>
        {fromMaster ? (
          <div className="form-section">
            <div className="form-section-title">Details</div>
            <p className="form-section-desc"><LibraryBig size={13} /> This is a master-catalog listing. Its name, category, unit and images are managed on the master item and synced to every store.</p>
          </div>
        ) : (
          <div className="form-section">
            <div className="form-section-title">Details</div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <Field label="Product name" required error={errors.name} className="span-2">{(id) => <Input id={id} value={form.name} onChange={set('name')} placeholder="e.g. Olpers Full Cream Milk" />}</Field>
              <CategoryPicker categories={categories} value={form.category} onChange={set('category')} error={errors.category} />
              <Field label="Unit / pack size">{(id) => <Input id={id} value={form.unit} onChange={set('unit')} placeholder="1 L, 500 g, 12 pcs" />}</Field>
              <Field label="Description" className="span-2">{(id) => <textarea id={id} className="input textarea" rows={3} value={form.description} onChange={set('description')} placeholder="Short description shown in the customer app" />}</Field>
            </div>
          </div>
        )}
        <div className="form-section">
          <div className="form-section-title">Pricing & stock</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Price" required error={errors.price}>{(id) => <Input id={id} prefix="Rs." type="number" min="0" value={form.price} onChange={set('price')} />}</Field>
            <Field label="Discount price" error={errors.discountPrice} hint={discount > 0 ? `${discount}% off shown to customers` : 'Optional. Leave empty for no discount.'}>{(id) => <Input id={id} prefix="Rs." type="number" min="0" value={form.discountPrice} onChange={set('discountPrice')} />}</Field>
            <Field label="Stock on hand" required error={errors.stock}>{(id) => <Input id={id} type="number" min="0" step="1" suffix="units" value={form.stock} onChange={set('stock')} />}</Field>
            <div className="span-2"><Toggle label="Visible to customers" description="Turn off to hide the listing without deleting it." checked={form.isActive} onChange={set('isActive')} /></div>
          </div>
        </div>
        {!fromMaster && (
          <div className="form-section">
            <div className="form-section-title">Images</div>
            <p className="form-section-desc">Up to 5 photos. The first one is the cover.</p>
            <ImageUpload files={files} onChange={setFiles} max={5} existing={product?.images || []} />
          </div>
        )}
      </form>
    </Drawer>
  );
}

// Header counts: one tiny page per filter, reading only `total`.
function useCounts() {
  return useApi(async () => {
    const count = (params) => productsApi.list({ ...params, limit: 1 }).then((r) => r.total);
    const [all, pending, low, out] = await Promise.all([count({}), count({ approval: 'pending' }), count({ stock: 'low' }), count({ stock: 'out' })]);
    return { all, pending, low, out };
  }, [], { key: 'product-counts' });
}

const thumb = (p) => (p.images?.[0] ? <img src={fileUrl(p.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : undefined);

export default function Products() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const list = useList(productsApi.list, FILTERS, { limit: 10 });
  const [isNew, setIsNew] = useQueryState('new');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [run, pending] = useAction();
  const vendors = useApi(() => vendorsApi.list({ status: 'approved', limit: 500 }), [], { key: 'approved-vendors' });
  const categories = useApi(() => categoriesApi.list(), [], { key: 'categories' });
  const counts = useCounts();
  const c = counts.data;
  const refresh = () => { list.reload(); counts.reload(); };


  const approve = (p) => run(() => productsApi.setApproval(p._id, true), { success: `${p.name} approved` }).then(refresh).catch(() => {});
  const reject = (reason) => run(() => productsApi.setApproval(rejecting._id, false, reason), { success: 'Listing rejected. The store has been notified.' }).then(() => { setRejecting(null); refresh(); }).catch(() => {});
  const toggleActive = (p) => run(() => productsApi.update(p._id, { isActive: !p.isActive }), { success: p.isActive ? `${p.name} hidden` : `${p.name} is visible again` }).then(refresh).catch(() => {});
  const remove = () => run(() => productsApi.remove(deleting._id), { success: 'Product deleted' }).then(() => { setDeleting(null); refresh(); }).catch(() => {});

  const columns = [
    { key: 'name', header: 'Product', render: (p) => <Identity icon={thumb(p)} name={p.name} sub={<>{p.unit && `${p.unit} · `}<Code>{p.productId}</Code></>} /> },
    { key: 'vendor', header: 'Store', hideOnMobile: true, render: (p) => <><span className="cell-strong">{p.vendor?.storeName || '—'}</span><span className="cell-sub">{p.vendor?.vendorId}</span></> },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (p) => <><span>{p.category?.name || '—'}</span>{masterIdOf(p) && <span className="cell-sub">Master catalog item</span>}</> },
    { key: 'price', header: 'Price', align: 'right', render: (p) => (p.discountPrice ? <><span className="cell-strong">{money(p.discountPrice)}</span><span className="cell-sub" style={{ textDecoration: 'line-through' }}>{money(p.price)}</span></> : <span className="cell-strong">{money(p.price)}</span>) },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => (p.stock === 0 ? <Badge tone="danger">Out</Badge> : num(p.stock)) },
    { key: 'status', header: 'Listing', render: (p) => <div className="row" style={{ gap: 4 }}><StatusBadge status={p.isApproved ? 'approved' : 'pending'} />{!p.isActive && <Badge icon={EyeOff}>Hidden</Badge>}</div> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {!p.isApproved && (
            <>
              <Button size="sm" variant="soft" icon={Check} onClick={() => approve(p)}>Approve</Button>
              <Button size="sm" variant="ghost" icon={X} onClick={() => setRejecting(p)} aria-label="Reject" />
            </>
          )}
          <Menu items={[
            { label: 'Edit product', icon: Pencil, onClick: () => setEditing(p) },
            p.isApproved && { label: 'Withdraw approval', icon: X, onClick: () => setRejecting(p) },
            { label: p.isActive ? 'Hide from app' : 'Show in app', icon: p.isActive ? EyeOff : Eye, onClick: () => toggleActive(p) },
            can('vendors') && p.vendor?.vendorId && { label: 'View store', icon: Package, onClick: () => navigate(`/vendors/${p.vendor.vendorId}`) },
            'divider',
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleting(p) },
          ]}
          />
        </div>
      ),
    },
  ];

  const closeForm = () => { setEditing(null); setIsNew(''); };
  const filtered = list.search || Object.values(list.filters).some((v) => v !== 'all');

  return (
    <>
      <PageHeader
        title="Products"
        description="Every product listed by every store. Approve new listings, fix pricing, and keep stock honest."
        actions={<Button icon={Plus} onClick={() => setIsNew('1')}>Add product</Button>}
      />
      <div className="stat-grid">
        <StatCard icon={Package} label="Total listings" value={c ? num(c.all) : '–'} footer={vendors.data ? `${num(vendors.data.total)} approved stores` : 'Across all stores'} onClick={() => list.setFilter('approval', 'all')} />
        <StatCard icon={CircleAlert} tone="amber" label="Waiting for approval" value={c ? num(c.pending) : '–'} footer="Not visible to customers yet" onClick={() => list.setFilter('approval', 'pending')} />
        <StatCard icon={PackageCheck} tone="blue" label="Low stock" value={c ? num(c.low) : '–'} footer="At or below the low-stock level" onClick={() => list.setFilter('stock', 'low')} />
        <StatCard icon={PackageX} tone="rose" label="Out of stock" value={c ? num(c.out) : '–'} footer="Customers can't order these" onClick={() => list.setFilter('stock', 'out')} />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented value={list.filters.approval} onChange={(v) => list.setFilter('approval', v)} options={[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending', count: c?.pending }, { value: 'approved', label: 'Approved' }]} />
          <div className="spacer" />
          <Select value={list.filters.vendorId} onChange={(v) => list.setFilter('vendorId', v)} options={[{ value: 'all', label: 'All stores' }, ...(vendors.data?.items || []).map((v) => ({ value: v._id, label: v.storeName }))]} />
          <Select value={list.filters.category} onChange={(v) => list.setFilter('category', v)} options={[{ value: 'all', label: 'All categories' }, ...categoryOptions(categories.data || [])]} />
          <Select value={list.filters.isActive} onChange={(v) => list.setFilter('isActive', v)} options={[{ value: 'all', label: 'Any visibility' }, { value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }]} />
          <Select value={list.filters.stock} onChange={(v) => list.setFilter('stock', v)} options={[{ value: 'all', label: 'Any stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name or PRD id" />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={setEditing}
          rowClassName={(p) => (p.isApproved ? '' : 'row-attention')}
          empty={<EmptyState icon={Package} title={filtered ? 'No products match' : 'No products yet'} description={filtered ? 'Try a different search or clear the filters.' : 'Products appear here once stores list them.'} action={!filtered && <Button icon={Plus} onClick={() => setIsNew('1')}>Add product</Button>} />}
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>

      <ProductForm open={!!editing || isNew === '1'} product={editing} onClose={closeForm} onSaved={refresh} vendors={vendors.data?.items} categories={categories.data || []} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={pending} title={`Delete ${deleting?.name}?`} description="The listing is removed for good. Past orders keep their copy of the product. To take it off the app but keep it, hide it instead." confirmLabel="Delete product" icon={Trash2} />
      <ConfirmDialog open={!!rejecting} onClose={() => setRejecting(null)} onConfirm={reject} loading={pending} title={rejecting?.isApproved ? 'Withdraw approval?' : 'Reject this listing?'} description="The listing stays hidden from customers. The store sees your reason and can fix it." confirmLabel="Reject listing" reason reasonRequired reasonPlaceholder="e.g. Photos don't match the product" />
    </>
  );
}
