/**
 * @file api.js
 * @description MindTrack 應用程式的集中式、可複用 API 用戶端模組。
 * 為「習慣」實現了完整的 CRUD 功能，並遵循 DRY 原則。
 */

// 後端 API 的基礎 URL。集中管理此 URL 便於在開發、預備和生產環境之間切換。
const BASE_URL = 'http://127.0.0.1:5000';

/**
 * 處理所有 fetch 請求的私有輔助函式。
 * 此函式不會被匯出，作為所有 API 呼叫的單一進入點，集中處理錯誤、標頭設定和回應解析。
 * @param {string} path - API 端點路徑 (例如 '/habits')。
 * @param {object} options - fetch 請求的設定。
 * @param {string} [options.method='GET'] - HTTP 方法。
 * @param {object} [options.body=null] - POST/PUT 請求的負載。
 * @returns {Promise<any|null>} 成功時返回解析後的 JSON 回應，對於 204 回應返回成功標識，失敗時返回 null。
 */
async function apiFetch(path, { method = 'GET', body = null } = {}) {
  const token = localStorage.getItem('authToken');
  const headers = new Headers();

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  if (body) {
    headers.append('Content-Type', 'application/json');
  }

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const errorMessage = errorBody?.message || `網路回應不正常。狀態: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error(`API 請求錯誤 (${method} ${path}):`, error.message);
    return null;
  }
}

// --- Auth API ---

/**
 * 使用者登入
 * @param {object} credentials - 使用者憑證
 * @param {string} credentials.email - 電子郵件
 * @param {string} credentials.password - 密碼
 * @returns {Promise<{token: string}|null>} 成功時返回包含 token 的物件，失敗時返回 null
 */
export async function login(credentials) {
  return apiFetch('/auth/login', { method: 'POST', body: credentials });
}

/**
 * 註冊新使用者
 * @param {object} userData - 使用者資料
 * @param {string} userData.username - 使用者名稱
 * @param {string} userData.email - 電子郵件
 * @param {string} userData.password - 密碼
 * @returns {Promise<Object|null>} 成功時返回使用者物件，失敗時返回 null
 */
export async function register(userData) {
  return apiFetch('/auth/register', { method: 'POST', body: userData });
}

/**
 * 獲取當前登入使用者的個人資料
 * @returns {Promise<Object|null>} 成功時返回使用者物件，失敗時返回 null
 */
export async function fetchUserProfile() {
    return apiFetch('/users/me');
}

// --- Habits API ---

/**
 * 獲取所有習慣的列表。(讀取)
 * @returns {Promise<Array<Object>|null>} 一個解析為習慣物件陣列的 Promise，失敗時為 null。
 */
export async function fetchHabits() {
  return apiFetch('/habits');
}

/**
 * 獲取所有習慣日誌的列表。
 * @returns {Promise<Array<Object>|null>} 一個解析為習慣日誌物件陣列的 Promise，失敗時為 null。
 */
export async function fetchHabitLogs() {
  return apiFetch('/habit_logs');
}

/**
 * 在後端新增一個新習慣。(建立)
 * @param {object} habitData - 新習慣的數據 (例如 { name: '讀一本書' })。
 * @returns {Promise<Object|null>} 一個解析為新建立的習慣物件的 Promise，失敗時為 null。
 */
export async function addHabit(habitData) {
  return apiFetch('/habits', { method: 'POST', body: habitData });
}

/**
 * 更新一個現有的習慣。(更新)
 * @param {string|number} habitId - 要更新的習慣 ID。
 * @param {object} updateData - 一個包含要更新欄位的物件。
 * @returns {Promise<Object|null>} 一個解析為更新後的習慣物件的 Promise，失敗時為 null。
 */
export async function updateHabit(habitId, updateData) {
  return apiFetch(`/habits/${habitId}`, { method: 'PUT', body: updateData });
}

/**
 * 從後端刪除一個習慣。(刪除)
 * @param {string|number} habitId - 要刪除的習慣 ID。
 * @returns {Promise<boolean>} 一個在成功刪除時解析為 true 的 Promise，失敗時為 false。
 */
export async function deleteHabit(habitId) {
  const result = await apiFetch(`/habits/${habitId}`, { method: 'DELETE' });
  return !!result;
}

// --- Moods API ---

/**
 * 獲取指定日期的心情日誌。
 * @param {string} date - 日期字串，格式為 'YYYY-MM-DD'。
 * @returns {Promise<Object|null>} 一個解析為心情日誌物件的 Promise，如果當天沒有紀錄則可能為 null。
 */
export async function fetchMoodLogForDate(date) {
    return apiFetch(`/moods?date=${date}`);
}

/**
 * 建立或更新一筆心情日誌。
 * @param {object} moodData - 心情數據
 * @param {number} moodData.rating - 心情評分 (1-5)
 * @param {string} moodData.notes - 心情備註
 * @param {string} moodData.log_date - 日期字串，格式為 'YYYY-MM-DD'
 * @returns {Promise<Object|null>} 一個解析為已儲存的心情日誌物件的 Promise，失敗時為 null。
 */
export async function logMood(moodData) {
    return apiFetch('/moods', { method: 'POST', body: moodData });
}
