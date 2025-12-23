import { Storage } from '../utils/storage';
import { dealCards } from '../utils/poker';
import { compareHands, getHandDescription } from '../utils/handComparison';
import { GameState, Card } from '../types';

const ALARM_NAME = 'focusTimer';
const BLOCKING_RULE_ID = 1;

// Offscreen document management for audio playback
let offscreenCreating: Promise<void> | null = null;

// Track if completion bell has been played for current session
let completionBellPlayed = false;

// Track the popup window
let popupWindowId: number | null = null;

async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }

  offscreenCreating = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK' as chrome.offscreen.Reason],
    justification: 'Playing focus timer ticking sound and completion bell',
  });

  await offscreenCreating;
  offscreenCreating = null;
  console.log('Offscreen document created');
}

async function sendAudioMessage(type: string) {
  try {
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type });
  } catch (error) {
    console.error(`Error sending audio message ${type}:`, error);
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Focus Hold\'em installed');
  await Storage.initialize();
});

// Handle extension icon click - open popup window
chrome.action.onClicked.addListener(async () => {
  // Check if popup window already exists
  if (popupWindowId !== null) {
    try {
      await chrome.windows.get(popupWindowId);
      // Window exists, focus it
      await chrome.windows.update(popupWindowId, { focused: true });
      return;
    } catch (error) {
      // Window doesn't exist anymore, clear the ID
      popupWindowId = null;
    }
  }

  // Create new popup window
  const window = await chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 400,
    height: 620,
    focused: true,
  });

  popupWindowId = window.id || null;
});

// Clean up window ID when window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null;
  }
});

// Listen for messages from popup and decision pages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'START_GAME':
          await startGame(message.taskName);
          sendResponse({ success: true });
          break;

        case 'FOLD_GAME':
          console.log('Received FOLD_GAME message');
          await foldGame();
          console.log('Fold complete');
          sendResponse({ success: true });
          break;

        case 'SETTLE_GAME':
          console.log('Received SETTLE_GAME message');
          await settleGame();
          console.log('Settlement complete');
          sendResponse({ success: true });
          break;

        case 'GET_REMAINING_TIME':
          const remainingTime = await getRemainingTime();
          sendResponse({ remainingTime });
          break;

        case 'RESET_STORAGE':
          console.log('Resetting storage...');
          // Stop any audio that might be playing
          await sendAudioMessage('STOP_TICKING');
          await Storage.clear(); // Use clear() instead of initialize()
          console.log('Storage reset complete');
          sendResponse({ success: true });
          break;

        case 'START_NEW_GAME':
          console.log('Starting new game after finish');
          // Ensure audio is stopped before starting new game
          await sendAudioMessage('STOP_TICKING');
          const gameState = await Storage.getGameState();
          gameState.status = 'idle';
          gameState.result = undefined;
          gameState.chipsWon = undefined;
          await Storage.setGameState(gameState);
          console.log('Ready for new game');
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: String(error) });
    }
  })();

  return true; // Keep channel open for async response
});

/**
 * Start a new focus session
 */
async function startGame(taskName: string): Promise<void> {
  const userSettings = await Storage.getUserSettings();

  // Check if player has enough chips
  if (userSettings.chips < 1) {
    throw new Error('Not enough chips to start');
  }

  // Deduct blind
  userSettings.chips -= 1;
  await Storage.setUserSettings(userSettings);

  // Deal cards
  const { myHand, villainHand, communityCards, deck } = dealCards();

  // Set duration based on user settings
  const duration = userSettings.focusDuration * 60 * 1000;

  // Create game state
  const gameState: GameState = {
    status: 'playing',
    startTime: Date.now(),
    duration,
    taskName,
    deck,
    myHand,
    villainHand,
    communityCards,
    blind: 1,
    pot: 2,
  };

  await Storage.setGameState(gameState);

  // Reset completion bell flag for new game
  completionBellPlayed = false;

  // Set up timer alarm - check every 5 seconds for short durations, every minute for longer ones
  const alarmInterval = userSettings.focusDuration <= 5 ? 5 / 60 : 1;
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: alarmInterval,
    periodInMinutes: alarmInterval,
  });

  // Enable blocking
  console.log('Enabling blocking for sites:', userSettings.blockedSites);
  await enableBlocking(userSettings.blockedSites);
  console.log('Blocking enabled');

  // Update badge
  await updateBadge();

  // Start ticking sound
  await sendAudioMessage('START_TICKING');
  console.log('Started ticking sound');
}

/**
 * Fold the game (player gives up)
 */
