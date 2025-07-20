import os
import requests
import speech_recognition as sr
import pyttsx3
from langchain.chains import ConversationalRetrievalChain
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain_community.document_loaders import TextLoader
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
import json
from pathlib import Path


load_dotenv()

def create_conversational_chain(vector_store):
    llm = ChatGroq(
        model_name="Llama3-8b-8192",
        groq_api_key=os.getenv("groq_api_key"),
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()],
        temperature=0.01,
        top_p=1,
    )    
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        chain_type='stuff',
        retriever=vector_store.as_retriever(search_kwargs={"k": 2}),
        memory=memory,
    )
    return chain
BASE_DIR = Path(__file__).resolve().parent
def bot(user_input):
    loader = TextLoader(os.path.join(BASE_DIR, "book", "output.txt"))
    text = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000,chunk_overlap=200)
    text_chunks = text_splitter.split_documents(text)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2", 
        model_kwargs={'device': 'cpu'}
    )
    vector_store = FAISS.from_documents(text_chunks, embedding=embeddings)
    chain = create_conversational_chain(vector_store)
    result = chain.invoke({"question": user_input})
    return result

def TextToAudio(st):
    text_to_speech = pyttsx3.init()    
    text_to_speech.say(st)
    text_to_speech.runAndWait()
def AudioToText():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Say something!")
        audio = r.listen(source)
    try:
        st = r.recognize_google(audio)
        print("Google Speech Recognition thinks you said : " + st)
        return str(st)
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
    except sr.RequestError as e:
        print("Could not request results from Google Speech Recognition service; {0}".format(e))


import google.generativeai as genai


genai.configure(api_key=os.getenv("Google_API_Key"))

generation_config = {
    "temperature": 0.4,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 4096,
}

gemini_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

prompt_template = PromptTemplate(
    input_variables=["questions", "answers"],
    template=(
        "You are a psychologist analyzing responses to a mental health quiz. "
        "Based on the following questions and answers, provide a brief summary "
        "of the person's mental state:\n\n"
        "Questions:\n{questions}\n\n"
        "Answers:\n{answers}\n\n"
        "Summary of mental state:"
    )
)

def analyze_questions(questions, answers):
    formatted_questions = "\n".join([f"{i+1}. {q}" for i, q in enumerate(questions)])
    formatted_answers = "\n".join([f"{i+1}. {a}" for i, a in enumerate(answers)])
    prompt = prompt_template.format(questions=formatted_questions, answers=formatted_answers)
    result = gemini_model.generate_content(prompt)
    return result.text

emotion_to_genre = {
    "happy": [35, 16, 10402, 10751],  # Comedy, Animation, Musical, Family
    "sad": [18, 10749, 10402],  # Drama, Romance, Music
    "angry": [28, 53, 10752, 80],  # Action, Thriller, War, Crime
    "fearful": [27, 9648, 53, 878],  # Horror, Mystery, Thriller, Sci-Fi
    "surprised": [12, 878, 14, 9648],  # Adventure, Sci-Fi, Fantasy, Mystery
    "disgusted": [80, 53, 27, 10752],  # Crime, Thriller, Horror, War
    "neutral": [99, 36, 10770, 18]  # Documentary, History, TV Movie, Drama
}
genre_to_id = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
}

BASE_URL = os.getenv("BASE_URL")
IMAGE_BASE_URL = os.getenv("IMAGE_BASE_URL")
MOVIE_URL = os.getenv("MOVIE_URL")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

def is_content_suitable(title, description):
    blacklist = ["porn", "pornhub", "sex", "nude", "erotic", "xxx", "strip", "adult"]
    combined = (title or "") + " " + (description or "")
    return not any(word in combined.lower() for word in blacklist)

def generate_suggestions(mood):
    genre_ids = emotion_to_genre.get(mood, [])
    movies_by_genre = {}

    for genre_id in genre_ids:
        genre_name = genre_to_id.get(genre_id, "Unknown Genre")
        url = (
            f"{BASE_URL}/discover/movie?api_key={TMDB_API_KEY}"
            f"&with_genres={genre_id}&include_adult=false"
            f"&certification_country=US&certification.lte=PG-13"
        )
        print(url)

        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            print(str(e))
            return {"error_message": str(e)}

        movies = [
            {
                "title": movie.get("title"),
                "description": movie.get("overview"),
                "release_date": movie.get("release_date"),
                "image": IMAGE_BASE_URL + movie["poster_path"] if movie.get("poster_path") else None,
                "movie_link": f"{MOVIE_URL}{movie['id']}"
            }
            for movie in data.get("results", [])
            if is_content_suitable(movie.get("title"), movie.get("overview"))
        ]

        if movies:
            movies_by_genre[genre_name] = movies
            print('got movies')
        print('Exit gen_sug')
    return movies_by_genre
