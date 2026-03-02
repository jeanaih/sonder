// ─── Sonder Dashboard (Daylio-style) ──────────────────────────

let socket = null;
let currentUser = null;
let notificationLogs = []; // Initialize notification logs early
const membersMap = new Map();
let currentLang = localStorage.getItem('psyc_lang') || 'en';

const LANGS = {
    en: {
        rad: 'Rad', good: 'Good', meh: 'Meh', bad: 'Bad', awful: 'Awful',
        working: 'Working', meeting: 'Meeting', coding: 'Coding', designing: 'Designing',
        break: 'Break', lunch: 'Lunch', exercise: 'Exercise', reading: 'Reading',
        brainstorm: 'Brainstorm', presenting: 'Presenting', commuting: 'Commuting', socializing: 'Socializing',
        current_month_label: (val) => val, // placeholder for date
        filter_all: 'All', filter_me: 'Me',
        how_are_you: 'How are you today?',
        first_entry_msg: 'Pick a mood to create your first entry!',
        sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
        s_short: 'S', m_short: 'M', t_short: 'T', w_short: 'W', t_short_2: 'T', f_short: 'F', s_short_2: 'S',
        mood_count: 'Mood Count',
        days_in_a_row: 'Days in a Row',
        longest_chain: 'Longest Chain',
        month_in_pixels: 'Month in Pixels',
        mood_chart: 'Mood Chart',
        mood_dist: 'Mood Distribution',
        team_mood_dist: 'Team Mood Distribution',
        top_activities: 'Top Activities',
        view_year_stats: 'View Year Statistics',
        see_mood_trends: 'See your mood trends for 2026',
        connecting_team: 'Connecting to your team...',
        online: 'online', members: 'members', connected: 'Connected',
        admin_panel: 'Admin Panel', group_invite_code: 'Group Invite Code',
        share_code_hint: 'Share this code to invite others to your team',
        team_status: 'Team Status', goals: 'Goals', important_days: 'Important Days',
        reminders: 'Reminders', customize_activity: 'Customize Activity',
        settings: 'Settings', about: 'About', logout: 'Logout',
        language: 'Language', theme_color: 'Theme Color', pin_lock: 'PIN Lock',
        coming_soon: 'Coming soon', share_app: 'Share App', version: 'Version',
        about_desc: 'Track your mood and activities with your team in real-time. Build better habits and understand your emotional patterns.',
        privacy_policy: 'Privacy Policy', terms_service: 'Terms of Service', support: 'Support',
        all_rights: 'All rights reserved.', daily_checkin: 'Daily check-in reminder',
        remind_once_day: 'We\'ll remind you once a day to log your mood.',
        reminder_time: 'Reminder time',
        year_2026: '2026', year_in_pixels: 'Year in Pixels', year_pixels_hint: 'Tap mood to highlight it on the chart',
        monthly_mood_chart: 'Monthly Mood Chart', year_mood_dist: 'Year Mood Distribution',
        team_top_activities: 'Top Activities',
        today: 'TODAY', yesterday: 'YESTERDAY', event: 'EVENT', team: 'TEAM',
        how_are_you_short: 'How are you?',
        no_entries_for: 'No entries for',
        just_now: 'just now', ago: 'ago',
        m: 'm', h: 'h', d: 'd',
        admin: 'ADMIN', member: 'MEMBER',
        recent_notifications: 'Recent Notifications', no_notifications: 'No new notifications'
    },
    fil: {
        rad: 'Sobrang Saya', good: 'Masaya', meh: 'Ayos Lang', bad: 'Malungkot', awful: 'Sobrang Lungkot',
        working: 'Nagtatrabaho', meeting: 'Pagpupulong', coding: 'Nagsusulat ng Code', designing: 'Nagdidisenyo',
        break: 'Pahinga', lunch: 'Tanghalian', exercise: 'Ehersisyo', reading: 'Nagbabasa',
        brainstorm: 'Brainstorm', presenting: 'Nagtatanyag', commuting: 'Bumabyahe', socializing: 'Nakikihalubilo',
        current_month_label: (val) => val, // placeholder
        filter_all: 'Lahat', filter_me: 'Ako',
        how_are_you: 'Kumusta ka ngayong araw?',
        first_entry_msg: 'Pumili ng mood para gumawa ng iyong unang entry!',
        sun: 'Lin', mon: 'Lun', tue: 'Mar', wed: 'Miy', thu: 'Huw', fri: 'Biy', sat: 'Sab',
        s_short: 'L', m_short: 'L', t_short: 'M', w_short: 'M', t_short_2: 'H', f_short: 'B', s_short_2: 'S',
        mood_count: 'Bilang ng Mood',
        days_in_a_row: 'Sunod-sunod na Araw',
        longest_chain: 'Pinakamahabang Chain',
        month_in_pixels: 'Buwan sa Pixels',
        mood_chart: 'Tsart ng Mood',
        mood_dist: 'Distribusyon ng Mood',
        team_mood_dist: 'Distribusyon ng Mood ng Team',
        top_activities: 'Mga Pangunahing Gawain',
        view_year_stats: 'Tingnan ang Estadistika ng Taon',
        see_mood_trends: 'Tingnan ang trend ng iyong mood para sa 2026',
        connecting_team: 'Kumokonekta sa iyong team...',
        online: 'online', members: 'miyembro', connected: 'Konektado',
        admin_panel: 'Admin Panel', group_invite_code: 'Invite Code ng Grupo',
        share_code_hint: 'Ibahagi ang code na ito para mag-imbita ng iba sa iyong team',
        team_status: 'Katayuan ng Team', goals: 'Mga Layunin', important_days: 'Mahahalagang Araw',
        reminders: 'Mga Paalala', customize_activity: 'I-customize ang Gawain',
        settings: 'Mga Setting', about: 'Tungkol', logout: 'Mag-logout',
        language: 'Wika', theme_color: 'Kulay ng Tema', pin_lock: 'PIN Lock',
        coming_soon: 'Malapit na', share_app: 'Ibahagi ang App', version: 'Bersyon',
        about_desc: 'Subaybayan ang iyong mood at mga gawain kasama ang iyong team sa real-time. Bumuo ng mas mabuting gawi at unawain ang iyong emosyonal na pattern.',
        privacy_policy: 'Patakaran sa Privacy', terms_service: 'Mga Tuntunin ng Serbisyo', support: 'Suporta',
        all_rights: 'Lahat ng karapatan ay nakalaan.', daily_checkin: 'Pang-araw-araw na paalala',
        remind_once_day: 'Paalalahanan ka namin isang beses sa isang araw para i-log ang iyong mood.',
        reminder_time: 'Oras ng paalala',
        year_2026: '2026', year_in_pixels: 'Taon sa Pixels', year_pixels_hint: 'I-tap ang mood para i-highlight sa tsart',
        monthly_mood_chart: 'Buwanang Tsart ng Mood', year_mood_dist: 'Distribusyon ng Mood sa Taon',
        team_top_activities: 'Mga Pangunahing Gawain',
        today: 'NGAYON', yesterday: 'KAHAPON', event: 'KAGANAPAN', team: 'TEAM',
        how_are_you_short: 'Kumusta ka?',
        no_entries_for: 'Walang entry para sa',
        just_now: 'ngayon lang', ago: 'nakalipas',
        m: 'm', h: 'o', d: 'a',
        admin: 'ADMIN', member: 'MIYEMBRO',
        recent_notifications: 'Mga Kamakailang Notification', no_notifications: 'Walang bagong notification'
    }
};

function t(key, val = null) {
    const lang = LANGS[currentLang] || LANGS.en;
    const entry = lang[key] || LANGS.en[key] || key;
    return typeof entry === 'function' ? entry(val) : entry;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Handle special case for current month label which is dynamic
        if (key === 'current_month_label') return;
        el.textContent = t(key);
    });
    // Update dropdown to match current language
    const langSelect = document.getElementById('language-select');
    if (langSelect) langSelect.value = currentLang;
}

// Mood options (kept for backward compatibility with server data)
const MOODS = [
    { key: 'rad', emoji: '😄', label: 'Rad', color: '#a8e6a1' },
    { key: 'good', emoji: '🙂', label: 'Good', color: '#ffd93d' },
    { key: 'meh', emoji: '😐', label: 'Meh', color: '#ffb4a2' },
    { key: 'bad', emoji: '😔', label: 'Bad', color: '#ff6b9d' },
    { key: 'awful', emoji: '😢', label: 'Awful', color: '#95a5a6' },
];

function getLocalizedMoods() {
    return MOODS.map(m => ({ ...m, label: t(m.key) }));
}

// Helper function to get mood data by key (for backward compatibility)
function getMoodByKey(key) {
    return MOODS.find(m => m.key === key) || {
        key: key,
        emoji: '😊',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: '#4ade80'
    };
}

// Activity options (Daylio-style)
const ACTIVITIES = [
    { key: 'working', emoji: '💻', label: 'Working' },
    { key: 'meeting', emoji: '🤝', label: 'Meeting' },
    { key: 'coding', emoji: '⌨️', label: 'Coding' },
    { key: 'designing', emoji: '🎨', label: 'Designing' },
    { key: 'break', emoji: '☕', label: 'Break' },
    { key: 'lunch', emoji: '🍱', label: 'Lunch' },
    { key: 'exercise', emoji: '🏃', label: 'Exercise' },
    { key: 'reading', emoji: '📚', label: 'Reading' },
    { key: 'brainstorm', emoji: '💡', label: 'Brainstorm' },
    { key: 'presenting', emoji: '📊', label: 'Presenting' },
    { key: 'commuting', emoji: '🚗', label: 'Commuting' },
    { key: 'socializing', emoji: '🗣️', label: 'Socializing' },
];

function getLocalizedActivities() {
    return ACTIVITIES.map(a => ({ ...a, label: t(a.key) }));
}

let selectedActivities = new Set();
let moodEntries = []; // Organizational Feed entries
let personalEntries = []; // Personal History for Calendar
let allImportantDays = []; // cached for calendar integration
let goalsList = []; // cached for reminder engine
let feedFilter = 'all'; // 'all' or 'me'
let lastFeedTimestamp = null;
let hasMoreFeed = false;
let selectedFeedDay = new Date(); // Default to today
let pendingMood = null;
let customActivities = [];

// Audio for alarm
const alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
alarmSound.volume = 0.5;




// ─── Init on page load ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill user and org from local storage so they "stay" on dashboard even before network calls
    const cachedUsername = localStorage.getItem('psyc_username');
    if (cachedUsername) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = '@' + cachedUsername;
    }

    const cachedOrgName = localStorage.getItem('psyc_orgName');
    if (cachedOrgName) {
        const orgNameEl = document.getElementById('org-name');
        if (orgNameEl) orgNameEl.textContent = cachedOrgName;
    }

    // Set month header
    updateMonthHeader();
    applyTranslations();

    // Initialize notification system
    updateNotificationBadge();
    renderNotificationHistory();

    // Start Real-Time Reminder Engine
    startRemindersEngine();

    // Language selection listener
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('psyc_lang', currentLang);
            applyTranslations();
            updateMonthHeader();

            // Re-render UI components that have static text labels
            if (feedFilter === 'all' || feedFilter === 'me') {
                renderFeed(moodEntries);
            }
            renderCalendar(personalEntries);
            renderMoodCountSummary(personalEntries);
            renderMonthPixels(personalEntries);

            // Notify user
            showToast(currentLang === 'fil' ? 'Binago ang wika sa Filipino' : 'Language changed to English', '🌐');

            // In a real app, we would also update the user's preference in Firestore here
            if (currentUser) {
                db.collection('users').doc(currentUser.uid).update({ language: currentLang })
                    .catch(err => console.error('Error updating language preference:', err));
            }
        });
    }

    let isInitCheck = false;
    auth.onAuthStateChanged(async (user) => {
        if (isInitCheck) return;
        if (!user) {
            localStorage.removeItem('psyc_orgId');
            if (!window.location.pathname.endsWith('/') && !window.location.pathname.includes('index.html')) {
                window.location.href = '/';
            }
            return;
        }

        isInitCheck = true;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/user/verify-org?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Avoid hard redirect loops on generic backend failures
            if (!res.ok) {
                console.warn('verify-org failed on dashboard with status', res.status);
                // If auth is invalid, send user back to login once
                if (res.status === 401) {
                    localStorage.removeItem('psyc_orgId');
                    localStorage.removeItem('psyc_username');
                    localStorage.removeItem('psyc_orgName');
                    await auth.signOut();
                    window.location.href = '/';
                    return;
                }
                // For non-auth errors, stay on dashboard and just show limited data
                showToast('Cannot reach server right now. Some data may be missing.', '⚠️');
                return;
            }

            const data = await res.json();

            // Use cached username as a soft fallback to avoid ping-pong redirects
            const cachedUsername = localStorage.getItem('psyc_username');
            const effectiveHasUsername = data && (data.hasUsername || !!cachedUsername);

            if (!effectiveHasUsername) {
                if (window.location.pathname.includes('dashboard.html')) {
                    console.warn("🚫 No username found in verify-org response. Redirecting to login setup...");
                    // Safety: clear the localStorage orgId if the server says we are invalid
                    localStorage.removeItem('psyc_orgId');
                    window.location.href = '/?error=no_username';
                }
                return;
            }

            // Sync orgId to localStorage if server finds one
            if (data.orgId) {
                localStorage.setItem('psyc_orgId', data.orgId);
            } else {
                // No orgId from server - user is not in any organization
                localStorage.removeItem('psyc_orgId');
                localStorage.removeItem('psyc_orgName');

                if (window.location.pathname.includes('dashboard.html')) {
                    console.warn("🚫 No organization found for this user. Redirecting to setup...");
                    window.location.href = '/?error=no_org';
                    return;
                }
            }




            // Keep a reference to the raw Firebase user object for things like getIdToken
            currentUser = user;

            // Update photoURL in Firestore if it's missing or changed
            if (user.photoURL) {
                try {
                    await firestore.collection('users').doc(user.uid).update({
                        photoURL: user.photoURL
                    });
                } catch (err) {
                    console.warn('Could not update photoURL:', err);
                }
            }

            const effectiveUsername = data.username || cachedUsername || '';
            const name = data.username || cachedUsername || user.displayName || user.email;

            // Update user name in More tab
            const userNameMore = document.getElementById('user-name-more');
            if (userNameMore) {
                userNameMore.textContent = "@" + name;
            }

            // Keep username cached for future visits
            localStorage.setItem('psyc_username', name);

            // Avatar (More tab - large)
            const avatarLarge = document.getElementById('user-avatar-large');
            if (avatarLarge) {
                if (user.photoURL) {
                    avatarLarge.innerHTML = `<img src="${user.photoURL}" alt="">`;
                } else {
                    const letterLarge = document.getElementById('user-avatar-letter-large');
                    if (letterLarge) {
                        letterLarge.textContent = name.charAt(0).toUpperCase();
                    }
                }
            }

            renderMoodGrid();
            renderActivityGrid();
            await loadOrgInfo(user);

            // Ensure today is the default filter state
            selectedFeedDay = new Date();
            updateDayNavigator();

            await loadOrgFeed(user);
            await connectSocket(user);
            await fetchNotifications(user);
            await loadGoals(true); // Load silently for background reminders
            await fetchImportantDaysForCalendar(); // Load for reminders and calendar

            // Request notification permission on app load
            requestNotificationPermission();
        } catch (err) {
            console.error('Core init error:', err);
            showToast('Something went wrong loading your workspace.', '⚠️');
        }
    });

    // ─── Scroll-to-hide Topbar ──────────────────
    const topBar = document.querySelector('.topbar');
    let lastScrollY = window.scrollY;
    let scrollThreshold = 10;

    if (topBar) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const delta = Math.abs(currentScrollY - lastScrollY);

            if (delta > scrollThreshold) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    topBar.classList.add('topbar-hidden');
                } else if (currentScrollY < lastScrollY) {
                    topBar.classList.remove('topbar-hidden');
                }
                lastScrollY = currentScrollY;
            }
        }, { passive: true });
    }
});


// ─── Month Navigation System ────────────────────────────────────
let viewMonth = new Date();
let availableMonths = [];
let currentCarouselIndex = 0;
let allMonthsData = [];
let maxSelectableIndex = 0;
let carouselRotation = 0;
let touchStartY = 0;
let isDragging = false;
let velocity = 0;
let lastY = 0;
let lastTime = 0;
let animationFrame = null;

function updateMonthHeader() {
    const el = document.getElementById('current-month');
    if (el) {
        const span = el.querySelector('span');
        if (span) {
            const options = { month: 'long', year: 'numeric' };
            const locale = currentLang === 'fil' ? 'fil-PH' : 'en-US';
            span.textContent = viewMonth.toLocaleDateString(locale, options).toUpperCase();
        }
    }
}

function updateMonthNavButtons() {
    // Placeholder function - implement if month navigation buttons exist
    // This prevents errors when called from various places
}

function openMonthPicker() {
    const modal = document.getElementById('month-picker-modal');
    if (!modal) return;

    try {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        renderMonthCarousel3D();

        const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
        if (carouselWrapper) {
            carouselWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
            carouselWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
            carouselWrapper.addEventListener('touchend', handleTouchEnd);
            carouselWrapper.addEventListener('mousedown', handleMouseDown);
            carouselWrapper.addEventListener('mousemove', handleMouseMove);
            carouselWrapper.addEventListener('mouseup', handleMouseUp);
            carouselWrapper.addEventListener('mouseleave', handleMouseUp);
            carouselWrapper.addEventListener('wheel', handleWheel, { passive: false });
        }
    } catch (err) {
        console.error('Error opening month picker:', err);
    }
}

function closeMonthPicker() {
    const modal = document.getElementById('month-picker-modal');
    if (!modal) return;

    modal.classList.remove('open');
    document.body.style.overflow = '';

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    if (carouselWrapper) {
        carouselWrapper.removeEventListener('touchstart', handleTouchStart);
        carouselWrapper.removeEventListener('touchmove', handleTouchMove);
        carouselWrapper.removeEventListener('touchend', handleTouchEnd);
        carouselWrapper.removeEventListener('mousedown', handleMouseDown);
        carouselWrapper.removeEventListener('mousemove', handleMouseMove);
        carouselWrapper.removeEventListener('mouseup', handleMouseUp);
        carouselWrapper.removeEventListener('mouseleave', handleMouseUp);
        carouselWrapper.removeEventListener('wheel', handleWheel);
    }
}

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    lastY = touchStartY;
    lastTime = Date.now();
    isDragging = true;
    velocity = 0;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    const currentY = e.touches[0].clientY;
    const currentTime = Date.now();
    const deltaY = currentY - lastY;
    const deltaTime = currentTime - lastTime;

    if (deltaTime > 0) {
        velocity = deltaY / deltaTime * 16;
    }

    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;
    const maxRotation = centerOffset;
    const minRotation = -maxSelectableIndex * 80 + centerOffset;
    const newRotation = carouselRotation + deltaY;

    if (newRotation > maxRotation) {
        carouselRotation = maxRotation + (newRotation - maxRotation) * 0.3;
    } else if (newRotation < minRotation) {
        carouselRotation = minRotation + (newRotation - minRotation) * 0.3;
    } else {
        carouselRotation = newRotation;
    }

    lastY = currentY;
    lastTime = currentTime;

    updateCarouselTransform();
}

function handleTouchEnd() {
    isDragging = false;
    applyMomentum();
}

