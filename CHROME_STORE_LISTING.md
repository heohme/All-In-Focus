# Chrome Web Store Listing Guide for All-In Focus

## Extension Name
**All-In Focus**

## Short Description (132 characters max)
Go all-in on focus. Gamified Pomodoro timer with Texas Hold'em poker mechanics. Win chips by completing focus sessions.

## Detailed Description

All-In Focus combines the proven Pomodoro Technique with the excitement of Texas Hold'em poker to help you stay focused and productive.

**How It Works:**

🎯 Start a 25-minute focus session by describing your task
🃏 Get dealt 2 poker cards - your hole cards
⏰ Community cards reveal as you progress:
  • 5 min: Flop (3 cards)
  • 15 min: Turn (4th card)
  • 23 min: River (5th card)
🚫 Blocked websites during focus sessions
💪 Choose to stay in or fold when tempted
🏆 Win chips by completing sessions and beating the opponent

**Key Features:**

✅ 25-minute Pomodoro-style focus sessions
✅ Texas Hold'em poker mechanics with progressive card reveals
✅ Customizable website blocking during focus sessions
✅ Chip economy system to track your productivity
✅ Win/loss statistics and session history
✅ Beautiful, intuitive interface
✅ No account required - all data stored locally
✅ Works completely offline

**Why All-In Focus?**

Traditional Pomodoro apps can feel monotonous. All-In Focus adds game mechanics to make staying focused more engaging. Each session becomes a poker hand where you play against the clock and your own discipline.

**Privacy:**

- All data stored locally on your device
- No external servers or data collection
- No tracking or analytics
- View our full privacy policy at: [your-privacy-policy-url]

**Blocked Sites:**

By default, the extension blocks common distraction sites like social media and entertainment platforms during focus sessions. You can customize this list to match your needs.

**Perfect For:**

- Students studying for exams
- Developers working on projects
- Writers battling procrastination
- Anyone looking to improve focus and productivity

Transform your focus sessions into an engaging game. Download All-In Focus and start winning back your productivity!

---

## Category
**Productivity**

## Language
**English**

---

## Store Assets Needed

### 1. Icons
✅ Already created:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

### 2. Screenshots (Required: 1-5 screenshots, 1280x800 or 640x400)

**Screenshot Ideas:**

1. **Main Popup Interface** (1280x800)
   - Show the popup with the "Deal & Focus" button
   - Display chip count and focus task input
   - Caption: "Start your focus session - combine Pomodoro with poker!"

2. **Active Session with Cards** (1280x800)
   - Show the popup during an active session
   - Display hole cards and community cards
   - Show timer and progress
   - Caption: "Watch your hand unfold as you stay focused"

3. **Decision Page** (1280x800)
   - Show the "Stay In" vs "Fold" decision page
   - Display current hand and chips at stake
   - Caption: "Choose: stay focused or fold and lose your blind"

4. **Session Complete** (1280x800)
   - Show the results page with hand comparison
   - Display chips won/lost
   - Show statistics
   - Caption: "Complete sessions to win chips and track your progress"

5. **Settings/Blocked Sites** (1280x800)
   - Show the blocked sites list or settings
   - Caption: "Customize which sites to block during focus time"

**How to Create Screenshots:**

1. Load the extension in Chrome
2. Open the popup and navigate to different states
3. Use Chrome DevTools or a screenshot tool to capture at 1280x800
4. Ensure UI is clean and text is readable
5. Add captions in the Chrome Web Store listing form

### 3. Promotional Images (Optional but Recommended)

**Small Tile** (440x280):
- Show the green poker chip icon with extension name
- Add tagline: "Gamify Your Focus"

**Marquee** (1400x560):
- Create a banner with poker cards and timer imagery
- Include text: "Focus Hold'em - Stay Productive, Win Big"
- Show example of the UI

---

## Justification for Permissions (Important!)

