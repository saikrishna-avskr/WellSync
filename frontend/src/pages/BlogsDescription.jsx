import { useUser } from "@clerk/clerk-react";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Dictaphone from "../Dictaphone";

const BlogsDescription = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { title, content, imgUrl, createdAtText } = location.state;

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/blogs");
  };

  return (
    <div>
      <div className="max-w-screen-xl mx-auto p-5 sm:p-10 md:p-16 relative">
        <div className="mb-4 flex justify-start">
          <button
            onClick={handleClose}
            className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
            aria-label="Close and go back"
          >
            Close
          </button>
        </div>
        <div
          className="bg-cover bg-center text-center overflow-hidden"
          style={{
            minHeight: 500,
            backgroundImage: `url("${imgUrl}")`,
          }}
          title="Woman holding a mug"
        ></div>
        <div className="max-w-3xl mx-auto">
          <div className="mt-3 bg-white rounded-b lg:rounded-b-none lg:rounded-r flex flex-col justify-between leading-normal">
            <div className="bg-white relative top-0 -mt-32 p-5 sm:p-10">
              <h1 href="#" className="text-gray-900 font-bold text-3xl mb-2">
                {title}
              </h1>
              <p className="text-gray-700 text-xs mt-2">
                Written By: {user?.fullName}
              </p>
              {createdAtText && (
                <p className="text-gray-500 text-xs mt-1">
                  Added: {createdAtText}
                </p>
              )}
              <p className="text-base leading-8 my-5">{content}</p>
            </div>
          </div>
        </div>
      </div>
      <Dictaphone />
    </div>
  );
};

export default BlogsDescription;
