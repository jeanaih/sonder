# Working Flow Summary

## Current Status:
The app is broken due to changes made to unify the emoji picker with the edit modal.

## What Should Work:

### 1. Main Entry Flow:
1. User clicks "How are you?" or FAB button
2. Quick mood selector opens (rad, good, meh, bad, awful)
3. User selects a mood
4. Activity/Emotions modal opens
5. User selects activities and emotions
6. User adds optional note
7. User clicks save (checkmark)
8. Entry is saved and appears in feed

### 2. Customization Flow:
1. User clicks "+" button next to Emotions or Activities
2. Customize modal opens showing current items
3. User clicks "Add Emotion" or "Add Activity"
4. Edit modal opens with:
   - Label input field
   - Large emoji preview
   - Category tabs
   - Emoji grid
5. User selects emoji and enters label
6. User clicks checkmark to save
7. New item appears in customize grid
8. User clicks back to return to main modal
9. New item is available for selection

## Key Functions That Must Work:

### In app.js:
- `getCustomEmotions()` - Get emotions from localStorage
- `saveCustomEmotions(emotions)` - Save emotions to localStorage
- `renderEmotionGrid()` - Render emotions in main modal
- `renderActivityGrid()` - Render activities in main modal (uses window.getCustomActivities)
- `sendMoodEntry()` - Save entry to database
- `openQuickMoodSelector()` - Open quick mood selector
- `selectQuickMood(index)` - Handle mood selection
- `openMoodModal()` - Open activity/emotions modal

### In customize.js:
- `getCustomActivities()` - Get activities from localStorage
- `saveCustomActivities(activities)` - Save activities to localStorage
- `openEditItemModal()` - Open unified edit+emoji picker modal
- `saveEditedItem()` - Save edited/new item
- `selectEmoji(emoji)` - Handle emoji selection
- `renderEmojiGrid(categories)` - Render emoji grid
- `renderEmojiCategories(categories)` - Render category tabs

## Window Exports Required:
From customize.js to app.js:
- window.getCustomActivities
- window.saveCustomActivities
- window.renderCustomizeActivities
- window.openEditItemModal
- window.saveEditedItem
- window.selectEmoji
- window.switchEmojiCategory

## Fix Strategy:
1. Hard refresh browser (Ctrl+Shift+R) to clear cache
2. Check console for any remaining errors
3. Test full flow from mood selection to save
4. Verify customization works
5. Verify new items appear in grids
