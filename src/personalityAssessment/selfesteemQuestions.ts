import { SelfEsteemStatement } from '../types/types';
import shuffle from '../utils/shuffle';

const selfEsteemQuestions: readonly SelfEsteemStatement[] = shuffle([
  {
    id: 1,
    text: 'I feel good when someone cares for me and try to connect with me.',
    baseScore: 1,
  },
  {
    id: 2,
    text: 'When I catch romantic feelings for someone, I try to respectfully express my feelings to the person I like.',
    baseScore: 1,
  },
  {
    id: 3,
    text: `My worth is not determined by the opinions of others.`,
    baseScore: 1,
  },
  {
    id: 4,
    text: 'I feel comfortable to ask for help when I need it and I see it as a way to strengthen my connection with others.',
    baseScore: 1,
  },
  {
    id: 5,
    text: 'I love to celebrate my successes, big or small.',
    baseScore: 1,
  },
  {
    id: 6,
    text: 'I forgive myself for past mistakes.',
    baseScore: 1,
  },
  {
    id: 7,
    text: 'I do not compare myself to others, my journey is my own.',
    baseScore: 1,
  },
  {
    id: 8,
    text: 'I can say no to someone without feeling guilty.',
    baseScore: 1,
  },
  {
    id: 9,
    text: 'I deserve relationships that are mutual and supportive.',
    baseScore: 1,
  },
  {
    id: 10,
    text: 'I believe in my abilities and skills.',
    baseScore: 1,
  },
  {
    id: 11,
    text: 'I feel guilty when I catch romantic feelings for someone because I assume the person deserves better than me.',
    baseScore: -1,
  },
  {
    id: 12,
    text: `I feel like a burden to my friends and family, like they'd be better off without me.`,
    baseScore: -1,
  },
  {
    id: 13,
    text: `I don't share my feelings or opinions with others because I don't think anyone will listen to me anyway.`,
    baseScore: -1,
  },
  {
    id: 14,
    text: `I always feel like everyone is better than me in some way.`,
    baseScore: -1,
  },
  {
    id: 15,
    text: `I feel ashamed of myself when someone criticises me because I see it as a proof of my bad qualities.`,
    baseScore: -1,
  },
  {
    id: 16,
    text: `It feels hard for me to believe when someone cares for me, I assume they are just being polite.`,
    baseScore: -1,
  },
  {
    id: 17,
    text: `I usually try to do everything myself because I don't want to bother others.`,
    baseScore: -1,
  },
  {
    id: 18,
    text: `I worry that if I show my true self, people will think I am weird or annoying.`,
    baseScore: -1,
  },
  {
    id: 19,
    text: `I avoid speaking up because I am terrified of embarrassing myself in front of others.`,
    baseScore: -1,
  },
  {
    id: 20,
    text: `I sometimes feel like I am unlovable and people only tolerate me out of obligation.`,
    baseScore: -1,
  },
]);

export default selfEsteemQuestions;
