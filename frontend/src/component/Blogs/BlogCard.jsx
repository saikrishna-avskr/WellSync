import React from "react";
import { useNavigate } from "react-router-dom";

const BlogCard = ({
  id,
  title,
  content,
  imgUrl,
  createdAt,
  entryDate,
  onDelete,
}) => {
  const navigate = useNavigate();

  const createdAtText = createdAt
    ? new Date(createdAt).toLocaleString()
    : entryDate
      ? new Date(entryDate).toLocaleDateString()
      : "";

  const handleDescription = () => {
    navigate("/description", {
      state: { title, content, imgUrl, createdAtText },
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <img src={imgUrl} alt={title} className="w-full h-48 object-cover" />
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        {createdAtText && (
          <p className="text-xs text-gray-500 mb-3">Added: {createdAtText}</p>
        )}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{content}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={handleDescription}
            className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition duration-300"
          >
            Read more
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="text-sm font-semibold text-red-600 hover:text-red-700 transition duration-300"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
