export function parsePagination(
  query,
  { defaultPage = 1, defaultLimit = 10, maxLimit = 100 } = {}
) {
  const page = Number.isFinite(Number(query.page))
    ? Math.max(1, parseInt(query.page, 10))
    : defaultPage;

  let limit = Number.isFinite(Number(query.limit))
    ? parseInt(query.limit, 10)
    : defaultLimit;

  if (limit <= 0) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);

  const search =
    typeof query.search === "string" && query.search.trim().length
      ? query.search.trim()
      : undefined;

  return { page, limit, search };
}
