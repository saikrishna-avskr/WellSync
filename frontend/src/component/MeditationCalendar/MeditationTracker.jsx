import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import WeekGrid from "./WeekGrid";
import SessionTab from "./SessionTab";
import Modal from "./Modal";
import {
  fetchMeditationEntries,
  saveMeditationEntry,
} from "../../utils/profileApi";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildWeekData = (baseDate = dayjs()) => {
  const weekStart = baseDate.startOf("week");
  const data = DAY_LABELS.map((day, index) => ({
    day,
    entryDate: weekStart.add(index, "day").format("YYYY-MM-DD"),
    duration: null,
    type: "",
    mood: "",
    notes: "",
  }));

  return {
    weekStart,
    weekEnd: weekStart.add(6, "day"),
    data,
  };
};

const meditationTypes = [
  "Mindfulness",
  "Loving-kindness",
  "Transcendental",
  "Zen",
  "Vipassana",
  "Yoga",
  "Other",
];
const moodOptions = [
  "Calm",
  "Relaxed",
  "Energized",
  "Focused",
  "Sleepy",
  "Anxious",
  "Neutral",
];

export default function MeditationTracker({ userEmail }) {
  const initialWeek = useMemo(() => buildWeekData(), []);
  const [weekData, setWeekData] = useState(initialWeek.data);
  const [weekStart, setWeekStart] = useState(initialWeek.weekStart);
  const [weekEnd, setWeekEnd] = useState(initialWeek.weekEnd);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    duration: "",
    type: "",
    mood: "",
    notes: "",
  });
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);

  const upsertLocalEntry = (entryDate, data) => {
    setWeekData((prevData) =>
      prevData.map((item) =>
        item.entryDate === entryDate
          ? {
              ...item,
              ...data,
            }
          : item,
      ),
    );
  };

  useEffect(() => {
    if (!userEmail) return;

    const loadWeekEntries = async () => {
      setLoading(true);
      try {
        const response = await fetchMeditationEntries(
          userEmail,
          weekStart.format("YYYY-MM-DD"),
          weekEnd.format("YYYY-MM-DD"),
        );

        const entriesMap = {};
        (response.entries || []).forEach((entry) => {
          const key = String(entry.entry_date).slice(0, 10);
          entriesMap[key] = entry;
        });

        const merged = DAY_LABELS.map((day, index) => {
          const entryDate = weekStart.add(index, "day").format("YYYY-MM-DD");
          const saved = entriesMap[entryDate];
          return {
            day,
            entryDate,
            duration:
              saved && saved.duration_minutes !== null
                ? Number(saved.duration_minutes)
                : null,
            type: saved?.meditation_type || "",
            mood: saved?.post_mood || "",
            notes: saved?.notes || "",
          };
        });

        setWeekData(merged);
      } catch (error) {
        console.error("Failed to load meditation entries", error);
      } finally {
        setLoading(false);
      }
    };

    loadWeekEntries();
  }, [userEmail, weekStart, weekEnd]);

  const openModal = (dayIndex) => {
    setSelectedDay(dayIndex);
    setFormData({
      duration: weekData[dayIndex].duration || "",
      type: weekData[dayIndex].type || "",
      mood: weekData[dayIndex].mood || "",
      notes: weekData[dayIndex].notes || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDay(null);
    setIsModalOpen(false);
  };

  const saveData = () => {
    if (selectedDay === null) return;

    const target = weekData[selectedDay];
    const payload = {
      duration: Number(formData.duration || 0),
      type: formData.type,
      mood: formData.mood,
      notes: formData.notes,
    };

    upsertLocalEntry(target.entryDate, payload);

    if (userEmail) {
      saveMeditationEntry(userEmail, {
        entry_date: target.entryDate,
        duration_minutes: payload.duration,
        meditation_type: payload.type,
        post_mood: payload.mood,
        notes: payload.notes,
      }).catch((error) => {
        console.error("Failed to save meditation entry", error);
        alert("Failed to save meditation entry. Please try again.");
      });
    }

    closeModal();
  };

  const handleRecordSession = async (sessionData) => {
    const target = weekData.find((item) => item.day === sessionData.day);
    if (!target) return;

    const payload = {
      duration: Number(sessionData.duration || 0),
      type: sessionData.type,
      mood: sessionData.mood,
      notes: sessionData.notes,
    };

    upsertLocalEntry(target.entryDate, payload);

    if (!userEmail) return;

    try {
      await saveMeditationEntry(userEmail, {
        entry_date: target.entryDate,
        duration_minutes: payload.duration,
        meditation_type: payload.type,
        post_mood: payload.mood,
        notes: payload.notes,
      });
    } catch (error) {
      console.error("Failed to save meditation entry", error);
      alert("Failed to save meditation entry. Please try again.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Meditation Tracker
      </h1>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Week: {weekStart.format("MMM D")} - {weekEnd.format("MMM D, YYYY")}
      </p>

      {loading && (
        <p className="text-sm text-gray-500 mb-3 text-center">
          Loading saved meditation sessions...
        </p>
      )}

      <div className="mb-6">
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          <button
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === "calendar"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("calendar")}
          >
            Weekly Calendar
          </button>
          <button
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === "session"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("session")}
          >
            Record Session
          </button>
        </div>
      </div>

      {activeTab === "calendar" ? (
        <WeekGrid weekData={weekData} openModal={openModal} />
      ) : (
        <SessionTab
          setWeekData={setWeekData}
          onRecordSession={handleRecordSession}
          meditationTypes={meditationTypes}
          moodOptions={moodOptions}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveData}
        formData={formData}
        setFormData={setFormData}
        selectedDay={selectedDay !== null ? weekData[selectedDay].day : ""}
        meditationTypes={meditationTypes}
        moodOptions={moodOptions}
      />
    </div>
  );
}
