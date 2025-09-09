import {
  // Auth
  login as apiLogin,
  register as apiRegister,
  fetchUserProfile,
  // Habits
  fetchHabits,
  addHabit,
  deleteHabit,
  updateHabit,
  // Moods
  fetchMoodLogForDate,
  logMood,
} from "./api.js";

// --- 1. 狀態中心 (單一真理之源) ---
const state = {
  // App data
  habits: [],
  todayMoodLog: null,
  // App status
  isLoading: {
    auth: true, // Start with auth check
    main: false,
    mood: false,
  },
  error: null,
  // Session & UI data
  isAuthenticated: false,
  user: null,
  currentView: 'loading', // loading, auth, main
  authView: 'login', // login, register
};

// --- 2. 元素選擇器 (動態) ---
const appRoot = document.getElementById('app-root');
const mainAppTemplate = document.getElementById('main-app-template');
const authTemplate = document.getElementById('auth-template');

// --- 3. 渲染引擎 ---

function renderHabitList(container) {
  if (!container) return;
  const { habits, isLoading, error } = state;

  if (isLoading.main && habits.length === 0) {
    container.innerHTML = `<div class="loading-spinner"></div>`;
    return;
  }
  if (error) {
    container.innerHTML = `
      <div class="error-message">
        <p>${error.message}</p>
        <button class="retry-button" data-action="retry-main-data">重試</button>
      </div>`;
    return;
  }
  if (habits.length === 0) {
    container.innerHTML = "<p>您尚未新增任何習慣。點擊「新增習慣」開始吧！</p>";
    return;
  }

  container.innerHTML = habits
    .map((habit) => {
      const isCompleted = habit.completed_today || false;
      return `
        <div class="habit-item ${isCompleted ? "completed" : ""}" data-habit-id="${habit.id}">
          <div class="habit-interaction-area" data-action="toggle-habit" role="button" tabindex="0">
              <div class="habit-checkbox"></div>
              <span class="habit-name">${habit.name}</span>
          </div>
          <div class="habit-actions">
              <button class="action-btn" data-action="delete-habit" aria-label="刪除習慣">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMoodTracker(container) {
    if (!container) return;
    const rating = state.todayMoodLog?.rating || 0;
    const moodSelector = container.querySelector(".mood-selector");
    const moodNotesInput = container.querySelector(".mood-notes-input");
    const saveMoodBtn = container.querySelector(".save-mood-btn");

    moodSelector.querySelectorAll(".mood-option").forEach(btn => {
        btn.classList.toggle("active", Number(btn.dataset.rating) === rating);
    });
    moodNotesInput.value = state.todayMoodLog?.notes || '';
    saveMoodBtn.disabled = state.isLoading.mood;
    saveMoodBtn.textContent = state.isLoading.mood ? '儲存中...' : '儲存心情';
}

function renderAuthView(container) {
    const isLoading = state.isLoading.auth;
    if (state.authView === 'login') {
        container.innerHTML = `
            <div class="auth-card">
                <div class="logo-container"><h2>MindTrack</h2></div>
                <div id="auth-content">
                    <form id="login-form">
                        <h3>登入</h3>
                        <div class="form-group">
                            <label for="login-email">電子郵件</label>
                            <input type="email" id="login-email" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="login-password">密碼</label>
                            <input type="password" id="login-password" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="auth-error" id="auth-error"></div>
                        <button type="submit" class="btn btn-primary" id="login-btn" ${isLoading ? 'disabled' : ''}>${isLoading ? '登入中...' : '登入'}</button>
                    </form>
                </div>
                <div class="auth-form-footer">
                    <p>還沒有帳號？ <a href="#" data-action="show-register">點此註冊</a></p>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="auth-card">
                <div class="logo-container"><h2>MindTrack</h2></div>
                <div id="auth-content">
                    <form id="register-form">
                        <h3>建立新帳號</h3>
                        <div class="form-group">
                            <label for="register-username">使用者名稱</label>
                            <input type="text" id="register-username" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="register-email">電子郵件</label>
                            <input type="email" id="register-email" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="register-password">密碼</label>
                            <input type="password" id="register-password" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="auth-error" id="auth-error"></div>
                        <button type="submit" class="btn btn-primary" id="register-btn" ${isLoading ? 'disabled' : ''}>${isLoading ? '註冊中...' : '註冊'}</button>
                    </form>
                </div>
                <div class="auth-form-footer">
                    <p>已經有帳號了？ <a href="#" data-action="show-login">點此登入</a></p>
                </div>
            </div>
        `;
    }
}

function render() {
  appRoot.innerHTML = '';
  const anyLoading = Object.values(state.isLoading).some(Boolean);

  switch (state.currentView) {
    case 'loading':
      appRoot.innerHTML = '<div class="loading-spinner"></div>';
      break;
    case 'auth':
      const authNode = authTemplate.content.cloneNode(true);
      renderAuthView(authNode.querySelector('.auth-layout'));
      appRoot.appendChild(authNode);
      break;
    case 'main':
      const mainNode = mainAppTemplate.content.cloneNode(true);
      mainNode.querySelector('#add-habit-btn').disabled = anyLoading;
      renderHabitList(mainNode.querySelector('.habit-list-container'));
      renderMoodTracker(mainNode.querySelector('.mood-tracker-container'));
      appRoot.appendChild(mainNode);
      break;
  }
}

// --- 4. 狀態更新器 ---
function setState(newState) {
  Object.assign(state, newState);
  if (newState.isLoading) {
    state.isLoading = { ...state.isLoading, ...newState.isLoading };
  }
  if (newState.authToken !== undefined) {
    newState.authToken
      ? localStorage.setItem('authToken', newState.authToken)
      : localStorage.removeItem('authToken');
  }
  render();
}

// --- 5. 應用程式邏輯 ---

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

async function loadMainAppData() {
  setState({ isLoading: { main: true }, error: null });
  try {
    const [habits, moodLog] = await Promise.all([
      fetchHabits(),
      fetchMoodLogForDate(getTodayDateString()),
    ]);
    if (habits === null) throw new Error("讀取習慣資料時發生錯誤。");

    setState({ habits, todayMoodLog: moodLog, isLoading: { main: false } });
  } catch (error) {
    setState({ error: { message: error.message }, isLoading: { main: false } });
  }
}

async function initializeApp() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    setState({ currentView: 'auth', isLoading: { auth: false } });
    return;
  }

  setState({ isLoading: { auth: true } });
  const userProfile = await fetchUserProfile();

  if (userProfile) {
    setState({ isAuthenticated: true, user: userProfile, currentView: 'main', isLoading: { auth: false } });
    await loadMainAppData();
  } else {
    setState({ authToken: null, isAuthenticated: false, user: null, currentView: 'auth', isLoading: { auth: false } });
  }
}

// --- 6. 事件處理 (集中委派) ---

async function handleMainAppClick(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    switch (action) {
        case "retry-main-data":
            loadMainAppData();
            break;
        case "logout":
            setState({ authToken: null, isAuthenticated: false, user: null, habits: [], currentView: 'auth' });
            break;
        case "delete-habit": {
            const habitId = Number(event.target.closest(".habit-item")?.dataset.habitId);
            if (!habitId || !confirm("確定要刪除這個習慣嗎？")) return;
            setState({ isLoading: { main: true } });
            const success = await deleteHabit(habitId);
            if (success) {
                await loadMainAppData();
            } else {
                setState({ error: { message: "刪除習慣失敗。" }, isLoading: { main: false } });
            }
            break;
        }
        case "toggle-habit": {
            const habitId = Number(event.target.closest(".habit-item")?.dataset.habitId);
            if (!habitId) return;
            const originalHabits = JSON.parse(JSON.stringify(state.habits));
            const updatedHabits = state.habits.map((h) =>
                h.id === habitId ? { ...h, completed_today: !h.completed_today } : h
            );
            setState({ habits: updatedHabits });
            const habitToUpdate = updatedHabits.find((h) => h.id === habitId);
            const success = await updateHabit(habitId, { completed_today: habitToUpdate.completed_today });
            if (!success) {
                alert("同步完成狀態失敗，正在還原。");
                setState({ habits: originalHabits });
            }
            break;
        }
    }
}

async function handleAuthClick(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === 'show-register') {
        setState({ authView: 'register', error: null });
    }
    if (action === 'show-login') {
        setState({ authView: 'login', error: null });
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = appRoot.querySelector('#login-email').value;
    const password = appRoot.querySelector('#login-password').value;
    const errorDiv = appRoot.querySelector('#auth-error');
    
    setState({ isLoading: { auth: true } });
    errorDiv.textContent = '';

    const result = await apiLogin({ email, password });

    if (result && result.token) {
        setState({ authToken: result.token });
        await initializeApp();
    } else {
        errorDiv.textContent = '登入失敗，請檢查您的帳號或密碼。';
        setState({ isLoading: { auth: false } });
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const username = appRoot.querySelector('#register-username').value;
    const email = appRoot.querySelector('#register-email').value;
    const password = appRoot.querySelector('#register-password').value;
    const errorDiv = appRoot.querySelector('#auth-error');

    setState({ isLoading: { auth: true } });
    errorDiv.textContent = '';

    const result = await apiRegister({ username, email, password });

    if (result && result.id) {
        alert('註冊成功！請使用您的新帳號登入。');
        setState({ authView: 'login', isLoading: { auth: false } });
    } else {
        errorDiv.textContent = '註冊失敗，請檢查您輸入的資訊。';
        setState({ isLoading: { auth: false } });
    }
}

// --- 7. 初始化 ---
document.addEventListener("DOMContentLoaded", () => {
  appRoot.addEventListener('click', event => {
    if (state.currentView === 'main') handleMainAppClick(event);
    if (state.currentView === 'auth') handleAuthClick(event);
  });

  appRoot.addEventListener('submit', event => {
    if (event.target.id === 'login-form') handleLoginSubmit(event);
    if (event.target.id === 'register-form') handleRegisterSubmit(event);
  });

  initializeApp();
});