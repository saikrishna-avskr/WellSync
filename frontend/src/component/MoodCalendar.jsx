import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchMoodEntries,
  fetchQuizResults,
  saveMoodEntry,
} from "../utils/profileApi";

const moods = [
  { emoji: "😀", label: "Happy" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😴", label: "Tired" },
];

const FALLBACK_QUIZ_TEXT = "Thank you for completing the quiz!";

const buildQuizHoverText = (entry) => {
  const summary = (entry?.result_summary || "").trim();
  if (summary && summary !== FALLBACK_QUIZ_TEXT) {
    return summary;
  }

  const qa = Array.isArray(entry?.questions_answers)
    ? entry.questions_answers
    : [];
  if (!qa.length) {
    return "Quiz completed for this day.";
  }

  const condensed = qa
    .slice(0, 2)
    .map((item) => {
      const question = String(item?.question || "").trim();
      const answer = String(item?.answer || "").trim();
      if (!question || !answer) return "";
      return `${question} — ${answer}`;
    })
    .filter(Boolean)
    .join(" | ");

  return condensed || "Quiz completed for this day.";
};

function MoodCalendar({ userEmail }) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [moodData, setMoodData] = useState({});
  const [selectedDay, setSelectedDay] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizSummaryByDate, setQuizSummaryByDate] = useState({});

  const startOfMonth = currentDate.startOf("month").day();
  const daysInMonth = currentDate.daysInMonth();
  const totalCells = Math.ceil((startOfMonth + daysInMonth) / 7) * 7;
  const monthKey = currentDate.format("YYYY-MM");

  useEffect(() => {
    if (!userEmail) return;

    const loadMoods = async () => {
      setLoading(true);
      try {
        const [moodResponse, quizResponse] = await Promise.all([
          fetchMoodEntries(userEmail, monthKey),
          fetchQuizResults(userEmail, { month: monthKey }),
        ]);

        const moodMap = {};
        (moodResponse.moods || []).forEach((entry) => {
          const key = String(entry.entry_date).slice(0, 10);
          moodMap[key] = entry.mood_emoji;
        });

        const quizMap = {};
        (quizResponse.results || []).forEach((entry) => {
          const key = String(entry.entry_date).slice(0, 10);
          quizMap[key] = buildQuizHoverText(entry);
        });

        setMoodData(moodMap);
        setQuizSummaryByDate(quizMap);
      } catch (error) {
        console.error("Failed to load mood or quiz entries", error);
      } finally {
        setLoading(false);
      }
    };

    loadMoods();
  }, [monthKey, userEmail]);

  const handleMoodChange = async (day, mood) => {
    const previousMood = moodData[day];
    setMoodData((prev) => ({ ...prev, [day]: mood.emoji }));
    setIsModalOpen(false);

    if (!userEmail) return;

    try {
      await saveMoodEntry(userEmail, {
        entry_date: day,
        mood_emoji: mood.emoji,
        mood_label: mood.label,
      });
    } catch (error) {
      console.error("Failed to save mood entry", error);
      setMoodData((prev) => ({ ...prev, [day]: previousMood || "" }));
      alert("Failed to save mood. Please try again.");
    }
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const day = i - startOfMonth + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const dayKey = isCurrentMonth
        ? currentDate.date(day).format("YYYY-MM-DD")
        : "";

      days.push(
        <div
          key={i}
          className={`relative group border h-20 flex flex-col justify-center items-center cursor-pointer ${
            isCurrentMonth ? "bg-white" : "bg-gray-100"
          }`}
          onClick={() => {
            if (!isCurrentMonth) return;
            setSelectedDay(dayKey);
            setIsModalOpen(true);
          }}
        >
          {isCurrentMonth && (
            <>
              <div>{day}</div>
              <div className="text-2xl">
                {moodData[dayKey] || <span>&nbsp;</span>}
              </div>

              {quizSummaryByDate[dayKey] && (
                <div className="pointer-events-auto absolute left-1/2 top-0 z-20 hidden w-80 max-w-[90vw] -translate-x-1/2 -translate-y-[105%] rounded-md bg-black px-3 py-2 text-left text-xs text-white shadow-lg group-hover:block">
                  <p className="font-semibold">Quiz Result</p>
                  <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words pr-1">
                    {quizSummaryByDate[dayKey]}
                  </p>
                </div>
              )}
            </>
          )}
        </div>,
      );
    }
    return days;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Previous
        </button>
        <h2 className="text-2xl font-bold">
          {currentDate.format("MMMM YYYY")}
        </h2>
        <button
          onClick={() => setCurrentDate(currentDate.add(1, "month"))}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Next
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mb-2">Loading moods...</p>
      )}

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-bold">
            {day}
          </div>
        ))}
        {renderDays()}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">Select Your Mood</h2>
              <div className="grid grid-cols-5 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => handleMoodChange(selectedDay, mood)}
                    className="text-3xl"
                    aria-label={mood.label}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MoodCalendar;
