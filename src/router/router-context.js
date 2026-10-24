import { createContext } from 'react';

// { pathname, search, navigate(to, { replace }) } — provided by RouterProvider.
export const RouterContext = createContext(null);
