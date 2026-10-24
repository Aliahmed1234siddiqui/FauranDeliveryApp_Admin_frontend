import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';

import { Drawer } from '@/components/overlays';
import { Button, Field, ImageUpload, Input, Toggle } from '@/components/ui';
import { useAction } from '@/hooks';
import { masterCatalogApi } from '@/services/api';
import { num } from '@/utils/format';

import { categoryOptions } from '../catalog-utils';

const EMPTY = {
  name: '',
  category: '',
  brand: '',
  unit: '',
  barcode: '',
  description: '',
  tags: '',
  suggestedPrice: '',
  isActive: true,
};

// ---------------------------------------------------------------------------
// Create / edit: POST /admin/master-catalog & PUT /admin/master-catalog/:id
// ---------------------------------------------------------------------------
const toForm = (m, categories) =>
  m
    ? {
        name: m.name || '',
        category: categories.find((c) => c.categoryId === m.category?.categoryId)?._id || '',
        brand: m.brand || '',
        unit: m.unit || '',
        barcode: m.barcode || '',
        description: m.description || '',
        tags: (m.tags || []).join(', '),
        suggestedPrice: m.suggestedPrice != null ? String(m.suggestedPrice) : '',
        isActive: m.isActive,
      }
    : EMPTY;

export function MasterForm(props) {
  return props.open ? <MasterFormBody key={props.item?._id || 'new'} {...props} /> : null;
}

function MasterFormBody({ item, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => toForm(item, categories));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [run, pending] = useAction();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!form.category) err.category = 'Pick a category';
    if (form.suggestedPrice !== '' && !(Number(form.suggestedPrice) >= 0))
      err.suggestedPrice = 'Enter a valid price';
    setErrors(err);
    if (Object.keys(err).length) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      unit: form.unit.trim(),
      barcode: form.barcode.trim(),
      description: form.description.trim(),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      suggestedPrice: form.suggestedPrice === '' ? (item ? null : undefined) : Number(form.suggestedPrice),
      isActive: form.isActive,
      images: files, // only sent when files were picked; they replace the saved ones
    };
    if (!item) {
      run(() => masterCatalogApi.create(payload), { success: 'Added to the master catalog' })
        .then(() => {
          onSaved();
          onClose();
        })
        .catch(() => {});
      return;
    }
    run(() => masterCatalogApi.update(item._id, payload))
      .then(({ listingsUpdated } = {}) => {
        toast.success(
          listingsUpdated
            ? `Master item updated · ${listingsUpdated} store listings synced`
            : 'Master item updated',
        );
        onSaved();
        onClose();
      })
      .catch(() => {});
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={560}
      title={item ? 'Edit master item' : 'New master item'}
      subtitle={
        item
          ? `${item.catalogId} · sold by ${num(item.storeCount)} stores. Changes are copied to every store listing.`
          : 'Stores pick from this list when they add products, so names and units stay consistent.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="master-form" icon={Check} loading={pending}>
            {item ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <form id="master-form" onSubmit={submit} className="form-grid" noValidate>
        <Field label="Product name" required error={errors.name} className="span-2">
          {(id) => (
            <Input
              id={id}
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Nestlé Milkpak UHT Milk"
            />
          )}
        </Field>
        <Field label="Brand">
          {(id) => <Input id={id} value={form.brand} onChange={set('brand')} placeholder="Nestlé" />}
        </Field>
        <Field label="Unit / pack size">
          {(id) => <Input id={id} value={form.unit} onChange={set('unit')} placeholder="1 L" />}
        </Field>
        <Field
          label="Category"
          required
          error={errors.category}
          hint="A category or one of its sub-categories"
        >
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
        <Field
          label="Suggested price"
          error={errors.suggestedPrice}
          hint="Shown to stores as a starting price"
        >
          {(id) => (
            <Input
              id={id}
              type="number"
              min="0"
              prefix="Rs."
              value={form.suggestedPrice}
              onChange={set('suggestedPrice')}
            />
          )}
        </Field>
        <Field label="Barcode (EAN)">
          {(id) => (
            <Input id={id} value={form.barcode} onChange={set('barcode')} placeholder="8964000123456" />
          )}
        </Field>
        <Field label="Tags" hint="Comma separated, helps search">
          {(id) => <Input id={id} value={form.tags} onChange={set('tags')} placeholder="milk, dairy, uht" />}
        </Field>
        <Field label="Description" className="span-2">
          {(id) => (
            <textarea
              id={id}
              className="input textarea"
              rows={3}
              value={form.description}
              onChange={set('description')}
            />
          )}
        </Field>
        <Field label="Images" className="span-2">
          <ImageUpload files={files} onChange={setFiles} max={5} existing={item?.images || []} />
        </Field>
        <div className="span-2">
          <Toggle
            label="Available to stores"
            description="Inactive items can't be picked for new listings."
            checked={form.isActive}
            onChange={set('isActive')}
          />
        </div>
      </form>
    </Drawer>
  );
}
