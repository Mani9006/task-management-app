/**
 * @fileoverview SearchBox component - Provides real-time task search functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Debounce hook for delaying search input.
 * @param {string} value - Value to debounce.
 * @param {number} delay - Delay in ms.
 * @returns {string} Debounced value.
 */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

/**
 * SearchBox component.
 * @param {Object} props
 * @param {Function} props.onResults - Callback with search results.
 * @param {Function} props.onClear - Callback when search is cleared.
 */
function SearchBox({ onResults, onClear }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  const performSearch = useCallback(
    async (searchTerm) => {
      if (!searchTerm || searchTerm.trim().length === 0) {
        onClear();
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/tasks?q=${encodeURIComponent(searchTerm.trim())}`
        );
        const data = await res.json();
        if (data.success) {
          onResults(data.tasks, searchTerm.trim());
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [onResults, onClear]
  );

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <input
        type="text"
        className="form-input"
        placeholder="Search tasks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search tasks"
      />
      {query && (
        <button type="button" className="btn btn-sm btn-secondary" onClick={handleClear}>
          Clear
        </button>
      )}
      {isSearching && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>...</span>}
    </form>
  );
}

export default SearchBox;
