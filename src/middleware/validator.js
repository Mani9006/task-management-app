/**
 * @fileoverview Input validation middleware for task management API.
 * Validates and sanitizes request bodies and parameters to ensure data integrity.
 */

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;
const VALID_SORT_FIELDS = [
  'title',
  'priority',
  'status',
  'dueDate',
  'createdAt',
  'updatedAt',
  'category',
];
const VALID_SORT_ORDERS = ['asc', 'desc'];

/**
 * Sanitize a string input by trimming and removing dangerous characters.
 * @param {string} str - String to sanitize.
 * @param {number} maxLength - Maximum allowed length.
 * @returns {string} Sanitized string.
 */
function sanitizeString(str, maxLength) {
  if (typeof str !== 'string') {
    return '';
  }
  let cleaned = str.trim();
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  // Remove potential XSS vectors
  cleaned = cleaned
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return cleaned;
}

/**
 * Validate title field.
 * @param {string} title - Title to validate.
 * @param {boolean} [required=true] - Whether title is required.
 * @returns {{valid: boolean, error?: string, value?: string}} Validation result.
 */
function validateTitle(title, required = true) {
  if (required && (!title || typeof title !== 'string' || title.trim().length === 0)) {
    return { valid: false, error: 'Title is required and must be a non-empty string' };
  }
  if (!required && !title) {
    return { valid: true, value: undefined };
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
    };
  }
  return { valid: true, value: sanitizeString(title, MAX_TITLE_LENGTH) };
}

/**
 * Validate priority field.
 * @param {string} priority - Priority to validate.
 * @param {boolean} [required=false] - Whether priority is required.
 * @returns {{valid: boolean, error?: string, value?: string}} Validation result.
 */
function validatePriority(priority, required = false) {
  if (!priority && !required) {
    return { valid: true, value: undefined };
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return {
      valid: false,
      error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
    };
  }
  return { valid: true, value: priority };
}

/**
 * Validate status field.
 * @param {string} status - Status to validate.
 * @param {boolean} [required=false] - Whether status is required.
 * @returns {{valid: boolean, error?: string, value?: string}} Validation result.
 */
function validateStatus(status, required = false) {
  if (!status && !required) {
    return { valid: true, value: undefined };
  }
  if (!VALID_STATUSES.includes(status)) {
    return {
      valid: false,
      error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
    };
  }
  return { valid: true, value: status };
}

/**
 * Validate due date field.
 * @param {string} dueDate - Due date to validate.
 * @param {boolean} [required=false] - Whether due date is required.
 * @returns {{valid: boolean, error?: string, value?: string|null}} Validation result.
 */
function validateDueDate(dueDate, required = false) {
  if (!dueDate && !required) {
    return { valid: true, value: null };
  }
  if (!dueDate && required) {
    return { valid: false, error: 'Due date is required' };
  }
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dueDate)) {
    return {
      valid: false,
      error: 'Due date must be in YYYY-MM-DD format',
    };
  }
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Due date is invalid' };
  }
  return { valid: true, value: dueDate };
}

/**
 * Validate tags array.
 * @param {Array<*>} tags - Tags to validate.
 * @returns {{valid: boolean, error?: string, value?: Array<string>}} Validation result.
 */
function validateTags(tags) {
  if (!tags) {
    return { valid: true, value: [] };
  }
  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }
  if (tags.length > MAX_TAGS) {
    return { valid: false, error: `Cannot have more than ${MAX_TAGS} tags` };
  }
  const sanitized = [];
  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.trim().length === 0) {
      return { valid: false, error: 'Each tag must be a non-empty string' };
    }
    if (tag.trim().length > MAX_TAG_LENGTH) {
      return {
        valid: false,
        error: `Each tag must not exceed ${MAX_TAG_LENGTH} characters`,
      };
    }
    const clean = tag.trim().toLowerCase();
    if (!sanitized.includes(clean)) {
      sanitized.push(clean);
    }
  }
  return { valid: true, value: sanitized };
}

/**
 * Express middleware to validate task creation.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next function.
 */
function validateCreateTask(req, res, next) {
  const { title, description, priority, status, dueDate, category, tags } = req.body;

  const validations = [
    validateTitle(title, true),
    validatePriority(priority, false),
    validateStatus(status, false),
    validateDueDate(dueDate, false),
    validateTags(tags),
  ];

  const errors = validations.filter((v) => !v.valid);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.map((e) => e.error),
    });
  }

  // Build sanitized task data
  req.validatedData = {
    title: validations[0].value,
    description: description
      ? sanitizeString(description, MAX_DESCRIPTION_LENGTH)
      : '',
    priority: validations[1].value || 'medium',
    status: validations[2].value || 'todo',
    dueDate: validations[3].value,
    category: category ? sanitizeString(category, 50) : 'general',
    tags: validations[4].value,
  };

  next();
}

/**
 * Express middleware to validate task update.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next function.
 */
function validateUpdateTask(req, res, next) {
  const { title, description, priority, status, dueDate, category, tags } = req.body;

  const validations = [
    validateTitle(title, false),
    validatePriority(priority, false),
    validateStatus(status, false),
    validateDueDate(dueDate, false),
    validateTags(tags),
  ];

  const errors = validations.filter((v) => !v.valid);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.map((e) => e.error),
    });
  }

  req.validatedData = {};
  if (validations[0].value !== undefined) req.validatedData.title = validations[0].value;
  if (description !== undefined) {
    req.validatedData.description = sanitizeString(description, MAX_DESCRIPTION_LENGTH);
  }
  if (validations[1].value !== undefined) req.validatedData.priority = validations[1].value;
  if (validations[2].value !== undefined) req.validatedData.status = validations[2].value;
  if (validations[3].value !== null) req.validatedData.dueDate = validations[3].value;
  if (category !== undefined) req.validatedData.category = sanitizeString(category, 50);
  if (tags !== undefined) req.validatedData.tags = validations[4].value;

  // Check if any field is provided
  if (Object.keys(req.validatedData).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update',
    });
  }

  next();
}

/**
 * Validate route parameter ID.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next function.
 */
function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID. Must be a positive integer.',
    });
  }
  req.validatedId = id;
  next();
}

/**
 * Validate query parameters for filtering/sorting.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next function.
 */
function validateQueryParams(req, res, next) {
  const { sortBy, sortOrder } = req.query;

  if (sortBy && !VALID_SORT_FIELDS.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: `sortBy must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
    });
  }

  if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
    return res.status(400).json({
      success: false,
      message: `sortOrder must be one of: ${VALID_SORT_ORDERS.join(', ')}`,
    });
  }

  next();
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateId,
  validateQueryParams,
  validateTitle,
  validatePriority,
  validateStatus,
  validateDueDate,
  validateTags,
  sanitizeString,
};
