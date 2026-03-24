import React, { useState } from "react";

function SessionTab({ setWeekData, onRecordSession }) {
  const [sessionData, setSessionData] = useState({
    day: "",
    duration: "",
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRecordSession) {
      onRecordSession(sessionData);
      setSessionData({ day: "", duration: "", notes: "" });
      return;
    }

    setWeekData((prevData) => {
      const updatedData = [...prevData];
      const dayIndex = updatedData.findIndex((d) => d.day === sessionData.day);
      if (dayIndex !== -1) {
        updatedData[dayIndex] = {
          ...updatedData[dayIndex],
          duration: sessionData.duration,
          notes: sessionData.notes,
        };
      }
      return updatedData;
    });
    setSessionData({ day: "", duration: "", notes: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="day"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Day of the Week
        </label>
        <select
          id="day"
          value={sessionData.day}
          onChange={(e) =>
            setSessionData({ ...sessionData, day: e.target.value })
          }
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Select a day</option>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="duration"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Duration (minutes)
        </label>
        <input
          type="number"
          id="duration"
          value={sessionData.duration}
          onChange={(e) =>
            setSessionData({ ...sessionData, duration: e.target.value })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={sessionData.notes}
          onChange={(e) =>
            setSessionData({ ...sessionData, notes: e.target.value })
          }
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ></textarea>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full bg-black text-white  "
      >
        Record Session
      </button>
    </form>
  );
}

export default SessionTab;