When submitting, you'll need to explain why each permission is needed:

**storage:**
To save your focus session history, game statistics (chips, wins/losses), and user preferences locally on your device.

**alarms:**
To trigger timers for 25-minute Pomodoro sessions and schedule card reveals at specific intervals (5, 15, and 23 minutes).

**declarativeNetRequest & declarativeNetRequestWithHostAccess:**
To block distracting websites during focus sessions. Users can customize which sites to block. This is core to the focus functionality.

**tabs:**
To detect when users attempt to navigate to blocked sites during focus sessions and present them with the choice to stay in or fold.

**notifications:**
To alert users when their focus session ends, when new cards are revealed, and when they complete or forfeit a session.

**offscreen:**
To play audio notifications for session events without disrupting the user's workflow.

**webNavigation:**
To intercept navigation to blocked sites and redirect users to the decision page where they can choose to continue or end their session.

**host_permissions (*://*/*):**
Required to block any website that users choose to add to their blocked sites list. Without this broad permission, we cannot support blocking custom user-specified domains.

---

## Privacy Policy

You MUST host your privacy policy at a public URL. Options:

1. **GitHub Pages** (Recommended):
   - Push `privacy-policy.html` to your repository
   - Enable GitHub Pages in settings
   - URL will be: `https://yourusername.github.io/focus-holdem/privacy-policy.html`

2. **Your own website:**
   - Host the privacy-policy.html file anywhere publicly accessible

3. **Simple hosting services:**
   - Netlify, Vercel, or similar free static hosting

**Update the privacy policy URL in:**
- Chrome Web Store listing form
- The detailed description above (replace [your-privacy-policy-url])
- The privacy-policy.html contact link

---

## Pre-Submission Checklist

Before submitting to Chrome Web Store:

- [x] Icons created (16x16, 48x48, 128x128)
- [x] manifest.json includes default_popup
- [x] Extension builds without errors
- [x] Privacy policy created
- [ ] Privacy policy hosted at public URL
- [ ] Privacy policy URL added to store listing
- [ ] 1-5 screenshots created (1280x800 or 640x400)
- [ ] Screenshots show key features clearly
- [ ] Detailed description written (done above)
- [ ] Short description written (done above)
- [ ] Permission justifications prepared (done above)
- [ ] Extension tested in Chrome with latest build
- [ ] All blocked features work correctly
- [ ] No console errors or warnings
- [ ] Paid $5 developer registration fee
- [ ] Created ZIP file of dist/ folder (NOT including dist parent folder)

---

## Creating the ZIP File for Upload

```bash
cd dist
zip -r ../focus-holdem.zip .
cd ..
```

This creates `focus-holdem.zip` with all the extension files at the root level (not inside a dist/ folder).

**Verify your ZIP:**
```bash
unzip -l focus-holdem.zip
```

Should show:
```
manifest.json
popup.html
background.js
icons/
assets/
...
```

NOT:
```
dist/manifest.json  ❌
dist/popup.html     ❌
```

---

## After Submission

1. **Initial Review:** Usually takes 1-7 days for first submission
2. **Email Notification:** You'll receive email when approved or if changes needed
3. **If Rejected:** Address the issues mentioned and resubmit
4. **After Approval:** Extension goes live within a few hours

**Common Rejection Reasons:**
- Insufficient permission justifications
- Missing or unclear privacy policy
- Poor quality screenshots
- Misleading description
- Code issues or security concerns

---

## Tips for Faster Approval

1. **Be thorough with permission justifications** - Explain exactly why you need each one
2. **Professional screenshots** - Clear, high-quality images showing real functionality
3. **Accurate description** - Don't overstate features or make false claims
4. **Test thoroughly** - Make sure everything works before submitting
5. **Valid privacy policy** - Must be accessible and comprehensive
6. **Responsive to feedback** - If rejected, address issues promptly and completely

---

Good luck with your submission! 🚀
