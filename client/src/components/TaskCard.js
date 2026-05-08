/**
 * @fileoverview TaskCard component - Displays an individual task with drag support.
 * Renders task info, priority indicator, due date, tags, and action buttons.
 */

import React from 'react';

/**
 * Format a date string to a readable format.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} Formatted date string.
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Check if a due date is overdue.
 * @param {string} dueDate - Due date string.
 * @param {string} status - Task status.
 * @returns {boolean}
 */
function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  const today = new Date().toISOString().split('T')[0];
  return dueDate < today;
}

/**
 * Check if a due date is today.
 * @param {string} dueDate - Due date string.
 * @returns {boolean}
 */
function isDueToday(dueDate) {
  if (!dueDate) return false;
  return dueDate === new Date().toISOString().split('T')[0];
}

/**
 * TaskCard React Component.
 * @param {Object} props
 * @param {Object} props.task - Task data object.
 * @param {Function} props.onEdit - Edit callback.
 * @param {Function} props.onDelete - Delete callback.
 */
function TaskCard({ task, onEdit, onDelete }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isDueToday(task.dueDate);

  const dueClass = overdue ? 'due-overdue' : dueToday ? 'due-today' : 'due-future';
  const dueLabel = overdue
    ? 'Overdue'
    : dueToday
    ? 'Due today'
    : task.dueDate
    ? formatDisplayDate(task.dueDate)
    : '';

  return (
    <div
      className="task-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="listitem"
      aria-label={`Task: ${task.title}`}
    >
      <div className={`task-card-priority priority-${task.priority || 'medium'}`} />

      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <div className="task-card-actions">
          <button
            className="btn-icon"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label="Edit task"
          >
            &#9998;
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(task.id)}
            title="Delete task"
            aria-label="Delete task"
          >
            &#128465;
          </button>
        </div>
      </div>

      {task.description && (
        <div className="task-card-description">{task.description}</div>
      )}

      <div className="task-card-meta">
        {task.category && (
          <span className="task-card-category">{task.category}</span>
        )}
        {dueLabel && (
          <span className={`task-card-due ${dueClass}`}>
            {overdue ? '&#9888; ' : dueToday ? '&#9200; ' : '&#128197; '}
            {dueLabel}
          </span>
        )}
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color:
              task.priority === 'high'
                ? '#ef4444'
                : task.priority === 'medium'
                ? '#f59e0b'
                : '#22c55e',
          }}
        >
          {task.priority}
        </span>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="task-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
