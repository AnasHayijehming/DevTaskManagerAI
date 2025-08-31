import { PreDevAnalysis, TestCase, TestCaseStatus, RequirementChatMessage } from '../types';
import { OPENAI_API_KEY_STORAGE_KEY } from '../hooks/useOpenAiApiKey';
import { OPENAI_MODEL_STORAGE_KEY } from '../hooks/useOpenAiModelSettings';
import { DEFAULT_OPENAI_MODEL } from '../constants';
import { AiChatResponse } from './geminiService';

const API_URL = 'https://api.openai.com/v1/chat/completions';

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
        throw new Error("OpenAI API Key not set.");
    }

    const body: any = {
        model: getModel(),
        messages: messages,
    };

    if (useJsonFormat) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API Error:", errorData);
        throw new Error(`OpenAI API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
};

const chatSystemInstruction = `You are an expert product manager and software engineer. Your goal is to help a developer clarify a requirement and turn it into a detailed technical specification.

Your process is as follows:
1. You will be given an initial user requirement.
2. Please ask questions to get complete information, but ask them one at a time.
3. Once you have a clear understanding, provide a comprehensive technical specification as the final answer.

Specification requirements:
- The specification should be well-structured, using Markdown for formatting.
- It must include a dedicated section at the end titled "## Edge Cases & Error Handling".
- In this section, you should suggest potential edge cases, failure modes, and error handling scenarios that the developer should consider.

IMPORTANT: You MUST ALWAYS respond in a specific JSON format. Do not add any text outside of the JSON object. Your response MUST be a single JSON object.

- If you are asking a question, use this format:
{"flag": "question", "content": "Your single question here."}

- If you are providing the final technical specification, use this format:
{"flag": "answer", "content": "The complete technical specification here, including the 'Edge Cases & Error Handling' section."}`;

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
        console.error("OpenAI Chat Error or JSON parse error:", error);
        const userFriendlyError = "I'm sorry, but I encountered an issue communicating with the AI. This could be a temporary problem with the API or your API key. Please try again.";
        return {
            flag: 'error',
            content: userFriendlyError
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
        console.error("OpenAI API Error:", error);
        return `Error generating pre-dev analysis: ${error instanceof Error ? error.message : String(error)}`;
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
        console.error("OpenAI API Error:", error);
        return `Error generating test cases: ${error instanceof Error ? error.message : String(error)}`;
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
        console.error("OpenAI API Error (generateTitle):", error);
        return `Error generating title: ${error instanceof Error ? error.message : String(error)}`;
    }
};
