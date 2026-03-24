import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import WeekGrid from "./WeekGrid";
import Modal from "./Modal";

import SessionTab from "./SessionTab";
import {
  fetchBreathingEntries,
  saveBreathingEntry,
} from "../../utils/profileApi";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildWeekData = (baseDate = dayjs()) => {
  const weekStart = baseDate.startOf("week");
  const data = DAY_LABELS.map((day, index) => ({
    day,
    entryDate: weekStart.add(index, "day").format("YYYY-MM-DD"),
    duration: null,
    notes: "",
  }));

  return {
    weekStart,
    weekEnd: weekStart.add(6, "day"),
    data,
  };
};

function BreathingCalendar({ userEmail }) {
  const initialWeek = useMemo(() => buildWeekData(), []);
  const [weekData, setWeekData] = useState(initialWeek.data);
  const [weekStart, setWeekStart] = useState(initialWeek.weekStart);
  const [weekEnd, setWeekEnd] = useState(initialWeek.weekEnd);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ duration: "", notes: "" });
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);

  const upsertLocalEntry = (entryDate, duration, notes) => {
    setWeekData((prevData) =>
      prevData.map((item) =>
        item.entryDate === entryDate
          ? {
              ...item,
              duration,
              notes,
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
        const response = await fetchBreathingEntries(
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
            notes: saved?.notes || "",
          };
        });

        setWeekData(merged);
      } catch (error) {
        console.error("Failed to load breathing entries", error);
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
    const duration = Number(formData.duration || 0);

    upsertLocalEntry(target.entryDate, duration, formData.notes);

    if (userEmail) {
      saveBreathingEntry(userEmail, {
        entry_date: target.entryDate,
        duration_minutes: duration,
        notes: formData.notes,
      }).catch((error) => {
        console.error("Failed to save breathing entry", error);
        alert("Failed to save breathing entry. Please try again.");
      });
    }

    closeModal();
  };

  const handleRecordSession = async (sessionData) => {
    const target = weekData.find((item) => item.day === sessionData.day);
    if (!target) return;

    const duration = Number(sessionData.duration || 0);
    upsertLocalEntry(target.entryDate, duration, sessionData.notes);

    if (!userEmail) return;

    try {
      await saveBreathingEntry(userEmail, {
        entry_date: target.entryDate,
        duration_minutes: duration,
        notes: sessionData.notes,
      });
    } catch (error) {
      console.error("Failed to save breathing entry", error);
      alert("Failed to save breathing entry. Please try again.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Breathing Activity Tracker
      </h1>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Week: {weekStart.format("MMM D")} - {weekEnd.format("MMM D, YYYY")}
      </p>

      {loading && (
        <p className="text-sm text-gray-500 mb-3 text-center">
          Loading saved breathing sessions...
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
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveData}
        formData={formData}
        setFormData={setFormData}
        selectedDay={selectedDay !== null ? weekData[selectedDay].day : ""}
      />
    </div>
  );
}

export default BreathingCalendar;
