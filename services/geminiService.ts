import { GoogleGenAI, Type } from "@google/genai";
import { Card, Question } from '../types';

// Safe API Key retrieval for browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not access process.env");
  }
  return '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateQuizFromContent = async (content: string, numQuestions: number = 5, difficulty: string = 'Medium'): Promise<Question[]> => {
  try {
    const prompt = `
      Create a study quiz based on the following content. 
      Settings:
      - Difficulty: ${difficulty} (Adjust complexity of questions and distractors accordingly).
      - Quantity: Return exactly ${numQuestions} questions.
      
      Content: ${content.substring(0, 15000)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING, description: "The question or term to define" },
              definition: { type: Type.STRING, description: "The correct answer or definition" },
              distractors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 incorrect but plausible answers"
              },
            },
            required: ["term", "definition", "distractors"]
          }
        }
      }
    });

    let jsonStr = response.text || "[]";
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(jsonStr);
    return data.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      term: q.term,
      definition: q.definition,
      distractors: q.distractors,
      mastery: 0
    }));

  } catch (error) {
    console.error("GenAI Quiz Error:", error);
    return [];
  }
};

export const getCharacterChatResponse = async (
  card: Card, 
  history: {role: string, text: string}[], 
  message: string
): Promise<string> => {
  try {
    const systemPrompt = `
      You are roleplaying as ${card.name} from Bungou Stray Dogs.
      Context: ${card.description}.
      Tags: ${card.tags.join(', ')}.
      
      Personality: Keep responses under 50 words. Be in character. 
      If it's an AU card (like School AU or HP AU), adapt the persona accordingly.
      Current conversation history is provided.
    `;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "...";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble thinking right now (Network Error).";
  }
};

export const processRawMaterial = async (input: string, type: 'text' | 'url' | 'image'): Promise<string> => {
  const isUrl = type === 'url';
  const isImage = type === 'image';
  const isTopic = !isUrl && !isImage && input.length < 200;

  let prompt = '';
  let imagePart: any = null;

  if (isImage) {
      const matches = input.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
          imagePart = {
              inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
              }
          };
      }
      prompt = `You are an expert tutor. Analyze this image (notes, textbook, or diagram).
       Extract all key terms, definitions, concepts, and facts visible in the image.
       Create a detailed, text-based study guide suitable for generating a quiz.`;
  } else if (isUrl) {
    prompt = `You are an expert tutor. Research the following URL or Topic and create a detailed study guide.
       If it is a video, summarize the key educational points.
       Focus on extracting clear terms, definitions, concepts, and key facts suitable for a quiz.
       
       Source/Topic: ${input}`;
  } else if (isTopic) {
    prompt = `You are an expert tutor. Create a comprehensive, detailed study guide for the topic: "${input}".
       Identify at least 5 key concepts, important terminology with definitions, and core facts.
       Provide detailed explanations suitable for generating a quiz.`;
  } else {
    prompt = `You are an expert tutor. Analyze the following text and create a detailed study guide.
       Focus on extracting clear terms, definitions, concepts, and key facts suitable for a quiz.
       
       Text: ${input}`;
  }

  const config: any = {};
  
  if (isUrl) {
    config.tools = [{ googleSearch: {} }];
  }

  const parts: any[] = [];
  if (isImage && imagePart) {
      parts.push(imagePart);
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: config
  });

  return response.text || "Could not generate summary.";
};

export const generateStory = async (team: Card[], prompt: string): Promise<string> => {
  const teamNames = team.map(c => c.name).join(', ');
  const instruction = `
    Write a short, engaging story (approx 300 words) featuring these Bungou Stray Dogs characters: ${teamNames}.
    Scenario/Topic: ${prompt}.
    Include dialogue and character-specific quirks.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: instruction
  });

  return response.text || "Story generation failed.";
};

export const askDevAssistant = async (query: string, context: any): Promise<string> => {
  try {
    const safeContext = {
       cardCount: context.cards?.length,
       bannerCount: context.banners?.length,
       coins: context.coins,
       lastError: "None",
       sampleCard: context.cards?.[0]
    };

    const prompt = `
      You are the "Admin AI" for the Bungou Study Tales application.
      You have access to the codebase knowledge and the current runtime state.
      
      Runtime State Summary:
      ${JSON.stringify(safeContext, null, 2)}
      
      User Request: "${query}"
      
      Your goal is to assist the developer.
      1. If they ask to change code, provide the exact TypeScript/React code snippet they should copy into their file.
      2. If they ask to debug, analyze the situation based on your knowledge of React and the provided state.
      3. If they ask for a feature, describe how to implement it and provide the code.
      
      Response Format:
      - Be conversational but technical.
      - Use markdown code blocks for code.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return response.text || "I am unable to process that request.";
  } catch (error) {
    console.error("Dev AI Error:", error);
    return "System Error: Admin AI Connection Failed.";
  }
};

export { ai };
