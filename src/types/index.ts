// Game State Types
export type GameStatus = 'idle' | 'playing' | 'finished';

export interface GameState {
  status: GameStatus;
  startTime: number; // Timestamp
  duration: number; // Default 25 * 60 * 1000 (25 minutes in ms)
  taskName: string;

  // Poker State
  deck: string[]; // Remaining deck after dealing
  myHand: string[]; // ['As', 'Ks']
  villainHand: string[]; // ['Qh', 'Qd'] (generated but hidden until showdown)
  communityCards: string[]; // Initially [], filled over time

  // Economy
  blind: number; // 1 for MVP
  pot: number; // 2 for MVP (player blind + villain blind)

  // Result (only set when status is 'finished')
  result?: 'win' | 'lose' | 'tie';
  chipsWon?: number;
  myHandDescription?: string; // e.g., "Pair, 10's"
  villainHandDescription?: string; // e.g., "Ace High"
  myBestCards?: string[]; // Best 5 cards for player
  villainBestCards?: string[]; // Best 5 cards for opponent
}

export interface UserSettings {
  chips: number; // Total balance
  blockedSites: string[]; // ['*://*.bilibili.com/*', '*://*.weibo.com/*']
  focusDuration: number; // Focus duration in minutes (1, 5, 10, or 25)
}

export interface Statistics {
  totalGames: number;
  wins: number;
  losses: number;
  folds: number;
  maxChips: number;
  totalFocusTime: number; // Total focus time in minutes
}

// Storage Schema
export interface StorageData {
  gameState: GameState;
  userSettings: UserSettings;
  statistics: Statistics;
}

// Card Ranks and Suits
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['h', 'd', 'c', 's'] as const; // hearts, diamonds, clubs, spades

export type Rank = typeof RANKS[number];
export type Suit = typeof SUITS[number];
export type Card = `${Rank}${Suit}`; // e.g., 'As', 'Kh', '2c'

// Timer milestones for revealing cards
// These represent elapsed time (not remaining time)
export const TIMER_MILESTONES = {
  TEST: {
    FLOP: 10 * 1000,   // Test: Reveal at 10 seconds elapsed
    TURN: 20 * 1000,   // Test: Reveal at 20 seconds elapsed
    RIVER: 25 * 1000,  // Test: Reveal at 25 seconds elapsed
  },
  NORMAL: {
    FLOP: 8 * 60 * 1000,   // Normal: Reveal at 8 minutes elapsed
    TURN: 16 * 60 * 1000,  // Normal: Reveal at 16 minutes elapsed
    RIVER: 20 * 60 * 1000, // Normal: Reveal at 20 minutes elapsed
  }
} as const;

// Initial default values
export const DEFAULT_GAME_STATE: GameState = {
  status: 'idle',
  startTime: 0,
  duration: 25 * 60 * 1000, // Default: 25 minutes
  taskName: '',
  deck: [],
  myHand: [],
  villainHand: [],
  communityCards: [],
  blind: 1,
  pot: 2,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  chips: 10,
  blockedSites: [
    'bilibili.com',
    'weibo.com',
    'douyin.com',
    'reddit.com',
    'twitter.com',
    'x.com',
  ],
  focusDuration: 25, // Default to 25 minutes
};

export const DEFAULT_STATISTICS: Statistics = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  folds: 0,
  maxChips: 10,
  totalFocusTime: 0,
};
