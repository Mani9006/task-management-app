/**
 * @fileoverview Unit tests for the taskStore data persistence module.
 * Tests CRUD operations, filtering, searching, and statistics.
 */

const taskStore = require('../src/models/taskStore');

describe('taskStore', () => {
  // Reset cache before each test
  beforeEach(() => {
    taskStore.resetCache();
    taskStore.setCache([]);
  });

  afterEach(() => {
    taskStore.resetCache();
  });

  describe('createTask', () => {
    it('creates a task with required title', () => {
      const task = taskStore.createTask({ title: 'Test Task' });
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.category).toBe('general');
      expect(Array.isArray(task.tags)).toBe(true);
      expect(task.createdAt).toBeDefined();
    });

    it('creates a task with all fields', () => {
      const task = taskStore.createTask({
        title: 'Full Task',
        description: 'A detailed description',
        priority: 'high',
        status: 'in-progress',
        dueDate: '2024-12-31',
        category: 'work',
        tags: ['urgent', 'frontend'],
      });

      expect(task.title).toBe('Full Task');
      expect(task.description).toBe('A detailed description');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('in-progress');
      expect(task.dueDate).toBe('2024-12-31');
      expect(task.category).toBe('work');
      expect(task.tags).toEqual(['urgent', 'frontend']);
    });

    it('assigns incrementing IDs', () => {
      const task1 = taskStore.createTask({ title: 'First' });
      const task2 = taskStore.createTask({ title: 'Second' });
      const task3 = taskStore.createTask({ title: 'Third' });

      expect(task2.id).toBe(task1.id + 1);
      expect(task3.id).toBe(task2.id + 1);
    });

    it('handles missing tags gracefully', () => {
      const task = taskStore.createTask({ title: 'No Tags' });
      expect(task.tags).toEqual([]);
    });

    it('does not allow setting id via taskData', () => {
      const task = taskStore.createTask({ title: 'Task', id: 999 });
      expect(task.id).not.toBe(999);
      expect(task.id).toBeGreaterThan(0);
    });
  });

  describe('getAllTasks', () => {
    beforeEach(() => {
      taskStore.createTask({ title: 'Task A', status: 'todo', priority: 'high', category: 'work', tags: ['bug'] });
      taskStore.createTask({ title: 'Task B', status: 'in-progress', priority: 'medium', category: 'personal', tags: ['feature'] });
      taskStore.createTask({ title: 'Task C', status: 'done', priority: 'low', category: 'work', tags: ['bug', 'urgent'] });
    });

    it('returns all tasks when no filters', () => {
      const tasks = taskStore.getAllTasks();
      expect(tasks.length).toBe(3);
    });

    it('filters by status', () => {
      const tasks = taskStore.getAllTasks({ status: 'todo' });
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Task A');
    });

    it('filters by priority', () => {
      const tasks = taskStore.getAllTasks({ priority: 'high' });
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Task A');
    });

    it('filters by category', () => {
      const tasks = taskStore.getAllTasks({ category: 'work' });
      expect(tasks.length).toBe(2);
    });

    it('filters by tag', () => {
      const tasks = taskStore.getAllTasks({ tag: 'bug' });
      expect(tasks.length).toBe(2);
    });

    it('filters with search query', () => {
      const tasks = taskStore.getAllTasks({ search: 'Task B' });
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Task B');
    });

    it('performs case-insensitive search', () => {
      const tasks = taskStore.getAllTasks({ search: 'task a' });
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Task A');
    });

    it('searches in description', () => {
      taskStore.createTask({ title: 'Desc Task', description: 'special keyword here' });
      const tasks = taskStore.getAllTasks({ search: 'keyword' });
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Desc Task');
    });

    it('sorts by field ascending', () => {
      const tasks = taskStore.getAllTasks({ sortBy: 'title', sortOrder: 'asc' });
      expect(tasks[0].title).toBe('Task A');
      expect(tasks[1].title).toBe('Task B');
      expect(tasks[2].title).toBe('Task C');
    });

    it('sorts by field descending', () => {
      const tasks = taskStore.getAllTasks({ sortBy: 'title', sortOrder: 'desc' });
      expect(tasks[0].title).toBe('Task C');
      expect(tasks[2].title).toBe('Task A');
    });

    it('returns empty array for no matches', () => {
      const tasks = taskStore.getAllTasks({ status: 'nonexistent' });
      expect(tasks).toEqual([]);
    });
  });

  describe('getTaskById', () => {
    it('returns task by ID', () => {
      const created = taskStore.createTask({ title: 'Find Me' });
      const found = taskStore.getTaskById(created.id);
      expect(found).toBeDefined();
      expect(found.title).toBe('Find Me');
    });

    it('returns null for non-existent ID', () => {
      const found = taskStore.getTaskById(99999);
      expect(found).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('updates task fields', () => {
      const created = taskStore.createTask({ title: 'Original' });
      const updated = taskStore.updateTask(created.id, { title: 'Updated', priority: 'high' });

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Updated');
      expect(updated.priority).toBe('high');
      // Original fields remain
      expect(updated.status).toBe('todo');
    });

    it('tracks completion timestamp when status changes to done', () => {
      const created = taskStore.createTask({ title: 'Complete Me' });
      expect(created.completedAt).toBeNull();

      const updated = taskStore.updateTask(created.id, { status: 'done' });
      expect(updated.completedAt).toBeDefined();
      expect(updated.completedAt).not.toBeNull();
    });

    it('clears completion timestamp when moved out of done', () => {
      const created = taskStore.createTask({ title: 'Reopen Me', status: 'done' });
      const withCompletedAt = taskStore.updateTask(created.id, { status: 'todo' });
      expect(withCompletedAt.completedAt).toBeNull();
    });

    it.skip('updates updatedAt timestamp', () => {
      const created = taskStore.createTask({ title: 'Timestamp Test' });
      const originalUpdatedAt = created.updatedAt;

      // Small delay to ensure different timestamp
      const updated = taskStore.updateTask(created.id, { title: 'Changed' });
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('returns null for non-existent ID', () => {
      const result = taskStore.updateTask(99999, { title: 'Nope' });
      expect(result).toBeNull();
    });

    it('ignores invalid fields', () => {
      const created = taskStore.createTask({ title: 'Valid' });
      const updated = taskStore.updateTask(created.id, {
        title: 'Still Valid',
        hackerField: 'injected',
        id: 99999,
      });

      expect(updated.title).toBe('Still Valid');
      expect(updated.id).toBe(created.id);
      expect(updated.hackerField).toBeUndefined();
    });
  });

  describe('deleteTask', () => {
    it('deletes existing task', () => {
      const created = taskStore.createTask({ title: 'Delete Me' });
      const deleted = taskStore.deleteTask(created.id);

      expect(deleted).toBe(true);
      const found = taskStore.getTaskById(created.id);
      expect(found).toBeNull();
    });

    it('returns false for non-existent task', () => {
      const result = taskStore.deleteTask(99999);
      expect(result).toBe(false);
    });
  });

  describe('moveTask', () => {
    it('moves task to different status', () => {
      const created = taskStore.createTask({ title: 'Mover' });
      expect(created.status).toBe('todo');

      const moved = taskStore.moveTask(created.id, 'in-progress');
      expect(moved.status).toBe('in-progress');
    });

    it('returns null for non-existent task', () => {
      const result = taskStore.moveTask(99999, 'done');
      expect(result).toBeNull();
    });
  });

  describe('getCategories', () => {
    it('returns unique categories sorted', () => {
      taskStore.createTask({ title: 'T1', category: 'zebra' });
      taskStore.createTask({ title: 'T2', category: 'alpha' });
      taskStore.createTask({ title: 'T3', category: 'zebra' });
      taskStore.createTask({ title: 'T4', category: 'beta' });

      const categories = taskStore.getCategories();
      expect(categories).toEqual(['alpha', 'beta', 'zebra']);
    });

    it('returns empty array when no tasks', () => {
      expect(taskStore.getCategories()).toEqual([]);
    });
  });

  describe('getTags', () => {
    it('returns unique tags sorted', () => {
      taskStore.createTask({ title: 'T1', tags: ['z-index', 'alpha'] });
      taskStore.createTask({ title: 'T2', tags: ['beta', 'alpha'] });

      const tags = taskStore.getTags();
      expect(tags).toEqual(['alpha', 'beta', 'z-index']);
    });

    it('returns empty array when no tags', () => {
      expect(taskStore.getTags()).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('returns zero stats for empty store', () => {
      const stats = taskStore.getStats();
      expect(stats.total).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.productivityScore).toBe(0);
    });

    it('calculates correct stats', () => {
      taskStore.createTask({ title: 'S1', status: 'todo', priority: 'high' });
      taskStore.createTask({ title: 'S2', status: 'in-progress', priority: 'medium' });
      taskStore.createTask({ title: 'S3', status: 'done', priority: 'low' });
      taskStore.createTask({ title: 'S4', status: 'done', priority: 'high' });

      const stats = taskStore.getStats();
      expect(stats.total).toBe(4);
      expect(stats.byStatus.todo).toBe(1);
      expect(stats.byStatus['in-progress']).toBe(1);
      expect(stats.byStatus.done).toBe(2);
      expect(stats.completionRate).toBe(50);
    });

    it('calculates productivity score', () => {
      // High priority = 3pts, medium = 2pts, low = 1pt
      // Total potential: 3 + 2 + 1 = 6pts
      // Completed: high (3pts) = 3pts
      // Score: 3/6 = 50%
      taskStore.createTask({ title: 'P1', priority: 'high', status: 'done' });
      taskStore.createTask({ title: 'P2', priority: 'medium', status: 'todo' });
      taskStore.createTask({ title: 'P3', priority: 'low', status: 'todo' });

      const stats = taskStore.getStats();
      expect(stats.productivityScore).toBe(50);
    });
  });

  describe('reorderTasks', () => {
    it('moves task to different column', () => {
      const t1 = taskStore.createTask({ title: 'R1', status: 'todo' });
      const result = taskStore.reorderTasks(t1.id, 'done', 0);
      expect(result).toBe(true);

      const updated = taskStore.getTaskById(t1.id);
      expect(updated.status).toBe('done');
    });

    it('returns false for non-existent task', () => {
      const result = taskStore.reorderTasks(99999, 'done', 0);
      expect(result).toBe(false);
    });
  });
});
