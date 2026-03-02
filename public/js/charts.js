// ─── Stats Charts & History ─────────────────────────────────────
// Loaded after app.js — uses MOODS, currentUser, escapeHtml from app.js

let distChart = null, trendChart = null, actChart = null, moodChart = null;

async function loadStatsCharts() {
    if (!currentUser) return;
    try {
        const token = await currentUser.getIdToken();

        // Fetch and render personal streak first
        renderStreak(token);

        // Use the same endpoint as calendar (user's personal logs)
        const res = await fetch('/api/user/calendar-logs', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
            console.error('Failed to fetch calendar logs:', res.status);
            return;
        }

        const data = await res.json();
        console.log('=== STATS DATA FROM API ===');
        console.log('Full API response:', data);
        console.log('Number of logs:', data.logs?.length);
        console.log('First log sample:', data.logs?.[0]);
        console.log('Has activity field?', data.logs?.[0]?.activity !== undefined);
        console.log('===========================');

        if (!data.logs || data.logs.length === 0) {
            console.log('No mood logs available for charts');
            return;
        }

        renderMoodChart(data.logs);
        renderMoodDistChart(data.logs);
        await renderActivityChart(data.logs);

        // Month in Pixels initialization
        allLogsForMonthView = data.logs;
        renderMonthPixels();
    } catch (err) {
        console.error('Chart error:', err);
    }
}

let currentMonthView = new Date().getMonth();
let currentYearForMonthView = new Date().getFullYear();
let allLogsForMonthView = [];

function navigateMonth(delta) {
    currentMonthView += delta;
    if (currentMonthView > 11) {
        currentMonthView = 0;
        currentYearForMonthView++;
    } else if (currentMonthView < 0) {
        currentMonthView = 11;
        currentYearForMonthView--;
    }

    // Disable next button if it's the current month/year
    const now = new Date();
    const nextBtn = document.getElementById('month-next-btn');
    if (nextBtn) {
        nextBtn.disabled = (currentYearForMonthView === now.getFullYear() && currentMonthView >= now.getMonth()) || (currentYearForMonthView > now.getFullYear());
    }

    renderMonthPixels();
}

