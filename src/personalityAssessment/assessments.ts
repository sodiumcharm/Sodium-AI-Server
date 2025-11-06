import { MainMbtiFunctions, MbtiScore, MbtiTestResult, UserDocument } from '../types/types';
import { mbtiMap } from './assessmentInfo';
import { InferenceClient } from '@huggingface/inference';

export const determineMBTI = async function (
  scores: MbtiScore,
  user: UserDocument,
  hfClient: InferenceClient
): Promise<MbtiTestResult> {
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([func]) => func);

  const topFunctions = sorted.slice(0, 4);

  const mainFunctionString: MainMbtiFunctions = topFunctions.join('-') as MainMbtiFunctions;

  const mbtiType = mbtiMap[mainFunctionString] || 'Unknown';

  const percentScores: MbtiScore = {
    Fe: ((scores.Fe + 20) / 40) * 100,
    Fi: ((scores.Fi + 20) / 40) * 100,
    Ti: ((scores.Ti + 20) / 40) * 100,
    Te: ((scores.Te + 20) / 40) * 100,
    Ne: ((scores.Ne + 20) / 40) * 100,
    Ni: ((scores.Ni + 20) / 40) * 100,
    Se: ((scores.Se + 20) / 40) * 100,
    Si: ((scores.Si + 20) / 40) * 100,
  };

  try {
    const response = await hfClient.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content:
            'You are an experienced psychologist who specializes in MBTI personality analysis. You provide friendly, empathetic, and insightful reports based on cognitive function scores and result. Make the report very detailed within 500 words.',
        },
        {
          role: 'user',
          content: `Name of User: ${user.fullname}
          Generate a detailed personality analysis for this person.
          ### MBTI Test Data
          Determined Type: ${mbtiType}
          Function scores:
          - Ni: ${percentScores.Ni}%
          - Fe: ${percentScores.Fe}%
          - Ti: ${percentScores.Ti}%
          - Se: ${percentScores.Se}%
          - Ne: ${percentScores.Ne}%
          - Fi: ${percentScores.Fi}%
          - Te: ${percentScores.Te}%
          - Si: ${percentScores.Si}%
          ### Instructions
          1. Explain their personality style in natural human terms which should be relatable.
          2. Mention possible strengths and blind spots.
          3. Suggest communication, romantic and career tips.
          4. Avoid repeating function names too often - keep it warm and relatable.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const resultDetails = response.choices[0].message.content;

    if (!resultDetails) return { success: false };

    return {
      success: true,
      type: mbtiType,
      score: percentScores,
      details: resultDetails,
    };
  } catch (error) {
    return { success: false };
  }
};
