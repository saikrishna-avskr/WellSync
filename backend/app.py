from flask import Flask,jsonify,request,redirect
from flask_cors import CORS, cross_origin
from helper import *

app = Flask(__name__)
CORS(app)

sampleoutput = '''
I'm so sorry to hear that you're feeling sad today. It can be really tough to deal with those feelings. Would you like to talk about what's going on and why you're feeling sad? Sometimes sharing what's on your mind can help you feel a bit better. I'm here to listen and offer support.
'''
sampleoutput2 = '''
In the meantime, here are a few things that might help brighten your day:

* Take a few deep breaths and try to focus on the present moment. Sometimes, when we're feeling overwhelmed, it can help to take a step back and just be in the here and now.
* Do something that brings you joy, even if it's just for a few minutes. This could be reading a book, listening to music, or taking a short walk outside.
* Reach out to a friend or loved one and talk to them about how you're feeling. Sometimes, just knowing that someone is there to listen and support you can make a big difference.
'''

sampleoutput3 = '''
Hello there. I'm so sorry to hear that you're feeling down. I'd be happy to try and lift your mood with a joke. Here's one: Why couldn't the bicycle stand up by itself? (Wait for it...) Because it was two-tired! I hope that brought a small smile to your face. If you're willing to share, what's been on your mind lately and how can I help you feel better?
'''


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
    # TextToAudio(st)
    # st= "Hello, the code is working"
    # return jsonify({'st':st})

@app.route('/predict',methods=['GET', 'POST'])
# @cross_origin()
def predict():
    try:
        chat = request.get_json()
        result = bot(chat.get('data'))
        return jsonify({"data":result.get('answer')})
        # code = {"data": "Hello, the code is working"}
        code  = {"data":sampleoutput3}
        return code
        # return chat
    except Exception as e:
        return jsonify({"error":str(e)})
    

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

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)