function renderMonthPixels() {
    const grid = document.getElementById('month-pixels-grid');
    const title = document.getElementById('month-display-title');
    if (!grid || !title) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    title.textContent = `${monthNames[currentMonthView]} ${currentYearForMonthView}`;

    // Clear grid
    grid.innerHTML = '';

    // Calculate days in month and starting day
    const firstDay = new Date(currentYearForMonthView, currentMonthView, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(currentYearForMonthView, currentMonthView + 1, 0).getDate();

    // Map logs for the view
    const dateMap = {};
    allLogsForMonthView.forEach(log => {
        const d = new Date(log.timestamp);
        if (d.getMonth() === currentMonthView && d.getFullYear() === currentYearForMonthView) {
            const dateKey = d.getDate();
            if (!dateMap[dateKey]) dateMap[dateKey] = [];
            dateMap[dateKey].push(log);
        }
    });

    // Add empty pixels for offset
    for (let i = 0; i < startDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'month-pixel empty';
        grid.appendChild(empty);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'month-pixel-wrapper';

        const pixel = document.createElement('div');
        pixel.className = 'month-pixel';

        const logs = dateMap[day] || [];
        if (logs.length > 0) {
            // Get last log of the day for mood
            const lastLog = logs.sort((a, b) => b.timestamp - a.timestamp)[0];
            const moodObj = getMoodByKey(lastLog.mood);
            pixel.className += ' has-mood';
            pixel.style.setProperty('--pixel-color', moodObj?.color || '#8b5cf6');
            pixel.textContent = moodObj?.emoji || '😊';
        } else {
            pixel.textContent = '';
        }

        const label = document.createElement('span');
        label.className = 'month-pixel-day';
        label.textContent = day;

        wrapper.appendChild(pixel);
        wrapper.appendChild(label);
        grid.appendChild(wrapper);
    }
}

async function renderStreak(token) {
    try {
        const res = await fetch('/api/user/calendar-logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.logs) {
            calculateAndDrawStreak(data.logs);
        }
    } catch (err) {
        console.error('Streak error:', err);
    }
}

function calculateAndDrawStreak(logs) {
    const daysSet = new Set();
    logs.forEach(log => {
        const d = new Date(log.timestamp);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        daysSet.add(dateStr);
    });

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const streakDaysUI = document.getElementById('streak-days');
    if (streakDaysUI) {
        let html = '';
        for (let i = 4; i >= 0; i--) {
            const d = new Date(todayDate);
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const hasLog = daysSet.has(dateStr);

            let dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

            if (hasLog) {
                html += `
                <div class="streak-day-item">
                    <div class="streak-circle filled"><i class="bi bi-check-lg" style="font-size: 1.1rem; -webkit-text-stroke: 1px;"></i></div>
                    <span class="streak-day-label">${dayName}</span>
                </div>`;
            } else {
                html += `
                <div class="streak-day-item clickable" onclick="openQuickMoodSelector(${d.getTime()})">
                    <div class="streak-circle empty"><i class="bi bi-plus" style="font-size: 1.4rem;"></i></div>
                    <span class="streak-day-label">${dayName}</span>
                </div>`;
            }
        }
        streakDaysUI.innerHTML = html;
    }

    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    // Calculate Longest Streak
    const chronoDates = Array.from(daysSet).sort();
    for (let i = 0; i < chronoDates.length; i++) {
        const parts = chronoDates[i].split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!previousDate) {
            tempStreak = 1;
        } else {
            const diffTime = Math.abs(d - previousDate);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        previousDate = d;
    }

    // Calculate Current Streak
    let currentStreak = 0;
    let checkDate = new Date(todayDate);

    let dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (!daysSet.has(dateStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    }

    while (daysSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    }

    const currentPill = document.getElementById('current-streak-count');
    if (currentPill) currentPill.textContent = currentStreak || 0;

    const longestCount = document.getElementById('longest-streak-count');
    if (longestCount) longestCount.textContent = longestStreak || 0;
}

function renderMoodChart(logs) {
    if (!logs || logs.length === 0) {
        console.log('No logs to render mood chart');
        return;
    }

    // Mood hierarchy (5 = rad/best, 1 = awful/worst)
    // Map all possible mood keys to their levels
    const moodScores = {
        'rad': 5,
        'good': 4,
        'meh': 3,
        'bad': 2,
        'awful': 1,
        // Legacy/alternative keys
        'happy': 5,
        'excited': 5,
        'chill': 4,
        'focused': 4,
        'tired': 3,
        'stressed': 2,
        'sad': 2,
        'angry': 1
    };

    // Group logs by date
    const dateMap = {};

    logs.forEach(l => {
        const d = new Date(l.timestamp);
        const dateKey = d.getDate();

        if (!dateMap[dateKey]) {
            dateMap[dateKey] = [];
        }
        dateMap[dateKey].push({
            mood: l.mood,
            score: moodScores[l.mood] || 3,
            timestamp: l.timestamp
        });
    });

    // Get last 7 days
    const labels = [];
    const dataPoints = [];
    const moodEmojis = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.getDate();
        labels.push(dateKey);

        if (dateMap[dateKey] && dateMap[dateKey].length > 0) {
            // Get the most recent mood for that day
            const dayMoods = dateMap[dateKey].sort((a, b) => b.timestamp - a.timestamp);
            const latestMood = dayMoods[0];
            dataPoints.push(latestMood.score);
            const moodObj = getMoodByKey(latestMood.mood);
            moodEmojis.push(moodObj?.emoji || '😐');
        } else {
            dataPoints.push(null);
            moodEmojis.push(null);
        }
    }

    if (moodChart) moodChart.destroy();
    const ctx = document.getElementById('mood-chart');
    if (!ctx) return;

    moodChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Mood',
                data: dataPoints,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#8b5cf6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3,
                segment: {
                    borderColor: ctx => {
                        // Color segments based on mood level
                        const score = ctx.p1.parsed.y;
                        if (score >= 4.5) return '#a8e6a1'; // Rad - green
                        if (score >= 3.5) return '#ffd93d'; // Good - yellow
                        if (score >= 2.5) return '#ffb4a2'; // Meh - orange
                        if (score >= 1.5) return '#ff6b9d'; // Bad - pink
                        return '#95a5a6'; // Awful - gray
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.5)',
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        padding: 8
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.06)',
                        drawBorder: false
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(0, 0, 0, 0.5)',
                        font: { size: 20 },
                        padding: 10,
                        callback: function (value) {
                            // Show mood emojis on Y-axis: rad, good, meh, bad, awful
                            const moodMap = {
                                5: getMoodByKey('rad')?.emoji || '😄',
                                4: getMoodByKey('good')?.emoji || '🙂',
                                3: getMoodByKey('meh')?.emoji || '😐',
                                2: getMoodByKey('bad')?.emoji || '😔',
                                1: getMoodByKey('awful')?.emoji || '😢'
                            };
                            return moodMap[value] || '';
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        drawBorder: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function (context) {
                            return `Day ${context[0].label}`;
                        },
                        label: function (context) {
                            const idx = context.dataIndex;
                            const emoji = moodEmojis[idx];
                            if (!emoji) return 'No mood logged';

                            const score = context.parsed.y;
                            let moodName = '';
                            if (score >= 4.5) moodName = 'Rad';
                            else if (score >= 3.5) moodName = 'Good';
                            else if (score >= 2.5) moodName = 'Meh';
                            else if (score >= 1.5) moodName = 'Bad';
                            else moodName = 'Awful';

                            return `${emoji} ${moodName}`;
                        }
                    }
                }
            }
        }
    });
}

