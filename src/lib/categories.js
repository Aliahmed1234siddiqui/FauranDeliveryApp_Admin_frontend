// Main categories have no parentCategory; sub-categories have one.
export const parentOf = (c) => c?.parentCategory?._id || c?.parentCategory || '';

// Products and master items must sit in a sub-category (the API answers 400 for a main one).
export const isSubCategory = (categories, id) => !!parentOf(categories.find((c) => c._id === id));

// Top-level categories, each followed by its sub-categories. Used by the list filters,
// where picking a main category also matches its sub-categories' products.
export function categoryOptions(categories) {
  return categories.filter((c) => !c.parentCategory).flatMap((top) => [
    { value: top._id, label: top.name },
    ...categories.filter((c) => parentOf(c) === top._id).map((c) => ({ value: c._id, label: `— ${c.name}` })),
  ]);
}
