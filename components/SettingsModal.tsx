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
import { usePromptSettings, PromptKeys } from '../hooks/usePromptSettings';
import { TAG_COLORS, TAG_COLOR_CLASSES, GEMINI_MODELS, OPENAI_MODELS } from '../constants';
import { XMarkIcon, TrashIcon, KeyIcon, TagIcon, EyeIcon, EyeSlashIcon, CpuChipIcon, DocumentTextIcon } from './icons/Icons';

type SettingsTab = 'api-key' | 'tags' | 'prompts';

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsTab;
}

const SettingsSection: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`p-6 bg-slate-50/70 border border-slate-200/80 rounded-xl ${className}`}>
      {children}
    </div>
);

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
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }> = ({ value, onChange, min = 0, max = 1, step = 0.1 }) => (
    <div className="flex items-center gap-4">
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 rounded-md px-2 py-1 w-16 text-center">
            {value.toFixed(1)}
        </span>
    </div>
  );

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <CpuChipIcon />
                <span>AI Provider</span>
            </h3>
            <p className="text-slate-500 mb-4 text-sm">
                Choose your preferred AI provider for all generative features.
            </p>
            <SettingsSection>
                <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-lg max-w-sm">
                    {(['gemini', 'openai'] as AiProvider[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setProvider(p)}
                            className={`w-1/2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                                provider === p
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'bg-transparent text-slate-600 hover:bg-white/60'
                            }`}
                        >
                            {p === 'gemini' ? 'Google Gemini' : 'OpenAI (ChatGPT)'}
                        </button>
                    ))}
                </div>
            </SettingsSection>
        </div>

        {provider === 'gemini' && (
            <div className="animate-fade-in space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Google Gemini Settings</h3>
                    <p className="text-slate-500 mb-4 text-sm">
                        Get your key from Google AI Studio. It's stored securely in your browser's local storage.
                    </p>
                    <SettingsSection>
                        <label htmlFor="gemini-api-key" className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <div className="relative w-full max-w-sm">
                            <input id="gemini-api-key" type={isGeminiKeyVisible ? 'text' : 'password'} value={geminiInputValue} onChange={(e) => setGeminiInputValue(e.target.value)} className="input-field w-full pr-10" placeholder="Enter your Gemini API Key"/>
                            <button type="button" onClick={() => setIsGeminiKeyVisible(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700" aria-label="Toggle key visibility">
                                {isGeminiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                            <button onClick={() => handleSaveKey('gemini')} className="btn-primary">Save Key</button>
                            {saveFeedback && <span className="text-sm text-emerald-600 font-medium">{saveFeedback}</span>}
                        </div>
                    </SettingsSection>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Model Configuration</h4>
                    <SettingsSection>
                        <fieldset className="space-y-2 max-w-sm">
                            {GEMINI_MODELS.map((m) => (
                                <label key={m.id} className={`flex p-3 border rounded-lg cursor-pointer transition-colors ${geminiModel === m.id ? 'active-selection' : 'inactive-selection'}`}>
                                    <input type="radio" name="gemini-model" value={m.id} checked={geminiModel === m.id} onChange={() => saveGeminiModel(m.id)} className="h-4 w-4 mt-1 radio-input"/>
                                    <div className="ml-3 text-sm">
                                        <span className="font-semibold text-slate-800">{m.name}</span>
                                        <p className="text-slate-500">{m.description}</p>
                                    </div>
                                </label>
                            ))}
                        </fieldset>
                    </SettingsSection>
                </div>
          
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Creativity (Temperature)</h4>
                     <SettingsSection>
                        <p className="text-slate-500 mb-3 text-sm">Controls randomness. Lower values are more deterministic, higher values are more creative.</p>
                        <TemperatureSlider value={geminiTemperature} onChange={saveGeminiTemperature} max={1.0} />
                     </SettingsSection>
                </div>
            </div>
        )}

        {provider === 'openai' && (
             <div className="animate-fade-in space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">OpenAI (ChatGPT) Settings</h3>
                    <p className="text-slate-500 mb-4 text-sm">
                        Get your key from your OpenAI account. It's stored securely in your browser's local storage.
                    </p>
                    <SettingsSection>
                        <label htmlFor="openai-api-key" className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <div className="relative w-full max-w-sm">
                            <input id="openai-api-key" type={isOpenAiKeyVisible ? 'text' : 'password'} value={openAiInputValue} onChange={(e) => setOpenAiInputValue(e.target.value)} className="input-field w-full pr-10" placeholder="Enter your OpenAI API Key"/>
                            <button type="button" onClick={() => setIsOpenAiKeyVisible(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700" aria-label="Toggle key visibility">
                                {isOpenAiKeyVisible ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                            <button onClick={() => handleSaveKey('openai')} className="btn-primary">Save Key</button>
                            {saveFeedback && <span className="text-sm text-emerald-600 font-medium">{saveFeedback}</span>}
                        </div>
                    </SettingsSection>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Model Configuration</h4>
                    <SettingsSection>
                        <fieldset className="space-y-2 max-w-sm">
                            {OPENAI_MODELS.map((m) => (
                                <label key={m.id} className={`flex p-3 border rounded-lg cursor-pointer transition-colors ${openAiModel === m.id ? 'active-selection' : 'inactive-selection'}`}>
                                    <input type="radio" name="openai-model" value={m.id} checked={openAiModel === m.id} onChange={() => saveOpenAiModel(m.id)} className="h-4 w-4 mt-1 radio-input"/>
                                    <div className="ml-3 text-sm">
                                        <span className="font-semibold text-slate-800">{m.name}</span>
                                        <p className="text-slate-500">{m.description}</p>
                                    </div>
                                </label>
                            ))}
                        </fieldset>
                    </SettingsSection>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Creativity (Temperature)</h4>
                    <SettingsSection>
                        <p className="text-slate-500 mb-3 text-sm">Controls randomness. Lower values are more deterministic, higher values are more creative.</p>
                        <TemperatureSlider value={openAiTemperature} onChange={saveOpenAiTemperature} max={2.0} />
                    </SettingsSection>
                </div>
            </div>
        )}
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
            <h3 className="text-xl font-bold text-slate-900 mb-1">Manage Tags</h3>
            <p className="text-slate-500 mb-4 text-sm">
                Create and delete tags to assign to your task cards for better organization.
            </p>
             <SettingsSection>
                 <form onSubmit={handleAddTag} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                        type="text"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="New tag name..."
                        className="input-field flex-grow"
                        maxLength={25}
                        />
                        <button type="submit" className="btn-primary flex-shrink-0">
                        Add Tag
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {TAG_COLORS.map(color => (
                        <button
                            type="button"
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-7 h-7 rounded-full transition-transform transform hover:scale-110 ${TAG_COLOR_CLASSES[color].bg} ${selectedColor === color ? 'ring-2 ring-offset-1 ring-brand-primary' : ''}`}
                            aria-label={`Select color ${color}`}
                        />
                        ))}
                    </div>
                </form>
             </SettingsSection>
            
            <h4 className="text-lg font-semibold text-slate-800 mt-8 mb-4">Existing Tags</h4>
            <div className="flex flex-wrap gap-2 p-1">
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

const PromptManagementSettings: React.FC = () => {
    const { prompts, saveAllPrompts, resetAllPrompts } = usePromptSettings();
    const [localPrompts, setLocalPrompts] = useState(prompts);
    const [saveFeedback, setSaveFeedback] = useState('');
    const [activePromptTab, setActivePromptTab] = useState<PromptKeys>('chatSystemInstruction');

    useEffect(() => {
        setLocalPrompts(prompts);
    }, [prompts]);

    const handlePromptChange = (key: PromptKeys, value: string) => {
        setLocalPrompts(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        saveAllPrompts(localPrompts);
        setSaveFeedback('Prompts saved successfully!');
        setTimeout(() => setSaveFeedback(''), 2000);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all prompts to their default values? This action cannot be undone.')) {
            resetAllPrompts();
        }
    };
    
    const hasChanges = JSON.stringify(localPrompts) !== JSON.stringify(prompts);
    
    const promptDetails: { key: PromptKeys, title: string, description: string }[] = [
        { key: 'chatSystemInstruction', title: 'Spec Generation Chat', description: 'The system instruction for the AI during the interactive spec generation chat. This defines the AI\'s persona and process.' },
        { key: 'preDevAnalysis', title: 'Pre-Dev Analysis', description: 'Prompt to generate the pre-dev analysis. Use {spec} as a placeholder for the spec content. Ensure it requests JSON output.' },
        { key: 'testCases', title: 'Test Case Generation', description: 'Prompt to generate test cases. Use {spec} as a placeholder for the spec content. Ensure it requests a JSON array.' },
        { key: 'titleGeneration', title: 'Title Generation', description: 'Prompt to generate a card title from a requirement. Use {requirement} as a placeholder for the requirement content.' },
    ];
    
    const activePromptDetails = promptDetails.find(p => p.key === activePromptTab)!;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Manage AI Prompts</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Customize the instructions given to the AI for different tasks.
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                    {saveFeedback && <span className="text-sm text-emerald-600 font-medium animate-fade-in">{saveFeedback}</span>}
                    <button onClick={handleReset} className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Reset All</button>
                    <button onClick={handleSave} disabled={!hasChanges} className="btn-primary">Save All Prompts</button>
                </div>
            </div>
            <div className="flex gap-8">
                 <nav className="flex flex-col gap-2 w-1/4">
                    {promptDetails.map(({ key, title }) => (
                        <button
                            key={key}
                            onClick={() => setActivePromptTab(key)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activePromptTab === key
                                    ? 'bg-slate-100 text-brand-primary font-semibold'
                                    : 'text-slate-600 hover:bg-slate-100/60'
                            }`}
                        >
                            {title}
                        </button>
                    ))}
                </nav>
                <div className="w-3/4">
                    <div key={activePromptTab} className="animate-fade-in">
                        <h4 className="text-lg font-semibold text-slate-800">{activePromptDetails.title}</h4>
                        <p className="text-slate-500 mb-2 text-sm">{activePromptDetails.description}</p>
                        <textarea
                            value={localPrompts[activePromptTab]}
                            onChange={(e) => handlePromptChange(activePromptTab, e.target.value)}
                            className="w-full h-72 p-3 font-mono text-xs bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500"
                        />
                    </div>
                </div>
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
        { id: 'prompts', label: 'Prompts', icon: <DocumentTextIcon className="w-5 h-5" /> },
    ];

    return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-5xl h-[90vh] max-h-[800px] flex overflow-hidden" onClick={e => e.stopPropagation()}>
        <aside className="w-64 border-r border-slate-200/80 p-6 bg-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-8 px-2">Settings</h2>
            <nav className="flex flex-col gap-2">
                {navItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-4 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === item.id 
                            ? 'bg-white text-brand-primary font-semibold shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto relative bg-white">
             <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="Close">
                <XMarkIcon className="w-6 h-6" />
            </button>
            {activeTab === 'api-key' && <ApiKeyAndModelSettings />}
            {activeTab === 'tags' && <TagManagementSettings />}
            {activeTab === 'prompts' && <PromptManagementSettings />}
            <style>{`
              .btn-primary { @apply px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-slate-400 disabled:shadow-sm disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:-translate-y-px; }
              .input-field { @apply bg-white px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500; }
              .radio-input { @apply text-brand-primary focus:ring-brand-primary/50 border-slate-400; }
              .active-selection { @apply bg-white border-brand-primary ring-2 ring-brand-primary/20; }
              .inactive-selection { @apply bg-white border-slate-300 hover:bg-slate-100/80 hover:border-slate-400; }
              .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
              @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
              
              input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; width: 100%; }
              input[type=range]:focus { outline: none; }
              input[type=range]::-webkit-slider-runnable-track { height: 8px; background: #e2e8f0; border-radius: 4px; }
              input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none; appearance: none;
                margin-top: -4px;
                height: 16px; width: 16px;
                background-color: #ffffff;
                border-radius: 50%;
                border: 2px solid #1e3a8a; /* brand-primary */
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: box-shadow 0.2s;
              }
              input[type=range]:focus::-webkit-slider-thumb { box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.25); }
              input[type=range]::-moz-range-track { height: 8px; background: #e2e8f0; border-radius: 4px; }
              input[type=range]::-moz-range-thumb {
                height: 16px; width: 16px;
                background-color: #ffffff;
                border-radius: 50%;
                border: 2px solid #1e3a8a; /* brand-primary */
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                 transition: box-shadow 0.2s;
              }
               input[type=range]:focus::-moz-range-thumb { box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.25); }
            `}</style>
        </main>
      </div>
    </div>
    )
};

export default SettingsModal;