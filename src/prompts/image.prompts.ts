import { ImagePrompt } from '../types/types';

const imagePrompts: ImagePrompt = {
  generic: `You are an advanced image generation system. Your task is to create a high-quality, detailed, and visually appealing image based on the user’s description. If the user provides a reference image, use it as inspiration for style, composition, or character likeness, while still enhancing it with the requested details. If no reference image is provided, rely fully on the written prompt. Always generate images in high resolution, sharp details, good lighting, and coherent composition.`,

  realistic: `Create a hyper-realistic image with lifelike textures, natural lighting, and photographic detail. Focus on sharp clarity, accurate anatomy, and cinematic atmosphere. If a reference image is provided, ensure the likeness and details match while keeping it photo-realistic.`,

  anime: `Create a high-quality anime-style illustration. Focus on expressive eyes, clean line art, vivid colors, and smooth shading. Style should resemble professional anime character art or anime still frames. If a reference image is provided, adapt the design to anime style while keeping the likeness.`,

  horror: `Create a dark, atmospheric horror image. Focus on eerie lighting, unsettling mood, and disturbing but artistic details. Make sure the horror is creepy and atmospheric, not just gory. If a reference image is provided, keep the character likeness but adapt it to a haunting horror setting.`,

  fantasy: `Create a high-quality fantasy illustration. Focus on magical elements, epic lighting, vibrant colors, and imaginative environments. The image should feel like it belongs in a fantasy novel or video game concept art. If a reference image is provided, maintain likeness while enhancing it with fantastical elements.`,
};

export default imagePrompts;
