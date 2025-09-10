import * as api from '../api.js';

// --- DOM Element Selectors ---
const $ = (selector) => document.querySelector(selector);
const authPageContainer = $('#auth-page-container');
const appPageContainer = $('#app-page-container');
const loginForm = $('#login-form');
const registerForm = $('#register-form');
const loginSubmitBtn = $('#login-submit-btn');
const registerSubmitBtn = $('#register-submit-btn');
const logoutBtn = $('#logout-btn');
const loginError = $('#login-error');
const registerError = $('#register-error');
const toggleToRegister = $('#toggle-to-register');
const toggleToLogin = $('#toggle-to-login');
const userProfileDisplay = $('#user-profile-display');
const habitListContainer = $('.habit-list-container');

// --- Token Management ---
const getTokenFromStorage = () => localStorage.getItem('authToken');
const saveToken = (token) => localStorage.setItem('authToken', token);
const clearToken = () => localStorage.removeItem('authToken');

// --- State Management Center ---
let state = {
    authStatus: 'idle', // idle | loading | authenticated | unauthenticated | error
    user: null,
    authToken: getTokenFromStorage(),
    error: null,
    habits: [],
};

function setState(newState) {
    state = { ...state, ...newState };
    console.log('State changed:', state);
    render();
}

// --- Router ---
const router = {
    showAuthPage() {
        authPageContainer.style.display = 'block';
        appPageContainer.style.display = 'none';
    },
    showAppPage() {
        appPageContainer.style.display = 'block';
        authPageContainer.style.display = 'none';
    },
};

// --- Render Engine ---
function render() {
    // Update button disabled state based on authStatus
    const isLoading = state.authStatus === 'loading';
    loginSubmitBtn.disabled = isLoading;
    registerSubmitBtn.disabled = isLoading;
    logoutBtn.disabled = isLoading;

    // Show/hide error messages
    loginError.textContent = state.error && loginForm.style.display !== 'none' ? state.error : '';
    registerError.textContent = state.error && registerForm.style.display !== 'none' ? state.error : '';

    // Update UI based on authentication status
    if (state.authStatus === 'authenticated') {
        userProfileDisplay.textContent = `歡迎，${state.user?.username || state.user?.email}`;
        renderHabits();
    } else {
        userProfileDisplay.textContent = '';
        habitListContainer.innerHTML = '<p>請先登入以查看您的習慣。</p>';
    }
}

function renderHabits() {
    if (state.habits.length === 0) {
        habitListContainer.innerHTML = '<p>尚未建立任何習慣，立即新增一個吧！</p>';
        return;
    }
    habitListContainer.innerHTML = state.habits.map(h => `<div>${h.name}</div>`).join('');
}

// --- Authentication Actions ---
async function handleLogin(event) {
    event.preventDefault();
    setState({ authStatus: 'loading', error: null });
    try {
        const formData = new FormData(loginForm);
        const credentials = Object.fromEntries(formData.entries());
        const data = await api.loginUser(credentials);
        saveToken(data.token);
        setState({ authStatus: 'authenticated', user: data.user, authToken: data.token });
        initializeApp(); // Re-initialize to fetch user data
    } catch (err) {
        setState({ authStatus: 'error', error: err.message });
    }
}

async function handleRegister(event) {
    event.preventDefault();
    setState({ authStatus: 'loading', error: null });
    try {
        const formData = new FormData(registerForm);
        const userData = Object.fromEntries(formData.entries());
        await api.registerUser(userData);
        // Automatically log in the user after successful registration
        await handleLogin(new Event('submit')); 
    } catch (err) {
        setState({ authStatus: 'error', error: err.message });
    }
}

function handleLogout() {
    clearToken();
    setState({ authStatus: 'unauthenticated', user: null, authToken: null, habits: [] });
    router.showAuthPage();
}

function handleToggleForms(e) {
    e.preventDefault();
    const showRegister = registerForm.style.display === 'none';
    registerForm.style.display = showRegister ? 'block' : 'none';
    toggleToLogin.style.display = showRegister ? 'block' : 'none';
    loginForm.style.display = showRegister ? 'none' : 'block';
    toggleToRegister.style.display = showRegister ? 'none' : 'block';
    setState({ error: null }); // Clear errors when toggling
}

// --- Application Initializer ---
async function initializeApp() {
    if (state.authToken) {
        setState({ authStatus: 'loading' });
        try {
            // Verify token by fetching user profile
            const user = await api.fetchUserProfile();
            const habits = await api.fetchHabits();
            setState({ authStatus: 'authenticated', user, habits });
            router.showAppPage();
        } catch (error) {
            if (error.status === 401) {
                console.log('Session expired or token is invalid.');
                handleLogout(); // Token is invalid, perform a full logout
            } else {
                setState({ authStatus: 'error', error: '應用程式初始化失敗。' });
                handleLogout(); // Fallback to logout
            }
        }
    } else {
        setState({ authStatus: 'unauthenticated' });
        router.showAuthPage();
    }
    render(); // Perform initial render
}

// --- Event Listeners ---
function bindEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    toggleToRegister.addEventListener('click', handleToggleForms);
    toggleToLogin.addEventListener('click', handleToggleForms);
}

document.addEventListener('DOMContentLoaded', () => {
    bindEventListeners();
    initializeApp();
});