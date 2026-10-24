import { createContext } from 'react';

// { admin, loading, login, logout, can(...permissions), previewAs, setPreviewAs, refreshMe }
export const AuthContext = createContext(null);
