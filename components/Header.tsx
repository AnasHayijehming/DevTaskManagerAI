import React from 'react';
import { Status } from '../types';
import { PlusIcon, BookOpenIcon, SparklesIcon, Cog6ToothIcon } from './icons/Icons';
import Tooltip from './Tooltip';

interface HeaderProps {
  currentFilter: Status | 'All';
  onFilterChange: (filter: Status | 'All') => void;
  onAddNewCard: () => void;
  onKnowledgeBaseClick: () => void;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentFilter, onFilterChange, onAddNewCard, onKnowledgeBaseClick, onSettingsClick }) => {
  const filters: (Status | 'All')[] = ['All', Status.Todo, Status.InProgress, Status.Done];

  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-20 border-b border-slate-200">
      <div className="px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left Side: Brand & Filters */}
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <SparklesIcon className="w-7 h-7 text-sky-500" />
                <h1 className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
                    DevTaskManager.AI
                </h1>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                {filters.map(filter => (
                    <button
                    key={filter}
                    onClick={() => onFilterChange(filter)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
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
        <div className="flex items-center gap-2">
            <Tooltip text="Settings">
                <button
                    onClick={onSettingsClick}
                    className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                    aria-label="Open Settings"
                >
                    <Cog6ToothIcon className="w-5 h-5"/>
                </button>
            </Tooltip>
             <Tooltip text="Knowledge Base">
                <button
                    onClick={onKnowledgeBaseClick}
                    className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                    aria-label="Open Knowledge Base"
                >
                    <BookOpenIcon className="w-5 h-5"/>
                </button>
            </Tooltip>
            
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

            <button
                onClick={onAddNewCard}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 transition-colors duration-200 transform hover:scale-[1.03]"
            >
                <PlusIcon className="w-5 h-5"/>
                <span className="whitespace-nowrap">New Card</span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;