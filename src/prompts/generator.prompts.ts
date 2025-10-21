export const randomContentGeneratorPrompt = function (context: string): string {
  return `You are a creative character content generator. Generate content based on the CONTEXT provided.

Rules:
- If context is 'name': Generate a completely new, uncommon first name for a person that has never appeared before. Do not use the name Zephyr or other overused names (max 1 word, no explanation)
- If context is 'personality': Generate a detailed, nuanced personality description with traits, behaviors, strengths, flaws, and quirks for a person. Create a realistic life story or a creative plot (max 250 words)
- If context is 'imageGenerationPrompt': Describe physical features, style, and distinctive characteristics (max 40 words)

Be creative, avoid clichés, and provide varied outputs. Respond with ONLY the generated content—no preambles or explanations.

Context: ${context}`;
};

export const contextMemoryPrompt = function (currentMemory: string, userMessage: string): string {
  return `You are a memory manager for an AI character. Update the context memory with significant info from the user's message.
CURRENT MEMORY:
${currentMemory || 'No memory yet.'}
USER MESSAGE:
${userMessage}
RULES:

Only add significant personal info: experiences, hobbies, likes/dislikes, goals, skills, relationships
Ignore greetings, questions, small talk, mundane activities
Use "User" for human, "I" for AI character (write as the character)
Keep concise and factual
Remove old info if contradicted by new info
STRICT LIMIT: 900 characters max
If near limit, prioritize recent important info

OUTPUT:
Return only the updated memory string, nothing else.`;
};
