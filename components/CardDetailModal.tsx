import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DevTaskCard, Status, DevTaskCardData, PreDevAnalysis, TestCase, Tag } from '../types';
import { TABS, TAG_COLOR_CLASSES } from '../constants';
import { generateTitle } from '../services/aiService';
import Tooltip from './Tooltip';

import TabButton from './TabButton';
import TestCasesEditor from './TestCasesEditor';
import { TrashIcon, XMarkIcon, ArrowDownTrayIcon, CheckIcon, PlusIcon, SparklesIcon } from './icons/Icons';
import Spinner from './Spinner';

// New component imports
import RequirementSpecTab from './RequirementSpecTab';
import PreDevTab from './PreDevTab';
import MarkdownPreviewTab from './MarkdownPreviewTab';
import AiAssistantPanel from './AiAssistantPanel';

interface CardDetailModalProps {
  card: DevTaskCard;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<DevTaskCardData>) => void;
  onDelete: (id: number) => void;
  allTags: Tag[];
  onOpenSettingsModal: (tab: 'api-key' | 'tags') => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved';
const SAVED_STATE_DURATION = 2000;

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
        <Spinner className="w-4 h-4" />
        <span>Saving...</span>
      </div>
    );
  }
  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckIcon className="w-5 h-5" />
        <span>All changes saved</span>
      </div>
    );
  }
  return null;
};

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose, onUpdate, onDelete, allTags, onOpenSettingsModal }) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [localCard, setLocalCard] = useState<DevTaskCard>(card);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isTagSelectorOpen, setTagSelectorOpen] = useState(false);
  const tagSelectorRef = useRef<HTMLDivElement>(null);
  const [isTitleGenerating, setIsTitleGenerating] = useState(false);

  
  const hasUnsavedChanges = useMemo(() => JSON.stringify(localCard) !== JSON.stringify(card), [localCard, card]);

  // Reset local state when the card prop changes
  useEffect(() => {
    setLocalCard(card);
    // Reset tab to default when a new card is opened
    setActiveTab(TABS[0]);
  }, [card]);

  const saveChanges = useCallback(async (cardToSave: DevTaskCard) => {
    setSaveStatus('saving');
    const { id, ...dataToUpdate } = cardToSave;
    try {
        await onUpdate(id, dataToUpdate);
        setSaveStatus('saved');
    } catch (error) {
        console.error("Failed to save card:", error);
        setSaveStatus('idle');
    }
  }, [onUpdate]);

  const handleManualSave = useCallback(() => {
    if (hasUnsavedChanges) {
        saveChanges(localCard);
    }
  }, [hasUnsavedChanges, localCard, saveChanges]);

  // Effect to make 'saved' status temporary
  useEffect(() => {
    if (saveStatus === 'saved') {
        const timer = setTimeout(() => setSaveStatus('idle'), SAVED_STATE_DURATION);
        return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Close tag selector on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
        setTagSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (updates: Partial<DevTaskCardData>) => {
    setLocalCard(currentCard => {
      const newCardState = { ...currentCard, ...updates };
      // Auto-save chat history changes immediately
      if (updates.requirementChatHistory) {
        saveChanges(newCardState);
      }
      return newCardState;
    });
  };

  const handlePreDevChange = (field: keyof PreDevAnalysis, value: string) => {
    setLocalCard(c => ({...c, preDevAnalysis: {...c.preDevAnalysis, [field]: value}}));
  };
  
  const handleTestCasesChange = (newTestCases: TestCase[]) => {
    setLocalCard(c => ({...c, testCases: newTestCases}));
  };

  const handleToggleTag = (tagId: number) => {
    const currentTagIds = localCard.tagIds || [];
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter(id => id !== tagId)
      : [...currentTagIds, tagId];
    handleFieldChange({ tagIds: newTagIds });
  };

  const handleGenerateTitle = async () => {
    if (!localCard.requirement.trim()) {
      alert("Please write a requirement before generating a title.");
      return;
    }
    setIsTitleGenerating(true);
    try {
      const result = await generateTitle(localCard.requirement);
      if (result.startsWith("Error") || result.includes("API Key not set")) {
        alert(result);
      } else {
        handleFieldChange({ title: result });
      }
    } catch (error) {
      console.error("Failed to generate title:", error);
      alert("An unexpected error occurred while generating the title.");
    } finally {
      setIsTitleGenerating(false);
    }
  };
  
  const cardTags = useMemo(() => {
    const cardTagIds = new Set(localCard.tagIds || []);
    return allTags.filter(tag => cardTagIds.has(tag.id));
  }, [localCard.tagIds, allTags]);

  const availableTags = useMemo(() => {
    const cardTagIds = new Set(localCard.tagIds || []);
    return allTags.filter(tag => !cardTagIds.has(tag.id)).sort((a,b) => a.name.localeCompare(b.name));
  }, [localCard.tagIds, allTags]);


  const markdownContent = useMemo(() => `
# ${localCard.title}

- **Status:** ${localCard.status}
- **Reference:** ${localCard.referenceLink ? `[${localCard.referenceLink}](${localCard.referenceLink})` : 'N/A'}

---

## 1. Requirement
${localCard.requirement || 'Not specified.'}

---

## 2. Specification
${localCard.spec || 'Not specified.'}

---

## 3. Pre-Development Analysis

### Introduction
${localCard.preDevAnalysis.introduction || 'Not specified.'}

### Impact Analysis
${localCard.preDevAnalysis.impactAnalysis || 'Not specified.'}

### How to Code
${localCard.preDevAnalysis.howToCode || 'Not specified.'}

### Test Approach
${localCard.preDevAnalysis.testApproach || 'Not specified.'}

---

## 4. Test Cases
${localCard.testCases.length > 0 ? localCard.testCases.map((tc, i) => `
**Test Case ${i + 1} (${tc.status})**
- **Description:** ${tc.description || 'N/A'}
- **Input:** ${tc.input || 'N/A'}
- **Expected Result:** ${tc.expectedResult || 'N/A'}
`).join('\n---\n') : 'No test cases specified.'}
  `, [localCard]);

  const renderActiveTabContent = () => {
    switch(activeTab) {
      case 'Requirement & Spec':
        return (
          <RequirementSpecTab
            requirement={localCard.requirement}
            referenceLink={localCard.referenceLink}
            spec={localCard.spec}
            onRequirementChange={value => handleFieldChange({ requirement: value })}
            onReferenceLinkChange={value => handleFieldChange({ referenceLink: value })}
            onSpecChange={value => handleFieldChange({ spec: value })}
          />
        );
      case 'Pre-Dev':
        return (
          <PreDevTab
            preDevAnalysis={localCard.preDevAnalysis}
            onPreDevChange={handlePreDevChange}
          />
        );
      case 'Test Cases':
        return (
          <TestCasesEditor
            testCases={localCard.testCases}
            onChange={handleTestCasesChange}
          />
        );
      case 'Markdown Preview':
        return <MarkdownPreviewTab markdownContent={markdownContent} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden border border-slate-300" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-grow min-w-0">
               <div className="relative">
                 <input 
                    type="text"
                    value={localCard.title}
                    onChange={e => handleFieldChange({ title: e.target.value })}
                    className="text-xl font-bold text-slate-900 bg-transparent focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-md px-2 py-1 w-full pr-10"
                    placeholder="Card Title"
                 />
                 <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <Tooltip text={!localCard.requirement.trim() ? "Add a requirement to generate a title" : "Generate title with AI"}>
                        <button
                            onClick={handleGenerateTitle}
                            disabled={!localCard.requirement.trim() || isTitleGenerating}
                            className="p-1 text-sky-500 rounded-full hover:bg-sky-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                            aria-label="Generate title with AI"
                        >
                            {isTitleGenerating ? <Spinner className="w-5 h-5 text-slate-500" /> : <SparklesIcon className="w-5 h-5" />}
                        </button>
                    </Tooltip>
                 </div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap pl-2">
                {cardTags.map(tag => {
                  const colorClasses = TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.slate;
                  return (
                    <span key={tag.id} className={`inline-flex items-center font-medium rounded-full whitespace-nowrap text-xs px-2 py-0.5 ${colorClasses.bg} ${colorClasses.text}`}>
                      {tag.name}
                      <button
                        onClick={() => handleToggleTag(tag.id)}
                        className={`ml-1.5 -mr-0.5 p-0.5 rounded-full ${colorClasses.hoverBg} ${colorClasses.hoverText}`}
                        aria-label={`Remove tag ${tag.name}`}
                      >
                        <XMarkIcon className="w-3 h-3"/>
                      </button>
                    </span>
                  )
                })}

                <div className="relative" ref={tagSelectorRef}>
                  <button
                    onClick={() => setTagSelectorOpen(prev => !prev)}
                    className="p-1 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
                    aria-label="Add tag"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  {isTagSelectorOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-60 overflow-y-auto">
                      {availableTags.length > 0 ? availableTags.map(tag => {
                        const colorClasses = TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.slate;
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag.id)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2"
                          >
                            <span className={`w-3 h-3 rounded-full ${colorClasses.bg}`}></span>
                            <span className="text-sm font-medium text-slate-800">{tag.name}</span>
                          </button>
                        );
                      }) : <div className="p-3 text-sm text-slate-500">No other tags available.</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-44 h-8 flex items-center justify-end">
                  <SaveStatusIndicator status={saveStatus} />
                </div>
                <button
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Save Changes</span>
                </button>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <select
                  value={localCard.status}
                  onChange={e => handleFieldChange({ status: e.target.value as Status })}
                  className={`px-3 py-2 rounded-md text-sm font-medium border border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 bg-white shadow-sm`}
                >
                  {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => onDelete(card.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"><XMarkIcon/></button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <nav className="flex items-center gap-2 -mb-px">
                {TABS.map(tab => (
                    <TabButton key={tab} label={tab} isActive={activeTab === tab} onClick={() => setActiveTab(tab)} />
                ))}
                </nav>
            </div>
            <main className="p-6 sm:p-8 flex-1">
                {renderActiveTabContent()}
            </main>
          </div>
          
          <AiAssistantPanel 
            key={card.id}
            activeTab={activeTab}
            cardData={localCard}
            onUpdate={handleFieldChange}
            onOpenSettingsModal={onOpenSettingsModal}
          />
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
