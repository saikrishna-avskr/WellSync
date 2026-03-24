import os
import requests
import speech_recognition as sr
import pyttsx3
import jwt
from langchain.chains import ConversationalRetrievalChain
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain_community.document_loaders import TextLoader
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_core.retrievers import BaseRetriever
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from pathlib import Path
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from google import genai
import uuid
from pinecone import Pinecone, ServerlessSpec
from datetime import datetime
import threading


BASE_DIR = Path(__file__).resolve().parent
load_dotenv()

genai_client = genai.Client()

# Pinecone configuration (optional). If not provided, code will fall back to file-based behavior.
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX_NAME", "wellsync-conversations")

# Global Pinecone client and index
_pinecone_client = None
_pinecone_index = None

def get_pinecone_client():
    """Get or create Pinecone client (singleton pattern)."""
    global _pinecone_client
    if _pinecone_client is None and PINECONE_API_KEY:
        try:
            _pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
        except Exception as e:
            print(f"Failed to initialize Pinecone client: {e}")
            return None
    return _pinecone_client

def get_pinecone_index():
    """Get or create Pinecone index for conversations."""
    global _pinecone_index
    if _pinecone_index is not None:
        return _pinecone_index
    
    client = get_pinecone_client()
    if client is None:
        return None
    
    try:
        # Check if index exists, create if not
        existing_indexes = [idx.name for idx in client.list_indexes()]
        
        if PINECONE_INDEX not in existing_indexes:
            # Create index with serverless spec (adjust region as needed)
            client.create_index(
                name=PINECONE_INDEX,
                dimension=384,  # all-MiniLM-L6-v2 dimension
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            # Wait for index to be ready
            time.sleep(5)
        
        _pinecone_index = client.Index(PINECONE_INDEX)
        return _pinecone_index
    except Exception as e:
        print(f"Failed to get/create Pinecone index: {e}")
        return None

def init_pinecone_if_needed():
    """Initialize Pinecone client if API key provided. Safe to call multiple times."""
    return get_pinecone_index()

# Empathetic system prompt for the mental health chatbot
EMPATHETIC_SYSTEM_TEMPLATE = """You are SereniFit, a warm, caring, and empathetic mental health companion. Your role is to provide emotional support and be a compassionate listener.

IMPORTANT RESTRICTIONS - YOU MUST FOLLOW THESE:
- NEVER provide medical diagnoses or suggest you know what condition someone has
- NEVER recommend, suggest, or mention any medications, drugs, or pharmaceutical treatments
- NEVER act as a doctor, psychiatrist, or medical professional
- If someone asks for medical advice, kindly explain you cannot provide that and encourage them to speak with a healthcare professional

WHAT YOU CAN DO:
- Provide general wellness tips, self-care suggestions, and coping strategies
- Offer practical advice on stress management, sleep hygiene, relaxation techniques, and healthy habits
- Share tips on mindfulness, breathing exercises, journaling, and emotional regulation
- Give suggestions for daily routines, productivity, hobbies, and lifestyle improvements
- Help with goal-setting, motivation, and personal growth
- Provide information and tips on any non-medical topics the user asks about
- You ARE encouraged to give helpful suggestions, tips, and solutions - just not medical ones

Guidelines for your responses:
- Always respond with warmth, empathy, and genuine care
- Use a gentle, supportive, and non-judgmental tone
- NEVER assume the user's emotional state
- Do NOT assume the user is happy, smiling, or in a good mood just from a simple greeting like "hi"
- Acknowledge and validate the user's feelings ONLY after they share them
- For clear task-based requests (math, coding, writing, study help, factual questions), answer directly and practically first
- Do NOT force emotional check-in questions for task-based requests unless the user signals emotional distress
- Use phrases like "I hear you", "That sounds really difficult", "It's completely understandable to feel that way" - but only after they share their feelings
- Offer encouragement and hope without being dismissive of their struggles
- If they share something difficult, express that you're there for them
- Keep responses conversational and human-like, not clinical or robotic
- Use the context provided to give relevant, personalized responses
- You're a supportive friend who listens - not a therapist or doctor

When users indicate they want to end or pause the conversation:
- If the user says things like "thanks", "thank you", "I'm good", "no I'm good", "bye", "see you", or "that's all", respond with a brief, polite closing
- Do NOT reopen the conversation with extra emotional probing or new open-ended questions
- Preferred style: short closing such as "You're welcome — glad I could help. Reach out anytime."
- If the user specifically says "bye" or "see you", prefer an even shorter sign-off like "Take care 👋" or "See you — take care."

When greeting users (for simple greetings like "hi", "hello", "hey"):
- Respond warmly but neutrally: "Hello! I'm here for you. How are you feeling today?" or "Hi there! It's nice to meet you. What's on your mind?"
- Do NOT say things like "I can see you're happy" or assume any emotion
- You may invite them to share how they feel, but keep it optional and brief
- Show genuine interest in their wellbeing without making assumptions

When users ask for help solving something:
- Provide the solution first, then a short explanation of steps
- Ask a follow-up question only to clarify missing information needed to solve the task
- Example: if asked "what is 1+1" or "help me with my math", answer the math directly instead of switching to emotional probing

Use the following context to help inform your response:
{context}

Current conversation:
{chat_history}

User: {question}
SereniFit:"""

QUESTION_PROMPT_TEMPLATE = """Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question that preserves the user's actual intent.

If the user is clearly ending the conversation (for example: "thanks", "I'm good", "bye"), keep that intent as a brief closing intent and do not convert it into an emotional check-in.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:"""

def create_conversational_chain(vector_store):
    from langchain.prompts import PromptTemplate
    from langchain.chains.question_answering import load_qa_chain
    from langchain.chains import LLMChain
    
    llm = ChatGroq(
        model_name="llama-3.1-8b-instant",
        groq_api_key=os.getenv("groq_api_key"),
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()],
        temperature=0.7,  # Slightly higher for more natural, varied responses
    )
    
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    
    # Handle both BaseRetriever instances and vector stores with as_retriever method
    if isinstance(vector_store, BaseRetriever):
        retriever = vector_store
    else:
        retriever = vector_store.as_retriever(search_kwargs={"k": 2})
    
    # Create custom prompts
    condense_question_prompt = PromptTemplate.from_template(QUESTION_PROMPT_TEMPLATE)
    qa_prompt = PromptTemplate.from_template(EMPATHETIC_SYSTEM_TEMPLATE)
    
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        chain_type='stuff',
        retriever=retriever,
        memory=memory,
        condense_question_prompt=condense_question_prompt,
        combine_docs_chain_kwargs={"prompt": qa_prompt},
        verbose=False,
    )
    return chain