async function foldGame(): Promise<void> {
  const gameState = await Storage.getGameState();
  const statistics = await Storage.getStatistics();

  console.log('foldGame called, game status:', gameState.status);

  if (gameState.status !== 'playing') {
    console.log('Game not in playing state, skipping fold');
    return;
  }

  // Update statistics
  statistics.folds += 1;
  statistics.totalGames += 1;

  // Calculate focus time
  const focusTime = Math.floor((Date.now() - gameState.startTime) / 60000);
  statistics.totalFocusTime += focusTime;

  console.log('Updating statistics, folds:', statistics.folds);
  await Storage.setStatistics(statistics);

  // Stop ticking sound
  await sendAudioMessage('STOP_TICKING');
  console.log('Stopped ticking sound after fold');

  // End game
  console.log('Ending game after fold...');
  await endGame();
  console.log('Game ended after fold');
}

/**
 * End the game and settle
 */
async function endGame(): Promise<void> {
  // Stop ticking sound (in case it's still playing)
  await sendAudioMessage('STOP_TICKING');

  // Clear alarm
  await chrome.alarms.clear(ALARM_NAME);

  // Disable blocking
  await disableBlocking();

  // Reset game state
  const gameState = await Storage.getGameState();
  gameState.status = 'idle';
  await Storage.setGameState(gameState);

  // Clear badge
  await chrome.action.setBadgeText({ text: '' });
}

/**
 * Settle the game when user clicks "开牌"
 */
async function settleGame(): Promise<void> {
  const gameState = await Storage.getGameState();
  const userSettings = await Storage.getUserSettings();
  const statistics = await Storage.getStatistics();

  console.log('settleGame called, game status:', gameState.status);

  if (gameState.status !== 'playing') {
    console.log('Game not in playing state, skipping settlement');
    return;
  }

  // Compare hands and get descriptions
  const comparison = compareHands(
    gameState.myHand as Card[],
    gameState.villainHand as Card[],
    gameState.communityCards as Card[]
  );

  const myHandDescription = getHandDescription(
    gameState.myHand as Card[],
    gameState.communityCards as Card[]
  );

  const villainHandDescription = getHandDescription(
    gameState.villainHand as Card[],
    gameState.communityCards as Card[]
  );

  // Update chips based on result
  let chipsWon = 0;
  if (comparison.result === 'win') {
    chipsWon = 2; // Win the pot
    statistics.wins += 1;
  } else if (comparison.result === 'lose') {
    chipsWon = 0.5; // Consolation prize
    statistics.losses += 1;
  } else {
    chipsWon = 1; // Tie - return blind
  }

  userSettings.chips += chipsWon;

  // Update max chips
  if (userSettings.chips > statistics.maxChips) {
    statistics.maxChips = userSettings.chips;
  }

  // Update statistics
  statistics.totalGames += 1;
  const focusMinutes = Math.floor(gameState.duration / 60000); // Convert ms to minutes
  statistics.totalFocusTime += focusMinutes;

  await Storage.setUserSettings(userSettings);
  await Storage.setStatistics(statistics);

  console.log('Settlement result:', comparison.result, 'chips won:', chipsWon);

  // Stop ticking sound and play completion bell
  await sendAudioMessage('STOP_TICKING');
  await sendAudioMessage('PLAY_COMPLETION_BELL');
  console.log('Stopped ticking, played completion bell');

  // Update game state to finished with result
  gameState.status = 'finished';
  gameState.result = comparison.result;
  gameState.chipsWon = chipsWon;
  gameState.myHandDescription = myHandDescription;
  gameState.villainHandDescription = villainHandDescription;
  gameState.myBestCards = comparison.myBestCards;
  gameState.villainBestCards = comparison.villainBestCards;
  await Storage.setGameState(gameState);

  // Show notification (don't let this block the settlement)
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '专注时段完成！',
      message: comparison.result === 'win'
        ? `你赢了！+${chipsWon} 筹码`
        : comparison.result === 'lose'
        ? `你输了，不过这是你的 ${chipsWon} 筹码奖励`
        : `平局！+${chipsWon} 筹码`,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }

  // Clear alarm and blocking
  await chrome.alarms.clear(ALARM_NAME);
  await disableBlocking();

  // Clear badge
  await chrome.action.setBadgeText({ text: '' });

  console.log('Game settled, showing results');
}

/**
 * Get remaining time in milliseconds
 */
async function getRemainingTime(): Promise<number> {
  const gameState = await Storage.getGameState();

  if (gameState.status !== 'playing') {
    return 0;
  }

  const elapsed = Date.now() - gameState.startTime;
  const remaining = Math.max(0, gameState.duration - elapsed);

  return remaining;
}

