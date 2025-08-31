import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTag, deleteTag } from '../services/db';
import { useApiKey } from '../hooks/useApiKey';
import { useModelSettings } from '../hooks/useModelSettings';
import { TAG_COLORS, TAG_COLOR_CLASSES, AVAILABLE_MODELS } from '../constants';
import { XMarkIcon, TrashIcon, KeyIcon, TagIcon, EyeIcon, EyeSlashIcon } from './icons/Icons';

type SettingsTab = 'api-key' | 'tags';

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsTab;
}

const ApiKeySettings: React.FC = () => {
  const [currentApiKey, saveApiKey] = useApiKey();
  const [inputValue, setInputValue] = useState(currentApiKey);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [model, saveModel] = useModelSettings();
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  const handleSave = () => {
    saveApiKey(inputValue);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  return (
    <div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Gemini API Key</h3>
        <p className="text-slate-600 mb-6 text-sm">
          Your API key is stored securely in your browser's local storage and is never sent to our servers. Get your key from Google AI Studio.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 mb-1">
              API Key
            </label>
            <div className="relative w-full max-w-sm">
              <input
                id="api-key-input"
                type={isKeyVisible ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 pr-10"
                placeholder="Enter your Gemini API Key"
              />
              <button
                type="button"
                onClick={() => setIsKeyVisible(!isKeyVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                aria-label={isKeyVisible ? 'Hide API key' : 'Show API key'}
              >
                {isKeyVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 transition-colors"
            >
              Save Key
            </button>
            {saveFeedback && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Model Configuration</h3>
            <p className="text-slate-600 mb-4 text-sm">
                Choose the AI model for generating content. Using the latest models ensures the best performance and quality.
            </p>
            <fieldset className="space-y-2 max-w-sm">
                <legend className="sr-only">AI Model Selection</legend>
                {AVAILABLE_MODELS.map((m) => (
                    <label key={m.id} className={`flex p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                        model === m.id
                            ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}>
                        <input
                            type="radio"
                            name="model-selection"
                            value={m.id}
                            checked={model === m.id}
                            onChange={() => saveModel(m.id)}
                            className="h-4 w-4 mt-1 text-sky-600 focus:ring-sky-500 border-slate-400"
                        />
                        <div className="ml-3 text-sm">
                            <span className="font-semibold text-slate-800">{m.name}</span>
                            <p className="text-slate-600">{m.description}</p>
                        </div>
                    </label>
                ))}
            </fieldset>
      </div>
    </div>
  );
};

const TagManagementSettings: React.FC = () => {
    const tags = useLiveQuery(() => db.tags.orderBy('name').toArray(), []);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(TAG_COLORS[10]); // default to sky

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        try {
        await addTag(newTagName.trim(), selectedColor);
        setNewTagName('');
        } catch (error) {
        console.error("Failed to add tag:", error);
        alert(`Error adding tag. A tag with the name "${newTagName.trim()}" may already exist.`);
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this tag? It will be removed from all associated cards.")) {
        await deleteTag(id);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Tags</h3>
            <p className="text-slate-600 mb-6 text-sm">
                Create and delete tags that can be assigned to your task cards for better organization.
            </p>
             <form onSubmit={handleAddTag} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3 mb-6">
                <div className="flex gap-3">
                    <input
                    type="text"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="New tag name..."
                    className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    maxLength={25}
                    />
                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 transition-colors">
                    Add Tag
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map(color => (
                    <button
                        type="button"
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 ${TAG_COLOR_CLASSES[color].bg} ${selectedColor === color ? 'ring-2 ring-offset-1 ring-sky-500' : ''}`}
                        aria-label={`Select color ${color}`}
                    />
                    ))}
                </div>
            </form>
            <div className="flex flex-wrap gap-2">
                {tags && tags.length > 0 ? tags.map(tag => {
                const colorClasses = TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.slate;
                return (
                    <span key={tag.id} className={`inline-flex items-center font-medium rounded-full whitespace-nowrap text-sm px-2.5 py-1 ${colorClasses.bg} ${colorClasses.text}`}>
                    {tag.name}
                    <button
                        onClick={() => handleDeleteTag(tag.id!)}
                        className={`ml-1.5 -mr-1 p-0.5 rounded-full ${colorClasses.hoverBg} ${colorClasses.hoverText}`}
                        aria-label={`Remove tag ${tag.name}`}
                    >
                        <TrashIcon className="w-3 h-3" />
                    </button>
                    </span>
                );
                }) : (
                <p className="text-slate-500 text-sm">No tags created yet. Add one above!</p>
                )}
            </div>
        </div>
    );
};


const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, initialTab = 'api-key' }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const navItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'api-key', label: 'API Key', icon: <KeyIcon className="w-5 h-5"/> },
        { id: 'tags', label: 'Tags', icon: <TagIcon className="w-5 h-5" /> },
    ];

    return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[70vh] flex" onClick={e => e.stopPropagation()}>
        <aside className="w-1/4 border-r border-slate-200 p-4 bg-slate-50/50 rounded-l-lg">
            <h2 className="text-lg font-bold text-slate-800 mb-6 px-2">Settings</h2>
            <nav className="flex flex-col gap-1">
                {navItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === item.id 
                            ? 'bg-sky-100 text-sky-700'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
        <main className="w-3/4 p-8 overflow-y-auto relative">
             <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-200" aria-label="Close">
                <XMarkIcon className="w-6 h-6 text-slate-600" />
            </button>
            {activeTab === 'api-key' && <ApiKeySettings />}
            {activeTab === 'tags' && <TagManagementSettings />}
        </main>
      </div>
    </div>
    )
};

export default SettingsModal;