import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.originalUrl} -> ${status}`, (exception as any)?.stack || JSON.stringify(exception));
    } else {
      this.logger.warn(`${req.method} ${req.originalUrl} -> ${status}`);
    }

    const message = isHttp ? (exception as HttpException).getResponse() : 'Internal server error';
    res.status(status).json({ statusCode: status, path: req.originalUrl, timestamp: new Date().toISOString(), error: message });
  }
}
