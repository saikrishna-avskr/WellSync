import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import BlogCard from "../component/Blogs/BlogCard";
import Dictaphone from "../Dictaphone";
import {
  createJournal,
  deleteJournal,
  fetchJournalsByDate,
} from "../utils/profileApi";

const Blogs = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const todayDateKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const imgUrls = [
    "https://img.freepik.com/free-vector/businessman-workplace-top-view_98292-5450.jpg",
    "https://img.freepik.com/free-vector/thesis-concept-illustration_114360-30032.jpg",
    "https://img.freepik.com/free-vector/blogging-illustration-concept_114360-851.jpg",
    "https://img.freepik.com/free-vector/letter-concept-illustration_114360-27243.jpg",
  ];

  useEffect(() => {
    if (!userEmail) return;

    const loadJournals = async () => {
      setLoading(true);
      try {
        const response = await fetchJournalsByDate(
          userEmail,
          todayDateKey,
          200,
        );
        const normalized = (response.journals || []).map((journal, index) => ({
          id: journal.id,
          title: journal.title,
          content: journal.content,
          entryDate: journal.entry_date,
          createdAt: journal.created_at,
          imgUrl: journal.image_url || imgUrls[index % imgUrls.length],
        }));
        setPosts(normalized);
      } catch (error) {
        console.error("Failed to load journals", error);
      } finally {
        setLoading(false);
      }
    };

    loadJournals();
  }, [userEmail, todayDateKey]);

  const handlePost = async () => {
    if (!title || !content || !userEmail) return;

    try {
      const imgUrl = imgUrls[posts.length % imgUrls.length];
      const response = await createJournal(userEmail, {
        title,
        content,
        image_url: imgUrl,
      });

      const created = response.journal;
      setPosts((prev) => [
        {
          id: created.id,
          title: created.title,
          content: created.content,
          entryDate: created.entry_date,
          createdAt: created.created_at,
          imgUrl: created.image_url || imgUrl,
        },
        ...prev,
      ]);
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Failed to create journal", error);
      alert(`Failed to save journal: ${error?.message || "Unknown error"}`);
    }
  };

  const handleClear = () => {
    setTitle("");
    setContent("");
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/home");
  };

  const handleDelete = async (journalId) => {
    if (!journalId || !userEmail) return;
    if (!window.confirm("Delete this journal entry?")) return;

    try {
      await deleteJournal(userEmail, journalId);
      setPosts((prev) => prev.filter((item) => item.id !== journalId));
      showToast("Journal deleted successfully");
    } catch (error) {
      console.error("Failed to delete journal", error);
      alert(`Failed to delete journal: ${error?.message || "Unknown error"}`);
    }
  };

  return (
    <section className="py-16 md:py-24 min-h-screen bg-gray-50 text-gray-900">
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <button
              onClick={handleClose}
              className="w-fit rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
              aria-label="Go back"
            >
              ← Back
            </button>
            <div className="md:flex-1 md:text-right">
              <h2 className="font-manrope text-3xl md:text-4xl font-bold text-gray-900">
                Journals
              </h2>
              <p className="mt-2 text-sm md:text-base text-gray-600">
                Capture your thoughts daily and track your emotional growth over
                time.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="block text-xl font-semibold text-slate-800">
              Write Journal
            </h4>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Daily Reflection
            </span>
          </div>

          <form className="mt-2 mb-2 w-full">
            <div className="mb-1 flex flex-col gap-6">
              <div className="w-full ">
                <label className="block mb-2 text-sm text-slate-600">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full bg-white placeholder:text-slate-400 text-gray-900 text-sm border border-gray-300 rounded-md px-3 py-2 transition duration-300 ease focus:border-gray-900 focus:outline-none hover:border-gray-400 shadow-sm"
                  placeholder="Title here"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="relative">
              <div className="relative w-full">
                <label className="block mb-2 text-sm text-slate-600">
                  Your Thoughts
                </label>
                <textarea
                  rows={8}
                  className="peer h-full min-h-[140px] w-full !resize-none rounded-md border border-gray-300 bg-white px-3 py-2.5 font-sans text-sm font-normal text-gray-900 outline-none transition-all focus:border-gray-900"
                  placeholder="Write your thoughts here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="flex w-full justify-end py-1.5">
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 font-sans text-xs font-bold text-center text-gray-900 uppercase align-middle transition-all rounded-md select-none hover:bg-gray-900/10 active:bg-gray-900/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                  <button
                    className="select-none rounded-md bg-gray-900 py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button"
                    onClick={handlePost}
                    disabled={!title.trim() || !content.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">
            Today's Journals
          </h3>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {posts.length} entries
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading && (
            <p className="text-sm text-gray-500">Loading journals...</p>
          )}
          {!loading && posts.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No journals added today yet.
            </div>
          )}
          {posts.map((post, index) => (
            <BlogCard
              key={post.id || index}
              id={post.id}
              title={post.title}
              content={post.content}
              imgUrl={post.imgUrl}
              entryDate={post.entryDate}
              createdAt={post.createdAt}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
      <Dictaphone />
    </section>
  );
};

export default Blogs;