function renderMoodDistChart(logs) {
    const counts = {};
    logs.forEach(l => { counts[l.mood] = (counts[l.mood] || 0) + 1; });
    const labels = [], values = [], colors = [];

    // Always show all 5 primary moods
    MOODS.forEach(m => {
        labels.push(`${m.emoji} ${m.label}`);
        values.push(counts[m.key] || 0);
        colors.push(m.color);
    });

    if (distChart) distChart.destroy();
    const ctx = document.getElementById('mood-dist-chart');
    if (!ctx) return;
    distChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
        options: {
            responsive: true, maintainAspectRatio: true, cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { color: 'rgba(0, 0, 0, 0.6)', font: { size: 11, weight: '600' }, padding: 12 } },
            },
        },
    });
}

function renderMoodTrendChart(logs) {
    const moodScore = { happy: 5, excited: 5, chill: 4, focused: 4, tired: 2, stressed: 2, sad: 1, angry: 1 };
    const dayMap = {};
    logs.forEach(l => {
        const d = new Date(l.timestamp);
        const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!dayMap[key]) dayMap[key] = [];
        dayMap[key].push(moodScore[l.mood] || 3);
    });
    const labels = Object.keys(dayMap).reverse();
    const avgScores = labels.map(k => {
        const arr = dayMap[k];
        return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    });
    if (trendChart) trendChart.destroy();
    const ctx = document.getElementById('mood-trend-chart');
    if (!ctx) return;
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Avg Mood Score', data: avgScores,
                borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.1)',
                fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#2ecc71',
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            scales: {
                y: { min: 0, max: 5, ticks: { color: '#6a6a88', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' } },
                x: { ticks: { color: '#6a6a88', font: { size: 10 } }, grid: { display: false } },
            },
            plugins: { legend: { labels: { color: '#9e9eb8' } } },
        },
    });
}