/**
 * Alarm listener - called every 10 seconds
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) {
    return;
  }

  const remainingTime = await getRemainingTime();
  const gameState = await Storage.getGameState();

  // Check if time is up and play bell sound (only once)
  if (remainingTime <= 0 && gameState.status === 'playing' && !completionBellPlayed) {
    console.log('Time is up, stopping ticking and playing completion bell');
    await sendAudioMessage('STOP_TICKING');
    await sendAudioMessage('PLAY_COMPLETION_BELL');
    completionBellPlayed = true; // Mark as played to prevent repeating
  }

  // Update badge
  await updateBadge();

  // Update revealed cards in storage
  if (gameState.status === 'playing') {
    // The revealed cards count is calculated on-the-fly in the UI
    // No need to update storage here
  }
});

/**
 * Update badge with remaining time
 */
async function updateBadge(): Promise<void> {
  const remainingTime = await getRemainingTime();

  if (remainingTime <= 0) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }

  const minutes = Math.ceil(remainingTime / 60000);
  await chrome.action.setBadgeText({ text: String(minutes) });
  await chrome.action.setBadgeBackgroundColor({ color: '#16a34a' }); // Green
}

// Add webNavigation listener as backup blocking method
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    // Only handle main frame navigations
    if (details.frameId !== 0) return;

    const { gameState, userSettings } = await chrome.storage.local.get(['gameState', 'userSettings']);
    
    // Only block during active gameplay
    if (!gameState || gameState.status !== 'playing' || !userSettings) return;

    const url = details.url;
    const blockedSites = userSettings.blockedSites || [];

    // Check if URL matches any blocked site
    const isBlocked = blockedSites.some((site: string) => {
      const domain = site.includes('.') ? site : `${site}.com`;
      // Check if domain is in the URL
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain);
      } catch {
        return url.includes(domain);
      }
    });

    if (isBlocked) {
      console.log('🚫 webNavigation blocking:', url);
      const decisionUrl = chrome.runtime.getURL(`decision.html?url=${encodeURIComponent(url)}`);
      await chrome.tabs.update(details.tabId, { url: decisionUrl });
    }
  }
);

/**
 * Enable website blocking
 */
async function enableBlocking(blockedSites: string[]): Promise<void> {
  console.log('enableBlocking called with sites:', blockedSites);

  if (!blockedSites || blockedSites.length === 0) {
    console.log('No sites to block');
    return;
  }

  const rules: chrome.declarativeNetRequest.Rule[] = [];
  let ruleId = BLOCKING_RULE_ID;

  blockedSites.forEach((site) => {
    // Convert site keyword to domain format
    let domain = site.trim();

    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '');

    // Remove wildcards and paths
    domain = domain.replace(/^\*+\.?/, '').replace(/\/.*$/, '').replace(/\*.*$/, '');

    // If no TLD, assume .com
    if (!domain.includes('.')) {
      domain = `${domain}.com`;
    }

    // Escape special regex characters in domain
    const escapedDomain = domain.replace(/\./g, '\\.');

    console.log(`Processing site: "${site}" -> domain: "${domain}" -> escaped: "${escapedDomain}"`);

    // Create two rules for each domain:
    // 1. Match main domain (e.g., x.com)
    // 2. Match subdomains (e.g., www.x.com)

    const mainDomainRegex = `^https?://${escapedDomain}(/.*)?$`;
    const subdomainRegex = `^https?://[^/]*\\.${escapedDomain}(/.*)?$`;

    console.log(`  Main domain regex: ${mainDomainRegex}`);
    console.log(`  Subdomain regex: ${subdomainRegex}`);

    // Rule for main domain
    rules.push({
      id: ruleId++,
      priority: 10,
      action: {
        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
        redirect: {
          regexSubstitution: `chrome-extension://${chrome.runtime.id}/decision.html?url=\\0`,
        },
      },
      condition: {
        regexFilter: mainDomainRegex,
        resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
      },
    });

    // Rule for subdomains
    rules.push({
      id: ruleId++,
      priority: 10,
      action: {
        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
        redirect: {
          regexSubstitution: `chrome-extension://${chrome.runtime.id}/decision.html?url=\\0`,
        },
      },
      condition: {
        regexFilter: subdomainRegex,
        resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
      },
    });

    console.log(`  Created rules with IDs: ${ruleId - 2}, ${ruleId - 1}`);
  });

  console.log('Enabling blocking with', rules.length, 'rules');
  console.log('Rules:', JSON.stringify(rules, null, 2));

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules,
    });
    console.log('Blocking rules enabled successfully');

    // Verify rules were added
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log('Current dynamic rules count:', currentRules.length);
    console.log('Current rules:', currentRules);
  } catch (error) {
    console.error('Failed to enable blocking rules:', error);
    throw error;
  }
}

/**
 * Disable website blocking
 */
async function disableBlocking(): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIds = existingRules.map(r => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIds,
  });
}
