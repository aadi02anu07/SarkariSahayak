/**
 * Standard API response envelope helpers.
 */

export const successResponse = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message, statusCode = 400, code = 'BAD_REQUEST', details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
};

export const paginatedResponse = (res, data, message, { page, limit, total, nextCursor } = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: { page, limit, total, nextCursor },
  });
};
