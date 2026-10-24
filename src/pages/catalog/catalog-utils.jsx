import { money } from '@/utils/format';

// Helpers shared by the product and master-catalog pages.

// Category <select> options: top-level categories, each followed by its sub-categories.
export function categoryOptions(categories) {
  return categories
    .filter((c) => !c.parentCategory)
    .flatMap((top) => [
      { value: top._id, label: top.name },
      ...categories
        .filter((c) => c.parentCategory?._id === top._id)
        .map((c) => ({ value: c._id, label: `— ${c.name}` })),
    ]);
}

// Square thumbnail for a row that has `images`, or undefined to fall back to the default icon.
export const imageThumb = (item) =>
  item.images?.[0] ? (
    <img
      src={item.images[0]}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
    />
  ) : undefined;

// Min–max price across vendor listings of a master item.
export const priceRange = (r) =>
  !r ? '—' : r.min === r.max ? money(r.min) : `${money(r.min)} – ${money(r.max)}`;

// Products and categories reference each other either populated or by plain id.
export const masterIdOf = (p) => p?.masterProduct?._id || p?.masterProduct || '';
export const parentIdOf = (c) => c.parentCategory?._id || '';
