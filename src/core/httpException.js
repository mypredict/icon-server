class HttpError extends Error {
  constructor(message = 'server is error', code = 500) {
    super();
    this.code = code;
    this.message = message;
  }
}

class ParameterError extends HttpError {
  constructor(message = 'parameter is error', code = 400) {
    super();
    this.code = code;
    this.message = message;
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'unauthorized', code = 401) {
    super();
    this.code = code;
    this.message = message;
  }
}

class ForbiddenError extends HttpError {
  constructor(message = 'forbidden', code = 403) {
    super();
    this.code = code;
    this.message = message;
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'not found', code = 404) {
    super();
    this.code = code;
    this.message = message;
  }
}

class MethodError extends HttpError {
  constructor(message = 'method not allowd', code = 405) {
    super();
    this.code = code;
    this.message = message;
  }
}

class ConflictError extends HttpError {
  constructor(message = 'conflict', code = 409) {
    super();
    this.code = code;
    this.message = message;
  }
}

class UnavailableError extends HttpError {
  constructor(message = 'unavailable', code = 503) {
    super();
    this.code = code;
    this.message = message;
  }
}

module.exports = {
  HttpError,
  ParameterError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodError,
  ConflictError,
  UnavailableError
};
