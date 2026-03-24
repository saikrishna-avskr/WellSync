"""
Yoga API Routes - Flask Blueprint for per-user pose tracking stats
"""

from flask import Blueprint, jsonify, request
from helper import get_email_from_clerk_request
from diet_db import get_yoga_pose_stats, get_yoga_pose_stat, upsert_yoga_pose_stat


yoga_bp = Blueprint("yoga", __name__, url_prefix="/yoga")

POSE_LIST = [
    "Tree",
    "Chair",
    "Cobra",
    "Warrior",
    "Dog",
    "Shoulderstand",
    "Traingle",
]

POSE_NAME_MAP = {
    "tree": "Tree",
    "treepose": "Tree",
    "chair": "Chair",
    "chairpose": "Chair",
    "cobra": "Cobra",
    "cobrapose": "Cobra",
    "warrior": "Warrior",
    "warriorpose": "Warrior",
    "dog": "Dog",
    "downwarddog": "Dog",
    "downwarddogpose": "Dog",
    "shoulderstand": "Shoulderstand",
    "shoulderstandpose": "Shoulderstand",
    "triangle": "Traingle",
    "trianglepose": "Traingle",
    "traingle": "Traingle",
    "trainglepose": "Traingle",
}


def normalize_pose_name(pose_name):
    """Normalize variant pose names to canonical names used by the frontend."""
    if not pose_name:
        return None

    compact = "".join(str(pose_name).strip().lower().split())
    return POSE_NAME_MAP.get(compact)


def get_user_email_from_request(req):
    """Resolve user identity from Clerk auth token, query params, or request body."""
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


@yoga_bp.route("/stats", methods=["GET"])
def yoga_stats_get_all():
    """Get all pose stats for a user (with defaults for missing poses)."""
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        rows = get_yoga_pose_stats(user_email)

        by_pose = {}
        for row in rows:
            normalized_pose = normalize_pose_name(row.get("pose_name"))
            if not normalized_pose:
                continue

            existing = by_pose.get(normalized_pose)
            if not existing:
                by_pose[normalized_pose] = row
                continue

            existing["best_hold_seconds"] = max(
                float(existing.get("best_hold_seconds") or 0),
                float(row.get("best_hold_seconds") or 0),
            )
            existing["latest_pose_time_seconds"] = max(
                float(existing.get("latest_pose_time_seconds") or 0),
                float(row.get("latest_pose_time_seconds") or 0),
            )
            existing["sessions_count"] = int(existing.get("sessions_count") or 0) + int(
                row.get("sessions_count") or 0
            )
            existing["total_hold_seconds"] = float(existing.get("total_hold_seconds") or 0) + float(
                row.get("total_hold_seconds") or 0
            )

        stats = {}
        for pose_name in POSE_LIST:
            row = by_pose.get(pose_name)
            stats[pose_name] = {
                "pose_name": pose_name,
                "latest_pose_time_seconds": float((row or {}).get("latest_pose_time_seconds", 0)),
                "best_hold_seconds": float((row or {}).get("best_hold_seconds", 0)),
                "sessions_count": int((row or {}).get("sessions_count", 0)),
                "total_hold_seconds": float((row or {}).get("total_hold_seconds", 0)),
            }

        return jsonify({"stats": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@yoga_bp.route("/stats/<pose_name>", methods=["GET"])
def yoga_stats_get_pose(pose_name):
    """Get single-pose stats for a user."""
    try:
        pose_name = normalize_pose_name(pose_name)
        if not pose_name:
            return jsonify({"error": "Invalid pose_name"}), 400

        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        stat = get_yoga_pose_stat(user_email, pose_name)
        if not stat:
            return jsonify({
                "stat": {
                    "pose_name": pose_name,
                    "latest_pose_time_seconds": 0.0,
                    "best_hold_seconds": 0.0,
                    "sessions_count": 0,
                    "total_hold_seconds": 0.0,
                }
            })

        return jsonify({"stat": stat})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@yoga_bp.route("/stats", methods=["POST"])
def yoga_stats_upsert():
    """Persist pose_time and best_hold per user and pose."""
    try:
        user_email = get_user_email_from_request(request)
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401

        data = request.get_json() or {}
        pose_name = normalize_pose_name(data.get("pose_name"))
        pose_time_seconds = data.get("pose_time_seconds")
        best_hold_seconds = data.get("best_hold_seconds")

        if not pose_name:
            return jsonify({"error": "Valid pose_name is required"}), 400

        if pose_time_seconds is None:
            return jsonify({"error": "pose_time_seconds is required"}), 400

        try:
            pose_time_seconds = float(pose_time_seconds)
            if best_hold_seconds is not None:
                best_hold_seconds = float(best_hold_seconds)
        except (TypeError, ValueError):
            return jsonify({"error": "pose_time_seconds and best_hold_seconds must be numeric"}), 400

        if pose_time_seconds < 0:
            return jsonify({"error": "pose_time_seconds cannot be negative"}), 400

        if best_hold_seconds is not None and best_hold_seconds < 0:
            return jsonify({"error": "best_hold_seconds cannot be negative"}), 400

        updated = upsert_yoga_pose_stat(
            user_email=user_email,
            pose_name=pose_name,
            pose_time_seconds=pose_time_seconds,
            best_hold_seconds=best_hold_seconds,
        )

        return jsonify({"success": True, "stat": updated})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
