import hfClient from '../../llm/huggingFace/huggingFace';
import { randomContentGeneratorPrompt } from '../../prompts/generator.prompts';
import fs from 'fs/promises';
import path from 'path';
import { ImageStyle } from '../../types/types';
import { IMAGE_MODELS } from '../../constants';
import imagePrompts from '../../prompts/image.prompts';
import logger from '../../utils/logger';

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

export const generateImage = async function (
  prompt: string | undefined,
  style: ImageStyle,
  referenceImagePath?: string
): Promise<string | null> {
  try {
    const outputDir = path.join(process.cwd(), 'public', 'temp');

    const model = IMAGE_MODELS[style];

    let result;

    if (referenceImagePath) {
      const imageBuffer = await fs.readFile(referenceImagePath);
      const imageBlob = new Blob([new Uint8Array(imageBuffer)]);

      result = await hfClient.imageToImage({
        model: 'black-forest-labs/FLUX.1-Kontext-dev',
        inputs: imageBlob,
        parameters: {
          prompt: `System Instruction: ${imagePrompts.generic}. ${imagePrompts[style]}
          User Prompt: ${prompt || 'No prompt from user. You can generate image randomly baased on system instruction.'}`,
        },
      });

      await fs.unlink(referenceImagePath);
    } else {
      result = await hfClient.textToImage({
        model,
        inputs: `System Instruction: ${imagePrompts.generic}. ${imagePrompts[style]}
          User Prompt: ${prompt || 'No prompt from user. You can generate image randomly baased on system instruction.'}`,
      });
    }

    if (!result || typeof result === 'string') return null;

    const arrayBuffer = await result.arrayBuffer();

    const mimetype = result.type || 'image/png';

    const ext = mimetype.split('/')[1] || 'png';

    const outputPath = path.join(outputDir, `generated_${Date.now()}.${ext}`);

    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

    return outputPath;
  } catch (error) {
    logger.error(error, 'Image Generation Error');
    return null;
  }
};
