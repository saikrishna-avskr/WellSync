"""
Diet API Routes - Flask Blueprint for diet-related endpoints
"""

from flask import Blueprint, jsonify, request, send_file, make_response
import os
import google.generativeai as genai
from datetime import datetime
import io
from dotenv import load_dotenv
from diet_db import (
    save_user_preferences, get_user_preferences,
    save_meal_plan, get_meal_plans, get_meal_plan_by_id,
    toggle_favorite_plan, delete_meal_plan,
    save_daily_tracking, get_daily_tracking, get_tracking_history
)

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("Google_API_Key"))

# Create Blueprint
diet_bp = Blueprint('diet', __name__, url_prefix='/diet')


# Add CORS headers for file downloads
@diet_bp.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response


def get_user_email_from_request(req):
    """Extract user email from request (from query params, body, or Clerk token)."""
    # Priority 1: Check query parameters
    user_email = req.args.get('user_email')
    if user_email and user_email != 'anonymous':
        return user_email
    
    # Priority 2: Check request body
    data = req.get_json(silent=True) or {}
    user_email = data.get('user_email')
    if user_email and user_email != 'anonymous':
        return user_email
    
    # Priority 3: Try to get from authorization header (Clerk JWT)
    auth_header = req.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            import jwt
            token = auth_header.split(' ')[1]
            # Decode without verification for email extraction
            decoded = jwt.decode(token, options={"verify_signature": False})
            email = decoded.get('email') or decoded.get('sub')
            if email:
                return email
        except Exception as e:
            print(f"JWT decode error: {e}")
    
    # Fallback
    return data.get('user_id', 'anonymous')


import requests


def generate_with_ollama(prompt, model_name="llama3:latest"):
    """Generate content using local Ollama API with optimized settings."""
    try:
        print(f"Calling Ollama with model: {model_name}")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 1500,  # Limit response length for faster generation
                    "temperature": 0.7,    # Balanced creativity
                    "top_p": 0.9
                }
            },
            timeout=120  # 2 minutes timeout
        )
        if response.status_code == 200:
            result = response.json().get("response", "")
            print(f"Ollama generated {len(result)} characters")
            return result
        else:
            raise Exception(f"Ollama error: {response.status_code} - {response.text}")
    except requests.exceptions.ConnectionError:
        raise Exception("Ollama is not running. Please start Ollama with 'ollama serve'")
    except requests.exceptions.Timeout:
        raise Exception("Ollama request timed out. The model may be too slow.")
    except Exception as e:
        print(f"Ollama API error: {e}")
        raise e


def generate_with_ai(prompt):
    """Generate content using Ollama (primary) with Gemini fallback."""
    
    # Try Ollama first (local, fast, no API limits)
    try:
        return generate_with_ollama(prompt, "llama3:latest")
    except Exception as ollama_error:
        print(f"Ollama failed: {ollama_error}")
    
    # Fallback to Gemini if Ollama fails
    print("Ollama failed, trying Gemini models...")
    model_names_to_try = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest", 
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    
    last_error = None
    for model in model_names_to_try:
        try:
            print(f"Trying Gemini model: {model}")
            genai_model = genai.GenerativeModel(model)
            response = genai_model.generate_content(prompt)
            print(f"Successfully generated with {model}")
            return response.text
        except Exception as e:
            last_error = e
            print(f"Gemini model {model} failed: {e}")
            continue
    
    raise last_error or Exception("All AI models failed. Please ensure Ollama is running or check your Gemini API key.")


# Keep old function name for compatibility
def generate_with_gemini(prompt, model_name=None):
    """Wrapper for backward compatibility."""
    return generate_with_ai(prompt)


