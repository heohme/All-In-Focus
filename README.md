Allin focus

新年第一提，坚持

坚持种一棵树, 坐标云南、普洱

期待景迈山

# Focus Hold'em

A Chrome Extension that combines Texas Hold'em poker mechanics with the Pomodoro Technique to help you stay focused.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Icons

You need to create three icon files in the `public/icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use any poker-themed icon (like a poker chip or playing card). For quick testing, you can:

1. Use an online icon generator
2. Or create placeholder icons using ImageMagick:

```bash
# Install ImageMagick if you don't have it
# brew install imagemagick (macOS)
# sudo apt-get install imagemagick (Linux)

# Create simple colored icons
convert -size 16x16 xc:#16a34a public/icons/icon16.png
convert -size 48x48 xc:#16a34a public/icons/icon48.png
convert -size 128x128 xc:#16a34a public/icons/icon128.png
```

### 3. Build the Extension

```bash
npm run build
```

This will create a `dist/` folder with your compiled extension.

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder

### 5. Configure Blocked Sites (Optional)

By default, the extension blocks:
- bilibili.com
- weibo.com
- douyin.com
- reddit.com
- twitter.com / x.com

You can modify the blocked sites list in the extension's storage.

## How to Use

1. Click the extension icon to open the popup
2. Enter what you want to focus on (e.g., "Fix login bug")
3. Click "Deal & Focus" to start a 25-minute session
4. You'll be dealt 2 cards, and community cards reveal over time:
   - **5 min**: Flop (3 cards)
   - **15 min**: Turn (4th card)
   - **23 min**: River (5th card)
5. If you try to visit a blocked site, you'll be prompted to either:
   - **Stay in**: Close the tab and continue focusing
   - **Fold**: Give up the session (lose your blind)
6. When time's up, compare your hand with the opponent:
   - **Win**: +2 chips
   - **Lose**: +0.5 chips (consolation)
   - **Fold**: -1 chip

## Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── public/
│   ├── manifest.json       # Chrome extension manifest
│   └── icons/              # Extension icons
├── src/
│   ├── background/
│   │   └── background.ts   # Service worker (game logic, timer, blocking)
│   ├── popup/
│   │   ├── Popup.tsx       # Main popup UI
│   │   └── main.tsx        # Popup entry point
│   ├── decision/
│   │   ├── Decision.tsx    # Blocking page UI
│   │   └── main.tsx        # Decision page entry point
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   └── utils/
│       ├── poker.ts        # Poker game utilities
│       ├── storage.ts      # Chrome storage utilities
│       └── handComparison.ts # Hand comparison logic
├── popup.html              # Popup HTML
├── decision.html           # Decision page HTML
└── vite.config.ts          # Vite configuration
```

## Features

- ✅ 25-minute focus sessions with Pomodoro timer
- ✅ Texas Hold'em poker mechanics
- ✅ Progressive card reveals based on time
- ✅ Website blocking during focus sessions
- ✅ Chip economy system
- ✅ Win/loss statistics
- ✅ Beautiful UI with Tailwind CSS

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **pokersolver** - Hand comparison
- **Chrome Extension Manifest V3** - Extension platform

## License

MIT
# All-In-Focus
