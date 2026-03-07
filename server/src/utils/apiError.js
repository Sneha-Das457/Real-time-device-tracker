class apiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    error = null,
    stack = ""
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.message = message;
    this.error = error;
    this.sucess = false;
    this.data = null;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = apiError;
