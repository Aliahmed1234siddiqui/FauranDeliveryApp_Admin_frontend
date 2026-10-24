import { useState } from 'react';
import { Check, Layers, Tags } from 'lucide-react';

import { Modal } from '@/components/overlays';
import { Button, Field, ImageUpload, Input, Toggle } from '@/components/ui';
import { useAction } from '@/hooks';
import { categoriesApi } from '@/services/api';

import { parentIdOf } from '../catalog-utils';

const toForm = (c, parent = '') =>
  c
    ? { name: c.name, parentCategory: parentIdOf(c), isActive: c.isActive }
    : { name: '', parentCategory: parent, isActive: true };

// POST /admin/categories & PUT /admin/categories/:id (multipart only when an `image` is picked)
export function CategoryModal(props) {
  return props.state ? (
    <CategoryModalBody key={props.state.category?._id || props.state.parent || 'new'} {...props} />
  ) : null;
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
    return run(() => (editing ? categoriesApi.update(editing._id, payload) : categoriesApi.create(payload)), {
      success: editing ? 'Category updated' : `${isSub ? 'Sub-category' : 'Category'} created`,
    })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch(() => {});
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={isSub ? Layers : Tags}
      title={editing ? `Edit ${editing.name}` : isSub ? 'New sub-category' : 'New category'}
      description={
        isSub
          ? 'Sub-categories group products inside a parent category.'
          : 'Top-level categories appear on the home screen of the customer app.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="cat-form" icon={Check} loading={pending}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="cat-form" className="stack" onSubmit={submit}>
        <Field label="Name" required error={error}>
          {(id) => (
            <Input
              id={id}
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isSub ? 'e.g. Frozen snacks' : 'e.g. Frozen foods'}
            />
          )}
        </Field>
        <Field
          label="Parent category"
          hint={
            canMove ? 'Leave empty for a top-level category' : 'It has sub-categories, so it stays top-level'
          }
        >
          {(id) => (
            <select
              id={id}
              className="input"
              value={form.parentCategory}
              disabled={!canMove}
              onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}
            >
              <option value="">None (top level)</option>
              {parents
                .filter((p) => p._id !== editing?._id)
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
          )}
        </Field>
        <Field label="Image" hint="Optional. Shown on the category in the app.">
          <ImageUpload
            files={file}
            onChange={setFile}
            max={1}
            existing={editing?.image ? [editing.image] : []}
            hint="JPG, PNG or WebP, up to 5 MB"
          />
        </Field>
        <Toggle
          label="Active"
          description="Inactive categories are hidden from customers."
          checked={form.isActive}
          onChange={(v) => setForm({ ...form, isActive: v })}
        />
      </form>
    </Modal>
  );
}
