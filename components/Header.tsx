import React from 'react';
import { Status } from '../types';
import { PlusIcon, BookOpenIcon, SparklesIcon, TagIcon } from './icons/Icons';

interface HeaderProps {
  currentFilter: Status | 'All';
  onFilterChange: (filter: Status | 'All') => void;
  onAddNewCard: () => void;
  onKnowledgeBaseClick: () => void;
  onManageTagsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentFilter, onFilterChange, onAddNewCard, onKnowledgeBaseClick, onManageTagsClick }) => {
  const filters: (Status | 'All')[] = ['All', Status.Todo, Status.InProgress, Status.Done];

  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-20 border-b border-slate-200">
      <div className="px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left Side: Brand */}
        <div className="flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-sky-500" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                DevTaskManager.AI
            </h1>
        </div>
        
        {/* Center: Filters */}
        <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                {filters.map(filter => (
                    <button
                    key={filter}
                    onClick={() => onFilterChange(filter)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                        currentFilter === filter
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'bg-transparent text-slate-600 hover:bg-white/60'
                    }`}
                    >
                    {filter}
                    </button>
                ))}
            </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
            <button
                onClick={onKnowledgeBaseClick}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors duration-200"
                aria-label="Open Knowledge Base"
            >
                <BookOpenIcon className="w-5 h-5"/>
                <span>Knowledge Base</span>
            </button>
            <button
                onClick={onManageTagsClick}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors duration-200"
                aria-label="Manage Tags"
            >
                <TagIcon className="w-5 h-5"/>
                <span>Manage Tags</span>
            </button>
            <button
                onClick={onAddNewCard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 transition-colors duration-200 transform hover:scale-[1.03]"
            >
                <PlusIcon className="w-5 h-5"/>
                <span>New Card</span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
