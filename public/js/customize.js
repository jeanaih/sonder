// ═══════════════════════════════════════════════════════════════
// Sonder — Mood & Activity Customization Module
// ═══════════════════════════════════════════════════════════════

const CUSTOM_MOODS_KEY = 'psyc_custom_moods';
const CUSTOM_ACTIVITIES_KEY = 'psyc_custom_activities';

let currentMoods = [];
let currentActivities = [];
let editingItem = null;
let editingType = null;
let editingIndex = null;

// ─── Load Default Assets ────────────────────────────────────────
async function loadDefaultMoods() {
    try {
        const response = await fetch('/assets/default-moods.json');
        const data = await response.json();
        return data.moods;
    } catch (error) {
        console.error('Failed to load default moods:', error);
        return [
            { emoji: "😄", label: "Great", color: "#2ecc71" },
            { emoji: "🙂", label: "Good", color: "#3498db" },
            { emoji: "😐", label: "Okay", color: "#f39c12" },
            { emoji: "😔", label: "Bad", color: "#e67e22" },
            { emoji: "😢", label: "Awful", color: "#e74c3c" }
        ];
    }
}

async function loadDefaultActivities() {
    try {
        const response = await fetch('/assets/default-activities.json');
        const data = await response.json();
        return data.activities;
    } catch (error) {
        console.error('Failed to load default activities:', error);
        return [
            { emoji: "💼", label: "Work" },
            { emoji: "🏃", label: "Exercise" },
            { emoji: "🍔", label: "Food" },
            { emoji: "🎮", label: "Gaming" },
            { emoji: "📚", label: "Reading" },
            { emoji: "🎬", label: "Movies" },
            { emoji: "🎵", label: "Music" },
            { emoji: "👥", label: "Friends" }
        ];
    }
}

// ─── Get Custom Moods/Activities ────────────────────────────────
async function getCustomMoods() {
    const stored = localStorage.getItem(CUSTOM_MOODS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse custom moods:', e);
        }
    }
    return await loadDefaultMoods();
}

async function getCustomActivities() {
    const stored = localStorage.getItem(CUSTOM_ACTIVITIES_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse custom activities:', e);
        }
    }
    return await loadDefaultActivities();
}

// ─── Save Custom Moods/Activities ───────────────────────────────
function saveCustomMoods(moods) {
    localStorage.setItem(CUSTOM_MOODS_KEY, JSON.stringify(moods));
    currentMoods = moods;
}

function saveCustomActivities(activities) {
    localStorage.setItem(CUSTOM_ACTIVITIES_KEY, JSON.stringify(activities));
    currentActivities = activities;
}

