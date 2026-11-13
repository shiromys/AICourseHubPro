import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

// Waits until the admin stops typing before the value is used, so each keystroke does not hit the server.
export const useDebounced = (value, ms = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};

// The one search box used across the admin pages.
const AdminSearch = ({ value, onChange, placeholder = 'Search name or email', className = '', testId = 'admin-search' }) => (
  <div className={`relative ${className}`}>
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      aria-label={placeholder} data-testid={testId} autoComplete="off"
      className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-red-500 transition"
    />
    {value && (
      <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
        <X size={16} />
      </button>
    )}
  </div>
);

export default AdminSearch;
