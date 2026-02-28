"""
Diet Database Module - SQLite database for storing user diet preferences and meal plans
"""

import sqlite3
import os
import json
from datetime import datetime
from pathlib import Path

# Database file path
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "diet_plans.db"


def get_db_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize the database with required tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users diet preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            diet_type TEXT,
            health_conditions TEXT,
            allergies TEXT,
            calorie_goal INTEGER DEFAULT 2000,
            cuisine_preference TEXT DEFAULT 'any',
            cooking_time TEXT DEFAULT '30',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create meal plans table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meal_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            plan_name TEXT,
            diet_type TEXT,
            health_conditions TEXT,
            allergies TEXT,
            calorie_goal INTEGER,
            cuisine_preference TEXT,
            cooking_time TEXT,
            ingredients TEXT,
            plan_content TEXT NOT NULL,
            plan_type TEXT DEFAULT 'meal_plan',
            is_favorite INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create daily tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            tracking_date DATE NOT NULL,
            water_glasses INTEGER DEFAULT 0,
            calories_consumed INTEGER DEFAULT 0,
            protein_g INTEGER DEFAULT 0,
            carbs_g INTEGER DEFAULT 0,
            fats_g INTEGER DEFAULT 0,
            fiber_g INTEGER DEFAULT 0,
            meals_logged TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_email, tracking_date)
        )
    ''')
    
    # Create recipe suggestions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recipe_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            recipe_name TEXT,
            ingredients TEXT,
            calories INTEGER,
            cooking_time TEXT,
            tags TEXT,
            instructions TEXT,
            is_favorite INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")


# ==================== User Preferences ====================

def save_user_preferences(user_email, diet_type, health_conditions, allergies, 
                          calorie_goal, cuisine_preference, cooking_time):
    """Save or update user diet preferences."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user already has preferences
    cursor.execute('SELECT id FROM user_preferences WHERE user_email = ?', (user_email,))
    existing = cursor.fetchone()
    
    health_conditions_json = json.dumps(health_conditions) if isinstance(health_conditions, list) else health_conditions
    allergies_json = json.dumps(allergies) if isinstance(allergies, list) else allergies
    
    if existing:
        cursor.execute('''
            UPDATE user_preferences 
            SET diet_type = ?, health_conditions = ?, allergies = ?, 
                calorie_goal = ?, cuisine_preference = ?, cooking_time = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_email = ?
        ''', (diet_type, health_conditions_json, allergies_json, 
              calorie_goal, cuisine_preference, cooking_time, user_email))
    else:
        cursor.execute('''
            INSERT INTO user_preferences 
            (user_email, diet_type, health_conditions, allergies, calorie_goal, cuisine_preference, cooking_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_email, diet_type, health_conditions_json, allergies_json, 
              calorie_goal, cuisine_preference, cooking_time))
    
    conn.commit()
    conn.close()
    return True


def get_user_preferences(user_email):
    """Get user diet preferences."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM user_preferences WHERE user_email = ?', (user_email,))
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            WHERE user_email = ? AND plan_type = ?
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (user_email, plan_type, limit))
    else:
        cursor.execute('''
            SELECT * FROM meal_plans 
            WHERE user_email = ? 
            ORDER BY created_at DESC 
            LIMIT ?
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
        cursor.execute('SELECT * FROM meal_plans WHERE id = ? AND user_email = ?', (plan_id, user_email))
    else:
        cursor.execute('SELECT * FROM meal_plans WHERE id = ?', (plan_id,))
    
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
    
    cursor.execute('SELECT is_favorite FROM meal_plans WHERE id = ? AND user_email = ?', (plan_id, user_email))
    row = cursor.fetchone()
    
    if row:
        new_status = 0 if row['is_favorite'] else 1
        cursor.execute('UPDATE meal_plans SET is_favorite = ? WHERE id = ?', (new_status, plan_id))
        conn.commit()
        conn.close()
        return new_status
    
    conn.close()
    return None


def delete_meal_plan(plan_id, user_email):
    """Delete a meal plan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM meal_plans WHERE id = ? AND user_email = ?', (plan_id, user_email))
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
        WHERE user_email = ? AND tracking_date = ?
    ''', (user_email, tracking_date))
    existing = cursor.fetchone()
    
    if existing:
        # Build dynamic update query
        update_fields = []
        params = []
        
        if water_glasses is not None:
            update_fields.append('water_glasses = ?')
            params.append(water_glasses)
        if calories_consumed is not None:
            update_fields.append('calories_consumed = ?')
            params.append(calories_consumed)
        if protein_g is not None:
            update_fields.append('protein_g = ?')
            params.append(protein_g)
        if carbs_g is not None:
            update_fields.append('carbs_g = ?')
            params.append(carbs_g)
        if fats_g is not None:
            update_fields.append('fats_g = ?')
            params.append(fats_g)
        if fiber_g is not None:
            update_fields.append('fiber_g = ?')
            params.append(fiber_g)
        if meals_logged is not None:
            update_fields.append('meals_logged = ?')
            params.append(meals_logged_json)
        if notes is not None:
            update_fields.append('notes = ?')
            params.append(notes)
        
        if update_fields:
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.extend([user_email, tracking_date])
            
            cursor.execute(f'''
                UPDATE daily_tracking 
                SET {', '.join(update_fields)}
                WHERE user_email = ? AND tracking_date = ?
            ''', params)
    else:
        cursor.execute('''
            INSERT INTO daily_tracking 
            (user_email, tracking_date, water_glasses, calories_consumed, 
             protein_g, carbs_g, fats_g, fiber_g, meals_logged, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        WHERE user_email = ? AND tracking_date = ?
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
        WHERE user_email = ? 
        ORDER BY tracking_date DESC 
        LIMIT ?
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


# Initialize database on module import
init_database()
