import { PreDevAnalysis, TestCase, TestCaseStatus, RequirementChatMessage } from '../types';
import { OPENAI_API_KEY_STORAGE_KEY } from '../hooks/useOpenAiApiKey';
import { OPENAI_MODEL_STORAGE_KEY } from '../hooks/useOpenAiModelSettings';
import { DEFAULT_OPENAI_MODEL } from '../constants';
import { AiChatResponse } from './geminiService';
import { getPrompts } from './promptService';

const API_URL = 'https://api.openai.com/v1/chat/completions';

// Define temperature constants directly here
export const OPENAI_TEMPERATURE_STORAGE_KEY = 'openai_temperature';
export const DEFAULT_OPENAI_TEMPERATURE = 0.7;

/**
 * Creates a user-friendly error message from an OpenAI API error.
 * @param {unknown} error - The error caught from the API call.
 * @param {string} context - The context of the action (e.g., 'AI Chat').
 * @returns {string} A user-friendly error message.
 */
function handleOpenAiError(error: unknown, context: string): string {
    console.error(`OpenAI API Error in ${context}:`, error);

    if (error instanceof SyntaxError) {
        return `Error in ${context}: The AI's response was not in the expected format (invalid JSON). Please try again.`;
    }

    if (error instanceof Error) {
        // Messages are already user-friendly from callOpenAiApi
        return `Error in ${context}: ${error.message}`;
    }
    
    return `An unknown error occurred in ${context}.`;
}

const getApiKey = (): string | null => {
    try {
        return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
    } catch (e) {
        console.error("Could not access localStorage", e);
        return null;
    }
};

const getModel = (): string => {
    try {
        return localStorage.getItem(OPENAI_MODEL_STORAGE_KEY) || DEFAULT_OPENAI_MODEL;
    } catch (e) {
        console.error("Could not access localStorage", e);
        return DEFAULT_OPENAI_MODEL;
    }
};

const getTemperature = (): number => {
    try {
        const storedTemp = localStorage.getItem(OPENAI_TEMPERATURE_STORAGE_KEY);
        if (storedTemp) {
            const parsedTemp = parseFloat(storedTemp);
            if (!isNaN(parsedTemp)) return parsedTemp;
        }
        return DEFAULT_OPENAI_TEMPERATURE;
    } catch (e) {
        console.error("Could not access localStorage for temperature", e);
        return DEFAULT_OPENAI_TEMPERATURE;
    }
};

export const isApiKeyAvailable = (): boolean => {
  try {
    return !!localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
  } catch (e) {
    console.error("Could not access localStorage", e);
    return false;
  }
};

type OpenAiMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

const callOpenAiApi = async (messages: OpenAiMessage[], useJsonFormat: boolean = false): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key not set. Please set it in Settings.");
    }

    const body: any = {
        model: getModel(),
        messages: messages,
        temperature: getTemperature(),
    };

    if (useJsonFormat) {
        body.response_format = { type: "json_object" };
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorText = `Request failed with status ${response.status}.`;
            try {
                const errorData = await response.json();
                errorText = errorData.error?.message || JSON.stringify(errorData);
            } catch {
                // Not a JSON response, the text body might be useful
                errorText = await response.text();
            }
            
            switch (response.status) {
                case 401: throw new Error(`Invalid Authentication: Your OpenAI API key is incorrect or has expired.`);
                case 429: throw new Error(`Rate Limit Exceeded: You have exceeded your API quota. Please check your OpenAI account or try again later.`);
                case 500: case 503: throw new Error(`Server Error: OpenAI's servers are currently unavailable. Please try again later.`);
                default: throw new Error(errorText);
            }
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        if (error instanceof TypeError) { // Catches network errors
            throw new Error("Network Error: Could not connect to the API. Please check your internet connection.");
        }
        // Re-throw errors from the response handling above so they can be caught by the handler
        throw error;
    }
};

export const continueRequirementChat = async (history: RequirementChatMessage[], newMessage: string): Promise<AiChatResponse> => {
    try {
        const messages: OpenAiMessage[] = [
            { role: 'system', content: getPrompts().chatSystemInstruction },
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            } as OpenAiMessage)),
            { role: 'user', content: newMessage }
        ];

        const responseText = await callOpenAiApi(messages, true);
        const parsed = JSON.parse(responseText) as AiChatResponse;
        
        if ((parsed.flag === 'question' || parsed.flag === 'answer') && typeof parsed.content === 'string') {
            return parsed;
        } else {
            throw new Error("Invalid JSON structure from AI.");
        }
    } catch (error) {
        return {
            flag: 'error',
            content: handleOpenAiError(error, "AI Chat")
        };
    }
};

export const generatePreDevAnalysis = async (spec: string): Promise<PreDevAnalysis | string> => {
    const userPrompt = getPrompts().preDevAnalysis.replace('{spec}', spec);
    
    try {
        const responseText = await callOpenAiApi([
            { role: 'user', content: userPrompt }
        ], true);
        return JSON.parse(responseText) as PreDevAnalysis;
    } catch (error) {
        return handleOpenAiError(error, 'Pre-Dev Analysis');
    }
};

export const generateTestCases = async (spec: string): Promise<TestCase[] | string> => {
    const userPrompt = getPrompts().testCases.replace('{spec}', spec);

    try {
        const responseText = await callOpenAiApi([
            { role: 'user', content: userPrompt }
        ], true);

        const rawTestCases = JSON.parse(responseText) as Omit<TestCase, 'id' | 'status'>[];
        return rawTestCases.map(tc => ({
            ...tc,
            id: crypto.randomUUID(),
            status: TestCaseStatus.Pending
        }));
    } catch (error) {
        return handleOpenAiError(error, 'Test Cases');
    }
};

export const generateTitle = async (requirement: string): Promise<string> => {
    const userPrompt = getPrompts().titleGeneration.replace('{requirement}', requirement);

    try {
        const responseText = await callOpenAiApi([
            { role: 'user', content: userPrompt }
        ]);
        return responseText.trim().replace(/^"|"$/g, '');
    } catch (error) {
        return handleOpenAiError(error, 'Title Generation');
    }
};