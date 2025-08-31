import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PreDevAnalysis } from '../types';
import EditPreviewToggle from './EditPreviewToggle';
import Mermaid from './Mermaid';

interface PreDevTabProps {
  preDevAnalysis: PreDevAnalysis;
  onPreDevChange: (field: keyof PreDevAnalysis, value: string) => void;
}

const inputStyles = "w-full p-3 bg-white text-slate-800 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow shadow-sm";
const previewStyles = "prose max-w-none p-4 border border-slate-300 rounded-md bg-white shadow-sm";

type ViewModes = {
  introduction: 'edit' | 'preview';
  impactAnalysis: 'edit' | 'preview';
  howToCode: 'edit' | 'preview';
  testApproach: 'edit' | 'preview';
};

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

const PreDevTab: React.FC<PreDevTabProps> = ({ preDevAnalysis, onPreDevChange }) => {
  const [viewModes, setViewModes] = useState<ViewModes>({
    introduction: 'edit',
    impactAnalysis: 'edit',
    howToCode: 'edit',
    testApproach: 'edit',
  });

  const handleViewModeChange = (field: keyof ViewModes, mode: 'edit' | 'preview') => {
    setViewModes(prev => ({ ...prev, [field]: mode }));
  };

  const fields: { key: keyof PreDevAnalysis; label: string; placeholder: string, height: string, minHeight: string }[] = [
    { key: 'introduction', label: 'Introduction', placeholder: 'A summary of the requirements and root causes...', height: 'h-24', minHeight: 'min-h-[96px]' },
    { key: 'impactAnalysis', label: 'Impact Analysis', placeholder: 'Affected components, systems, or user workflows...', height: 'h-24', minHeight: 'min-h-[96px]' },
    { key: 'howToCode', label: 'How to Code', placeholder: 'A high-level development approach or plan...', height: 'h-48', minHeight: 'min-h-[192px]' },
    { key: 'testApproach', label: 'Test Approach', placeholder: 'A strategy for testing the new feature or fix...', height: 'h-24', minHeight: 'min-h-[96px]' },
  ];

  return (
    <div className="space-y-6">
      {fields.map(({ key, label, placeholder, height, minHeight }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700 block">{label}</label>
            <EditPreviewToggle 
                viewMode={viewModes[key]} 
                onViewModeChange={(mode) => handleViewModeChange(key, mode)}
            />
          </div>
          {viewModes[key] === 'edit' ? (
            <textarea
              value={preDevAnalysis[key]}
              onChange={e => onPreDevChange(key, e.target.value)}
              className={`${inputStyles} ${height}`}
              placeholder={placeholder}
            />
          ) : (
            <div className={`${previewStyles} ${minHeight}`}>
              {preDevAnalysis[key] ? <ReactMarkdown components={markdownComponents}>{preDevAnalysis[key]}</ReactMarkdown> : <p className="text-slate-500 italic">Not specified.</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PreDevTab;
