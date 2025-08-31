import React from 'react';

const ProcessIndicator: React.FC = () => {
  return (
    <div className="p-3 my-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 animate-fade-in">
        <p className="font-semibold mb-2">AI is following a 7-stage process for quality assurance:</p>
        <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <li>1. Requirements Analysis</li>
            <li>2. Information Gathering</li>
            <li>3. Specification Drafting</li>
            <li>4. Self-Review</li>
            <li>5. Issue Resolution</li>
            <li>6. Final Polish</li>
            <li>7. Documentation</li>
        </ol>
        <style>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
};

export default ProcessIndicator;
