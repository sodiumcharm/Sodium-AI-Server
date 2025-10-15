import { InferenceClient } from '@huggingface/inference';
import { config } from '../../config/config';

const HF_TOKEN_ARRAY = [config.HUGGING_FACE_TOKEN, config.HUGGING_FACE_BACKUP_TOKEN];

const hfClient = new InferenceClient(HF_TOKEN_ARRAY[1]);

export default hfClient;
