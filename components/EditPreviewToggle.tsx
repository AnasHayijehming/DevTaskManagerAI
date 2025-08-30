import React from 'react';

type ViewMode = 'edit' | 'preview';

interface EditPreviewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const EditPreviewToggle: React.FC<EditPreviewToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200">
      <button
        onClick={() => onViewModeChange('edit')}
        aria-pressed={viewMode === 'edit'}
        className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${viewMode === 'edit' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
      >
        Edit
      </button>
      <button
        onClick={() => onViewModeChange('preview')}
        aria-pressed={viewMode === 'preview'}
        className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${viewMode === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
      >
        Preview
      </button>
    </div>
  );
};

export default EditPreviewToggle;
