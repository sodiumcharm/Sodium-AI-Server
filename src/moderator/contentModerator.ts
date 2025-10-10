import genAI from '../llm/gemini/gemini';
import { textModerationPrompt } from '../prompts/contentModeration.prompts';

const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const contentModerator = async function (content: string): Promise<boolean> {
  try {
    const result = await model.generateContent([
      `Your Role: ${textModerationPrompt}`,
      `Content: ${content}`,
    ]);

    const reply = result.response.text();

    return reply.trim().toLowerCase() === 'safe';
  } catch (error) {
    console.error('Error in contentModerator:', error);
    return false;
  }
};

export default contentModerator;
