const AppError = require('../utils/AppError');

const validate = (schema) => (req, _res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    const present = value !== undefined && value !== null && value !== '';

    if (rules.required && !present) {
      errors.push(`${field} is required`);
      continue;
    }

    if (!present) continue;

    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
    }
    if (rules.type === 'number' && typeof value !== 'number' && Number.isNaN(Number(value))) {
      errors.push(`${field} must be a number`);
    }
    if (rules.type === 'email' && typeof value === 'string') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!ok) errors.push(`${field} must be a valid email`);
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    if (rules.min !== undefined && Number(value) < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
  }

  if (errors.length) {
    return next(new AppError('Validation failed', 400, errors));
  }
  next();
};

module.exports = validate;
