// ─── Admin Panel Functions ──────────────────────────────────────

let membersCanInvite = false;
let memberInviteCode = '';

// Toggle Consistency Intervals Section
function toggleConsistencyIntervals() {
    const content = document.getElementById('team-streak-pixels');
    const icon = document.getElementById('consistency-toggle-icon');
    
    if (content && icon) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('bi-chevron-right');
            icon.classList.add('bi-chevron-down');
            icon.style.transform = 'rotate(0deg)';
        } else {
            content.style.display = 'none';
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-right');
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

// Toggle Member Breakdown Section
function toggleMemberBreakdown() {
    const content = document.getElementById('member-stats-list');
    const icon = document.getElementById('breakdown-toggle-icon');
    
    if (content && icon) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('bi-chevron-right');
            icon.classList.add('bi-chevron-down');
            icon.style.transform = 'rotate(0deg)';
        } else {
            content.style.display = 'none';
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-right');
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

// Open Admin Panel
function openAdminPanel() {
    console.log('openAdminPanel called');
    const modal = document.getElementById('admin-panel-modal');
    console.log('Modal element:', modal);

    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        console.log('Modal opened, classes:', modal.className);

        // Load settings after modal is visible
        setTimeout(() => {
            loadAdminSettings();
        }, 100);
    } else {
        console.error('Admin panel modal not found!');
    }
}

// Close Admin Panel
function closeAdminPanel() {
    const modal = document.getElementById('admin-panel-modal');
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

// Load Admin Settings
async function loadAdminSettings() {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch('/api/org/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();

            // Update org code display
            const orgCodeEl = document.getElementById('admin-org-code');
            if (orgCodeEl && data.orgCode) {
                orgCodeEl.textContent = data.orgCode;
            }

            // Update members can invite toggle
            membersCanInvite = data.membersCanInvite || false;
            const toggle = document.getElementById('members-can-invite-toggle');
            if (toggle) {
                toggle.checked = membersCanInvite;
            }

            // Update member invite code
            memberInviteCode = data.memberInviteCode || '';
            updateMemberInviteSection();
        } else {
            // If API not available, use cached org code from localStorage
            const cachedOrgId = localStorage.getItem('psyc_orgId');
            const orgCodeEl = document.getElementById('admin-org-code');
            if (orgCodeEl && cachedOrgId) {
                orgCodeEl.textContent = cachedOrgId;
            }
        }
    } catch (err) {
        console.error('Error loading admin settings:', err);
        // Fallback: use cached org code
        const cachedOrgId = localStorage.getItem('psyc_orgId');
        const orgCodeEl = document.getElementById('admin-org-code');
        if (orgCodeEl && cachedOrgId) {
            orgCodeEl.textContent = cachedOrgId;
        }
    }
}

// Copy Admin Code
function copyAdminCode() {
    const codeEl = document.getElementById('admin-org-code');
    console.log('Copy button clicked, element:', codeEl);

    if (!codeEl) {
        console.error('Code element not found');
        showToast('Error: Code element not found', '⚠️');
        return;
    }

    const code = codeEl.textContent.trim();
    console.log('Code to copy:', code);

    if (!code || code === '------') {
        console.warn('No valid code to copy');
        showToast('No code available to copy', '⚠️');
        return;
    }

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code)
            .then(() => {
                console.log('Code copied successfully');
                showToast('Admin code copied!', '📋');
            })
            .catch(err => {
                console.error('Clipboard API failed:', err);
                // Fallback to old method
                fallbackCopy(code);
            });
    } else {
        // Fallback for older browsers
        fallbackCopy(code);
    }
}

// Fallback copy method
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            console.log('Fallback copy successful');
            showToast('Admin code copied!', '📋');
        } else {
            console.error('Fallback copy failed');
            showToast('Failed to copy code', '⚠️');
        }
    } catch (err) {
        console.error('Fallback copy error:', err);
        showToast('Failed to copy code', '⚠️');
    } finally {
        document.body.removeChild(textarea);
    }
}