# ============ Pinecone Conversation Storage Functions ============

# Global embeddings instance to avoid repeated loading
_embeddings_instance = None
_embeddings_init_lock = threading.Lock()
_embeddings_call_lock = threading.Lock()

def get_embeddings():
    """Get HuggingFace embeddings model (singleton to avoid reload issues)."""
    global _embeddings_instance
    if _embeddings_instance is None:
        with _embeddings_init_lock:
            if _embeddings_instance is None:
                _embeddings_instance = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
    return _embeddings_instance

def embed_documents_safe(texts):
    """Thread-safe embedding wrapper to avoid concurrent model access issues."""
    embeddings = get_embeddings()
    with _embeddings_call_lock:
        return embeddings.embed_documents(texts)

def store_conversation_message(user_id: str, session_id: str, role: str, message: str, metadata: dict = None):
    """
    Store a single conversation message in Pinecone.
    
    Args:
        user_id: Unique identifier for the user (email)
        session_id: Unique identifier for the chat session
        role: 'user' or 'bot'
        message: The message content
        metadata: Optional additional metadata
    
    Returns:
        dict with message id or None on failure
    """
    index = get_pinecone_index()
    if index is None:
        print("Pinecone not configured; skipping message storage")
        return None
    
    try:
        vec = embed_documents_safe([message])[0]
        
        message_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Generate a title from the first user message (truncate to 50 chars)
        title = ""
        if role == "user":
            title = message[:50] + "..." if len(message) > 50 else message
        
        meta = {
            "user_id": user_id,
            "session_id": session_id,
            "role": role,
            "message": message,
            "timestamp": timestamp,
            "type": "conversation",
            "title": title  # Store title for session display
        }
        if metadata:
            meta.update(metadata)
        
        index.upsert(vectors=[(message_id, vec, meta)])
        return {"id": message_id, "timestamp": timestamp}
    except Exception as e:
        print(f"Failed to store conversation message: {e}")
        return None

