/* eslint-disable react-refresh/only-export-components -- context module: provider + its hook */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, authApi } from '../services/adminApi';
import { tokenStore } from '../services/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));
  // Lets a super admin preview the portal with an employee's limited permissions.
  const [previewAs, setPreviewAs] = useState(null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    adminApi.getMe()
      .then(setAdmin)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setAdmin(null);
    window.addEventListener('fauran:logout', onLogout);
    return () => window.removeEventListener('fauran:logout', onLogout);
  }, []);

  const login = useCallback(async (identifier, password, remember = true) => {
    const { accessToken, user } = await authApi.login(identifier, password);
    if (user.role !== 'admin') throw new Error('This portal is for admin accounts only');
    if (remember) tokenStore.set(accessToken);
    setAdmin(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* clear local state regardless */ }
    tokenStore.clear();
    setPreviewAs(null);
    setAdmin(null);
  }, []);

  const value = useMemo(() => {
    const effective = previewAs ? { ...admin, isSuperAdmin: false, permissions: previewAs.permissions } : admin;
    // Same rule as permissionMiddleware: super admins pass, others need any one of the keys.
    const can = (...keys) => Boolean(effective) && (effective.isSuperAdmin || keys.flat().some((k) => effective.permissions?.includes(k)));
    return { admin, loading, login, logout, can, previewAs, setPreviewAs };
  }, [admin, loading, login, logout, previewAs]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
