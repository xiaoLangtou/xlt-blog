import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, map } from 'rxjs'
import type { ApiResponse } from '@xlt-blog/shared'

/** 统一包装成功响应为 { code, data, message } */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(
      map(data => ({ code: 0, data: data ?? null, message: 'ok' }))
    )
  }
}
