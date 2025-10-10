import { ChatData, LlmModel } from '../../types/types';
import genAI from '../../llm/gemini/gemini';
import openAI from '../../llm/openAI/openAI';
import boundaryPrompt from '../../prompts/boundary.prompts';
import personalityPrompt from '../../prompts/personality.prompts';
import { rolePlayPrompt, professionalPrompt } from '../../prompts/response.prompts';

export const communicate = async function (
  chatData: ChatData
): Promise<string | 'quota-exceeded' | 'error'> {
  const {
    text,
    opening,
    llmModel,
    characterName,
    gender,
    personality,
    responseStyle,
    mbti,
    enneagram,
    attachmentStyle,
    zodiac,
    chatHistory,
  } = chatData;

  try {
    if (llmModel.startsWith('gemini')) {
      const model = genAI.getGenerativeModel({ model: llmModel });

      let prompts: string[];

      if (opening) {
        prompts = [
          `Your Name: ${characterName}`,
          `Your Gender: ${gender}`,
          `Personality: ${personality}`,
          `Response Style: ${responseStyle === 'role-play' ? rolePlayPrompt : professionalPrompt}`,
          personalityPrompt({
            mbti,
            enneagram,
            attachmentStyle,
            zodiac,
          }),
          `Chat History: ${JSON.stringify(chatHistory || 'No chat history')}`,
          `Your boundary: ${boundaryPrompt}`,
          `Keep your responses usually between 1-4 sentences (maximum 100 words). So responses should be short, expressive and concise unless asked to elaborate.`,
          `Your opening: ${opening}`,
          `User Response: ${text}`,
        ];
      } else {
        prompts = [
          `Your Name: ${characterName}`,
          `Your Gender: ${gender}`,
          `Personality: ${personality}`,
          `Response Style: ${responseStyle === 'role-play' ? rolePlayPrompt : professionalPrompt}`,
          personalityPrompt({
            mbti,
            enneagram,
            attachmentStyle,
            zodiac,
          }),
          `Chat History: ${JSON.stringify(chatHistory || 'No chat history')}`,
          `Your boundary: ${boundaryPrompt}`,
          `Keep your responses usually between 1-4 sentences (maximum 100 words). So responses should be short, expressive and concise unless asked to elaborate.`,
          `User Input: ${text}`,
        ];
      }

      const result = await model.generateContent(prompts);

      return result.response.text();
    } else {
      const completion = await openAI.chat.completions.create({
        model: llmModel,
        messages: [
          { role: 'system', content: `Your Name: ${characterName}` },
          { role: 'system', content: `Your Gender: ${gender}` },
          { role: 'system', content: `Personality: ${personality}` },
          {
            role: 'system',
            content: `Response Style: ${responseStyle === 'role-play' ? rolePlayPrompt : professionalPrompt}`,
          },
          { role: 'system', content: `Your boundary: ${boundaryPrompt}` },
          {
            role: 'system',
            content: `Chat History: ${JSON.stringify(chatHistory || 'No chat history')}`,
          },
          {
            role: 'system',
            content: `Keep your responses usually between 1-4 sentences (maximum 100 words). So responses should be short, expressive and concise unless asked to elaborate.`,
          },
          { role: 'user', content: `User Input: ${text}` },
        ],
      });

      return completion.choices[0].message.content || 'error';
    }
  } catch (error) {
    if ((error as any).status === 'RESOURCE_EXHAUSTED' || (error as any).code === 429) {
      return 'quota-exceeded';
    }

    return 'error';
  }
};