function handleMouseDown(e) {
    touchStartY = e.clientY;
    lastY = touchStartY;
    lastTime = Date.now();
    isDragging = true;
    velocity = 0;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

function handleMouseMove(e) {
    if (!isDragging) return;

    const currentY = e.clientY;
    const currentTime = Date.now();
    const deltaY = currentY - lastY;
    const deltaTime = currentTime - lastTime;

    if (deltaTime > 0) {
        velocity = deltaY / deltaTime * 16;
    }

    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;
    const maxRotation = centerOffset;
    const minRotation = -maxSelectableIndex * 80 + centerOffset;
    const newRotation = carouselRotation + deltaY;

    if (newRotation > maxRotation) {
        carouselRotation = maxRotation + (newRotation - maxRotation) * 0.3;
    } else if (newRotation < minRotation) {
        carouselRotation = minRotation + (newRotation - minRotation) * 0.3;
    } else {
        carouselRotation = newRotation;
    }

    lastY = currentY;
    lastTime = currentTime;

    updateCarouselTransform();
}

function handleMouseUp() {
    isDragging = false;
    applyMomentum();
}

function handleWheel(e) {
    if (isDragging) return;
    e.preventDefault();

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    velocity = e.deltaY > 0 ? -25 : 25;

    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;
    const maxRotation = centerOffset;
    const minRotation = -maxSelectableIndex * 80 + centerOffset;
    const newRotation = carouselRotation + velocity;

    if (newRotation > maxRotation) {
        carouselRotation = maxRotation + (newRotation - maxRotation) * 0.3;
    } else if (newRotation < minRotation) {
        carouselRotation = minRotation + (newRotation - minRotation) * 0.3;
    } else {
        carouselRotation = newRotation;
    }

    updateCarouselTransform();

    clearTimeout(window.wheelTimeout);
    window.wheelTimeout = setTimeout(() => {
        applyMomentum();
    }, 50);
}

function applyMomentum() {
    const friction = 0.95;
    const minVelocity = 0.1;
    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;
    const maxRotation = centerOffset;
    const minRotation = -maxSelectableIndex * 80 + centerOffset;

    function animate() {
        if (Math.abs(velocity) < minVelocity) {
            velocity = 0;
            snapToNearest();
            return;
        }

        velocity *= friction;
        const newRotation = carouselRotation + velocity;

        if (newRotation > maxRotation) {
            carouselRotation = maxRotation;
            velocity = 0;
            snapToNearest();
            return;
        } else if (newRotation < minRotation) {
            carouselRotation = minRotation;
            velocity = 0;
            snapToNearest();
            return;
        }

        carouselRotation = newRotation;
        updateCarouselTransform();

        animationFrame = requestAnimationFrame(animate);
    }

    if (Math.abs(velocity) > minVelocity) {
        animate();
    } else {
        snapToNearest();
    }
}

function snapToNearest() {
    const itemHeight = 80;
    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;
    const targetIndex = Math.round((-carouselRotation + centerOffset) / itemHeight);
    const clampedIndex = Math.max(0, Math.min(maxSelectableIndex, targetIndex));
    const targetRotation = -clampedIndex * itemHeight + centerOffset;

    animateToPosition(targetRotation, () => {
        currentCarouselIndex = clampedIndex;
    });
}

function animateToPosition(target, callback) {
    const start = carouselRotation;
    const distance = target - start;
    const duration = 300;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        carouselRotation = start + distance * eased;
        updateCarouselTransform();

        if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            if (callback) callback();
        }
    }

    animate();
}

function updateCarouselTransform() {
    const carousel = document.getElementById('month-carousel-3d');
    if (!carousel) return;

    carousel.style.transform = `translateY(${carouselRotation}px)`;

    const items = carousel.querySelectorAll('.month-carousel-3d-item');
    items.forEach((item, index) => {
        const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
        const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;

        const itemY = index * 80;
        // offset from the center of the viewport/wrapper
        const offset = (itemY + carouselRotation - centerOffset) / 80;
        const distance = Math.abs(offset);
        const scale = Math.max(0.7, 1 - distance * 0.15);
        const opacity = Math.max(0.3, 1 - distance * 0.3);
        const translateZ = -distance * 50;

        item.style.transform = `translateX(-50%) scale(${scale}) translateZ(${translateZ}px)`;
        item.style.opacity = opacity;
        item.style.zIndex = Math.round(100 - distance * 10);

        if (distance < 0.5) {
            item.classList.add('center');
        } else {
            item.classList.remove('center');
        }
    });
}

function renderMonthCarousel3D() {
    const container = document.getElementById('month-carousel-3d');
    if (!container) return;

    const now = new Date();
    const viewMonthKey = `${viewMonth.getFullYear()}-${viewMonth.getMonth()}`;
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    allMonthsData = [];
    const startYear = now.getFullYear() - 2;
    const endDate = new Date(now);
    endDate.setMonth(now.getMonth() + 5); // Add 5 future months back for visual only
    let year = startYear;
    let month = 0;

    maxSelectableIndex = 0;

    while (year < endDate.getFullYear() || (year === endDate.getFullYear() && month <= endDate.getMonth())) {
        const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

        allMonthsData.push({
            year: year,
            month: month,
            key: `${year}-${month}`,
            isFuture: isFuture
        });

        if (!isFuture) {
            maxSelectableIndex = allMonthsData.length - 1;
        }

        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
    }

    // Center on active view month when opening
    currentCarouselIndex = allMonthsData.findIndex(m => m.key === viewMonthKey);
    if (currentCarouselIndex === -1) {
        currentCarouselIndex = maxSelectableIndex;
    }

    const carouselWrapper = document.querySelector('.month-carousel-3d-wrapper');
    const centerOffset = carouselWrapper ? carouselWrapper.clientHeight / 2 : window.innerHeight / 2;
    carouselRotation = -currentCarouselIndex * 80 + centerOffset;

    container.innerHTML = '';

    allMonthsData.forEach((monthData, index) => {
        const date = new Date(monthData.year, monthData.month, 1);
        const locale = currentLang === 'fil' ? 'fil-PH' : 'en-US';
        const monthName = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

        const item = document.createElement('div');
        item.className = 'month-carousel-3d-item';
        if (monthData.isFuture) {
            item.classList.add('future-month');
        } else {
            item.onclick = () => selectMonthFromCarousel(monthData.year, monthData.month);
        }
        item.innerHTML = `<div class="month-carousel-3d-item-name">${monthName}</div>`;
        item.style.top = `${index * 80}px`;

        container.appendChild(item);
    });

    updateCarouselTransform();
}

function selectMonthFromCarousel(year, month) {
    viewMonth = new Date(year, month, 1);
    selectedFeedDay = null;

    updateMonthHeader();
    closeMonthPicker();

    if (document.getElementById('tab-calendar')?.classList.contains('active')) {
        renderCalendarGrid();
    }

    if (currentUser) {
        loadOrgFeed(currentUser, true);
    }
}

function selectMonth(year, month) {
    viewMonth = new Date(year, month, 1);
    selectedFeedDay = null;

    updateMonthHeader();
    updateDayNavigator();
    closeMonthPicker();

    if (document.getElementById('tab-calendar')?.classList.contains('active')) {
        renderCalendarGrid();
    }

    if (currentUser) {
        loadOrgFeed(currentUser, true);
    }
}

// ─── Day Navigation ─────────────────────────────────────────────
// ─── Day Navigation (Simple Calendar Pick) ──────────────────────
function onDateInputChange(val) {
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    selectedFeedDay = new Date(y, m - 1, d);

    // Auto-update the month header if user picks a date from another month
    if (selectedFeedDay.getMonth() !== viewMonth.getMonth() || selectedFeedDay.getFullYear() !== viewMonth.getFullYear()) {
        viewMonth = new Date(y, m - 1, 1);
        updateMonthHeader();
        loadOrgFeed(currentUser, true); // reload organizational feed for new month
    }

    updateDayNavigator();
    renderEntries();
}

function updateDayNavigator() {
    const label = document.getElementById('current-day-label');
    if (!label) return;

    if (!selectedFeedDay) {
        label.textContent = 'TODAY';
    } else {
        const today = new Date();
        const isToday = selectedFeedDay.getDate() === today.getDate() &&
            selectedFeedDay.getMonth() === today.getMonth() &&
            selectedFeedDay.getFullYear() === today.getFullYear();

        if (isToday) {
            label.textContent = 'TODAY';
        } else {
            const options = { day: 'numeric', month: 'short' };
            label.textContent = selectedFeedDay.toLocaleDateString('en-US', options).toUpperCase();
        }
    }
}



function resetDayFilter() {
    selectedFeedDay = new Date(); // Reset to today
    // Sync month if needed
    viewMonth = new Date(selectedFeedDay.getFullYear(), selectedFeedDay.getMonth(), 1);
    updateMonthHeader();
    loadOrgFeed(currentUser, true);

    updateDayNavigator();
    renderEntries();
}




function toggleFabMenu() {
    const menu = document.getElementById('fab-menu-overlay');
    if (!menu) return;
    if (menu.classList.contains('open')) {
        menu.classList.remove('open');
    } else {
        menu.classList.add('open');
    }
}

function closeFabMenu() {
    const menu = document.getElementById('fab-menu-overlay');
    if (menu) menu.classList.remove('open');
}

// Open mood page from the "How are you?" hero
function openMoodPageWithMood(moodKey) {
    // Set the timestamp based on selectedFeedDay
    let targetDate;
    if (selectedFeedDay) {
        // Use the selected day
        targetDate = new Date(selectedFeedDay);
        // Set to current time of that day, or noon if it's a past day
        const now = new Date();
        const isToday = targetDate.getDate() === now.getDate() &&
            targetDate.getMonth() === now.getMonth() &&
            targetDate.getFullYear() === now.getFullYear();

        if (isToday) {
            targetDate = now; // Use current time for today
        } else {
            targetDate.setHours(12, 0, 0, 0); // Use noon for past days
        }
    } else {
        targetDate = new Date(); // Default to now
    }

    const timestamp = targetDate.getTime();

    // Open quick mood selector with the timestamp
    openQuickMoodSelector(timestamp);
}

function openYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // Noon
    closeFabMenu();
    openQuickMoodSelector(yesterday.getTime());
}

function openYesterdayEntry() {
    closeFabMenu();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Update state to filter by yesterday
    selectedFeedDay = yesterday;

    // Sync viewMonth if user navigated to a different month
    if (selectedFeedDay.getMonth() !== viewMonth.getMonth() || selectedFeedDay.getFullYear() !== viewMonth.getFullYear()) {
        viewMonth = new Date(selectedFeedDay.getFullYear(), selectedFeedDay.getMonth(), 1);
        updateMonthHeader();
        loadOrgFeed(currentUser, true);
    }

    // Switch to entries tab to see the filtered results (fixed function name)
    switchTab('entries');

    updateDayNavigator();
    renderEntries();
}

function openOtherDayPicker() {
    closeFabMenu();
    // Open the date picker
    const datePicker = document.getElementById('feed-date-picker');
    if (datePicker) {
        datePicker.showPicker();
    }
}

// ─── Mood Modal ─────────────────────────────────────────────────
async function openMoodModal(timestamp = null) {
    console.log('=== openMoodModal called ===');
    console.log('timestamp:', timestamp);
    console.log('pendingMood:', pendingMood);

    selectedPastDate = timestamp || new Date().getTime();
    closeFabMenu(); // Hide menu if we are opening picker

    // Clear selections for a fresh entry
    selectedActivities.clear();
    selectedEmotions.clear();

    const modal = document.getElementById('mood-modal');
    console.log('mood-modal element:', modal);

    // Update selected mood display if coming from quick selector
    if (pendingMood && typeof pendingMood === 'object') {
        const moodDisplay = document.getElementById('selected-mood-display');
        if (moodDisplay) {
            moodDisplay.innerHTML = `
                <span class="selected-mood-emoji">${pendingMood.emoji}</span>
                <span class="selected-mood-label">${pendingMood.label}</span>
            `;
            console.log('Updated mood display in openMoodModal');
        }
    }

    // Render emotion and activity grids with custom data
    console.log('Rendering grids...');
    await renderEmotionGrid();
    await renderActivityGrid();
    console.log('Grids rendered');

    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        console.log('Modal opened successfully');
    } else {
        console.error('mood-modal not found!');
    }
}

function closeMoodModal() {
    const modal = document.getElementById('mood-modal');
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

    // Reset selections
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
    selectedActivities.clear();
    selectedEmotions.clear();
    pendingMood = null;
    const note = document.getElementById('mood-note');
    if (note) note.value = '';
    setTimeout(() => { selectedPastDate = null; }, 300);
}


// ─── Toggle Modal Section ───────────────────────────────────────
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
    }
}

// ─── Quick Mood Selector Functions ──────────────────────────────
const DEFAULT_MOODS = [
    { emoji: "😄", label: "rad", color: "#a8e6a1" },
    { emoji: "🙂", label: "good", color: "#ffd93d" },
    { emoji: "😐", label: "meh", color: "#ffb4a2" },
    { emoji: "😔", label: "bad", color: "#ff6b9d" },
    { emoji: "😢", label: "awful", color: "#95a5a6" }
];

function openQuickMoodSelector(timestamp = null) {
    selectedPastDate = timestamp;
    // Close FAB menu first
    closeFabMenu();

    const modal = document.getElementById('quick-mood-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        renderQuickMoodGrid();
        updateQuickDateTime();
    }
}

function closeQuickMoodModal() {
    const modal = document.getElementById('quick-mood-modal');
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


// ─── Day Details Modal ───────────────────────────────────────
function openDayDetails(timestamp) {
    const d = new Date(timestamp);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

    // Filter personalEntries for this day
    const entries = personalEntries.filter(e => e.uid === currentUser?.uid && e.timestamp >= dayStart && e.timestamp <= dayEnd);

    // Get important days for this date
    // Normalize date string to match YYYY-MM-DD
    const dateStr = d.toISOString().split('T')[0];
    const impDays = typeof getImportantDaysForDate === 'function' ? getImportantDaysForDate(dateStr) : [];

    // Sort entries by timestamp descending
    entries.sort((a, b) => b.timestamp - a.timestamp);

    const modal = document.getElementById('day-details-modal');
    const subtitle = document.getElementById('day-details-subtitle');
    const list = document.getElementById('day-entries-list');
    const addBtn = document.getElementById('add-more-btn');

    if (subtitle) {
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        subtitle.textContent = d.toLocaleDateString('en-US', options);
    }

    if (list) {
        if (entries.length === 0 && impDays.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--d-muted); padding: 20px;">No entries for this day.</div>`;
        } else {
            let html = '';

            // Render Important Days first
            if (impDays && impDays.length > 0) {
                html += impDays.map(day => {
                    const emoji = day.emoji || '⭐';
                    const color = day.color || '#6366f1';
                    return `
                        <div class="day-entry-mini-card imp-day-mini-card" style="border-left: 4px solid ${color};">
                            <div class="mini-card-mood" style="background: ${color}20; color: ${color};">
                                <span>${emoji}</span>
                            </div>
                            <div class="mini-card-info">
                                <span class="mini-card-time">EVENT</span>
                                <span class="mini-card-label" style="color: ${color}; font-weight: 700;">${escapeHtml(day.title)}</span>
                                ${day.notes ? `<span class="mini-card-note">${escapeHtml(day.notes)}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Render Mood Entries
            html += entries.map(e => {
                const timeStr = new Date(e.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                return `
                    <div class="day-entry-mini-card">
                        <div class="mini-card-mood" style="background: ${e.moodColor};">
                            <span>${e.moodEmoji}</span>
                        </div>
                        <div class="mini-card-info">
                            <span class="mini-card-time">${timeStr}</span>
                            <span class="mini-card-label" style="color: ${e.moodColor};">${e.moodLabel}</span>
                        </div>
                        <div class="mini-card-actions">
                            <i class="bi bi-chevron-right"></i>
                        </div>
                    </div>
                `;
            }).join('');

            list.innerHTML = html;
        }
    }

    if (addBtn) {
        addBtn.onclick = () => {
            closeDayDetails();
            // Use midday for past adds unless it's today
            let addTime = dayStart + (12 * 60 * 60 * 1000);
            const now = new Date().getTime();
            if (now >= dayStart && now <= dayEnd) addTime = now;

            openQuickMoodSelector(addTime);
        };
    }

    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeDayDetails() {
    const modal = document.getElementById('day-details-modal');
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

// ─── Goals Modal Functions ──────────────────────────────────────
let selectedGoalType = 'personal';
let currentGoalsFilter = 'personal';
let editingGoalId = null;
let goalsRefreshInterval = null;

function openGoalsModal() {
    closeFabMenu();
    
    // Request notification permission on first open
    if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log('✅ Notification permission granted');
            }
        });
    }
    
    const modal = document.getElementById('goals-modal');
    if (modal) {
        // Show list view, hide form
        document.getElementById('goals-list-view').style.display = 'block';
        document.getElementById('goal-form-view').style.display = 'none';
        document.getElementById('goals-add-btn').innerHTML = '<i class="bi bi-plus-lg"></i>';

        // Load all goals for the user/org to ensure reminders engine has the full list
        loadGoals();

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeGoalsModal() {
    const modal = document.getElementById('goals-modal');
    if (modal) {
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');

        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
            editingGoalId = null;
        }, 300);
    }
}

function showGoalForm(goalId = null) {
    console.log('📝 showGoalForm called, goalId:', goalId);
    
    document.getElementById('goals-list-view').style.display = 'none';
    document.getElementById('goal-form-view').style.display = 'block';
    document.getElementById('goals-add-btn').innerHTML = '<i class="bi bi-arrow-left"></i>';
    document.getElementById('goals-add-btn').onclick = hideGoalForm;

    if (goalId) {
        // EDIT MODE
        console.log('✏️ EDIT MODE');
        editingGoalId = goalId;
        const goal = goalsList.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('goal-title').value = goal.title;
            document.getElementById('goal-description').value = goal.description || '';
            
            // Handle new format
            if (goal.reminderFrequency) {
                document.getElementById('goal-reminder-frequency').value = goal.reminderFrequency || '';
                document.getElementById('goal-reminder-time').value = goal.reminderTime || '';
                
                // Show/hide custom days based on frequency
                toggleCustomDays();

                // Set custom days checkboxes
                if (goal.reminderFrequency === 'custom' && goal.reminderDays) {
                    document.querySelectorAll('#custom-days-group input[type="checkbox"]').forEach(cb => {
                        cb.checked = goal.reminderDays.includes(parseInt(cb.value));
                    });
                }
            }
            // Handle old format (reminderDateTime) - leave empty so user can set new format
            else if (goal.reminderDateTime) {
                document.getElementById('goal-reminder-frequency').value = '';
                document.getElementById('goal-reminder-time').value = '';
            }
            
            selectedGoalType = goal.type || 'personal';

            // Update type buttons
            document.querySelectorAll('.goal-type-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === selectedGoalType) {
                    btn.classList.add('active');
                }
            });
        }
    } else {
        // CREATE MODE - RESET EVERYTHING
        console.log('➕ CREATE MODE - Resetting form');
        editingGoalId = null;
        
        // Clear all inputs
        document.getElementById('goal-title').value = '';
        document.getElementById('goal-description').value = '';
        document.getElementById('goal-reminder-frequency').value = '';
        document.getElementById('goal-reminder-time').value = '';
        
        // Clear custom days checkboxes
        document.querySelectorAll('#custom-days-group input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Hide custom days and time
        document.getElementById('custom-days-group').style.display = 'none';
        document.getElementById('reminder-time-group').style.display = 'none';
        
        // Reset to defaults
        selectedGoalType = 'personal';
        
        // Reset type buttons
        document.querySelectorAll('.goal-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'personal') {
                btn.classList.add('active');
            }
        });
        
        console.log('✅ Form reset complete');
    }
}

function toggleCustomDays() {
    const frequency = document.getElementById('goal-reminder-frequency').value;
    const customDaysGroup = document.getElementById('custom-days-group');
    const reminderTimeGroup = document.getElementById('reminder-time-group');
    
    if (frequency === 'custom') {
        customDaysGroup.style.display = 'block';
        reminderTimeGroup.style.display = 'block';
    } else if (frequency === 'daily') {
        customDaysGroup.style.display = 'none';
        reminderTimeGroup.style.display = 'block';
    } else {
        customDaysGroup.style.display = 'none';
        reminderTimeGroup.style.display = 'none';
    }
}

function hideGoalForm() {
    document.getElementById('goals-list-view').style.display = 'block';
    document.getElementById('goal-form-view').style.display = 'none';
    document.getElementById('goals-add-btn').innerHTML = '<i class="bi bi-plus-lg"></i>';
    document.getElementById('goals-add-btn').onclick = () => showGoalForm(null);
    editingGoalId = null;
    
    // Clear form
    document.getElementById('goal-title').value = '';
    document.getElementById('goal-description').value = '';
    document.getElementById('goal-reminder-frequency').value = '';
    document.getElementById('goal-reminder-time').value = '';
    
    // Clear custom days checkboxes
    document.querySelectorAll('#custom-days-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Hide custom days and time
    document.getElementById('custom-days-group').style.display = 'none';
    document.getElementById('reminder-time-group').style.display = 'none';
}

function filterGoals(type) {
    currentGoalsFilter = type;

    // Update tab active state
    document.querySelectorAll('.goals-filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === type) {
            tab.classList.add('active');
        }
    });

    // Reload goals for the new filter
    loadGoals();
}

async function loadGoals(silent = false) {
    try {
        if (!silent) {
            console.log('📥 Loading goals...');
        }

        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');

        const res = await fetch(`/api/goals/list?orgId=${orgId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            const newGoals = data.goals || [];

            // Check if there are new goals
            const hasNewGoals = newGoals.length > goalsList.length;

            goalsList = newGoals;
            renderGoalsList();

            // Start the real-time notification engine
            startGoalNotificationEngine();

            if (!silent && hasNewGoals && currentGoalsFilter === 'team') {
                console.log('✨ New team goals detected!');
            }
        } else {
            if (!silent) {
                showToast('Failed to load goals', '⚠️');
            }
        }
    } catch (err) {
        console.error('Error loading goals:', err);
        if (!silent) {
            showToast('Error loading goals', '⚠️');
        }
    }
}

function renderGoalsList() {
    const container = document.getElementById('goals-list-container');
    if (!container) return;

    // Filter goals by current filter
    const filteredGoals = goalsList.filter(goal => {
        if (currentGoalsFilter === 'personal') {
            return goal.userId === currentUser.uid && goal.type === 'personal';
        } else {
            return goal.type === 'team';
        }
    });

    console.log('📋 Rendering goals:', filteredGoals.length);
    if (filteredGoals.length > 0) {
        console.log('📋 First goal data:', filteredGoals[0]);
    }

    if (filteredGoals.length === 0) {
        container.innerHTML = `
            <div class="goals-empty">
                <i class="bi bi-bullseye"></i>
                <p>No ${currentGoalsFilter} goals yet.<br>Click + to create one!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredGoals.map((goal, index) => {
        // Get this user's notification settings
        const userSettings = goal.userNotificationSettings?.[currentUser.uid] || {};
        
        // Only consider new format as having reminder (old format needs to be updated)
        const hasReminder = goal.reminderFrequency && goal.reminderTime;
        const notifEnabled = userSettings.enabled !== false && hasReminder;
        const notifInfo = getNotificationInfoFromGoal(goal);
        const isOwner = goal.userId === currentUser.uid;
        const animationDelay = (index * 0.05) + 's';
        
        const title = goal.title || 'Untitled Goal';
        const description = goal.description || '';
        const type = goal.type || 'personal';

        return `
        <div class="goal-item" style="animation: slideUpFade 0.4s ease forwards; animation-delay: ${animationDelay}; opacity: 0;">
            ${isOwner && hasReminder ? `
            <div class="goal-notif-bell ${notifEnabled ? 'active' : ''}" onclick="toggleGoalNotifications('${goal.id}', ${!notifEnabled})" title="Toggle Notifications">
                <i class="bi ${notifEnabled ? 'bi-bell-fill' : 'bi-bell-slash'}"></i>
            </div>
            ` : '<div style="width: 32px;"></div>'}
            <div class="goal-content">
                <div class="goal-title">${title}</div>
                ${description ? `<div class="goal-description">${description}</div>` : '<div class="goal-description" style="color: #94a3b8; font-style: italic;">No description</div>'}
                ${isOwner ? `
                <div class="goal-notif-info">
                    <i class="bi ${hasReminder ? (notifEnabled ? 'bi-bell-fill' : 'bi-bell-slash') : 'bi-bell-slash'}"></i> ${notifInfo}
                </div>
                ` : ''}
            </div>
            ${isOwner ? `
            <div class="goal-menu-btn" onclick="toggleGoalMenu(event, '${goal.id}')">
                <i class="bi bi-three-dots-vertical"></i>
                <div class="goal-menu-dropdown" id="goal-menu-${goal.id}">
                    <div class="goal-menu-item" onclick="editGoal('${goal.id}')">
                        <i class="bi bi-pencil"></i>
                        <span>Edit</span>
                    </div>
                    <div class="goal-menu-item delete" onclick="deleteGoal('${goal.id}')">
                        <i class="bi bi-trash"></i>
                        <span>Delete</span>
                    </div>
                </div>
            </div>
            ` : '<div style="width: 32px;"></div>'}
        </div>
    `;
    }).join('');
}

function getNotificationInfoFromGoal(goal) {
    // Handle new format (frequency + days + time)
    if (goal.reminderFrequency && goal.reminderTime) {
        const timeStr = formatTime(goal.reminderTime);
        
        if (goal.reminderFrequency === 'daily') {
            return `Every day at ${timeStr}`;
        } else if (goal.reminderFrequency === 'custom' && goal.reminderDays && goal.reminderDays.length > 0) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const selectedDays = goal.reminderDays.map(d => dayNames[d]).join(', ');
            return `${selectedDays} at ${timeStr}`;
        }
    }
    
    // Old format goals - don't show the date, just say "No reminder set"
    // User needs to edit and set new format
    return 'No reminder set';
}

function formatTime(time) {
    if (!time) return '';
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

function toggleGoalMenu(event, goalId) {
    event.stopPropagation();

    // Close all other menus
    document.querySelectorAll('.goal-menu-dropdown').forEach(menu => {
        if (menu.id !== `goal-menu-${goalId}`) {
            menu.classList.remove('open');
        }
    });

    // Toggle this menu
    const menu = document.getElementById(`goal-menu-${goalId}`);
    if (menu) {
        menu.classList.toggle('open');
    }
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.goal-menu-btn')) {
        document.querySelectorAll('.goal-menu-dropdown').forEach(menu => {
            menu.classList.remove('open');
        });
    }
});

function editGoal(goalId) {
    showGoalForm(goalId);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function toggleGoalNotifications(goalId, enabled) {
    console.log(`🔔 Toggling notifications for goal ${goalId}: ${enabled}`);

    // If enabling and permission not granted, request it
    if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
        console.log('📤 Requesting permission...');
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('⚠️ Permission denied');
                showToast('Please allow notifications in your browser', '⚠️');
                return;
            }
            console.log('✅ Permission granted');
        } catch (err) {
            console.error('❌ Permission error:', err);
            showToast('Error requesting permission', '⚠️');
            return;
        }
    }

    try {
        const token = await currentUser.getIdToken();

        const res = await fetch('/api/goals/toggle-notifications', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ goalId, enabled })
        });

        if (res.ok) {
            // Update local list
            const goal = goalsList.find(g => g.id === goalId);
            if (goal) {
                if (!goal.userNotificationSettings) {
                    goal.userNotificationSettings = {};
                }
                if (!goal.userNotificationSettings[currentUser.uid]) {
                    goal.userNotificationSettings[currentUser.uid] = {};
                }
                goal.userNotificationSettings[currentUser.uid].enabled = enabled;
                renderGoalsList();
                // Re-schedule notifications after toggling
                forceRescheduleGoalNotifications();

                showToast(enabled ? 'Notifications enabled 🔔' : 'Notifications disabled', enabled ? '✅' : 'ℹ️');
            }
        } else {
            showToast('Failed to update notifications', '⚠️');
        }
    } catch (err) {
        console.error('Error toggling notifications:', err);
        showToast('Error updating notifications', '⚠️');
    }
}

async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) {
        return;
    }

    try {
        const token = await currentUser.getIdToken();

        const res = await fetch('/api/goals/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ goalId })
        });

        if (res.ok) {
            showToast('Goal deleted', '🗑️');
            // Remove from local list
            goalsList = goalsList.filter(g => g.id !== goalId);
            renderGoalsList();
        } else {
            showToast('Failed to delete goal', '⚠️');
        }
    } catch (err) {
        console.error('Error deleting goal:', err);
        showToast('Error deleting goal', '⚠️');
    }
}

function selectGoalType(type) {
    selectedGoalType = type;
    document.querySelectorAll('.goal-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
}

async function saveGoal() {
    const title = document.getElementById('goal-title').value.trim();
    const description = document.getElementById('goal-description').value.trim();
    const frequency = document.getElementById('goal-reminder-frequency').value;
    const reminderTime = document.getElementById('goal-reminder-time').value;

    console.log('💾 Saving goal:', { title, frequency, reminderTime });

    if (!title) {
        showToast('Please enter a goal title', '⚠️');
        return;
    }

    let reminderDays = [];
    if (frequency === 'daily') {
        reminderDays = [0, 1, 2, 3, 4, 5, 6]; // All days
    } else if (frequency === 'custom') {
        const checkboxes = document.querySelectorAll('#custom-days-group input[type="checkbox"]:checked');
        reminderDays = Array.from(checkboxes).map(cb => parseInt(cb.value));

        if (reminderDays.length === 0) {
            showToast('Please select at least one day', '⚠️');
            return;
        }
    }

    if (frequency && !reminderTime) {
        showToast('Please set a reminder time', '⚠️');
        return;
    }

    try {
        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');

        const goalData = {
            title,
            description,
            type: selectedGoalType,
            orgId,
            reminderFrequency: frequency || null,
            reminderDays: frequency ? reminderDays : [],
            reminderTime: frequency ? reminderTime : null
        };

        console.log('📤 Sending to server:', goalData);

        let res;
        if (editingGoalId) {
            res = await fetch('/api/goals/update', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: editingGoalId, ...goalData })
            });
        } else {
            res = await fetch('/api/goals/create', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData)
            });
        }

        if (res.ok) {
            const result = await res.json();
            console.log('✅ Server response:', result);
            showToast(editingGoalId ? 'Goal updated!' : 'Goal created!', '🎯');
            hideGoalForm();
            await loadGoals();
        } else {
            const error = await res.json();
            console.error('❌ Server error:', error);
            showToast(error.error || 'Failed to save goal', '⚠️');
        }
    } catch (err) {
        console.error('❌ Save goal error:', err);
        showToast('Error saving goal', '⚠️');
    }
}


// ─── Important Days Functions ──────────────────────────────────────
let importantDaysList = [];
// allImportantDays defined at top for global access
let currentImportantDayFilter = 'personal';
let currentImportantDayType = 'personal';
let currentEventCategory = 'birthday';
let editingImportantDayId = null;

const EVENT_CATEGORIES = {
    birthday: { emoji: '🎂', label: 'Birthday', color: '#ec4899' },
    meeting: { emoji: '📋', label: 'Meeting', color: '#3b82f6' },
    launch: { emoji: '🚀', label: 'Launch', color: '#8b5cf6' },
    engagement: { emoji: '🤝', label: 'Engagement', color: '#10b981' },
    anniversary: { emoji: '🎉', label: 'Anniversary', color: '#f59e0b' },
    event: { emoji: '⭐', label: 'Custom', color: '#6366f1' },
};

// Important Day Form - Emoji and Color Selection
let selectedEventEmoji = '🎉';
let selectedEventColor = '#ec4899';

function selectEventColor(color) {
    selectedEventColor = color;
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

function openEventEmojiPicker() {
    // Simple emoji picker - show common emojis
    const commonEmojis = [
        '🎉', '🎂', '🎈', '🎁', '🎊', '🎆', '🎇', '✨',
        '❤️', '💕', '💖', '💗', '💙', '💚', '💛', '🧡',
        '🎓', '📚', '📝', '📅', '📆', '🗓️', '📋', '📌',
        '🚀', '✈️', '🚗', '🏠', '🏢', '🏥', '🏫', '🏪',
        '⭐', '🌟', '💫', '🌈', '🌸', '🌺', '🌻', '🌹',
        '🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻',
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
        '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍰', '🎂',
        '☕', '🍵', '🥤', '🍷', '🍺', '🍻', '🥂', '🍾',
        '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👪', '👫', '👬', '👭', '💑'
    ];
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 16px;
        max-width: 400px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    modal.innerHTML = `
        <div style="padding: 20px 20px 15px 20px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0; color: #1e293b;">Choose Emoji</h3>
        </div>
        <div style="padding: 15px 20px; overflow-y: auto; overflow-x: hidden; flex: 1;">
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
                ${commonEmojis.map(emoji => `
                    <button onclick="selectEventEmojiAndClose('${emoji}')" style="
                        font-size: 32px;
                        padding: 10px;
                        border: 2px solid transparent;
                        border-radius: 8px;
                        background: #f8fafc;
                        cursor: pointer;
                        transition: all 0.2s;
                        aspect-ratio: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='scale(1.1)'" 
                       onmouseout="this.style.borderColor='transparent'; this.style.transform='scale(1)'">${emoji}</button>
                `).join('')}
            </div>
        </div>
        <div style="padding: 15px 20px; border-top: 1px solid #e2e8f0;">
            <button onclick="this.closest('div').parentElement.parentElement.remove()" style="
                width: 100%;
                padding: 12px;
                background: #e2e8f0;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
            ">Cancel</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Global function to select emoji and close picker
window.selectEventEmojiAndClose = function(emoji) {
    selectedEventEmoji = emoji;
    console.log('✅ Emoji selected:', emoji);
    console.log('📝 selectedEventEmoji is now:', selectedEventEmoji);
    document.getElementById('selected-event-emoji').textContent = emoji;
    // Remove the picker overlay
    document.querySelectorAll('body > div').forEach(div => {
        if (div.style.position === 'fixed' && div.style.zIndex === '10000') {
            div.remove();
        }
    });
};

function filterImportantDays(type) {
    currentImportantDayFilter = type;
    document.querySelectorAll('.goals-filter-tab[data-id-filter]').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.idFilter === type);
    });
    loadImportantDays();
}

function selectImportantDayType(type) {
    currentImportantDayType = type;
    document.querySelectorAll('.goal-type-btn[data-id-type]').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.idType === type);
    });
}

function openImportantDaysModal() {
    closeFabMenu();
    const modal = document.getElementById('important-days-modal');
    if (modal) {
        document.getElementById('important-days-list-view').style.display = 'block';
        document.getElementById('important-day-form-view').style.display = 'none';
        document.getElementById('important-days-add-btn').innerHTML = '<i class="bi bi-plus-lg"></i>';
        document.getElementById('important-days-add-btn').onclick = showImportantDayForm;
        loadImportantDays();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeImportantDaysModal() {
    const modal = document.getElementById('important-days-modal');
    if (modal) {
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');
        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
}

function showImportantDayForm(editDay) {
    document.getElementById('important-days-list-view').style.display = 'none';
    document.getElementById('important-day-form-view').style.display = 'block';
    document.getElementById('important-days-add-btn').innerHTML = '<i class="bi bi-arrow-left"></i>';
    document.getElementById('important-days-add-btn').onclick = hideImportantDayForm;

    const sheetTitle = document.querySelector('#important-days-modal .sheet-title');

    // Check if editDay is actually a day object and NOT a MouseEvent
    const isEditing = editDay && typeof editDay === 'object' && !(editDay instanceof MouseEvent);

    if (isEditing) {
        // Edit mode
        editingImportantDayId = editDay.id;
        if (sheetTitle) sheetTitle.innerHTML = '<span style="color:var(--d-primary); font-weight: 800;">✏️ Edit Event</span>';

        document.getElementById('important-day-title').value = editDay.title || '';
        document.getElementById('important-day-date').value = editDay.date || '';
        const timeInput = document.getElementById('important-day-time');
        if (timeInput) timeInput.value = editDay.time || '';
        document.getElementById('important-day-notes').value = editDay.notes || '';
        const reminderSelect = document.getElementById('important-day-reminder');
        if (reminderSelect) reminderSelect.value = editDay.reminderBefore || 'none';
        
        // Set emoji and color
        selectedEventEmoji = editDay.emoji || '🎉';
        selectedEventColor = editDay.color || '#ec4899';
        document.getElementById('selected-event-emoji').textContent = selectedEventEmoji;
        selectEventColor(selectedEventColor);
        
        currentImportantDayType = editDay.type || 'personal';

        const saveBtn = document.querySelector('#important-day-form-view .btn-primary');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Update Event';
            saveBtn.style.background = 'var(--d-primary)';
        }
    } else {
        // Create mode
        editingImportantDayId = null;
        const sheetTitle = document.querySelector('#important-days-modal .sheet-title');
        if (sheetTitle) sheetTitle.innerHTML = '<span style="color:var(--d-primary); font-weight: 800;">✨ New Event</span>';

        document.getElementById('important-day-title').value = '';
        document.getElementById('important-day-date').value = '';
        const timeInput = document.getElementById('important-day-time');
        if (timeInput) timeInput.value = '';
        document.getElementById('important-day-notes').value = '';
        const reminderSelect = document.getElementById('important-day-reminder');
        if (reminderSelect) reminderSelect.value = 'none';
        
        // Reset emoji and color to defaults
        selectedEventEmoji = '🎉';
        selectedEventColor = '#ec4899';
        console.log('🔄 CREATE MODE - Reset emoji to:', selectedEventEmoji, 'color:', selectedEventColor);
        document.getElementById('selected-event-emoji').textContent = '🎉';
        selectEventColor('#ec4899');
        
        currentImportantDayType = 'personal';

        const saveBtn = document.querySelector('#important-day-form-view .btn-primary');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-plus-lg"></i> Save Event';
            saveBtn.style.background = ''; // default
        }
    }

    document.querySelectorAll('.event-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentEventCategory);
    });
    document.querySelectorAll('.goal-type-btn[data-id-type]').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.idType === currentImportantDayType);
    });
}

function hideImportantDayForm() {
    editingImportantDayId = null;
    const sheetTitle = document.querySelector('#important-days-modal .sheet-title');
    if (sheetTitle) sheetTitle.textContent = 'Important Days';
    document.getElementById('important-days-list-view').style.display = 'block';
    document.getElementById('important-day-form-view').style.display = 'none';
    document.getElementById('important-days-add-btn').innerHTML = '<i class="bi bi-plus-lg"></i>';
    document.getElementById('important-days-add-btn').onclick = showImportantDayForm;
    
    // Reset emoji and color to defaults
    selectedEventEmoji = '🎉';
    selectedEventColor = '#ec4899';
    if (document.getElementById('selected-event-emoji')) {
        document.getElementById('selected-event-emoji').textContent = '🎉';
    }
    selectEventColor('#ec4899');
}

async function loadImportantDays() {
    const container = document.getElementById('important-days-list-container');
    if (container) {
        container.innerHTML = '<div class="goals-empty" style="opacity:0.5;"><div class="spinner-small"></div><p style="margin-top:8px;">Loading events...</p></div>';
    }
    try {
        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId') || '';
        const res = await fetch(`/api/important-days/list?orgId=${encodeURIComponent(orgId)}&type=${encodeURIComponent(currentImportantDayFilter)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            importantDaysList = data.days || [];
            console.log('📥 Loaded', importantDaysList.length, 'important days');
            if (importantDaysList.length > 0) {
                console.log('📋 First day:', importantDaysList[0]);
            }
            // Cache for calendar
            if (currentImportantDayFilter === 'personal') {
                allImportantDays = [...importantDaysList];
            }
            renderImportantDaysList();
            // Schedule notifications for important days
            scheduleImportantDayNotifications();
        } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Load important days error:', errData);
            if (container) {
                container.innerHTML = '<div class="goals-empty"><i class="bi bi-exclamation-triangle" style="color:#f59e0b;font-size:1.5rem;"></i><p>Could not load events.</p></div>';
            }
        }
    } catch (err) {
        console.error('Error loading important days:', err);
        if (container) {
            container.innerHTML = '<div class="goals-empty"><i class="bi bi-wifi-off" style="color:#ef4444;font-size:1.5rem;"></i><p>Network error.</p></div>';
        }
    }
}

