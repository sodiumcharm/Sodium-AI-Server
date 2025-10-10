import OpenAI from 'openai';

import { config } from '../../config/config';

const openAI = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export default openAI;
