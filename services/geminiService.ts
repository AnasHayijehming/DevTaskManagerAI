import { GoogleGenAI, Type, GenerateContentResponse, Chat, Content } from '@google/genai';
import { PreDevAnalysis, TestCase, TestCaseStatus, RequirementChatMessage } from '../types';
import { API_KEY_STORAGE_KEY } from '../hooks/useApiKey';
import { MODEL_STORAGE_KEY } from '../hooks/useModelSettings';
import { DEFAULT_MODEL } from '../constants';


let aiClient: GoogleGenAI | null = null;
let lastUsedApiKey: string | null = null;

/**
 * Retrieves a cached AI client instance, configured with the API key from local storage.
 * The client is re-initialized only if the API key changes.
 * @returns {GoogleGenAI | null} An initialized GoogleGenAI client or null if the API key is not found.
 */
const getAiClient = (): GoogleGenAI | null => {
    try {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

        if (!apiKey) {
            aiClient = null;
            lastUsedApiKey = null;
            return null;
        }

        // Re-initialize only if API key is different from the one used to create the current client
        if (apiKey !== lastUsedApiKey) {
            aiClient = new GoogleGenAI({ apiKey });
            lastUsedApiKey = apiKey;
        }
        
        return aiClient;
    } catch (e) {
        console.error("Could not access localStorage or initialize AI client", e);
        aiClient = null;
        lastUsedApiKey = null;
        return null;
    }
};

/**
 * Retrieves the selected AI model from local storage.
 * @returns {string} The selected model ID, or the default model if none is set.
 */
const getModel = (): string => {
    try {
        const storedModel = localStorage.getItem(MODEL_STORAGE_KEY);
        return storedModel || DEFAULT_MODEL;
    } catch (e) {
        console.error("Could not access localStorage", e);
        return DEFAULT_MODEL;
    }
};


/**
 * Checks if the Gemini API key is available in local storage.
 * @returns {boolean} True if the API key is set, false otherwise.
 */
export const isApiKeyAvailable = (): boolean => {
  try {
    return !!localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (e) {
    console.error("Could not access localStorage", e);
    return false;
  }
};


export interface AiChatResponse {
  flag: 'question' | 'answer' | 'error';
  content: string;
}

const systemInstruction = `You are an expert product manager and software engineer. Your goal is to help a developer clarify a requirement and turn it into a detailed technical specification.

Your process is as follows:
1. You will be given an initial user requirement. This requirement may be in English or Thai.
2. Please ask questions to get complete information, but ask them one at a time and in Thai.
3. Once you have a clear understanding, provide a comprehensive technical specification as the final answer. **This final specification MUST ALWAYS be in English.**

**Specification requirements:**
- The specification should be well-structured, using Markdown for formatting.
- It **must** include a dedicated section at the end titled "## Edge Cases & Error Handling".
- In this section, you should suggest potential edge cases, failure modes, and error handling scenarios that the developer should consider to make the implementation more robust.

**IMPORTANT:** You MUST ALWAYS respond in a specific JSON format. Do not add any text outside of the JSON object.

- If you are asking a question, use this format (the content can be in Thai if the user initiated in Thai):
{"flag": "question", "content": "Your single question here."}

- If you are providing the final technical specification, use this format (the content MUST be in English):
{"flag": "answer", "content": "The complete technical specification here, including the 'Edge Cases & Error Handling' section."}`;

export const createRequirementChat = (history?: RequirementChatMessage[]): Chat | null => {
  const ai = getAiClient();
  if (!ai) return null;

  const filteredHistory = history?.filter(msg => !msg.text.includes('**Specification Generated**'));

  const geminiHistory: Content[] | undefined = filteredHistory?.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const chat = ai.chats.create({
    model: getModel(),
    history: geminiHistory,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            flag: { type: Type.STRING, enum: ['question', 'answer'] },
            content: { type: Type.STRING }
        },
        required: ['flag', 'content']
      }
    },
  });
  return chat;
};

export const continueRequirementChat = async (
    chat: Chat,
    message: string,
): Promise<AiChatResponse> => {
    try {
        const response = await chat.sendMessage({ message });
        const fullText = response.text;

        const cleanedText = fullText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleanedText) as AiChatResponse;
        
        if ((parsed.flag === 'question' || parsed.flag === 'answer') && typeof parsed.content === 'string') {
            return parsed;
        } else {
            throw new Error("Invalid JSON structure from AI.");
        }
    } catch (error) {
        console.error("Gemini Chat Error or JSON parse error:", error);
        const userFriendlyError = "I'm sorry, but I encountered an issue communicating with the AI. This could be a temporary problem with the API or your API key. Please try again. If the problem persists, the AI's response might be in an unexpected format.";
        return {
            flag: 'error',
            content: userFriendlyError
        };
    }
}

export const generatePreDevAnalysis = async (spec: string): Promise<PreDevAnalysis | string> => {
    const ai = getAiClient();
    if (!ai) return "API Key not set. Please set it via the key icon in the header.";

    const prompt = `Based on the following technical specification, generate a comprehensive pre-development analysis. Provide the output as a JSON object.

Specification:
---
${spec}
---`;
    
    try {
        const response = await ai.models.generateContent({
            model: getModel(),
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        introduction: { type: Type.STRING, description: 'A summary of the requirements and root causes.' },
                        impactAnalysis: { type: Type.STRING, description: 'Affected components, systems, or user workflows.' },
                        howToCode: { type: Type.STRING, description: 'A high-level development approach or plan.' },
                        testApproach: { type: Type.STRING, description: 'A strategy for testing the new feature or fix.' }
                    },
                    required: ['introduction', 'impactAnalysis', 'howToCode', 'testApproach']
                }
            }
        });
        
        return JSON.parse(response.text) as PreDevAnalysis;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `Error generating pre-dev analysis: ${error instanceof Error ? error.message : String(error)}`;
    }
};

export const generateTestCases = async (spec: string): Promise<TestCase[] | string> => {
    const ai = getAiClient();
    if (!ai) return "API Key not set. Please set it via the key icon in the header.";
    
    const prompt = `Based on the following technical specification, generate between 5 and 10 relevant test cases. Provide the output as a JSON array of objects.

Specification:
---
${spec}
---`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: getModel(),
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            input: { type: Type.STRING },
                            expectedResult: { type: Type.STRING }
                        },
                        required: ['description', 'input', 'expectedResult']
                    }
                }
            }
        });

        const rawTestCases = JSON.parse(response.text) as Omit<TestCase, 'id' | 'status'>[];
        return rawTestCases.map(tc => ({
            ...tc,
            id: crypto.randomUUID(),
            status: TestCaseStatus.Pending
        }));

    } catch (error) {
        console.error("Gemini API Error:", error);
        return `Error generating test cases: ${error instanceof Error ? error.message : String(error)}`;
    }
};