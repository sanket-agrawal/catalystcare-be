export default class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;

    // Ensures the correct prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    // Optional: capture stack trace (helps debugging)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
