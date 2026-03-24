import React, { useState, useEffect } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FALLBACK_QUIZ_TEXT = "Thank you for completing the quiz!";

const buildSummaryFromResponses = (responses = []) => {
  const lines = responses
    .slice(0, 3)
    .map((item) => {
      const question = String(item?.question || "").trim();
      const answer = String(item?.answer || "").trim();
      if (!question || !answer) return "";
      return `${question}: ${answer}`;
    })
    .filter(Boolean);

  if (!lines.length) return "Quiz completed for today.";
  return `Quiz completed. Key responses: ${lines.join(" | ")}`;
};

const QuizModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [randomQuestions, setRandomQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState("");

  const allQuestions = [
    {
      question: "How often do you feel stressed?",
      options: ["Rarely", "Sometimes", "Often", "Always"],
    },
    {
      question: "How well do you sleep at night?",
      options: ["Very well", "Moderately well", "Not well", "Barely sleep"],
    },
    {
      question: "How often do you exercise?",
      options: ["Daily", "Weekly", "Occasionally", "Never"],
    },
    {
      question: "Do you feel supported by friends or family?",
      options: ["Always", "Often", "Rarely", "Never"],
    },
    {
      question: "Do you have difficulty concentrating?",
      options: ["Never", "Rarely", "Sometimes", "Often"],
    },
    {
      question: "How often do you feel overwhelmed?",
      options: ["Never", "Rarely", "Sometimes", "Often"],
    },
    {
      question: "How do you rate your overall happiness?",
      options: ["Very high", "Moderate", "Low", "Very low"],
    },
    {
      question: "Do you feel anxious in social settings?",
      options: ["Never", "Rarely", "Sometimes", "Often"],
    },
    {
      question: "How satisfied are you with your work-life balance?",
      options: [
        "Very satisfied",
        "Moderately satisfied",
        "Unsatisfied",
        "Very unsatisfied",
      ],
    },
    {
      question: "Do you find time to pursue hobbies or interests?",
      options: ["Always", "Often", "Rarely", "Never"],
    },
  ];

  // Randomize questions and pick 5 when opened
  useEffect(() => {
    if (!isOpen) return;
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
    setRandomQuestions(shuffledQuestions.slice(0, 5));
    setCurrentQuestionIndex(0);
    setResponses([]);
    setResult("");
  }, [isOpen]);

  const handleAnswerClick = (answer) => {
    const newResponses = [...responses];
    newResponses[currentQuestionIndex] = {
      question: randomQuestions[currentQuestionIndex].question,
      answer: answer,
    };
    setResponses(newResponses);

    if (currentQuestionIndex + 1 < randomQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz(newResponses);
    }
  };

  const handleSubmitQuiz = async (responses) => {
    const payload = { questionsAndAnswers: responses };
    console.log("Submitting quiz with payload:", payload);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to fetch results.");

      const data = await response.json();
      const apiSummary = String(data?.summary || "").trim();
      const summary =
        apiSummary && apiSummary !== FALLBACK_QUIZ_TEXT
          ? apiSummary
          : buildSummaryFromResponses(responses);
      setResult(summary);

      if (onSubmit) {
        await onSubmit({
          summary,
          questionsAndAnswers: responses,
        });
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setResult("An error occurred. Please try again later.");
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white w-11/12 max-w-lg p-8 rounded-lg shadow-lg">
          {result ? (
            <div>
              <h3 className="text-2xl font-bold mb-4 text-center">
                Quiz Results
              </h3>
              <p className="text-gray-700 text-center mb-6">{result}</p>
              <button
                onClick={onClose}
                className="block mx-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold mb-6">
                {randomQuestions[currentQuestionIndex]?.question}
              </h3>
              <div className="flex flex-col gap-4">
                {randomQuestions[currentQuestionIndex]?.options.map(
                  (option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerClick(option)}
                      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
                    >
                      {option}
                    </button>
                  ),
                )}
              </div>
              <div className="text-gray-600 text-sm mt-4 text-right">
                Question {currentQuestionIndex + 1} of {randomQuestions.length}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default QuizModal;
