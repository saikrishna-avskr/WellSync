import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import MoodCalendar from "../component/MoodCalendar";
import BreathingCalendar from "../component/BreathingCalendar/BreathingCalendar";
import { StreakPage } from "../component/StreakCalender.jsx/StreakPage";
import MeditationTracker from "../component/MeditationCalendar/MeditationTracker";
import { deleteAllUserData } from "../utils/profileApi";

const ProfilePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const [showManageData, setShowManageData] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [isDeletingData, setIsDeletingData] = useState(false);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const handleDeleteAllData = async () => {
    if (!userEmail || isDeletingData) {
      return;
    }

    if (confirmPhrase.trim() !== "DELETE") {
      alert("Please type DELETE to confirm.");
      return;
    }

    const ok = window.confirm(
      "This will permanently delete all your SereniFit data, including profile tracker records, meal records, journals, and chat conversations. Continue?",
    );

    if (!ok) {
      return;
    }

    try {
      setIsDeletingData(true);
      await deleteAllUserData(userEmail);
      alert("All your SereniFit data has been deleted successfully.");
      setConfirmPhrase("");
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete all user data", error);
      alert(`Failed to delete data: ${error?.message || "Unknown error"}`);
    } finally {
      setIsDeletingData(false);
    }
  };

  return (
    <main className="profile-page">
      <section className="relative block h-[700px]">
        <div
          className="absolute top-0 w-full h-full bg-center bg-cover"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1499336315816-097655dcfbda?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2710&q=80')",
          }}
        >
          <span
            id="blackOverlay"
            className="w-full h-full absolute opacity-50 bg-black"
          ></span>
        </div>
        <div
          className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-[70px]"
          style={{ transform: "translateZ(0px)" }}
        >
          <svg
            className="absolute bottom-0 overflow-hidden"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 2560 100"
          >
            <polygon
              className="text-blueGray-200 fill-current"
              points="2560 0 2560 100 0 100"
            ></polygon>
          </svg>
        </div>
      </section>

      <section className="relative py-16 bg-blueGray-200">
        <div className="container mx-auto px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-lg -mt-64">
            <div className="md:px-6">
              <div className="flex flex-wrap justify-center items-center">
                {/* Profile Image on the Left */}
                <div className="w-full lg:w-3/12 px-4 flex justify-center lg:justify-start my-8">
                  <div className="relative">
                    <img
                      alt="..."
                      src={user.imageUrl}
                      className="shadow-xl rounded-full h-auto align-middle border-none max-w-[150px]"
                    />
                  </div>
                </div>

                {/* Name and Description in the Center */}
                <div className="w-full lg:w-6/12 px-4 text-center lg:text-left">
                  <div className="mt-4 lg:mt-0">
                    <h3 className="text-4xl font-semibold leading-normal mb-2 text-blueGray-700">
                      {user.fullName}
                    </h3>
                    <div className="text-sm leading-normal mt-0 mb-2 text-blueGray-400 font-bold uppercase">
                      <i className="fas fa-map-marker-alt mr-2 text-lg text-blueGray-400"></i>
                      {user.primaryEmailAddress.emailAddress}
                    </div>
                  </div>
                </div>

                {/* Manage Data Button on the Right */}
                <div className="w-full lg:w-3/12 px-4 text-center lg:text-right">
                  <div className="py-6 px-3 mt-4 lg:mt-0">
                    <button
                      className="bg-black active:bg-pink-600 uppercase text-white font-bold hover:shadow-md shadow text-xs px-4 py-2 rounded outline-none focus:outline-none ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => setShowManageData((prev) => !prev)}
                    >
                      Manage Data
                    </button>
                    {showManageData && (
                      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-left">
                        <p className="text-xs text-red-700 font-semibold mb-2">
                          Danger Zone
                        </p>
                        <p className="text-xs text-red-700 mb-2">
                          Select this action to permanently delete all your user
                          data from SereniFit, including chat conversations.
                        </p>
                        <label className="block text-[11px] text-red-700 mb-1">
                          Type DELETE to confirm
                        </label>
                        <input
                          type="text"
                          value={confirmPhrase}
                          onChange={(event) =>
                            setConfirmPhrase(event.target.value)
                          }
                          placeholder="DELETE"
                          className="w-full text-xs px-2 py-1 rounded border border-red-300 mb-2"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteAllData}
                          disabled={isDeletingData}
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded disabled:opacity-60"
                        >
                          {isDeletingData ? "Deleting..." : "Delete All Data"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 py-10 border-t border-blueGray-200 text-center"></div>

              <div>
                <MoodCalendar userEmail={userEmail} />
              </div>

              <div className="lg:flex gap-8 my-16">
                <div className="flex-1">
                  <BreathingCalendar userEmail={userEmail} />
                </div>
                <div className="flex-1">
                  <MeditationTracker userEmail={userEmail} />
                </div>
              </div>

              <div className="my-16">
                <StreakPage userEmail={userEmail} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;
