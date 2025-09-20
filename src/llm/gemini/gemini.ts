import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/config';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

export default genAI;
