export default function bigintSerializerMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    const serializedData = JSON.parse(
      JSON.stringify(data, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return originalJson(serializedData);
  };

  next();
}
