import React from 'react';
import { SparklesIcon } from './icons/Icons';
import Spinner from './Spinner';

interface AiButtonProps {
  text: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const AiButton: React.FC<AiButtonProps> = ({ text, onClick, isLoading = false, disabled = false, variant = 'primary' }) => {
  const baseClasses = 'flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
      primary: 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:scale-[1.03] hover:shadow-lg focus:ring-sky-500 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:scale-100',
      secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:scale-[1.03] focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed disabled:scale-100'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {isLoading ? (
        <>
            <Spinner />
            <span>Generating...</span>
        </>
      ) : (
        <>
          <SparklesIcon />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default AiButton;
