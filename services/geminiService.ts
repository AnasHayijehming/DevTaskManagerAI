import { GoogleGenAI, Type, GenerateContentResponse, Chat, Content } from '@google/genai';
import { PreDevAnalysis, TestCase, TestCaseStatus, RequirementChatMessage } from '../types';
import { API_KEY_STORAGE_KEY } from '../hooks/useApiKey';
import { MODEL_STORAGE_KEY } from '../hooks/useModelSettings';
import { DEFAULT_GEMINI_MODEL } from '../constants';


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
        return storedModel || DEFAULT_GEMINI_MODEL;
    } catch (e) {
        console.error("Could not access localStorage", e);
        return DEFAULT_GEMINI_MODEL;
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

You will follow a systematic 7-stage process to ensure the highest quality output:

**Stage 1: Requirements Analysis**
- Deeply analyze the initial user requirement to understand its core purpose and potential ambiguities.

**Stage 2: Information Gathering (Q&A)**
- If the requirement is unclear or incomplete, ask clarifying questions.
- Ask one question at a time to avoid overwhelming the user.
- Ask questions in Thai.

**Stage 3: Specification Drafting**
- Once you have all necessary information, draft a comprehensive technical specification.
- The specification MUST be in English.
- It should be well-structured, using Markdown for formatting.

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
You MUST ALWAYS respond in a specific JSON format. Do not add any text outside of the JSON object.

- For **Stage 2 (Q&A)**, use this format:
{"flag": "question", "content": "Your single question here."}

- For **Stage 7 (Final Documentation)**, use this format:
{"flag": "answer", "content": "The complete, validated technical specification in English, including the 'Edge Cases & Error Handling' section."}`;

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


export const generateTitle = async (requirement: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "API Key not set. Please set it via the settings in the header.";

    const prompt = `Based on the following requirement, generate a short, descriptive title for a development task (under 10 words).
    
Requirement:
---
${requirement}
---

Return only the title text, with no extra formatting, quotation marks, or labels like "Title:".`;

    try {
        const response = await ai.models.generateContent({
            model: getModel(),
            contents: prompt,
        });
        
        // Trim and remove any potential surrounding quotes.
        return response.text.trim().replace(/^"|"$/g, '');
    } catch (error) {
        console.error("Gemini API Error (generateTitle):", error);
        return `Error generating title: ${error instanceof Error ? error.message : String(error)}`;
    }
};