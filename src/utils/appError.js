export default class AppError extends Error {
  constructor(message, statusCode = 400, extras = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extras = extras;
    Error.captureStackTrace?.(this, this.constructor);
  }
}