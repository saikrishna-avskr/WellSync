import React, { useEffect, useState } from "react";
import Hero from "../component/home/Hero";
import Features from "../component/home/Features";
import Physical from "../component/home/Physical";
import Contact from "../component/home/Contact";
import Footer from "../component/home/Footer";

function Home() {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowPrivacyPolicy(false);
      }
    };

    if (showPrivacyPolicy) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showPrivacyPolicy]);

  const handlePrivacyPolicyClick = () => {
    setShowPrivacyPolicy(true);
  };

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      <Hero />
      <Features />
      <Physical />
      <Contact />
      {showPrivacyPolicy && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4"
          onClick={() => setShowPrivacyPolicy(false)}
        >
          <section
            id="privacy-policy"
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-black px-6 py-8 text-white md:px-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Privacy Policy</h2>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-2xl font-light leading-none text-white"
                aria-label="Close privacy policy"
              >
                ×
              </button>
            </div>

            <p className="mb-6 text-sm text-gray-300">
              Last updated: March 25, 2026
            </p>

            <div className="space-y-5 text-sm leading-7 text-gray-200">
              <p>
                SereniFit collects only the information required to provide
                wellness features, including account identity details, profile
                activity, tracker inputs, and conversation history you choose to
                submit.
              </p>
              <p>
                Your data is used to power personalized experiences such as mood
                tracking, breathing and meditation logs, journal entries,
                fitness insights, and chatbot continuity. We do not sell
                personal data.
              </p>
              <p>
                You can request deletion of your stored application data using
                the
                <span className="font-semibold"> Manage Data</span> action in
                your profile page. This removes your user-scoped records and
                stored chat conversations from SereniFit-managed systems.
              </p>
              <p>
                Some account authentication details may remain with external
                identity providers. Please review your provider settings if you
                also want to remove account-level identity data.
              </p>
            </div>
          </section>
        </div>
      )}
      <Footer onPrivacyPolicyClick={handlePrivacyPolicyClick} />
    </main>
  );
}

export default Home;
