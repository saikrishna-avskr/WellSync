import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneAltSlash } from 'react-icons/fa'; // For the microphone icons

const Dictaphone = () => {
  const [isListening, setIsListening] = useState(false);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const navigate = useNavigate();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-red-500 text-white p-4 text-center">
        Browser doesn't support speech recognition.
      </div>
    );
  }

  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; // Set language to English
    window.speechSynthesis.speak(speech);
  };

  const handleNavigation = () => {
    const transcriptLower = transcript.toLowerCase();

    if (transcriptLower.includes("home")) {
      navigate("/home");
      speakText("Going to Home page");
    } else if (transcriptLower.includes("profile")) {
      navigate("/profile");
      speakText("Going to Profile page");
    } else if (transcriptLower.includes("chat")) {
      navigate("/chat");
      speakText("Going to Chat page");
    } else if (transcriptLower.includes("meditation")) {
      navigate("/ar-meditation");
      speakText("Going to Meditation page");
    } else if (transcriptLower.includes("detection")) {
      navigate("/face-detection");
      speakText("Going to Face Detection page");
    } else if (transcriptLower.includes("game")) {
      navigate("/games");
      speakText("Going to Games page");
    } else if (transcriptLower.includes("articles")) {
      navigate("/articles");
      speakText("Going to Articles page");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening();
    }
    setIsListening(!isListening);
  };

  useEffect(() => {
    if (transcript) {
      // console.log(transcript);
      handleNavigation();
    }
  }, [transcript]);

  return (
    <div>
      {/* Floating Button with Microphone Icon */}
      <div
        className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg cursor-pointer"
        onClick={toggleListening}
        onKeyUp={(e) => { if (e.key === 'Enter') toggleListening(); }}
        // tabIndex={0} // Make the div focusable
      >
        {isListening ? (
          <FaMicrophoneAltSlash size={24} />
        ) : (
          <FaMicrophone size={24} />
        )}
      </div>
    </div>
  );
};

export default Dictaphone;
