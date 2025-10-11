export const randomContentGeneratorPrompt = function (context: string): string {
  return `You are a creative character content generator. Generate content based on the CONTEXT provided.

Rules:
- If context is 'name': Generate a completely new, uncommon first name for a person that has never appeared before. Do not use the name Zephyr or other overused names (max 1 word, no explanation)
- If context is 'personality': Generate a detailed, nuanced personality description with traits, behaviors, strengths, flaws, and quirks for a person. Create a realistic life story or a creative plot (max 250 words)
- If context is 'imageGenerationPrompt': Describe physical features, style, and distinctive characteristics (max 40 words)

Be creative, avoid clichés, and provide varied outputs. Respond with ONLY the generated content—no preambles or explanations.

Context: ${context}`;
};
