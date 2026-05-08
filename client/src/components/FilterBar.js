/**
 * @fileoverview FilterBar component - Provides filtering and sorting controls.
 */

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * FilterBar component.
 * @param {Object} props
 * @param {Object} props.filters - Current filter values.
 * @param {Function} props.onFilterChange - Callback when filters change.
 * @param {Function} props.onClearFilters - Callback to clear all filters.
 */
function FilterBar({ filters, onFilterChange, onClearFilters }) {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    async function fetchMeta() {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch(`${API_BASE}/tasks/categories`),
          fetch(`${API_BASE}/tasks/tags`),
        ]);
        const catData = await catRes.json();
        const tagData = await tagRes.json();
        if (catData.success) setCategories(catData.categories);
        if (tagData.success) setTags(tagData.tags);
      } catch (err) {
        console.error('Failed to fetch filter metadata:', err);
      }
    }
    fetchMeta();
  }, []);

  const hasActiveFilters =
    filters.status || filters.priority || filters.category || filters.tag;

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          className="form-select"
          value={filters.status || ''}
          onChange={(e) => onFilterChange('status', e.target.value || undefined)}
        >
          <option value="">All</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-priority">Priority</label>
        <select
          id="filter-priority"
          className="form-select"
          value={filters.priority || ''}
          onChange={(e) => onFilterChange('priority', e.target.value || undefined)}
        >
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {categories.length > 0 && (
        <div className="filter-group">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            className="form-select"
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value || undefined)}
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {tags.length > 0 && (
        <div className="filter-group">
          <label htmlFor="filter-tag">Tag</label>
          <select
            id="filter-tag"
            className="form-select"
            value={filters.tag || ''}
            onChange={(e) => onFilterChange('tag', e.target.value || undefined)}
          >
            <option value="">All</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label htmlFor="sort-by">Sort</label>
        <select
          id="sort-by"
          className="form-select"
          value={filters.sortBy || 'createdAt'}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
        >
          <option value="createdAt">Created</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort-order">Order</label>
        <select
          id="sort-order"
          className="form-select"
          value={filters.sortOrder || 'desc'}
          onChange={(e) => onFilterChange('sortOrder', e.target.value)}
        >
          <option value="desc">Newest</option>
          <option value="asc">Oldest</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button className="btn btn-sm btn-secondary" onClick={onClearFilters}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default FilterBar;
