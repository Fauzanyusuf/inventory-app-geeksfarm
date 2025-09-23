export class ResponseError extends Error {
  constructor(status, message) {
    const messageStr = Array.isArray(message)
      ? JSON.stringify(message)
      : String(message);

    super(messageStr);
    this.status = status;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}
