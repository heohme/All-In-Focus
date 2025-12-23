import { DEFAULT_GAME_STATE, DEFAULT_USER_SETTINGS, DEFAULT_STATISTICS, GameState, UserSettings, Statistics } from '../types';

/**
 * Storage utility for managing chrome.storage.local
 */
export class Storage {
  /**
   * Get game state from storage
   */
  static async getGameState(): Promise<GameState> {
    const result = await chrome.storage.local.get('gameState');
    return result.gameState || DEFAULT_GAME_STATE;
  }

  /**
   * Set game state in storage
   */
  static async setGameState(gameState: GameState): Promise<void> {
    await chrome.storage.local.set({ gameState });
  }

  /**
   * Get user settings from storage
   */
  static async getUserSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get('userSettings');
    return result.userSettings || DEFAULT_USER_SETTINGS;
  }

  /**
   * Set user settings in storage
   */
  static async setUserSettings(userSettings: UserSettings): Promise<void> {
    await chrome.storage.local.set({ userSettings });
  }

  /**
   * Get statistics from storage
   */
  static async getStatistics(): Promise<Statistics> {
    const result = await chrome.storage.local.get('statistics');
    return result.statistics || DEFAULT_STATISTICS;
  }

  /**
   * Set statistics in storage
   */
  static async setStatistics(statistics: Statistics): Promise<void> {
    await chrome.storage.local.set({ statistics });
  }

  /**
   * Initialize storage with default values if not exists
   */
  static async initialize(): Promise<void> {
    const { gameState, userSettings, statistics } = await chrome.storage.local.get([
      'gameState',
      'userSettings',
      'statistics',
    ]);

    if (!gameState) {
      await this.setGameState(DEFAULT_GAME_STATE);
    }

    if (!userSettings) {
      await this.setUserSettings(DEFAULT_USER_SETTINGS);
    }

    if (!statistics) {
      await this.setStatistics(DEFAULT_STATISTICS);
    }
  }

  /**
   * Clear all storage (for debugging)
   */
  static async clear(): Promise<void> {
    await chrome.storage.local.clear();
    await this.initialize();
  }
}
