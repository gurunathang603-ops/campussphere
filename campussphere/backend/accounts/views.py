from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Staff, Student, User
from .permissions import StaffReadHODWrite
from .serializers import ChangePasswordSerializer, LoginSerializer, StaffSerializer, StudentSerializer, me_payload


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        username, password, role = s.validated_data["username"].strip(), s.validated_data["password"], s.validated_data["role"]
        user = authenticate(request, username=username, password=password)
        if user is None:  # allow login with register number / staff id even if username differs
            profile = (Student.objects.filter(register_number__iexact=username).select_related("user").first()
                       or Staff.objects.filter(staff_id__iexact=username).select_related("user").first())
            if profile:
                user = authenticate(request, username=profile.user.username, password=password)
        if user is None or not user.is_active:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
        if user.role != role:
            return Response({"detail": f"This account is not a {role.upper()} account. Choose the correct role tab."},
                            status=status.HTTP_403_FORBIDDEN)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": me_payload(user)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(me_payload(request.user))


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        return Response({"token": token.key, "user": me_payload(user)})


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related("user", "department")
    serializer_class = StudentSerializer
    permission_classes = [StaffReadHODWrite]

    def get_queryset(self):
        qs, p = super().get_queryset(), self.request.query_params
        for f in ("year", "section"):
            if p.get(f):
                qs = qs.filter(**{f: p[f]})
        q = (p.get("q") or "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(register_number__icontains=q) | Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q))
        return qs

    def perform_destroy(self, instance):
        instance.user.delete()


class StaffViewSet(StudentViewSet):
    queryset = Staff.objects.select_related("user", "department")
    serializer_class = StaffSerializer

    def get_queryset(self):
        qs = viewsets.ModelViewSet.get_queryset(self)
        q = (self.request.query_params.get("q") or "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(staff_id__icontains=q) | Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q))
        return qs
