/**
 * @fileoverview App component - Root component for the Task Management System.
 * Manages global state, task CRUD operations, filtering, and modal display.
 */

import React, { useState, useEffect, useCallback } from 'react';
import TaskBoard from './components/TaskBoard';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import SearchBox from './components/SearchBox';
import StatsPanel from './components/StatsPanel';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Build query string from filter object.
 * @param {Object} filters - Filter key-value pairs.
 * @returns {string} Query string.
 */
function buildQueryString(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showStats, setShowStats] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQueryString(filters);
      const url = `${API_BASE}/tasks${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      } else {
        setError(data.message || 'Failed to load tasks');
      }
    } catch (err) {
      setError('Network error. Is the server running?');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setIsSearchActive(false);
  };

  const handleSearchResults = (results) => {
    setTasks(results);
    setIsSearchActive(true);
  };

  const handleSearchClear = () => {
    setIsSearchActive(false);
    fetchTasks();
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      } else {
        setError(data.message || 'Failed to delete task');
      }
    } catch (err) {
      setError('Network error while deleting');
      console.error('Delete error:', err);
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      const url = taskData.id
        ? `${API_BASE}/tasks/${taskData.id}`
        : `${API_BASE}/tasks`;
      const method = taskData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditingTask(null);
        fetchTasks();
      } else {
        setError(data.message || 'Failed to save task');
      }
    } catch (err) {
      setError('Network error while saving');
      console.error('Save error:', err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <span>&#128203;</span> Task Manager
        </h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowStats((s) => !s)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button className="btn btn-primary" onClick={handleCreateTask}>
            <span>&#43;</span> New Task
          </button>
        </div>
      </header>

      <StatsPanel visible={showStats} />

      <div className="toolbar">
        <SearchBox onResults={handleSearchResults} onClear={handleSearchClear} />
        <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }} />
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button
            className="btn-icon"
            style={{ marginLeft: '12px', fontSize: '0.8rem' }}
            onClick={() => setError(null)}
          >
            &#10005; Dismiss
          </button>
        </div>
      )}

      <TaskBoard
        tasks={tasks}
        onUpdate={fetchTasks}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
        loading={loading}
      />

      <TaskForm
        isOpen={showForm}
        task={editingTask}
        onSave={handleSaveTask}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}

export default App;
