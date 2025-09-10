/**
 * @file api.js
 * @description MindTrack 應用程式的集中式、可複用 API 用戶端模組。
 * 包含 JWT 攔截器和完整的 CRUD 功能。
 */

const BASE_URL = 'http://127.0.0.1:5000';

/**
 * 一個自訂錯誤類別，用於表示 API 請求失敗。
 * @param {string} message - 錯誤訊息。
 * @param {number} status - HTTP 狀態碼。
 * @param {object} body - 回應的內文。
 */
class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * 處理需要 JWT 認證的 API 請求的攔截器。
 * 自動附加 Authorization 標頭，並集中處理 401 錯誤。
 * @param {string} path - API 端點路徑 (例如 '/habits')。
 * @param {object} options - fetch 請求的設定。
 * @returns {Promise<any>} 成功時返回解析後的 JSON 回應。
 * @throws {ApiError} 當 API 回應不為 ok 時拋出。
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = new Headers(options.headers || {});
  headers.append('Content-Type', 'application/json');

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  } else {
    // 對於需要認證的 API，如果沒有 token，應提前失敗。
    // 這是一個設計決策，可以防止不必要的網路請求。
    console.warn('apiFetch called without a token for path:', path);
  }

  const config = {
    ...options,
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Response is not valid JSON' }));
    // 將 401 錯誤特別拋出，以便全域處理程序可以捕獲它並觸發登出
    throw new ApiError(errorBody.message || `Request failed with status ${response.status}`, response.status, errorBody);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

// --- Auth API (不需要 Token 攔截) ---

/**
 * 使用者登入。此函式不使用 apiFetch，以避免登入失敗觸發 401 全域登出。
 * @param {object} credentials - { email, password }
 * @returns {Promise<{token: string, user: object}>}
 * @throws {ApiError}
 */
export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || 'Login failed', response.status, data);
  }
  return data;
}

/**
 * 註冊新使用者。此函式不使用 apiFetch。
 * @param {object} userData - { username, email, password }
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || 'Registration failed', response.status, data);
  }
  return data;
}

/**
 * 獲取當前登入使用者的個人資料。
 * @returns {Promise<object>}
 */
export async function fetchUserProfile() {
  return apiFetch('/users/me');
}


// --- Habits API (需要 Token) ---

/**
 * 獲取所有習慣。
 * @returns {Promise<Array<object>>}
 */
export async function fetchHabits() {
  return apiFetch('/habits');
}

/**
 * 新增一個習慣。
 * @param {object} habitData - { name: '...' }
 * @returns {Promise<object>}
 */
export async function addHabit(habitData) {
  return apiFetch('/habits', { method: 'POST', body: habitData });
}

/**
 * 更新一個習慣。
 * @param {string|number} habitId
 * @param {object} updateData
 * @returns {Promise<object>}
 */
export async function updateHabit(habitId, updateData) {
  return apiFetch(`/habits/${habitId}`, { method: 'PUT', body: updateData });
}

/**
 * 刪除一個習慣。
 * @param {string|number} habitId
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteHabit(habitId) {
  return apiFetch(`/habits/${habitId}`, { method: 'DELETE' });
}

// --- Moods API (需要 Token) ---

/**
 * 獲取指定日期的心情日誌。
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {Promise<object>}
 */
export async function fetchMoodLogForDate(date) {
  return apiFetch(`/moods?date=${date}`);
}

/**
 * 記錄一筆心情。
 * @param {object} moodData - { rating, notes, log_date }
 * @returns {Promise<object>}
 */
export async function logMood(moodData) {
  return apiFetch('/moods', { method: 'POST', body: moodData });
}