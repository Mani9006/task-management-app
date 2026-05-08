/**
 * @fileoverview Date utility helpers for task management operations.
 * Provides formatting, comparison, and calculation functions for due dates,
 * overdue detection, and productivity metrics.
 */

/**
 * Format a date string to ISO YYYY-MM-DD format.
 * @param {Date|string|number} date - Date to format.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to formatDate');
  }
  return d.toISOString().split('T')[0];
}

/**
 * Get the current date in ISO YYYY-MM-DD format.
 * @returns {string} Today's date as YYYY-MM-DD.
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * Check if a given due date is in the past (overdue).
 * A task is overdue if its due date is strictly before today.
 * @param {string} dueDate - Due date in YYYY-MM-DD format.
 * @returns {boolean} True if overdue.
 */
function isOverdue(dueDate) {
  const today = new Date(getToday());
  const due = new Date(dueDate);
  return due < today;
}

/**
 * Check if a due date is today.
 * @param {string} dueDate - Due date in YYYY-MM-DD format.
 * @returns {boolean} True if due today.
 */
function isDueToday(dueDate) {
  return dueDate === getToday();
}

/**
 * Calculate the number of days remaining until the due date.
 * Returns negative values for overdue tasks.
 * @param {string} dueDate - Due date in YYYY-MM-DD format.
 * @returns {number} Days remaining (negative if overdue).
 */
function daysRemaining(dueDate) {
  const today = new Date(getToday());
  const due = new Date(dueDate);
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the age of a task in days since creation.
 * @param {string} createdAt - ISO timestamp of creation.
 * @returns {number} Age in whole days.
 */
function taskAgeInDays(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate average completion time for an array of completed tasks.
 * @param {Array<Object>} tasks - Array of tasks with createdAt and completedAt.
 * @returns {number} Average completion time in days, rounded to 1 decimal.
 */
function averageCompletionTime(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter(
    (t) => t.status === 'done' && t.completedAt && t.createdAt
  );

  if (completedTasks.length === 0) {
    return 0;
  }

  const totalDays = completedTasks.reduce((sum, t) => {
    const start = new Date(t.createdAt).getTime();
    const end = new Date(t.completedAt).getTime();
    return sum + (end - start) / (1000 * 60 * 60 * 24);
  }, 0);

  return Math.round((totalDays / completedTasks.length) * 10) / 10;
}

/**
 * Get start and end dates for a given time range.
 * @param {string} range - One of 'week', 'month', 'quarter', 'year'.
 * @returns {{start: string, end: string}} Start and end dates in YYYY-MM-DD.
 */
function getDateRange(range) {
  const end = getToday();
  const endDate = new Date(end);
  const startDate = new Date(endDate);

  switch (range) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return {
    start: formatDate(startDate),
    end,
  };
}

module.exports = {
  formatDate,
  getToday,
  isOverdue,
  isDueToday,
  daysRemaining,
  taskAgeInDays,
  averageCompletionTime,
  getDateRange,
};
