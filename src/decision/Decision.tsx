import { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { Storage } from '../utils/storage';

export default function Decision() {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [folding, setFolding] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string>('');

  useEffect(() => {
    loadData();
    extractBlockedUrl();
  }, []);

  function extractBlockedUrl() {
    try {
      // Get the blocked URL from query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const blockedUrl = urlParams.get('url');

      if (blockedUrl) {
        setOriginalUrl(decodeURIComponent(blockedUrl));
        console.log('Got blocked URL from query parameter:', blockedUrl);
      } else {
        console.log('No blocked URL in query parameter');
      }
    } catch (error) {
      console.error('Error extracting blocked URL:', error);
    }
  }

  async function loadData() {
    try {
      const settings = await Storage.getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    // Close this tab and continue focusing
    window.close();
  }

  async function handleFold() {
    try {
      setFolding(true);

      // Send fold message to background (this will disable blocking)
      await chrome.runtime.sendMessage({ type: 'FOLD_GAME' });

      // Wait 3 seconds to show the message
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try to navigate back or close
      if (originalUrl) {
        // Navigate to the original URL (blocking is now disabled)
        window.location.href = originalUrl;
      } else if (window.history.length > 1) {
        // Go back in history if available
        window.history.back();
      } else {
        // Close the tab as last resort
        window.close();
      }
    } catch (error) {
      console.error('Error folding:', error);
      // If navigation doesn't work, just close the tab
      window.close();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  // Show folding message
  if (folding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <div className="text-8xl mb-8">🤝</div>
          <h1 className="text-5xl font-bold text-blue-400 mb-6">
            适当的放弃，也不失为一种策略
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            正在返回页面...
          </p>
          <div className="animate-pulse text-gray-500">
            即将跳转
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-gray-900 to-black flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Warning Icon */}
        <div className="text-8xl mb-8 animate-pulse">⚠️</div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-red-500 mb-4">
          分心警告！
        </h1>

        <p className="text-2xl text-gray-300 mb-8">
          你即将离开专注时段
        </p>

        {/* Info Box */}
        <div className="bg-black/40 rounded-lg p-6 mb-8 border border-red-500/30">
          <div className="text-lg text-gray-300 mb-4">
            你要弃牌吗？
          </div>

          <div className="flex justify-center gap-8 text-left">
            <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/50">
              <div className="text-green-400 font-bold mb-1">如果你赢了：</div>
              <div className="text-white text-2xl">+2 筹码 🎉</div>
            </div>

            <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/50">
              <div className="text-red-400 font-bold mb-1">如果你弃牌：</div>
              <div className="text-white text-2xl">-1 筹码 💸</div>
            </div>
          </div>

          {userSettings && (
            <div className="mt-4 text-gray-400">
              当前余额: <span className="text-yellow-400 font-bold">{userSettings.chips.toFixed(1)} 筹码</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleContinue}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            我继续坚持 💪
            <div className="text-sm font-normal mt-1">（关闭此标签页）</div>
          </button>

          <button
            onClick={handleFold}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg font-bold text-xl transition-all border border-gray-600"
          >
            我弃牌 😔
            <div className="text-sm font-normal mt-1">（放弃任务）</div>
          </button>
        </div>

        {/* Motivational Text */}
        <div className="mt-12 text-gray-500 text-sm">
          <p>记住：坚持专注才能赢得最好的牌。</p>
          <p className="mt-2">关闭这个标签页，继续工作！🎯</p>
        </div>
      </div>
    </div>
  );
}
