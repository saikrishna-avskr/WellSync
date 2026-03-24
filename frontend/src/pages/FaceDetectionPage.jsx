import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FaceDetection from "../component/FaceDetection/FaceDetection";
import { BentoMovieCardImage, BentoTilt } from "../component/home/Features";
import Modal from "../component/FaceDetection/Modal";
import Loader from "../component/FaceDetection/Loader";
import Dictaphone from "../Dictaphone";

export default function FaceDetectionPage() {
  const [suggestions, setSuggestions] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const modalTimer = setTimeout(() => {
      setIsModalOpen(false);
      setIsLoading(true);
    }, 10000);
    const loaderTimer = setTimeout(() => {
      setIsLoading(false);
      if (suggestions) {
        const categories = Object.keys(suggestions);
        console.log("Categories",categories);
        setCategories(categories);
      }
    }, 13000);

    return () => {
      clearTimeout(modalTimer);
      clearTimeout(loaderTimer);
    };
  }, [suggestions]);

  return (
    <div className="bg-gray-100 min-h-screen min-w-screen text-gray-800">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {isModalOpen && <FaceDetection setSuggestions={setSuggestions} />}
      </Modal>

      <main className="mx-auto px-8 md:px-20 py-12">
        <header className=" py-6">
          <h1 className="text-4xl font-bold">Personalized Suggestions</h1>
          <p className="mt-2 text-lg">
            Discover movies, music, and activities tailored for you!
          </p>
        </header>
        <AnimatePresence>
          {isLoading ? (
            <Loader key="loader" />
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {console.log(categories)}
                <CategorySection
                  title={category}
                  items={suggestions[category]}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </main>
      <Dictaphone/>
    </div>
  );
}

function CategorySection({ title, items }) {
  return (
    <div className="mb-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-semibold capitalize"
      >
        {formatTitle(title)}
      </motion.h2>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6"
      >
        {items.map((item, index) => (
          <SuggestionCard1 key={index} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

function SuggestionCard1({ item }) {
  const title = item.title || item.activity || item.artist;
  const description = item.description;
  const image = item.image;
  const movie_link = item.movie_link || item.song_link || item.activity_link;

  return (
    <a href={movie_link} target="_blank" rel="noopener noreferrer">
      <motion.div
        className="relative overflow-hidden rounded-lg cursor-pointer"
        initial="rest"
        whileHover="hover"
        animate="rest"
      >
        <BentoMovieCardImage
          src={image}
          className="w-full h-full object-cover"
        />
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center"
          variants={{
            rest: { opacity: 0, y: 20, backgroundColor: "transparent" },
            hover: {
              opacity: 1,
              y: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              transition: { duration: 0.3 },
            },
          }}
        >
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm mt-2">{description}</p>
        </motion.div>
      </motion.div>
    </a>
  );
}




function formatTitle(title) {
  return title.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
