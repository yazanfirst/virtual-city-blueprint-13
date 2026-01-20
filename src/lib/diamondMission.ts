import { MissionQuestion } from '@/stores/missionStore';
import { ShopBranding } from '@/hooks/use3DShops';

const TRIVIA_QUESTIONS: Array<Omit<MissionQuestion, 'id'>> = [
  {
    template: 'trivia',
    questionText: 'What planet is known as the Red Planet?',
    correctAnswer: 'Mars',
    options: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
  },
  {
    template: 'trivia',
    questionText: 'What is the chemical symbol for water?',
    correctAnswer: 'H2O',
    options: ['H2O', 'CO2', 'O2', 'NaCl'],
  },
  {
    template: 'trivia',
    questionText: 'What is 12 × 8?',
    correctAnswer: '96',
    options: ['86', '96', '104', '112'],
  },
  {
    template: 'trivia',
    questionText: 'Which gas do plants absorb from the atmosphere?',
    correctAnswer: 'Carbon dioxide',
    options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'],
  },
  {
    template: 'trivia',
    questionText: 'How many degrees are in a right angle?',
    correctAnswer: '90',
    options: ['45', '60', '90', '180'],
  },
  {
    template: 'trivia',
    questionText: 'What is the square root of 81?',
    correctAnswer: '9',
    options: ['7', '8', '9', '12'],
  },
  {
    template: 'trivia',
    questionText: 'Which continent is the Sahara Desert located in?',
    correctAnswer: 'Africa',
    options: ['Asia', 'Africa', 'Australia', 'South America'],
  },
  {
    template: 'trivia',
    questionText: 'What is the largest organ in the human body?',
    correctAnswer: 'Skin',
    options: ['Heart', 'Skin', 'Liver', 'Brain'],
  },
  {
    template: 'trivia',
    questionText: 'What is the value of π (pi) rounded to two decimals?',
    correctAnswer: '3.14',
    options: ['3.12', '3.14', '3.16', '3.18'],
  },
  {
    template: 'trivia',
    questionText: 'Which planet has the most moons?',
    correctAnswer: 'Saturn',
    options: ['Earth', 'Saturn', 'Mars', 'Mercury'],
  },
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function generateDiamondMissionQuestions(count: number = 3): MissionQuestion[] {
  return shuffle(TRIVIA_QUESTIONS)
    .slice(0, Math.min(count, TRIVIA_QUESTIONS.length))
    .map((question, index) => ({
      ...question,
      id: `diamond-q-${Date.now()}-${index}`,
    }));
}

export function generateDiamondClues(
  targetShop: ShopBranding,
  playerPosition: [number, number, number]
): string[] {
  const [playerX, , playerZ] = playerPosition;
  const dx = targetShop.position.x - playerX;
  const dz = targetShop.position.z - playerZ;

  const stepSize = 5;
  const xSteps = Math.max(1, Math.round(Math.abs(dx) / stepSize));
  const zSteps = Math.max(1, Math.round(Math.abs(dz) / stepSize));

  const xDirection = dx >= 0 ? 'right' : 'left';
  const zDirection = dz >= 0 ? 'forward' : 'back';

  return [
    `Go ${xDirection} ${xSteps} steps.`,
    `Go ${zDirection} ${zSteps} steps.`,
    `Look for the shop near spot ${targetShop.spotLabel}.`,
  ];
}
