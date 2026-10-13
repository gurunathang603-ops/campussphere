from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import ChatHistory
from .search import smart_search
from .services import answer


class ChatView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "chatbot"

    def post(self, request):
        msg = str(request.data.get("message", "")).strip()[:500]
        if not msg:
            return Response({"detail": "Message is required."}, status=400)
        user = request.user if request.user.is_authenticated else None
        result = answer(msg, user)
        ChatHistory.objects.create(user=user, session_id=str(request.data.get("session_id", ""))[:64], message=msg,
                                   response=result["reply"], intent=result["intent"] or "", used_llm=result["ai"])
        return Response(result)


class SearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        return Response(smart_search(request.query_params.get("q", ""), user))
