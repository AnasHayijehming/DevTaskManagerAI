
import { GoogleGenAI, Type, GenerateContentResponse, Chat, Content } from '@google/genai';
import { PreDevAnalysis, TestCase, TestCaseStatus, RequirementChatMessage } from '../types';

// Fix: Per Gemini API guidelines, initialize client with API key from environment variables.
// The API key's availability is assumed to be handled externally.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface AiChatResponse {
  flag: 'question' | 'answer' | 'error';
  content: string;
}

const systemInstruction = `You are an expert product manager and software engineer. Your goal is to help a developer clarify a requirement and turn it into a detailed technical specification.

Your process is as follows:
1. You will be given an initial user requirement. This requirement may be in English or Thai.
2. Please ask questions to get complete information, but ask them one at a time and in Thai.
3. Once you have a clear understanding, provide a comprehensive technical specification as the final answer. **This final specification MUST ALWAYS be in English.**

**IMPORTANT:** You MUST ALWAYS respond in a specific JSON format. Do not add any text outside of the JSON object.

- If you are asking a question, use this format (the content can be in Thai if the user initiated in Thai):
{"flag": "question", "content": "Your single question here."}

- If you are providing the final technical specification, use this format (the content MUST be in English):
{"flag": "answer", "content": "The complete technical specification here."}`;

export const createRequirementChat = (history?: RequirementChatMessage[]): Chat => {
  const filteredHistory = history?.filter(msg => !msg.text.includes('**Specification Generated**'));

  const geminiHistory: Content[] | undefined = filteredHistory?.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: geminiHistory,
    config: {
      systemInstruction,
      // Fix: Add responseMimeType and responseSchema to ensure valid JSON output from the AI,
      // preventing parsing errors due to unescaped control characters like newlines.
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
        const userFriendlyError = "I'm sorry, but I encountered an issue communicating with the AI. This could be a temporary problem. Please try sending your message again. If the problem persists, the AI's response might be in an unexpected format.";
        return {
            flag: 'error',
            content: userFriendlyError
        };
    }
}

export const generatePreDevAnalysis = async (spec: string): Promise<PreDevAnalysis | string> => {
    const prompt = `Based on the following technical specification, generate a comprehensive pre-development analysis. Provide the output as a JSON object.

Specification:
---
${spec}
---`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
    const prompt = `Based on the following technical specification, generate between 5 and 10 relevant test cases. Provide the output as a JSON array of objects.

Specification:
---
${spec}
---`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
