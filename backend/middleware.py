import traceback
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class LogErrorsMiddleware:
    """Logs unhandled exceptions to help debug crashes on Vercel."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as e:
            # Print detailed traceback to logs
            tb = traceback.format_exc()
            logger.error(f"Unhandled Exception: {e}\n{tb}")
            print(f"⚠️ Django Error: {e}\n{tb}")

            # Return a clean JSON response (still HTTP 500)
            return JsonResponse(
                {"error": str(e), "details": "See logs for full traceback."},
                status=500
            )
