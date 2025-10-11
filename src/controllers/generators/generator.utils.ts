import hfClient from '../../llm/huggingFace/huggingFace';
import { randomContentGeneratorPrompt } from '../../prompts/generator.prompts';

export const generateRandomContent = async function (context: string): Promise<string | 'error'> {
  try {
    const prompt = randomContentGeneratorPrompt(context);

    const output = await hfClient.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 350,
      temperature: 0.8,
      top_p: 0.9,
    });
    const response = output.choices[0].message.content;
    if (!response) return 'error';
    return response;
  } catch (error) {
    return 'error';
  }
};
