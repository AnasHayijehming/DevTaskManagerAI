

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyIcon } from './icons/Icons';

interface MarkdownPreviewTabProps {
  markdownContent: string;
}

const MarkdownPreviewTab: React.FC<MarkdownPreviewTabProps> = ({ markdownContent }) => {
  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent).then(() => alert('Markdown copied to clipboard!'));
  };

  return (
    <div>
      <div className="text-right mb-4">
        <button 
          onClick={copyMarkdown} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
        >
          <CopyIcon/> Copy Markdown
        </button>
      </div>
      <div className="prose prose-slate max-w-none p-6 border rounded-lg bg-white prose-pre:bg-slate-100 prose-pre:border prose-pre:rounded-md prose-th:bg-slate-50">
        <ReactMarkdown>{markdownContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreviewTab;