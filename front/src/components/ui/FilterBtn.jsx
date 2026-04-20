import React from 'react';

const FilterButton = ({ isActive, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 btn-filter ${
        isActive ? "bg-blue-500 text-white border-blue-500" : "bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
};

export default FilterButton;
