from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from helper import get_email_from_clerk_request, delete_all_user_conversations
from diet_db import (
    create_journal_entry,
    delete_all_user_data,
    delete_journal_entry,
    get_breathing_entries_between,
    get_journal_entries,
    get_journal_streak_stats,
    get_meditation_entries_between,
    get_mood_entries_for_month,
    get_quiz_result_for_date,
    get_quiz_results_for_month,
    upsert_breathing_entry,
    upsert_meditation_entry,
    upsert_mood_entry,
    upsert_quiz_result,
)


profile_bp = Blueprint("profile", __name__, url_prefix="/profile")


def get_user_email_from_request(req):
    user_email = get_email_from_clerk_request(req)
    if user_email and user_email != "anonymous":
        return user_email

    query_email = req.args.get("user_email")
    if query_email and query_email != "anonymous":
        return query_email

    data = req.get_json(silent=True) or {}
    body_email = data.get("user_email")
    if body_email and body_email != "anonymous":
        return body_email

    return None


def _parse_iso_date(value, field_name):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        raise ValueError(f"{field_name} must be in YYYY-MM-DD format")


@profile_bp.route("/moods", methods=["GET"])
def get_moods():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        month_value = request.args.get("month")
        if month_value:
            try:
                year_str, month_str = month_value.split("-")
                year = int(year_str)
                month = int(month_str)
                if month < 1 or month > 12:
                    raise ValueError("Month out of range")
            except Exception:
                return jsonify({"error": "month must be in YYYY-MM format"}), 400
        else:
            now = datetime.utcnow()
            year = now.year
            month = now.month

        rows = get_mood_entries_for_month(user_email, year, month)
        return jsonify({"moods": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/moods", methods=["POST"])
def upsert_mood():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        payload = request.get_json() or {}
        entry_date_raw = payload.get("entry_date")
        mood_emoji = payload.get("mood_emoji")
        mood_label = payload.get("mood_label")
        notes = payload.get("notes")

        if not entry_date_raw:
            return jsonify({"error": "entry_date is required"}), 400
        if not mood_emoji:
            return jsonify({"error": "mood_emoji is required"}), 400

        entry_date = _parse_iso_date(entry_date_raw, "entry_date")
        entry = upsert_mood_entry(user_email, entry_date, mood_emoji, mood_label, notes)
        return jsonify({"success": True, "entry": entry})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/breathing", methods=["GET"])
def get_breathing():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        start_date_raw = request.args.get("start_date")
        end_date_raw = request.args.get("end_date")

        if start_date_raw and end_date_raw:
            start_date = _parse_iso_date(start_date_raw, "start_date")
            end_date = _parse_iso_date(end_date_raw, "end_date")
        else:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=today.weekday() + 1 if today.weekday() < 6 else 0)
            end_date = start_date + timedelta(days=6)

        rows = get_breathing_entries_between(user_email, start_date, end_date)
        return jsonify({"entries": rows})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/breathing", methods=["POST"])
def upsert_breathing():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        payload = request.get_json() or {}
        entry_date_raw = payload.get("entry_date")
        duration_minutes = payload.get("duration_minutes")
        notes = payload.get("notes")

        if not entry_date_raw:
            return jsonify({"error": "entry_date is required"}), 400
        if duration_minutes is None:
            return jsonify({"error": "duration_minutes is required"}), 400

        try:
            duration_minutes = int(duration_minutes)
        except Exception:
            return jsonify({"error": "duration_minutes must be numeric"}), 400

        if duration_minutes < 0:
            return jsonify({"error": "duration_minutes cannot be negative"}), 400

        entry_date = _parse_iso_date(entry_date_raw, "entry_date")
        entry = upsert_breathing_entry(user_email, entry_date, duration_minutes, notes)
        return jsonify({"success": True, "entry": entry})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/meditation", methods=["GET"])
def get_meditation():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        start_date_raw = request.args.get("start_date")
        end_date_raw = request.args.get("end_date")

        if start_date_raw and end_date_raw:
            start_date = _parse_iso_date(start_date_raw, "start_date")
            end_date = _parse_iso_date(end_date_raw, "end_date")
        else:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=today.weekday() + 1 if today.weekday() < 6 else 0)
            end_date = start_date + timedelta(days=6)

        rows = get_meditation_entries_between(user_email, start_date, end_date)
        return jsonify({"entries": rows})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/meditation", methods=["POST"])
