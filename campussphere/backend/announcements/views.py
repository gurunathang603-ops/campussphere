import base64
import hashlib
import hmac
import re
import ipaddress
import socket
from urllib.parse import urlsplit

from django.conf import settings
from django.db import transaction
from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.utils.decorators import method_decorator
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.base import ContentViewSet
from accounts.permissions import is_staff_level

from .models import Announcement, Notification, NotificationDelivery, NotificationPreference, PushSubscription
from .serializers import AnnouncementSerializer


def _valid_twilio_signature(request):
    callback_url = settings.TWILIO_STATUS_CALLBACK_URL
    supplied_signature = request.headers.get("X-Twilio-Signature", "")
    if not callback_url or not settings.TWILIO_AUTH_TOKEN or not supplied_signature:
        return False
    payload = callback_url + "".join(
        f"{key}{value}"
        for key in sorted(request.POST)
        for value in sorted(request.POST.getlist(key))
    )
    expected = base64.b64encode(
        hmac.new(
            settings.TWILIO_AUTH_TOKEN.encode(),
            payload.encode(),
            hashlib.sha1,
        ).digest()
    ).decode()
    return hmac.compare_digest(expected, supplied_signature)


class AnnouncementViewSet(ContentViewSet):
    queryset = Announcement.objects.annotate(rank=Case(
        When(priority="urgent", then=Value(0)), When(priority="important", then=Value(1)),
        default=Value(2), output_field=IntegerField())).order_by("rank", "-date", "-id")
    serializer_class = AnnouncementSerializer
    filter_fields = ("priority",)
    search_fields = ("title", "description")


def _notifications_for(user):
    if user.role == "student":
        qs = Notification.objects.filter(audience__in=("all", "student", "department", "class", "selected"))
        profile = getattr(user, "student_profile", None)
        if profile:
            qs = qs.filter(
                Q(audience__in=("all", "student"))
                | Q(audience="department", department=profile.department)
                | Q(audience="class", department=profile.department, target_year=profile.year, target_section=profile.section)
                | Q(audience="selected")
            )
        else:
            qs = qs.filter(Q(audience="all") | Q(audience="selected"))
    elif user.role in ("staff", "hod"):
        qs = Notification.objects.filter(audience__in=("all", "staff", "department", "selected"))
        profile = getattr(user, "staff_profile", None) or getattr(user, "hod_profile", None)
        department = getattr(profile, "department", None)
        qs = qs.filter(
            Q(audience__in=("all", "staff"))
            | Q(audience="department", department=department)
            | Q(audience="selected")
        )
    else:
        qs = Notification.objects.filter(audience="all")
    qs = qs.filter(Q(scheduled_for__isnull=True) | Q(scheduled_for__lte=timezone.now()))
    qs = qs.exclude(delivery_status="cancelled", cancelled_notice=False)
    return [item for item in qs.order_by("-created_at", "-id")[:1000]
            if item.audience != "selected" or user.pk in item.target_user_ids]


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = _notifications_for(request.user)
        read_ids = set(request.user.read_notifications.values_list("id", flat=True))
        visible = notifications[:100]
        delivery_map = {}
        for delivery in NotificationDelivery.objects.filter(
            notification_id__in=[item.pk for item in visible], user=request.user
        ).values("notification_id", "channel", "status", "error"):
            delivery_map.setdefault(delivery["notification_id"], []).append({
                "channel": delivery["channel"], "status": delivery["status"], "error": delivery["error"],
            })
        items = []
        for n in visible:
            deliveries = delivery_map.get(n.pk, [])
            status = next((d["status"] for d in deliveries if d["status"] == "failed"), n.delivery_status)
            items.append({
                "id": n.id, "title": n.title, "message": n.message, "kind": n.kind, "link": n.link,
                "created_at": n.created_at, "is_read": n.id in read_ids,
                "delivery_status": status, "deliveries": deliveries,
            })
        unread = sum(n.pk not in read_ids for n in notifications)
        return Response({"unread": unread, "results": items})


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        notifications = _notifications_for(request.user)
        ids = {n.pk for n in notifications}
        if pk is not None:
            if pk not in ids:
                return Response({"detail": "Notification not found."}, status=404)
            request.user.read_notifications.add(pk)
        else:
            request.user.read_notifications.add(*ids)
        return Response({"ok": True})


class NotificationPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response({
            "email_enabled": prefs.email_enabled,
            "sms_enabled": prefs.sms_enabled,
            "push_enabled": prefs.push_enabled,
            "sms_consent": request.user.sms_consent,
            "push_public_key": settings.WEBPUSH_PUBLIC_KEY,
            "phone": request.user.phone,
        })

    def patch(self, request):
        allowed = {"email_enabled", "sms_enabled", "push_enabled", "sms_consent", "phone"}
        if set(request.data) - allowed:
            raise serializers.ValidationError({"detail": "Unsupported preference."})
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        next_consent = request.data.get("sms_consent", request.user.sms_consent)
        next_phone = request.data.get("phone", request.user.phone)
        next_sms_enabled = request.data.get("sms_enabled", prefs.sms_enabled)
        if not isinstance(next_consent, bool) or not isinstance(next_sms_enabled, bool):
            raise serializers.ValidationError({"sms_enabled": "SMS settings must be booleans."})
        if "phone" in request.data and (
            not isinstance(next_phone, str) or len(next_phone) > 20
            or (next_phone and not re.fullmatch(r"\+[1-9]\d{7,14}", next_phone))
        ):
            raise serializers.ValidationError({"phone": "Use an international number such as +919876543210."})
        if request.data.get("sms_enabled") is True and (
            not next_consent or not isinstance(next_phone, str)
            or not re.fullmatch(r"\+[1-9]\d{7,14}", next_phone)
        ):
            raise serializers.ValidationError({"sms_enabled": "Add a mobile number and give SMS consent first."})
        for field in ("email_enabled", "sms_enabled", "push_enabled"):
            if field in request.data:
                if not isinstance(request.data[field], bool):
                    raise serializers.ValidationError({field: "Must be a boolean."})
                setattr(prefs, field, request.data[field])
        if request.data.get("push_enabled") and not request.user.push_subscriptions.exists():
            raise serializers.ValidationError({"push_enabled": "Enable browser notifications on this device first."})
        if "sms_consent" in request.data:
            value = request.data["sms_consent"]
            request.user.sms_consent = value
            request.user.save(update_fields=["sms_consent"])
            if not value:
                prefs.sms_enabled = False
        if "phone" in request.data:
            phone = request.data["phone"]
            request.user.phone = phone
            request.user.save(update_fields=["phone"])
        prefs.save()
        return self.get(request)


class PushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            endpoint = request.data["endpoint"]
            keys = request.data["keys"]
            p256dh, auth = keys["p256dh"], keys["auth"]
        except (KeyError, TypeError):
            raise serializers.ValidationError({"subscription": "A valid browser push subscription is required."})
        if not isinstance(endpoint, str) or len(endpoint) > 1000:
            raise serializers.ValidationError({"endpoint": "A secure push endpoint is required."})
        parsed = urlsplit(endpoint)
        try:
            port = parsed.port
        except ValueError:
            port = -1
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or port not in (None, 443):
            raise serializers.ValidationError({"endpoint": "A secure push endpoint is required."})
        try:
            addresses = {ipaddress.ip_address(result[4][0]) for result in socket.getaddrinfo(parsed.hostname, 443)}
        except (OSError, ValueError):
            raise serializers.ValidationError({"endpoint": "The push service endpoint could not be resolved."})
        if not addresses or any(
            address.is_private or address.is_loopback or address.is_link_local or address.is_reserved or address.is_unspecified
            for address in addresses
        ):
            raise serializers.ValidationError({"endpoint": "The push endpoint must use a public internet address."})
        existing = PushSubscription.objects.filter(endpoint=endpoint).first()
        if existing and existing.user_id != request.user.pk:
            raise PermissionDenied("That browser subscription is already linked to another account.")
        subscription, _ = PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={"user": request.user, "p256dh": p256dh, "auth": auth},
        )
        return Response({"id": subscription.id}, status=201)

    def delete(self, request):
        endpoint = request.data.get("endpoint")
        subscriptions = PushSubscription.objects.filter(user=request.user)
        if endpoint:
            subscriptions = subscriptions.filter(endpoint=endpoint)
        subscriptions.delete()
        return Response(status=204)


class NotificationSendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_staff_level(request.user):
            raise PermissionDenied("Staff-level access is required.")
        if any(not request.data.get(key) for key in ("title", "message", "audience")):
            raise serializers.ValidationError({"detail": "Title, message, and audience are required."})
        audience = request.data["audience"]
        if audience not in {choice for choice, _ in Notification.Audience.choices}:
            raise serializers.ValidationError({"audience": "Choose a valid audience."})
        department = None
        if audience == Notification.Audience.DEPARTMENT:
            profile = getattr(request.user, "staff_profile", None) or getattr(request.user, "hod_profile", None)
            department = getattr(profile, "department", None)
            if department is None:
                from departments.models import Department
                department = Department.objects.first()
        target_year = None
        target_section = ""
        if audience == Notification.Audience.CLASS:
            try:
                target_year = int(request.data.get("target_year"))
            except (TypeError, ValueError):
                raise serializers.ValidationError({"target_year": "Choose a year between 1 and 4."})
            target_section = str(request.data.get("target_section", "")).strip()[:5]
            if target_year not in (1, 2, 3, 4) or not target_section:
                raise serializers.ValidationError({"audience": "A target class year and section are required."})
        target_user_ids = request.data.get("target_user_ids", []) if audience == Notification.Audience.SELECTED else []
        if audience == Notification.Audience.SELECTED:
            if not isinstance(target_user_ids, list) or not target_user_ids or any(
                type(user_id) is not int or user_id < 1 for user_id in target_user_ids
            ):
                raise serializers.ValidationError({"target_user_ids": "Provide a list of positive account IDs."})
        channels = request.data.get("channels", ["in_app", "email", "push"])
        if not isinstance(channels, list) or any(c not in ("in_app", "email", "sms", "push") for c in channels):
            raise serializers.ValidationError({"channels": "Choose valid notification channels."})
        link = str(request.data.get("link", "/announcements"))
        if not link.startswith("/") or link.startswith("//"):
            raise serializers.ValidationError({"link": "Notification links must be portal-relative paths."})
        notification = Notification.objects.create(
            title=str(request.data["title"])[:200],
            message=str(request.data["message"]),
            kind=Notification.Kind.IMPORTANT,
            link=link[:200],
            audience=audience,
            department=department,
            target_year=target_year,
            target_section=target_section,
            target_user_ids=target_user_ids,
            channels=channels,
            scheduled_for=timezone.now(),
        )
        return Response({"id": notification.pk, "status": notification.delivery_status}, status=201)


class NotificationPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_staff_level(request.user):
            raise PermissionDenied("Staff-level access is required.")
        from .delivery import recipients_for

        audience = request.data.get("audience")
        if audience not in {choice for choice, _ in Notification.Audience.choices}:
            raise serializers.ValidationError({"audience": "Choose a valid audience."})
        profile = getattr(request.user, "staff_profile", None) or getattr(request.user, "hod_profile", None)
        department = getattr(profile, "department", None)
        if audience == Notification.Audience.DEPARTMENT and department is None:
            from departments.models import Department
            department = Department.objects.first()
        target_year = request.data.get("target_year")
        target_section = str(request.data.get("target_section", "")).strip()[:5]
        target_user_ids = request.data.get("target_user_ids", [])
        if audience == Notification.Audience.CLASS:
            try:
                target_year = int(target_year)
            except (TypeError, ValueError):
                raise serializers.ValidationError({"target_year": "Choose a year between 1 and 4."})
            if target_year not in (1, 2, 3, 4) or not target_section:
                raise serializers.ValidationError({"audience": "A target class year and section are required."})
        if audience == Notification.Audience.SELECTED and (
            not isinstance(target_user_ids, list) or not target_user_ids
            or any(type(pk) is not int or pk < 1 for pk in target_user_ids)
        ):
            raise serializers.ValidationError({"target_user_ids": "Provide a list of positive account IDs."})
        notification = Notification(
            audience=audience,
            department=department,
            target_year=target_year if audience == Notification.Audience.CLASS else None,
            target_section=target_section if audience == Notification.Audience.CLASS else "",
            target_user_ids=target_user_ids if audience == Notification.Audience.SELECTED else [],
        )
        users = recipients_for(notification)
        email_filter = Q(notification_preferences__isnull=True) | Q(notification_preferences__email_enabled=True)
        sms_filter = Q(notification_preferences__sms_enabled=True)
        with_email = users.filter(email_filter).exclude(email="").count()
        sms_eligible = users.filter(sms_filter, sms_consent=True, phone__regex=r"^\+[1-9][0-9]{7,14}$").count()
        return Response({
            "recipients": users.count(),
            "email_recipients": with_email,
            "sms_recipients": sms_eligible,
        })