def get_conversation_history(user_id: str, session_id: str = None, limit: int = 20):
    """
    Retrieve conversation history for a user from Pinecone.
    
    Args:
        user_id: Unique identifier for the user
        session_id: Optional session ID to filter by specific session
        limit: Maximum number of messages to return
    
    Returns:
        List of conversation messages sorted by timestamp
    """
    index = get_pinecone_index()
    if index is None:
        return []
    
    try:
        # Create a dummy query vector to fetch by metadata filter
        dummy_vec = embed_documents_safe(["conversation history"])[0]
        
        # Build filter
        filter_dict = {
            "user_id": {"$eq": user_id},
            "type": {"$eq": "conversation"}
        }
        if session_id:
            filter_dict["session_id"] = {"$eq": session_id}
        
        results = index.query(
            vector=dummy_vec,
            top_k=limit,
            include_metadata=True,
            filter=filter_dict
        )
        
        # Extract and sort messages by timestamp
        messages = []
        for match in results.matches:
            if match.metadata:
                messages.append({
                    "id": match.id,
                    "role": match.metadata.get("role"),
                    "message": match.metadata.get("message"),
                    "timestamp": match.metadata.get("timestamp"),
                    "session_id": match.metadata.get("session_id")
                })
        
        # Sort by timestamp
        messages.sort(key=lambda x: x.get("timestamp", ""))
        return messages
    except Exception as e:
        print(f"Failed to retrieve conversation history: {e}")
        return []

def get_user_sessions(user_id: str, limit: int = 10):
    """
    Get list of unique session IDs for a user.
    
    Args:
        user_id: Unique identifier for the user (email)
        limit: Maximum number of sessions to return
    
    Returns:
        List of session info dicts with session_id, title, and last_timestamp
    """
    index = get_pinecone_index()
    if index is None:
        return []
    
    try:
        dummy_vec = embed_documents_safe(["user sessions"])[0]

        results = index.query(
            vector=dummy_vec,
            top_k=100,  # Fetch more to find unique sessions
            include_metadata=True,
            filter={
                "user_id": {"$eq": user_id},
                "type": {"$eq": "conversation"}
            }
        )

        
        # Group by session_id and get latest timestamp + first user message as title
        sessions = {}
        for match in results.matches:
            if match.metadata:
                sid = match.metadata.get("session_id")
                ts = match.metadata.get("timestamp", "")
                role = match.metadata.get("role", "")
                title = match.metadata.get("title", "")
                
                if sid:
                    if sid not in sessions:
                        sessions[sid] = {
                            "session_id": sid,
                            "last_timestamp": ts,
                            "title": "",
                            "first_timestamp": ts
                        }
                    
                    # Update last_timestamp if newer
                    if ts > sessions[sid]["last_timestamp"]:
                        sessions[sid]["last_timestamp"] = ts
                    
                    # Track earliest timestamp
                    if ts < sessions[sid]["first_timestamp"]:
                        sessions[sid]["first_timestamp"] = ts
                    
                    # Get title from first user message
                    if role == "user" and title and (not sessions[sid]["title"] or ts < sessions[sid]["first_timestamp"]):
                        sessions[sid]["title"] = title
        
        # Set default title if none found
        for sid in sessions:
            if not sessions[sid]["title"]:
                sessions[sid]["title"] = "New conversation"
            # Remove the helper field
            del sessions[sid]["first_timestamp"]
        
        # Sort by last_timestamp descending and limit
        session_list = sorted(sessions.values(), key=lambda x: x["last_timestamp"], reverse=True)
        return session_list[:limit]
    except Exception as e:
        print(f"Failed to get user sessions: {e}")
        return []

