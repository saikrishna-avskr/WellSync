"""
Diet Database Module - MySQL database for storing user diet preferences and meal plans
"""

import json
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pymysql
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_ENV_PATH = BASE_DIR.parent / ".env"
load_dotenv(ROOT_ENV_PATH)


def _get_db_config():
    """Build DB config from .env (DB_* preferred, DATABASE_URL fallback)."""
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")

    ssl_mode = os.getenv("DB_SSL_MODE", "").upper()

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        query = parse_qs(parsed.query)

        host = host or parsed.hostname
        port = int(port) if port else (parsed.port or 3306)
        user = user or parsed.username
        password = password or parsed.password
        database = database or (parsed.path[1:] if parsed.path else None)

        if not ssl_mode:
            ssl_mode = (query.get("ssl-mode", [""])[0] or query.get("ssl_mode", [""])[0]).upper()
    else:
        port = int(port) if port else 3306

    if not all([host, user, password, database]):
        raise ValueError("Missing MySQL configuration. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (or DATABASE_URL) in .env")

    config = {
        "host": host,
        "port": int(port),
        "user": user,
        "password": password,
        "database": database,
        "cursorclass": pymysql.cursors.DictCursor,
        "charset": "utf8mb4",
        "autocommit": False,
    }

    if ssl_mode in {"REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY"}:
        config["ssl"] = {}

    return config


def get_db_connection():
    """Create and return a MySQL database connection."""
    return pymysql.connect(**_get_db_config())


def _ensure_database_exists():
    """Create database if it does not exist (if user has permissions)."""
    config = _get_db_config()
    database_name = config.pop("database")

    conn = pymysql.connect(**config)
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.commit()
    finally:
        conn.close()


