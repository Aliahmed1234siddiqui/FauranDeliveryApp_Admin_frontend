import { useState } from 'react';
import { Check, LibraryBig } from 'lucide-react';

import { Drawer } from '@/components/overlays';
import { Button, Field, ImageUpload, Input, Toggle } from '@/components/ui';
import { useAction, useApi } from '@/hooks';
import { masterCatalogApi, productsApi } from '@/services/api';

import { categoryOptions, masterIdOf } from '../catalog-utils';

const EMPTY = {
  vendorId: '',
  masterProductId: '',
  name: '',
  category: '',
  description: '',
  unit: '',
  price: '',
  discountPrice: '',
  stock: '',
  isActive: true,
};

const MASTER_FIELDS = ['name', 'category', 'description', 'unit'];

// The list item names its category by readable id; the form needs the _id.
const toForm = (p, categories) =>
  p
    ? {
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
      }
    : EMPTY;

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

function validate(form, isNew) {
  const err = {};
  const price = Number(form.price);
  if (isNew && !form.vendorId) err.vendorId = 'Choose the store selling this product';
  if (!form.masterProductId) {
    if (!form.name.trim()) err.name = 'Product name is required';
    if (!form.category) err.category = 'Pick a category';
  }
  if (!(price > 0)) err.price = 'Enter a selling price';
  if (form.discountPrice !== '' && !(Number(form.discountPrice) >= 0 && Number(form.discountPrice) < price))
    err.discountPrice = 'Discount price must be lower than the price';
  if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
    err.stock = 'Enter stock as a whole number';
  return err;
}

// POST /admin/products and PUT /admin/products/:id (multipart only when `images` are picked)
export function ProductForm(props) {
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
  const masters = useApi(
    () => (product ? Promise.resolve(null) : masterCatalogApi.list({ isActive: true, limit: 500 })),
    [],
    { key: 'master-options' },
  );

  const fromMaster = !!form.masterProductId;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const pickMaster = (id) => {
    const m = masters.data?.items.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      masterProductId: m?._id || '',
      price: f.price || (m?.suggestedPrice ? String(m.suggestedPrice) : ''),
    }));
  };

  const save = () => {
    const fields = toFields(form);
    if (!product) {
      const payload = {
        ...fields,
        vendorId: form.vendorId,
        discountPrice: fields.discountPrice ?? undefined,
      };
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
    const err = validate(form, !product);
    setErrors(err);
    if (Object.keys(err).length) return;
    run(save, { success: product ? 'Product updated' : 'Product created' })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch(() => {});
  };

  const discount =
    form.discountPrice && Number(form.price) > 0
      ? Math.round((1 - Number(form.discountPrice) / Number(form.price)) * 100)
      : 0;

  return (
    <Drawer
      open
      onClose={onClose}
      width={600}
      title={product ? 'Edit product' : 'Add a product'}
      subtitle={
        product
          ? `${product.productId} · ${product.vendor?.storeName || 'Unknown store'}`
          : 'List a product for a store. Start from the master catalog to keep names consistent.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={pending} icon={Check}>
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="form-section-title">Source</div>
          <p className="form-section-desc">
            {product
              ? 'The store a listing belongs to cannot be changed.'
              : 'Choose the store and, ideally, a standard master-catalog product.'}
          </p>
          <div className="form-grid">
            <Field label="Store" required={!product} error={errors.vendorId}>
              {(id) =>
                product ? (
                  <Input id={id} value={product.vendor?.storeName || ''} disabled />
                ) : (
                  <select id={id} className="input" value={form.vendorId} onChange={set('vendorId')}>
                    <option value="">{vendors ? 'Select a store…' : 'Loading stores…'}</option>
                    {(vendors || []).map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.storeName}
                      </option>
                    ))}
                  </select>
                )
              }
            </Field>
            {!product && (
              <Field label="Master catalog item" hint="Name, category, unit and images come from it">
                {(id) => (
                  <select
                    id={id}
                    className="input"
                    value={form.masterProductId}
                    onChange={(e) => pickMaster(e.target.value)}
                  >
                    <option value="">{masters.loading ? 'Loading…' : 'Custom product'}</option>
                    {(masters.data?.items || []).map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                        {m.unit ? ` · ${m.unit}` : ''}
                        {m.brand ? ` · ${m.brand}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}
          </div>
        </div>
        {fromMaster ? (
          <div className="form-section">
            <div className="form-section-title">Details</div>
            <p className="form-section-desc">
              <LibraryBig size={13} /> This is a master-catalog listing. Its name, category, unit and images
              are managed on the master item and synced to every store.
            </p>
          </div>
        ) : (
          <div className="form-section">
            <div className="form-section-title">Details</div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <Field label="Product name" required error={errors.name} className="span-2">
                {(id) => (
                  <Input
                    id={id}
                    value={form.name}
                    onChange={set('name')}
                    placeholder="e.g. Olpers Full Cream Milk"
                  />
                )}
              </Field>
              <Field label="Category" required error={errors.category}>
                {(id) => (
                  <select id={id} className="input" value={form.category} onChange={set('category')}>
                    <option value="">Select…</option>
                    {categoryOptions(categories).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Unit / pack size">
                {(id) => (
                  <Input id={id} value={form.unit} onChange={set('unit')} placeholder="1 L, 500 g, 12 pcs" />
                )}
              </Field>
              <Field label="Description" className="span-2">
                {(id) => (
                  <textarea
                    id={id}
                    className="input textarea"
                    rows={3}
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Short description shown in the customer app"
                  />
                )}
              </Field>
            </div>
          </div>
        )}
        <div className="form-section">
          <div className="form-section-title">Pricing & stock</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Price" required error={errors.price}>
              {(id) => (
                <Input
                  id={id}
                  prefix="Rs."
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={set('price')}
                />
              )}
            </Field>
            <Field
              label="Discount price"
              error={errors.discountPrice}
              hint={
                discount > 0
                  ? `${discount}% off shown to customers`
                  : 'Optional. Leave empty for no discount.'
              }
            >
              {(id) => (
                <Input
                  id={id}
                  prefix="Rs."
                  type="number"
                  min="0"
                  value={form.discountPrice}
                  onChange={set('discountPrice')}
                />
              )}
            </Field>
            <Field label="Stock on hand" required error={errors.stock}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min="0"
                  step="1"
                  suffix="units"
                  value={form.stock}
                  onChange={set('stock')}
                />
              )}
            </Field>
            <div className="span-2">
              <Toggle
                label="Visible to customers"
                description="Turn off to hide the listing without deleting it."
                checked={form.isActive}
                onChange={set('isActive')}
              />
            </div>
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
