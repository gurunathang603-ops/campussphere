def visible_documents(qs, user):
    """Filter documents by what the current user is allowed to see."""
    role = getattr(user, "role", None) if user is not None and getattr(user, "is_authenticated", False) else None
    if role in ("staff", "hod") or getattr(user, "is_superuser", False):
        return qs
    if role == "student":
        return qs.filter(visibility__in=["public", "student"])
    return qs.filter(visibility="public")