def get_diet_guidelines(diet_type):
    """Return strict dietary guidelines for each diet type."""
    guidelines = {
        "vegan": """⚠️ VEGAN DIET - ABSOLUTELY NO ANIMAL PRODUCTS:
- NO meat (chicken, beef, pork, lamb, etc.)
- NO fish or seafood
- NO dairy (milk, cheese, yogurt, butter)
- NO eggs
- NO honey
- ONLY plant-based foods: vegetables, fruits, legumes, grains, nuts, seeds, tofu, tempeh, seitan
- Use plant milks (almond, oat, soy, coconut)
- Use plant-based protein sources (lentils, chickpeas, beans, tofu, tempeh, quinoa)""",
        
        "keto": """⚠️ KETO DIET - VERY LOW CARB, HIGH FAT:
- Keep carbs under 20-50g per day
- NO sugar, bread, pasta, rice, potatoes
- NO high-carb fruits (bananas, grapes, mangoes)
- Focus on: meats, fatty fish, eggs, butter, cheese, nuts, healthy oils
- Include: low-carb vegetables (leafy greens, broccoli, cauliflower)
- Prioritize healthy fats: avocado, olive oil, coconut oil""",
        
        "paleo": """⚠️ PALEO DIET - WHOLE FOODS ONLY:
- NO processed foods
- NO grains (wheat, rice, oats)
- NO legumes (beans, lentils, peanuts)
- NO dairy products
- NO refined sugar
- Focus on: lean meats, fish, vegetables, fruits, nuts, seeds
- Eat like our ancestors: natural, unprocessed foods only""",
        
        "mediterranean": """⚠️ MEDITERRANEAN DIET - HEART HEALTHY:
- Emphasize: olive oil, fish, vegetables, fruits, whole grains, legumes
- Moderate: poultry, eggs, cheese, yogurt
- Limit: red meat (once a week max)
- NO processed foods
- Include healthy fats: olive oil, nuts, fish
- Use herbs and spices instead of salt""",
        
        "lowcarb": """⚠️ LOW CARB DIET - REDUCED CARBOHYDRATES:
- Keep carbs moderate (50-150g per day)
- Limit: bread, pasta, rice, sugary foods
- Focus on: proteins, vegetables, healthy fats
- Choose complex carbs when eating carbs
- Include: meat, fish, eggs, vegetables, some fruits, nuts""",
        
        "balanced": """⚠️ BALANCED DIET - WELL-ROUNDED NUTRITION:
- Include all food groups in moderation
- Focus on whole, unprocessed foods
- Balance macronutrients: carbs, proteins, fats
- Plenty of vegetables and fruits
- Lean proteins, whole grains, healthy fats"""
    }
    
    return guidelines.get(diet_type.lower(), guidelines["balanced"])


# ==================== Preferences Endpoints ====================