def delete_session(user_id: str, session_id: str):
    """
    Delete all messages in a session.
    
    Args:
        user_id: Unique identifier for the user
        session_id: Session ID to delete
    
    Returns:
        True if successful, False otherwise
    """
    index = get_pinecone_index()
    if index is None:
        return False
    
    try:
        # First get all message IDs for this session
        dummy_vec = embed_documents_safe(["delete session"])[0]
        
        results = index.query(
            vector=dummy_vec,
            top_k=1000,
            include_metadata=True,
            filter={
                "user_id": {"$eq": user_id},
                "session_id": {"$eq": session_id},
                "type": {"$eq": "conversation"}
            }
        )
        
        # Delete all matching vectors
        ids_to_delete = [match.id for match in results.matches]
        if ids_to_delete:
            index.delete(ids=ids_to_delete)
        
        return True
    except Exception as e:
        print(f"Failed to delete session: {e}")
        return False


def delete_all_user_conversations(user_id: str):
    """Delete all conversation vectors for a user from Pinecone."""
    index = get_pinecone_index()
    if index is None:
        return {
            "success": False,
            "deleted_count": 0,
            "message": "Pinecone not configured",
        }

    deleted_count = 0

    try:
        dummy_vec = embed_documents_safe(["delete all user conversations"])[0]

        while True:
            results = index.query(
                vector=dummy_vec,
                top_k=1000,
                include_metadata=True,
                filter={
                    "user_id": {"$eq": user_id},
                    "type": {"$eq": "conversation"},
                },
            )

            ids_to_delete = [match.id for match in results.matches]
            if not ids_to_delete:
                break

            index.delete(ids=ids_to_delete)
            deleted_count += len(ids_to_delete)

            if len(ids_to_delete) < 1000:
                break

        return {
            "success": True,
            "deleted_count": deleted_count,
        }
    except Exception as e:
        print(f"Failed to delete all user conversations: {e}")
        return {
            "success": False,
            "deleted_count": deleted_count,
            "message": str(e),
        }

def get_relevant_context(user_id: str, query: str, limit: int = 5):
    """
    Get relevant past conversation context for a query using semantic search.
    
    Args:
        user_id: Unique identifier for the user
        query: Current query to find relevant context for
        limit: Maximum number of relevant messages to return
    
    Returns:
        List of relevant past messages
    """
    index = get_pinecone_index()
    if index is None:
        return []
    
    try:
        query_vec = embed_documents_safe([query])[0]
        
        results = index.query(
            vector=query_vec,
            top_k=limit,
            include_metadata=True,
            filter={
                "user_id": {"$eq": user_id},
                "type": {"$eq": "conversation"}
            }
        )
        
        context_messages = []
        for match in results.matches:
            if match.metadata and match.score > 0.5:  # Only include relevant matches
                context_messages.append({
                    "role": match.metadata.get("role"),
                    "message": match.metadata.get("message"),
                    "score": match.score
                })
        
        return context_messages
    except Exception as e:
        print(f"Failed to get relevant context: {e}")
        return []


# ============ Updated Bot Function with Pinecone Conversation Storage ============

def bot_with_history(user_input: str, user_id: str, session_id: str):
    """
    Process user input with conversation history from Pinecone.
    
    Args:
        user_input: The user's message
        user_id: Unique identifier for the user
        session_id: Unique identifier for the chat session
    
    Returns:
        dict with 'answer' key containing the bot's response
    """
    # Store user message
    store_conversation_message(user_id, session_id, "user", user_input)
    
    # Get relevant past context
    context = get_relevant_context(user_id, user_input, limit=5)
    
    # Get recent conversation history for this session
    recent_history = get_conversation_history(user_id, session_id, limit=10)
    
    # Build context string from past conversations
    context_str = ""
    if context:
        context_str = "\n\nRelevant past conversations:\n"
        for msg in context:
            context_str += f"- {msg['role']}: {msg['message']}\n"
    
    # Build recent history string
    history_str = ""
    if recent_history:
        history_str = "\n\nRecent conversation:\n"
        for msg in recent_history[-6:]:  # Last 6 messages
            history_str += f"- {msg['role']}: {msg['message']}\n"
    
    # Enhanced prompt with context
    enhanced_input = user_input
    if context_str or history_str:
        enhanced_input = f"{context_str}{history_str}\n\nCurrent message: {user_input}"
    
    # Get response using the existing bot function
    result = bot(enhanced_input)
    
    # Store bot response
    bot_answer = result.get('answer', '')
    store_conversation_message(user_id, session_id, "bot", bot_answer)
    
    return result

