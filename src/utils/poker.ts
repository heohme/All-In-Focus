import { RANKS, SUITS, Card } from '../types';

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}` as Card);
    }
  }
  return deck;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals cards for a new game
 * Returns player hand, villain hand, community cards, and remaining deck
 */
export function dealCards() {
  let deck = shuffleDeck(createDeck());

  // Deal 2 cards to player
  const myHand: Card[] = [deck.pop()!, deck.pop()!];

  // Deal 2 cards to villain
  const villainHand: Card[] = [deck.pop()!, deck.pop()!];

  // Deal 5 community cards (will be revealed progressively)
  const communityCards: Card[] = [
    deck.pop()!, // Flop 1
    deck.pop()!, // Flop 2
    deck.pop()!, // Flop 3
    deck.pop()!, // Turn
    deck.pop()!, // River
  ];

  return {
    myHand,
    villainHand,
    communityCards,
    deck, // Remaining cards (not used in MVP, but kept for future features)
  };
}

/**
 * Gets the number of community cards to reveal based on remaining time
 * Uses proportional timing based on total duration
 */
export function getRevealedCardsCount(remainingTime: number, duration: number): number {
  const elapsed = duration - remainingTime;

  // Calculate reveal times based on proportions (rounded to seconds)
  const flopTime = Math.floor(duration * 1 / 2); // 1/2 of total time
  const turnTime = Math.floor(duration * 2 / 3); // 2/3 of total time
  const riverTime = Math.floor(duration * 4 / 5); // 4/5 of total time

  if (elapsed >= riverTime) return 5; // All 5 cards (flop + turn + river)
  if (elapsed >= turnTime) return 4; // 4 cards (flop + turn)
  if (elapsed >= flopTime) return 3; // 3 cards (flop only)

  return 0; // No cards revealed yet
}

/**
 * Gets the time remaining until next card reveal
 * Returns { nextCardName, timeUntil } or null if all cards revealed
 */
export function getNextCardRevealInfo(remainingTime: number, duration: number): { nextCardName: string; timeUntil: number } | null {
  const elapsed = duration - remainingTime;

  // Calculate reveal times based on proportions
  const flopTime = Math.floor(duration * 1 / 2);
  const turnTime = Math.floor(duration * 2 / 3);
  const riverTime = Math.floor(duration * 4 / 5);

  if (elapsed < flopTime) {
    return {
      nextCardName: '翻牌',
      timeUntil: flopTime - elapsed,
    };
  }

  if (elapsed < turnTime) {
    return {
      nextCardName: '转牌',
      timeUntil: turnTime - elapsed,
    };
  }

  if (elapsed < riverTime) {
    return {
      nextCardName: '河牌',
      timeUntil: riverTime - elapsed,
    };
  }

  return null; // All cards revealed
}

/**
 * Formats time in MM:SS format
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Gets the display name of a card
 * e.g., 'As' -> 'A♠', 'Kh' -> 'K♥'
 */
export function getCardDisplay(card: Card): string {
  const rank = card[0];
  const suit = card[1];

  const suitSymbols: Record<string, string> = {
    h: '♥',
    d: '♦',
    c: '♣',
    s: '♠',
  };

  return `${rank}${suitSymbols[suit]}`;
}

/**
 * Gets the color for a suit
 */
export function getSuitColor(suit: string): 'red' | 'black' {
  return suit === 'h' || suit === 'd' ? 'red' : 'black';
}
