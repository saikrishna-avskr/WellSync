import React, { useState } from "react";
import { UserButton } from "@clerk/clerk-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="w-full text-white bg-black h-screen z-50">
      <div className="flex flex-col max-w-screen-6xl px-4 mx-auto md:items-center md:justify-between md:flex-row md:px-6 lg:px-8">
        <div className="p-4 flex flex-row justify-between items-center h-[100px]">
          <a
            href="/home"
            className="text-xl font-semibold tracking-widest text-white uppercase"
          >
            SERENIFIT
          </a>
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6">
              {menuOpen ? (
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>

        <nav
          className={`${menuOpen ? "flex flex-col" : "hidden"} md:flex md:flex-row items-center gap-6`}
        >
          <a
            href="https://framevr.io/zenithai"
            className="hover:text-gray-300 transition"
          >
            Virtual Meditation
          </a>
          <a href="/articles" className="hover:text-gray-300 transition">
            Articles
          </a>
          <a href="/face-detection" className="hover:text-gray-300 transition">
            Mood Detection
          </a>
          <a href="/chat" className="hover:text-gray-300 transition">
            Virtual Chat
          </a>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="hover:text-gray-300 transition flex items-center"
            >
              <span>Helpline</span>
              <svg
                fill="currentColor"
                viewBox="0 0 20 20"
                className={`w-4 h-4 ml-1 transform ${dropdownOpen ? "rotate-180" : ""} transition`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-4 bg-gray-900 text-white rounded-lg shadow-lg">
                <a
                  href="https://www.thelivelovelaughfoundation.org/find-help/helplines"
                  className="block px-4 py-2 hover:bg-gray-800"
                >
                  Find Help
                </a>
                <div className="border-t border-gray-700"></div>
                <a
                  href="https://www.nimh.nih.gov/health/topics/suicide-prevention"
                  className="block px-4 py-2 hover:bg-gray-800"
                >
                  Suicide Prevention
                </a>
              </div>
            )}
          </div>

          <a
            href="/profile"
            className="flex items-center gap-3 hover:text-gray-300 transition"
          >
            <UserButton />
            <span>Profile</span>
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