def bot(user_input):
    # Always use the local file-based FAISS for knowledge retrieval
    # Pinecone is used separately for conversation history storage
    embeddings = get_embeddings()

    # Load knowledge base from local file and use FAISS
    loader = TextLoader(os.path.join(BASE_DIR, "book", "output.txt"))
    text = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    text_chunks = text_splitter.split_documents(text)
    vector_store = FAISS.from_documents(text_chunks, embedding=embeddings)
    chain = create_conversational_chain(vector_store)
    result = chain.invoke({"question": user_input})
    return result


def upsert_chat_to_pinecone(text, metadata=None):
    """Upsert a chat message into Pinecone with generated embedding and metadata.

    Returns the upsert response or None on failure.
    """
    pine_index = init_pinecone_if_needed()
    if pine_index is None:
        print("Pinecone not configured; skipping upsert")
        return None

    try:
        vec = embed_documents_safe([text])[0]
        uid = str(uuid.uuid4())
        meta = metadata.copy() if metadata else {}
        meta.update({"text": text})
        # Upsert single vector
        pine_index.upsert(vectors=[(uid, vec, meta)])
        return {"id": uid}
    except Exception as e:
        print(f"Failed to upsert to Pinecone: {e}")
        return None

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


generation_config = {
    "temperature": 0.4,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 4096,
}

prompt_template = PromptTemplate(
    input_variables=["questions", "answers"],
    template=(
        "You are a psychologist analyzing responses to a mental health quiz. "
        "Based on the following questions and answers, provide a brief summary "
        "of the user's mental state. Write the response in second person (use 'you' and 'your'), "
        "not third person (avoid phrases like 'this individual' or 'the person'):\n\n"
        "Questions:\n{questions}\n\n"
        "Answers:\n{answers}\n\n"
        "Summary of mental state:"
    )
)

def analyze_questions(questions, answers):
    formatted_questions = "\n".join([f"{i+1}. {q}" for i, q in enumerate(questions)])
    formatted_answers = "\n".join([f"{i+1}. {a}" for i, a in enumerate(answers)])
    prompt = prompt_template.format(questions=formatted_questions, answers=formatted_answers)
    result = genai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=generation_config,
    )
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


def create_robust_session():
    """Create a requests session with retry logic and SSL configuration"""
    session = requests.Session()
    
    # Configure retry strategy
    retry_strategy = Retry(
        total=3,  # Total number of retries
        status_forcelist=[429, 500, 502, 503, 504],  # HTTP status codes to retry on
        backoff_factor=1,  # Wait time between retries
        raise_on_status=False
    )
    
    # Mount adapter with retry strategy
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Set timeout and headers
    session.timeout = 30
    session.headers.update({
        'User-Agent': 'WellSync/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
    })
    
    return session