// ─── Open Customization Modal ───────────────────────────────────
async function openMoodEdit() {
    currentMoods = await getCustomMoods();
    currentActivities = await getCustomActivities();
    
    // Show emotions section by default
    const emotionsSection = document.getElementById('customize-emotions-section');
    const activitiesSection = document.getElementById('customize-activities-section');
    if (emotionsSection) emotionsSection.style.display = 'block';
    if (activitiesSection) activitiesSection.style.display = 'block';
    
    renderCustomizeMoods();
    renderCustomizeActivities();
    
    const modal = document.getElementById('customize-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeCustomizeModal() {
    const modal = document.getElementById('customize-modal');
    if (modal) {
        // Add closing animation
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');
        
        // Wait for animation to complete before removing
        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
}

// ─── Render Customization Grids ─────────────────────────────────
function renderCustomizeMoods() {
    const grid = document.getElementById('customize-emotion-grid');
    if (!grid) {
        console.error('customize-emotion-grid not found');
        return;
    }
    
    grid.innerHTML = currentMoods.map((mood, index) => {
        const emojiHtml = mood.emoji.includes('.png') || mood.emoji.length > 5
            ? `<img src="/assets/openmoji-618x618-color/${mood.emoji}.png" alt="${mood.label}" class="emoji-img">`
            : mood.emoji;
        
        return `
        <div class="customize-activity-item" onclick="editMood(${index})">
            <span class="activity-emoji">${emojiHtml}</span>
            <span class="activity-label">${mood.label}</span>
        </div>`;
    }).join('');
}

function renderCustomizeActivities() {
    const grid = document.getElementById('customize-activity-grid');
    if (!grid) {
        console.error('customize-activity-grid not found');
        return;
    }
    
    grid.innerHTML = currentActivities.map((activity, index) => {
        const emojiHtml = activity.emoji.includes('.png') || activity.emoji.length > 5
            ? `<img src="/assets/openmoji-618x618-color/${activity.emoji}.png" alt="${activity.label}" class="emoji-img">`
            : activity.emoji;
        
        return `
        <div class="customize-activity-item" onclick="editActivity(${index})">
            <span class="activity-emoji">${emojiHtml}</span>
            <span class="activity-label">${activity.label}</span>
        </div>`;
    }).join('');
}

// ─── Edit Individual Item ───────────────────────────────────────
function editMood(index) {
    editingType = 'mood';
    editingIndex = index;
    editingItem = { ...currentMoods[index] };
    openEditItemModal();
}

function editActivity(index) {
    window.editingType = 'activity';
    window.editingIndex = index;
    getCustomActivities().then(activities => {
        window.editingItem = { ...activities[index] };
        openEditItemModal();
    });
}

async function openEditItemModal() {
    const modal = document.getElementById('edit-item-modal');
    const title = document.getElementById('edit-item-title');
    const emojiInput = document.getElementById('edit-item-emoji');
    const labelInput = document.getElementById('edit-item-label');
    const emojiPreview = document.getElementById('emoji-preview-text');
    const deleteBtn = document.getElementById('delete-item-btn');
    
    if (!modal) return;
    
    // Set modal type for CSS targeting
    modal.setAttribute('data-type', window.editingType);
    
    // Update title
    if (window.editingType === 'emotion') {
        title.textContent = window.editingIndex === -1 ? 'Add Emotion' : 'Edit Emotion';
    } else if (window.editingType === 'activity') {
        title.textContent = window.editingIndex === -1 ? 'Add Activity' : 'Edit Activity';
    }
    
    // Fill form
    emojiInput.value = window.editingItem.emoji;
    emojiInput.dataset.emojiCode = window.editingItem.emoji;
    labelInput.value = window.editingItem.label;
    
    // Update emoji preview
    if (emojiPreview) {
        emojiPreview.textContent = window.editingItem.emoji;
    }
    
    // Hide delete button for new items
    if (deleteBtn) {
        deleteBtn.style.display = window.editingIndex === -1 ? 'none' : 'flex';
    }
    
    // Load and render emoji picker inside the modal
    console.log('Loading emoji list...');
    const categories = await loadEmojiList();
    if (categories) {
        console.log('Emoji categories loaded:', Object.keys(categories));
        renderEmojiCategories(categories);
        renderEmojiGrid(categories);
    } else {
        console.error('Failed to load emoji categories');
    }
    
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ─── Emoji Picker Functions ─────────────────────────────────────
let emojiList = null;
let emojiCategories = null;
let currentEmojiCategory = 'smileys';
let recentEmojis = [];
const RECENT_EMOJIS_KEY = 'psyc_recent_emojis';

async function loadEmojiList() {
    if (emojiCategories) return emojiCategories;
    
    try {
        const response = await fetch('/assets/native-emojis.json');
        const data = await response.json();
        emojiCategories = data.categories;
        
        // Load recent emojis from localStorage
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
        if (stored) {
            try {
                recentEmojis = JSON.parse(stored);
            } catch (e) {
                recentEmojis = [];
            }
        }
        
        return emojiCategories;
    } catch (error) {
        console.error('Failed to load emoji list:', error);
        return null;
    }
}

function saveRecentEmoji(emoji) {
    // Remove if already exists
    recentEmojis = recentEmojis.filter(e => e !== emoji);
    // Add to front
    recentEmojis.unshift(emoji);
    // Keep only last 30
    recentEmojis = recentEmojis.slice(0, 30);
    // Save to localStorage
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recentEmojis));
}

function openEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;
    
    loadEmojiList().then(categories => {
        if (!categories) return;
        
        // Render category tabs
        renderEmojiCategories(categories);
        
        // Render emojis for current category
        renderEmojiGrid(categories);
        
        picker.classList.add('open');
    });
}

