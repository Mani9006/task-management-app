/**
 * @fileoverview Statistics routes for task analytics dashboard.
 * Provides aggregated metrics and productivity insights.
 */

const express = require('express');
const router = express.Router();
const taskStore = require('../models/taskStore');

/**
 * GET /api/stats
 * Get overall task statistics and productivity metrics.
 */
router.get('/', (req, res) => {
  try {
    const stats = taskStore.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/stats/status
 * Get breakdown of tasks by status.
 */
router.get('/status', (req, res) => {
  try {
    const allTasks = taskStore.getAllTasks();
    const statusCounts = {};
    const statusTasks = {};

    ['todo', 'in-progress', 'done'].forEach((status) => {
      const tasks = allTasks.filter((t) => t.status === status);
      statusCounts[status] = tasks.length;
      statusTasks[status] = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      }));
    });

    res.json({
      success: true,
      statusCounts,
      statusTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve status breakdown',
      error: error.message,
    });
  }
});

/**
 * GET /api/stats/priority
 * Get breakdown of tasks by priority.
 */
router.get('/priority', (req, res) => {
  try {
    const allTasks = taskStore.getAllTasks();
    const priorityBreakdown = {};

    ['low', 'medium', 'high'].forEach((priority) => {
      const tasks = allTasks.filter((t) => t.priority === priority);
      priorityBreakdown[priority] = {
        count: tasks.length,
        byStatus: {
          todo: tasks.filter((t) => t.status === 'todo').length,
          'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
          done: tasks.filter((t) => t.status === 'done').length,
        },
      };
    });

    res.json({
      success: true,
      priorityBreakdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve priority breakdown',
      error: error.message,
    });
  }
});

/**
 * GET /api/stats/category
 * Get breakdown of tasks by category.
 */
router.get('/category', (req, res) => {
  try {
    const allTasks = taskStore.getAllTasks();
    const categories = taskStore.getCategories();

    const categoryBreakdown = {};
    categories.forEach((category) => {
      const tasks = allTasks.filter((t) => t.category === category);
      categoryBreakdown[category] = {
        total: tasks.length,
        done: tasks.filter((t) => t.status === 'done').length,
        pending: tasks.filter((t) => t.status !== 'done').length,
        overdue: tasks.filter(
          (t) =>
            t.status !== 'done' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]
        ).length,
      };
    });

    res.json({
      success: true,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category breakdown',
      error: error.message,
    });
  }
});

/**
 * GET /api/stats/timeline
 * Get task creation/completion over time.
 */
router.get('/timeline', (req, res) => {
  try {
    const allTasks = taskStore.getAllTasks();
    const now = new Date();
    const days = parseInt(req.query.days) || 30;

    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const created = allTasks.filter((t) => t.createdAt && t.createdAt.startsWith(dateStr)).length;
      const completed = allTasks.filter(
        (t) => t.completedAt && t.completedAt.startsWith(dateStr)
      ).length;

      timeline.push({
        date: dateStr,
        created,
        completed,
      });
    }

    res.json({
      success: true,
      days,
      timeline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve timeline data',
      error: error.message,
    });
  }
});

module.exports = router;
