import React from 'react';
import { PlusIcon, SparklesIcon } from './icons/Icons';

interface WelcomePlaceholderProps {
    onAddNewCard: () => void;
}

export const WelcomePlaceholder: React.FC<WelcomePlaceholderProps> = ({ onAddNewCard }) => {
    return (
        <div className="text-center p-10 md:p-20 bg-white rounded-2xl shadow-sm border border-slate-200/80 mt-8">
            <div 
                className="relative inline-block p-5 bg-gradient-to-br from-sky-100 to-indigo-200 rounded-full mb-6 shadow-inner-lg"
            >
                 <SparklesIcon className="w-16 h-16 text-sky-500" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 mb-2">AI-Powered Task Manager</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8">
                Go from idea to execution. Let AI help you generate specs, analysis, and test cases, so you can focus on building.
            </p>
            <button
                onClick={onAddNewCard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:scale-[1.03] hover:shadow-lg hover:bg-slate-900 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800"
            >
                <PlusIcon className="w-5 h-5"/>
                <span>Create Your First Card</span>
            </button>
        </div>
    );
};