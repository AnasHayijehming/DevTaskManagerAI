import * as geminiService from './geminiService';
import * as openAiService from './openAiService';
import { AiProvider, AI_PROVIDER_STORAGE_KEY } from '../hooks/useAiProvider';
import { RequirementChatMessage } from '../types';

const getProvider = (): AiProvider => {
    try {
        return (localStorage.getItem(AI_PROVIDER_STORAGE_KEY) as AiProvider) || 'gemini';
    } catch {
        return 'gemini';
    }
};

export const isApiKeyAvailable = (): boolean => {
    return getProvider() === 'gemini' 
        ? geminiService.isApiKeyAvailable() 
        : openAiService.isApiKeyAvailable();
};

export const generateTitle = (requirement: string) => {
    return getProvider() === 'gemini'
        ? geminiService.generateTitle(requirement)
        : openAiService.generateTitle(requirement);
};

export const generatePreDevAnalysis = (spec: string) => {
    return getProvider() === 'gemini'
        ? geminiService.generatePreDevAnalysis(spec)
        : openAiService.generatePreDevAnalysis(spec);
};

export const generateTestCases = (spec: string) => {
    return getProvider() === 'gemini'
        ? geminiService.generateTestCases(spec)
        : openAiService.generateTestCases(spec);
};

// This function provides a unified, stateless interface for chat interactions.
// For Gemini, it recreates the chat session from history on each call to abstract away the stateful nature of the Gemini SDK.
// For OpenAI, it simply passes the history to its stateless API.
export const continueRequirementChat = (history: RequirementChatMessage[], newMessage: string) => {
    if (getProvider() === 'gemini') {
        const chat = geminiService.createRequirementChat(history);
        if (!chat) {
            throw new Error("Failed to initialize Gemini Chat. Is the API key correct?");
        }
        return geminiService.continueRequirementChat(chat, newMessage);
    } else {
        return openAiService.continueRequirementChat(history, newMessage);
    }
};
