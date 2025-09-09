/**
 * @file handlers.js
 * @description 應用程式的事件處理和業務邏輯模組。
 * 負責處理使用者互動，並協調狀態更新和 API 呼叫。
 */

import { state, setState } from './state.js';
import {
  // Auth
  login as apiLogin,
  register as apiRegister,
  fetchUserProfile,
  // Habits
  fetchHabits,
  fetchHabitLogs,
  addHabit,
  deleteHabit,
  updateHabit,
  // Moods
  fetchMoodLogForDate,
  logMood,
} from '../api.js';

// --- 輔助函式 ---
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

// --- 應用程式邏輯 ---

/**
 * 載入主應用程式數據 (習慣、心情日誌等)。
 */
export async function loadMainAppData() {
  setState({ isLoading: { main: true }, error: null });
  try {
    const [habits, moods, habitLogs] = await Promise.all([
      fetchHabits(),
      fetchMoods(), // 獲取所有心情日誌
      fetchHabitLogs(), // 獲取所有習慣日誌
    ]);
    if (habits === null || moods === null || habitLogs === null) throw new Error("讀取您的資料時發生錯誤。");

    setState({ habits, moods, habitLogs, isLoading: { main: false } });
  } catch (error) {
    setState({ error: { message: error.message }, isLoading: { main: false } });
  }
}

/**
 * 應用程式初始化流程，檢查認證狀態並載入數據。
 */
export async function initializeApp() {
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

// --- 事件處理器 ---

/**
 * 處理主應用程式區域的點擊事件 (事件委派)。
 * @param {Event} event - 點擊事件物件。
 */
export async function handleMainAppClick(event) {
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

/**
 * 處理認證區域的點擊事件 (事件委派)。
 * @param {Event} event - 點擊事件物件。
 */
export async function handleAuthClick(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === 'show-register') {
        setState({ authView: 'register', error: null });
    }
    if (action === 'show-login') {
        setState({ authView: 'login', error: null });
    }
}

/**
 * 處理登入表單提交。
 * @param {Event} event - 提交事件物件。
 */
export async function handleLoginSubmit(event) {
    event.preventDefault();
    const appRoot = document.getElementById('app-root'); // 重新獲取 appRoot
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

/**
 * 處理註冊表單提交。
 * @param {Event} event - 提交事件物件。
 */
export async function handleRegisterSubmit(event) {
    event.preventDefault();
    const appRoot = document.getElementById('app-root'); // 重新獲取 appRoot
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

// --- Modal 控制相關的函式 (不直接依賴 state) ---
// 這些函式需要從 DOM 中獲取元素，因此它們會被放在這裡，並在 main.js 中被呼叫
export const openModal = () => {
    const addHabitModal = document.getElementById("add-habit-modal");
    addHabitModal.classList.add("show");
};
export const closeModal = () => {
    const addHabitModal = document.getElementById("add-habit-modal");
    const habitNameInput = document.getElementById("habit-name-input");
    addHabitModal.classList.remove("show");
    habitNameInput.value = ""; // Clear input on close
};

/**
 * 處理新增習慣表單的提交 (Pessimistic Update)
 * @param {Event} event
 */
export async function handleAddHabitSubmit(event) {
  event.preventDefault();
  const habitNameInput = document.getElementById("habit-name-input");
  const habitName = habitNameInput.value.trim();
  if (!habitName) return;

  closeModal();
  setState({ isLoading: { main: true } });

  const newHabit = await addHabit({ name: habitName });
  if (newHabit) {
    await loadMainAppData();
  } else {
    setState({ error: { message: "新增習慣失敗，請稍後再試。" }, isLoading: { main: false } });
  }
}

/**
 * 處理儲存心情的點擊事件。
 */
export async function handleSaveMood() {
    const moodTrackerContainer = document.querySelector(".mood-tracker-container");
    const moodNotesInput = moodTrackerContainer.querySelector(".mood-notes-input");
    const moodSelector = moodTrackerContainer.querySelector(".mood-selector");

    const rating = state.todayMoodLog?.rating;
    if (!rating) {
        alert("請先選擇一個心情評分！");
        return;
    }

    setState({ isLoading: { mood: true } });

    const moodData = {
        rating: rating,
        notes: moodNotesInput.value || '',
        log_date: getTodayDateString(),
    };

    const savedLog = await logMood(moodData);

    if (savedLog) {
        setState({ todayMoodLog: savedLog, isLoading: { mood: false } });
    } else {
        alert("儲存心情失敗！");
        setState({ isLoading: { mood: false } });
    }
}

/**
 * 處理心情選擇器點擊事件。
 * @param {Event} e
 */
export function handleMoodSelectorClick(e) {
    const rating = e.target.closest('.mood-option')?.dataset.rating;
    if(rating) {
        setState({ todayMoodLog: { ...state.todayMoodLog, rating: Number(rating) } });
    }
}

/**
 * 處理心情備註輸入事件。
 * @param {Event} e
 */
export function handleMoodNotesInput(e) {
    // 直接更新 state.todayMoodLog.notes，因為 renderMoodTracker 會從 state 讀取
    state.todayMoodLog = { ...state.todayMoodLog, notes: e.target.value };
}