def init_database():
    """Initialize the database with required tables."""
    try:
        _ensure_database_exists()
    except Exception as e:
        print(f"Database creation skipped or failed: {e}")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            diet_type VARCHAR(100),
            health_conditions JSON,
            allergies JSON,
            calorie_goal INT DEFAULT 2000,
            cuisine_preference VARCHAR(100) DEFAULT 'any',
            cooking_time VARCHAR(20) DEFAULT '30',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_preferences_email (user_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meal_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            plan_name VARCHAR(255),
            diet_type VARCHAR(100),
            health_conditions JSON,
            allergies JSON,
            calorie_goal INT,
            cuisine_preference VARCHAR(100),
            cooking_time VARCHAR(20),
            ingredients TEXT,
            plan_content LONGTEXT NOT NULL,
            plan_type VARCHAR(50) DEFAULT 'meal_plan',
            is_favorite TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_meal_plans_user_email_created_at (user_email, created_at),
            INDEX idx_meal_plans_plan_type (plan_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_tracking (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            tracking_date DATE NOT NULL,
            water_glasses INT DEFAULT 0,
            calories_consumed INT DEFAULT 0,
            protein_g INT DEFAULT 0,
            carbs_g INT DEFAULT 0,
            fats_g INT DEFAULT 0,
            fiber_g INT DEFAULT 0,
            meals_logged JSON,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_daily_tracking_user_date (user_email, tracking_date),
            INDEX idx_daily_tracking_user_date (user_email, tracking_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recipe_suggestions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            recipe_name VARCHAR(255),
            ingredients TEXT,
            calories INT,
            cooking_time VARCHAR(20),
            tags JSON,
            instructions LONGTEXT,
            is_favorite TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_recipe_user_email_created_at (user_email, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS yoga_pose_stats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            pose_name VARCHAR(100) NOT NULL,
            latest_pose_time_seconds DECIMAL(10,2) DEFAULT 0,
            best_hold_seconds DECIMAL(10,2) DEFAULT 0,
            sessions_count INT DEFAULT 0,
            total_hold_seconds DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_yoga_pose_stats_user_pose (user_email, pose_name),
            INDEX idx_yoga_pose_stats_user_email (user_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ''')

    conn.commit()
    conn.close()
    print(f"MySQL database initialized: {_get_db_config()['database']}")


# ==================== User Preferences ====================

def save_user_preferences(user_email, diet_type, health_conditions, allergies, 
                          calorie_goal, cuisine_preference, cooking_time):
    """Save or update user diet preferences."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user already has preferences
    cursor.execute('SELECT id FROM user_preferences WHERE user_email = %s', (user_email,))
    existing = cursor.fetchone()
    
    health_conditions_json = json.dumps(health_conditions) if isinstance(health_conditions, list) else health_conditions
    allergies_json = json.dumps(allergies) if isinstance(allergies, list) else allergies
    
    if existing:
        cursor.execute('''
            UPDATE user_preferences 
            SET diet_type = %s, health_conditions = %s, allergies = %s, 
                calorie_goal = %s, cuisine_preference = %s, cooking_time = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_email = %s
        ''', (diet_type, health_conditions_json, allergies_json, 
              calorie_goal, cuisine_preference, cooking_time, user_email))
    else:
        cursor.execute('''
            INSERT INTO user_preferences 
            (user_email, diet_type, health_conditions, allergies, calorie_goal, cuisine_preference, cooking_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (user_email, diet_type, health_conditions_json, allergies_json, 
              calorie_goal, cuisine_preference, cooking_time))
    
    conn.commit()
    conn.close()
    return True


def get_user_preferences(user_email):
    """Get user diet preferences."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM user_preferences WHERE user_email = %s', (user_email,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        result = dict(row)
        # Parse JSON fields
        if result.get('health_conditions'):
            try:
                result['health_conditions'] = json.loads(result['health_conditions'])
            except:
                pass
        if result.get('allergies'):
            try:
                result['allergies'] = json.loads(result['allergies'])
            except:
                pass
        return result
    return None


# ==================== Meal Plans ====================

def save_meal_plan(user_email, plan_content, diet_type=None, health_conditions=None,
                   allergies=None, calorie_goal=None, cuisine_preference=None,
                   cooking_time=None, ingredients=None, plan_name=None, plan_type='meal_plan'):
    """Save a generated meal plan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    health_conditions_json = json.dumps(health_conditions) if isinstance(health_conditions, list) else health_conditions
    allergies_json = json.dumps(allergies) if isinstance(allergies, list) else allergies
    
    # Generate plan name if not provided
    if not plan_name:
        plan_name = f"{diet_type or 'Custom'} Plan - {datetime.now().strftime('%B %d, %Y')}"
    
    cursor.execute('''
        INSERT INTO meal_plans 
        (user_email, plan_name, diet_type, health_conditions, allergies, 
         calorie_goal, cuisine_preference, cooking_time, ingredients, plan_content, plan_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (user_email, plan_name, diet_type, health_conditions_json, allergies_json,
          calorie_goal, cuisine_preference, cooking_time, ingredients, plan_content, plan_type))
    
    plan_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return plan_id


def get_meal_plans(user_email, limit=20, plan_type=None):
    """Get user's saved meal plans."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if plan_type:
        cursor.execute('''
            SELECT * FROM meal_plans 
            WHERE user_email = %s AND plan_type = %s
            ORDER BY created_at DESC 
            LIMIT %s
        ''', (user_email, plan_type, limit))
    else:
        cursor.execute('''
            SELECT * FROM meal_plans 
            WHERE user_email = %s 
            ORDER BY created_at DESC 
            LIMIT %s
        ''', (user_email, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    plans = []
    for row in rows:
        plan = dict(row)
        # Parse JSON fields
        if plan.get('health_conditions'):
            try:
                plan['health_conditions'] = json.loads(plan['health_conditions'])
            except:
                pass
        if plan.get('allergies'):
            try:
                plan['allergies'] = json.loads(plan['allergies'])
            except:
                pass
        plans.append(plan)
    
    return plans


def get_meal_plan_by_id(plan_id, user_email=None):
    """Get a specific meal plan by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_email:
        cursor.execute('SELECT * FROM meal_plans WHERE id = %s AND user_email = %s', (plan_id, user_email))
    else:
        cursor.execute('SELECT * FROM meal_plans WHERE id = %s', (plan_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        plan = dict(row)
        if plan.get('health_conditions'):
            try:
                plan['health_conditions'] = json.loads(plan['health_conditions'])
            except:
                pass
        if plan.get('allergies'):
            try:
                plan['allergies'] = json.loads(plan['allergies'])
            except:
                pass
        return plan
    return None


def toggle_favorite_plan(plan_id, user_email):
    """Toggle favorite status of a meal plan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT is_favorite FROM meal_plans WHERE id = %s AND user_email = %s', (plan_id, user_email))
    row = cursor.fetchone()
    
    if row:
        new_status = 0 if row['is_favorite'] else 1
        cursor.execute('UPDATE meal_plans SET is_favorite = %s WHERE id = %s', (new_status, plan_id))
        conn.commit()
        conn.close()
        return new_status
    
    conn.close()
    return None


def delete_meal_plan(plan_id, user_email):
    """Delete a meal plan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM meal_plans WHERE id = %s AND user_email = %s', (plan_id, user_email))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    
    return affected > 0


# ==================== Daily Tracking ====================

def save_daily_tracking(user_email, tracking_date, water_glasses=None, calories_consumed=None,
                        protein_g=None, carbs_g=None, fats_g=None, fiber_g=None, 
                        meals_logged=None, notes=None):
    """Save or update daily tracking data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    meals_logged_json = json.dumps(meals_logged) if isinstance(meals_logged, list) else meals_logged
    
    # Check if tracking exists for this date
    cursor.execute('''
        SELECT id FROM daily_tracking 
        WHERE user_email = %s AND tracking_date = %s
    ''', (user_email, tracking_date))
    existing = cursor.fetchone()
    
    if existing:
        # Build dynamic update query
        update_fields = []
        params = []
        
        if water_glasses is not None:
            update_fields.append('water_glasses = %s')
            params.append(water_glasses)
        if calories_consumed is not None:
            update_fields.append('calories_consumed = %s')
            params.append(calories_consumed)
        if protein_g is not None:
            update_fields.append('protein_g = %s')
            params.append(protein_g)
        if carbs_g is not None:
            update_fields.append('carbs_g = %s')
            params.append(carbs_g)
        if fats_g is not None:
            update_fields.append('fats_g = %s')
            params.append(fats_g)
        if fiber_g is not None:
            update_fields.append('fiber_g = %s')
            params.append(fiber_g)
        if meals_logged is not None:
            update_fields.append('meals_logged = %s')
            params.append(meals_logged_json)
        if notes is not None:
            update_fields.append('notes = %s')
            params.append(notes)
        
        if update_fields:
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.extend([user_email, tracking_date])
            
            cursor.execute(f'''
                UPDATE daily_tracking 
                SET {', '.join(update_fields)}
                WHERE user_email = %s AND tracking_date = %s
            ''', params)
    else:
        cursor.execute('''
            INSERT INTO daily_tracking 
            (user_email, tracking_date, water_glasses, calories_consumed, 
             protein_g, carbs_g, fats_g, fiber_g, meals_logged, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (user_email, tracking_date, water_glasses or 0, calories_consumed or 0,
              protein_g or 0, carbs_g or 0, fats_g or 0, fiber_g or 0,
              meals_logged_json, notes))
    
    conn.commit()
    conn.close()
    return True


def get_daily_tracking(user_email, tracking_date):
    """Get tracking data for a specific date."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM daily_tracking 
        WHERE user_email = %s AND tracking_date = %s
    ''', (user_email, tracking_date))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        result = dict(row)
        if result.get('meals_logged'):
            try:
                result['meals_logged'] = json.loads(result['meals_logged'])
            except:
                pass
        return result
    return None


def get_tracking_history(user_email, days=30):
    """Get tracking history for the past N days."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM daily_tracking 
        WHERE user_email = %s 
        ORDER BY tracking_date DESC 
        LIMIT %s
    ''', (user_email, days))
    
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        item = dict(row)
        if item.get('meals_logged'):
            try:
                item['meals_logged'] = json.loads(item['meals_logged'])
            except:
                pass
        history.append(item)
    
    return history


# ==================== Yoga Pose Stats ====================

def get_yoga_pose_stats(user_email):
    """Get all yoga pose stats for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT user_email, pose_name, latest_pose_time_seconds, best_hold_seconds,
               sessions_count, total_hold_seconds, created_at, updated_at
        FROM yoga_pose_stats
        WHERE user_email = %s
    ''', (user_email,))

    rows = cursor.fetchall()
    conn.close()

    stats = []
    for row in rows:
        item = dict(row)
        item['latest_pose_time_seconds'] = float(item.get('latest_pose_time_seconds') or 0)
        item['best_hold_seconds'] = float(item.get('best_hold_seconds') or 0)
        item['total_hold_seconds'] = float(item.get('total_hold_seconds') or 0)
        stats.append(item)

    return stats


def get_yoga_pose_stat(user_email, pose_name):
    """Get yoga stats for a specific pose and user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT user_email, pose_name, latest_pose_time_seconds, best_hold_seconds,
               sessions_count, total_hold_seconds, created_at, updated_at
        FROM yoga_pose_stats
        WHERE user_email = %s AND pose_name = %s
        LIMIT 1
    ''', (user_email, pose_name))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    result = dict(row)
    result['latest_pose_time_seconds'] = float(result.get('latest_pose_time_seconds') or 0)
    result['best_hold_seconds'] = float(result.get('best_hold_seconds') or 0)
    result['total_hold_seconds'] = float(result.get('total_hold_seconds') or 0)
    return result


def upsert_yoga_pose_stat(user_email, pose_name, pose_time_seconds, best_hold_seconds=None):
    """Upsert yoga pose stats for a user and pose."""
    conn = get_db_connection()
    cursor = conn.cursor()

    safe_pose_time = max(float(pose_time_seconds or 0), 0.0)
    safe_best = max(float(best_hold_seconds if best_hold_seconds is not None else safe_pose_time), 0.0)

    cursor.execute('''
        INSERT INTO yoga_pose_stats
            (user_email, pose_name, latest_pose_time_seconds, best_hold_seconds, sessions_count, total_hold_seconds)
        VALUES (%s, %s, %s, %s, 1, %s)
        ON DUPLICATE KEY UPDATE
            latest_pose_time_seconds = VALUES(latest_pose_time_seconds),
            best_hold_seconds = GREATEST(best_hold_seconds, VALUES(best_hold_seconds)),
            sessions_count = sessions_count + 1,
            total_hold_seconds = total_hold_seconds + VALUES(latest_pose_time_seconds),
            updated_at = CURRENT_TIMESTAMP
    ''', (user_email, pose_name, safe_pose_time, safe_best, safe_pose_time))

    conn.commit()
    conn.close()

    return get_yoga_pose_stat(user_email, pose_name)


# Initialize database on module import
init_database()
