import { useCallback, useEffect, useMemo, useState } from 'react';

import { accountApi, authApi } from '@/services/api';
import { LOGOUT_EVENT, tokenStore } from '@/services/http';
import { queryClient } from '@/services/query-client';
import { connectSocket, disconnectSocket } from '@/services/socket';

import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));
  // Lets a super admin preview the portal with an employee's limited permissions.
  const [previewAs, setPreviewAs] = useState(null);

  // Restore the session on reload.
  useEffect(() => {
    if (!tokenStore.get()) return;
    accountApi
      .me()
      .then((me) => {
        setAdmin(me);
        connectSocket();
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // http.js fires this when the token can't be refreshed or the account is blocked.
  useEffect(() => {
    const onLogout = () => {
      disconnectSocket();
      queryClient.clear();
      setPreviewAs(null);
      setAdmin(null);
    };
    window.addEventListener(LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
  }, []);

  const login = useCallback(async (identifier, password, remember = true) => {
    const { accessToken, refreshToken, user } = await authApi.login(identifier, password);
    if (user?.role !== 'admin') throw new Error('This portal is for admin accounts only.');
    tokenStore.set(accessToken, refreshToken, remember);
    // /admin/me has the full record (designation, profile image) used across the portal.
    const me = await accountApi.me().catch(() => user);
    connectSocket();
    setAdmin(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* clear local state regardless */
    }
    tokenStore.clear();
    disconnectSocket();
    queryClient.clear(); // the next admin must never see this one's cached data
    setPreviewAs(null);
    setAdmin(null);
  }, []);

  // Permission-gated calls return null for missing permissions, so re-load everything when the preview role changes.
  useEffect(() => {
    queryClient.resetQueries();
  }, [previewAs]);

  const value = useMemo(() => {
    const effective = previewAs
      ? { ...admin, isSuperAdmin: false, permissions: previewAs.permissions }
      : admin;
    // Same rule as the backend: super admins pass, others need any one of the keys.
    const can = (...keys) =>
      Boolean(effective) &&
      (effective.isSuperAdmin || keys.flat().some((k) => effective.permissions?.includes(k)));
    return {
      admin,
      loading,
      login,
      logout,
      can,
      previewAs,
      setPreviewAs,
      refreshMe: () => accountApi.me().then(setAdmin),
    };
  }, [admin, loading, login, logout, previewAs]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