function renderEmojiCategories(categories) {
    const tabsContainer = document.querySelector('#edit-item-modal .emoji-categories');
    if (!tabsContainer) {
        console.error('Emoji categories container not found in edit modal');
        return;
    }
    
    const categoryKeys = Object.keys(categories);
    
    let html = '';
    
    // Add "Recent" tab if there are recent emojis
    if (recentEmojis.length > 0) {
        html += `<button class="emoji-category-tab ${currentEmojiCategory === 'recent' ? 'active' : ''}" 
                        onclick="switchEmojiCategory('recent')" title="Recent">
                    🕒
                 </button>`;
    }
    
    // Add category tabs
    categoryKeys.forEach(key => {
        const category = categories[key];
        html += `<button class="emoji-category-tab ${currentEmojiCategory === key ? 'active' : ''}" 
                        onclick="switchEmojiCategory('${key}')" title="${category.name}">
                    ${category.icon}
                 </button>`;
    });
    
    tabsContainer.innerHTML = html;
    console.log('Rendered emoji categories:', categoryKeys);
}

function switchEmojiCategory(category) {
    currentEmojiCategory = category;
    renderEmojiCategories(emojiCategories);
    renderEmojiGrid(emojiCategories);
}

function renderEmojiGrid(categories) {
    const grid = document.querySelector('#edit-item-modal .emoji-grid');
    if (!grid) {
        console.error('Emoji grid not found in edit modal');
        return;
    }
    
    let emojis = [];
    
    if (currentEmojiCategory === 'recent') {
        emojis = recentEmojis;
    } else if (categories[currentEmojiCategory]) {
        emojis = categories[currentEmojiCategory].emojis;
    }
    
    if (emojis.length === 0) {
        grid.innerHTML = '<div class="emoji-empty" style="text-align: center; padding: 20px; color: var(--text-secondary);">No emojis found</div>';
        return;
    }
    
    // Get all used emojis from current moods and activities
    const usedEmojis = new Set();
    currentMoods.forEach(mood => {
        if (mood.emoji) usedEmojis.add(mood.emoji);
    });
    currentActivities.forEach(activity => {
        if (activity.emoji) usedEmojis.add(activity.emoji);
    });
    
    // If editing, allow the current item's emoji
    if (editingItem && editingItem.emoji) {
        usedEmojis.delete(editingItem.emoji);
    }
    
    grid.innerHTML = emojis.map(emoji => {
        const isUsed = usedEmojis.has(emoji);
        return `<button class="emoji-item ${isUsed ? 'emoji-used' : ''}" 
                        onclick="${isUsed ? '' : `selectEmoji('${emoji}')`}"
                        ${isUsed ? 'disabled' : ''}
                        title="${isUsed ? 'Already in use' : ''}">
            ${emoji}
        </button>`;
    }).join('');
    
    console.log(`Rendered ${emojis.length} emojis for category: ${currentEmojiCategory}`);
}

function searchEmojis(query) {
    if (!query || !emojiCategories) {
        renderEmojiGrid(emojiCategories);
        return;
    }
    
    const grid = document.querySelector('#edit-item-modal .emoji-grid');
    if (!grid) return;
    
    // Search through all categories
    const allEmojis = [];
    Object.values(emojiCategories).forEach(category => {
        allEmojis.push(...category.emojis);
    });
    
    // For now, just show all emojis since we can't search by name with native emojis
    // In a real implementation, you'd have emoji names/keywords
    grid.innerHTML = allEmojis.slice(0, 100).map(emoji => {
        return `<button class="emoji-item" onclick="selectEmoji('${emoji}')">
            ${emoji}
        </button>`;
    }).join('');
}

function closeEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (picker) {
        picker.classList.remove('open');
    }
}

function selectEmoji(emoji) {
    console.log('selectEmoji called with:', emoji);
    const emojiInput = document.getElementById('edit-item-emoji');
    const emojiPreview = document.getElementById('emoji-preview-text');
    const labelInput = document.getElementById('edit-item-label');
    
    console.log('Label input found:', labelInput);
    console.log('Current label value:', labelInput?.value);
    
    if (emojiInput) {
        // Store the native emoji
        emojiInput.value = emoji;
        emojiInput.dataset.emojiCode = emoji;
    }
    
    // Update preview
    if (emojiPreview) {
        emojiPreview.textContent = emoji;
    }
    
    // Auto-fill label with emoji name
    // For new items (editingIndex === -1), always update
    // For existing items, only update if label is empty
    if (labelInput) {
        const isNewItem = window.editingIndex === -1;
        const isEmpty = !labelInput.value.trim();
        
        if (isNewItem || isEmpty) {
            const emojiName = getEmojiName(emoji);
            console.log('Auto-fill name:', emojiName);
            if (emojiName) {
                labelInput.value = emojiName;
                console.log('Label set to:', labelInput.value);
            }
        }
    }
    
    // Save to recent
    saveRecentEmoji(emoji);
    
    // Don't close modal - stay in edit mode
}

