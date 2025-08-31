import { PreDevAnalysis, TestCase, TestCaseStatus, RequirementChatMessage } from '../types';
import { OPENAI_API_KEY_STORAGE_KEY } from '../hooks/useOpenAiApiKey';
import { OPENAI_MODEL_STORAGE_KEY } from '../hooks/useOpenAiModelSettings';
import { DEFAULT_OPENAI_MODEL } from '../constants';
import { AiChatResponse } from './geminiService';

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

const chatSystemInstruction = `You are an expert product manager and software engineer. Your goal is to help a developer clarify a requirement and turn it into a detailed technical specification.

You will follow a systematic 7-stage process to ensure the highest quality output:

**Stage 1: Requirements Analysis**
- Deeply analyze the initial user requirement to understand its core purpose and potential ambiguities.

**Stage 2: Information Gathering (Q&A)**
- If the requirement is unclear or incomplete, ask clarifying questions.
- Ask one question at a time to avoid overwhelming the user.

**Stage 3: Specification Drafting**
- Once you have all necessary information, draft a comprehensive technical specification.
- The specification should be well-structured, using Markdown for formatting.

**Stage 4: Self-Review & Validation**
- Internally review the drafted specification against the user's requirements (both initial and clarified).
- Check for clarity, completeness, and technical feasibility.
- Ensure all constraints and goals are met.

**Stage 5: Issue Resolution**
- Based on your self-review, refine the specification.
- Correct any inconsistencies, add missing details, and improve the overall structure.
- **Crucially, the spec must include a dedicated section at the end titled "## Edge Cases & Error Handling".** This section should detail potential edge cases, failure modes, and error handling scenarios.

**Stage 6 & 7: Human Review Preparation & Final Documentation**
- Format the final, validated specification clearly for human review. This is your final output.

**Output Format:**
You MUST ALWAYS respond in a specific JSON format. Do not add any text outside of the JSON object. Your response MUST be a single JSON object.

- For **Stage 2 (Q&A)**, use this format:
{"flag": "question", "content": "Your single question here."}

- For **Stage 7 (Final Documentation)**, use this format:
{"flag": "answer", "content": "The complete, validated technical specification, including the 'Edge Cases & Error Handling' section."}`;

export const continueRequirementChat = async (history: RequirementChatMessage[], newMessage: string): Promise<AiChatResponse> => {
    try {
        const messages: OpenAiMessage[] = [
            { role: 'system', content: chatSystemInstruction },
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
    const systemPrompt = `You are a helpful assistant. Based on the provided technical specification, generate a comprehensive pre-development analysis.
    You MUST provide the output as a JSON object with the following keys: "introduction", "impactAnalysis", "howToCode", "testApproach".`;
    
    try {
        const responseText = await callOpenAiApi([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: spec }
        ], true);
        return JSON.parse(responseText) as PreDevAnalysis;
    } catch (error) {
        return handleOpenAiError(error, 'Pre-Dev Analysis');
    }
};

export const generateTestCases = async (spec: string): Promise<TestCase[] | string> => {
    const systemPrompt = `You are a helpful assistant. Based on the provided technical specification, generate between 5 and 10 relevant test cases.
    You MUST provide the output as a JSON array of objects, where each object has the following keys: "description", "input", "expectedResult".`;

    try {
        const responseText = await callOpenAiApi([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: spec }
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
    const systemPrompt = `Based on the following requirement, generate a short, descriptive title for a development task (under 10 words).
    Return only the title text, with no extra formatting, quotation marks, or labels like "Title:".`;

    try {
        const responseText = await callOpenAiApi([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: requirement }
        ]);
        return responseText.trim().replace(/^"|"$/g, '');
    } catch (error) {
        return handleOpenAiError(error, 'Title Generation');
    }
};