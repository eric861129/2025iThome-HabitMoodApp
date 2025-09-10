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
 * @param {string} path - API 端點路徑 (例如 '/api/v1/habits')。
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
    throw new ApiError(errorBody.message || `Request failed with status ${response.status}`, response.status, errorBody);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

// --- Auth API (不需要 Token 攔截) ---

export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
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

export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
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

// --- User API (需要 Token) ---

export async function fetchUserProfile() {
  // 注意：這個端點可能也需要 /api/v1 前綴，取決於它的 Blueprint 如何定義
  return apiFetch('/api/v1/users/me');
}


// --- Habits API (需要 Token) ---

export async function fetchHabits() {
  return apiFetch('/api/v1/habits');
}

export async function addHabit(habitData) {
  return apiFetch('/api/v1/habits', { method: 'POST', body: habitData });
}

export async function updateHabit(habitId, updateData) {
  return apiFetch(`/api/v1/habits/${habitId}`, { method: 'PUT', body: updateData });
}

export async function deleteHabit(habitId) {
  return apiFetch(`/api/v1/habits/${habitId}`, { method: 'DELETE' });
}

// --- Moods API (需要 Token) ---

export async function fetchMoodLogForDate(date) {
  return apiFetch(`/api/v1/moods?date=${date}`);
}

export async function logMood(moodData) {
  return apiFetch('/api/v1/moods', { method: 'POST', body: moodData });
}