// Get emoji name from Unicode or basic mapping
function getEmojiName(emoji) {
    // Basic emoji name mapping for common emojis
    const emojiNames = {
        '😀': 'Grinning', '😃': 'Smile', '😄': 'Happy', '😁': 'Grin', '😆': 'Laughing',
        '😅': 'Sweat Smile', '🤣': 'Rofl', '😂': 'Joy', '🙂': 'Slightly Smiling', '🙃': 'Upside Down',
        '😉': 'Wink', '😊': 'Blush', '😇': 'Innocent', '🥰': 'Hearts', '😍': 'Heart Eyes',
        '🤩': 'Star Struck', '😘': 'Kissing', '😗': 'Kiss', '😚': 'Kissing Closed Eyes', '😙': 'Kissing Smiling',
        '😋': 'Yum', '😛': 'Tongue', '😜': 'Wink Tongue', '🤪': 'Zany', '😝': 'Squinting Tongue',
        '🤑': 'Money', '🤗': 'Hugging', '🤭': 'Hand Over Mouth', '🤫': 'Shushing', '🤔': 'Thinking',
        '🤐': 'Zipper Mouth', '🤨': 'Raised Eyebrow', '😐': 'Neutral', '😑': 'Expressionless', '😶': 'No Mouth',
        '😏': 'Smirk', '😒': 'Unamused', '🙄': 'Eye Roll', '😬': 'Grimacing', '🤥': 'Lying',
        '😌': 'Relieved', '😔': 'Pensive', '😪': 'Sleepy', '🤤': 'Drooling', '😴': 'Sleeping',
        '😷': 'Mask', '🤒': 'Thermometer', '🤕': 'Bandage', '🤢': 'Nauseated', '🤮': 'Vomiting',
        '🤧': 'Sneezing', '🥵': 'Hot', '🥶': 'Cold', '🥴': 'Woozy', '😵': 'Dizzy',
        '🤯': 'Exploding Head', '🤠': 'Cowboy', '🥳': 'Party', '😎': 'Cool', '🤓': 'Nerd',
        '🧐': 'Monocle', '😕': 'Confused', '😟': 'Worried', '🙁': 'Frowning', '☹️': 'Frown',
        '😮': 'Open Mouth', '😯': 'Hushed', '😲': 'Astonished', '😳': 'Flushed', '🥺': 'Pleading',
        '😦': 'Frowning Mouth', '😧': 'Anguished', '😨': 'Fearful', '😰': 'Anxious', '😥': 'Sad',
        '😢': 'Crying', '😭': 'Sobbing', '😱': 'Screaming', '😖': 'Confounded', '😣': 'Persevering',
        '😞': 'Disappointed', '😓': 'Downcast', '😩': 'Weary', '😫': 'Tired', '🥱': 'Yawning',
        '😤': 'Triumph', '😡': 'Angry', '😠': 'Rage', '🤬': 'Cursing', '😈': 'Devil',
        '👿': 'Imp', '💀': 'Skull', '☠️': 'Crossbones', '💩': 'Poop', '🤡': 'Clown',
        '👹': 'Ogre', '👺': 'Goblin', '👻': 'Ghost', '👽': 'Alien', '👾': 'Space Invader',
        '🤖': 'Robot', '😺': 'Cat Smile', '😸': 'Cat Grin', '😹': 'Cat Joy', '😻': 'Cat Hearts',
        '💼': 'Briefcase', '💻': 'Laptop', '📱': 'Phone', '📚': 'Books', '✏️': 'Pencil',
        '🎨': 'Art', '🎭': 'Theater', '🎬': 'Movie', '🎮': 'Gaming', '🎵': 'Music',
        '🏃': 'Running', '🚴': 'Cycling', '🏊': 'Swimming', '⚽': 'Soccer', '🏀': 'Basketball',
        '🍔': 'Burger', '🍕': 'Pizza', '🍜': 'Ramen', '🍱': 'Bento', '🍰': 'Cake',
        '☕': 'Coffee', '🍺': 'Beer', '🍷': 'Wine', '🥤': 'Cup', '🍎': 'Apple',
        '🏠': 'Home', '🏢': 'Office', '🏫': 'School', '🏥': 'Hospital', '🏨': 'Hotel',
        '✈️': 'Airplane', '🚗': 'Car', '🚕': 'Taxi', '🚌': 'Bus', '🚇': 'Metro',
        '💤': 'Sleeping', '🛌': 'Bed', '🛀': 'Bath', '🚿': 'Shower', '🧘': 'Meditation',
        '📖': 'Reading', '✍️': 'Writing', '🎤': 'Singing', '🎸': 'Guitar', '🎹': 'Piano',
        '👥': 'Friends', '👫': 'Couple', '👪': 'Family', '💑': 'Kiss', '💏': 'Couple Kiss',
        '❤️': 'Heart', '💔': 'Broken Heart', '💕': 'Two Hearts', '💖': 'Sparkling Heart', '💗': 'Growing Heart',
        '🌟': 'Star', '⭐': 'Star', '✨': 'Sparkles', '💫': 'Dizzy', '🌈': 'Rainbow',
        '🌞': 'Sun', '🌙': 'Moon', '⛅': 'Cloud', '🌧️': 'Rain', '⛈️': 'Storm',
        '🔥': 'Fire', '💧': 'Droplet', '🌊': 'Wave', '🌳': 'Tree', '🌸': 'Flower'
    };
    
    return emojiNames[emoji] || '';
}

