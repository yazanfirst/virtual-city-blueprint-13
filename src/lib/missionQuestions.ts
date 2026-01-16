import { ShopItem } from '@/hooks/useShopItems';
import { MissionQuestion } from '@/stores/missionStore';

/**
 * Rule-based question generation for missions.
 * NO AI/ML - uses templates and real shop data only.
 * 
 * Question types:
 * 1. Price-based: "What was the price of {item}?"
 * 2. Count-based: "How many items were displayed?"
 * 3. Position-based: "Which item was on the {position}?"
 * 4. Existence-based: "Was there an item called {name}?"
 */

// Slot index to position name mapping
const SLOT_POSITIONS: Record<number, string> = {
  0: 'front left wall',
  1: 'front right wall',
  2: 'left wall',
  3: 'right wall',
  4: 'back wall',
};

/**
 * Generate random price options (including the correct answer)
 */
function generatePriceOptions(correctPrice: number): string[] {
  const options: string[] = [`$${correctPrice.toFixed(2)}`];
  
  // Generate 3 wrong options within reasonable range
  const variations = [0.7, 0.85, 1.15, 1.3, 1.5, 0.5];
  const shuffled = variations.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < 3; i++) {
    const wrongPrice = correctPrice * shuffled[i];
    const formatted = `$${wrongPrice.toFixed(2)}`;
    if (!options.includes(formatted)) {
      options.push(formatted);
    }
  }
  
  // Ensure we have exactly 4 options
  while (options.length < 4) {
    const randomPrice = correctPrice * (0.5 + Math.random());
    const formatted = `$${randomPrice.toFixed(2)}`;
    if (!options.includes(formatted)) {
      options.push(formatted);
    }
  }
  
  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Generate random count options (including the correct answer)
 */
function generateCountOptions(correctCount: number): string[] {
  const options: string[] = [String(correctCount)];
  
  // Generate wrong options
  const offsets = [-2, -1, 1, 2, 3];
  const shuffled = offsets.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < 3; i++) {
    const wrongCount = Math.max(0, correctCount + shuffled[i]);
    if (!options.includes(String(wrongCount))) {
      options.push(String(wrongCount));
    }
  }
  
  // Ensure exactly 4 options
  while (options.length < 4) {
    const randomCount = Math.max(1, correctCount + Math.floor(Math.random() * 5) - 2);
    if (!options.includes(String(randomCount))) {
      options.push(String(randomCount));
    }
  }
  
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Generate item name options for position questions
 */
function generateItemOptions(correctItem: string, allItems: ShopItem[]): string[] {
  const options: string[] = [correctItem];
  
  // Add other real item names as wrong options
  const otherItems = allItems
    .filter(item => item.title !== correctItem && item.title)
    .map(item => item.title);
  
  const shuffledOthers = otherItems.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
    options.push(shuffledOthers[i]);
  }
  
  // If we need more options, add fake but plausible names
  const fakeItems = [
    'Vintage Watch',
    'Leather Bag',
    'Designer Shoes',
    'Gold Necklace',
    'Silk Scarf',
    'Crystal Vase',
    'Antique Mirror',
    'Premium Sunglasses',
  ];
  
  const shuffledFake = fakeItems.sort(() => Math.random() - 0.5);
  let fakeIndex = 0;
  
  while (options.length < 4 && fakeIndex < shuffledFake.length) {
    if (!options.includes(shuffledFake[fakeIndex])) {
      options.push(shuffledFake[fakeIndex]);
    }
    fakeIndex++;
  }
  
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Generate questions from shop items - deterministic, rule-based
 */
export function generateMissionQuestions(items: ShopItem[]): MissionQuestion[] {
  const questions: MissionQuestion[] = [];
  
  // Filter valid items
  const validItems = items.filter(item => 
    item.title && item.title.trim().length > 0
  );
  
  if (validItems.length === 0) return questions;
  
  // 1. Count question (always include if items exist)
  questions.push({
    id: `q-count-${Date.now()}`,
    template: 'count',
    questionText: 'How many items were displayed in the shop?',
    correctAnswer: String(validItems.length),
    options: generateCountOptions(validItems.length),
  });
  
  // 2. Price question (if any item has price)
  const pricedItems = validItems.filter(item => item.price != null);
  if (pricedItems.length > 0) {
    const randomIndex = Math.floor(Math.random() * pricedItems.length);
    const item = pricedItems[randomIndex];
    
    questions.push({
      id: `q-price-${Date.now()}`,
      template: 'price',
      questionText: `What was the price of "${item.title}"?`,
      correctAnswer: `$${Number(item.price).toFixed(2)}`,
      options: generatePriceOptions(Number(item.price)),
    });
  }
  
  // 3. Position question (if we have items with known positions)
  const positionedItems = validItems.filter(item => 
    item.slot_index >= 0 && item.slot_index <= 4
  );
  if (positionedItems.length > 0) {
    const randomIndex = Math.floor(Math.random() * positionedItems.length);
    const item = positionedItems[randomIndex];
    const positionName = SLOT_POSITIONS[item.slot_index] || 'wall';
    
    questions.push({
      id: `q-position-${Date.now()}`,
      template: 'position',
      questionText: `Which item was displayed on the ${positionName}?`,
      correctAnswer: item.title,
      options: generateItemOptions(item.title, validItems),
    });
  }
  
  // Shuffle questions and return 1-2 (to keep it challenging but fair)
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(2, shuffled.length));
}

/**
 * Validate that a question is answerable
 */
export function isQuestionValid(question: MissionQuestion): boolean {
  return (
    question.questionText.length > 0 &&
    question.correctAnswer.length > 0 &&
    question.options.length >= 2 &&
    question.options.includes(question.correctAnswer)
  );
}
