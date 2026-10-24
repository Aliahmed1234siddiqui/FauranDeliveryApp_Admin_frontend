import { Search, X } from 'lucide-react';

import { cx } from '@/utils/cx';

export function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus }) {
  return (
    <label className={cx('search', className)}>
      <Search size={16} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </label>
  );
}
