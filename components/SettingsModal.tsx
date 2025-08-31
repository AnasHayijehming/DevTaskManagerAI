import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTag, deleteTag } from '../services/db';
import { useApiKey } from '../hooks/useApiKey';
import { useModelSettings } from '../hooks/useModelSettings';
import { useGeminiTemperature } from '../hooks/useGeminiTemperature';
import { useOpenAiApiKey } from '../hooks/useOpenAiApiKey';
import { useOpenAiModelSettings } from '../hooks/useOpenAiModelSettings';
import { useOpenAiTemperature } from '../hooks/useOpenAiTemperature';
import { useAiProvider, AiProvider } from '../hooks/useAiProvider';
import { TAG_COLORS, TAG_COLOR_CLASSES, GEMINI_MODELS, OPENAI_MODELS } from '../constants';
import { XMarkIcon, TrashIcon, KeyIcon, TagIcon, EyeIcon, EyeSlashIcon, CpuChipIcon } from './icons/Icons';

type SettingsTab = 'api-key' | 'tags';

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsTab;
}

const ApiKeyAndModelSettings: React.FC = () => {
  const [provider, setProvider] = useAiProvider();

  const [geminiApiKey, saveGeminiApiKey] = useApiKey();
  const [geminiModel, saveGeminiModel] = useModelSettings();
  const [geminiTemperature, saveGeminiTemperature] = useGeminiTemperature();
  
  const [openAiApiKey, saveOpenAiApiKey] = useOpenAiApiKey();
  const [openAiModel, saveOpenAiModel] = useOpenAiModelSettings();
  const [openAiTemperature, saveOpenAiTemperature] = useOpenAiTemperature();

  const [geminiInputValue, setGeminiInputValue] = useState(geminiApiKey);
  const [openAiInputValue, setOpenAiInputValue] = useState(openAiApiKey);

  const [isGeminiKeyVisible, setIsGeminiKeyVisible] = useState(false);
  const [isOpenAiKeyVisible, setIsOpenAiKeyVisible] = useState(false);
  
  const [saveFeedback, setSaveFeedback] = useState('');

  const handleSaveKey = (providerToSave: AiProvider) => {
    if (providerToSave === 'gemini') {
        saveGeminiApiKey(geminiInputValue);
    } else {
        saveOpenAiApiKey(openAiInputValue);
    }
    setSaveFeedback(`${providerToSave === 'gemini' ? 'Gemini' : 'OpenAI'} key saved!`);
    setTimeout(() => setSaveFeedback(''), 2000);
  };
  
  const TemperatureSlider: React.FC<{
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }> = ({ label, description, value, onChange, min = 0, max = 1, step = 0.1 }) => (
    <div>
        <h4 className="text-lg font-semibold text-slate-800 mb-2">{label}</h4>
        <p className="text-slate-600 mb-3 text-sm">{description}</p>
        <div className="flex items-center gap-4 max-w-sm">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            />
            <span className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 rounded-md px-2 py-1 w-16 text-center">
                {value.toFixed(1)}
            </span>
        </div>
    </div>
  );

  return (
    <div>
        <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <CpuChipIcon />
                <span>AI Provider</span>
            </h3>
            <p className="text-slate-600 mb-4 text-sm">
                Choose your preferred AI provider for all generative features.
            </p>
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-sm">
                {(['gemini', 'openai'] as AiProvider[]).map(p => (
                    <button
                        key={p}
                        onClick={() => setProvider(p)}
                        className={`w-1/2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
                            provider === p
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'bg-transparent text-slate-600 hover:bg-white/60'
                        }`}
                    >
                        {p === 'gemini' ? 'Google Gemini' : 'OpenAI (ChatGPT)'}
                    </button>
                ))}
            </div>
        </div>

        {provider === 'gemini' && (
            <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Google Gemini Settings</h3>
                <p className="text-slate-600 mb-6 text-sm">
                    Your API key is stored in your browser's local storage. Get your key from Google AI Studio.
                </p>
                <div className="space-y-4 mb-8">
                    <div>
                        <label htmlFor="gemini-api-key" className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <div className="relative w-full max-w-sm">
                            <input id="gemini-api-key" type={isGeminiKeyVisible ? 'text' : 'password'} value={geminiInputValue} onChange={(e) => setGeminiInputValue(e.target.value)} className="w-full input-field pr-10" placeholder="Enter your Gemini API Key"/>
                            <button type="button" onClick={() => setIsGeminiKeyVisible(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700" aria-label="Toggle key visibility">
                                {isGeminiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleSaveKey('gemini')} className="btn-primary">Save Key</button>
                        {saveFeedback && <span className="text-sm text-emerald-600 font-medium">{saveFeedback}</span>}
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Model Configuration</h4>
                    <fieldset className="space-y-2 max-w-sm">
                        {GEMINI_MODELS.map((m) => (
                            <label key={m.id} className={`flex p-3 border rounded-lg cursor-pointer ${geminiModel === m.id ? 'active-selection' : 'inactive-selection'}`}>
                                <input type="radio" name="gemini-model" value={m.id} checked={geminiModel === m.id} onChange={() => saveGeminiModel(m.id)} className="h-4 w-4 mt-1 radio-input"/>
                                <div className="ml-3 text-sm">
                                    <span className="font-semibold text-slate-800">{m.name}</span>
                                    <p className="text-slate-600">{m.description}</p>
                                </div>
                            </label>
                        ))}
                    </fieldset>
                </div>

                <div className="w-full h-px bg-slate-200 my-8"></div>
          
                <TemperatureSlider
                    label="Creativity (Temperature)"
                    description="Controls randomness. Lower values (e.g., 0.2) are more deterministic, while higher values (e.g., 0.9) are more creative."
                    value={geminiTemperature}
                    onChange={saveGeminiTemperature}
                    max={1.0}
                />
            </div>
        )}

        {provider === 'openai' && (
             <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-slate-800 mb-2">OpenAI (ChatGPT) Settings</h3>
                <p className="text-slate-600 mb-6 text-sm">
                    Your API key is stored in your browser's local storage. Get your key from your OpenAI account dashboard.
                </p>
                 <div className="space-y-4 mb-8">
                    <div>
                        <label htmlFor="openai-api-key" className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <div className="relative w-full max-w-sm">
                            <input id="openai-api-key" type={isOpenAiKeyVisible ? 'text' : 'password'} value={openAiInputValue} onChange={(e) => setOpenAiInputValue(e.target.value)} className="w-full input-field pr-10" placeholder="Enter your OpenAI API Key"/>
                            <button type="button" onClick={() => setIsOpenAiKeyVisible(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700" aria-label="Toggle key visibility">
                                {isOpenAiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleSaveKey('openai')} className="btn-primary">Save Key</button>
                        {saveFeedback && <span className="text-sm text-emerald-600 font-medium">{saveFeedback}</span>}
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Model Configuration</h4>
                    <fieldset className="space-y-2 max-w-sm">
                        {OPENAI_MODELS.map((m) => (
                             <label key={m.id} className={`flex p-3 border rounded-lg cursor-pointer ${openAiModel === m.id ? 'active-selection' : 'inactive-selection'}`}>
                                <input type="radio" name="openai-model" value={m.id} checked={openAiModel === m.id} onChange={() => saveOpenAiModel(m.id)} className="h-4 w-4 mt-1 radio-input"/>
                                <div className="ml-3 text-sm">
                                    <span className="font-semibold text-slate-800">{m.name}</span>
                                    <p className="text-slate-600">{m.description}</p>
                                </div>
                            </label>
                        ))}
                    </fieldset>
                </div>

                <div className="w-full h-px bg-slate-200 my-8"></div>

                <TemperatureSlider
                    label="Creativity (Temperature)"
                    description="Controls randomness. Lower values (e.g., 0.2) are more deterministic, while higher values (e.g., 2.0) are more creative."
                    value={openAiTemperature}
                    onChange={saveOpenAiTemperature}
                    max={2.0}
                />
            </div>
        )}
        <style>{`
          .btn-primary { @apply px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors; }
          .input-field { @apply px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500; }
          .radio-input { @apply text-sky-600 focus:ring-sky-500 border-slate-400; }
          .active-selection { @apply bg-sky-50 border-sky-400 ring-2 ring-sky-300/50; }
          .inactive-selection { @apply bg-white border-slate-300 hover:bg-slate-100/80 hover:border-slate-400; }
          .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
          
          input[type=range] {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            cursor: pointer;
            width: 100%;
          }
          input[type=range]:focus {
            outline: none;
          }
          input[type=range]::-webkit-slider-runnable-track {
            height: 8px;
            background: #e2e8f0; /* slate-200 */
            border-radius: 4px;
          }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            margin-top: -4px;
            height: 16px;
            width: 16px;
            background-color: #ffffff;
            border-radius: 50%;
            border: 2px solid #0ea5e9; /* sky-500 */
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          input[type=range]:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4);
          }
          input[type=range]::-moz-range-track {
            height: 8px;
            background: #e2e8f0; /* slate-200 */
            border-radius: 4px;
          }
          input[type=range]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            background-color: #ffffff;
            border-radius: 50%;
            border: 2px solid #0ea5e9; /* sky-500 */
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          input[type=range]:focus::-moz-range-thumb {
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4);
          }
        `}</style>
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
                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors">
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
                    <span key={tag.id} className={`inline-flex items-center font-medium rounded-full whitespace-nowrap text-xs px-2.5 py-1 ${colorClasses.bg} ${colorClasses.text}`}>
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
        { id: 'api-key', label: 'API Key & Model', icon: <KeyIcon className="w-5 h-5"/> },
        { id: 'tags', label: 'Tags', icon: <TagIcon className="w-5 h-5" /> },
    ];

    return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-4xl h-[80vh] flex" onClick={e => e.stopPropagation()}>
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
            {activeTab === 'api-key' && <ApiKeyAndModelSettings />}
            {activeTab === 'tags' && <TagManagementSettings />}
        </main>
      </div>
    </div>
    )
};

export default SettingsModal;