"""Reusable upload validators (module-level so Django migrations can serialise them)."""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

IMAGE_EXT = FileExtensionValidator(["jpg", "jpeg", "png", "webp", "gif", "ico"])
DOC_EXT = FileExtensionValidator(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "zip"])
PDF_EXT = FileExtensionValidator(["pdf"])


def _check(f, mb):
    if f.size > mb * 1024 * 1024:
        raise ValidationError(f"File too large. Maximum size is {mb} MB.")


def max_5mb(f):
    _check(f, 5)


def max_15mb(f):
    _check(f, 15)


def validate_pdf(f):
    head = f.read(5)
    f.seek(0)
    if head != b"%PDF-":
        raise ValidationError("This is not a valid PDF file.")
