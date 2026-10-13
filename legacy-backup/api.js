const request = async (path, init) => {
    const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
    if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
    return response.json();
};
export const adminApi = {
    health: () => request('/api/health'),
    dashboard: () => request('/api/dashboard'),
    vendors: () => request('/api/vendors'),
    riders: () => request('/api/riders'),
    orders: () => request('/api/orders'),
    customers: () => request('/api/customers'),
    categories: () => request('/api/categories'),
    updateVendorStatus: (id, status) => request(`/api/vendors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    updateRiderStatus: (id, status) => request(`/api/riders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    createCategory: (name, icon) => request('/api/categories', { method: 'POST', body: JSON.stringify({ name, icon }) }),
};