// Fetch all important days for calendar markers (called during calendar render)
async function fetchImportantDaysForCalendar() {
    try {
        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId') || '';

        // Fetch personal
        const resP = await fetch(`/api/important-days/list?orgId=${encodeURIComponent(orgId)}&type=personal`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataP = resP.ok ? await resP.json() : { days: [] };

        // Fetch team (if orgId exists)
        let teamDays = [];
        if (orgId) {
            const resT = await fetch(`/api/important-days/list?orgId=${encodeURIComponent(orgId)}&type=team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataT = resT.ok ? await resT.json() : { days: [] };
            teamDays = dataT.days || [];
        }

        allImportantDays = [...(dataP.days || []), ...teamDays];
        // Schedule notifications for all important days
        scheduleImportantDayNotifications();
        
        // Check for today's important days and show notification
        checkTodayImportantDays();
    } catch (e) {
        console.warn('Could not load important days for calendar', e);
    }
}

// Check if there are important days today and show notification (once per day)
function checkTodayImportantDays() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayKey = `imp_day_notif_${todayStr}`;
    
    // Check if already shown today
    const alreadyShown = localStorage.getItem(todayKey);
    if (alreadyShown === 'true') {
        console.log('📅 Important day notification already shown today');
        return;
    }
    
    // Get today's important days
    const todayImportantDays = getImportantDaysForDate(todayStr);
    
    if (todayImportantDays.length > 0) {
        console.log('📅 Found important days today:', todayImportantDays);
        
        // Show notification popup
        showImportantDayNotification(todayImportantDays);
        
        // Mark as shown for today
        localStorage.setItem(todayKey, 'true');
    }
}

// Show important day notification popup
function showImportantDayNotification(importantDays) {
    console.log('🎉 showImportantDayNotification called with:', importantDays);
    
    // Save to notification history
    importantDays.forEach(day => {
        saveImportantDayToHistory(day);
    });
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 16px;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.3s;
    `;
    
    // Build content
    let content = `
        <div style="font-size: 60px; margin-bottom: 20px;">
            <i class="bi bi-calendar-event" style="color: #ec4899;"></i>
        </div>
        <h2 style="margin: 10px 0; color: #1e293b;">Important Day${importantDays.length > 1 ? 's' : ''} Today!</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
            Don't forget these special events:
        </p>
    `;
    
    // List all important days
    importantDays.forEach(day => {
        const emoji = day.emoji || '🎉';
        const color = day.color || '#ec4899';
        const title = day.title || 'Untitled';
        const notes = day.notes || '';
        
        content += `
            <div style="background: ${color}10; padding: 15px; margin: 10px 0; border-radius: 8px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <span style="font-size: 24px;">${emoji}</span>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: ${color}; margin-bottom: 5px;">
                    ${title}
                </div>
                ${notes ? `<div style="font-size: 14px; color: #64748b;">${notes}</div>` : ''}
            </div>
        `;
    });
    
    content += `
        <button onclick="this.closest('div').parentElement.remove()" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            width: 100%;
        ">Got it!</button>
    `;
    
    modal.innerHTML = content;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Play sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz');
    audio.play().catch(() => {});
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 10000);
    
    console.log('✅ Important day popup added to DOM');
}

// Get important days for a specific date string (YYYY-MM-DD)
function getImportantDaysForDate(dateStr) {
    return allImportantDays.filter(d => d.date === dateStr);
}

function renderImportantDaysList() {
    const container = document.getElementById('important-days-list-container');
    if (!container) return;

    if (importantDaysList.length === 0) {
        const emptyMsg = currentImportantDayFilter === 'team'
            ? 'No team events yet.<br>Share an event with your team!'
            : 'No events yet.<br>Tap + to add your first event!';
        container.innerHTML = '<div class="goals-empty"><i class="bi bi-calendar-star" style="font-size:2.5rem;opacity:0.4;"></i><p style="margin-top:8px;">' + emptyMsg + '</p></div>';
        return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    container.innerHTML = importantDaysList.map((day, index) => {
        const dateObj = new Date(day.date + 'T00:00:00');
        const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const dayNum = dateObj.getDate();
        const animationDelay = (index * 0.06) + 's';

        // Use emoji and color from day object (new format) or fallback to category (old format)
        let emoji = '🎉'; // default
        let color = '#ec4899'; // default
        
        if (day.emoji && day.color) {
            // New format - use emoji and color directly
            emoji = day.emoji;
            color = day.color;
        } else if (day.category && EVENT_CATEGORIES[day.category]) {
            // Old format - use category emoji and color
            emoji = EVENT_CATEGORIES[day.category].emoji;
            color = EVENT_CATEGORIES[day.category].color;
        }

        const diffTime = dateObj.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let countdown = '';
        if (diffDays === 0) countdown = '<span class="event-countdown event-countdown-today">🔔 Today!</span>';
        else if (diffDays === 1) countdown = '<span class="event-countdown event-countdown-soon">Tomorrow</span>';
        else if (diffDays > 1 && diffDays <= 7) countdown = '<span class="event-countdown event-countdown-soon">' + diffDays + ' days away</span>';
        else if (diffDays > 7) countdown = '<span class="event-countdown">' + diffDays + ' days away</span>';
        else countdown = '<span class="event-countdown event-countdown-past">' + Math.abs(diffDays) + ' days ago</span>';

        // Time display
        let timeDisplay = '';
        if (day.time) {
            timeDisplay = '<span class="event-card-time"><i class="bi bi-clock"></i> ' + formatTime(day.time) + '</span>';
        }

        // Reminder badge
        let reminderBadge = '';
        if (day.reminderBefore && day.reminderBefore !== 'none') {
            const reminderLabels = {
                'at_time': 'At event time',
                '15min': '15 min before',
                '30min': '30 min before',
                '1hour': '1 hour before',
                '1day': '1 day before',
                '1week': '1 week before'
            };
            reminderBadge = '<span class="event-reminder-badge"><i class="bi bi-bell-fill"></i> ' + (reminderLabels[day.reminderBefore] || day.reminderBefore) + '</span>';
        }

        let teamBadge = '';
        if (day.type === 'team' && day.userName) {
            teamBadge = '<div class="event-card-author"><i class="bi bi-person-fill"></i> ' + escapeHtml(day.userName) + '</div>';
        }

        const dayData = JSON.stringify(day).replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return '<div class="event-card" style="animation:slideUpFade 0.4s ease forwards;animation-delay:' + animationDelay + ';opacity:0;">' +
            '<div class="event-card-icon-area">' +
            '<div class="event-card-emoji">' + emoji + '</div>' +
            '<div class="event-card-date">' +
            '<span class="event-card-month">' + monthStr + '</span>' +
            '<span class="event-card-day">' + dayNum + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="event-card-body">' +
            '<div class="event-card-header">' +
            '<div class="event-card-title" style="color:' + color + '; font-weight: 700; background: ' + color + '15; padding: 4px 8px; border-radius: 6px; display: inline-block;">' + escapeHtml(day.title) + '</div>' +
            '<div class="event-card-actions">' +
            '<button class="event-action-btn" onclick="editImportantDay(\'' + day.id + '\')" title="Edit"><i class="bi bi-pencil"></i></button>' +
            '<button class="event-action-btn event-action-delete" onclick="deleteImportantDay(\'' + day.id + '\')" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div>' +
            '</div>' +
            (timeDisplay ? '<div class="event-card-time-row">' + timeDisplay + '</div>' : '') +
            (day.notes ? '<div class="event-card-notes">' + escapeHtml(day.notes) + '</div>' : '') +
            '<div class="event-card-footer">' +
            countdown +
            reminderBadge +
            teamBadge +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');
}

function editImportantDay(dayId) {
    const day = importantDaysList.find(d => d.id === dayId);
    if (day) {
        showImportantDayForm(day);
    }
}

async function deleteImportantDay(dayId) {
    if (!confirm('Delete this event?')) return;
    
    // Find the day to check if it's a team day
    const day = allImportantDays.find(d => d.id === dayId);
    const isTeamDay = day && day.type === 'team';
    
    try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/important-days/delete', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ dayId })
        });
        if (res.ok) {
            showToast('Event deleted!', '🗑️');
            
            // Emit socket event for team important days
            if (isTeamDay && socket && socket.connected) {
                console.log('📡 Emitting important day deletion to team');
                socket.emit('important_day_updated', {
                    action: 'deleted',
                    orgId: localStorage.getItem('psyc_orgId')
                });
            }
            
            loadImportantDays();
            // Refresh calendar markers
            await fetchImportantDaysForCalendar();
            if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
        } else {
            showToast('Failed to delete event', '⚠️');
        }
    } catch (err) {
        console.error('Delete important day error:', err);
        showToast('Error deleting event', '⚠️');
    }
}

async function saveImportantDay() {
    const title = document.getElementById('important-day-title').value.trim();
    const date = document.getElementById('important-day-date').value;
    const time = document.getElementById('important-day-time')?.value || null;
    const notes = document.getElementById('important-day-notes').value.trim();
    const reminderSelect = document.getElementById('important-day-reminder');
    const reminderBefore = reminderSelect ? reminderSelect.value : null;

    if (!title) { showToast('Please enter an event name', '⚠️'); return; }
    if (!date) { showToast('Please select a date', '⚠️'); return; }

    try {
        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId') || '';
        const payload = { 
            title, 
            date, 
            time, 
            notes, 
            orgId, 
            type: currentImportantDayType, 
            emoji: selectedEventEmoji,
            color: selectedEventColor,
            reminderBefore 
        };

        console.log('💾 Saving important day with emoji:', selectedEventEmoji, 'color:', selectedEventColor);
        console.log('📤 Full payload:', payload);

        let url = '/api/important-days/create';
        if (editingImportantDayId) {
            url = '/api/important-days/update';
            payload.dayId = editingImportantDayId;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const result = await res.json();
            console.log('✅ Server response:', result);
            showToast(editingImportantDayId ? 'Event updated!' : 'Event added!', '⭐');
            
            // Emit socket event for team important days to notify other team members
            if (currentImportantDayType === 'team' && socket && socket.connected) {
                console.log('📡 Emitting important day update to team');
                socket.emit('important_day_updated', {
                    action: editingImportantDayId ? 'updated' : 'created',
                    orgId: localStorage.getItem('psyc_orgId')
                });
            }
            
            editingImportantDayId = null;
            hideImportantDayForm();
            
            // Refresh both lists to ensure new data is loaded
            await loadImportantDays();
            await fetchImportantDaysForCalendar();
            if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
        } else {
            showToast('Failed to save event', '⚠️');
        }
    } catch (err) {
        console.error('Error saving event:', err);
        showToast('Error saving event', '⚠️');
    }
}

function renderQuickMoodGrid() {
    const container = document.getElementById('quick-mood-grid');
    if (!container) return;

    container.innerHTML = DEFAULT_MOODS.map((m, index) => {
        return `
        <div class="quick-mood-btn" onclick="selectQuickMood(${index})">
            <div class="quick-mood-face" style="background: ${m.color};">
                <span class="mood-emoji">${m.emoji}</span>
            </div>
            <span class="quick-mood-label">${m.label}</span>
        </div>`;
    }).join('');
}

function updateQuickDateTime() {
    const now = selectedPastDate ? new Date(selectedPastDate) : new Date();
    const dateDisplay = document.getElementById('quick-date-display');
    const timeDisplay = document.getElementById('quick-time-display');

    if (dateDisplay) {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }

    if (timeDisplay) {
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        timeDisplay.textContent = now.toLocaleTimeString('en-US', options);
    }
}

async function selectQuickMood(moodIndex) {
    console.log('=== selectQuickMood called ===');
    console.log('moodIndex:', moodIndex);

    const selectedMood = DEFAULT_MOODS[moodIndex];
    console.log('selectedMood:', selectedMood);

    // Store the selected mood data
    pendingMood = {
        emoji: selectedMood.emoji,
        label: selectedMood.label,
        color: selectedMood.color
    };
    console.log('pendingMood set:', pendingMood);

    // Close quick modal
    console.log('Closing quick modal...');
    closeQuickMoodModal();

    // Open full modal after a short delay
    setTimeout(() => {
        console.log('Opening mood modal...');
        openMoodModal(selectedPastDate);

        // Update selected mood display
        const moodDisplay = document.getElementById('selected-mood-display');
        if (moodDisplay) {
            moodDisplay.innerHTML = `
                <span class="selected-mood-emoji">${selectedMood.emoji}</span>
                <span class="selected-mood-label">${selectedMood.label}</span>
            `;
            console.log('Updated mood display');
        } else {
            console.error('selected-mood-display not found!');
        }
    }, 350);
}

// ─── Connect to Socket.io ───────────────────────────────────────
async function connectSocket(user) {
    const token = await user.getIdToken();
    const orgId = localStorage.getItem('psyc_orgId');

    socket = io(SERVER_URL, {
        auth: { token, orgId },
    });

    socket.on('connect', () => {
        console.log('🟢 Connected to server');
        updateConnectionStatus(true);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Disconnected from server');
        updateConnectionStatus(false);
    });

    socket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        updateConnectionStatus(false);
    });

    // Initial state
    socket.on('initial_state', (data) => {
        console.log('📥 Received initial_state:', data.members.length, 'members');
        data.members.forEach(m => {
            console.log(`  - ${m.displayName || m.email}: photoURL=${m.photoURL ? 'YES' : 'NO'}`);
        });
        membersMap.clear();
        data.members.forEach(member => membersMap.set(member.uid, member));
        renderTeamGrid();
    });

    // Someone came online
    socket.on('user_online', (data) => {
        const existing = membersMap.get(data.uid) || {};
        membersMap.set(data.uid, { ...existing, ...data, isOnline: true });
        renderTeamGrid();
        showToast(`${data.displayName || data.email} is now online`, '🟢');
    });

    // Someone went offline
    socket.on('user_offline', (data) => {
        const member = membersMap.get(data.uid);
        if (member) {
            member.isOnline = false;
            membersMap.set(data.uid, member);
            renderTeamGrid();
        }
    });

    // Real-time organizational feed entry
    socket.on('new_feed_entry', async (data) => {
        const moodObj = getMoodByKey(data.mood);

        // Add to the ORGANIZATIONAL feed list
        addEntry({
            id: data.id,
            uid: data.uid,
            name: data.name,
            mood: data.mood,
            moodEmoji: moodObj?.emoji || '🎭',
            moodLabel: moodObj?.label || data.mood,
            moodColor: moodObj?.color || '#fff',
            activity: data.activity || '',
            emotions: data.emotions || [],
            note: data.note || '',
            timestamp: data.timestamp || Date.now(),
        });

        // Refresh mood count summary
        await updateMoodCountStats();

        // Also update the local moodEntries for calendar if it belongs to the current user
        if (data.uid === currentUser.uid) {
            await renderCalendarGrid();
            const token = await user.getIdToken();
            const res = await fetch('/api/user/calendar-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resData = await res.json();
            if (resData.logs) {
                renderMoodCountSummary(resData.logs);
            }
        }

        if (data.uid !== currentUser.uid) {
            showToast(`${data.name} just logged: ${moodObj?.label || data.mood}`, moodObj?.emoji || '🎭');
        }

        // Live update for Team Stats modal if open
        if (typeof loadTeamStats === 'function') {
            const statsModal = document.getElementById('team-stats-modal');
            if (statsModal && statsModal.classList.contains('open')) {
                const rangeSelect = document.getElementById('stats-range-select');
                loadTeamStats(rangeSelect ? rangeSelect.value : '30');
            }
        }
    });

    // ─── Real-time Group Notifications ──────────────────────────
    socket.on('new_group_notification', (data) => {
        console.log('🔔 Received live notification:', data);

        // Check if it's an important day notification
        if (data.type === 'important_day' && data.dayData) {
            console.log('📅 Received team important day notification:', data.dayData);
            // Show popup for team important day
            showImportantDayNotification([data.dayData]);
            return;
        }

        // Add to the beginning of the list
        notificationLogs.unshift(data);

        // Keep only the last 50
        if (notificationLogs.length > 50) {
            notificationLogs.pop();
        }

        // Re-render
        renderNotificationLogs();

        // Show a small toast if it's from someone else
        if (data.userId !== currentUser?.uid) {
            showToast(`${data.userName}: ${data.title}`, '🔔');
        }
    });

    // Real-time important day updates
    socket.on('important_day_updated', async (data) => {
        console.log('📅 Important day updated:', data);
        // Reload important days list
        await loadImportantDays();
        await fetchImportantDaysForCalendar();
        if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    });

    // Real-time status update for Team Grid
    socket.on('status_update', (data) => {
        const member = membersMap.get(data.uid);
        if (member) {
            member.currentMood = data.mood;
            member.currentActivity = data.activity;
            member.lastUpdated = data.timestamp;
            membersMap.set(data.uid, member);
            renderTeamGrid();
            animateCard(data.uid);
        }
    });

    // Real-time team goal updates
    socket.on('new_team_goal', (data) => {
        console.log('🎯 New team goal received:', data);

        // Add to goals list if we're viewing team goals
        if (currentGoalsFilter === 'team') {
            goalsList.unshift(data); // Add to beginning of list
            renderGoalsList();
            showToast(`New team goal: ${data.title}`, '🎯');
        }
    });

    socket.on('error_msg', (data) => {
        showToast(data.message, '⚠️');
    });
}

// ─── Load Org Info ──────────────────────────────────────────────
async function loadOrgInfo(user) {
    try {
        const token = await user.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');
        if (!orgId) {
            window.location.href = '/';
            return;
        }

        const res = await fetch('/api/org/members?orgId=' + encodeURIComponent(orgId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.org) {
            const orgNameEl = document.getElementById('org-name');
            if (orgNameEl) orgNameEl.textContent = data.org.name;
            // Cache org name so it persists on refresh
            localStorage.setItem('psyc_orgName', data.org.name);

            if (data.members && data.members.length > 0) {
                data.members.forEach(member => {
                    const existing = membersMap.get(member.uid);
                    if (!existing) {
                        membersMap.set(member.uid, member);
                    } else {
                        membersMap.set(member.uid, { ...member, ...existing });
                    }
                });
                renderTeamGrid();
            }

            // Admin panel
            const userRecord = data.members.find(m => m.uid === user.uid);
            if (userRecord && (userRecord.role === 'admin' || userRecord.role === 'owner')) {
                const adminPanelBtn = document.getElementById('admin-panel-btn');
                if (adminPanelBtn) {
                    adminPanelBtn.classList.remove('hidden');
                }
            } else if (userRecord) {
                // Show leave organization button for non-admin members
                const leaveOrgBtn = document.getElementById('leave-org-btn');
                const leaveOrgBtnTeam = document.getElementById('leave-org-btn-team');
                if (leaveOrgBtn) {
                    leaveOrgBtn.classList.remove('hidden');
                }
                if (leaveOrgBtnTeam) {
                    leaveOrgBtnTeam.classList.remove('hidden');
                }
            }

            // Check if members can invite (for non-admin members)
            if (data.org && data.org.membersCanInvite && userRecord && userRecord.role !== 'admin' && userRecord.role !== 'owner') {
                const memberInviteSection = document.getElementById('member-invite-section');
                const memberInviteCode = document.getElementById('member-invite-code');

                if (memberInviteSection && memberInviteCode && data.org.inviteCode) {
                    memberInviteSection.classList.remove('hidden');
                    memberInviteCode.textContent = data.org.inviteCode;  // Use org inviteCode
                }
            }
        }
    } catch (err) {
        console.error('Load org error:', err);
    }
}

async function loadOrgFeed(user, reset = false) {
    try {
        if (reset) {
            moodEntries = [];
            lastFeedTimestamp = null;
        }

        const token = await user.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');
        const month = viewMonth.getMonth();
        const year = viewMonth.getFullYear();

        const res = await fetch(`/api/org/feed?orgId=${encodeURIComponent(orgId || '')}&month=${month}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.logs) {
            const rawLogs = data.logs.map(log => {
                const moodObj = getMoodByKey(log.mood);
                return {
                    id: log.id,
                    uid: log.uid,
                    name: log.name,
                    mood: log.mood,
                    moodEmoji: moodObj?.emoji || '🎭',
                    moodLabel: moodObj?.label || log.mood,
                    moodColor: moodObj?.color || '#fff',
                    activity: log.activity || '',
                    emotions: log.emotions || [],
                    note: log.note || '',
                    timestamp: new Date(log.timestamp).getTime(),
                };
            });

            // Prevent duplicates (especially relevant after socket updates)
            const existingIds = new Set(moodEntries.map(e => e.id));
            const uniqueNew = rawLogs.filter(log => !existingIds.has(log.id));
            moodEntries = [...moodEntries, ...uniqueNew];

            // Sort by timestamp descending
            moodEntries.sort((a, b) => b.timestamp - a.timestamp);

            // Update pagination state
            hasMoreFeed = data.hasMore;
            if (moodEntries.length > 0) {
                lastFeedTimestamp = moodEntries[moodEntries.length - 1].timestamp;
            }

            renderEntries();

            // Set default view to TODAY if first load
            if (!reset && !selectedFeedDay) {
                selectedFeedDay = new Date();
                updateDayNavigator();
                renderEntries();
            }

            // Update month navigation buttons
            updateMonthNavButtons();

            // Also fetch important days so they can be merged into the feed
            await fetchImportantDaysForCalendar();
            renderEntries();
        }
    } catch (err) {
        console.error('Failed to load org feed', err);
    }
}




// ─── Render Mood Picker (in modal) ──────────────────────────────
async function renderMoodGrid() {
    const container = document.getElementById('mood-grid');
    if (!container) return;

    const moods = await getCustomMoods();

    container.innerHTML = moods.map((m, index) => {
        const emojiHtml = m.emoji.length > 5 || m.emoji.includes('.png')
            ? `<img src="/assets/openmoji-618x618-color/${m.emoji}.png" alt="${m.label}" class="emoji-img">`
            : m.emoji;

        return `
        <button class="mood-btn" data-mood="${index}" style="--mood-color: ${m.color}" onclick="selectMood(${index}, false)">
          <span class="mood-emoji">${emojiHtml}</span>
          <span class="mood-label">${m.label}</span>
        </button>`;
    }).join('');
}

// ─── Render Emotion Grid (custom emotions) ──────────────────────
const CUSTOM_EMOTIONS_KEY = 'psyc_custom_emotions';
let selectedEmotions = new Set();

async function getCustomEmotions() {
    const stored = localStorage.getItem(CUSTOM_EMOTIONS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse custom emotions:', e);
        }
    }
    // Default emotions
    return [
        { emoji: "😊", label: "happy" },
        { emoji: "😢", label: "sad" },
        { emoji: "😠", label: "angry" },
        { emoji: "😰", label: "anxious" }
    ];
}

function saveCustomEmotions(emotions) {
    localStorage.setItem(CUSTOM_EMOTIONS_KEY, JSON.stringify(emotions));
}

async function renderEmotionGrid() {
    const container = document.getElementById('emotion-grid');
    if (!container) return;

    const emotions = await getCustomEmotions();

    container.innerHTML = emotions.map((e, index) => {
        const emojiHtml = e.emoji.length > 5 || e.emoji.includes('.png')
            ? `<img src="/assets/openmoji-618x618-color/${e.emoji}.png" alt="${e.label}" class="emoji-img">`
            : e.emoji;

        return `
        <button class="activity-btn" data-emotion="${index}" onclick="toggleEmotion(${index})">
          <div class="activity-emoji">${emojiHtml}</div>
          <span class="activity-label">${e.label}</span>
        </button>`;
    }).join('');
}

function toggleEmotion(emotionIndex) {
    const btn = document.querySelector(`[data-emotion="${emotionIndex}"]`);
    if (selectedEmotions.has(emotionIndex)) {
        selectedEmotions.delete(emotionIndex);
        btn?.classList.remove('active');
    } else {
        selectedEmotions.add(emotionIndex);
        btn?.classList.add('active');
    }
}

// ─── Open Customizer for specific section ───────────────────────
window.currentCustomizeType = null;

function openCustomizer(type) {
    window.currentCustomizeType = type;
    const modal = document.getElementById('customize-modal');
    const title = document.getElementById('customize-title');
    const emotionsSection = document.getElementById('customize-emotions-section');
    const activitiesSection = document.getElementById('customize-activities-section');

    if (!modal) return;

    // Hide both sections first
    if (emotionsSection) emotionsSection.style.display = 'none';
    if (activitiesSection) activitiesSection.style.display = 'none';

    // Show the relevant section
    if (type === 'emotions') {
        if (title) title.textContent = 'Customize Emotions';
        if (emotionsSection) emotionsSection.style.display = 'block';
        renderCustomizeEmotions();
    } else if (type === 'activities') {
        if (title) title.textContent = 'Customize Activities';
        if (activitiesSection) activitiesSection.style.display = 'block';
        renderCustomizeActivities();
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

async function renderCustomizeEmotions() {
    const grid = document.getElementById('customize-emotion-grid');
    if (!grid) return;

    const emotions = await getCustomEmotions();
    console.log('renderCustomizeEmotions - emotions:', emotions);

    grid.innerHTML = emotions.map((emotion, index) => {
        const emojiHtml = emotion.emoji.includes('.png') || emotion.emoji.length > 5
            ? `<img src="/assets/openmoji-618x618-color/${emotion.emoji}.png" alt="${emotion.label}" class="emoji-img">`
            : emotion.emoji;

        return `
        <div class="customize-activity-item" onclick="editEmotion(${index})">
            <span class="activity-emoji">${emojiHtml}</span>
            <span class="activity-label">${emotion.label}</span>
        </div>`;
    }).join('');
}

async function renderCustomizeActivities() {
    const grid = document.getElementById('customize-activity-grid');
    if (!grid) return;

    const activities = await window.getCustomActivities();

    grid.innerHTML = activities.map((activity, index) => {
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

function editEmotion(index) {
    window.editingType = 'emotion';
    window.editingIndex = index;
    getCustomEmotions().then(emotions => {
        window.editingItem = { ...emotions[index] };
        openEditItemModal();
    });
}

function addNewEmotionItem() {
    window.editingType = 'emotion';
    window.editingIndex = -1;
    window.editingItem = { emoji: '😊', label: '' };
    console.log('addNewEmotionItem called:', window.editingItem);
    console.log('editingIndex:', window.editingIndex);
    openEditItemModal();
}

function addNewActivityItem() {
    window.editingType = 'activity';
    window.editingIndex = -1;
    window.editingItem = { emoji: '🎯', label: '' };
    console.log('addNewActivityItem called:', window.editingItem);
    console.log('editingIndex:', window.editingIndex);
    openEditItemModal();
}

async function resetEmotions() {
    if (confirm('Reset emotions to default? This cannot be undone.')) {
        const defaultEmotions = [
            { emoji: "😊", label: "happy" },
            { emoji: "😢", label: "sad" },
            { emoji: "😠", label: "angry" },
            { emoji: "😰", label: "anxious" }
        ];
        saveCustomEmotions(defaultEmotions);
        renderCustomizeEmotions();
        showToast('Emotions reset to default', '🔄');
    }
}

// Export functions to window for onclick handlers
window.openCustomizer = openCustomizer;
window.editEmotion = editEmotion;
window.addNewEmotionItem = addNewEmotionItem;
window.addNewActivityItem = addNewActivityItem;
window.resetEmotions = resetEmotions;
window.toggleEmotion = toggleEmotion;
window.getCustomEmotions = getCustomEmotions;
window.saveCustomEmotions = saveCustomEmotions;
window.renderCustomizeEmotions = renderCustomizeEmotions;
window.renderCustomizeActivities = renderCustomizeActivities;

// ─── Render Activity Picker ─────────────────────────────────────
async function renderActivityGrid() {
    const container = document.getElementById('activity-grid');
    if (!container) return;

    const activities = await window.getCustomActivities();

    container.innerHTML = activities.map((a, index) => {
        const emojiHtml = a.emoji.length > 5 || a.emoji.includes('.png')
            ? `<img src="/assets/openmoji-618x618-color/${a.emoji}.png" alt="${a.label}" class="emoji-img">`
            : a.emoji;

        return `
        <button class="activity-btn" data-activity="${index}" onclick="toggleActivity(${index})">
          <span class="activity-emoji">${emojiHtml}</span>
          <span class="activity-label">${a.label}</span>
        </button>`;
    }).join('');
}

// ─── Toggle Activity Selection ──────────────────────────────────
function toggleActivity(activityIndex) {
    const btn = document.querySelector(`[data-activity="${activityIndex}"]`);
    if (selectedActivities.has(activityIndex)) {
        selectedActivities.delete(activityIndex);
        btn?.classList.remove('active');
    } else {
        selectedActivities.add(activityIndex);
        btn?.classList.add('active');
    }
}

// ─── Select Mood (no auto-send) ─────────────────────────────────
async function selectMood(moodIndex, fromSaveButton = false) {
    const moods = await getCustomMoods();
    const moodObj = moods[moodIndex];
    if (!moodObj) return;

    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`[data-mood="${moodIndex}"]`);
    if (btn) btn.classList.add('active');

    pendingMood = moodObj;

    // If called from the save button flow, the actual emit is handled there.
    if (fromSaveButton) {
        sendMoodEntry();
    }
}

async function sendMoodEntry() {
    console.log('=== sendMoodEntry START ===');
    console.log('pendingMood:', pendingMood);
    console.log('socket connected:', socket?.connected);

    if (pendingMood === null || !socket || !socket.connected) {
        console.error('Cannot send: pendingMood is null or socket not connected');
        return;
    }

    // pendingMood is now an object with emoji, label, color from quick selector
    const selectedMood = typeof pendingMood === 'object' ? pendingMood : null;

    if (!selectedMood) {
        showToast('Please select a mood', '⚠️');
        return;
    }

    console.log('selectedMood:', selectedMood);

    // Ensure emoji exists, fallback to a default based on mood
    if (!selectedMood.emoji) {
        console.warn('Mood emoji is undefined, using fallback');
        const moodKey = selectedMood.label?.toLowerCase() || '';
        const fallbackEmojis = {
            'rad': '😄',
            'good': '🙂',
            'meh': '😐',
            'bad': '😔',
            'awful': '😢'
        };
        selectedMood.emoji = fallbackEmojis[moodKey] || '😐';
    }

    console.log('Getting custom activities and emotions...');
    const activities = await window.getCustomActivities();
    const emotions = await getCustomEmotions();
    console.log('activities:', activities);
    console.log('emotions:', emotions);

    const activitiesList = Array.from(selectedActivities);
    const emotionsList = Array.from(selectedEmotions);
    const note = document.getElementById('mood-note')?.value.trim() || '';

    const activityStr = activitiesList.map(index => {
        const a = activities[index];
        return a ? a.label : '';
    }).filter(Boolean).join(', ');

    const emotionStr = emotionsList.map(index => {
        const e = emotions[index];
        return e ? e.label : '';
    }).filter(Boolean).join(', ');

    // Create a mood key from the label for backward compatibility
    const moodKey = selectedMood.label.toLowerCase().replace(/\s+/g, '_');

    // Check if we're editing an existing entry
    const isEditing = window.editingEntryId;

    if (isEditing) {
        // Update existing entry
        try {
            const token = await currentUser.getIdToken();
            const orgId = localStorage.getItem('psyc_orgId');

            const res = await fetch('/api/mood/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entryId: window.editingEntryId,
                    orgId: orgId,
                    mood: moodKey,
                    moodLabel: selectedMood.label,
                    moodEmoji: selectedMood.emoji,
                    moodColor: selectedMood.color,
                    activity: activityStr,
                    activities: activitiesList.map(index => {
                        const a = activities[index];
                        return a ? a.label.toLowerCase().replace(/\s+/g, '_') : '';
                    }).filter(Boolean),
                    emotions: emotionsList.map(index => {
                        const e = emotions[index];
                        return e ? e.label.toLowerCase().replace(/\s+/g, '_') : '';
                    }).filter(Boolean),
                    note: note,
                    timestamp: selectedPastDate
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update entry');
            }

            // Update local entry
            const entryIndex = moodEntries.findIndex(e => e.id === window.editingEntryId);
            if (entryIndex !== -1) {
                moodEntries[entryIndex] = {
                    ...moodEntries[entryIndex],
                    mood: moodKey,
                    moodLabel: selectedMood.label,
                    moodEmoji: selectedMood.emoji,
                    moodColor: selectedMood.color,
                    activity: activityStr,
                    activities: activitiesList.map(index => {
                        const a = activities[index];
                        return a ? a.label.toLowerCase().replace(/\s+/g, '_') : '';
                    }).filter(Boolean),
                    emotions: emotionsList.map(index => {
                        const e = emotions[index];
                        return e ? e.label.toLowerCase().replace(/\s+/g, '_') : '';
                    }).filter(Boolean),
                    note: note,
                    timestamp: selectedPastDate
                };
            }

            // Update personal entries too
            const personalIndex = personalEntries.findIndex(e => e.id === window.editingEntryId);
            if (personalIndex !== -1) {
                personalEntries[personalIndex] = {
                    ...personalEntries[personalIndex],
                    mood: moodKey,
                    moodLabel: selectedMood.label,
                    moodEmoji: selectedMood.emoji,
                    moodColor: selectedMood.color,
                    activity: activityStr,
                    activities: activitiesList.map(index => {
                        const a = activities[index];
                        return a ? a.label.toLowerCase().replace(/\s+/g, '_') : '';
                    }).filter(Boolean),
                    emotions: emotionsList.map(index => {
                        const e = emotions[index];
                        return e ? e.label.toLowerCase().replace(/\s+/g, '_') : '';
                    }).filter(Boolean),
                    note: note,
                    timestamp: selectedPastDate
                };
            }

            // Re-render
            renderEntries();

            // Update month navigation buttons
            updateMonthNavButtons();

            // Update calendar if active
            if (document.getElementById('tab-calendar').classList.contains('active')) {
                renderCalendarGrid();
            }

            // Update stats if active
            if (document.getElementById('tab-stats').classList.contains('active')) {
                loadStatsCharts();
            }

            showToast('Entry updated successfully', '✅');

            // Clear editing state
            window.editingEntryId = null;
        } catch (err) {
            console.error('Update error:', err);
            showToast('Failed to update entry', '❌');
            return;
        }
    } else {
        // Create new entry via socket
        socket.emit('mood_update', {
            mood: moodKey,
            moodLabel: selectedMood.label,
            moodEmoji: selectedMood.emoji,
            moodColor: selectedMood.color,
            activity: activityStr,
            activities: activitiesList.map(index => {
                const a = activities[index];
                return a ? a.label.toLowerCase().replace(/\s+/g, '_') : '';
            }).filter(Boolean),
            emotions: emotionsList.map(index => {
                const e = emotions[index];
                return e ? e.label.toLowerCase().replace(/\s+/g, '_') : '';
            }).filter(Boolean),
            note: note,
            timestamp: selectedPastDate,
        });

        // Immediately refresh calendar and stats after submitting
        // Wait a bit for the server to process and broadcast
        setTimeout(async () => {
            // Refresh calendar data
            await renderCalendarGrid();

            // Refresh mood count summary
            const token = await auth.currentUser.getIdToken();
            const res = await fetch('/api/user/calendar-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.logs) {
                renderMoodCountSummary(data.logs);
            }

            // Refresh stats if on stats tab
            if (document.getElementById('tab-stats').classList.contains('active')) {
                loadStatsCharts();
            }
        }, 500);
    }

    // Reset and close after send
    selectedActivities.clear();
    selectedEmotions.clear();
    pendingMood = null;

    if (document.getElementById('mood-note')) {
        document.getElementById('mood-note').value = '';
    }

    setTimeout(() => closeMoodModal(), 400);
}

// ─── Feed Filtering ─────────────────────────────────────────────
function setFeedFilter(filter) {
    feedFilter = filter;

    // Update UI
    const pill = document.getElementById('feed-filter-pill');
    if (pill) {
        pill.classList.remove('filter-all', 'filter-me');
        pill.classList.add('filter-' + filter);
    }

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('filter-' + filter);
    if (activeBtn) activeBtn.classList.add('active');

    // Keep current selected day or reset to today when switching views
    if (!selectedFeedDay) selectedFeedDay = new Date();
    updateDayNavigator();

    renderEntries();
}



// ─── Entry Card System (Daylio-style) ───────────────────────────

function addEntry(entry) {
    // Add to Organizational Feed
    moodEntries.unshift(entry);
    // Sort latest first
    moodEntries.sort((a, b) => b.timestamp - a.timestamp);
    renderEntries();

    // Update month navigation buttons
    updateMonthNavButtons();

    // If it's my entry, also add to Personal History for Calendar
    if (entry.uid === currentUser?.uid) {
        personalEntries.unshift(entry);
        // Sort personal entries to ensure calendar finds the latest per day
        personalEntries.sort((a, b) => b.timestamp - a.timestamp);

        // Update dashboard stats and calendar
        renderCalendarGrid();
    }
}

function renderImportantDaysBanner() {
    const banner = document.getElementById('important-days-banner');
    if (!banner) return;

    // Get today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Filter important days for today
    const todayImportantDays = allImportantDays.filter(day => day.date === today);
    
    // If no important days today, hide banner
    if (todayImportantDays.length === 0) {
        banner.style.display = 'none';
        return;
    }
    
    // Show compact card
    banner.style.display = 'block';
    
    // Get first important day for preview
    const firstDay = todayImportantDays[0];
    const color = '#ff9500'; // Always orange for the banner
    const count = todayImportantDays.length;
    
    banner.innerHTML = `
        <div onclick="openTodaysEventsModal()" style="
            background: ${color}40;
            cursor: pointer;
            position: relative;
            margin-bottom: 16px;
            border-radius: 16px;
            border: 2px solid ${color}60;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        ">
            <div style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                flex-shrink: 0;
                color: white;
            ">
                <i class="bi bi-star-fill"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="
                    font-size: 16px;
                    font-weight: 700;
                    color: ${color};
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                ">
                    ${count > 1 ? `${count} Important Events Today` : firstDay.title}
                </div>
                <div style="
                    font-size: 13px;
                    color: ${color}CC;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <i class="bi bi-hand-index"></i> ${count > 1 ? 'Tap to view all' : 'Tap to view details'}
                </div>
            </div>
            <i class="bi bi-chevron-right" style="color: ${color}; font-size: 20px; flex-shrink: 0;"></i>
        </div>
    `;
}

function openTodaysEventsModal() {
    const modal = document.getElementById('todays-events-modal');
    if (modal) {
        renderTodaysEventsList();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeTodaysEventsModal() {
    const modal = document.getElementById('todays-events-modal');
    if (modal) {
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');

        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
}

function renderTodaysEventsList() {
    const container = document.getElementById('todays-events-list');
    if (!container) return;

    // Get today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Filter important days for today
    const todayImportantDays = allImportantDays.filter(day => day.date === today);
    
    if (todayImportantDays.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <i class="bi bi-calendar-x" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>No important events today</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = todayImportantDays.map(day => {
        const emoji = day.emoji || '🎉';
        const color = day.color || '#ec4899';
        const time = day.time ? formatTime(day.time) : '';
        const isTeam = day.type === 'team';
        
        return `
            <div style="
                background: linear-gradient(135deg, ${color}15 0%, ${color}05 100%);
                border-left: 4px solid ${color};
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            ">
                <div style="display: flex; align-items: start; gap: 12px;">
                    <div style="font-size: 32px; min-width: 40px; text-align: center;">${emoji}</div>
                    <div style="flex: 1;">
                        <div style="
                            font-size: 18px;
                            font-weight: 700;
                            color: ${color};
                            margin-bottom: 8px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            flex-wrap: wrap;
                        ">
                            ${day.title}
                            ${isTeam ? `<span style="font-size: 12px; background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 8px; font-weight: 600;"><i class="bi bi-people-fill"></i> Team</span>` : ''}
                        </div>
                        ${day.notes ? `<div style="font-size: 14px; color: #64748b; margin-bottom: 8px; line-height: 1.5;">${day.notes}</div>` : ''}
                        ${time ? `<div style="font-size: 13px; color: #94a3b8;"><i class="bi bi-clock"></i> ${time}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderEntries() {
    const container = document.getElementById('entries-list');
    const quickMoodCard = document.getElementById('quick-mood-card');
    if (!container) return;

    // Render important days banner for today
    renderImportantDaysBanner();

    // Hide quick mood card when rendering entries
    if (quickMoodCard) quickMoodCard.style.display = 'none';

    // 1. Filter entries
    let filteredEntries = feedFilter === 'me'
        ? moodEntries.filter(entry => entry.uid === currentUser?.uid)
        : moodEntries;

    // Important days are NO LONGER mixed with entries - they're in the banner now
    // So we remove the eventEntries merging code

    // Combine and re-sort (just mood entries now)
    let combinedEntries = [...filteredEntries];
    combinedEntries.sort((a, b) => b.timestamp - a.timestamp);

    // removed: daily filtering so we show all entries for the month

    // 2. Handle empty state
    if (combinedEntries.length === 0) {
        const locale = currentLang === 'fil' ? 'fil-PH' : 'en-US';
        let msg = selectedFeedDay
            ? `${t('no_entries_for')} ${selectedFeedDay.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}`
            : `${t('no_entries_for')} ${viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;

        const primaryMoodKeys = ['rad', 'good', 'meh', 'bad', 'awful'];
        const quickMoods = primaryMoodKeys.map(key => ({ ...getMoodByKey(key), label: t(key) }));
        const quickMoodsHtml = quickMoods.map(m => `
            <div class="how-mood-wrapper" onclick="openMoodPageWithMood('${m.key}')">
                <div class="how-mood-circle" style="--mood-color: ${m.color}">
                    <span class="how-mood-emoji">${m.emoji}</span>
                </div>
                <span class="how-mood-label">${m.label.toLowerCase()}</span>
            </div>
        `).join('');

        container.innerHTML = `
        <div class="how-are-you-card">
            <div class="how-are-you-header">
                <span class="how-are-you-title">${t('how_are_you_short')}</span>
                <span class="how-are-you-subtitle">${msg}</span>
            </div>
            <div class="how-are-you-row">${quickMoodsHtml}</div>
        </div>`;
        return;
    }

    // 3. Group by day
    const groups = {};
    combinedEntries.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dayLabel = getDayLabel(date);
        if (!groups[dayLabel]) groups[dayLabel] = [];
        groups[dayLabel].push(entry);
    });

    // 4. Render
    let html = '';
    const allKnownActivities = [...ACTIVITIES, ...customActivities];

    for (const [dayLabel, entries] of Object.entries(groups)) {
        const isToday = dayLabel.startsWith('TODAY');
        const isYesterday = dayLabel.startsWith('YESTERDAY');
        const dayId = dayLabel.replace(/[^a-zA-Z0-9]/g, '-');

        html += `
        <div class="day-group-card ${!isToday ? 'collapsed' : ''}" id="day-group-${dayId}">
            <div class="day-group-header ${isToday ? 'today' : ''} ${isYesterday ? 'yesterday' : ''}">
                <div class="day-group-header-left">
                    <i class="bi bi-circle"></i>
                    ${dayLabel}
                </div>
                <button class="day-collapse-btn" onclick="toggleDayGroup('${dayId}')">
                    <i class="bi ${isToday ? 'bi-chevron-up' : 'bi-chevron-down'}"></i>
                </button>
            </div>
            <div class="day-group-content" id="day-content-${dayId}" style="display: ${isToday ? 'block' : 'none'}">
        `;

        entries.forEach(entry => {
            if (entry.type === 'event') {
                // Render Important Day Card in Feed
                const eventTimeStr = entry.time ? formatTime(entry.time) : 'All Day';
                const emoji = entry.emoji || '⭐';
                const color = entry.color || '#6366f1';
                html += `
                <div class="entry-item entry-event-item" style="border-left: 3px solid ${color};">
                    <div class="entry-timeline-icon" style="--mood-color: ${color}; background: ${color}20;">
                        <span style="font-size: 1.3rem;">${emoji}</span>
                    </div>
                    <div class="entry-details">
                        <div class="entry-headline">
                            <span class="entry-mood-name" style="--mood-color: ${color}; color: ${color}; font-weight: 800;">
                                ${escapeHtml(entry.name)}
                            </span>
                            <span class="entry-time-stamp">
                                <i class="bi bi-clock" style="font-size: 0.65rem;"></i> ${eventTimeStr}
                            </span>
                        </div>
                        ${entry.notes ? `<div class="entry-note-text" style="margin-top: 4px; font-size: 0.8rem;">${escapeHtml(entry.notes)}</div>` : ''}
                        ${entry.isTeam ? `<div class="entry-activities-list" style="margin-top: 4px;"><div class="entry-activity-item"><span class="entry-activity-emoji">👥</span><span class="entry-activity-label">Team</span></div></div>` : ''}
                    </div>
                </div>`;
                return;
            }

            if (entry.type === 'goal-reminder') {
                // Render Goal Reminder Card in Feed
                html += `
                <div class="entry-item entry-goal-item" style="border-left: 3px solid #8b5cf6;">
                    <div class="entry-timeline-icon" style="--mood-color: #8b5cf6; background: #8b5cf620;">
                        <span style="font-size: 1.3rem;">🎯</span>
                    </div>
                    <div class="entry-details">
                        <div class="entry-headline">
                            <span class="entry-mood-name" style="--mood-color: #8b5cf6; color: #8b5cf6; font-weight: 800;">
                                ${escapeHtml(entry.name)}
                            </span>
                            <span class="entry-time-stamp">
                                <i class="bi bi-clock" style="font-size: 0.65rem;"></i> ${entry.timeStr || ''}
                            </span>
                        </div>
                        ${entry.description ? `<div class="entry-note-text" style="margin-top: 4px; font-size: 0.8rem;">${escapeHtml(entry.description)}</div>` : ''}
                        <div class="entry-activities-list" style="margin-top: 4px;">
                            <div class="entry-activity-item" style="background: #8b5cf615; border-color: #8b5cf630;">
                                <span class="entry-activity-emoji"><i class="bi bi-bell-fill" style="color: #8b5cf6; font-size: 0.65rem;"></i></span>
                                <span class="entry-activity-label" style="color: #8b5cf6;">Goal Reminder</span>
                            </div>
                            ${entry.goalType === 'team' ? `<div class="entry-activity-item"><span class="entry-activity-emoji">👥</span><span class="entry-activity-label">Team</span></div>` : ''}
                        </div>
                    </div>
                </div>`;
                return;
            }

            const date = new Date(entry.timestamp);
            const locale = currentLang === 'fil' ? 'fil-PH' : 'en-US';
            const timeStr = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

            const emojiDisplay = entry.moodEmoji && (entry.moodEmoji.length > 5 || entry.moodEmoji.includes('.png'))
                ? `<img src="/assets/openmoji-618x618-color/${entry.moodEmoji}.png" alt="${entry.moodLabel}">`
                : entry.moodEmoji;

            const activityItems = entry.activity ? entry.activity.split(', ').map(label => {
                const found = allKnownActivities.find(a => a.label.toLowerCase() === label.toLowerCase());
                const emoji = found ? found.emoji : '•';
                return `<div class="entry-activity-item">
                    <span class="entry-activity-emoji">${emoji}</span>
                    <span class="entry-activity-label">${label.toLowerCase()}</span>
                </div>`;
            }).join('') : '';

            // Render emotions if available
            const emotionItems = entry.emotions && entry.emotions.length > 0 ? entry.emotions.map(emotionKey => {
                // Convert emotion key back to display format (e.g., "happy" -> "Happy")
                const label = emotionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                // Try to find emoji from custom emotions
                return `<div class="entry-emotion-item">
                    <span class="entry-emotion-label">${label}</span>
                </div>`;
            }).join('') : '';

            // Show menu button only for "Me" filter and if it's the current user's entry
            const showMenu = feedFilter === 'me' && entry.uid === currentUser?.uid;

            html += `
                <div class="entry-item">
                    <div class="entry-timeline-icon" style="--mood-color: ${entry.moodColor}">
                        ${emojiDisplay}
                    </div>
                    <div class="entry-details">
                        <div class="entry-headline">
                            <span class="entry-mood-name" style="--mood-color: ${entry.moodColor}">${entry.moodLabel}</span>
                            <span class="entry-user-name">@${entry.name || 'user'}</span>
                            <span class="entry-time-stamp">${timeStr}</span>
                        </div>
                        ${emotionItems ? `<div class="entry-emotions-list">${emotionItems}</div>` : ''}
                        <div class="entry-activities-list">
                            ${activityItems}
                        </div>
                        ${entry.note ? `<div class="entry-note-text">${escapeHtml(entry.note)}</div>` : ''}
                    </div>
                    ${showMenu ? `
                    <button class="entry-menu-btn" onclick="toggleEntryMenu(event, '${entry.id}')">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    ` : ''}
                </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    }

    container.innerHTML = html;
}

function toggleDayGroup(dayId) {
    const content = document.getElementById(`day-content-${dayId}`);
    const group = document.getElementById(`day-group-${dayId}`);
    const btn = group.querySelector('.day-collapse-btn i');

    if (!content || !btn) return;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.classList.remove('bi-chevron-down');
        btn.classList.add('bi-chevron-up');
        group.classList.remove('collapsed');
    } else {
        content.style.display = 'none';
        btn.classList.remove('bi-chevron-up');
        btn.classList.add('bi-chevron-down');
        group.classList.add('collapsed');
    }
}

function toggleEntryMenu(event, entryId) {
    event.stopPropagation();

    // Close any existing menu
    const existingMenu = document.querySelector('.entry-menu-dropdown');
    if (existingMenu) {
        existingMenu.remove();
    }

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();

    // Create menu
    const menu = document.createElement('div');
    menu.className = 'entry-menu-dropdown';
    menu.innerHTML = `
        <div class="entry-menu-item" onclick="editEntry('${entryId}')">
            <i class="bi bi-pencil"></i>
            <span>Edit</span>
        </div>
        <div class="entry-menu-item delete" onclick="deleteEntry('${entryId}')">
            <i class="bi bi-trash"></i>
            <span>Delete</span>
        </div>
    `;

    // Position menu
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;

    document.body.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

function editEntry(entryId) {
    // Close menu
    const menu = document.querySelector('.entry-menu-dropdown');
    if (menu) menu.remove();

    // Find the entry
    const entry = moodEntries.find(e => e.id === entryId);
    if (!entry) {
        showToast('Entry not found', '❌');
        return;
    }

    // Set the timestamp for editing
    selectedPastDate = entry.timestamp;

    // Set the pending mood
    pendingMood = {
        emoji: entry.moodEmoji,
        label: entry.moodLabel,
        color: entry.moodColor
    };

    // Parse and select activities
    selectedActivities.clear();
    if (entry.activity) {
        const activityLabels = entry.activity.split(', ');
        getCustomActivities().then(activities => {
            activityLabels.forEach(label => {
                const index = activities.findIndex(a => a.label.toLowerCase() === label.toLowerCase());
                if (index !== -1) {
                    selectedActivities.add(index);
                }
            });
            // Update UI
            renderActivityGrid();
        });
    }

    // Parse and select emotions
    selectedEmotions.clear();
    if (entry.emotions && Array.isArray(entry.emotions)) {
        getCustomEmotions().then(emotions => {
            entry.emotions.forEach(emotionKey => {
                const index = emotions.findIndex(e => e.label.toLowerCase().replace(/\s+/g, '_') === emotionKey);
                if (index !== -1) {
                    selectedEmotions.add(index);
                }
            });
            // Update UI
            renderEmotionGrid();
        });
    }

    // Store the entry ID for updating
    window.editingEntryId = entryId;

    // Open the mood modal
    openMoodModal();

    // Set the note
    setTimeout(() => {
        const noteField = document.getElementById('mood-note');
        if (noteField && entry.note) {
            noteField.value = entry.note;
        }
    }, 100);
}

async function deleteEntry(entryId) {
    // Close menu
    const menu = document.querySelector('.entry-menu-dropdown');
    if (menu) menu.remove();

    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }

    try {
        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');

        const res = await fetch('/api/mood/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entryId: entryId,
                orgId: orgId
            })
        });

        if (!res.ok) {
            throw new Error('Failed to delete entry');
        }

        // Remove from local arrays
        moodEntries = moodEntries.filter(e => e.id !== entryId);
        personalEntries = personalEntries.filter(e => e.id !== entryId);

        // Re-render
        renderEntries();

        // Update month navigation buttons
        updateMonthNavButtons();

        // Update calendar if active
        if (document.getElementById('tab-calendar').classList.contains('active')) {
            renderCalendarGrid();
        }

        // Update stats if active
        if (document.getElementById('tab-stats').classList.contains('active')) {
            loadStatsCharts();
        }

        showToast('Entry deleted successfully', '✅');
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Failed to delete entry', '❌');
    }
}

function openEntryMenu(entryId) {
    console.log('Open menu for entry:', entryId);
    // Future: implement edit/delete menu
}

function getDayLabel(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

    const locale = currentLang === 'fil' ? 'fil-PH' : 'en-US';

    if (isSameDay(date, today)) {
        return `${t('today')}, ${date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }).toUpperCase()}`;
    }
    if (isSameDay(date, yesterday)) {
        return `${t('yesterday')}, ${date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }).toUpperCase()}`;
    }

    return date.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).toUpperCase();
}

// ─── Render Team Grid ───────────────────────────────────────────
function renderTeamGrid() {
    const container = document.getElementById('team-grid');
    if (!container) return;

    const members = Array.from(membersMap.values());

    members.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
        return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
    });

    if (members.length === 0) {
        container.innerHTML = '<div class="empty-msg"><span>👥</span><p>No team members yet.</p></div>';
        return;
    }

    container.innerHTML = members.map(member => {
        const moodObj = getMoodByKey(member.currentMood);
        const isMe = currentUser && member.uid === currentUser.uid;
        const initial = (member.displayName || member.email || '?').charAt(0).toUpperCase();

        // Handle emoji display for mood
        let moodEmojiDisplay = '';
        if (moodObj) {
            moodEmojiDisplay = moodObj.emoji && (moodObj.emoji.length > 5 || moodObj.emoji.includes('.png'))
                ? `<img src="/assets/openmoji-618x618-color/${moodObj.emoji}.png" alt="${moodObj.label}" class="emoji-img" style="width: 24px; height: 24px; object-fit: contain;">`
                : moodObj.emoji;
        }

        return `
      <div class="member-card ${member.isOnline ? 'online' : 'offline'} ${isMe ? 'is-me' : ''}"
           id="card-${member.uid}">
        <div class="member-avatar">
          ${member.photoURL
                ? `<img src="${member.photoURL}" alt="${member.displayName || member.email}" class="avatar-img">`
                : `<span class="avatar-initial">${initial}</span>`}
          <span class="status-dot ${member.isOnline ? 'dot-online' : 'dot-offline'}"></span>
        </div>
        <div class="member-info">
          <div class="member-email">${member.displayName || member.email}</div>
          <span class="member-role ${member.role}">${member.role === 'admin' ? '👑 ' + t('admin') : '👤 ' + t('member')}</span>
        </div>
        <div class="member-mood">
          ${moodObj
                ? `<span class="mood-display">
                 <span class="mood-display-emoji">${moodEmojiDisplay}</span>
                 <span class="mood-display-label">${t(moodObj.key)}</span>
               </span>`
                : '<span class="no-mood">😶</span>'}
        </div>
      </div>
    `;
    }).join('');

    // Update counters
    const onlineCount = members.filter(m => m.isOnline).length;
    const onlineCountEl = document.getElementById('online-count');
    const totalCountEl = document.getElementById('total-count');
    if (onlineCountEl) onlineCountEl.textContent = onlineCount;
    if (totalCountEl) totalCountEl.textContent = members.length;

    // Update team header counters
    const teamOnlineCount = document.getElementById('team-online-count');
    const teamTotalCount = document.getElementById('team-total-count');
    if (teamOnlineCount) teamOnlineCount.textContent = onlineCount;
    if (teamTotalCount) teamTotalCount.textContent = members.length;
}

// ─── Animate card on mood change ────────────────────────────────
function animateCard(uid) {
    const card = document.getElementById(`card-${uid}`);
    if (card) {
        card.classList.add('pulse');
        setTimeout(() => card.classList.remove('pulse'), 500);
    }
}

// ─── Connection Status ──────────────────────────────────────────
function updateConnectionStatus(connected) {
    const dotMore = document.getElementById('connection-dot-more');
    if (dotMore) dotMore.className = `conn-dot ${connected ? 'conn-online' : 'conn-offline'}`;
}

// ─── Toast Notification ─────────────────────────────────────────
function showToast(message, icon = '📢') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Utility ────────────────────────────────────────────────────
function getTimeAgo(timestamp) {
    const now = Date.now();
    const ts = typeof timestamp === 'object' && timestamp.seconds
        ? timestamp.seconds * 1000
        : timestamp;
    const diff = now - ts;

    if (diff < 60000) return t('just_now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('m')} ${t('ago')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('h')} ${t('ago')}`;
    return `${Math.floor(diff / 86400000)}${t('d')} ${t('ago')}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ─── Daily Reminder (local notification, per device) ─────────────
const REMINDER_STORAGE_KEY = 'psyc_daily_reminder';
let reminderTimeoutId = null;

async function ensureNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

// Request notification permission on app load
async function requestNotificationPermission() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('ℹ️ Notifications not supported in this browser');
        return;
    }

    // Check permission status and update UI
    updateNotificationUI();
    updateBrowserNotificationToggle();
}

// Toggle browser notifications from settings
async function toggleBrowserNotifications() {
    console.log('🔔 toggleBrowserNotifications called');
    const toggle = document.getElementById('browser-notifications-enabled');
    console.log('Toggle element:', toggle);
    console.log('Toggle checked:', toggle?.checked);
    console.log('Notification permission:', Notification?.permission);

    if (!('Notification' in window)) {
        console.error('❌ Notifications not supported');
        showToast('Notifications not supported in this browser', '⚠️');
        if (toggle) toggle.checked = false;
        return;
    }

    if (toggle && toggle.checked) {
        console.log('✅ User wants to enable notifications');
        // User wants to enable - request permission
        if (Notification.permission === 'granted') {
            console.log('✅ Already granted');
            showToast('Notifications already enabled!', '✅');
            updateBrowserNotificationToggle();
            return;
        }

        try {
            console.log('📤 Requesting permission...');
            const permission = await Notification.requestPermission();
            console.log('📥 Permission result:', permission);

            if (permission === 'granted') {
                console.log('✅ Permission granted!');
                showToast('Notifications enabled! 🔔', '✅');
                updateBrowserNotificationToggle();
                updateNotificationUI();

                // Show a test notification
                setTimeout(() => {
                    try {
                        console.log('🔔 Showing test notification...');
                        const notification = new Notification('Notifications Enabled! 🎯', {
                            body: 'You\'ll receive reminders for your goals and mood check-ins.',
                            icon: '/assets/logo/logo.png',
                            requireInteraction: false
                        });
                        setTimeout(() => notification.close(), 5000);
                    } catch (err) {
                        console.error('❌ Test notification error:', err);
                    }
                }, 500);
            } else {
                console.log('⚠️ Permission denied');
                showToast('Permission denied. Check browser settings to enable.', '⚠️');
                if (toggle) toggle.checked = false;
                updateBrowserNotificationToggle();
            }
        } catch (err) {
            console.error('❌ Error requesting permission:', err);
            showToast('Error requesting permission', '⚠️');
            if (toggle) toggle.checked = false;
        }
    } else {
        console.log('ℹ️ User disabled toggle');
        // User wants to disable - just update UI
        showToast('Notifications disabled. Toggle on to re-enable.', 'ℹ️');
        updateBrowserNotificationToggle();
    }
}

// Update the browser notification toggle based on permission
function updateBrowserNotificationToggle() {
    console.log('🔄 updateBrowserNotificationToggle called');
    const toggle = document.getElementById('browser-notifications-enabled');
    const statusDiv = document.getElementById('notification-status');

    console.log('Toggle element:', toggle);
    console.log('Status div:', statusDiv);
    console.log('Notification support:', 'Notification' in window);
    console.log('Permission:', Notification?.permission);

    if (!('Notification' in window)) {
        console.log('❌ Notifications not supported');
        if (toggle) {
            toggle.checked = false;
            toggle.disabled = true;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="bi bi-x-circle"></i> Not supported in this browser';
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.color = '#991b1b';
        }
        return;
    }

    if (Notification.permission === 'granted') {
        console.log('✅ Setting UI to GRANTED state');
        if (toggle) {
            toggle.checked = true;
            toggle.disabled = false;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="bi bi-check-circle-fill"></i> Enabled - You\'ll receive notifications';
            statusDiv.style.background = '#d1fae5';
            statusDiv.style.color = '#065f46';
        }
    } else if (Notification.permission === 'denied') {
        console.log('❌ Setting UI to DENIED state');
        if (toggle) {
            toggle.checked = false;
            toggle.disabled = true;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="bi bi-x-circle-fill"></i> Blocked - Enable in browser settings';
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.color = '#991b1b';
        }
    } else {
        console.log('ℹ️ Setting UI to DEFAULT state');
        // default - not asked yet
        if (toggle) {
            toggle.checked = false;
            toggle.disabled = false;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="bi bi-info-circle"></i> Toggle on to enable notifications';
            statusDiv.style.background = '#fef3c7';
            statusDiv.style.color = '#92400e';
        }
    }

    console.log('✅ UI updated successfully');
}

// Update UI based on notification permission
function updateNotificationUI() {
    if (!('Notification' in window)) return;

    const banner = document.getElementById('notification-permission-banner');
    const notifGrid = document.getElementById('notification-frequency-grid');
    const dailyTimeContainer = document.getElementById('daily-time-container');
    const threeTimesContainer = document.getElementById('three-times-container');
    const weeklyContainer = document.getElementById('weekly-container');
    const customTimesContainer = document.getElementById('custom-times-container');

    if (Notification.permission === 'granted') {
        // Hide banner, enable notification options
        if (banner) banner.style.display = 'none';
        if (notifGrid) notifGrid.style.opacity = '1';
        if (notifGrid) notifGrid.style.pointerEvents = 'auto';
        console.log('✅ Notifications enabled');
    } else {
        // Show banner, disable notification options
        if (banner) banner.style.display = 'block';
        if (notifGrid) notifGrid.style.opacity = '0.5';
        if (notifGrid) notifGrid.style.pointerEvents = 'none';
        if (dailyTimeContainer) dailyTimeContainer.style.opacity = '0.5';
        if (dailyTimeContainer) dailyTimeContainer.style.pointerEvents = 'none';
        if (threeTimesContainer) threeTimesContainer.style.opacity = '0.5';
        if (threeTimesContainer) threeTimesContainer.style.pointerEvents = 'none';
        if (weeklyContainer) weeklyContainer.style.opacity = '0.5';
        if (weeklyContainer) weeklyContainer.style.pointerEvents = 'none';
        if (customTimesContainer) customTimesContainer.style.opacity = '0.5';
        if (customTimesContainer) customTimesContainer.style.pointerEvents = 'none';
        console.log('⚠️ Notifications disabled');
    }
}

// Request permission from banner button
async function requestNotificationPermissionFromBanner() {
    if (!('Notification' in window)) {
        showToast('Notifications not supported in this browser', '⚠️');
        return;
    }

    if (Notification.permission === 'granted') {
        showToast('Notifications already enabled!', '✅');
        updateNotificationUI();
        return;
    }

    try {
        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            showToast('Notifications enabled! 🔔', '✅');
            updateNotificationUI();

            // Show a test notification
            setTimeout(() => {
                try {
                    const notification = new Notification('Notifications Enabled! 🎯', {
                        body: 'You\'ll receive reminders for your goals.',
                        icon: '/assets/logo/logo.png',
                        requireInteraction: false
                    });
                    setTimeout(() => notification.close(), 5000);
                } catch (err) {
                    console.error('Test notification error:', err);
                }
            }, 500);
        } else {
            console.log('⚠️ Notification permission denied');
            showToast('Permission denied. Check browser settings to enable.', '⚠️');
            updateNotificationUI();
        }
    } catch (err) {
        console.error('❌ Error requesting notification permission:', err);
        showToast('Error requesting permission', '⚠️');
    }
}

async function loadReminderSettings() {
    let settings = { enabled: false, time: '09:00' };

    // Try to load from verify-org response (already fetched on login)
    // This is more efficient than making a separate API call
    if (currentUser) {
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch(`/api/user/verify-org?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.reminderSettings) {
                    settings = { ...settings, ...data.reminderSettings };
                    // Sync to localStorage for offline access
                    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
                }
            }
        } catch (err) {
            console.error('Failed to load reminder settings from API:', err);
        }
    }

    // Fallback to localStorage if API fails or user not logged in
    if (!settings.enabled) {
        try {
            const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
            if (raw) settings = { ...settings, ...JSON.parse(raw) };
        } catch { /* ignore */ }
    }

    const enabledEl = document.getElementById('reminder-enabled');
    const timeEl = document.getElementById('reminder-time');
    if (enabledEl) enabledEl.checked = !!settings.enabled;
    if (timeEl && settings.time) timeEl.value = settings.time;

    scheduleDailyReminder(settings);
}

async function saveReminderSettings(partial) {
    let settings = { enabled: false, time: '09:00' };
    try {
        const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
        if (raw) settings = { ...settings, ...JSON.parse(raw) };
    } catch { /* ignore */ }

    settings = { ...settings, ...partial };
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
    scheduleDailyReminder(settings);

    // Sync to Firestore via API
    if (currentUser) {
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch('/api/user/reminder-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Failed to sync reminder settings:', error);
            } else {
                console.log('✅ Reminder settings synced to Firestore');
            }
        } catch (err) {
            console.error('Failed to sync reminder settings to Firestore:', err);
        }
    }
}

function scheduleDailyReminder(settings) {
    if (reminderTimeoutId) {
        clearTimeout(reminderTimeoutId);
        reminderTimeoutId = null;
    }

    if (!settings.enabled || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const [hStr, mStr] = (settings.time || '09:00').split(':');
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);

    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    // If time today has passed, schedule for tomorrow
    if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();
    reminderTimeoutId = setTimeout(() => {
        // Fire browser notification (when tab or PWA is open)
        try {
            new Notification('Time to check in', {
                body: 'How are you feeling today? Log your mood in Sonder.',
                tag: 'sonder-daily-reminder',
            });
        } catch {
            showToast('How are you feeling? Time to log your mood.', '⏰');
        }
        // Schedule the next one for the following day
        scheduleDailyReminder({ ...settings });
    }, delay);
}

// ─── Goal Notifications (local notification, per device) ────────
// Using real-time interval checker instead of timeouts
const GOAL_FIRED_KEY = 'psyc_goal_fired_today';
const IMP_DAY_FIRED_KEY = 'psyc_impday_fired';

function getFiredGoalsToday() {
    try {
        const data = JSON.parse(localStorage.getItem(GOAL_FIRED_KEY) || '{}');
        const today = new Date().toISOString().split('T')[0];
        if (data.date !== today) {
            localStorage.setItem(GOAL_FIRED_KEY, JSON.stringify({ date: today, ids: [] }));
            return [];
        }
        return data.ids || [];
    } catch { return []; }
}

function markGoalFiredToday(goalId) {
    const today = new Date().toISOString().split('T')[0];
    const firedIds = getFiredGoalsToday();
    if (!firedIds.includes(goalId)) {
        firedIds.push(goalId);
        localStorage.setItem(GOAL_FIRED_KEY, JSON.stringify({ date: today, ids: firedIds }));
    }
}

function getGoalFeedEntries() {
    try {
        const data = JSON.parse(localStorage.getItem('psyc_goal_feed_entries') || '{}');
        const today = new Date().toISOString().split('T')[0];
        if (data.date !== today) return [];
        return data.entries || [];
    } catch { return []; }
}

function saveGoalFeedEntry(entry) {
    const today = new Date().toISOString().split('T')[0];
    const entries = getGoalFeedEntries();
    if (!entries.find(e => e.id === entry.id)) {
        entries.push(entry);
        localStorage.setItem('psyc_goal_feed_entries', JSON.stringify({ date: today, entries }));
    }
}

// REAL-TIME NOTIFICATION ENGINE - Checks every second like the working example
let goalNotificationChecker = null;
let importantDayTimeouts = {};

function startGoalNotificationEngine() {
    // Stop existing checker if any
    if (goalNotificationChecker) {
        clearInterval(goalNotificationChecker);
    }

    console.log('🔔 Starting real-time notification engine...');

    // Load notified items from localStorage
    const notifiedGoals = JSON.parse(localStorage.getItem('psyc_notified_goals') || '{}');
    const notifiedDays = JSON.parse(localStorage.getItem('psyc_notified_important_days') || '{}');
    const today = new Date().toDateString();

    // Check every second
    goalNotificationChecker = setInterval(() => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        let hasChanges = false;
        
        // Check GOALS
        if (goalsList && goalsList.length > 0 && currentUser) {
            goalsList.forEach(goal => {
                const userSettings = goal.userNotificationSettings?.[currentUser.uid] || {};
                const notifEnabled = userSettings.enabled !== false;
                
                // Handle new format (frequency + days + time)
                if (goal.reminderFrequency && goal.reminderTime) {
                    // Check if this goal should fire today
                    let shouldFireToday = false;
                    if (goal.reminderFrequency === 'daily') {
                        shouldFireToday = true;
                    } else if (goal.reminderFrequency === 'custom' && goal.reminderDays) {
                        shouldFireToday = goal.reminderDays.includes(currentDay);
                    }

                    if (!shouldFireToday) return;

                    // Check if already notified today (from localStorage)
                    const notifKey = `${goal.id}_${today}`;
                    const alreadyNotified = notifiedGoals[notifKey] === true;

                    // Check if time matches (HH:MM format)
                    const timeMatches = currentTime === goal.reminderTime;

                    // If time matches and not yet notified today and notifications enabled
                    if (timeMatches && !alreadyNotified && notifEnabled) {
                        console.log('🔔 Time reached for:', goal.title);
                        fireGoalNotification(goal);
                        
                        // Mark as notified today in localStorage
                        notifiedGoals[notifKey] = true;
                        localStorage.setItem('psyc_notified_goals', JSON.stringify(notifiedGoals));
                        
                        hasChanges = true;
                    }
                }
                // Handle old format (reminderDateTime) - for backward compatibility
                else if (goal.reminderDateTime) {
                    const notifKey = `${goal.id}_${goal.reminderDateTime}`;
                    const alreadyNotified = notifiedGoals[notifKey] === today;

                    const reminderTime = new Date(goal.reminderDateTime).getTime();
                    const nowMs = now.getTime();

                    // If time has arrived and not yet notified and notifications enabled
                    if (nowMs >= reminderTime && !alreadyNotified && notifEnabled) {
                        console.log('🔔 Time reached for:', goal.title);
                        fireGoalNotification(goal);
                        
                        // Mark as notified in localStorage
                        notifiedGoals[notifKey] = today;
                        localStorage.setItem('psyc_notified_goals', JSON.stringify(notifiedGoals));
                        
                        hasChanges = true;
                    }
                }
            });
        }
        
        // Check IMPORTANT DAYS
        if (allImportantDays && allImportantDays.length > 0) {
            allImportantDays.forEach(day => {
                if (!day.time) return; // Skip if no time set
                
                const dayDate = day.date; // YYYY-MM-DD
                const todayDate = now.toISOString().split('T')[0];
                
                // Only check if it's today
                if (dayDate !== todayDate) return;
                
                // Check if already notified
                const notifKey = `${day.id}_${dayDate}`;
                const alreadyNotified = notifiedDays[notifKey] === true;
                
                // Check if time matches
                const timeMatches = currentTime === day.time;
                
                if (timeMatches && !alreadyNotified) {
                    console.log('📅 Time reached for important day:', day.title);
                    fireImportantDayNotification(day);
                    
                    // Mark as notified
                    notifiedDays[notifKey] = true;
                    localStorage.setItem('psyc_notified_important_days', JSON.stringify(notifiedDays));
                    
                    hasChanges = true;
                }
            });
        }
        
        if (hasChanges) {
            renderNotificationHistory();
        }
    }, 1000); // Check every second
}

// Test function - call this in console to test notification immediately
window.testGoalNotification = function() {
    console.log('🧪 Testing notification...');
    if (Notification.permission !== 'granted') {
        console.error('❌ Permission not granted. Current:', Notification.permission);
        Notification.requestPermission().then(p => {
            console.log('Permission result:', p);
            if (p === 'granted') {
                new Notification('Test', { body: 'Permission granted! Try again.' });
            }
        });
        return;
    }
    
    const testGoal = {
        id: 'test-123',
        title: 'Test Goal',
        description: 'This is a test notification'
    };
    
    fireGoalNotification(testGoal);
    console.log('✅ Test notification fired');
};

// Test function for important day notifications
window.testImportantDayNotification = function() {
    console.log('🧪 Testing important day notification...');
    
    const testDay = {
        id: 'test-day-123',
        title: 'Test Important Day',
        notes: 'This is a test important day notification',
        emoji: '🎉',
        color: '#ec4899',
        date: new Date().toISOString().split('T')[0]
    };
    
    showImportantDayNotification([testDay]);
    console.log('✅ Test important day notification fired');
};

function stopGoalNotificationEngine() {
    if (goalNotificationChecker) {
        clearInterval(goalNotificationChecker);
        goalNotificationChecker = null;
        console.log('🛑 Notification engine stopped');
    }
}

function fireGoalNotification(goal) {
    console.log('🔔 Firing notification for:', goal.title);
    
    // Show in-app notification modal
    showInAppGoalNotification(goal);
    
    // Save to notification history
    saveNotificationToHistory(goal);
    
    // Try Windows notification (fallback)
    if (Notification.permission === "granted") {
        try {
            new Notification("🎯 Goal Reminder", {
                body: `Hoy! Oras na para sa: ${goal.title}`,
                icon: "/assets/logo/logo.png",
                requireInteraction: true
            });
        } catch (e) {
            console.log('Windows notification blocked, using in-app only');
        }
    }
}

function showInAppGoalNotification(goal) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.3s;
    `;
    
    const description = goal.description ? `<p style="font-size: 14px; color: #94a3b8; margin: 10px 0 20px 0;">${goal.description}</p>` : '';
    const goalType = goal.type === 'team' ? '👥 Team Goal' : '👤 Personal Goal';
    const typeColor = goal.type === 'team' ? '#8b5cf6' : '#6366f1';
    
    modal.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 20px;">
            <i class="bi bi-bullseye" style="color: ${typeColor};"></i>
        </div>
        <div style="display: inline-block; background: ${typeColor}20; color: ${typeColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 10px;">
            ${goalType}
        </div>
        <h2 style="margin: 10px 0; color: #1e293b;">Goal Reminder!</h2>
        <p style="font-size: 18px; color: #64748b; margin: 0 0 10px 0;">
            It's time for:
        </p>
        <p style="font-size: 20px; font-weight: bold; color: ${typeColor}; margin: 0;">
            ${goal.title}
        </p>
        ${description}
        <button onclick="this.closest('div').parentElement.remove()" style="
            background: ${typeColor};
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
        ">Got it!</button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Play sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz');
    audio.play().catch(() => {});
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 10000);
    
    console.log('✅ In-app notification shown');
}

function saveNotificationToHistory(goal) {
    const history = JSON.parse(localStorage.getItem('psyc_notification_history') || '[]');
    
    const notification = {
        id: Date.now(),
        goalId: goal.id,
        goalTitle: goal.title,
        goalDescription: goal.description || '',
        timestamp: Date.now(),
        type: 'goal',
        read: false
    };
    
    history.unshift(notification); // Add to beginning
    
    // Keep only last 50 notifications
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem('psyc_notification_history', JSON.stringify(history));
    
    // Update notification bell badge
    updateNotificationBadge();
    
    console.log('✅ Notification saved to history');
}

function saveImportantDayToHistory(day) {
    const history = JSON.parse(localStorage.getItem('psyc_notification_history') || '[]');
    
    // Check if this day was already saved today (prevent duplicates)
    const today = new Date().toISOString().split('T')[0];
    const alreadySaved = history.some(n => 
        n.type === 'importantDay' && 
        n.dayId === day.id && 
        n.dayDate === today
    );
    
    if (alreadySaved) {
        console.log('⚠️ Important day notification already in history, skipping');
        return;
    }
    
    // Generate unique ID using timestamp and counter
    const baseId = Date.now();
    let uniqueId = baseId;
    let counter = 1;
    while (history.some(n => n.id === uniqueId)) {
        uniqueId = baseId + counter;
        counter++;
    }
    
    const notification = {
        id: uniqueId,
        dayId: day.id,
        dayTitle: day.title,
        dayNotes: day.notes || '',
        dayEmoji: day.emoji || '🎉',
        dayColor: day.color || '#ec4899',
        dayDate: day.date,
        timestamp: Date.now(),
        type: 'importantDay',
        read: false
    };
    
    history.unshift(notification); // Add to beginning
    
    // Keep only last 50 notifications
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem('psyc_notification_history', JSON.stringify(history));
    
    // Update notification bell badge
    updateNotificationBadge();
    
    console.log('✅ Important day notification saved to history');
}

function getNotificationHistory() {
    return JSON.parse(localStorage.getItem('psyc_notification_history') || '[]');
}

function markNotificationAsRead(notifId) {
    const history = getNotificationHistory();
    const notif = history.find(n => n.id === notifId);
    if (notif) {
        notif.read = true;
        localStorage.setItem('psyc_notification_history', JSON.stringify(history));
        updateNotificationBadge();
        renderNotificationHistory();
    }
}

function handleNotificationClick(notifId, goalId) {
    // Mark as read
    markNotificationAsRead(notifId);
    
    // Find the goal
    const goal = goalsList.find(g => g.id === goalId);
    if (goal) {
        // Open goals modal if not already open
        const goalsModal = document.getElementById('goals-modal');
        if (goalsModal && !goalsModal.classList.contains('open')) {
            openGoalsModal();
        }
        
        // Make sure we're on the list view (not edit form)
        if (document.getElementById('goal-form-view').style.display !== 'none') {
            hideGoalForm();
        }
        
        // Wait a bit for modal to open and render, then scroll to goal
        setTimeout(() => {
            // Find the goal element and scroll to it
            const goalElements = document.querySelectorAll('.goal-item');
            goalElements.forEach(el => {
                const goalTitle = el.querySelector('.goal-title');
                if (goalTitle && goalTitle.textContent.trim() === goal.title) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the goal briefly
                    el.style.background = 'rgba(139, 92, 246, 0.15)';
                    el.style.transition = 'background 0.5s';
                    setTimeout(() => {
                        el.style.background = '';
                    }, 2000);
                }
            });
        }, 400);
    } else {
        showToast('Goal not found', 'ℹ️');
    }
}

function handleImportantDayNotificationClick(notifId, dayId) {
    // Mark as read
    markNotificationAsRead(notifId);
    
    // Find the important day
    const day = allImportantDays.find(d => d.id === dayId);
    if (day) {
        // Open important days modal if not already open
        const importantDaysModal = document.getElementById('important-days-modal');
        if (importantDaysModal && !importantDaysModal.classList.contains('open')) {
            openImportantDaysModal();
        }
        
        // Wait a bit for modal to open and render, then scroll to day
        setTimeout(() => {
            // Find the day element and scroll to it
            const dayElements = document.querySelectorAll('.important-day-item');
            dayElements.forEach(el => {
                const dayTitle = el.querySelector('.important-day-title');
                if (dayTitle && dayTitle.textContent.trim() === day.title) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the day briefly
                    el.style.background = 'rgba(236, 72, 153, 0.15)';
                    el.style.transition = 'background 0.5s';
                    setTimeout(() => {
                        el.style.background = '';
                    }, 2000);
                }
            });
        }, 400);
    } else {
        showToast('Important day not found', 'ℹ️');
    }
}

function markAllNotificationsAsRead() {
    const history = getNotificationHistory();
    history.forEach(n => n.read = true);
    localStorage.setItem('psyc_notification_history', JSON.stringify(history));
    updateNotificationBadge();
}

function clearNotificationHistory() {
    localStorage.setItem('psyc_notification_history', '[]');
    updateNotificationBadge();
    renderNotificationHistory();
}

function updateNotificationBadge() {
    const history = getNotificationHistory();
    const unreadCount = history.filter(n => !n.read).length;
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotificationHistory() {
    const container = document.getElementById('notification-history-list');
    if (!container) return;
    
    const history = getNotificationHistory();
    
    if (history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 12px; color: #94a3b8;">
                <i class="bi bi-bell-slash" style="font-size: 28px; margin-bottom: 6px; opacity: 0.4;"></i>
                <p style="margin: 0; font-size: 13px;">No new notifications</p>
            </div>
        `;
        return;
    }
    
    // Sort: unread first, then by timestamp (newest first)
    const sortedHistory = [...history].sort((a, b) => {
        if (a.read !== b.read) {
            return a.read ? 1 : -1; // Unread first
        }
        return b.timestamp - a.timestamp; // Newest first within same read status
    });
    
    container.innerHTML = sortedHistory.map(notif => {
        const date = new Date(notif.timestamp);
        const timeAgo = getTimeAgo(notif.timestamp);
        
        if (notif.type === 'importantDay') {
            // Important Day notification
            const emoji = notif.dayEmoji || '🎉';
            const color = notif.dayColor || '#ec4899';
            return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="handleImportantDayNotificationClick(${notif.id}, '${notif.dayId}')">
                    <div class="notification-icon">
                        <i class="bi bi-calendar-event" style="font-size: 24px; color: ${color};"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.dayTitle}</div>
                        ${notif.dayNotes ? `<div class="notification-desc">${notif.dayNotes}</div>` : ''}
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    ${!notif.read ? '<div class="notification-unread-dot"></div>' : ''}
                </div>
            `;
        } else {
            // Goal notification
            return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="handleNotificationClick(${notif.id}, '${notif.goalId}')">
                    <div class="notification-icon">
                        <i class="bi bi-bullseye" style="font-size: 24px; color: #8b5cf6;"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.goalTitle}</div>
                        ${notif.goalDescription ? `<div class="notification-desc">${notif.goalDescription}</div>` : ''}
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    ${!notif.read ? '<div class="notification-unread-dot"></div>' : ''}
                </div>
            `;
        }
    }).join('');
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
}

function forceRescheduleGoalNotifications() {
    // Restart the engine
    startGoalNotificationEngine();
}

// ─── Real-Time Reminders Engine (1s Check) ────────────────────
let lastCheckedMinute = "";
let processedReminders = new Set(); // To avoid double firing within same minute

function startRemindersEngine() {
    console.log("🚀 Starting Reminders Engine (1s interval)");
    setInterval(checkReminders, 1000);
}

function checkReminders() {
    const now = new Date();
    // Use local time for comparison with what user input in datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const currentMinuteStr = `${year}-${month}-${day}T${hours}:${minutes}`;

    if (currentMinuteStr !== lastCheckedMinute) {
        lastCheckedMinute = currentMinuteStr;
        // Optional: clear processedReminders every hour to keep it small
        if (minutes === "00") processedReminders.clear();
    }

    // 1. Check Goals (Personal & Team)
    if (Array.isArray(goalsList)) {
        goalsList.forEach(goal => {
            if (goal.reminderDateTime === currentMinuteStr && !processedReminders.has(`goal-${goal.id}-${currentMinuteStr}`)) {
                processedReminders.add(`goal-${goal.id}-${currentMinuteStr}`);
                fireGoalNotification(goal);
            }
        });
    }

    // 2. Check Important Days
    if (Array.isArray(allImportantDays)) {
        allImportantDays.forEach(dayItem => {
            // Important days have date (YYYY-MM-DD) and optional time (HH:mm)
            if (dayItem.date && dayItem.time) {
                const eventDayMinute = `${dayItem.date}T${dayItem.time}`;
                if (eventDayMinute === currentMinuteStr && !processedReminders.has(`event-${dayItem.id}-${currentMinuteStr}`)) {
                    processedReminders.add(`event-${dayItem.id}-${currentMinuteStr}`);
                    fireImportantDayNotification(dayItem);
                }
            } else if (dayItem.date === `${year}-${month}-${day}` && hours === "09" && minutes === "00" && !processedReminders.has(`event-${dayItem.id}-daystart`)) {
                // If no time set, notify at 9:00 AM
                processedReminders.add(`event-${dayItem.id}-daystart`);
                fireImportantDayNotification(dayItem);
            }
        });
    }
}

// Test function for debugging
async function testGoalNotification() {
    console.log("⭐ Firing Important Day Notification:", event.title);

    alarmSound.play().catch(e => console.warn("Audio play blocked", e));

    setTimeout(() => {
        alert("⭐ IMPORTANT DAY!\n\n" + event.title + (event.notes ? "\n" + event.notes : ""));
    }, 100);

    if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification('⭐ Important Day', {
            body: event.title,
            icon: '/assets/logo/logo.png'
        });
        n.onclick = () => { window.focus(); openImportantDaysModal(); n.close(); };
    }

    showToast(`⭐ ${event.title}`, '🎉');

    if (socket && event.type === 'team') {
        socket.emit('createNotification', {
            title: event.title,
            body: 'Important Team Event Now!',
            type: 'event',
            category: 'team',
            linkId: event.id
        });
    }
}

function getFiredImpDayNotifications() {
    try {
        return JSON.parse(localStorage.getItem(IMP_DAY_FIRED_KEY) || '[]');
    } catch {
        return [];
    }
}

function markImpDayFired(notifId) {
    const fired = getFiredImpDayNotifications();
    if (!fired.includes(notifId)) {
        fired.push(notifId);
        if (fired.length > 100) fired.splice(0, fired.length - 100);
        localStorage.setItem(IMP_DAY_FIRED_KEY, JSON.stringify(fired));
    }
}

async function scheduleImportantDayNotifications() {
    // This function is now just a placeholder - we use real-time checking instead
    console.log('📅 Important day notifications will be checked in real-time');
}

