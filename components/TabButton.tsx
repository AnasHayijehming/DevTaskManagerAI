import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/80 rounded-t-lg ${
        isActive
          ? 'border-sky-500 text-sky-600 font-semibold'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );
};

export default TabButton;