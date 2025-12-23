import { useState, useEffect } from 'react';
import { GameState, UserSettings, Statistics } from '../types';
import { Storage } from '../utils/storage';
import { formatTime, getRevealedCardsCount, getCardDisplay, getSuitColor, getNextCardRevealInfo } from '../utils/poker';

export default function Popup() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [taskName, setTaskName] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [newSite, setNewSite] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();

    // Listen for storage changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.gameState) {
        setGameState(changes.gameState.newValue);
      }
      if (changes.userSettings) {
        setUserSettings(changes.userSettings.newValue);
      }
      if (changes.statistics) {
        setStatistics(changes.statistics.newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  // Update remaining time every second
  useEffect(() => {
    if (gameState?.status !== 'playing') {
      return;
    }

    const updateTime = () => {
      const elapsed = Date.now() - gameState.startTime;
      const remaining = Math.max(0, gameState.duration - elapsed);
      setRemainingTime(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  async function loadData() {
    try {
      const [gs, us, stats] = await Promise.all([
        Storage.getGameState(),
        Storage.getUserSettings(),
        Storage.getStatistics(),
      ]);

      setGameState(gs);
      setUserSettings(us);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startGame() {
    if (!taskName.trim()) {
      alert('请输入任务名称');
      return;
    }

    if (!userSettings || userSettings.chips < 1) {
      alert('筹码不足，无法开始');
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'START_GAME',
        taskName: taskName.trim(),
      });

      setTaskName('');
    } catch (error) {
      console.error('Error starting game:', error);
      alert('启动游戏失败');
    }
  }

  function giveUp() {
    setConfirmDialog({
      show: true,
      title: '确认放弃',
      message: '确定要放弃吗？你将失去盲注（1 筹码）。',
      onConfirm: async () => {
        setConfirmDialog(null);
        console.log('User confirmed fold, proceeding...');

        try {
          console.log('Sending FOLD_GAME message...');
          const response = await chrome.runtime.sendMessage({ type: 'FOLD_GAME' });
          console.log('Fold game response:', response);

          if (response?.error) {
            alert('放弃失败: ' + response.error);
          } else {
            console.log('Fold successful, game should end now');
          }
        } catch (error) {
          console.error('Error folding game:', error);
          alert('放弃失败: ' + error);
        }
      }
    });
  }

  async function settleGame() {
    try {
      console.log('Settling game...');
      const message = { type: 'SETTLE_GAME' };
      console.log('Sending message:', message);

      const response = await chrome.runtime.sendMessage(message);
      console.log('Settle game response:', response);

      if (response?.error) {
        console.error('Settlement error:', response.error);
        alert('结算失败: ' + response.error);
      } else {
        console.log('Settlement successful');
      }
    } catch (error) {
      console.error('Error settling game:', error);
      alert('结算失败: ' + error);
    }
  }

  async function startNewGame() {
    try {
      console.log('Starting new game...');
      await chrome.runtime.sendMessage({ type: 'START_NEW_GAME' });
      console.log('New game started, reloading data...');
      await loadData();
    } catch (error) {
      console.error('Error starting new game:', error);
      alert('开始新游戏失败: ' + error);
    }
  }

  async function changeFocusDuration(duration: number) {
    if (!userSettings) return;

    try {
      const newSettings = {
        ...userSettings,
        focusDuration: duration,
      };
      await Storage.setUserSettings(newSettings);
      setUserSettings(newSettings);
    } catch (error) {
      console.error('Error changing focus duration:', error);
      alert('修改失败: ' + error);
    }
  }

  async function addBlockedSite() {
    if (!userSettings || !newSite.trim()) return;

    try {
      // Normalize the site input
      // Input examples: "zhihu", "zhihu.com", "www.zhihu.com", "https://zhihu.com"
      // Output: "zhihu.com" (or "zhihu.cn" if specified)
      let domain = newSite.trim();

      // Remove protocol if present
      domain = domain.replace(/^https?:\/\//, '');

      // Remove www. prefix
      domain = domain.replace(/^www\./, '');

      // Remove paths
      domain = domain.replace(/\/.*$/, '');

      // If no TLD specified, assume .com
      if (!domain.includes('.')) {
        domain = `${domain}.com`;
      }

      // Check if already exists
      if (userSettings.blockedSites.includes(domain)) {
        alert('该网站已在屏蔽列表中');
        return;
      }

      const newSettings = {
        ...userSettings,
        blockedSites: [...userSettings.blockedSites, domain],
      };
      await Storage.setUserSettings(newSettings);
      setUserSettings(newSettings);
      setNewSite('');
    } catch (error) {
      console.error('Error adding blocked site:', error);
      alert('添加失败: ' + error);
    }
  }

  async function removeBlockedSite(index: number) {
    if (!userSettings) return;

    try {
      const newSettings = {
        ...userSettings,
        blockedSites: userSettings.blockedSites.filter((_, i) => i !== index),
      };
      await Storage.setUserSettings(newSettings);
      setUserSettings(newSettings);
    } catch (error) {
      console.error('Error removing blocked site:', error);
      alert('移除失败: ' + error);
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <div className="text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!gameState || !userSettings) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <div className="text-lg">加载游戏失败</div>
      </div>
    );
  }

  // Finished view (showing results)
  if (gameState.status === 'finished') {
    const result = gameState.result || 'tie';
    const chipsWon = gameState.chipsWon || 0;
    const resultText = result === 'win' ? '你赢了！' : result === 'lose' ? '你输了' : '平局';
    const resultColor = result === 'win' ? 'text-green-400' : result === 'lose' ? 'text-red-400' : 'text-yellow-400';

    // Helper function to check if a card is in the best hand
    const isCardInBestHand = (card: string, bestCards: string[] | undefined): boolean => {
      if (!bestCards) return false;
      // Normalize card format: T -> 10, for comparison
      const normalizedCard = card.replace('T', '10');
      return bestCards.some(bestCard => {
        const normalizedBestCard = bestCard.replace('T', '10');
        return normalizedCard === normalizedBestCard;
      });
    };

    // Determine which hand won for highlighting
    const winningBestCards = result === 'win'
      ? gameState.myBestCards
      : result === 'lose'
      ? gameState.villainBestCards
      : undefined; // No highlighting on tie

    return (
      <div className="w-full h-full text-gray-100 flex justify-center">
        <div className="relative w-full max-w-sm h-full flex flex-col">
        {/* Header */}
        <div className="relative bg-gray-900/90 backdrop-blur-xl px-6 py-4 text-center shrink-0 border-b border-gray-700/50 shadow-sm">
          <div className={`text-2xl font-bold ${resultColor} animate-[fadeIn_0.5s_ease-out]`}>{resultText}</div>
          <div className="text-lg font-semibold text-gray-300 animate-[fadeIn_0.7s_ease-out]">
            +{chipsWon.toFixed(1)} 筹码
          </div>
        </div>

        {/* Task Name */}
        <div className="relative px-6 py-2 bg-gray-800/80 backdrop-blur-lg text-center text-xs text-gray-400 shrink-0 truncate border-b border-gray-700/30">
          <span className="font-medium">{gameState.taskName}</span>
        </div>

        {/* Table Area */}
        <div className="relative flex-1 px-6 py-4 flex flex-col justify-around min-h-[300px] bg-gray-900/60 backdrop-blur-lg">

          {/* Community Cards */}
          <div className="relative flex justify-center gap-2 animate-[fadeIn_0.6s_ease-out]">
            {gameState.communityCards.slice(0, 5).map((card, index) => (
              <div key={index} style={{ animationDelay: `${index * 0.1}s` }} className="animate-[cardFlip_0.5s_ease-out]">
                <Card
                  card={card}
                  highlight={isCardInBestHand(card, winningBestCards)}
                />
              </div>
            ))}
          </div>

          {/* Villain Hand - NOW REVEALED */}
          <div className="relative flex flex-col items-center animate-[fadeIn_0.8s_ease-out]">
            <div className="text-xs font-semibold text-gray-400 mb-1.5 bg-gray-800/50 px-3 py-1 rounded-full">
              对手
            </div>
            <div className="flex gap-2 mb-2">
              {gameState.villainHand.map((card, index) => (
                <div key={index} style={{ animationDelay: `${index * 0.1}s` }} className="animate-[cardFlip_0.5s_ease-out]">
                  <Card
                    card={card}
                    highlight={result === 'lose' && isCardInBestHand(card, gameState.villainBestCards)}
                  />
                </div>
              ))}
            </div>
            {gameState.villainHandDescription && (
              <div className="text-sm font-semibold text-gray-200 px-3 py-1 rounded-lg bg-gray-800/60 backdrop-blur-sm">
                {gameState.villainHandDescription}
              </div>
            )}
          </div>

          {/* My Hand */}
          <div className="relative flex flex-col items-center animate-[fadeIn_1s_ease-out]">
            <div className="text-xs font-semibold text-gray-400 mb-1.5 bg-gray-800/50 px-3 py-1 rounded-full">
              你的手牌
            </div>
            <div className="flex gap-2 mb-2">
              {gameState.myHand.map((card, index) => (
                <div key={index} style={{ animationDelay: `${index * 0.1}s` }} className="animate-[cardFlip_0.5s_ease-out]">
                  <Card
                    card={card}
                    highlight={result === 'win' && isCardInBestHand(card, gameState.myBestCards)}
                  />
                </div>
              ))}
            </div>
            {gameState.myHandDescription && (
              <div className="text-sm font-semibold text-gray-200 px-3 py-1 rounded-lg bg-gray-800/60 backdrop-blur-sm">
                {gameState.myHandDescription}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="relative px-6 py-4 bg-gray-900/90 backdrop-blur-xl space-y-3 shrink-0 border-t border-gray-700/50 shadow-sm">
          <div className="text-center text-sm text-gray-400">
            余额: <span className="text-lg font-bold text-gray-100">
              {userSettings.chips.toFixed(1)}
            </span> <span className="text-xs text-gray-500">筹码</span>
          </div>
          <button
            onClick={startNewGame}
            className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            再开一局
          </button>
        </div>

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-xs mx-4 shadow-2xl border border-gray-700/50 animate-[fadeIn_0.3s_ease-out]">
              <h3 className="text-xl font-bold text-gray-100 mb-3">
                {confirmDialog.title}
              </h3>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-xl font-semibold transition-all duration-200 active:scale-95"
                >
                  取消
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2.5 px-4 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm rounded-xl font-semibold transition-all duration-200 active:scale-95"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  // Setup view (not playing and not finished)
  if (gameState.status === 'idle') {
    return (
      <div className="w-full h-full text-gray-100 flex justify-center">
        <div className="relative w-full max-w-sm h-full flex flex-col">
          {/* Header - Fixed at top */}
          <div className="relative shrink-0 px-6 py-4 bg-gray-900/90 backdrop-blur-xl border-b border-gray-700/50 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-start mb-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-2xl text-gray-400 hover:text-gray-200 transition-all duration-200"
              >
                ⚙️
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold text-gray-100">
                  All-In Focus
                </h1>
              </div>
              <div className="w-8"></div>
            </div>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/60 backdrop-blur-sm rounded-full shadow-sm">
                <span className="text-xl font-bold text-gray-100">
                  {userSettings.chips.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">筹码</span>
              </div>
            </div>
          </div>

          {/* Main Content - Centered vertically */}
          <div className="flex-1 flex flex-col justify-center px-6 py-4 space-y-4 min-h-0 bg-gray-900/60 backdrop-blur-lg">
            {/* Stats */}
            {statistics && statistics.totalGames > 0 && (
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 shadow-sm animate-[fadeIn_0.5s_ease-out]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/80 rounded-lg p-2 shadow-sm">
                    <div className="text-xs text-gray-400">游戏数</div>
                    <div className="text-lg font-bold text-gray-100">{statistics.totalGames}</div>
                  </div>
                  <div className="bg-green-900/50 rounded-lg p-2 shadow-sm border border-green-700/30">
                    <div className="text-xs text-green-400">胜利</div>
                    <div className="text-lg font-bold text-green-300">{statistics.wins}</div>
                  </div>
                  <div className="bg-red-900/50 rounded-lg p-2 shadow-sm border border-red-700/30">
                    <div className="text-xs text-red-400">失败</div>
                    <div className="text-lg font-bold text-red-300">{statistics.losses}</div>
                  </div>
                  <div className="bg-orange-900/50 rounded-lg p-2 shadow-sm border border-orange-700/30">
                    <div className="text-xs text-orange-400">弃牌</div>
                    <div className="text-lg font-bold text-orange-300">{statistics.folds}</div>
                  </div>
                </div>
                <div className="mt-3 text-center p-2 bg-gray-700/50 rounded-lg shadow-sm">
                  <span className="text-xs text-gray-400">胜率：</span>
                  <span className="text-base font-bold text-gray-100">
                    {statistics.totalGames > 0 ? ((statistics.wins / statistics.totalGames) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            )}

            {/* Task Input Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-300 animate-[fadeIn_0.7s_ease-out]">你要专注做什么？</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startGame()}
                placeholder="例如：修复登录问题"
                className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-all duration-200 shadow-sm animate-[fadeIn_0.8s_ease-out]"
              />

              <div className="flex items-center justify-center gap-3 text-xs text-gray-400 animate-[fadeIn_0.9s_ease-out]">
                <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full shadow-sm">
                  <span>盲注: 1</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full shadow-sm">
                  <span>{userSettings.focusDuration}分钟</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full shadow-sm">
                  <span>底池: 2</span>
                </div>
              </div>

              <button
                onClick={startGame}
                disabled={!taskName.trim() || userSettings.chips < 1}
                className="w-full py-4 bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] animate-[fadeIn_1.1s_ease-out]"
              >
                Go All-In ({userSettings.focusDuration}m)
              </button>

              {userSettings.chips < 1 && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm text-center mt-2 bg-red-900/30 py-2 px-4 rounded-lg border border-red-700/30 animate-pulse">
                  <span>筹码不足</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel - Fixed overlay */}
          {showSettings && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-700/50 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-100">
                    设置
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-2xl text-gray-400 hover:text-gray-200 transition-all duration-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Focus Duration Selector */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">
                    番茄时长
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 25].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => changeFocusDuration(duration)}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          userSettings.focusDuration === duration
                            ? 'bg-[#10B981] text-white shadow-sm'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {duration}分钟
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blocked Sites Section */}
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  屏蔽网站
                </h4>

                {/* Add New Site */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSite}
                      onChange={(e) => setNewSite(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addBlockedSite()}
                      placeholder="输入网站，如：zhihu"
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-sm transition-all duration-200"
                    />
                    <button
                      onClick={addBlockedSite}
                      className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* Blocked Sites List */}
                <div className="space-y-2">
                  {userSettings.blockedSites.map((site, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700/50 hover:bg-gray-700 rounded-lg px-3 py-2 transition-all duration-200 group">
                      <span className="text-sm truncate flex-1 text-gray-300">{site}</span>
                      <button
                        onClick={() => removeBlockedSite(index)}
                        className="ml-2 text-red-400 hover:text-red-300 transition-all duration-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmDialog && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-xs mx-4 shadow-2xl border border-gray-700/50 animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">{confirmDialog.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-xl font-semibold transition-all duration-200 active:scale-95"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 py-2.5 px-4 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm rounded-xl font-semibold transition-all duration-200 active:scale-95"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // In-game view
  const revealedCount = getRevealedCardsCount(remainingTime, gameState.duration);
  const nextCardInfo = getNextCardRevealInfo(remainingTime, gameState.duration);

  return (
    <div className="w-full h-full text-gray-100 flex justify-center">
      <div className="relative w-full max-w-sm h-full flex flex-col">
      {/* Top Bar */}
      <div className="relative bg-gray-900/90 backdrop-blur-xl px-6 py-3 flex justify-between items-center shrink-0 border-b border-gray-700/50 shadow-sm">
        <div className="text-2xl font-bold text-gray-100 animate-pulse">
          {formatTime(remainingTime)}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full shadow-sm">
            <span className="font-bold text-gray-100">{userSettings.chips.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full shadow-sm">
            <span className="font-bold text-gray-100">{gameState.pot}</span>
          </div>
        </div>
      </div>

      {/* Task Name */}
      <div className="relative px-6 py-2 bg-gray-800/80 backdrop-blur-lg text-center text-sm text-gray-300 shrink-0 border-b border-gray-700/30">
        <span className="font-semibold">{gameState.taskName}</span>
      </div>

      {/* Table Area */}
      <div className="relative flex-1 px-6 py-4 flex flex-col justify-around min-h-[300px] bg-gray-900/60 backdrop-blur-lg">
        {/* Community Cards */}
        <div className="relative flex flex-col items-center gap-2">
          {/* Next card countdown */}
          {nextCardInfo && (
            <div className="text-xs text-gray-300 bg-gray-800/60 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm animate-pulse">
              {formatTime(nextCardInfo.timeUntil)}后发{nextCardInfo.nextCardName}
            </div>
          )}

          {/* Cards */}
          <div className="flex justify-center gap-2">
            {gameState.communityCards.slice(0, 5).map((card, index) => (
              <div key={index} style={{ animationDelay: `${index * 0.1}s` }} className={index < revealedCount ? "animate-[cardFlip_0.5s_ease-out]" : ""}>
                {index < revealedCount ? (
                  <Card card={card} />
                ) : (
                  <CardBack />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Villain Hand */}
        <div className="relative flex flex-col items-center">
          <div className="text-xs font-semibold text-gray-400 mb-1.5 bg-gray-800/50 px-3 py-1 rounded-full">
            对手
          </div>
          <div className="flex gap-2">
            <CardBack />
            <CardBack />
          </div>
        </div>

        {/* My Hand */}
        <div className="relative flex flex-col items-center">
          <div className="text-xs font-semibold text-gray-400 mb-1.5 bg-gray-800/50 px-3 py-1 rounded-full">
            你的手牌
          </div>
          <div className="flex gap-2">
            {gameState.myHand.map((card, index) => (
              <div key={index} style={{ animationDelay: `${index * 0.1}s` }} className="animate-[cardFlip_0.5s_ease-out]">
                <Card card={card} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="relative px-6 py-4 bg-gray-900/90 backdrop-blur-xl shrink-0 border-t border-gray-700/50 shadow-sm">
        {remainingTime > 0 ? (
          <div className="space-y-2.5">
            <button
              onClick={giveUp}
              className="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Fold Hand
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="text-center text-lg font-semibold mb-2 text-[#10B981] animate-pulse">
              专注时间完成！
            </div>
            <button
              onClick={settleGame}
              className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              开牌决胜负
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-xs mx-4 shadow-2xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-gray-100 mb-3">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-300 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-xl font-semibold transition-all duration-200 active:scale-95"
              >
                取消
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 px-4 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm rounded-xl font-semibold transition-all duration-200 active:scale-95"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Card component - Premium version
function Card({ card, highlight = false }: { card: string; highlight?: boolean }) {
  const display = getCardDisplay(card as any);
  const color = getSuitColor(card[1]);

  return (
    <div className={`
      relative w-12 h-16 bg-gradient-to-br from-white via-gray-50 to-white
      rounded-lg shadow-xl flex items-center justify-center
      transition-all duration-300
      border-2 ${highlight ? 'border-yellow-400' : 'border-gray-200'}
      ${highlight ? 'ring-4 ring-yellow-400/50 shadow-[0_0_25px_rgba(250,204,21,0.9)] scale-110 -translate-y-1' : 'hover:scale-105 hover:-translate-y-0.5'}
    `}>
      {/* Inner glow effect */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 rounded-lg animate-pulse"></div>
      )}

      {/* Card value */}
      <div className={`
        relative text-xl font-bold
        ${color === 'red' ? 'text-red-600' : 'text-gray-900'}
        drop-shadow-sm
      `}>
        {display}
      </div>

      {/* Corner shine effect */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-white/60 to-transparent rounded-tl-lg rounded-br-full"></div>
    </div>
  );
}

// Card back component - Premium version
function CardBack() {
  return (
    <div className="
      relative w-12 h-16
      bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800
      rounded-lg shadow-xl
      flex items-center justify-center
      border-2 border-blue-400/30
      overflow-hidden
      hover:scale-105 hover:-translate-y-0.5 transition-all duration-300
    ">
      {/* Animated pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>

      {/* Card back symbol */}
      <div className="relative text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        🂠
      </div>

      {/* Corner accents */}
      <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-blue-300/50 rounded-tl"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-blue-300/50 rounded-br"></div>
    </div>
  );
}
