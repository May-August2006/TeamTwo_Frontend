/** @format */

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  return (
    <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
      {/* First */}
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded border ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        « First
      </button>

      {/* Previous */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded border ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        ‹ Prev
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => goToPage(i + 1)}
          className={`px-3 py-1 rounded border ${
            currentPage === i + 1
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i + 1}
        </button>
      ))}

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded border ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Next ›
      </button>

      {/* Last */}
      <button
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded border ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Last »
      </button>
    </div>
  );
};
