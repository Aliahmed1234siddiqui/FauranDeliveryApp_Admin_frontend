// Products, categories, master catalog and inventory (handbook sections 11-14).
//
// Picture routes: pass File objects under `images` (products, master items, up to 5)
// or `image` (categories, 1 file). `withFiles` sends multipart only when files are
// attached, otherwise JSON. Max 5 MB, jpg/png/webp/pdf.
import { http, withFiles } from '../http';

export const productsApi = {
  /**
   * GET /admin/products   🔒 products
   * params: { search, vendorId, category, approval: pending|approved, isActive: true|false,
   *           stock: out|low, page, limit }
   * item:   { _id, productId, vendor: { vendorId, storeName, name }, category: { categoryId, name },
   *           name, description, images: [url], price, discountPrice, stock, unit,
   *           substitutes, masterProduct: _id | null, isApproved, isActive, createdAt }
   */
  list: (params) => http.page('/admin/products', params),

  /** GET /admin/products/:id → product with vendor, category and substitutes filled in. */
  get: (id) => http.get(`/admin/products/${id}`),

  /**
   * POST /admin/products   🔒 products
   * { vendorId*, price*, name* + category* | masterProductId, discountPrice, stock, unit,
   *   description, isActive, isApproved, substitutes: [id], images: [File] }
   * 409 when the store already lists that master item.
   */
  create: (payload) => http.post('/admin/products', withFiles(payload, 'images')),

  /**
   * PUT /admin/products/:id - send only what changes. New images replace all old ones.
   * Pass discountPrice: null to remove the discount.
   */
  update: (id, payload) => {
    const body = { ...payload };
    if (body.discountPrice === null) body.discountPrice = 'null';
    return http.put(`/admin/products/${id}`, withFiles(body, 'images'));
  },

  /** PATCH /admin/products/:id/approve { isApproved: boolean, reason? } - notifies the store. */
  setApproval: (id, isApproved, reason) => http.patch(`/admin/products/${id}/approve`, { isApproved, reason }),

  /** DELETE /admin/products/:id - for good. To hide instead, update({ isActive: false }). */
  remove: (id) => http.delete(`/admin/products/${id}`),
};

export const categoriesApi = {
  /**
   * GET /admin/categories   🔒 catalog | products  (not paged)
   * params: { search, parent: 'root' | categoryId, isActive }
   * → [{ _id, categoryId, name, parentCategory: null | { _id, categoryId, name }, image,
   *      isActive, productCount, subCategoryCount }]
   */
  list: (params) => http.get('/admin/categories', params),

  /** GET /admin/categories/:id → category + subCategories[] + productCount. */
  get: (id) => http.get(`/admin/categories/${id}`),

  /** POST /admin/categories { name*, parentCategory?, image?: File | url, isActive? } */
  create: (payload) => http.post('/admin/categories', withFiles(payload, 'image')),

  /** PUT /admin/categories/:id - parentCategory '' makes it top-level; image '' removes it. */
  update: (id, payload) => http.put(`/admin/categories/${id}`, withFiles(payload, 'image')),

  /** DELETE /admin/categories/:id - 409 while products, master items or sub-categories use it. */
  remove: (id) => http.delete(`/admin/categories/${id}`),
};

export const masterCatalogApi = {
  /**
   * GET /admin/master-catalog   🔒 catalog | products
   * params: { search, category, brand, isActive, page, limit }
   * item:   { _id, catalogId, name, description, category: { categoryId, name }, brand, unit,
   *           barcode, images, tags, suggestedPrice, isActive, createdAt,
   *           storeCount, priceRange: null | { min, max }, totalStock }
   */
  list: (params) => http.page('/admin/master-catalog', params),

  /**
   * GET /admin/master-catalog/tree?isActive=true
   * → { totalCategories, totalItems, categories: [node] }
   * node: { _id, name, image, isActive, totalItems, items: [item], subCategories: [node] }
   */
  tree: (params) => http.get('/admin/master-catalog/tree', params),

  /** GET /admin/master-catalog/:id → item + createdBy + storeCount + listings[] (cheapest first). */
  get: (id) => http.get(`/admin/master-catalog/${id}`),

  /**
   * POST /admin/master-catalog { name*, category*, brand, unit, barcode, description,
   *   tags: [] | "a, b", suggestedPrice, isActive, images: [File] | [url] }
   * 409 duplicate barcode or same name + brand + unit.
   */
  create: (payload) => http.post('/admin/master-catalog', withFiles(payload, 'images')),

  /**
   * POST /admin/master-catalog/bulk { items: [...] } (1-500, URLs only, `categoryName` allowed)
   * → { created: [item], failed: [{ index, name, error }] }
   * When nothing could be added the server answers 400 with the same body; that is
   * returned here as a normal result so the UI can list the per-row errors.
   */
  bulkCreate: async (items) => {
    try {
      return await http.post('/admin/master-catalog/bulk', { items });
    } catch (err) {
      if (err.status === 400 && err.body?.data?.failed) return err.body.data;
      throw err;
    }
  },

  /**
   * PUT /admin/master-catalog/:id - changes are copied to every store listing.
   * → { item, listingsUpdated }
   */
  update: (id, payload) => http.put(`/admin/master-catalog/${id}`, withFiles(payload, 'images')),

  /** DELETE /admin/master-catalog/:id - 409 while any store sells it. */
  remove: (id) => http.delete(`/admin/master-catalog/${id}`),
};

export const inventoryApi = {
  /**
   * GET /admin/inventory?threshold   🔒 inventory  (not paged)
   * → { threshold,
   *     summary: { totalProducts, activeProducts, pendingApproval, totalUnits, stockValue, outOfStock, lowStock },
   *     outOfStock: [{ _id, name, stock, unit, vendor: { vendorId, storeName } }],
   *     lowStock:   [{ _id, productId, name, stock, unit, vendor }],
   *     byVendor:   [{ vendorId (_id!), storeName, products, units, stockValue, lowStock }],
   *     byCategory: [{ categoryId (_id!), name, products, units }] }
   */
  overview: (params) => http.get('/admin/inventory', params),

  /**
   * GET /admin/dashboard/inventory?threshold   🔒 dashboard | inventory
   * → [{ _id, productId, name, stock, unit, price, images, vendor: { storeName }, category: { name } }]
   */
  lowStock: (params) => http.get('/admin/dashboard/inventory', params),
};