def upsert_meditation():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        payload = request.get_json() or {}
        entry_date_raw = payload.get("entry_date")
        duration_minutes = payload.get("duration_minutes")
        meditation_type = payload.get("meditation_type")
        post_mood = payload.get("post_mood")
        notes = payload.get("notes")

        if not entry_date_raw:
            return jsonify({"error": "entry_date is required"}), 400
        if duration_minutes is None:
            return jsonify({"error": "duration_minutes is required"}), 400

        try:
            duration_minutes = int(duration_minutes)
        except Exception:
            return jsonify({"error": "duration_minutes must be numeric"}), 400

        if duration_minutes < 0:
            return jsonify({"error": "duration_minutes cannot be negative"}), 400

        entry_date = _parse_iso_date(entry_date_raw, "entry_date")
        entry = upsert_meditation_entry(
            user_email,
            entry_date,
            duration_minutes,
            meditation_type,
            post_mood,
            notes,
        )
        return jsonify({"success": True, "entry": entry})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/quiz-results", methods=["GET"])
def get_quiz_results():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        entry_date_raw = request.args.get("entry_date")
        month_value = request.args.get("month")

        if entry_date_raw:
            entry_date = _parse_iso_date(entry_date_raw, "entry_date")
            row = get_quiz_result_for_date(user_email, entry_date)
            return jsonify({"results": [row] if row else []})

        if month_value:
            try:
                year_str, month_str = month_value.split("-")
                year = int(year_str)
                month = int(month_str)
                if month < 1 or month > 12:
                    raise ValueError("Month out of range")
            except Exception:
                return jsonify({"error": "month must be in YYYY-MM format"}), 400
        else:
            now = datetime.utcnow()
            year = now.year
            month = now.month

        rows = get_quiz_results_for_month(user_email, year, month)
        return jsonify({"results": rows})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/quiz-results", methods=["POST"])
def save_quiz_result():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        payload = request.get_json() or {}
        result_summary = (payload.get("result_summary") or "").strip()
        questions_answers = payload.get("questions_answers")
        entry_date_raw = payload.get("entry_date")

        if not result_summary:
            return jsonify({"error": "result_summary is required"}), 400

        entry_date = _parse_iso_date(entry_date_raw, "entry_date") if entry_date_raw else datetime.utcnow().date()

        row = upsert_quiz_result(
            user_email=user_email,
            entry_date=entry_date,
            result_summary=result_summary,
            questions_answers=questions_answers,
        )
        return jsonify({"success": True, "result": row})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/journals", methods=["GET"])
def list_journals():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        limit = request.args.get("limit", 100)
        try:
            limit = max(1, min(500, int(limit)))
        except Exception:
            limit = 100

        entry_date_raw = request.args.get("entry_date")
        entry_date = None
        if entry_date_raw:
            entry_date = _parse_iso_date(entry_date_raw, "entry_date")

        rows = get_journal_entries(user_email, limit, entry_date)
        return jsonify({"journals": rows})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/journals", methods=["POST"])
def create_journal():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        payload = request.get_json() or {}
        title = (payload.get("title") or "").strip()
        content = (payload.get("content") or "").strip()
        image_url = payload.get("image_url")
        entry_date_raw = payload.get("entry_date")

        if not title:
            return jsonify({"error": "title is required"}), 400
        if not content:
            return jsonify({"error": "content is required"}), 400

        entry_date = None
        if entry_date_raw:
            entry_date = _parse_iso_date(entry_date_raw, "entry_date")

        row = create_journal_entry(
            user_email=user_email,
            title=title,
            content=content,
            image_url=image_url,
            entry_date=entry_date,
        )

        return jsonify({"success": True, "journal": row}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/journals/<int:entry_id>", methods=["DELETE"])
def delete_journal(entry_id):
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        deleted = delete_journal_entry(entry_id, user_email)
        if not deleted:
            return jsonify({"error": "Journal not found"}), 404

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/streak", methods=["GET"])
def get_streak():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        stats = get_journal_streak_stats(user_email)
        return jsonify({"streak": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/data-management/delete-all", methods=["POST"])
def delete_all_user_records():
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        payload = request.get_json() or {}
        confirmed = bool(payload.get("confirm_delete_all"))

        if not confirmed:
            return jsonify({"error": "confirm_delete_all must be true"}), 400

        db_result = delete_all_user_data(user_email)
        conversation_result = delete_all_user_conversations(user_email)

        return jsonify(
            {
                "success": True,
                "user_email": user_email,
                "database": db_result,
                "conversations": conversation_result,
                "note": "External identity account data is not deleted by this endpoint.",
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
