# 调试网站屏蔽问题

## 步骤1: 检查扩展权限
1. 打开 `chrome://extensions/`
2. 找到 Focus Hold'em
3. 确认权限中包含：
   - ✅ 网站数据访问权限（所有网站）
   - ✅ 更改与您访问的网站相关的数据

## 步骤2: 检查游戏状态
1. 点击扩展图标
2. 输入任务并点击"发牌并开始专注"
3. 打开 `chrome://extensions/`
4. 点击 Focus Hold'em 下的"service worker"链接（或"查看视图"）
5. 在控制台中输入以下命令：

```javascript
chrome.storage.local.get(['gameState', 'userSettings'], (data) => {
  console.log('Game Status:', data.gameState?.status);
  console.log('Blocked Sites:', data.userSettings?.blockedSites);
});
```

应该看到：
- Game Status: "playing"
- Blocked Sites: 包含 "x.com"

## 步骤3: 检查屏蔽规则
在 service worker 控制台中输入：

```javascript
chrome.declarativeNetRequest.getDynamicRules((rules) => {
  console.log('Active Rules:', rules);
  console.log('Total Rules:', rules.length);

  // 找到 x.com 的规则
  const xcomRules = rules.filter(r =>
    r.condition.regexFilter.includes('x\\.com')
  );
  console.log('X.com Rules:', xcomRules);
});
```

## 步骤4: 手动测试规则
如果看到 x.com 的规则存在，在控制台执行：

```javascript
// 测试URL是否匹配
const testUrls = [
  'https://x.com/home',
  'https://x.com/',
  'https://www.x.com/home'
];

chrome.declarativeNetRequest.getDynamicRules((rules) => {
  const xcomRule = rules.find(r => r.condition.regexFilter.includes('x\\.com'));
  if (xcomRule) {
    console.log('Found x.com rule:', xcomRule.condition.regexFilter);

    testUrls.forEach(url => {
      const regex = new RegExp(xcomRule.condition.regexFilter);
      console.log(`${url} matches:`, regex.test(url));
    });
  }
});
```

## 如果规则不存在或不匹配
请截图控制台输出并告诉我结果，我会进一步修复。
