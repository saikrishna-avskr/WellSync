import React, { useState, useRef, useEffect } from "react";
import {
  HiOutlinePaperClip,
  HiOutlineGlobeAlt,
  HiOutlineMicrophone,
} from "react-icons/hi2";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { FiPlus, FiTrash2, FiMessageSquare } from "react-icons/fi";
import Header from "../component/Chatbot/ui/Header";
import MessageActions from "../component/Chatbot/ui/MessageActions";
import BotMessage from "../component/Chatbot/BotMessage";
import UserMessage from "../component/Chatbot/UserMessage";
import TextInput from "../component/Chatbot/TextInput";
import VoiceInput from "../component/Chatbot/VoiceInput";
import QuizModal from "../component/Chatbot/QuizModal";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import Dictaphone from "../Dictaphone";

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Get or create user ID from localStorage
const getUserId = () => {
  let userId = localStorage.getItem("wellsync_user_id");
  if (!userId) {
    userId = `user_${generateId()}`;
    localStorage.setItem("wellsync_user_id", userId);
  }
  return userId;
};

const Chat = () => {
  const [isVoiceActivated, setVoiceActivated] = useState(false);
  const [isQuizModalOpen, setQuizModalOpen] = useState(false);
  const [showQuizButton, setShowQuizButton] = useState(true);
  const [chatHistory, setChatHistory] = useState([
    {
      type: "bot",
      message:
        "Hey there! 👋 Welcome to WellSync. I'm here to listen, support, and chat with you — no judgments, just good vibes. What's on your mind today?",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId] = useState(getUserId);
  const [sessionId, setSessionId] = useState(() => `session_${generateId()}`);
  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Load user sessions on mount
  useEffect(() => {
    loadUserSessions();
  }, [userId]);

  const loadUserSessions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/conversations/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, limit: 10 }),
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadSessionHistory = async (targetSessionId) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/conversations/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          session_id: targetSessionId,
          limit: 50,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const history = data.history || [];
        if (history.length > 0) {
          setChatHistory(
            history.map((msg) => ({
              type: msg.role === "user" ? "user" : "bot",
              message: msg.message,
              timestamp: msg.timestamp,
            }))
          );
        } else {
          setChatHistory([
            {
              type: "bot",
              message:
                "Hey there! 👋 Welcome to WellSync. I'm here to listen, support, and chat with you — no judgments, just good vibes. What's on your mind today?",
            },
          ]);
        }
        setSessionId(targetSessionId);
      }
    } catch (error) {
      console.error("Failed to load session history:", error);
    } finally {
      setIsLoadingHistory(false);
      setShowSidebar(false);
    }
  };

  const startNewSession = () => {
    const newSessionId = `session_${generateId()}`;
    setSessionId(newSessionId);
    setChatHistory([
      {
        type: "bot",
        message:
          "Hey there! 👋 Welcome to WellSync. I'm here to listen, support, and chat with you — no judgments, just good vibes. What's on your mind today?",
      },
    ]);
    setShowQuizButton(true);
    setShowSidebar(false);
  };

  const deleteSession = async (targetSessionId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${BACKEND_URL}/conversations/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, session_id: targetSessionId }),
      });
      if (response.ok) {
        setSessions((prev) =>
          prev.filter((s) => s.session_id !== targetSessionId)
        );
        if (targetSessionId === sessionId) {
          startNewSession();
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleMessageAdd = async (type, message) => {
    setChatHistory((prevHistory) => [...prevHistory, { type, message }]);

    if (type === "user") {
      setIsGenerating(true);
      try {
        const response = await fetch(`${BACKEND_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: message,
            user_id: userId,
            session_id: sessionId,
          }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { type: "bot", message: data.data },
        ]);

        // Refresh sessions list after new message
        loadUserSessions();
      } catch (error) {
        console.error("Error:", error);
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { type: "bot", message: "Oops! Something went wrong." },
        ]);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleVoiceInput = (speechText) => {
    if (speechText) {
      handleMessageAdd("user", speechText);
    }
  };

  const handleQuizSubmit = (quizResponse) => {
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { type: "user", message: `Quiz Response: ${quizResponse}` },
    ]);
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { type: "bot", message: "Thank you for sharing your feelings!" },
    ]);
  };

  const handleQuizButtonClick = () => {
    setQuizModalOpen(true);
    setShowQuizButton(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Message copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleLike = (index) => {
    console.log("Liked message at index:", index);
  };

  const handleDislike = (index) => {
    console.log("Disliked message at index:", index);
  };

  const handleReadAloud = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex bg-gray-50" style={{ height: `calc(100vh - 70px)` }}>
      {/* Sidebar for conversation history */}
      <div
        className={`${showSidebar ? "w-72" : "w-0"} transition-all duration-300 bg-white border-r overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition"
          >
            <FiPlus className="w-5 h-5" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <h3 className="text-sm font-semibold text-gray-500 px-2 py-2">
            Previous Conversations
          </h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400 px-2">
              No previous conversations
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => loadSessionHistory(session.session_id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 mb-1 ${
                  session.session_id === sessionId ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FiMessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm truncate">
                    {new Date(session.last_timestamp).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteSession(session.session_id, e)}
                  className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header with sidebar toggle */}
        <div className="bg-white border-b px-4 py-2 flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-sm text-gray-500">
            {isLoadingHistory ? "Loading..." : "WellSync Chat"}
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.type === "user" ? "justify-end" : "items-start gap-4"}`}
              >
                {chat.type === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${chat.type === "user" ? "" : ""} rounded-2xl px-4 py-2`}
                >
                  {chat.type === "user" ? (
                    <UserMessage message={chat.message} />
                  ) : (
                    <BotMessage message={chat.message} />
                  )}
                  {chat.type === "bot" && (
                    <MessageActions
                      onCopy={() => handleCopy(chat.message)}
                      onLike={() => handleLike(index)}
                      onDislike={() => handleDislike(index)}
                      onReadAloud={() => handleReadAloud(chat.message)}
                    />
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0">
                  AI
                </div>
                <div className="bg-white rounded-2xl px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-150" />
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-center ">
              <TextInput handleMessageAdd={handleMessageAdd} />
              <div className="absolute right-2 flex items-center gap-2">
                <button
                  onClick={() => setVoiceActivated(!isVoiceActivated)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {isVoiceActivated ? (
                    <BiSolidMicrophoneOff className="w-6 h-6 text-gray-500" />
                  ) : (
                    <BiSolidMicrophone className="w-6 h-6 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Input Overlay */}
      {isVoiceActivated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <VoiceInput handleVoiceInput={handleVoiceInput} />
              <button
                onClick={() => setVoiceActivated(false)}
                className="mt-4 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Stop Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onSubmit={handleQuizSubmit}
      />

      {/* Quiz Button */}
      {showQuizButton && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <button
            className="bg-black my-8 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            onClick={handleQuizButtonClick}
          >
            Would you like to understand your feelings better?
          </button>
        </div>
      )}
      <Dictaphone />
    </div>
  );
};

export default Chat;
