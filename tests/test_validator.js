/**
 * @fileoverview Unit tests for the validator middleware module.
 * Tests input validation for tasks, priorities, statuses, dates, and tags.
 */

const {
  validateTitle,
  validatePriority,
  validateStatus,
  validateDueDate,
  validateTags,
  sanitizeString,
} = require('../src/middleware/validator');

describe('validator', () => {
  describe('sanitizeString', () => {
    it('trims whitespace from strings', () => {
      expect(sanitizeString('  hello  ', 100)).toBe('hello');
    });

    it('limits string length', () => {
      const longString = 'a'.repeat(200);
      expect(sanitizeString(longString, 50).length).toBe(50);
    });

    it('escapes HTML characters', () => {
      const result = sanitizeString('<script>alert("xss")</script>', 500);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
    });

    it('handles empty string', () => {
      expect(sanitizeString('', 100)).toBe('');
    });

    it('handles non-string input', () => {
      expect(sanitizeString(null, 100)).toBe('');
      expect(sanitizeString(123, 100)).toBe('');
    });
  });

  describe('validateTitle', () => {
    it('validates required title', () => {
      const result = validateTitle('My Task', true);
      expect(result.valid).toBe(true);
      expect(result.value).toBe('My Task');
    });

    it('rejects empty required title', () => {
      const result = validateTitle('', true);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects whitespace-only title', () => {
      const result = validateTitle('   ', true);
      expect(result.valid).toBe(false);
    });

    it('allows optional title to be empty', () => {
      const result = validateTitle('', false);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(undefined);
    });

    it('rejects title exceeding max length', () => {
      const longTitle = 'a'.repeat(250);
      const result = validateTitle(longTitle, true);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('200');
    });

    it('trims whitespace from title', () => {
      const result = validateTitle('  Valid Title  ', true);
      expect(result.value).toBe('Valid Title');
    });
  });

  describe('validatePriority', () => {
    it('accepts valid priorities', () => {
      expect(validatePriority('low').valid).toBe(true);
      expect(validatePriority('medium').valid).toBe(true);
      expect(validatePriority('high').valid).toBe(true);
    });

    it('rejects invalid priority', () => {
      const result = validatePriority('urgent');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('low, medium, high');
    });

    it('allows empty priority when not required', () => {
      const result = validatePriority('');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(undefined);
    });

    it('allows undefined priority', () => {
      const result = validatePriority(undefined);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateStatus', () => {
    it('accepts valid statuses', () => {
      expect(validateStatus('todo').valid).toBe(true);
      expect(validateStatus('in-progress').valid).toBe(true);
      expect(validateStatus('done').valid).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = validateStatus('archived');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('todo, in-progress, done');
    });

    it('allows empty status when not required', () => {
      const result = validateStatus('');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(undefined);
    });
  });

  describe('validateDueDate', () => {
    it('accepts valid YYYY-MM-DD date', () => {
      const result = validateDueDate('2024-12-25');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('2024-12-25');
    });

    it('rejects invalid date format', () => {
      const result = validateDueDate('12-25-2024');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('YYYY-MM-DD');
    });

    it('rejects invalid date', () => {
      const result = validateDueDate('2024-13-45');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('allows null when not required', () => {
      const result = validateDueDate(null);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(null);
    });

    it('allows empty string when not required', () => {
      const result = validateDueDate('');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTags', () => {
    it('accepts valid tag array', () => {
      const result = validateTags(['frontend', 'bug']);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['frontend', 'bug']);
    });

    it('converts tags to lowercase', () => {
      const result = validateTags(['Frontend', 'BUG']);
      expect(result.value).toEqual(['frontend', 'bug']);
    });

    it('removes duplicate tags', () => {
      const result = validateTags(['bug', 'bug', 'feature']);
      expect(result.value).toEqual(['bug', 'feature']);
    });

    it('allows null/undefined tags', () => {
      expect(validateTags(null).valid).toBe(true);
      expect(validateTags(undefined).valid).toBe(true);
    });

    it('allows empty array', () => {
      const result = validateTags([]);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('rejects non-array input', () => {
      const result = validateTags('not-an-array');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('array');
    });

    it('rejects too many tags', () => {
      const tags = Array.from({ length: 12 }, (_, i) => `tag${i}`);
      const result = validateTags(tags);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10');
    });

    it('rejects empty tag strings', () => {
      const result = validateTags(['valid', '']);
      expect(result.valid).toBe(false);
    });

    it('rejects tag exceeding max length', () => {
      const longTag = 'a'.repeat(40);
      const result = validateTags([longTag]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('30');
    });
  });
});
