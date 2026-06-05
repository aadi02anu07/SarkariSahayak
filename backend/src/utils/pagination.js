/**
 * Cursor-based pagination utilities.
 */

/**
 * Encode a cursor from an object (typically { id, createdAt }).
 */
export const encodeCursor = (obj) => {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
};

/**
 * Decode a cursor back to an object.
 */
export const decodeCursor = (cursor) => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch {
    return null;
  }
};

/**
 * Build Prisma cursor-based pagination args.
 * @param {string|null} cursor - Base64-encoded cursor
 * @param {number} limit - Number of items per page
 * @returns {{ take, skip, cursor }} Prisma findMany args
 */
export const buildPaginationArgs = (cursor, limit = 20) => {
  const args = { take: limit + 1 }; // fetch one extra to detect next page
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded?.id) {
      args.cursor = { id: decoded.id };
      args.skip = 1; // skip the cursor item itself
    }
  }
  return args;
};

/**
 * Process results and produce the nextCursor.
 * @param {Array} items - Results from DB (fetched with limit+1)
 * @param {number} limit
 * @returns {{ data, nextCursor }}
 */
export const processPaginatedResults = (items, limit) => {
  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, -1) : items;
  const nextCursor = hasNextPage ? encodeCursor({ id: data[data.length - 1].id }) : null;
  return { data, nextCursor };
};
