import {
  MainMbtiFunctions,
  MbtiScore,
  MbtiTestResult,
  SelfEsteemTestResult,
  UserDocument,
} from '../types/types';
import { mbtiMap } from './assessmentInfo';
import { InferenceClient } from '@huggingface/inference';
import { calcPercent } from '../utils/percent';
import {
  MAX_FUNCTION_SCORE,
  MAX_SELF_ESTEEM_SCORE,
  MIN_FUNCTION_SCORE,
  MIN_SELF_ESTEEM_SCORE,
} from '../constants';

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
    Fe: calcPercent(scores.Fe, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Fi: calcPercent(scores.Fi, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Ti: calcPercent(scores.Ti, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Te: calcPercent(scores.Te, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Ne: calcPercent(scores.Ne, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Ni: calcPercent(scores.Ni, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Se: calcPercent(scores.Se, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
    Si: calcPercent(scores.Si, MAX_FUNCTION_SCORE, MIN_FUNCTION_SCORE),
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

export const assessSelfEsteem = async function (
  score: number,
  user: UserDocument,
  hfClient: InferenceClient
): Promise<SelfEsteemTestResult> {
  const selfEsteemPercent = calcPercent(score, MAX_SELF_ESTEEM_SCORE, MIN_SELF_ESTEEM_SCORE);

  try {
    const response = await hfClient.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content:
            'You are an experienced psychologist who specializes in assessing self-esteem. You provide friendly, empathetic, and insightful reports based on the Rosenberg Self-Esteem Scale. Make the report very detailed within 300 words.',
        },
        {
          role: 'user',
          content: `Name of User: ${user.fullname}
          Generate a detailed personality analysis for this person.
          ### Self Esteem Percentage: ${selfEsteemPercent}%
          ### Instructions
          1. Explain their personality style in natural human terms which should be relatable.
          2. Suggest communication, romantic and career tips.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const resultDetails = response.choices[0].message.content;

    if (!resultDetails) return { success: false };

    return {
      success: true,
      selfEsteemPercent,
      details: resultDetails,
    };
  } catch (error) {
    return { success: false };
  }
};
