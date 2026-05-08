/**
 * @fileoverview Task data persistence layer using JSON file storage.
 * Provides CRUD operations, filtering, searching, and bulk updates.
 * All operations are synchronous for simplicity with JSON file backing.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// In-memory cache for tasks
let tasksCache = null;
let lastId = 0;

/**
 * Ensure the data directory and file exist.
 */
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * Load tasks from the JSON file into the cache.
 * @returns {Array<Object>} Array of task objects.
 */
function loadTasks() {
  ensureDataFile();
  if (tasksCache === null) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    try {
      tasksCache = JSON.parse(raw);
      if (!Array.isArray(tasksCache)) {
        tasksCache = [];
      }
    } catch {
      tasksCache = [];
    }
    // Update lastId based on existing tasks
    if (tasksCache.length > 0) {
      const maxId = Math.max(...tasksCache.map((t) => t.id || 0));
      lastId = maxId;
    }
  }
  return tasksCache;
}

/**
 * Persist the current task cache to the JSON file.
 */
function persistTasks() {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasksCache || [], null, 2), 'utf-8');
}

/**
 * Generate a new unique task ID.
 * @returns {number} Next sequential ID.
 */
function generateId() {
  lastId += 1;
  return lastId;
}

/**
 * Reset the cache (useful in tests).
 */
function resetCache() {
  tasksCache = null;
  lastId = 0;
}

/**
 * Set cache directly (useful in tests).
 * @param {Array<Object>} tasks - Tasks to set.
 */
function setCache(tasks) {
  tasksCache = tasks;
  if (tasks.length > 0) {
    lastId = Math.max(...tasks.map((t) => t.id || 0));
  } else {
    lastId = 0;
  }
}

/**
 * Get all tasks, optionally filtered.
 * @param {Object} filters - Optional filters to apply.
 * @param {string} [filters.status] - Filter by status.
 * @param {string} [filters.priority] - Filter by priority.
 * @param {string} [filters.category] - Filter by category.
 * @param {string} [filters.tag] - Filter by tag.
 * @param {boolean} [filters.overdue] - Filter overdue tasks.
 * @param {string} [filters.search] - Search in title and description.
 * @param {string} [filters.sortBy] - Field to sort by.
 * @param {string} [filters.sortOrder] - Sort order ('asc' or 'desc').
 * @returns {Array<Object>} Filtered and sorted tasks.
 */
function getAllTasks(filters = {}) {
  let tasks = loadTasks();

  const {
    status,
    priority,
    category,
    tag,
    overdue,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }

  if (priority) {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  if (category) {
    tasks = tasks.filter((t) => t.category === category);
  }

  if (tag) {
    tasks = tasks.filter((t) => t.tags && t.tags.includes(tag));
  }

  if (overdue === 'true' || overdue === true) {
    const today = new Date().toISOString().split('T')[0];
    tasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
    );
  }

  if (search) {
    const query = search.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }

  // Sort
  tasks.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    }
    return valA > valB ? -1 : valA < valB ? 1 : 0;
  });

  return tasks;
}

/**
 * Get a single task by its ID.
 * @param {number} id - Task ID.
 * @returns {Object|null} Task object or null.
 */
function getTaskById(id) {
  const tasks = loadTasks();
  return tasks.find((t) => t.id === Number(id)) || null;
}

/**
 * Create a new task.
 * @param {Object} taskData - Task data.
 * @param {string} taskData.title - Task title.
 * @param {string} [taskData.description] - Task description.
 * @param {string} [taskData.priority='medium'] - Priority level.
 * @param {string} [taskData.status='todo'] - Task status.
 * @param {string} [taskData.dueDate] - Due date in YYYY-MM-DD.
 * @param {string} [taskData.category='general'] - Category.
 * @param {Array<string>} [taskData.tags=[]] - Tags array.
 * @returns {Object} Created task.
 */
function createTask(taskData) {
  const tasks = loadTasks();

  const now = new Date().toISOString();
  const newTask = {
    id: generateId(),
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    status: taskData.status || 'todo',
    dueDate: taskData.dueDate || null,
    category: taskData.category || 'general',
    tags: Array.isArray(taskData.tags) ? taskData.tags : [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  tasks.push(newTask);
  persistTasks();
  return newTask;
}

/**
 * Update an existing task.
 * @param {number} id - Task ID.
 * @param {Object} updates - Fields to update.
 * @returns {Object|null} Updated task or null if not found.
 */
function updateTask(id, updates) {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === Number(id));

  if (index === -1) {
    return null;
  }

  const allowedFields = [
    'title',
    'description',
    'priority',
    'status',
    'dueDate',
    'category',
    'tags',
  ];

  const now = new Date().toISOString();
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      tasks[index][field] = updates[field];
    }
  });

  // Track completion time when status changes to done
  if (updates.status === 'done' && tasks[index].completedAt === null) {
    tasks[index].completedAt = now;
  }

  // Reset completedAt if moved out of done
  if (updates.status && updates.status !== 'done') {
    tasks[index].completedAt = null;
  }

  tasks[index].updatedAt = now;
  persistTasks();
  return tasks[index];
}

