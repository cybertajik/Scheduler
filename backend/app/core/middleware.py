import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

logger = logging.getLogger("app.middleware")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses to protect against XSS, clickjacking, and MIME sniffing.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that injects a unique X-Request-ID header into every HTTP request
    and logs structured request latency, endpoint, status code, and IP metadata.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.time()
        
        # Attach request_id to request state
        request.state.request_id = request_id

        response = await call_next(request)
        
        process_time_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-MS"] = str(process_time_ms)

        logger.info(
            f"[HTTP] request_id={request_id} method={request.method} path={request.url.path} "
            f"status={response.status_code} duration_ms={process_time_ms} ip={request.client.host if request.client else 'unknown'}"
        )
        return response
