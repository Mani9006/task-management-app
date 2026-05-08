/**
 * @fileoverview Unit tests for dateHelpers utility module.
 * Tests date formatting, overdue detection, and productivity calculations.
 */

const {
  formatDate,
  getToday,
  isOverdue,
  isDueToday,
  daysRemaining,
  taskAgeInDays,
  averageCompletionTime,
  getDateRange,
} = require('../src/utils/dateHelpers');

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('formats a Date object to YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('formats a date string to YYYY-MM-DD', () => {
      const result = formatDate('2024-06-01');
      expect(result).toBe('2024-06-01');
    });

    it('formats a timestamp number to YYYY-MM-DD', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('2024-01-15');
    });

    it.skip('throws on invalid date', () => {
      expect(() => formatDate('not-a-date')).toThrow('Invalid date');
      expect(() => formatDate(null)).toThrow('Invalid date');
      expect(() => formatDate(undefined)).toThrow('Invalid date');
    });
  });

  describe('getToday', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const result = getToday();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const parts = result.split('-');
      expect(parts.length).toBe(3);
      expect(Number(parts[0])).toBeGreaterThanOrEqual(2024);
      expect(Number(parts[1])).toBeGreaterThanOrEqual(1);
      expect(Number(parts[1])).toBeLessThanOrEqual(12);
      expect(Number(parts[2])).toBeGreaterThanOrEqual(1);
      expect(Number(parts[2])).toBeLessThanOrEqual(31);
    });
  });

  describe('isOverdue', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = formatDate(yesterday);
      expect(isOverdue(dateStr)).toBe(true);
    });

    it('returns false for today', () => {
      expect(isOverdue(getToday())).toBe(false);
    });

    it('returns false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = formatDate(tomorrow);
      expect(isOverdue(dateStr)).toBe(false);
    });
  });

  describe('isDueToday', () => {
    it('returns true for today', () => {
      expect(isDueToday(getToday())).toBe(true);
    });

    it('returns false for other dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isDueToday(formatDate(tomorrow))).toBe(false);
    });
  });

  describe('daysRemaining', () => {
    it('returns positive for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const result = daysRemaining(formatDate(future));
      expect(result).toBe(5);
    });

    it('returns negative for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      const result = daysRemaining(formatDate(past));
      expect(result).toBe(-3);
    });

    it('returns 0 for today', () => {
      expect(daysRemaining(getToday())).toBe(0);
    });
  });

  describe('taskAgeInDays', () => {
    it('calculates age correctly for old tasks', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const result = taskAgeInDays(tenDaysAgo.toISOString());
      expect(result).toBeGreaterThanOrEqual(10);
    });

    it('returns 0 for brand new tasks', () => {
      const result = taskAgeInDays(new Date().toISOString());
      expect(result).toBe(0);
    });
  });

  describe('averageCompletionTime', () => {
    it('calculates average for completed tasks', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const fourDaysAgo = new Date(now);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const tasks = [
        { status: 'done', createdAt: twoDaysAgo.toISOString(), completedAt: now.toISOString() },
        { status: 'done', createdAt: fourDaysAgo.toISOString(), completedAt: now.toISOString() },
      ];

      const result = averageCompletionTime(tasks);
      expect(result).toBe(3);
    });

    it('returns 0 for no completed tasks', () => {
      const tasks = [
        { status: 'todo', createdAt: new Date().toISOString() },
        { status: 'in-progress', createdAt: new Date().toISOString() },
      ];
      expect(averageCompletionTime(tasks)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(averageCompletionTime([])).toBe(0);
    });

    it('returns 0 for non-array input', () => {
      expect(averageCompletionTime(null)).toBe(0);
      expect(averageCompletionTime(undefined)).toBe(0);
    });
  });

  describe('getDateRange', () => {
    it('returns valid date range for week', () => {
      const result = getDateRange('week');
      expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.start < result.end).toBe(true);
    });

    it('returns valid date range for month', () => {
      const result = getDateRange('month');
      expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.end).toBe(getToday());
    });

    it('returns default range for unknown range', () => {
      const result = getDateRange('unknown');
      expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.end).toBe(getToday());
    });
  });
});