def make_tmdb_request(url, max_retries=5, initial_delay=1):
    """
    Enhanced API request function specifically for TMDB with better SSL handling
    and exponential backoff for rate limiting
    """
    session = create_robust_session()
    
    for attempt in range(max_retries):
        try:
            # Add a small delay between requests to avoid rate limiting
            if attempt > 0:
                delay = initial_delay * (2 ** (attempt - 1))  # Exponential backoff
                print(f"Waiting {delay} seconds before retry...")
                time.sleep(delay)
            
            print(f"Making TMDB request (attempt {attempt + 1}/{max_retries})")
            
            # Make the request with explicit SSL verification disabled as fallback
            try:
                response = session.get(url, timeout=30, verify=True)
            except requests.exceptions.SSLError:
                print("SSL verification failed, trying without verification...")
                response = session.get(url, timeout=30, verify=False)
                
            response.raise_for_status()
            
            # Check for rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 5))
                print(f"Rate limited. Waiting {retry_after} seconds...")
                time.sleep(retry_after)
                continue
                
            return response.json()
            
        except requests.exceptions.SSLError as e:
            print(f"SSL Error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                continue
            else:
                print(f"Failed after {max_retries} attempts due to SSL error")
                return None
                
        except requests.exceptions.Timeout as e:
            print(f"Timeout on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                continue
            else:
                print(f"Failed after {max_retries} attempts due to timeout")
                return None
                
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                continue
            else:
                print(f"Failed after {max_retries} attempts due to connection error")
                return None
                
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:  # Rate limiting
                retry_after = int(e.response.headers.get('Retry-After', 5))
                print(f"Rate limited (HTTP 429). Waiting {retry_after} seconds...")
                time.sleep(retry_after)
                continue
            else:
                print(f"HTTP error on attempt {attempt + 1}: {str(e)}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Request error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                continue
            else:
                print(f"Failed after {max_retries} attempts due to request error")
                return None
                
        except Exception as e:
            print(f"Unexpected error on attempt {attempt + 1}: {str(e)}")
            return None
    
    return None


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
        print(f"Fetching movies for genre: {genre_name} (ID: {genre_id})")

        # Use the robust API request function
        data = make_tmdb_request(url, max_retries=3, initial_delay=2)
        
        if data is None:
            print(f"Failed to fetch movies for genre {genre_name}, skipping...")
            continue
            
        if "results" not in data:
            print(f"No results found for genre {genre_name}")
            continue

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
            print(f'Successfully fetched {len(movies)} movies for genre: {genre_name}')
        else:
            print(f'No suitable movies found for genre: {genre_name}')
    
    print(f'Total genres with movies: {len(movies_by_genre)}')
    return movies_by_genre


def get_email_from_clerk_request(request):
    """
    Extract user email from Clerk session token in the request.
    
    Args:
        request: Flask/FastAPI request object containing the Authorization header
        
    Returns:
        str: User's email address or None if not found
    """
    try:
        # Get the session token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            print("No Authorization header found")
            return None
        
        # Remove 'Bearer ' prefix if present
        token = auth_header.replace('Bearer ', '').strip()
        
        if not token:
            print("No token found in Authorization header")
            return None
        
        # Decode the JWT token without verification to extract claims
        # Note: In production, you should verify the token with Clerk's public key
        # For now, we decode without verification to get the session data
        try:
            # Decode without verification (for development)
            # The token from Clerk contains user info in the payload
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            # Clerk stores email in different possible locations
            email = None
            
            # Check common Clerk JWT claim locations
            if 'email' in decoded:
                email = decoded['email']
            elif 'email_addresses' in decoded and decoded['email_addresses']:
                email = decoded['email_addresses'][0].get('email_address')
            elif 'primary_email_address' in decoded:
                email = decoded['primary_email_address']
            elif 'user' in decoded and isinstance(decoded['user'], dict):
                email = decoded['user'].get('email') or decoded['user'].get('primary_email_address')
            
            # If email not in token, try to fetch from Clerk API using user_id/sub
            if not email:
                user_id = decoded.get('sub') or decoded.get('user_id')
                if user_id:
                    email = get_email_from_clerk_api(user_id)
            
            return email
            
        except Exception as decode_err:
            print(f"Failed to decode JWT token: {decode_err}")
            return None
            
    except Exception as e:
        print(f"Error extracting email from request: {e}")
        return None


def get_email_from_clerk_api(user_id: str):
    """
    Fetch user email from Clerk API using user ID.
    
    Args:
        user_id: Clerk user ID (usually starts with 'user_')
        
    Returns:
        str: User's email address or None if not found
    """
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    
    if not clerk_secret_key:
        print("CLERK_SECRET_KEY not configured")
        return None
    
    try:
        url = f"https://api.clerk.com/v1/users/{user_id}"
        headers = {
            "Authorization": f"Bearer {clerk_secret_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            user_data = response.json()
            
            # Get primary email from email_addresses array
            email_addresses = user_data.get('email_addresses', [])
            primary_email_id = user_data.get('primary_email_address_id')
            
            for email_obj in email_addresses:
                if email_obj.get('id') == primary_email_id:
                    return email_obj.get('email_address')
            
            # Fallback to first email if no primary found
            if email_addresses:
                return email_addresses[0].get('email_address')
                
        else:
            print(f"Clerk API returned status {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Error fetching user from Clerk API: {e}")
    
    return None


def get_user_id_from_clerk_request(request):
    """
    Extract user ID from Clerk session token in the request.
    
    Args:
        request: Flask/FastAPI request object containing the Authorization header
        
    Returns:
        str: User's Clerk ID or None if not found
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return None
        
        token = auth_header.replace('Bearer ', '').strip()
        
        if not token:
            return None
        
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get('sub') or decoded.get('user_id')
        
    except Exception as e:
        print(f"Error extracting user ID from request: {e}")
        return None