async function renderActivityChart(logs) {
    console.log('=== ACTIVITY CHART DEBUG ===');
    console.log('renderActivityChart called with logs:', logs);

    // Load activities to get emoji mapping
    let activities = [];
    try {
        const res = await fetch('/assets/default-activities.json');
        const data = await res.json();
        activities = data.activities || [];
        console.log('Loaded activities:', activities);
    } catch (err) {
        console.error('Failed to load activities', err);
    }

    // Try to get custom activities from localStorage
    const customActivities = localStorage.getItem('psyc_activities');
    if (customActivities) {
        try {
            activities = JSON.parse(customActivities);
            console.log('Using custom activities:', activities);
        } catch (err) {
            console.error('Failed to parse custom activities', err);
        }
    }

    const actCount = {};
    logs.forEach(l => {
        console.log('Log entry:', l);
        console.log('Activity field:', l.activity);
        if (l.activity) {
            // Split by comma and trim
            const acts = l.activity.split(',').map(a => a.trim()).filter(a => a);
            console.log('Parsed activities:', acts);
            acts.forEach(a => {
                actCount[a] = (actCount[a] || 0) + 1;
            });
        }
    });

    console.log('Final activity counts:', actCount);
    console.log('Number of unique activities:', Object.keys(actCount).length);

    const sorted = Object.entries(actCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (sorted.length === 0) {
        console.log('❌ No activities to display - hiding chart');
        const card = document.getElementById('top-activities-card');
        if (card) {
            card.style.display = 'none';
        }
        return;
    }

    console.log('✅ Top activities to display:', sorted);

    // Show the card
    const card = document.getElementById('top-activities-card');
    if (card) {
        card.style.display = 'block';
    }

    // Map activity labels to emojis
    const labels = sorted.map(s => {
        const activity = activities.find(a => a.label === s[0]);
        const emoji = activity ? activity.emoji : '📊';
        console.log(`Mapping "${s[0]}" to emoji:`, emoji, activity);
        return emoji;
    });

    console.log('Final labels (emojis):', labels);

    if (actChart) actChart.destroy();
    const ctx = document.getElementById('activity-chart');
    if (!ctx) {
        console.error('❌ Canvas element not found');
        return;
    }

    console.log('Creating chart with data:', {
        labels,
        values: sorted.map(s => s[1])
    });

    actChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: sorted.map(s => s[1]),
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: '#8b5cf6',
                borderWidth: 1,
                borderRadius: 8
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.5)',
                        stepSize: 1,
                        precision: 0
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.06)' }
                },
                y: {
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.5)',
                        font: { size: 20 }
                    },
                    grid: { display: false }
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function (context) {
                            const idx = context[0].dataIndex;
                            const activityLabel = sorted[idx][0];
                            const activity = activities.find(a => a.label === activityLabel);
                            return activity ? `${activity.emoji} ${activity.label}` : activityLabel;
                        },
                        label: function (context) {
                            return `Count: ${context.parsed.x}`;
                        }
                    }
                }
            },
        },
    });

    console.log('✅ Activity chart rendered successfully');
    console.log('=== END ACTIVITY CHART DEBUG ===');
}


// ─── Year Statistics Functions ──────────────────────────────────

let yearMoodChart = null;
let yearMoodDistChart = null;
let currentYearFilter = 'average';
let yearLogsData = [];
let currentYearView = new Date().getFullYear();
let allYearLogs = []; // Store all logs for year navigation

async function loadYearStats() {
    if (!currentUser) return;
    try {
        const token = await currentUser.getIdToken();

        // Fetch all logs (not filtered by year)
        const res = await fetch('/api/user/calendar-logs', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
            console.error('Failed to fetch year logs:', res.status);
            return;
        }

        const data = await res.json();

        if (!data.logs || data.logs.length === 0) {
            console.log('No mood logs available for year stats');
            return;
        }

        // Store all logs
        allYearLogs = data.logs;

        // Filter logs for current year view
        yearLogsData = allYearLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.getFullYear() === currentYearView;
        });

        console.log('Year logs loaded:', yearLogsData.length, 'for year', currentYearView);

        updateYearNavigation();
        renderYearPixels();
        renderYearMoodChart();
        renderYearMoodDistChart();
    } catch (err) {
        console.error('Year stats error:', err);
    }
}

function navigateYear(delta) {
    console.log('navigateYear called with delta:', delta);
    console.log('currentYearView:', currentYearView);
    console.log('allYearLogs:', allYearLogs.length);

    const newYear = currentYearView + delta;
    const currentYear = new Date().getFullYear();

    console.log('newYear:', newYear, 'currentYear:', currentYear);

    // Don't allow future years
    if (newYear > currentYear) {
        console.log('Blocked: Future year');
        return;
    }

    // Check if there are logs for the new year
    const hasLogsForYear = allYearLogs.some(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getFullYear() === newYear;
    });

    console.log('hasLogsForYear:', hasLogsForYear);

    // Don't allow navigation to years without logs (for past years)
    if (newYear < currentYear && !hasLogsForYear) {
        console.log('Blocked: No logs for past year');
        return;
    }

    currentYearView = newYear;
    console.log('Navigating to year:', currentYearView);

    // Filter logs for new year
    yearLogsData = allYearLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getFullYear() === currentYearView;
    });

    console.log('Filtered logs:', yearLogsData.length);

    updateYearNavigation();
    renderYearPixels();
    renderYearMoodChart();
    renderYearMoodDistChart();
}

function updateYearNavigation() {
    const titleEl = document.getElementById('year-stats-title');
    const prevBtn = document.getElementById('year-prev-btn');
    const nextBtn = document.getElementById('year-next-btn');

    if (titleEl) {
        titleEl.textContent = currentYearView;
    }

    const currentYear = new Date().getFullYear();

    // Check if there are logs in previous years
    const hasPreviousYearLogs = allYearLogs.some(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getFullYear() < currentYearView;
    });

    // Disable prev button if no logs in previous years
    if (prevBtn) {
        prevBtn.disabled = !hasPreviousYearLogs;
    }

    // Disable next button if current year is the latest year
    if (nextBtn) {
        nextBtn.disabled = currentYearView >= currentYear;
    }
}

function toggleYearMoodDropdown() {
    const dropdown = document.getElementById('year-mood-dropdown');
    const btn = document.getElementById('year-mood-btn');

    if (dropdown && btn) {
        dropdown.classList.toggle('open');
        btn.classList.toggle('open');
    }
}

function selectYearMood(moodType) {
    currentYearFilter = moodType;

    const emojiEl = document.getElementById('year-selected-mood-emoji');
    const labelEl = document.getElementById('year-selected-mood-label');

    if (moodType === 'average') {
        if (emojiEl) emojiEl.textContent = '😊';
        if (labelEl) {
            const count = yearLogsData.length;
            labelEl.textContent = `average mood (${count}×)`;
        }
    } else {
        const moodObj = getMoodByKey(moodType);
        if (emojiEl) emojiEl.textContent = moodObj?.emoji || '😊';

        const count = yearLogsData.filter(log => log.mood === moodType).length;
        if (labelEl) labelEl.textContent = `${moodObj?.label || moodType} (${count}×)`;
    }

    toggleYearMoodDropdown();
    renderYearPixels();
}

function renderYearPixels() {
    const grid = document.getElementById('year-pixels-grid');
    const summary = document.getElementById('year-mood-summary');

    if (!grid || !summary) return;

    // Create a map of dates to moods
    const dateMap = {};
    yearLogsData.forEach(log => {
        const d = new Date(log.timestamp);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        if (!dateMap[dateKey]) {
            dateMap[dateKey] = [];
        }
        dateMap[dateKey].push(log);
    });

    console.log('Year Pixels Debug:', {
        currentYearView,
        totalLogs: yearLogsData.length,
        dateMapSize: Object.keys(dateMap).length,
        sampleDates: Object.keys(dateMap).slice(0, 5)
    });

    // Build the grid (31 rows x 12 months)
    let html = '';

    for (let day = 1; day <= 31; day++) {
        html += '<div class="year-pixels-row">';
        html += `<div class="year-pixels-day-label">${day}</div>`;

        for (let month = 0; month < 12; month++) {
            // Get the actual number of days in this month
            const daysInMonth = new Date(currentYearView, month + 1, 0).getDate();

            // If this day doesn't exist in this month, show empty (hidden) dot
            if (day > daysInMonth) {
                html += '<div class="year-pixel empty"></div>';
                continue;
            }

            const dateKey = `${currentYearView}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const logsForDay = dateMap[dateKey] || [];

            // Determine pixel color based on filter
            let pixelColor = '#4a4a5e';
            let shouldShow = false;

            if (logsForDay.length > 0) {
                if (currentYearFilter === 'average') {
                    // Show average mood color
                    const moodScores = {
                        'rad': 5, 'good': 4, 'meh': 3, 'bad': 2, 'awful': 1
                    };

                    const avgScore = logsForDay.reduce((sum, log) => {
                        return sum + (moodScores[log.mood] || 3);
                    }, 0) / logsForDay.length;

                    if (avgScore >= 4.5) pixelColor = '#a8e6a1';
                    else if (avgScore >= 3.5) pixelColor = '#ffd93d';
                    else if (avgScore >= 2.5) pixelColor = '#ffb4a2';
                    else if (avgScore >= 1.5) pixelColor = '#ff6b9d';
                    else pixelColor = '#95a5a6';

                    shouldShow = true;
                } else {
                    // Show specific mood
                    const hasMood = logsForDay.some(log => log.mood === currentYearFilter);
                    if (hasMood) {
                        const moodObj = getMoodByKey(currentYearFilter);
                        pixelColor = moodObj?.color || '#4a4a5e';
                        shouldShow = true;
                    }
                }
            }

            if (shouldShow) {
                html += `<div class="year-pixel has-mood" style="--pixel-color: ${pixelColor}" data-date="${dateKey}"></div>`;
            } else {
                // Show gray dot for all valid days (past, present, and future)
                html += '<div class="year-pixel"></div>';
            }
        }

        html += '</div>';
    }

    grid.innerHTML = html;

    // Render mood summary
    const moodCounts = {
        'rad': 0, 'good': 0, 'meh': 0, 'bad': 0, 'awful': 0
    };

    yearLogsData.forEach(log => {
        if (moodCounts[log.mood] !== undefined) {
            moodCounts[log.mood]++;
        }
    });

    const moods = ['rad', 'good', 'meh', 'bad', 'awful'];
    let summaryHtml = '';

    moods.forEach(moodKey => {
        const moodObj = getMoodByKey(moodKey);
        const count = moodCounts[moodKey];
        const isHighlighted = currentYearFilter === moodKey ? 'highlighted' : '';

        summaryHtml += `
            <div class="year-mood-count ${isHighlighted}" onclick="selectYearMood('${moodKey}')">
                <div class="year-mood-count-value">${count}</div>
                <div class="year-mood-count-emoji">${moodObj?.emoji || '😊'}</div>
            </div>
        `;
    });

    summary.innerHTML = summaryHtml;
}

function renderYearMoodChart() {
    const ctx = document.getElementById('year-mood-chart');
    if (!ctx) return;

    // Group logs by month
    const monthlyData = Array(12).fill(0).map(() => []);

    yearLogsData.forEach(log => {
        const d = new Date(log.timestamp);
        const month = d.getMonth();
        monthlyData[month].push(log);
    });

    // Calculate average mood score per month
    const moodScores = {
        'rad': 5, 'good': 4, 'meh': 3, 'bad': 2, 'awful': 1
    };

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const avgScores = monthlyData.map(logs => {
        if (logs.length === 0) return null;
        const sum = logs.reduce((acc, log) => acc + (moodScores[log.mood] || 3), 0);
        return sum / logs.length;
    });

    // Count months with data
    const monthsWithData = avgScores.filter(score => score !== null).length;
    const hintEl = document.getElementById('year-chart-hint');
    if (hintEl) {
        if (monthsWithData === 0) {
            hintEl.textContent = 'No mood data for this year yet';
        } else if (monthsWithData === 1) {
            hintEl.textContent = 'Data available for 1 month';
        } else {
            hintEl.textContent = `Data available for ${monthsWithData} months`;
        }
    }

    if (yearMoodChart) yearMoodChart.destroy();

    yearMoodChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Average Mood',
                data: avgScores,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: (context) => {
                    // Only show points for months with data
                    return context.parsed.y !== null ? 6 : 0;
                },
                pointHoverRadius: 8,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                spanGaps: false, // Don't connect across null values
                segment: {
                    borderColor: ctx => {
                        // Don't draw line segments where data is null
                        if (ctx.p0.parsed.y === null || ctx.p1.parsed.y === null) {
                            return 'transparent';
                        }
                        const score = ctx.p1.parsed.y;
                        if (score >= 4.5) return '#a8e6a1';
                        if (score >= 3.5) return '#ffd93d';
                        if (score >= 2.5) return '#ffb4a2';
                        if (score >= 1.5) return '#ff6b9d';
                        return '#95a5a6';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        color: (context) => {
                            // Highlight months with data
                            const monthIndex = context.index;
                            const hasData = avgScores[monthIndex] !== null;
                            return hasData ? 'rgba(139, 92, 246, 0.8)' : 'rgba(158, 158, 184, 0.4)';
                        },
                        font: { 
                            size: 12, 
                            weight: (context) => {
                                const monthIndex = context.index;
                                const hasData = avgScores[monthIndex] !== null;
                                return hasData ? '700' : '400';
                            }
                        },
                        padding: 8
                    },
                    grid: {
                        display: true,
                        color: 'rgba(255,255,255,0.05)',
                        drawBorder: false
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        color: '#9e9eb8',
                        font: { size: 18 },
                        padding: 10,
                        callback: function (value) {
                            const moodMap = {
                                5: '😄',
                                4: '🙂',
                                3: '😐',
                                2: '😔',
                                1: '😢'
                            };
                            return moodMap[value] || '';
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        drawBorder: false
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            if (context.parsed.y === null) return 'No data';

                            const score = context.parsed.y;
                            let moodName = '';
                            if (score >= 4.5) moodName = '😄 Rad';
                            else if (score >= 3.5) moodName = '🙂 Good';
                            else if (score >= 2.5) moodName = '😐 Meh';
                            else if (score >= 1.5) moodName = '😔 Bad';
                            else moodName = '😢 Awful';

                            return `Average: ${moodName}`;
                        }
                    }
                }
            }
        }
    });
}

function renderYearMoodDistChart() {
    const ctx = document.getElementById('year-mood-dist-chart');
    if (!ctx) return;

    const counts = {};
    yearLogsData.forEach(l => {
        counts[l.mood] = (counts[l.mood] || 0) + 1;
    });

    const labels = [], values = [], colors = [];

    MOODS.forEach(m => {
        labels.push(`${m.emoji} ${m.label}`);
        values.push(counts[m.key] || 0);
        colors.push(m.color);
    });

    if (yearMoodDistChart) yearMoodDistChart.destroy();

    yearMoodDistChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9e9eb8',
                        font: { size: 11 },
                        padding: 12
                    }
                },
            },
        },
    });
}

// Export functions to window
window.loadYearStats = loadYearStats;
window.toggleYearMoodDropdown = toggleYearMoodDropdown;
window.selectYearMood = selectYearMood;
window.navigateYear = navigateYear;
window.navigateMonth = navigateMonth;
window.renderMonthPixels = renderMonthPixels;
