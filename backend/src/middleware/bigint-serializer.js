// Middleware to override res.json so BigInt values are serialized as strings
export default function bigintSerializerMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    const replacer = (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      return value;
    };

    // If data is already a string (unlikely) just send it
    try {
      const json = JSON.stringify(data, replacer);
      res.setHeader("Content-Type", "application/json");
      return res.send(json);
    } catch (err) {
      // fallback to original
      return originalJson(data);
    }
  };

  next();
}
