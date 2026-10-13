import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from departments.models import Department

from .models import Staff, Student, User


def me_payload(user):
    data = {
        "id": user.id, "username": user.username, "first_name": user.first_name, "last_name": user.last_name,
        "full_name": user.full_name, "email": user.email, "role": user.role, "hod_level": user.hod_level,
        "phone": user.phone,
        "must_change_password": user.must_change_password,
        "department": None, "profile": {},
    }
    dept = None
    if user.role == "student" and hasattr(user, "student_profile"):
        s = user.student_profile
        dept = s.department
        data["profile"] = {"register_number": s.register_number, "year": s.year, "section": s.section,
                           "attendance": float(s.attendance_percentage)}
    elif user.role == "staff" and hasattr(user, "staff_profile"):
        s = user.staff_profile
        dept = s.department
        data["profile"] = {"staff_id": s.staff_id, "designation": s.designation, "hod_privileges": s.hod_privileges}
    elif user.role == "hod" and hasattr(user, "hod_profile"):
        h = user.hod_profile
        dept = h.department
        data["profile"] = {"hod_id": h.hod_id, "qualification": h.qualification}
    dept = dept or Department.objects.first()
    if dept:
        data["department"] = {"id": dept.id, "name": dept.name}
    return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, trim_whitespace=False)
    role = serializers.ChoiceField(choices=["student", "staff", "hod"])


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Current password is incorrect."})
        if user.check_password(attrs["new_password"]):
            raise serializers.ValidationError({"new_password": "Choose a password you have not used before."})
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "The new passwords do not match."})
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"new_password": error.messages})
        return attrs


def _check_password(pw):
    try:
        validate_password(pw)
    except DjangoValidationError as e:
        raise serializers.ValidationError({"password": list(e.messages)})


class _PersonSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", max_length=150)
    last_name = serializers.CharField(source="user.last_name", max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(source="user.email", required=False, allow_blank=True)
    phone = serializers.CharField(source="user.phone", max_length=20, required=False, allow_blank=True)
    is_active = serializers.BooleanField(source="user.is_active", required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={"input_type": "password"})
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    login_field = "register_number"
    role = "student"

    def validate_phone(self, value):
        if value and not re.fullmatch(r"\+[1-9]\d{7,14}", value):
            raise serializers.ValidationError("Use an international number such as +919876543210.")
        return value

    def _uniq(self, value):
        qs = User.objects.filter(username__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.user_id)
        if qs.exists():
            raise serializers.ValidationError("This ID is already in use.")
        return value

    def create(self, vd):
        udata = vd.pop("user", {})
        pw = vd.pop("password", "")
        if not pw:
            raise serializers.ValidationError({"password": "Password is required for a new account."})
        _check_password(pw)
        user = User.objects.create_user(username=vd[self.login_field], password=pw, role=self.role,
                        must_change_password=True, **udata)
        return self.Meta.model.objects.create(user=user, department=Department.objects.first(), **vd)

    def update(self, inst, vd):
        udata = vd.pop("user", {})
        pw = vd.pop("password", "")
        user = inst.user
        for k, v in udata.items():
            setattr(user, k, v)
        if self.login_field in vd:
            user.username = vd[self.login_field]
        if pw:
            _check_password(pw)
            user.set_password(pw)
        user.save()
        for k, v in vd.items():
            setattr(inst, k, v)
        inst.save()
        return inst


class StudentSerializer(_PersonSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, default="")

    class Meta:
        model = Student
        fields = ["id", "register_number", "first_name", "last_name", "full_name", "email", "phone", "password", "is_active",
                  "year", "section", "attendance_percentage", "department_name"]

    def validate_register_number(self, v):
        return self._uniq(v)

    def validate_attendance_percentage(self, v):
        if not 0 <= v <= 100:
            raise serializers.ValidationError("Attendance must be between 0 and 100.")
        return v


class StaffSerializer(_PersonSerializer):
    login_field = "staff_id"
    role = "staff"
    department_name = serializers.CharField(source="department.name", read_only=True, default="")

    class Meta:
        model = Staff
        fields = ["id", "staff_id", "first_name", "last_name", "full_name", "email", "phone", "password", "is_active",
                  "designation", "hod_privileges", "department_name"]

    def validate_staff_id(self, v):
        return self._uniq(v)