// Copy Member Invite Code
function copyMemberInviteCode() {
    const codeEl = document.getElementById('member-invite-code');
    console.log('Copy member code clicked, element:', codeEl);

    if (!codeEl) {
        console.error('Member code element not found');
        showToast('Error: Code element not found', '⚠️');
        return;
    }

    const code = codeEl.textContent.trim();
    console.log('Member code to copy:', code);

    if (!code || code === '------') {
        console.warn('No valid member code to copy');
        showToast('No code available to copy', '⚠️');
        return;
    }

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code)
            .then(() => {
                console.log('Member code copied successfully');
                showToast('Group code copied!', '📋');
            })
            .catch(err => {
                console.error('Clipboard API failed:', err);
                fallbackCopy(code);
            });
    } else {
        fallbackCopy(code);
    }
}

// Toggle Members Can Invite
async function toggleMembersCanInvite(enabled) {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch('/api/org/settings/members-can-invite', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });

        if (res.ok) {
            const data = await res.json();
            membersCanInvite = enabled;
            memberInviteCode = data.memberInviteCode || '';
            updateMemberInviteSection();
            showToast(enabled ? 'Members can now invite others' : 'Member invites disabled', '✓');
        } else {
            showToast('Failed to update setting', '⚠️');
            // Revert toggle
            const toggle = document.getElementById('members-can-invite-toggle');
            if (toggle) toggle.checked = !enabled;
        }
    } catch (err) {
        console.error('Error toggling members can invite:', err);
        showToast('Error updating setting', '⚠️');
    }
}

// Update Member Invite Section Visibility
function updateMemberInviteSection() {
    const section = document.getElementById('member-invite-section');
    const codeEl = document.getElementById('member-invite-code');

    if (section && codeEl) {
        if (membersCanInvite && memberInviteCode) {
            section.classList.remove('hidden');
            codeEl.textContent = memberInviteCode;
        } else {
            section.classList.add('hidden');
        }
    }

    // Broadcast to all members via socket if available
    if (socket && socket.connected) {
        socket.emit('org:settings-updated', {
            membersCanInvite: membersCanInvite,
            memberInviteCode: memberInviteCode
        });
    }
}

// Open Manage Members
function openManageMembers() {
    const modal = document.getElementById('manage-members-modal');
    if (modal) {
        renderManageMembers();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

// Close Manage Members
function closeManageMembers() {
    const modal = document.getElementById('manage-members-modal');
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

// Render Manage Members List
function renderManageMembers() {
    const container = document.getElementById('members-list');
    if (!container) return;

    const members = Array.from(membersMap.values());
    const currentUserUid = currentUser?.uid;

    if (members.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No members found</p>';
        return;
    }

    container.innerHTML = members.map(member => {
        const isCurrentUser = member.uid === currentUserUid;
        const initial = (member.displayName || member.email || '?').charAt(0).toUpperCase();
        const isAdmin = member.role === 'admin' || member.role === 'owner';

        return `
            <div class="member-manage-card">
                <div class="member-manage-avatar"
                     ${member.photoURL ? `style="background-image: url(${member.photoURL}); background-size: cover;"` : ''}>
                    ${member.photoURL ? '' : initial}
                </div>
                <div class="member-manage-info">
                    <div class="member-manage-name">
                        ${member.displayName || member.email}
                        ${isCurrentUser ? ' <span style="font-size: 0.8rem; color: var(--accent-primary);">(You)</span>' : ''}
                    </div>
                    <div class="member-manage-role">${isAdmin ? '👑 Admin' : '👤 Member'}</div>
                </div>
                ${!isCurrentUser ? `
                    <div class="member-manage-actions">
                        ${!isAdmin ? `<button class="btn-make-admin" onclick="makeAdmin('${member.uid}')">Make Admin</button>` : ''}
                        <button class="btn-remove-member" onclick="removeMember('${member.uid}', '${(member.displayName || member.email).replace(/'/g, "\\'")}')">Remove</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Make Member Admin
async function makeAdmin(uid) {
    if (!confirm('Make this member an admin?')) return;

    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch('/api/org/make-admin', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid })
        });

        if (res.ok) {
            showToast('Member promoted to admin', '✓');
            // Update local member data
            const member = membersMap.get(uid);
            if (member) {
                member.role = 'admin';
                renderManageMembers();
                renderTeamGrid();
            }
        } else {
            showToast('Failed to make admin', '⚠️');
        }
    } catch (err) {
        console.error('Error making admin:', err);
        showToast('Error making admin', '⚠️');
    }
}

// Remove Member
async function removeMember(uid, name) {
    if (!confirm(`Remove ${name} from the organization?`)) return;

    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch('/api/org/remove-member', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid })
        });

        if (res.ok) {
            showToast('Member removed', '✓');
            // Remove from local map
            membersMap.delete(uid);
            renderManageMembers();
            renderTeamGrid();
        } else {
            showToast('Failed to remove member', '⚠️');
        }
    } catch (err) {
        console.error('Error removing member:', err);
        showToast('Error removing member', '⚠️');
    }
}