/**
 * Delete a task by ID.
 * @param {number} id - Task ID.
 * @returns {boolean} True if deleted, false if not found.
 */
function deleteTask(id) {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === Number(id));

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  persistTasks();
  return true;
}

/**
 * Move a task to a different status column (drag-and-drop).
 * @param {number} id - Task ID.
 * @param {string} newStatus - New status value.
 * @returns {Object|null} Updated task or null.
 */
function moveTask(id, newStatus) {
  return updateTask(id, { status: newStatus });
}

/**
 * Get all unique categories used across tasks.
 * @returns {Array<string>} Sorted unique categories.
 */
function getCategories() {
  const tasks = loadTasks();
  const categories = new Set(tasks.map((t) => t.category).filter(Boolean));
  return Array.from(categories).sort();
}

/**
 * Get all unique tags used across tasks.
 * @returns {Array<string>} Sorted unique tags.
 */
function getTags() {
  const tasks = loadTasks();
  const tagSet = new Set();
  tasks.forEach((t) => {
    if (Array.isArray(t.tags)) {
      t.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
}

/**
 * Get task statistics.
 * @returns {Object} Statistics object.
 */
function getStats() {
  const tasks = loadTasks();
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  ).length;

  const dueToday = tasks.filter((t) => t.dueDate === today).length;
  const highPriorityPending = tasks.filter(
    (t) => t.priority === 'high' && t.status !== 'done'
  ).length;

  // Completion rate
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Productivity score: weighted by priority
  const priorityWeights = { low: 1, medium: 2, high: 3 };
  const potentialPoints = tasks.reduce(
    (sum, t) => sum + (priorityWeights[t.priority] || 1),
    0
  );
  const earnedPoints = tasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + (priorityWeights[t.priority] || 1), 0);
  const productivityScore =
    potentialPoints > 0 ? Math.round((earnedPoints / potentialPoints) * 100) : 0;

  // Average completion time
  const completedTasks = tasks.filter(
    (t) => t.status === 'done' && t.completedAt && t.createdAt
  );
  let avgCompletionDays = 0;
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce((sum, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.completedAt).getTime();
      return sum + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    avgCompletionDays = Math.round((totalDays / completedTasks.length) * 10) / 10;
  }

  return {
    total,
    byStatus: { todo, 'in-progress': inProgress, done },
    overdue,
    dueToday,
    highPriorityPending,
    completionRate,
    productivityScore,
    avgCompletionDays,
    categories: getCategories().length,
    tags: getTags().length,
  };
}

/**
 * Reorder tasks within a column (for drag-and-drop ordering).
 * @param {number} taskId - ID of the task being moved.
 * @param {string} status - Target status column.
 * @param {number} targetIndex - Target index within the column.
 * @returns {boolean} True if reordered successfully.
 */
function reorderTasks(taskId, status, targetIndex) {
  const tasks = loadTasks();
  const taskIndex = tasks.findIndex((t) => t.id === Number(taskId));

  if (taskIndex === -1) {
    return false;
  }

  // Move task to new status if different
  const task = tasks[taskIndex];
  if (task.status !== status) {
    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === 'done' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    if (status !== 'done') {
      task.completedAt = null;
    }
  }

  // Remove from current position and insert at target
  tasks.splice(taskIndex, 1);

  // Find correct insertion point based on targetIndex within the status group
  const statusTasks = tasks.filter((t) => t.status === status);
  const otherTasks = tasks.filter((t) => t.status !== status);

  let insertIndex = 0;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].status === status) {
      if (insertIndex === targetIndex) {
        tasks.splice(i, 0, task);
        persistTasks();
        return true;
      }
      insertIndex++;
    }
  }

  // If target index is at the end, append
  tasks.push(task);
  persistTasks();
  return true;
}

module.exports = {
  loadTasks,
  persistTasks,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getCategories,
  getTags,
  getStats,
  reorderTasks,
  resetCache,
  setCache,
  generateId,
};
