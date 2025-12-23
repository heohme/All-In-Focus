# Focus Hold'em - Quick Start Guide

## 🎯 What You Have Now

A fully functional Chrome Extension that gamifies the Pomodoro Technique with Texas Hold'em poker!

## 📦 Project Structure

```
pai/
├── dist/               # Built extension (load this in Chrome)
├── src/
│   ├── background/     # Service worker (game logic, timer)
│   ├── popup/          # Main popup UI
│   ├── decision/       # Blocking page
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities (poker, storage, hand comparison)
├── public/
│   ├── manifest.json
│   └── icons/
└── package.json
```

## 🚀 How to Install & Test

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder in this project

### 2. Start Using

1. Click the Focus Hold'em icon in your Chrome toolbar
2. You'll see your starting balance: **10 chips**
3. Enter a task (e.g., "Write documentation")
4. Click **"Deal & Focus"** (costs 1 chip)

### 3. During Focus Session

- **Timer**: 25 minutes countdown
- **Cards revealed progressively**:
  - 5 min: Flop (3 cards)
  - 15 min: Turn (4th card)
  - 23 min: River (5th card)
- **Blocked sites**: If you try to visit distracting sites (bilibili, reddit, etc.), you'll see a decision page

### 4. When Blocked

Two choices:
- **"I'm Still In"**: Close tab and continue focusing
- **"I Fold"**: Give up task, lose your blind (-1 chip)

### 5. Session Complete

After 25 minutes:
- **Win**: +2 chips 🎉
- **Lose**: +0.5 chips (consolation prize)
- **Fold**: -1 chip

## 🛠️ Development Commands

```bash
# Build extension
npm run build

# Development mode (not recommended for extensions)
npm run dev
```

## 🎨 Customization

### Change Blocked Sites

The default blocked sites are in `src/types/index.ts`:

```typescript
export const DEFAULT_USER_SETTINGS: UserSettings = {
  chips: 10,
  blockedSites: [
    '*://*.bilibili.com/*',
    '*://*.weibo.com/*',
    '*://*.douyin.com/*',
    '*://*.reddit.com/*',
    '*://*.twitter.com/*',
    '*://*.x.com/*',
  ],
};
```

After changing, rebuild with `npm run build`.

### Change Timer Duration

In `src/types/index.ts`, modify:

```typescript
export const DEFAULT_GAME_STATE: GameState = {
  // ...
  duration: 25 * 60 * 1000, // Change 25 to your preferred minutes
  // ...
};
```

### Change Reward Structure

In `src/background/background.ts`, find the `settleGame()` function:

```typescript
if (result === 'win') {
  chipsWon = 2; // Adjust win amount
} else if (result === 'lose') {
  chipsWon = 0.5; // Adjust lose amount (compensation)
}
```

## ⚠️ Known Limitations

1. **Icons**: Currently using 1x1 placeholder icons. Replace with proper icons in `public/icons/`:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

2. **Node.js Version**: Configured for Node 16. If you upgrade to Node 18+, you can use Vite 5 for better performance.

## 🐛 Debugging

### View Background Service Worker Logs

1. Go to `chrome://extensions/`
2. Click "Service Worker" under Focus Hold'em
3. Console will show logs from `src/background/background.ts`

### View Popup/Decision Page Logs

1. Right-click the extension popup → **Inspect**
2. Or open the decision page when blocked and press F12

### Reset All Data

In the background service worker console, run:

```javascript
chrome.storage.local.clear()
```

Then reload the extension.

## 🎮 Game Mechanics Summary

| Event | Chips Change |
|-------|--------------|
| Start session | -1 (blind) |
| Win (better hand) | +2 |
| Lose (worse hand) | +0.5 (consolation) |
| Fold (give up) | -1 (lose blind) |

**Starting balance**: 10 chips

## 📊 Statistics Tracked

- Total games played
- Wins / Losses / Folds
- Win rate
- Max chips achieved
- Total focus time (minutes)

View in the popup when idle.

## 🔧 Troubleshooting

**Problem**: Extension not loading
- **Solution**: Make sure you selected the `dist/` folder, not the project root

**Problem**: Sites not being blocked
- **Solution**: Check if the game is actually running (timer should show in popup)

**Problem**: Build fails
- **Solution**: Delete `node_modules` and run `npm install` again

**Problem**: Timer stops when popup closes
- **Solution**: This is expected! Timer runs in background using `chrome.alarms`, which persists

## 🚢 Next Steps

1. **Replace placeholder icons** with proper poker-themed icons
2. **Test thoroughly** with different websites
3. **Add more blocked sites** as needed
4. **Customize rewards** to match your motivation
5. **Share with friends** and collect feedback!

## 📝 License

MIT

---

**Enjoy focused work with a poker twist! 🃏⏱️**