// Open Team Stats
function openTeamStats() {
    const modal = document.getElementById('team-stats-modal');
    if (modal) {
        // Reset range to 30 days on open
        const rangeSelect = document.getElementById('stats-range-select');
        if (rangeSelect) rangeSelect.value = '30';

        loadTeamStats('30');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

// Close Team Stats
function closeTeamStats() {
    const modal = document.getElementById('team-stats-modal');
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

// Update Team Stats Range
function updateTeamStatsRange(range) {
    console.log('Updating team stats range to:', range);
    loadTeamStats(range);
}

// Load Team Stats
async function loadTeamStats(range = '30') {
    console.log(`Loading team stats (Range: ${range})...`);

    // Update labels immediately for better UX
    const rangeLabel = document.getElementById('stats-date-range-label');
    const moodLabel = document.getElementById('mood-trend-label');

    let rangeText = `Last ${range} days performance`;
    let trendText = `Daily mood tracking over the past ${range === '7' ? 'week' : (range === 'all' ? 'year' : (range + ' days'))}`;

    if (range === 'all') rangeText = 'All-time performance summary';

    if (rangeLabel) rangeLabel.textContent = rangeText;
    if (moodLabel) moodLabel.textContent = trendText;

    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`/api/org/team-stats?range=${range}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Team stats data received:', data);

            // Update stat values
            const totalEntriesEl = document.getElementById('total-entries');
            const avgEntriesEl = document.getElementById('avg-entries-per-day');
            const activeMembersEl = document.getElementById('active-members');
            const streakEl = document.getElementById('team-streak');

            if (totalEntriesEl) totalEntriesEl.textContent = data.totalEntries || 0;
            if (avgEntriesEl) avgEntriesEl.textContent = (data.avgEntriesPerDay || 0).toFixed(1);
            if (activeMembersEl) activeMembersEl.textContent = `${data.activeMembers || 0}/${data.totalMembers || 0}`;
            if (streakEl) streakEl.textContent = data.teamStreak || 0;

            // Render member breakdown
            renderMemberStatsBreakdown(data.memberBreakdown || []);

            // Wait a bit for modal to be fully visible (if first load) before rendering charts
            setTimeout(() => {
                renderTeamMoodChart(data.moodData || {});
                renderTeamDistChart(data.moodDistribution || {});
                renderTeamActivityChart(data.topActivities || []);
                renderTeamStreakPixels(data.memberBreakdown || []);
            }, 50);
        } else {
            showToast('Failed to load statistics', '⚠️');
        }
    } catch (err) {
        console.error('Error loading team stats:', err);
        showToast('Error loading team stats', '⚠️');
    }
}

// Render Member Stats Breakdown
function renderMemberStatsBreakdown(memberStats) {
    const container = document.getElementById('member-stats-list');
    if (!container) return;

    if (!memberStats || memberStats.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 30px;">
                <i class="bi bi-inbox" style="font-size: 1.5rem; display: block; margin-bottom: 8px;"></i>
                No member activity found for this period
            </div>`;
        return;
    }

    container.innerHTML = memberStats.map(member => {
        const initial = (member.name || '?').charAt(0).toUpperCase();
        const entryCount = member.entryCount || 0;

        // Color based on mood label
        let moodColor = '#94a3b8'; // gray
        if (member.avgMood === 'Rad') moodColor = '#10b981'; // emerald
        else if (member.avgMood === 'Good') moodColor = '#3b82f6'; // blue
        else if (member.avgMood === 'Meh') moodColor = '#f59e0b'; // amber
        else if (member.avgMood === 'Bad') moodColor = '#f97316'; // orange
        else if (member.avgMood === 'Awful') moodColor = '#ef4444'; // red

        // Streak dots (last 7 days)
        const streakDots = (member.streak || [null, null, null, null, null, null, null]).map(moodKey => {
            const moodObj = moodKey ? getMoodByKey(moodKey) : null;
            const color = moodObj ? moodObj.color : 'rgba(0,0,0,0.05)';
            return `<div class="streak-dot" style="background: ${color}; width: 8px; height: 8px; border-radius: 2px;" title="${moodObj ? moodObj.label : 'No entry'}"></div>`;
        }).join('');

        return `
            <div class="member-stat-row" style="display: flex; align-items: center; gap: 12px; padding: 14px 4px; border-bottom: 1px solid rgba(0,0,0,0.06);">
                <div class="member-stat-avatar" style="width: 40px; height: 40px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--accent-primary); font-size: 1rem; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.05); overflow: hidden;">
                    ${member.photoURL ? `<img src="${member.photoURL}" style="width: 100%; height: 100%; object-fit: cover;">` : initial}
                </div>
                <div class="member-stat-info" style="flex: 1; min-width: 0;">
                    <div class="member-stat-name" style="font-weight: 700; font-size: 1rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">
                        ${member.name}
                    </div>
                    <div class="member-stat-mood" style="font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                        Avg Mood: <span style="font-weight: 700; padding: 1px 6px; border-radius: 4px; background: ${moodColor}15; color: ${moodColor}; font-size: 0.75rem; text-transform: uppercase;">${member.avgMood}</span>
                    </div>
                </div>
                <div class="member-stat-count" style="text-align: right; min-width: 60px;">
                    <div style="font-weight: 900; font-size: 1.2rem; color: var(--accent-primary); line-height: 1;">${entryCount}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-top: 2px;">Entries</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Team Streak Pixels
function renderTeamStreakPixels(memberStats) {
    const container = document.getElementById('team-streak-pixels');
    if (!container) return;

    if (!memberStats || memberStats.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">No activity data available</div>`;
        return;
    }

    let html = memberStats.map(member => {
        return `
            <div class="streak-live-card">
                <div class="streak-name">${member.name}</div>
                <div class="streak-count">${member.streakCount || 0}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="streak-live-list">${html}</div>`;
}

// Render Team Mood Chart (7 days)
function renderTeamMoodChart(moodData) {
    console.log('Rendering team mood chart with data:', moodData);

    const canvas = document.getElementById('team-overall-mood-chart');
    if (!canvas) {
        console.error('Canvas element not found: team-overall-mood-chart');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if any
    if (window.teamMoodChart) {
        window.teamMoodChart.destroy();
    }

    // Handle empty data
    if (!moodData || Object.keys(moodData).length === 0) {
        console.log('No mood data available');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    const dates = Object.keys(moodData).sort();
    console.log('Dates for chart:', dates);

    const datasets = [
        {
            label: 'Rad',
            data: dates.map(d => moodData[d].rad || 0),
            backgroundColor: 'rgba(168, 230, 161, 0.2)',
            borderColor: '#a8e6a1',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        },
        {
            label: 'Good',
            data: dates.map(d => moodData[d].good || 0),
            backgroundColor: 'rgba(255, 217, 61, 0.2)',
            borderColor: '#ffd93d',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        },
        {
            label: 'Meh',
            data: dates.map(d => moodData[d].meh || 0),
            backgroundColor: 'rgba(255, 180, 162, 0.2)',
            borderColor: '#ffb4a2',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        },
        {
            label: 'Bad',
            data: dates.map(d => moodData[d].bad || 0),
            backgroundColor: 'rgba(255, 107, 157, 0.2)',
            borderColor: '#ff6b9d',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        },
        {
            label: 'Awful',
            data: dates.map(d => moodData[d].awful || 0),
            backgroundColor: 'rgba(149, 165, 166, 0.2)',
            borderColor: '#95a5a6',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        }
    ];

    window.teamMoodChart = new Chart(ctx, {
        type: 'line',
        data: { labels: dates, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: window.innerWidth < 600 ? 'bottom' : 'bottom',
                    labels: {
                        boxWidth: window.innerWidth < 600 ? 10 : 12,
                        padding: window.innerWidth < 600 ? 8 : 12,
                        font: {
                            size: window.innerWidth < 600 ? 10 : 11,
                            family: 'Inter'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    console.log('Team mood chart rendered successfully');
}

// Render Team Mood Distribution
function renderTeamDistChart(moodDistribution) {
    console.log('Rendering team distribution chart with data:', moodDistribution);

    const canvas = document.getElementById('team-overall-dist-chart');
    if (!canvas) {
        console.error('Canvas element not found: team-overall-dist-chart');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (window.teamDistChart) {
        window.teamDistChart.destroy();
    }

    const moods = ['rad', 'good', 'meh', 'bad', 'awful'];
    const colors = ['#a8e6a1', '#ffd93d', '#ffb4a2', '#ff6b9d', '#95a5a6'];
    const data = moods.map(m => moodDistribution[m] || 0);

    // Check if all data is zero
    const hasData = data.some(val => val > 0);

    if (!hasData) {
        console.log('No distribution data available');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    window.teamDistChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: moods.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 8,
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 12,
                        font: {
                            size: 11,
                            family: 'Inter',
                            weight: '500'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    console.log('Team distribution chart rendered successfully');
}

// Render Team Activity Chart
function renderTeamActivityChart(topActivities) {
    console.log('Rendering team activity chart with data:', topActivities);

    const canvas = document.getElementById('team-overall-activity-chart');
    if (!canvas) {
        console.error('Canvas element not found: team-overall-activity-chart');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (window.teamActivityChart) {
        window.teamActivityChart.destroy();
    }

    if (!topActivities || topActivities.length === 0) {
        console.log('No activity data available');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('No activity data yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Create gradient colors for bars
    const gradients = topActivities.map((_, index) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        const colors = [
            ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)'],
            ['rgba(240, 147, 251, 0.8)', 'rgba(245, 87, 108, 0.8)'],
            ['rgba(79, 172, 254, 0.8)', 'rgba(0, 242, 254, 0.8)'],
            ['rgba(250, 208, 196, 0.8)', 'rgba(255, 209, 255, 0.8)'],
            ['rgba(168, 230, 161, 0.8)', 'rgba(255, 217, 61, 0.8)']
        ];
        const colorPair = colors[index % colors.length];
        gradient.addColorStop(0, colorPair[0]);
        gradient.addColorStop(1, colorPair[1]);
        return gradient;
    });

    window.teamActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topActivities.map(a => a.activity),
            datasets: [{
                label: 'Count',
                data: topActivities.map(a => a.count),
                backgroundColor: gradients,
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });

    console.log('Team activity chart rendered successfully');
}
