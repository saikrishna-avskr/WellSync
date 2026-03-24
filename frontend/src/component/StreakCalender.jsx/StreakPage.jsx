import React, { useEffect, useState } from "react";
import { StreakCalendar } from "./StreakCalendar";
import {
  deleteJournal,
  fetchJournalStreak,
  fetchJournalsByDate,
} from "../../utils/profileApi";
import BlogCard from "../Blogs/BlogCard";

export function StreakPage({ userEmail }) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [daysLogged, setDaysLogged] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [journalsForDate, setJournalsForDate] = useState([]);
  const [loadingDateJournals, setLoadingDateJournals] = useState(false);

  const loadStreak = async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const response = await fetchJournalStreak(userEmail);
      const streak = response.streak || {};
      setCurrentStreak(Number(streak.current_streak || 0));
      setLongestStreak(Number(streak.longest_streak || 0));
      setTotalEntries(Number(streak.total_entries || 0));
      setDaysLogged(streak.days_logged || []);
    } catch (error) {
      console.error("Failed to load streak", error);
    } finally {
      setLoading(false);
    }
  };

  const imgUrls = [
    "https://img.freepik.com/free-vector/businessman-workplace-top-view_98292-5450.jpg",
    "https://img.freepik.com/free-vector/thesis-concept-illustration_114360-30032.jpg",
    "https://img.freepik.com/free-vector/blogging-illustration-concept_114360-851.jpg",
    "https://img.freepik.com/free-vector/letter-concept-illustration_114360-27243.jpg",
  ];

  useEffect(() => {
    if (!userEmail) return;

    loadStreak();
  }, [userEmail]);

  const streakData = {
    currentStreak,
    longestStreak,
    totalEntries,
    daysLogged,
  };

  const handleLoggedDayClick = async (dateKey) => {
    if (!userEmail) return;

    setSelectedDate(dateKey);
    setLoadingDateJournals(true);
    try {
      const response = await fetchJournalsByDate(userEmail, dateKey, 200);
      const normalized = (response.journals || []).map((journal, index) => ({
        id: journal.id,
        title: journal.title,
        content: journal.content,
        imgUrl: journal.image_url || imgUrls[index % imgUrls.length],
        entryDate: journal.entry_date,
        createdAt: journal.created_at,
      }));
      setJournalsForDate(normalized);
    } catch (error) {
      console.error("Failed to load journals for selected date", error);
      setJournalsForDate([]);
    } finally {
      setLoadingDateJournals(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  };

  const handleDelete = async (journalId) => {
    if (!userEmail || !journalId) return;
    if (!window.confirm("Delete this journal entry?")) return;

    try {
      await deleteJournal(userEmail, journalId);
      setJournalsForDate((prev) =>
        prev.filter((item) => item.id !== journalId),
      );
      await loadStreak();
    } catch (error) {
      console.error("Failed to delete journal", error);
      alert(`Failed to delete journal: ${error?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Your Journal Streak</h1>
      {loading && (
        <p className="text-sm text-gray-500">Loading streak data...</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium text-gray-600">
              Current Streak
            </h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold">{currentStreak} days</div>
          <p className="text-xs text-gray-500">
            Keep it up! You're doing great!
          </p>
          <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
            <div
              className="h-full bg-black rounded-full"
              style={{
                width: `${longestStreak > 0 ? (currentStreak / longestStreak) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium text-gray-600">
              Longest Streak
            </h2>
            <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
              {longestStreak} days
            </span>
          </div>
          <div className="text-2xl font-bold">{longestStreak} days</div>
          <p className="text-xs text-gray-500">Your personal best!</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium text-gray-600">Total Entries</h2>
            <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
              {totalEntries}
            </span>
          </div>
          <div className="text-2xl font-bold">{totalEntries}</div>
          <p className="text-xs text-gray-500">Journal entries completed</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Streak Calendar</h2>
        <p className="text-sm text-gray-600 mb-4">
          Visualize your journaling consistency (click a green date to view
          entries)
        </p>
        <StreakCalendar
          daysLogged={streakData.daysLogged}
          onLoggedDayClick={handleLoggedDayClick}
        />

        {selectedDate && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-md font-semibold text-gray-800 mb-2">
              Journals on {formatDate(selectedDate)}
            </h3>

            {loadingDateJournals && (
              <p className="text-sm text-gray-500">Loading journals...</p>
            )}

            {!loadingDateJournals && journalsForDate.length === 0 && (
              <p className="text-sm text-gray-500">
                No journals found for this date.
              </p>
            )}

            {!loadingDateJournals && journalsForDate.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {journalsForDate.map((journal) => (
                  <BlogCard
                    key={journal.id}
                    id={journal.id}
                    title={journal.title}
                    content={journal.content}
                    imgUrl={journal.imgUrl}
                    entryDate={journal.entryDate}
                    createdAt={journal.createdAt}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <a href="/blogs">
        <button className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition duration-200">
          Write Today's Journal Entry
        </button>
      </a>
    </div>
  );
}
