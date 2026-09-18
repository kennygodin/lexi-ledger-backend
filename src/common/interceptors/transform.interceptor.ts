import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: Record<string, unknown>;
}

function isPaginatedResult(
  value: unknown,
): value is { data: unknown; meta: Record<string, unknown> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value
  );
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const handler = context.getHandler();
    const explicitCode = this.reflector.get<number>(
      HTTP_CODE_METADATA,
      handler,
    );
    const method = context
      .switchToHttp()
      .getRequest<{ method: string }>().method;
    const statusCode =
      explicitCode ?? (method === 'POST' ? HttpStatus.CREATED : HttpStatus.OK);

    return next.handle().pipe(
      map((result) => {
        if (isPaginatedResult(result)) {
          return {
            success: true,
            statusCode,
            data: result.data,
            meta: result.meta,
          };
        }
        return { success: true, statusCode, data: result };
      }),
    );
  }
}
