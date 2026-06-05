import { errorResponse } from '../utils/apiResponse.js';

/**
 * Zod schema validation middleware factory.
 * Usage: router.post('/register', validate(registerSchema), controller)
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} target - Which part of req to validate
 */
export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return errorResponse(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
    }

    // Replace req[target] with the parsed (and possibly transformed) data
    req[target] = result.data;
    next();
  };
};
