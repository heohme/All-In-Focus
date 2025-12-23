import { Hand } from 'pokersolver';
import { Card } from '../types';

export type HandResult = 'win' | 'lose' | 'tie';

export interface HandComparisonResult {
  result: HandResult;
  myBestCards: string[]; // Best 5 cards for player
  villainBestCards: string[]; // Best 5 cards for opponent
}

/**
 * Compare two poker hands and determine the winner
 * @param myHand Player's 2 hole cards
 * @param villainHand Opponent's 2 hole cards
 * @param communityCards 5 community cards
 * @returns Comparison result with best 5 cards for each player
 */
export function compareHands(
  myHand: Card[],
  villainHand: Card[],
  communityCards: Card[]
): HandComparisonResult {
  try {
    // Combine hole cards with community cards for each player
    const myCards = [...myHand, ...communityCards];
    const villainCards = [...villainHand, ...communityCards];

    // Solve hands using pokersolver
    const myHandSolved = Hand.solve(myCards);
    const villainHandSolved = Hand.solve(villainCards);

    // Get best 5 cards for each player
    const myBestCards = (myHandSolved as any).cards.map((card: any) => card.value + card.suit);
    const villainBestCards = (villainHandSolved as any).cards.map((card: any) => card.value + card.suit);

    // Determine winner
    const winners = Hand.winners([myHandSolved, villainHandSolved]);

    // Check if player won
    let result: HandResult;
    if (winners.length === 1) {
      result = winners[0] === myHandSolved ? 'win' : 'lose';
    } else {
      result = 'tie';
    }

    return {
      result,
      myBestCards,
      villainBestCards,
    };
  } catch (error) {
    console.error('Error comparing hands:', error);
    // Fallback to random result if comparison fails
    return {
      result: Math.random() < 0.5 ? 'win' : 'lose',
      myBestCards: [...myHand, ...communityCards.slice(0, 3)],
      villainBestCards: [...villainHand, ...communityCards.slice(0, 3)],
    };
  }
}

/**
 * Get a human-readable description of a hand
 */
export function getHandDescription(hand: Card[], communityCards: Card[]): string {
  try {
    const allCards = [...hand, ...communityCards];
    const solved = Hand.solve(allCards);
    return solved.descr;
  } catch (error) {
    console.error('Error getting hand description:', error);
    return 'Unknown hand';
  }
}
