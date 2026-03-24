from flask import Flask,jsonify,request,redirect
from flask_cors import CORS, cross_origin
from helper import *
import time

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://13.71.95.26:5173", "https://wellsync.avsaikrishna.com"])

# Register Diet Blueprint
from diet_routes import diet_bp
app.register_blueprint(diet_bp)

# Register Yoga Blueprint
from yoga_routes import yoga_bp
app.register_blueprint(yoga_bp)

@app.route('/')
def home():
    return redirect("https://wellsync.avsaikrishna.com", code=302)

@app.route('/voice')
# @cross_origin()
def voice():
    st = AudioToText()
    result = bot(st)
    print(result.get('answer'))
    TextToAudio(result.get('answer'))   
    return jsonify({'st':result.get('answer')})

@app.route('/predict',methods=['GET', 'POST'])
# @cross_origin()
def predict():
    try:
        chat = request.get_json()
        session_id = chat.get('session_id', str(uuid.uuid4()))
        message = chat.get('data')
        
        # Get user email from Clerk token (primary identifier)
        user_email = get_email_from_clerk_request(request)
        
        # Fallback to user_id from request body if no auth token
        if not user_email:
            user_email = chat.get('user_id', 'anonymous')
        
        # Use the bot_with_history function that stores conversations in Pinecone
        if user_email and user_email != 'anonymous':
            result = bot_with_history(message, user_email, session_id)
        else:
            # Fallback for anonymous users - just use the regular bot
            result = bot(message)
            # Still try to log to Pinecone
            try:
                meta = {"source": "predict", "created": int(time.time())}
                upsert_chat_to_pinecone(message, metadata=meta)
            except Exception as _:
                pass
        
        return jsonify({
            "data": result.get('answer'),
            "session_id": session_id,
            "user_email": user_email
        })
    except Exception as e:
        return jsonify({"error": str(e)})


# ============ Conversation History Endpoints ============

@app.route('/conversations/history', methods=['POST'])
def get_history():
    """Get conversation history for a user/session."""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        limit = data.get('limit', 20)
        
        # Get user email from Clerk token
        user_email = get_email_from_clerk_request(request)
        
        # Fallback to user_id from request body if no auth token
        if not user_email:
            user_email = data.get('user_id')
        
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401
        
        history = get_conversation_history(user_email, session_id, limit)
        return jsonify({"history": history})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/conversations/sessions', methods=['POST'])
def get_sessions():
    """Get list of sessions for a user."""
    try:
        data = request.get_json()
        limit = data.get('limit', 10)
        
        # Get user email from Clerk token
        user_email = get_email_from_clerk_request(request)
        
        # Fallback to user_id from request body if no auth token
        if not user_email:
            user_email = data.get('user_id')
        
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401
        
        sessions = get_user_sessions(user_email, limit)
        return jsonify({"sessions": sessions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/conversations/delete', methods=['POST'])
def delete_conversation():
    """Delete a conversation session."""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        # Get user email from Clerk token
        user_email = get_email_from_clerk_request(request)
        
        # Fallback to user_id from request body if no auth token
        if not user_email:
            user_email = data.get('user_id')
        
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401
        
        if not session_id:
            return jsonify({"error": "session_id is required"}), 400
        
        success = delete_session(user_email, session_id)
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/conversations/context', methods=['POST'])
def get_context():
    """Get relevant context from past conversations for a query."""
    try:
        data = request.get_json()
        query = data.get('query')
        limit = data.get('limit', 5)
        
        # Get user email from Clerk token
        user_email = get_email_from_clerk_request(request)
        
        # Fallback to user_id from request body if no auth token
        if not user_email:
            user_email = data.get('user_id')
        
        if not user_email:
            return jsonify({"error": "Authentication required"}), 401
        
        if not query:
            return jsonify({"error": "query is required"}), 400
        
        context = get_relevant_context(user_email, query, limit)
        return jsonify({"context": context})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/analyze', methods=['POST'])
# @cross_origin()
def analyze():
    try:
        data = request.get_json()
        questionsAndAnswers = data.get("questionsAndAnswers")
        questions = [qa.get("question") for qa in questionsAndAnswers]
        answers = [qa.get("answer") for qa in questionsAndAnswers]
        # print(questions, answers)
        summary = analyze_questions(questions, answers)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/suggest', methods=['POST'])
# @cross_origin()
def suggest():
    try:
        data = request.get_json()
        mood = data.get("mood")
        age = data.get("age")
        
        if not mood or not age:
            return jsonify({"error": "Mood and age are required"}), 400
        suggestions = generate_suggestions(mood)

        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/pinecone_test', methods=['POST'])
def pinecone_test():
    """Test endpoint to check Pinecone connection status."""
    try:
        index = get_pinecone_index()
        if index is None:
            return jsonify({"status": "not_configured", "message": "Pinecone is not configured"}), 200
        
        # Try to get index stats
        stats = index.describe_index_stats()
        return jsonify({
            "status": "connected",
            "index_name": PINECONE_INDEX,
            "total_vectors": stats.total_vector_count,
            "dimensions": stats.dimension
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)

