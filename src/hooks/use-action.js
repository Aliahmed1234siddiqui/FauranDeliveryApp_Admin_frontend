import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// Run a mutation with a loading flag and toast feedback.
// A successful change refreshes what's on screen (sidebar badges, header counts) and marks
// every other cached query stale, so other pages refetch when they're opened.
export function useAction() {
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (fn, { success, error } = {}) => {
      setPending(true);
      try {
        const result = await fn();
        client.invalidateQueries();
        if (success) toast.success(success);
        return result;
      } catch (err) {
        toast.error(error || err.message || 'Something went wrong');
        throw err;
      } finally {
        setPending(false);
      }
    },
    [client],
  );
  return [run, pending];
}
