import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyIcon } from './icons/Icons';
import Mermaid from './Mermaid';

interface MarkdownPreviewTabProps {
  markdownContent: string;
}

const markdownComponents = {
  code({node, inline, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

const MarkdownPreviewTab: React.FC<MarkdownPreviewTabProps> = ({ markdownContent }) => {
  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent).then(() => alert('Markdown copied to clipboard!'));
  };

  return (
    <div>
      <div className="text-right mb-4">
        <button 
          onClick={copyMarkdown} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-200 transition-colors"
        >
          <CopyIcon/> Copy Markdown
        </button>
      </div>
      <div className="prose prose-slate max-w-none p-6 border rounded-lg bg-white prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:border prose-pre:rounded-md prose-th:bg-slate-50">
        <ReactMarkdown components={markdownComponents}>{markdownContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreviewTab;