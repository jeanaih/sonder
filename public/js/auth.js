// ─── Auth Module ────────────────────────────────────────────────

// DOM elements
const googleLoginBtn = document.getElementById('google-login-btn');
const facebookLoginBtn = document.getElementById('facebook-login-btn');
const authError = document.getElementById('auth-error');

// Show error message
function showError(el, msg) {
    if (el) {
        el.textContent = msg;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 5000);
    }
}

// ─── Social Login Function ──────────────────────────────────────
async function loginWithProvider(provider) {
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Check if user doc exists, create if not
        try {
            const userDoc = await firestore.collection('users').doc(user.uid).get({ source: 'server' });
            if (!userDoc.exists) {
                await firestore.collection('users').doc(user.uid).set({
                    email: user.email || '',
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    orgId: '',
                    role: '',
                    isOnline: false,
                    currentMood: '',
                    currentActivity: '',
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                // Update photoURL on every login in case it changed
                await firestore.collection('users').doc(user.uid).update({
                    photoURL: user.photoURL || '',
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
        } catch (fsErr) {
            console.warn('Firestore write skipped:', fsErr.message);
        }
        // Auth state listener handles redirect
    } catch (err) {
        console.error('Login error:', err);
        showError(authError, getErrorMessage(err.code));
    }
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        loginWithProvider(provider);
    });
}

if (facebookLoginBtn) {
    facebookLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.FacebookAuthProvider();
        loginWithProvider(provider);
    });
}

let isCheckingAuth = false;
auth.onAuthStateChanged(async (user) => {
    if (isCheckingAuth) return;

    if (user) {
        isCheckingAuth = true;
        try {
            const token = await user.getIdToken();
            // Cache-busting to prevent stale status
            const res = await fetch(`/api/user/verify-org?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // If backend is down or returns 4xx/5xx, don't start redirect loops.
            if (!res.ok) {
                console.warn('verify-org failed on auth page with status', res.status);
                // If token is invalid/expired, send back to login.
                if (res.status === 401) {
                    await auth.signOut();
                    window.location.href = '/';
                    return;
                }
                // Otherwise just show org setup on index and stop here.
                const isIndexPage = window.location.pathname === '/' ||
                    window.location.pathname.endsWith('/') ||
                    window.location.pathname.includes('index.html');
                if (isIndexPage) {
                    showSection('org-setup');
                }
                return;
            }

            const data = await res.json();

            const isIndexPage = window.location.pathname === '/' ||
                window.location.pathname.endsWith('/') ||
                window.location.pathname.includes('index.html');
            const isDashboardPage = window.location.pathname.includes('dashboard.html');

            console.log(`🔑 [AUTH] uid: ${user.uid} | hasUser: ${data.hasUsername} | orgId: ${data.orgId} | page: ${window.location.pathname}`);

            // Use cached username as a soft fallback to avoid loops while Firestore catches up
            const cachedUsername = localStorage.getItem('psyc_username');
            const effectiveHasUsername = data && (data.hasUsername || !!cachedUsername);

            // 1. Mandatory First: Username Check
            if (data && !effectiveHasUsername) {
                if (!isIndexPage) {
                    console.log("🚫 Username missing. Redirecting to setup...");
                    window.location.href = '/';
                    return;
                }
                showSection('username-setup');
                setupUsernameForm(token, data.orgId); // Pass orgId for direct redirect later
                return;
            }

            // 2. Organization Check
            if (data && data.orgId) {
                localStorage.setItem('psyc_orgId', data.orgId);
                if (isIndexPage) {
                    console.log("🚀 Everything ready. Going to dashboard...");
                    window.location.href = '/dashboard.html';
                }
                return;
            }

            // 3. Fallback: Org Setup
            if (isIndexPage) {
                showSection('org-setup');
            }
        } catch (err) {
            console.error('❌ Auth Verification Error:', err);
            if (window.location.pathname.includes('index.html')) {
                showSection('org-setup');
            }
        } finally {
            isCheckingAuth = false;
        }

    } else {
        localStorage.removeItem('psyc_orgId');
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            window.location.href = '/';
        } else {
            showSection('auth-section');
        }
    }
});


function showSection(id) {
    const sections = ['auth-section', 'username-setup', 'org-setup'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) {
            if (s === id) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    });
}

function setupUsernameForm(token, existingOrgId = null) {
    const form = document.getElementById('username-form');
    const input = document.getElementById('username-input');
    const errorEl = document.getElementById('username-error');
    const btn = document.getElementById('save-username-btn');

    if (!form) return;

    // Remove any previous listener by cloning (defensive)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    const newInput = newForm.querySelector('#username-input');
    const newBtn = newForm.querySelector('#save-username-btn');
    const newErrorEl = newForm.querySelector('#username-error');

    newForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = newInput.value.trim().toLowerCase();

        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            showError(newErrorEl, 'Invalid format. Use 3-20 letters, numbers, or underscores.');
            return;
        }

        newBtn.disabled = true;
        newBtn.textContent = 'Saving...';

        try {
            const res = await fetch('/api/user/set-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username })
            });

            const result = await res.json();
            if (res.ok) {
                console.log("✅ Username saved successfully. Redirecting...");
                // Persist username locally so dashboard can show it immediately
                localStorage.setItem('psyc_username', username);
                // Clear any cached state by adding a param
                if (existingOrgId) {
                    localStorage.setItem('psyc_orgId', existingOrgId);
                    window.location.href = '/dashboard.html?v=' + Date.now();
                } else {
                    window.location.href = '/?username=success&v=' + Date.now();
                }
            } else {
                showError(newErrorEl, result.error || 'Failed to set username');
            }
        } catch (err) {
            console.error("❌ Set Username Error:", err);
            showError(newErrorEl, 'Server error. Please try again.');
        } finally {
            newBtn.disabled = false;
            newBtn.textContent = 'Continue';
        }
    };
}


// ─── Logout ─────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('psyc_orgId');
    localStorage.removeItem('psyc_username');
    localStorage.removeItem('psyc_orgName');
    auth.signOut().then(() => {
        window.location.href = '/';
    });
}

// ─── Error Messages ─────────────────────────────────────────────
function getErrorMessage(code) {
    const map = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    return map[code] || 'An unexpected error occurred. Please try again.';
}

// ─── Back to Login (Logout) ─────────────────────────────────────
const backToLoginCreate = document.getElementById('back-to-login-create');
const backToLoginJoin = document.getElementById('back-to-login-join');

const goBackToLogin = () => {
    // Treat "back" as logging them out entirely from the pending Google Account to re-attempt
    logout();
};

if (backToLoginCreate) backToLoginCreate.addEventListener('click', goBackToLogin);
if (backToLoginJoin) backToLoginJoin.addEventListener('click', goBackToLogin);
