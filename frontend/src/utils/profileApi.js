const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const toQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

const request = async (path, { method = "GET", body, query } = {}) => {
  const url = `${BACKEND_URL}${path}${query ? `?${toQuery(query)}` : ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.error || `Request failed with status ${response.status}`,
    );
  }

  return payload;
};

export const fetchMoodEntries = (userEmail, month) =>
  request("/profile/moods", {
    query: { user_email: userEmail, month },
  });

export const saveMoodEntry = (userEmail, entry) =>
  request("/profile/moods", {
    method: "POST",
    body: {
      user_email: userEmail,
      ...entry,
    },
  });

export const fetchBreathingEntries = (userEmail, startDate, endDate) =>
  request("/profile/breathing", {
    query: {
      user_email: userEmail,
      start_date: startDate,
      end_date: endDate,
    },
  });

export const saveBreathingEntry = (userEmail, entry) =>
  request("/profile/breathing", {
    method: "POST",
    body: {
      user_email: userEmail,
      ...entry,
    },
  });

export const fetchMeditationEntries = (userEmail, startDate, endDate) =>
  request("/profile/meditation", {
    query: {
      user_email: userEmail,
      start_date: startDate,
      end_date: endDate,
    },
  });

export const saveMeditationEntry = (userEmail, entry) =>
  request("/profile/meditation", {
    method: "POST",
    body: {
      user_email: userEmail,
      ...entry,
    },
  });

export const fetchJournals = (userEmail, limit = 100) =>
  request("/profile/journals", {
    query: { user_email: userEmail, limit },
  });

export const fetchJournalsByDate = (userEmail, entryDate, limit = 100) =>
  request("/profile/journals", {
    query: { user_email: userEmail, entry_date: entryDate, limit },
  });

export const createJournal = (userEmail, journal) =>
  request("/profile/journals", {
    method: "POST",
    body: {
      user_email: userEmail,
      ...journal,
    },
  });

export const deleteJournal = (userEmail, journalId) =>
  request(`/profile/journals/${journalId}`, {
    method: "DELETE",
    body: {
      user_email: userEmail,
    },
  });

export const fetchJournalStreak = (userEmail) =>
  request("/profile/streak", {
    query: { user_email: userEmail },
  });

export const fetchQuizResults = (userEmail, { month, entryDate } = {}) =>
  request("/profile/quiz-results", {
    query: {
      user_email: userEmail,
      month,
      entry_date: entryDate,
    },
  });

export const saveQuizResult = (userEmail, payload) =>
  request("/profile/quiz-results", {
    method: "POST",
    body: {
      user_email: userEmail,
      ...payload,
    },
  });

export const deleteAllUserData = (userEmail) =>
  request("/profile/data-management/delete-all", {
    method: "POST",
    body: {
      user_email: userEmail,
      confirm_delete_all: true,
    },
  });
