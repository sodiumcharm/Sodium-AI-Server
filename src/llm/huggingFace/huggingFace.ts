import { InferenceClient } from '@huggingface/inference';
import { config } from '../../config/config';

const hfClient = new InferenceClient(config.HUGGING_FACE_TOKEN);
