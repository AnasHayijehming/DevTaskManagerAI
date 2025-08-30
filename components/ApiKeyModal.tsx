
import React, { useState } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { XMarkIcon } from './icons/Icons';

interface ApiKeyModalProps {
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
  const [currentApiKey, saveApiKey] = useApiKey();
  const [inputValue, setInputValue] = useState(currentApiKey);

  const handleSave = () => {
    saveApiKey(inputValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Set Gemini API Key</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <p className="text-slate-600 mb-4 text-sm">
          Your API key is stored securely in your browser's local storage and is never sent to our servers.
        </p>
        <div>
          <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 mb-1">
            API Key
          </label>
          <input
            id="api-key-input"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            placeholder="Enter your Gemini API Key"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
