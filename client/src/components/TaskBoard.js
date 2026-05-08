/**
 * @fileoverview TaskBoard component - Kanban board with drag-and-drop columns.
 */

import React, { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo', label: 'To Do', className: 'column-todo' },
  { key: 'in-progress', label: 'In Progress', className: 'column-in-progress' },
  { key: 'done', label: 'Done', className: 'column-done' },
];

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * TaskBoard component.
 * @param {Object} props
 * @param {Array} props.tasks - Array of task objects.
 * @param {Function} props.onUpdate - Callback when a task is updated.
 * @param {Function} props.onDelete - Callback when a task is deleted.
 * @param {Function} props.onEdit - Callback when a task is edited.
 * @param {boolean} props.loading - Loading state.
 */
function TaskBoard({ tasks, onUpdate, onDelete, onEdit, loading }) {
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => String(t.id) === taskId);
    if (!task || task.status === columnKey) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: columnKey }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const getTasksForColumn = (columnKey) =>
    tasks.filter((t) => t.status === columnKey);

  if (loading) {
    return <div className="loading-spinner">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128466;</div>
        <p>No tasks found.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="task-board">
      {COLUMNS.map((column) => {
        const columnTasks = getTasksForColumn(column.key);
        const isDragOver = dragOverColumn === column.key;

        return (
          <div
            key={column.key}
            className={`column ${column.className} ${isDragOver ? 'column-drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
            role="list"
            aria-label={`${column.label} column`}
          >
            <div className="column-header">
              <span className="column-title">{column.label}</span>
              <span className="column-count">{columnTasks.length}</span>
            </div>

            {columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}

            {columnTasks.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                }}
              >
                Drop tasks here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskBoard;
