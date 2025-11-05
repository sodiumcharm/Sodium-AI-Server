import {
  CharacterDocument,
  ChatData,
  UserDocument,
  CommunicationDependency,
} from '../../types/types';
import boundaryPrompt from '../../prompts/boundary.prompts';
import personalityPrompt from '../../prompts/personality.prompts';
import { rolePlayPrompt, professionalPrompt } from '../../prompts/response.prompts';
import Memory from '../../models/memory.model';
import replyAdvicePrompt from '../../prompts/replyAdvice.prompts';
import { config } from '../../config/config';
import logger from '../../utils/logger';
import { contextMemoryPrompt } from '../../prompts/generator.prompts';

export const communicate = async function (
  chatData: ChatData,
  dependency: CommunicationDependency
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
    memory,
  } = chatData;

  try {
    if (llmModel.startsWith('gemini')) {
      const model = dependency.genAI.getGenerativeModel({ model: llmModel });

      const commonPrompts = [
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
      ];

      let prompts: string[];

      if (opening) {
        prompts = [
          ...commonPrompts,
          `Your opening dialogue (you said to user): ${opening}`,
          `User Response: ${text}`,
        ];
      } else {
        prompts = [...commonPrompts, `User Input: ${text}`];
      }

      const result = await model.generateContent(prompts);

      return result.response.text();
    } else {
      const completion = await dependency.openAI.chat.completions.create({
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
            content: `Your Context Memory: ${memory || 'No context memory yet'}`,
          },
          {
            role: 'system',
            content: `Keep your responses usually between 1-4 sentences (maximum 100 words). So responses should be short, expressive and concise unless asked to elaborate.`,
          },
          {
            role: 'system',
            content: `Your opening dialogue (you said to user): ${opening || 'Not specified'}`,
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

export const getReplyAdvices = async function (
  character: CharacterDocument,
  user: UserDocument,
  dependency: CommunicationDependency
): Promise<string[] | 'error'> {
  try {
    const memory = await Memory.findOne(
      { character: character._id, user: user._id },
      { messages: { $slice: -1 } }
    );

    if (!memory) return 'error';

    const text = memory.messages[0].content;

    if (!text || text.trim() === '') return 'error';

    let response: string | null = null;

    if (character.llmModel.startsWith('gpt')) {
      const completion = await dependency.openAI.chat.completions.create({
        model: character.llmModel,
        messages: [{ role: 'system', content: replyAdvicePrompt(user, text) }],
      });

      response = completion.choices[0].message.content;
    } else {
      const model = dependency.genAI.getGenerativeModel({ model: character.llmModel });

      const prompt = replyAdvicePrompt(user, text);

      const result = await model.generateContent(prompt);

      response = result.response.text();
    }

    if (!response) return 'error';

    const responseArr = response.split('; ');

    responseArr.pop();

    return responseArr;
  } catch (error) {
    return 'error';
  }
};

export const updateContextMemory = async function (
  user: UserDocument,
  character: CharacterDocument,
  text: string,
  dependency: CommunicationDependency
): Promise<boolean> {
  try {
    const memory = await Memory.findOne({ user: user._id, character: character._id });

    if (!memory) return false;

    let result: string | null = null;

    if (user.isPaid) {
      const response = await dependency.openAI.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: contextMemoryPrompt(memory.contextMemory, text) }],
      });

      result = response.choices[0].message.content;
    } else {
      const model = dependency.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const response = await model.generateContent(contextMemoryPrompt(memory.contextMemory, text));

      result = response.response.text();
    }

    if (!result) return false;

    await Memory.findByIdAndUpdate(
      memory._id,
      {
        $set: { contextMemory: result },
      },
      { new: true }
    );

    return true;
  } catch (error) {
    if (config.NODE_ENV === 'development') {
      logger.error(error, 'Error while updating context!');
    }
    return false;
  }
};
