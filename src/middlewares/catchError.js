const { HttpError } = require('../core/httpException');

const catchError = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof HttpError) {
      ctx.status = error.code;
      ctx.body = {
        ...error,
        state: 0,
        requestUrl: `${ctx.method} ${ctx.host}${ctx.path}`
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        ...new HttpError(),
        state: 0,
        requestUrl: `${ctx.method} ${ctx.host}${ctx.path}`
      }
    }
  }
};

module.exports = catchError;
