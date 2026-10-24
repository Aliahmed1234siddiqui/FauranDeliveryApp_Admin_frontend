import { EyeOff, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';

import { Menu } from '@/components/overlays';
import { Badge, Button } from '@/components/ui';
import { num } from '@/utils/format';

export function CategoryCard({
  category: c,
  subs,
  editable,
  onEdit,
  onAddSub,
  onToggle,
  onDelete,
  onProducts,
}) {
  return (
    <article className={`cat-card ${c.isActive ? '' : 'is-inactive'}`}>
      <div className="cat-card-head">
        <span className="cat-emoji">{c.image ? <img src={c.image} alt="" /> : <Tags size={22} />}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{c.name}</h3>
          <small>
            {num(c.subCategoryCount)} sub-categories · {num(c.productCount)} products
          </small>
        </div>
        {!c.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
        {editable && (
          <Menu
            items={[
              { label: 'Edit', icon: Pencil, onClick: () => onEdit(c) },
              { label: 'Add sub-category', icon: Plus, onClick: () => onAddSub(c) },
              {
                label: c.isActive ? 'Hide from app' : 'Show in app',
                icon: EyeOff,
                onClick: () => onToggle(c),
              },
              'divider',
              { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => onDelete(c) },
            ]}
          />
        )}
      </div>
      <div className="cat-subs">
        {subs.map((s) => (
          <span
            key={s._id}
            className="chip"
            style={s.isActive ? undefined : { opacity: 0.6 }}
            title={s.isActive ? undefined : 'Hidden from the app'}
          >
            {s.name} <b>{num(s.productCount)}</b>
            {editable && (
              <>
                <button type="button" aria-label={`Edit ${s.name}`} onClick={() => onEdit(s)}>
                  <Pencil size={11} />
                </button>
                <button type="button" aria-label={`Delete ${s.name}`} onClick={() => onDelete(s)}>
                  <X size={12} />
                </button>
              </>
            )}
          </span>
        ))}
        {editable && (
          <button type="button" className="chip chip-add" onClick={() => onAddSub(c)}>
            <Plus size={12} /> Add
          </button>
        )}
        {!editable && !subs.length && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            No sub-categories
          </span>
        )}
      </div>
      <div className="cat-card-foot">
        <span style={{ fontFamily: 'var(--mono)' }}>{c.categoryId}</span>
        <span className="spacer" />
        {onProducts && (
          <Button size="sm" variant="ghost" onClick={() => onProducts(c)}>
            Products
          </Button>
        )}
      </div>
    </article>
  );
}
