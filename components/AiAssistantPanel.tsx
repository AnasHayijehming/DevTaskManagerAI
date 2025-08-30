

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Chat } from '@google/genai';
import { db } from '../services/db';
import { generatePreDevAnalysis, generateTestCases, createRequirementChat, continueRequirementChat } from '../services/geminiService';
import { DevTaskCardData, RequirementChatMessage } from '../types';
import AiButton from './AiButton';
import { InformationCircleIcon, SparklesIcon, BookOpenIcon } from './icons/Icons';
import ChatInterface from './ChatInterface';
import Spinner from './Spinner';

interface AiAssistantPanelProps {
  activeTab: string;
  cardData: DevTaskCardData;
  onUpdate: (data: Partial<DevTaskCardData>) => void;
}

const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({ activeTab, cardData, onUpdate }) => {
  const [isAiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [isChatLoading, setChatLoading] = useState(false);

  const allKnowledgeFiles = useLiveQuery(() => db.knowledgeFiles.toArray(), []);

  useEffect(() => {
    const history = cardData.requirementChatHistory || [];
    if (history.length > 0) {
        const isSpecGeneratedMessage = (msg: RequirementChatMessage) => msg.role === 'model' && msg.text.includes('**Specification Generated**');
        const specGenerated = history.some(isSpecGeneratedMessage);

        if (!specGenerated) {
            const lastMessage = history[history.length - 1];
            if (lastMessage && lastMessage.role === 'model' && !lastMessage.isError) {
                const newChat = createRequirementChat(history);
                setChat(newChat);
            }
        } else {
            setChat(null);
        }
    } else {
        setChat(null);
    }
  }, [cardData.requirementChatHistory]); 

  const augmentPromptWithContext = async (originalPrompt: string): Promise<string> => {
    if (!cardData.knowledgeFileIds || cardData.knowledgeFileIds.length === 0 || !allKnowledgeFiles) {
      return originalPrompt;
    }

    const filesToInclude = allKnowledgeFiles.filter(file => cardData.knowledgeFileIds.includes(file.id));
    
    if (filesToInclude.length === 0) {
      return originalPrompt;
    }

    const contextHeader = "Here is some context from my knowledge base. Please use this information as the primary source of truth when answering my request.\n\n";
    
    const contextContent = filesToInclude.map(file => 
      `--- CONTEXT FROM FILE: ${file.name} ---\n${file.content}\n--- END OF CONTEXT FROM FILE: ${file.name} ---`
    ).join('\n\n');

    return `${contextHeader}${contextContent}\n\nNow, here is my original request:\n\n${originalPrompt}`;
  };

  const handleStartChat = async () => {
    if (!cardData.requirement) {
      alert("Please fill in the requirement first.");
      return;
    }
    setChatLoading(true);
    const newChat = createRequirementChat();
    setChat(newChat);

    let fullContext = `Task Title: ${cardData.title || 'Untitled'}\n\n`;
    fullContext += `Requirement:\n---\n${cardData.requirement}\n---\n\n`;
    
    const initialUserMessage = `Here is the complete context for a task I want to build. Please analyze all of it, ask clarifying questions if needed, and then generate a comprehensive technical spec: \n\n${fullContext}`;
    const initialHistory: RequirementChatMessage[] = [{ role: 'user', text: cardData.requirement }];
    onUpdate({ requirementChatHistory: initialHistory });

    try {
        const augmentedMessage = await augmentPromptWithContext(initialUserMessage);
        const response = await continueRequirementChat(newChat, augmentedMessage);
        
        const newMessages: RequirementChatMessage[] = [{ role: 'model', text: response.content, isError: response.flag === 'error' }];

        if (response.flag === 'answer') {
            onUpdate({ spec: response.content });
            setChat(null);
            newMessages.push({ role: 'model', text: `**Specification Generated**` });
        }
        onUpdate({ requirementChatHistory: [...initialHistory, ...newMessages] });

    } catch (e) {
        console.error("Error starting chat:", e);
        const errorMessage: RequirementChatMessage = { role: 'model', text: "An unexpected error occurred. Please try again.", isError: true };
        onUpdate({ requirementChatHistory: [...initialHistory, errorMessage] });
    } finally {
        setChatLoading(false);
    }
  };

  const handleContinueChat = async (message: string) => {
    if (!chat) return;

    setChatLoading(true);
    const userMessage: RequirementChatMessage = { role: 'user', text: message };
    const historyWithUserMessage = [...(cardData.requirementChatHistory || []), userMessage];
    onUpdate({ requirementChatHistory: historyWithUserMessage });

    try {
        const augmentedMessage = await augmentPromptWithContext(message);
        const response = await continueRequirementChat(chat, augmentedMessage);
        const modelMessages: RequirementChatMessage[] = [{ role: 'model', text: response.content, isError: response.flag === 'error' }];

        if (response.flag === 'answer') {
            onUpdate({ spec: response.content });
            setChat(null);
            modelMessages.push({ role: 'model', text: `**Specification Generated**` });
        }

        const finalHistory = [...historyWithUserMessage, ...modelMessages];
        onUpdate({ requirementChatHistory: finalHistory });

    } catch (e) {
        console.error("Error continuing chat:", e);
        const errorMessage: RequirementChatMessage = { role: 'model', text: "An unexpected error occurred. Please try again.", isError: true };
        const historyWithError = [...historyWithUserMessage, errorMessage];
        onUpdate({ requirementChatHistory: historyWithError });
    } finally {
        setChatLoading(false);
    }
  };
  
  const handleGeneratePreDev = async () => {
    if (!cardData.spec) { alert("Please generate or write a spec first."); return; }
    setAiLoading(prev => ({...prev, predev: true}));
    try {
        const augmentedSpec = await augmentPromptWithContext(cardData.spec);
        const preDev = await generatePreDevAnalysis(augmentedSpec);
        if (typeof preDev === 'string') {
            alert(preDev);
        } else {
            onUpdate({ preDevAnalysis: preDev });
        }
    } catch(e) {
        console.error("AI pre-dev failed", e);
        alert("An error occurred while communicating with the AI.");
    } finally {
        setAiLoading(prev => ({...prev, predev: false}));
    }
  };

  const handleGenerateTestCases = async () => {
    if (!cardData.spec) { alert("Please generate or write a spec first."); return; }
    setAiLoading(prev => ({...prev, testcases: true}));
    try {
        const augmentedSpec = await augmentPromptWithContext(cardData.spec);
        const testCases = await generateTestCases(augmentedSpec);
        if (typeof testCases === 'string') {
            alert(testCases);
        } else {
            onUpdate({ testCases: [...cardData.testCases, ...testCases] });
        }
    } catch(e) {
        console.error("AI test cases failed", e);
        alert("An error occurred while communicating with the AI.");
    } finally {
        setAiLoading(prev => ({...prev, testcases: false}));
    }
  };

  const ActionPanel = ({ title, description, buttonText, onAction, isLoading, disabled }: {
      title: string;
      description: string;
      buttonText: string;
      onAction: () => void;
      isLoading?: boolean;
      disabled?: boolean;
  }) => (
      <div className="flex flex-col items-center justify-center text-center h-full gap-4 p-6 bg-slate-100/80 rounded-xl border border-slate-200">
          <div className="p-4 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-full border border-slate-200 shadow-sm">
               <SparklesIcon className="w-8 h-8 text-sky-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-semibold text-slate-800">{title}</h4>
            <p className="text-sm text-slate-600 max-w-xs">{description}</p>
          </div>
          <div className="mt-2">
              <AiButton 
                  text={buttonText} 
                  onClick={onAction} 
                  isLoading={isLoading} 
                  disabled={disabled}
              />
          </div>
      </div>
  );
  
  const InfoPanel = ({ text }: { text: string }) => (
      <div className="flex flex-col items-center justify-center text-center h-full gap-4 p-6 bg-slate-100/80 rounded-xl border border-slate-200">
          <div className="p-3 bg-white rounded-full border border-slate-200 shadow-sm">
               <InformationCircleIcon className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 max-w-xs">{text}</p>
      </div>
  );
  
  const ContextSelector: React.FC = () => {
    const handleToggleFile = (fileId: number) => {
      const currentIds = cardData.knowledgeFileIds || [];
      const newIds = currentIds.includes(fileId)
        ? currentIds.filter(id => id !== fileId)
        : [...currentIds, fileId];
      onUpdate({ knowledgeFileIds: newIds });
    };

    if (!allKnowledgeFiles) {
        return <div className="text-center p-4"><Spinner /></div>;
    }
    
    if(allKnowledgeFiles.length === 0) {
        return (
            <div className="text-center p-4 text-sm text-slate-500 bg-slate-50 rounded-lg">
                Your knowledge base is empty. Go to the Knowledge Base manager to upload files.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {allKnowledgeFiles.map(file => (
                <label key={file.id} className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-200 ${cardData.knowledgeFileIds?.includes(file.id) ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200' : 'bg-white border-slate-200'}`}>
                    <input 
                        type="checkbox"
                        checked={cardData.knowledgeFileIds?.includes(file.id) ?? false}
                        onChange={() => handleToggleFile(file.id)}
                        className="h-4 w-4 rounded border-slate-400 text-sky-600 focus:ring-sky-500 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-slate-800 break-all">{file.name}</span>
                </label>
            ))}
        </div>
    );
  };

  const renderActionContent = () => {
    const isSpecGenerated = (cardData.requirementChatHistory || []).some(
        msg => msg.role === 'model' && msg.text.includes('**Specification Generated**')
    );

    switch (activeTab) {
      case 'Requirement & Spec':
        return (
          <div className="flex flex-col flex-grow min-h-0 gap-4">
            <div className="flex justify-center flex-shrink-0">
              <AiButton 
                text="Clarify & Generate Spec" 
                onClick={handleStartChat} 
                isLoading={isChatLoading} 
                disabled={!!chat || isSpecGenerated}
              />
            </div>
            <ChatInterface
              history={cardData.requirementChatHistory || []}
              isLoading={isChatLoading}
              onSendMessage={handleContinueChat}
              isChatActive={!!chat}
            />
          </div>
        );
      case 'Pre-Dev':
        return (
            <ActionPanel 
                title="Pre-Dev Analysis"
                description="Generates an introduction, impact analysis, coding approach, and testing strategy based on the technical spec."
                buttonText="Generate Analysis"
                onAction={handleGeneratePreDev}
                isLoading={isAiLoading['predev']}
                disabled={!cardData.spec}
            />
        );
      case 'Test Cases':
        return (
            <ActionPanel 
                title="Test Cases"
                description="Generates relevant test cases from the technical specification to help ensure comprehensive test coverage."
                buttonText="Generate Test Cases"
                onAction={handleGenerateTestCases}
                isLoading={isAiLoading['testcases']}
                disabled={!cardData.spec}
            />
        );
      case 'Markdown Preview':
        return (
            <InfoPanel 
                text="This is a preview of your task documentation. No AI actions are available on this tab." 
            />
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-96 flex-shrink-0 border-l border-slate-200 bg-white p-4 flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-800 text-center mb-0 flex-shrink-0">AI Assistant</h3>
      <div className="flex-grow flex flex-col gap-4 min-h-0">
        
        <div className="flex-shrink-0">
             <div className="flex items-center gap-2 text-md font-semibold text-slate-700 mb-2">
                <BookOpenIcon className="w-5 h-5" />
                <span>Attach Context Files</span>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
                <ContextSelector />
            </div>
        </div>

        <div className="w-full h-px bg-slate-200"></div>

        <div className="flex-grow flex flex-col min-h-0">
             {renderActionContent()}
        </div>
      </div>
    </aside>
  );
};

export default AiAssistantPanel;