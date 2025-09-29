// import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

// @Catch()
// export class HttpExceptionFilter implements ExceptionFilter {
//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const res = ctx.getResponse();
//     const req = ctx.getRequest();
//     const isHttp = exception instanceof HttpException;
//     const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
//     const message = isHttp ? exception.getResponse() : 'Internal server error';
//     res.status(status).json({
//       statusCode: status,
//       path: req.url,
//       timestamp: new Date().toISOString(),
//       error: message,
//     });
//   }
// }

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log vždy, 500 obzvlášť se stackem
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        (exception as any)?.stack || JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status} ${isHttp ? (exception as HttpException).message : ''}`,
      );
    }

    const message = isHttp ? (exception as HttpException).getResponse() : 'Internal server error';
    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      error: message,
    });
  }
}