@diet_bp.route('/preferences', methods=['GET'])
def get_preferences():
    """Get user's diet preferences."""
    try:
        user_email = get_user_email_from_request(request)
        print(f"[preferences GET] user_email: {user_email}")
        
        if not user_email or user_email == 'anonymous':
            # Return empty preferences instead of 401
            return jsonify({"preferences": None})
        
        prefs = get_user_preferences(user_email)
        return jsonify({"preferences": prefs})
    except Exception as e:
        print(f"[preferences GET] error: {e}")
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/preferences', methods=['POST'])
def save_preferences():
    """Save user's diet preferences."""
    try:
        user_email = get_user_email_from_request(request)
        print(f"[preferences POST] user_email: {user_email}")
        
        if not user_email or user_email == 'anonymous':
            return jsonify({"error": "User email required to save preferences"}), 400
        
        data = request.get_json()
        
        success = save_user_preferences(
            user_email=user_email,
            diet_type=data.get('diet_type', 'balanced'),
            health_conditions=data.get('health_conditions', []),
            allergies=data.get('allergies', []),
            calorie_goal=data.get('calorie_goal', 2000),
            cuisine_preference=data.get('cuisine_preference', 'any'),
            cooking_time=data.get('cooking_time', '30')
        )
        
        return jsonify({"success": success})
    except Exception as e:
        print(f"[preferences POST] error: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== Meal Plan Generation ====================

@diet_bp.route('/generate-plan', methods=['POST'])
def generate_meal_plan():
    """Generate a personalized meal plan using Gemini AI."""
    try:
        user_email = get_user_email_from_request(request)
        data = request.get_json()
        
        # Extract parameters
        diet_type = data.get('diet_type', 'balanced')
        health_conditions = data.get('health_conditions', [])
        allergies = data.get('allergies', [])
        calorie_goal = data.get('calorie_goal', 2000)
        cuisine_preference = data.get('cuisine_preference', 'any')
        cooking_time = data.get('cooking_time', '30')
        
        # Build the prompt
        conditions_str = ', '.join(health_conditions) if health_conditions else 'None specified'
        allergies_str = ', '.join(allergies) if allergies else 'None'
        
        # Get strict diet guidelines
        diet_guidelines = get_diet_guidelines(diet_type)
        
        prompt = f"""You are a professional nutritionist and dietitian. Create a detailed, personalized daily meal plan.

## CRITICAL DIET RESTRICTION - MUST FOLLOW:
{diet_guidelines}

## User Profile:
- **Diet Type:** {diet_type.upper()} (STRICTLY follow this!)
- **Health Conditions:** {conditions_str}
- **Allergies/Restrictions:** {allergies_str}
- **Daily Calorie Goal:** {calorie_goal} kcal
- **Cuisine Preference:** {cuisine_preference}
- **Max Cooking Time per Meal:** {cooking_time} minutes

## IMPORTANT RULES:
1. NEVER include any foods that violate the {diet_type} diet
2. Every single meal MUST comply with {diet_type} requirements
3. Double-check each ingredient is allowed in {diet_type} diet

## Instructions:
Create a complete daily meal plan that includes:

### 🌅 Breakfast (7:00 - 9:00 AM)
- Provide a healthy breakfast option
- Include approximate calories, protein, carbs, and fats
- List key ingredients
- Brief preparation steps (2-3 sentences)

### 🍎 Mid-Morning Snack (10:00 - 11:00 AM)
- A light, nutritious snack
- Include calories and nutritional benefits

### 🥗 Lunch (12:00 - 2:00 PM)
- A satisfying lunch option
- Include approximate calories, protein, carbs, and fats
- List key ingredients
- Brief preparation steps

### 🥜 Afternoon Snack (3:00 - 4:00 PM)
- An energizing snack
- Include calories and nutritional benefits

### 🍽️ Dinner (6:00 - 8:00 PM)
- A balanced dinner option
- Include approximate calories, protein, carbs, and fats
- List key ingredients
- Brief preparation steps

### 🫖 Evening (Optional - 9:00 PM)
- A light option if needed
- Focus on sleep-promoting foods

## Summary:
- Total daily calories
- Macronutrient breakdown  
- Key health benefits

FORMATTING RULES (IMPORTANT):
- Use emojis and bullet points (- or •)
- DO NOT use asterisks (*) or markdown bold/italic
- Use CAPS or emojis for emphasis instead of **bold**
- Keep it clean, readable plain text with line breaks
- Structure with clear headings using emojis"""

        # Generate with AI
        plan_content = generate_with_gemini(prompt)
        
        # Save to database if user is authenticated
        plan_id = None
        print(f"[generate-plan] user_email: {user_email}")
        
        if user_email and user_email != 'anonymous':
            plan_id = save_meal_plan(
                user_email=user_email,
                plan_content=plan_content,
                diet_type=diet_type,
                health_conditions=health_conditions,
                allergies=allergies,
                calorie_goal=calorie_goal,
                cuisine_preference=cuisine_preference,
                cooking_time=cooking_time,
                plan_type='meal_plan'
            )
            print(f"[generate-plan] saved plan with id: {plan_id}")
        else:
            print(f"[generate-plan] NOT saving - user is anonymous")
        
        return jsonify({
            "success": True,
            "plan": plan_content,
            "plan_id": plan_id
        })
        
    except Exception as e:
        print(f"Error generating meal plan: {e}")
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/generate-recipes', methods=['POST'])
def generate_recipes():
    """Generate recipe suggestions based on ingredients."""
    try:
        user_email = get_user_email_from_request(request)
        data = request.get_json()
        
        ingredients = data.get('ingredients', '')
        diet_type = data.get('diet_type', 'balanced')
        allergies = data.get('allergies', [])
        cooking_time = data.get('cooking_time', '30')
        cuisine_preference = data.get('cuisine_preference', 'any')
        
        allergies_str = ', '.join(allergies) if allergies else 'None'
        
        # Get strict diet guidelines
        diet_guidelines = get_diet_guidelines(diet_type)
        
        prompt = f"""You are a professional chef and nutritionist. Suggest 4 delicious and healthy recipes.

## CRITICAL DIET RESTRICTION - MUST FOLLOW:
{diet_guidelines}

## Available Ingredients:
{ingredients}

## Requirements:
- **Diet Type:** {diet_type.upper()} (STRICTLY follow this - every recipe MUST comply!)
- **Must Avoid (Allergies):** {allergies_str}
- **Max Cooking Time:** {cooking_time} minutes
- **Cuisine Preference:** {cuisine_preference}

## IMPORTANT RULES:
1. EVERY recipe MUST strictly follow the {diet_type} diet requirements
2. NEVER include any forbidden ingredients for {diet_type} diet
3. Double-check each ingredient is allowed

## Please provide 4 recipes in this format:

### Recipe 1: [Recipe Name]
- **Calories:** XXX kcal per serving
- **Cooking Time:** XX minutes
- **Servings:** X
- **Tags:** [e.g., High Protein, Low Carb, Quick, etc.]

**Ingredients:**
- List all ingredients with quantities

**Instructions:**
1. Step-by-step cooking instructions
2. Keep it concise but clear

**Nutritional Benefits:**
- Brief explanation of health benefits

---

(Repeat for recipes 2, 3, and 4)

Make recipes diverse - include different cooking methods and flavor profiles."""

        # Generate with Gemini
        recipe_content = generate_with_gemini(prompt)
        
        # Save to database if user is authenticated
        plan_id = None
        if user_email and user_email != 'anonymous':
            plan_id = save_meal_plan(
                user_email=user_email,
                plan_content=recipe_content,
                diet_type=diet_type,
                allergies=allergies,
                cooking_time=cooking_time,
                cuisine_preference=cuisine_preference,
                ingredients=ingredients,
                plan_type='recipe'
            )
        
        return jsonify({
            "success": True,
            "recipes": recipe_content,
            "plan_id": plan_id
        })
        
    except Exception as e:
        print(f"Error generating recipes: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== Meal Plan History ====================

@diet_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get user's saved meal plans."""
    try:
        user_email = get_user_email_from_request(request)
        print(f"[plans GET] user_email: {user_email}")
        
        if not user_email or user_email == 'anonymous':
            # Return empty list instead of 401
            return jsonify({"plans": []})
        
        limit = request.args.get('limit', 20, type=int)
        plan_type = request.args.get('type')  # 'meal_plan' or 'recipe'
        
        plans = get_meal_plans(user_email, limit, plan_type)
        print(f"[plans GET] found {len(plans)} plans for {user_email}")
        return jsonify({"plans": plans})
    except Exception as e:
        print(f"[plans GET] error: {e}")
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/plans/<int:plan_id>', methods=['GET'])
def get_plan(plan_id):
    """Get a specific meal plan."""
    try:
        user_email = get_user_email_from_request(request)
        plan = get_meal_plan_by_id(plan_id, user_email)
        
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        return jsonify({"plan": plan})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/plans/<int:plan_id>/favorite', methods=['POST'])
def toggle_favorite(plan_id):
    """Toggle favorite status of a meal plan."""
    try:
        user_email = get_user_email_from_request(request)
        if not user_email or user_email == 'anonymous':
            return jsonify({"error": "Authentication required"}), 401
        
        new_status = toggle_favorite_plan(plan_id, user_email)
        
        if new_status is None:
            return jsonify({"error": "Plan not found"}), 404
        
        return jsonify({"is_favorite": bool(new_status)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    """Delete a meal plan."""
    try:
        user_email = get_user_email_from_request(request)
        if not user_email or user_email == 'anonymous':
            return jsonify({"error": "Authentication required"}), 401
        
        success = delete_meal_plan(plan_id, user_email)
        
        if not success:
            return jsonify({"error": "Plan not found or already deleted"}), 404
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== Daily Tracking ====================

@diet_bp.route('/tracking', methods=['GET'])
def get_tracking():
    """Get tracking data for a specific date."""
    try:
        user_email = get_user_email_from_request(request)
        print(f"[tracking GET] user_email: {user_email}")
        
        if not user_email or user_email == 'anonymous':
            # Return empty tracking instead of 401
            return jsonify({"tracking": None})
        
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        tracking = get_daily_tracking(user_email, date)
        
        return jsonify({"tracking": tracking})
    except Exception as e:
        print(f"[tracking GET] error: {e}")
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/tracking', methods=['POST'])
def update_tracking():
    """Update daily tracking data."""
    try:
        user_email = get_user_email_from_request(request)
        print(f"[tracking POST] user_email: {user_email}")
        
        if not user_email or user_email == 'anonymous':
            return jsonify({"error": "User email required to save tracking"}), 400
        
        data = request.get_json()
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        success = save_daily_tracking(
            user_email=user_email,
            tracking_date=date,
            water_glasses=data.get('water_glasses'),
            calories_consumed=data.get('calories_consumed'),
            protein_g=data.get('protein_g'),
            carbs_g=data.get('carbs_g'),
            fats_g=data.get('fats_g'),
            fiber_g=data.get('fiber_g'),
            meals_logged=data.get('meals_logged'),
            notes=data.get('notes')
        )
        
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/tracking/history', methods=['GET'])
def get_tracking_hist():
    """Get tracking history."""
    try:
        user_email = get_user_email_from_request(request)
        if not user_email or user_email == 'anonymous':
            return jsonify({"error": "Authentication required"}), 401
        
        days = request.args.get('days', 30, type=int)
        history = get_tracking_history(user_email, days)
        
        return jsonify({"history": history})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== Export Functionality ====================

@diet_bp.route('/export/<int:plan_id>', methods=['GET', 'OPTIONS'])
def export_plan(plan_id):
    """Export a meal plan as text or PDF."""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        user_email = get_user_email_from_request(request)
        export_format = request.args.get('format', 'txt')  # 'txt' or 'pdf'
        
        plan = get_meal_plan_by_id(plan_id, user_email if user_email != 'anonymous' else None)
        
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        plan_content = plan.get('plan_content', '')
        plan_name = plan.get('plan_name', 'Meal Plan')
        created_at = plan.get('created_at', '')
        
        if export_format == 'txt':
            # Create text file
            content = f"""{'='*60}
{plan_name}
{'='*60}
Generated: {created_at}
Diet Type: {plan.get('diet_type', 'N/A')}
Calorie Goal: {plan.get('calorie_goal', 'N/A')} kcal
{'='*60}

{plan_content}

{'='*60}
Generated by WellSync - Smart Diet Planner
{'='*60}
"""
            
            # Create in-memory file
            buffer = io.BytesIO()
            buffer.write(content.encode('utf-8'))
            buffer.seek(0)
            
            filename = f"{plan_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.txt"
            
            return send_file(
                buffer,
                mimetype='text/plain',
                as_attachment=True,
                download_name=filename
            )
        
        elif export_format == 'pdf':
            try:
                from reportlab.lib.pagesizes import letter, A4
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
                from reportlab.lib.colors import HexColor
                from reportlab.lib.enums import TA_CENTER, TA_LEFT
                
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(
                    buffer, 
                    pagesize=A4,
                    rightMargin=0.75*inch,
                    leftMargin=0.75*inch,
                    topMargin=0.75*inch,
                    bottomMargin=0.75*inch
                )
                
                styles = getSampleStyleSheet()
                
                # Custom styles
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=24,
                    textColor=HexColor('#10b981'),
                    alignment=TA_CENTER,
                    spaceAfter=20
                )
                
                subtitle_style = ParagraphStyle(
                    'CustomSubtitle',
                    parent=styles['Normal'],
                    fontSize=12,
                    textColor=HexColor('#666666'),
                    alignment=TA_CENTER,
                    spaceAfter=30
                )
                
                body_style = ParagraphStyle(
                    'CustomBody',
                    parent=styles['Normal'],
                    fontSize=11,
                    leading=16,
                    spaceAfter=12
                )
                
                # Build PDF content
                story = []
                
                # Title
                story.append(Paragraph("🥗 WellSync Meal Plan", title_style))
                story.append(Paragraph(f"{plan_name}", subtitle_style))
                story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#10b981')))
                story.append(Spacer(1, 20))
                
                # Metadata
                meta_text = f"""
                <b>Generated:</b> {created_at}<br/>
                <b>Diet Type:</b> {plan.get('diet_type', 'N/A')}<br/>
                <b>Calorie Goal:</b> {plan.get('calorie_goal', 'N/A')} kcal
                """
                story.append(Paragraph(meta_text, body_style))
                story.append(Spacer(1, 20))
                story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#cccccc')))
                story.append(Spacer(1, 20))
                
                # Main content - split by lines and convert markdown-ish to paragraphs
                content_lines = plan_content.split('\n')
                for line in content_lines:
                    line = line.strip()
                    if not line:
                        story.append(Spacer(1, 10))
                        continue
                    
                    # Handle headers
                    if line.startswith('###'):
                        line = line.replace('###', '').strip()
                        story.append(Paragraph(f"<b>{line}</b>", ParagraphStyle(
                            'H3', parent=body_style, fontSize=13, textColor=HexColor('#10b981'), spaceBefore=15
                        )))
                    elif line.startswith('##'):
                        line = line.replace('##', '').strip()
                        story.append(Paragraph(f"<b>{line}</b>", ParagraphStyle(
                            'H2', parent=body_style, fontSize=15, textColor=HexColor('#059669'), spaceBefore=20
                        )))
                    elif line.startswith('#'):
                        line = line.replace('#', '').strip()
                        story.append(Paragraph(f"<b>{line}</b>", ParagraphStyle(
                            'H1', parent=body_style, fontSize=18, textColor=HexColor('#047857'), spaceBefore=25
                        )))
                    elif line.startswith('**') and line.endswith('**'):
                        line = line[2:-2]
                        story.append(Paragraph(f"<b>{line}</b>", body_style))
                    elif line.startswith('- '):
                        line = line[2:]
                        story.append(Paragraph(f"• {line}", body_style))
                    else:
                        # Handle inline bold
                        line = line.replace('**', '<b>', 1).replace('**', '</b>', 1)
                        story.append(Paragraph(line, body_style))
                
                # Footer
                story.append(Spacer(1, 30))
                story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#10b981')))
                story.append(Paragraph(
                    "Generated by WellSync - Your AI-Powered Diet Companion",
                    ParagraphStyle('Footer', parent=body_style, alignment=TA_CENTER, textColor=HexColor('#888888'))
                ))
                
                doc.build(story)
                buffer.seek(0)
                
                filename = f"{plan_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
                
                return send_file(
                    buffer,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=filename
                )
                
            except ImportError:
                # Fallback if reportlab not installed
                return jsonify({"error": "PDF export requires reportlab. Install with: pip install reportlab"}), 500
        
        else:
            return jsonify({"error": "Invalid format. Use 'txt' or 'pdf'"}), 400
            
    except Exception as e:
        print(f"Export error: {e}")
        return jsonify({"error": str(e)}), 500


@diet_bp.route('/export-content', methods=['POST', 'OPTIONS'])
def export_content():
    """Export content directly without saving (for immediate export)."""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        content = data.get('content', '')
        export_format = data.get('format', 'txt')
        plan_name = data.get('plan_name', 'Meal Plan')
        diet_type = data.get('diet_type', 'Custom')
        calorie_goal = data.get('calorie_goal', 2000)
        
        if not content:
            return jsonify({"error": "No content to export"}), 400
        
        if export_format == 'txt':
            file_content = f"""{'='*60}
{plan_name}
{'='*60}
Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
Diet Type: {diet_type}
Calorie Goal: {calorie_goal} kcal
{'='*60}

{content}

{'='*60}
Generated by WellSync - Smart Diet Planner
{'='*60}
"""
            
            buffer = io.BytesIO()
            buffer.write(file_content.encode('utf-8'))
            buffer.seek(0)
            
            filename = f"{plan_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.txt"
            
            return send_file(
                buffer,
                mimetype='text/plain',
                as_attachment=True,
                download_name=filename
            )
        
        elif export_format == 'pdf':
            try:
                from reportlab.lib.pagesizes import A4
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
                from reportlab.lib.colors import HexColor
                from reportlab.lib.enums import TA_CENTER
                
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(
                    buffer, 
                    pagesize=A4,
                    rightMargin=0.75*inch,
                    leftMargin=0.75*inch,
                    topMargin=0.75*inch,
                    bottomMargin=0.75*inch
                )
                
                styles = getSampleStyleSheet()
                
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=24,
                    textColor=HexColor('#10b981'),
                    alignment=TA_CENTER,
                    spaceAfter=20
                )
                
                body_style = ParagraphStyle(
                    'CustomBody',
                    parent=styles['Normal'],
                    fontSize=11,
                    leading=16,
                    spaceAfter=12
                )
                
                story = []
                story.append(Paragraph("🥗 WellSync Meal Plan", title_style))
                story.append(Paragraph(f"{plan_name}", ParagraphStyle(
                    'Sub', parent=body_style, alignment=TA_CENTER, fontSize=14, spaceAfter=20
                )))
                story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#10b981')))
                story.append(Spacer(1, 20))
                
                # Content
                for line in content.split('\n'):
                    line = line.strip()
                    if not line:
                        story.append(Spacer(1, 8))
                        continue
                    
                    if line.startswith('###'):
                        line = line.replace('###', '').strip()
                        story.append(Paragraph(f"<b>{line}</b>", ParagraphStyle(
                            'H3', parent=body_style, fontSize=13, textColor=HexColor('#10b981'), spaceBefore=12
                        )))
                    elif line.startswith('##'):
                        line = line.replace('##', '').strip()
                        story.append(Paragraph(f"<b>{line}</b>", ParagraphStyle(
                            'H2', parent=body_style, fontSize=15, textColor=HexColor('#059669'), spaceBefore=15
                        )))
                    elif line.startswith('- '):
                        story.append(Paragraph(f"• {line[2:]}", body_style))
                    else:
                        line = line.replace('**', '<b>', 1).replace('**', '</b>', 1)
                        story.append(Paragraph(line, body_style))
                
                story.append(Spacer(1, 30))
                story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#10b981')))
                story.append(Paragraph(
                    "Generated by WellSync - Your AI-Powered Diet Companion",
                    ParagraphStyle('Footer', parent=body_style, alignment=TA_CENTER, textColor=HexColor('#888888'))
                ))
                
                doc.build(story)
                buffer.seek(0)
                
                filename = f"{plan_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
                
                return send_file(
                    buffer,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=filename
                )
                
            except ImportError:
                return jsonify({"error": "PDF export requires reportlab. Install with: pip install reportlab"}), 500
        
        return jsonify({"error": "Invalid format"}), 400
        
    except Exception as e:
        print(f"Export content error: {e}")
        return jsonify({"error": str(e)}), 500
