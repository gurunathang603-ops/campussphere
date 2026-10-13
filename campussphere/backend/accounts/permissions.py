from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_authed(u):
    return bool(u and u.is_authenticated)


def is_staff_level(u):
    return is_authed(u) and (u.role in ("staff", "hod") or u.is_superuser)


def is_hod_level(u):
    return is_authed(u) and u.hod_level


class IsStaffLevel(BasePermission):
    message = "Staff or HOD access required."

    def has_permission(self, request, view):
        return is_staff_level(request.user)


class IsHODLevel(BasePermission):
    message = "HOD-level access required."

    def has_permission(self, request, view):
        return is_hod_level(request.user)


class StaffReadHODWrite(BasePermission):
    """Staff can view, only HOD-level users can change (students / staff management)."""
    message = "Only the HOD can manage this resource."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return is_staff_level(request.user)
        return is_hod_level(request.user)


class ContentPermission(BasePermission):
    """Public read. Write = staff-level. Delete = HOD-level (unless view.staff_can_delete).
    A view may set write_level = 'hod' to make every write HOD-only."""
    message = "You do not have permission to modify this content."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        if not is_authed(u):
            return False
        hod_only = getattr(view, "write_level", "staff") == "hod"
        if hod_only or (request.method == "DELETE" and not getattr(view, "staff_can_delete", False)):
            return is_hod_level(u)
        return is_staff_level(u)