function fireImportantDayNotification(day, reminderType, isCatchUp = false) {
    console.log('🔔 Firing important day notification for:', day.title);
    
    // Show in-app notification popup (same as goals)
    showImportantDayNotification([day]);
    
    // If it's a team important day, emit socket event to notify all team members
    if (day.type === 'team' && socket && socket.connected) {
        console.log('📡 Emitting team important day notification via socket');
        socket.emit('createNotification', {
            title: day.title,
            body: day.notes || 'Important Team Event',
            type: 'important_day',
            category: 'team',
            linkId: day.id,
            dayData: day // Include full day data
        });
    }
}

// ─── Logout ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtnMore = document.getElementById('logout-btn-more');

    const handleLogout = () => {
        if (socket) socket.disconnect();
        localStorage.removeItem('psyc_orgId');
        localStorage.removeItem('psyc_username');
        localStorage.removeItem('psyc_orgName');
        auth.signOut().then(() => window.location.href = '/');
    };

    if (logoutBtnMore) {
        logoutBtnMore.addEventListener('click', handleLogout);
    }

    // Daily reminder settings
    const reminderToggle = document.getElementById('reminder-enabled');
    const reminderTime = document.getElementById('reminder-time');

    if (reminderToggle) {
        reminderToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                const granted = await ensureNotificationPermission();
                if (!granted) {
                    e.target.checked = false;
                    showToast('Enable notifications in your browser to use reminders.', '🔔');
                    return;
                }
            }
            saveReminderSettings({ enabled: e.target.checked });
        });
    }

    if (reminderTime) {
        reminderTime.addEventListener('change', (e) => {
            const value = e.target.value || '09:00';
            saveReminderSettings({ time: value });
        });
    }

    loadReminderSettings();
});

// ─── Copy Admin Invite Code ─────────────────────────────────────
function copyAdminCode() {
    const code = document.getElementById('admin-invite-code')?.textContent;
    if (code) {
        navigator.clipboard.writeText(code);
        showToast('Invite code copied!', '📋');
    }
}

// ─── Tab Switching ──────────────────────────────────────────────
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Add active class to corresponding tab and nav item
    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');

    const navItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
    if (navItem) navItem.classList.add('active');

    // Hide/show topbar and org-bar based on tab
    const topbar = document.querySelector('.topbar');
    const orgBar = document.querySelector('.org-bar');

    if (tabName === 'more' || tabName === 'team') {
        if (topbar) topbar.style.display = 'none';
        if (orgBar) orgBar.style.display = 'none';
    } else {
        if (topbar) topbar.style.display = 'flex';
        if (orgBar) orgBar.style.display = 'flex';
    }

    // Feature actions based on tab
    if (tabName === 'stats' && currentUser && typeof loadStatsCharts === 'function') {
        loadStatsCharts();
    }

    if (tabName === 'calendar') {
        renderCalendarGrid();
    }

    if (tabName === 'team') {
        updateTeamHeader();
    }
}

// ─── Year Stats Overlay Toggle ──────────────────────────────────
function toggleYearStatsView() {
    const overlay = document.getElementById('year-stats-overlay');
    const bottomNav = document.querySelector('.bottom-nav');

    if (!overlay) return;

    if (overlay.classList.contains('open')) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';

        // Show bottom nav
        if (bottomNav) {
            bottomNav.style.display = 'flex';
        }
    } else {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Hide bottom nav
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }

        // Reset to current year when opening
        currentYearView = new Date().getFullYear();

        // Load year stats when opening
        if (currentUser && typeof loadYearStats === 'function') {
            loadYearStats();
        }
    }
}

// ─── Render Calendar Grid ──────────────────────────────────────────
async function renderCalendarGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    // To make it simple, let's fetch from the API to sync up user's history
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch('/api/user/calendar-logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.logs) {
            // merge logs to personalEntries
            data.logs.forEach(log => {
                const exists = personalEntries.find(e => e.id === log.id || (e.uid === currentUser.uid && e.timestamp === log.timestamp));
                if (!exists) {
                    const moodObj = getMoodByKey(log.mood);
                    personalEntries.push({
                        id: log.id,
                        uid: currentUser.uid,
                        mood: log.mood,
                        moodEmoji: moodObj?.emoji || '🎭',
                        moodLabel: moodObj?.label || log.mood,
                        moodColor: moodObj?.color || '#fff',
                        timestamp: new Date(log.timestamp).getTime(),
                    });
                }
            });
            personalEntries.sort((a, b) => b.timestamp - a.timestamp);
        }
    } catch (err) {
        console.error('Failed to load user logs', err);
    }

    const today = new Date();
    const currentYear = viewMonth.getFullYear();
    const currentMonth = viewMonth.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    let html = '';

    // Empty cells before start of month
    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div class="cal-cell empty"></div>';
    }

    // Ensure important days are loaded for markers
    if (typeof fetchImportantDaysForCalendar === 'function') {
        await fetchImportantDaysForCalendar();
    }

    // Stats variables
    const moodCounts = {};
    let totalEntries = 0;

    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
        let cellStyle = '';
        let dateStyle = '';
        let extraClassTop = '';
        let extraClassWrapper = '';
        let onClickAttr = '';

        let circleContent = '';
        let dateContent = i;

        // Important Day Marker
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayImpDays = typeof getImportantDaysForDate === 'function' ? getImportantDaysForDate(dateStr) : [];
        let markerHtml = '';
        if (dayImpDays.length > 0) {
            const firstColor = dayImpDays[0].color || 'var(--d-primary)';
            markerHtml = `<div class="cal-event-marker" style="background: ${firstColor};"></div>`;
        }

        // Check if there are entries for this day
        const dayStart = new Date(currentYear, currentMonth, i).getTime();
        const dayEnd = new Date(currentYear, currentMonth, i, 23, 59, 59, 999).getTime();

        // Find all entries for this day
        const dayEntries = personalEntries.filter(e => e.uid === currentUser?.uid && e.timestamp >= dayStart && e.timestamp <= dayEnd);

        if (dayEntries.length > 0) {
            extraClassTop += ' has-mood';
            onClickAttr = ` onclick="openDayDetails(${dayStart});"`;

            // Stats: count every entry
            totalEntries += dayEntries.length;
            dayEntries.forEach(entry => {
                const mk = entry.mood;
                if (!moodCounts[mk]) {
                    const mObj = getMoodByKey(mk);
                    moodCounts[mk] = { count: 0, label: mObj?.label || mk, color: entry.moodColor };
                }
                moodCounts[mk].count++;
            });

            if (dayEntries.length === 1) {
                const dayEntry = dayEntries[0];
                cellStyle = `background-color: ${dayEntry.moodColor};`;
                dateStyle = `color: ${dayEntry.moodColor};`;
                circleContent = `<span>${dayEntry.moodEmoji}</span>`;
            } else {
                // Stacked moods (Daylio style)
                // Use the most recent mood color for the date text
                dateStyle = `color: ${dayEntries[0].moodColor};`;
                extraClassTop += ' is-stacked';

                // Render up to 3 moods in a stack
                const stackLimit = 3;
                const visibleMoods = dayEntries.slice(0, stackLimit);
                circleContent = `<div class="mood-stack">
                    ${visibleMoods.reverse().map((e, idx) => `
                        <div class="stack-item" style="background: ${e.moodColor}; z-index: ${idx};">
                            ${e.moodEmoji}
                        </div>
                    `).join('')}
                    ${dayEntries.length > stackLimit ? `<div class="stack-more">+${dayEntries.length - stackLimit}</div>` : ''}
                </div>`;
            }
        } else {
            // Check if day is in past or today
            const isPastOrToday = dayEnd <= today.getTime() || (i === today.getDate() && currentMonth === today.getMonth());
            if (isPastOrToday) {
                const clickTime = new Date(currentYear, currentMonth, i, 12, 0, 0).getTime();
                circleContent = '<span style="font-size: 1.2rem; margin-bottom: 2px;">+</span>';
                onClickAttr = ` onclick="openQuickMoodSelector(${clickTime});"`;
                extraClassWrapper += ' clickable-cell';
            } else {
                circleContent = ''; // completely empty circle
            }
        }

        // Highlight today
        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            extraClassWrapper += ' is-today';
        }

        html += `
        <div class="cal-day-cell ${extraClassWrapper}"${onClickAttr}>
            <div class="cal-cell-top${extraClassTop}" style="${cellStyle}">
                ${circleContent}
            </div>
            <div class="cal-cell-bottom" style="${dateStyle}">
                ${dateContent}
                ${markerHtml}
            </div>
        </div>
        `;
    }

    grid.innerHTML = html;

    // Render donut stats dummy
    const statsContainer = document.getElementById('mood-count-stats');
    if (statsContainer) {
        // Daylio-style mood faces with small count badges
        const primaryMoodKeys = ['rad', 'good', 'meh', 'bad', 'awful'];
        const chipsHtml = primaryMoodKeys.map(key => {
            const def = getMoodByKey(key);
            if (!def) return '';
            const info = moodCounts[key];
            const count = info ? info.count : 0;
            const isActive = count > 0;
            const bgStyle = isActive ? `background: ${def.color};` : '';
            return `
            <div class="mood-count-chip">
                <div class="mood-count-face" style="${bgStyle}">
                    <span>${def.emoji}</span>
                </div>
                ${isActive ? `<div class="mood-count-badge">${count}</div>` : ''}
            </div>
            `;
        }).join('');

        statsContainer.innerHTML = `
            <div class="mood-count-row">
                ${chipsHtml}
            </div>
        `;

        // Update dynamic donut arc
        const donutValue = document.querySelector('.mood-donut-value');
        if (donutValue) donutValue.innerHTML = `<span style="font-size: 2rem; font-weight: 800">${totalEntries}</span><br><span style="font-size:0.7rem; color:var(--text-sub)">entries</span>`;

        const donutArc = document.querySelector('.mood-donut-arc');
        if (donutArc) {
            if (totalEntries === 0) {
                // Return to static empty state
                donutArc.style.background = `conic-gradient(from 270deg, rgba(255,255,255,0.05) 0deg 180deg, transparent 180deg)`;
            } else {
                let currentDeg = 0;
                const segments = [];
                // Use the same order as segments: rad, good, meh, bad, awful
                const keys = ['rad', 'good', 'meh', 'bad', 'awful'];

                keys.forEach(key => {
                    const count = moodCounts[key] ? moodCounts[key].count : 0;
                    if (count > 0) {
                        const deg = (count / totalEntries) * 180;
                        const mood = getMoodByKey(key);
                        segments.push(`${mood.color} ${currentDeg}deg ${currentDeg + deg}deg`);
                        currentDeg += deg;
                    }
                });

                // Add background for remaining 180 if needed (though total should be 180)
                if (currentDeg < 180) {
                    segments.push(`rgba(255,255,255,0.05) ${currentDeg}deg 180deg`);
                }

                donutArc.style.background = `conic-gradient(from 270deg, ${segments.join(', ')}, transparent 180deg)`;
            }
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions to window for onclick handlers
window.renderActivityGrid = renderActivityGrid;
window.renderEmotionGrid = renderEmotionGrid;
window.openQuickMoodSelector = openQuickMoodSelector;
window.closeQuickMoodModal = closeQuickMoodModal;
window.selectQuickMood = selectQuickMood;
window.toggleFabMenu = toggleFabMenu;
window.switchTab = switchTab;
window.openMonthPicker = openMonthPicker;
window.closeMonthPicker = closeMonthPicker;
window.setFeedFilter = setFeedFilter;
window.navigateMonth = navigateMonth;
window.toggleYearStatsView = toggleYearStatsView;
window.navigateYear = navigateYear;
window.toggleYearMoodDropdown = toggleYearMoodDropdown;
window.selectYearMood = selectYearMood;
window.confirmLeaveOrganization = confirmLeaveOrganization;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.copyMemberInviteCode = copyMemberInviteCode;
window.openGoalsModal = openGoalsModal;
window.closeGoalsModal = closeGoalsModal;
window.openImportantDaysModal = openImportantDaysModal;
window.closeImportantDaysModal = closeImportantDaysModal;
window.openRemindersSettings = openRemindersSettings;
window.closeRemindersSettings = closeRemindersSettings;
window.openMoodEdit = openMoodEdit;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;
window.openThemeSelector = openThemeSelector;
window.openDayDetails = openDayDetails;
window.closeDayDetails = closeDayDetails;
window.openMoodModal = openMoodModal;
window.closeMoodModal = closeMoodModal;
window.onDateInputChange = onDateInputChange;
window.resetDayFilter = resetDayFilter;
window.copyAdminCode = copyAdminCode;

// ─── Auto-hide header on scroll ─────────────────────────────────
let lastScrollY = 0;
let scrollDirection = 0; // -1 = up, 1 = down
let ticking = false;

function handleScroll() {
    const currentScrollY = window.scrollY;
    const topbar = document.querySelector('.topbar');
    const orgBar = document.querySelector('.org-bar');

    if (!topbar || !orgBar) return;

    const scrollDelta = currentScrollY - lastScrollY;
    const scrollThreshold = 5; // Minimum scroll to trigger

    // Determine scroll direction
    if (Math.abs(scrollDelta) > scrollThreshold) {
        scrollDirection = scrollDelta > 0 ? 1 : -1;
    }

    // Get actual heights
    const topbarHeight = topbar.offsetHeight;
    const orgBarHeight = orgBar.offsetHeight;
    const totalHeight = topbarHeight + orgBarHeight;

    // Calculate smooth transform based on scroll position
    if (currentScrollY < 10) {
        // At top - always show
        topbar.style.transform = 'translateY(0)';
        orgBar.style.transform = 'translateY(0)';
    } else if (scrollDirection === 1 && currentScrollY > 60) {
        // Scrolling down - hide completely
        topbar.style.transform = `translateY(-${topbarHeight}px)`;
        orgBar.style.transform = `translateY(-${totalHeight}px)`;
    } else if (scrollDirection === -1) {
        // Scrolling up - show
        topbar.style.transform = 'translateY(0)';
        orgBar.style.transform = 'translateY(0)';
    }

    lastScrollY = currentScrollY;
    ticking = false;
}

function requestScrollTick() {
    if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
    }
}

window.addEventListener('scroll', requestScrollTick, { passive: true });




// ─── Year Stats Dropdown Handler ────────────────────────────────
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('year-mood-dropdown');
    const btn = document.getElementById('year-mood-btn');

    if (dropdown && btn && dropdown.classList.contains('open')) {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('open');
            btn.classList.remove('open');
        }
    }
});

// ─── Handle Android Back Button for Year Stats Overlay ──────────
window.addEventListener('popstate', () => {
    const overlay = document.getElementById('year-stats-overlay');
    if (overlay && overlay.classList.contains('open')) {
        toggleYearStatsView();
    }
});


// ─── More Tab Modal Functions ───────────────────────────────────
function openCustomizeEmotions() {
    openMoodEdit();
    // Switch to emotions tab
    setTimeout(() => {
        const emotionsTab = document.querySelector('[data-tab="moods"]');
        if (emotionsTab) emotionsTab.click();
    }, 100);
}

function openCustomizeActivities() {
    openMoodEdit();
    // Switch to activities tab
    setTimeout(() => {
        const activitiesTab = document.querySelector('[data-tab="activities"]');
        if (activitiesTab) activitiesTab.click();
    }, 100);
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');

        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
}

function openAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) {
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');

        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
}

function openRemindersSettings() {
    const modal = document.getElementById('reminders-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeRemindersSettings() {
    const modal = document.getElementById('reminders-modal');
    if (modal) {
        const overlay = modal.querySelector('.mood-modal-overlay');
        const sheet = modal.querySelector('.mood-modal-sheet');
        if (overlay) overlay.classList.add('closing');
        if (sheet) sheet.classList.add('closing');

        setTimeout(() => {
            modal.classList.remove('open');
            if (overlay) overlay.classList.remove('closing');
            if (sheet) sheet.classList.remove('closing');
            document.body.style.overflow = '';
        }, 300);
    }
}


// ─── Update Team Header ─────────────────────────────────────────
function updateTeamHeader() {
    const orgNameEl = document.getElementById('team-org-name');
    const onlineCountEl = document.getElementById('team-online-count');
    const totalCountEl = document.getElementById('team-total-count');

    if (orgNameEl) {
        const cachedOrgName = localStorage.getItem('psyc_orgName');
        orgNameEl.textContent = cachedOrgName || 'Organization';
    }

    if (onlineCountEl && totalCountEl) {
        const members = Array.from(membersMap.values());
        const onlineCount = members.filter(m => m.isOnline).length;
        onlineCountEl.textContent = onlineCount;
        totalCountEl.textContent = members.length;
    }
}


// Listen for org settings updates (for members can invite feature)
socket.on('org:settings-updated', (data) => {
    console.log('Org settings updated:', data);

    // Update member invite section if user is not admin
    const userDoc = Array.from(membersMap.values()).find(m => m.uid === currentUser?.uid);
    if (userDoc && userDoc.role !== 'admin') {
        const section = document.getElementById('member-invite-section');
        const codeEl = document.getElementById('member-invite-code');

        if (section && codeEl) {
            if (data.membersCanInvite && data.memberInviteCode) {
                section.classList.remove('hidden');
                codeEl.textContent = data.memberInviteCode;
                showToast('Group invite is now enabled!', '✓');
            } else {
                section.classList.add('hidden');
                showToast('Group invite has been disabled', 'ℹ️');
            }
        }
    }
});

// Listen for member leaving organization
socket.on('member:left', (data) => {
    console.log('Member left:', data);

    // Remove member from membersMap
    if (membersMap.has(data.uid)) {
        membersMap.delete(data.uid);
        renderTeamGrid();
        updateTeamHeader();
        showToast(`${data.name} left the organization`, '👋');
    }
});


// ─── Leave Organization Functions ──────────────────────────────────
function confirmLeaveOrganization() {
    if (!confirm('Are you sure you want to leave this organization? You will lose access to all team data.')) {
        return;
    }
    leaveOrganization();
}

async function leaveOrganization() {
    try {
        if (!currentUser) {
            showToast('Please log in first', '⚠️');
            return;
        }

        const token = await currentUser.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');

        if (!orgId) {
            showToast('No organization found', '⚠️');
            return;
        }

        const res = await fetch('/api/org/leave', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orgId })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to leave organization');
        }

        showToast('Successfully left organization', '✅');

        // Clear local storage
        localStorage.removeItem('psyc_orgId');
        localStorage.removeItem('psyc_orgName');

        // Disconnect socket
        if (socket) {
            socket.disconnect();
        }

        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);

    } catch (err) {
        console.error('Leave organization error:', err);
        showToast(err.message || 'Failed to leave organization', '❌');
    }
}

// ─── Notification Center logic ──────────────────────────────────────

async function fetchNotifications(user) {
    if (!user) return;
    try {
        const token = await user.getIdToken();
        const orgId = localStorage.getItem('psyc_orgId');
        if (!orgId) return;

        const res = await fetch(`/api/notifications/list?orgId=${orgId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            console.log('Notifications endpoint not available');
            return;
        }
        
        const data = await res.json();

        if (data.success) {
            notificationLogs = data.notifications || [];
            renderNotificationLogs();
        }
    } catch (err) {
        console.log('Notifications not configured:', err.message);
    }
}

function renderNotificationLogs() {
    const listEl = document.getElementById('notification-logs-list');
    if (!listEl) return;

    if (notificationLogs.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 15px 0; font-size: 0.9rem;" data-i18n="no_notifications">
                ${t('no_notifications')}
            </div>`;
        return;
    }

    listEl.innerHTML = notificationLogs.map(notif => {
        const timeStr = getTimeAgo(notif.timestamp);
        const icon = notif.type === 'goal' ? '🎯' : (notif.type === 'important_day' ? '⭐' : '🔔');
        const bgColor = notif.type === 'goal' ? 'rgba(139, 92, 246, 0.1)' : (notif.type === 'important_day' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)');

        return `
            <div class="notification-item" style="
                display: flex; 
                gap: 12px; 
                padding: 10px; 
                background: white; 
                border-radius: 10px; 
                border: 1px solid rgba(0,0,0,0.05);
                animation: slideIn 0.3s ease-out;
            ">
                <div style="
                    width: 36px; 
                    height: 36px; 
                    border-radius: 8px; 
                    background: ${bgColor}; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 1.2rem;
                    flex-shrink: 0;
                ">
                    ${icon}
                </div>
                <div style="flex: 1; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text);">${notif.title}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${timeStr}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">${notif.body}</div>
                    <div style="font-size: 0.75rem; color: var(--accent-primary); margin-top: 4px; font-weight: 500;">
                        by ${notif.userName}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Global socket listener for notifications (defined outside connectSocket if needed, but usually inside is fine)
// However, since app.js structure defines it inside connectSocket usually, let's append to connectSocket or use a global one
// Based on current app.js, socket events are added inside connectSocket.
// I will add the listener there instead.
