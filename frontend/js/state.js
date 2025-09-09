/**
 * @file state.js
 * @description 應用程式的中央狀態管理模組。
 * 負責維護應用程式的單一真理之源 (state) 並提供狀態更新機制。
 */

// --- 1. 狀態中心 (單一真理之源) ---
export const state = {
  // App data
  habits: [],
  moods: [], // 儲存所有心情日誌
  habitLogs: [], // 儲存所有習慣日誌
  todayMoodLog: null,
  // App status
  isLoading: {
    auth: true, // 認證檢查開始時為 true
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

// 渲染回調函式，當狀態更新時會被呼叫
let renderCallback = () => {};

/**
 * 訂閱渲染函式，當狀態更新時會呼叫此函式來重新渲染 UI。
 * @param {Function} callback - 渲染函式。
 */
export function subscribe(callback) {
  renderCallback = callback;
}

/**
 * 更新應用程式的狀態並觸發重新渲染。
 * @param {object} newState - 包含要更新的狀態屬性的物件。
 */
export function setState(newState) {
  // 合併新狀態到現有狀態
  Object.assign(state, newState);

  // 處理巢狀的 isLoading 物件合併
  if (newState.isLoading) {
    state.isLoading = { ...state.isLoading, ...newState.isLoading };
  }

  // 處理 authToken 的副作用：儲存或移除 localStorage 中的 token
  if (newState.authToken !== undefined) {
    newState.authToken
      ? localStorage.setItem('authToken', newState.authToken)
      : localStorage.removeItem('authToken');
  }

  // 呼叫渲染回調函式以更新 UI
  renderCallback();
}