@method_decorator(transaction.non_atomic_requests, name="dispatch")
class NotificationTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_staff_level(request.user):
            raise PermissionDenied("Staff-level access is required.")
        channels = request.data.get("channels")
        if not isinstance(channels, list) or not channels or any(
            channel not in ("email", "sms") for channel in channels
        ):
            raise serializers.ValidationError({"channels": "Select email, SMS, or both."})
        channels = list(dict.fromkeys(channels))
        if "email" in channels and not request.user.email:
            raise serializers.ValidationError({"email": "Add an email address to your account first."})
        preference, _ = NotificationPreference.objects.get_or_create(user=request.user)
        if "sms" in channels and (
            not request.user.sms_consent
            or not preference.sms_enabled
            or not re.fullmatch(r"\+[1-9]\d{7,14}", request.user.phone or "")
        ):
            raise serializers.ValidationError({
                "sms": "SMS test requires your registered international number, SMS consent, and SMS reminders enabled."
            })
        notification = Notification.objects.create(
            title="CampusSphere delivery test",
            message="This is a test notification sent by an authorized portal administrator.",
            kind=Notification.Kind.IMPORTANT,
            link="/notifications",
            audience=Notification.Audience.SELECTED,
            target_user_ids=[request.user.pk],
            channels=channels,
            scheduled_for=timezone.now(),
        )
        from .delivery import process_notification
        process_notification(notification.pk)
        results = list(notification.deliveries.filter(
            user=request.user, channel__in=channels
        ).values("channel", "status", "provider_id", "error"))
        return Response({"id": notification.pk, "results": results}, status=201)


class TwilioStatusCallbackView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _valid_twilio_signature(request):
            return Response({"detail": "Invalid provider signature."}, status=403)
        message_sid = request.data.get("MessageSid", "")
        provider_status = request.data.get("MessageStatus", "").lower()
        statuses = {
            "queued": NotificationDelivery.Status.PENDING,
            "accepted": NotificationDelivery.Status.PENDING,
            "sending": NotificationDelivery.Status.PENDING,
            "sent": NotificationDelivery.Status.SENT,
            "delivered": NotificationDelivery.Status.DELIVERED,
            "undelivered": NotificationDelivery.Status.FAILED,
            "failed": NotificationDelivery.Status.FAILED,
        }
        if not message_sid or provider_status not in statuses:
            return Response({"detail": "Invalid provider status callback."}, status=400)
        delivery = NotificationDelivery.objects.filter(
            provider_id=message_sid, channel="sms"
        ).first()
        if delivery is None:
            return Response({"detail": "Message receipt is not available yet."}, status=503)
        new_status = statuses[provider_status]
        if delivery.status != NotificationDelivery.Status.DELIVERED:
            delivery.status = new_status
            delivery.error = (
                str(request.data.get("ErrorCode") or request.data.get("ErrorMessage") or "")[:300]
                if new_status == NotificationDelivery.Status.FAILED else ""
            )
            delivery.save(update_fields=["status", "error", "updated_at"])
            if new_status == NotificationDelivery.Status.FAILED and delivery.attempts < 3:
                Notification.objects.filter(pk=delivery.notification_id).update(
                    delivery_status="failed", processed_at=None
                )
        return Response(status=204)


class NotificationHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_level(request.user):
            raise PermissionDenied("Staff-level access is required.")
        notifications = list(Notification.objects.annotate(
            recipient_count=Count("deliveries__user", distinct=True),
            sent_count=Count("deliveries", filter=Q(deliveries__status="sent")),
            delivered_count=Count("deliveries", filter=Q(deliveries__status="delivered")),
            failed_count=Count("deliveries", filter=Q(deliveries__status="failed")),
        )[:100])
        delivery_summary = {}
        for row in NotificationDelivery.objects.filter(
            notification_id__in=[notification.pk for notification in notifications]
        ).values("notification_id", "channel", "status").annotate(count=Count("id")):
            delivery_summary.setdefault(row["notification_id"], []).append({
                "channel": row["channel"], "status": row["status"], "count": row["count"],
            })
        items = []
        for n in notifications:
            items.append({
                "id": n.id, "title": n.title, "event_id": n.event_id,
                "scheduled_for": n.scheduled_for, "created_at": n.created_at,
                "cancelled_notice": n.cancelled_notice, "status": n.delivery_status,
                "recipients": n.recipient_count,
                "sent": n.sent_count,
                "delivered": n.delivered_count,
                "failed": n.failed_count,
                "delivery_summary": delivery_summary.get(n.pk, []),
            })
        return Response({"results": items})
