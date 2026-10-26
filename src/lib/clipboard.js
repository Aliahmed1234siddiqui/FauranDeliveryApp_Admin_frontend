import toast from 'react-hot-toast';

/** Copy an id (or any text) and confirm with a toast. */
export function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(String(text))
    .then(() => toast.success(`Copied ${text}`))
    .catch(() => toast.error('Could not copy to the clipboard'));
}
