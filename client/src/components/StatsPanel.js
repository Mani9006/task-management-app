/**
 * @fileoverview StatsPanel component - Displays task statistics and productivity metrics.
 */

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const defaultStats = {
  total: 0,
  byStatus: { todo: 0, 'in-progress': 0, done: 0 },
  overdue: 0,
  dueToday: 0,
  highPriorityPending: 0,
  completionRate: 0,
  productivityScore: 0,
  avgCompletionDays: 0,
  categories: 0,
  tags: 0,
};

/**
 * ProgressBar sub-component.
 * @param {Object} props
 * @param {number} props.percent - Percentage value.
 * @param {string} props.variant - Color variant.
 * @param {string} props.label - Label text.
 */
function ProgressBar({ percent, variant, label }) {
  return (
    <div className="stat-bar-container">
      <div className="stat-bar-label">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="stat-bar">
        <div
          className={`stat-bar-fill ${variant}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * StatsPanel component.
 * @param {Object} props
 * @param {boolean} props.visible - Whether panel is visible.
 */
function StatsPanel({ visible }) {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  if (loading) {
    return <div className="loading-spinner">Loading statistics...</div>;
  }

  const todoPercent =
    stats.total > 0 ? Math.round((stats.byStatus.todo / stats.total) * 100) : 0;
  const inProgressPercent =
    stats.total > 0 ? Math.round((stats.byStatus['in-progress'] / stats.total) * 100) : 0;

  return (
    <div className="stats-panel">
      <h3 className="stats-panel-title">Dashboard</h3>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value primary">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>

        <div className="stat-card">
          <div className="stat-value warning">{stats.byStatus.todo}</div>
          <div className="stat-label">To Do</div>
        </div>

        <div className="stat-card">
          <div className="stat-value info">{stats.byStatus['in-progress']}</div>
          <div className="stat-label">In Progress</div>
        </div>

        <div className="stat-card">
          <div className="stat-value success">{stats.byStatus.done}</div>
          <div className="stat-label">Completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-value danger">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>

        <div className="stat-card">
          <div className={`stat-value ${stats.dueToday > 0 ? 'warning' : 'success'}`}>
            {stats.dueToday}
          </div>
          <div className="stat-label">Due Today</div>
        </div>

        <div className="stat-card">
          <div className={`stat-value ${stats.highPriorityPending > 3 ? 'danger' : 'warning'}`}>
            {stats.highPriorityPending}
          </div>
          <div className="stat-label">High Priority</div>
        </div>

        <div className="stat-card">
          <div className="stat-value primary">{stats.avgCompletionDays}d</div>
          <div className="stat-label">Avg. Completion</div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <ProgressBar
          percent={stats.completionRate}
          variant={stats.completionRate >= 75 ? 'success' : stats.completionRate >= 50 ? 'warning' : 'danger'}
          label="Completion Rate"
        />
        <ProgressBar
          percent={stats.productivityScore}
          variant={stats.productivityScore >= 75 ? 'success' : stats.productivityScore >= 40 ? 'warning' : 'danger'}
          label="Productivity Score"
        />
      </div>

      {stats.categories > 0 && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '0.8rem',
            color: '#64748b',
            display: 'flex',
            gap: '20px',
          }}
        >
          <span>{stats.categories} categories</span>
          <span>{stats.tags} unique tags</span>
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