function closeEditItemModal() {
    const modal = document.getElementById('edit-item-modal');
    if (modal) {
        // Add closing animation
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');

        // Wait for animation to complete before removing
        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
    window.editingItem = null;
    window.editingType = null;
    window.editingIndex = null;
}


async function saveEditedItem() {
    const emojiInput = document.getElementById('edit-item-emoji');
    const labelInput = document.getElementById('edit-item-label');
    
    console.log('=== SAVE STARTED ===');
    console.log('emojiInput.value:', emojiInput?.value);
    console.log('labelInput.value:', labelInput?.value);
    console.log('editingType:', window.editingType);
    console.log('editingIndex:', window.editingIndex);
    console.log('editingItem:', window.editingItem);
    
    if (!emojiInput || !labelInput) {
        console.error('Input elements not found!');
        showToast('Error: Form elements not found', '❌');
        return;
    }
    
    if (!emojiInput.value.trim() || !labelInput.value.trim()) {
        console.warn('Empty fields detected');
        showToast('Please fill in all fields', '⚠️');
        return;
    }
    
    // Use emoji code if available, otherwise use the text value
    window.editingItem.emoji = emojiInput.dataset.emojiCode || emojiInput.value.trim();
    window.editingItem.label = labelInput.value.trim();
    
    console.log('Updated editingItem:', window.editingItem);
    
    if (window.editingType === 'emotion') {
        console.log('Processing emotion...');
        const emotions = await window.getCustomEmotions();
        console.log('Current emotions:', emotions);
        
        if (window.editingIndex === -1) {
            // Adding new emotion
            emotions.push(window.editingItem);
            console.log('✅ Added new emotion:', window.editingItem);
            console.log('✅ Updated emotions array:', emotions);
        } else {
            // Updating existing emotion
            emotions[window.editingIndex] = window.editingItem;
            console.log('✅ Updated emotion at index:', window.editingIndex);
        }
        
        window.saveCustomEmotions(emotions);
        console.log('✅ Saved to localStorage');
        
        // Verify it was saved
        const saved = await window.getCustomEmotions();
        console.log('✅ Verified saved emotions:', saved);
        
        // Re-render both grids
        await window.renderCustomizeEmotions();
        await window.renderEmotionGrid();
        console.log('✅ Re-rendered grids');
        
        closeEditItemModal();
        showToast(window.editingIndex === -1 ? 'Emotion added!' : 'Emotion updated!', '✅');
    } else if (window.editingType === 'activity') {
        console.log('Processing activity...');
        const activities = await getCustomActivities();
        console.log('Current activities:', activities);
        
        if (window.editingIndex === -1) {
            // Adding new activity
            activities.push(window.editingItem);
            console.log('✅ Added new activity:', window.editingItem);
            console.log('✅ Updated activities array:', activities);
        } else {
            // Updating existing activity
            activities[window.editingIndex] = window.editingItem;
            console.log('✅ Updated activity at index:', window.editingIndex);
        }
        
        saveCustomActivities(activities);
        console.log('✅ Saved to localStorage');
        
        // Verify it was saved
        const saved = await getCustomActivities();
        console.log('✅ Verified saved activities:', saved);
        
        // Re-render both grids
        await window.renderCustomizeActivities();
        await renderActivityGrid();
        console.log('✅ Re-rendered grids');
        
        closeEditItemModal();
        showToast(window.editingIndex === -1 ? 'Activity added!' : 'Activity updated!', '✅');
    }
    
    console.log('=== SAVE COMPLETED ===');
}

function deleteCurrentItem() {
    if (window.editingType === 'activity') {
        if (confirm(`Delete "${window.editingItem.label}"?`)) {
            getCustomActivities().then(activities => {
                activities.splice(window.editingIndex, 1);
                saveCustomActivities(activities);
                window.renderCustomizeActivities();
                renderActivityGrid();
                closeEditItemModal();
                showToast('Activity deleted', '🗑️');
            });
        }
    } else if (window.editingType === 'emotion') {
        if (confirm(`Delete "${window.editingItem.label}"?`)) {
            window.getCustomEmotions().then(emotions => {
                emotions.splice(window.editingIndex, 1);
                window.saveCustomEmotions(emotions);
                window.renderCustomizeEmotions();
                window.renderEmotionGrid();
                closeEditItemModal();
                showToast('Emotion deleted', '🗑️');
            });
        }
    }
}

// ─── Add New Activity ───────────────────────────────────────────
function addNewActivity() {
    window.editingType = 'activity';
    window.editingIndex = -1;
    window.editingItem = { emoji: '🎯', label: 'New Activity' };
    openEditItemModal();
}

// ─── Reset to Defaults ──────────────────────────────────────────
async function resetMoods() {
    if (confirm('Reset moods to default? This cannot be undone.')) {
        currentMoods = await loadDefaultMoods();
        renderCustomizeMoods();
        showToast('Moods reset to default', '🔄');
    }
}

async function resetActivities() {
    if (confirm('Reset activities to default? This will delete custom activities.')) {
        currentActivities = await loadDefaultActivities();
        renderCustomizeActivities();
        showToast('Activities reset to default', '🔄');
    }
}

// ─── Save All Customizations ────────────────────────────────────
function saveCustomizations() {
    if (window.currentCustomizeType === 'emotions') {
        // Emotions are already saved in real-time
        if (typeof window.renderEmotionGrid === 'function') {
            window.renderEmotionGrid();
        }
    } else if (window.currentCustomizeType === 'activities') {
        // Activities are already saved in real-time
        if (typeof renderActivityGrid === 'function') {
            renderActivityGrid();
        }
    }
    
    closeCustomizeModal();
    showToast('Customizations saved!', '✨');
}

// ─── Initialize ─────────────────────────────────────────────────
// Export functions for use in app.js
if (typeof window !== 'undefined') {
    window.openMoodEdit = openMoodEdit;
    window.closeCustomizeModal = closeCustomizeModal;
    window.closeEditItemModal = closeEditItemModal;
    window.saveEditedItem = saveEditedItem;
    window.deleteCurrentItem = deleteCurrentItem;
    window.addNewActivity = addNewActivity;
    window.resetMoods = resetMoods;
    window.resetActivities = resetActivities;
    window.saveCustomizations = saveCustomizations;
    window.getCustomMoods = getCustomMoods;
    window.getCustomActivities = getCustomActivities;
    window.saveCustomActivities = saveCustomActivities;
    window.openEmojiPicker = openEmojiPicker;
    window.closeEmojiPicker = closeEmojiPicker;
    window.selectEmoji = selectEmoji;
    window.editActivity = editActivity;
    window.switchEmojiCategory = switchEmojiCategory;
    window.searchEmojis = searchEmojis;
}
