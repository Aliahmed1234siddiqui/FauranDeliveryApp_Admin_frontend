import { useContext } from 'react';

import { RouterContext } from './router-context';

export const useRouter = () => useContext(RouterContext);
