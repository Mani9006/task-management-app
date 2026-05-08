/**
 * @fileoverview Task routes for CRUD operations, search, filtering, and drag-and-drop.
 * Handles all task-related HTTP endpoints.
 */

const express = require('express');
const router = express.Router();
const taskStore = require('../models/taskStore');
const {
  validateCreateTask,
  validateUpdateTask,
  validateId,
  validateQueryParams,
} = require('../middleware/validator');

/**
 * GET /api/tasks
 * Get all tasks with optional filtering, sorting, and searching.
 * Query params: status, priority, category, tag, overdue, search, sortBy, sortOrder
 */
router.get('/', validateQueryParams, (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      tag: req.query.tag,
      overdue: req.query.overdue,
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const tasks = taskStore.getAllTasks(filters);

    res.json({
      success: true,
      count: tasks.length,
      filters,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message,
    });
  }
});

/**
 * GET /api/tasks/categories
 * Get all unique categories.
 */
router.get('/categories', (req, res) => {
  try {
    const categories = taskStore.getCategories();
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message,
    });
  }
});

/**
 * GET /api/tasks/tags
 * Get all unique tags.
 */
router.get('/tags', (req, res) => {
  try {
    const tags = taskStore.getTags();
    res.json({
      success: true,
      tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tags',
      error: error.message,
    });
  }
});

/**
 * GET /api/tasks/search
 * Search tasks by title or description.
 * Query param: q (search query)
 */
router.get('/search', (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter "q" is required',
      });
    }

    const tasks = taskStore.getAllTasks({ search: query.trim() });
    res.json({
      success: true,
      query: query.trim(),
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID.
 */
router.get('/:id', validateId, (req, res) => {
  try {
    const task = taskStore.getTaskById(req.validatedId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${req.validatedId} not found`,
      });
    }
    res.json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: error.message,
    });
  }
});

/**
 * POST /api/tasks
 * Create a new task.
 */
router.post('/', validateCreateTask, (req, res) => {
  try {
    const task = taskStore.createTask(req.validatedData);
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Update an existing task.
 */
router.put('/:id', validateId, validateUpdateTask, (req, res) => {
  try {
    const task = taskStore.updateTask(req.validatedId, req.validatedData);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${req.validatedId} not found`,
      });
    }
    res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Quick update task status (for drag-and-drop).
 */
router.patch('/:id/status', validateId, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in-progress', 'done'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const task = taskStore.moveTask(req.validatedId, status);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${req.validatedId} not found`,
      });
    }
    res.json({
      success: true,
      message: 'Task status updated',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message,
    });
  }
});

/**
 * POST /api/tasks/:id/move
 * Move task to a different column with reordering.
 */
router.post('/:id/move', validateId, (req, res) => {
  try {
    const { status, index } = req.body;
    const validStatuses = ['todo', 'in-progress', 'done'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const targetIndex = typeof index === 'number' ? index : -1;

    if (targetIndex >= 0) {
      const success = taskStore.reorderTasks(req.validatedId, status, targetIndex);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${req.validatedId} not found`,
        });
      }
      const task = taskStore.getTaskById(req.validatedId);
      return res.json({
        success: true,
        message: 'Task moved and reordered',
        task,
      });
    }

    const task = taskStore.moveTask(req.validatedId, status);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${req.validatedId} not found`,
      });
    }
    res.json({
      success: true,
      message: 'Task moved successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to move task',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task.
 */
router.delete('/:id', validateId, (req, res) => {
  try {
    const deleted = taskStore.deleteTask(req.validatedId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${req.validatedId} not found`,
      });
    }
    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
});

module.exports = router;
